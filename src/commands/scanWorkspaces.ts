import { sep } from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as vscode from 'vscode';
import walkSync from 'walk-sync';

import FileParserWorkerResult, { NewFileParserWorkerResult } from '../worker/FileParserWorkerResult';
import { Worker } from 'worker_threads';
import FileParserWorkerData from '../worker/FileParserWorkerData';

export default async (workspaces: readonly vscode.WorkspaceFolder[]): Promise<FileParserWorkerResult> => {
  return new Promise<FileParserWorkerResult>(async (resolve) => {
    const cache = NewFileParserWorkerResult();

    const numCpu = os.cpus().length;
    const phpFiles: { [key: string]: string[][]} = {};
    const workspacePaths: { [key: string]: string } = {};

    // Load the PHP files into phpFiles, divided by the number of available CPU cores
    for (const workspace of vscode.workspace.workspaceFolders ?? []) {
      workspacePaths[workspace.name] = workspace.uri.fsPath;
      phpFiles[workspace.name] = [];
      for (let i = 0; i < numCpu; i += 1) {
        phpFiles[workspace.name][i] = [];
      }

      let phpFilePaths = walkSync(workspace.uri.fsPath, {globs: ['**/*.php']});
      let i = 0;
      for (const file of phpFilePaths) {
        phpFiles[workspace.name][i].push(file);
        i += 1;
        if (i % numCpu === 0) {
          i = 0;
        }
      }
    }

    // Extract the classes and interfaces for each file found in each workspace
    for (const workspaceName in phpFiles) {
      let autoloaderPath = `${workspacePaths[workspaceName]}${sep}vendor${sep}autoload.php`;
      if (!fs.existsSync(autoloaderPath)) {
        autoloaderPath = '';
      }
      const workspacePhpFileChunks = phpFiles[workspaceName];
      const promises: Promise<FileParserWorkerResult>[] = [];
      for (const chunk of workspacePhpFileChunks) {
        promises.push(new Promise<FileParserWorkerResult>((pResolve, pReject) => {
          const worker = new Worker(
            `${__dirname}${sep}..${sep}worker${sep}phpFileParser.js`,
            {
              workerData: {
                autoloaderPath,
                filePaths: chunk.map(fp => `${workspacePaths[workspaceName]}${sep}${fp}`),
              } as FileParserWorkerData,
            },
          );
          worker.on('message', pResolve);
          worker.on('error', pReject);
          worker.on('exit', (code: number) => {
            if (code !== 0) {
              pReject(new Error(`Worker stopped with exit code ${code}`));
            }
          });
        }));
      }
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Creating PHP definitions cache.',
      }, async (progress) => {
        (await Promise.all(promises)).forEach(workerResult => {
          cache.classes.push(...workerResult.classes);
        });
        // Remove (standard) duplicated classes
        const declared: string[] = [];
        cache.classes = cache.classes
          .filter((value) => {
            if (declared.indexOf(value.fqcn) > -1) {
              return false;
            }
            declared.push(value.fqcn);

            return true;
          });

        progress.report({ increment: 100 });
        resolve(cache);
      });
    }
  });
};
