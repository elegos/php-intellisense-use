const {
  parentPort, workerData
} = require('worker_threads');
import * as php from '../php';
import { sep } from 'path';
import FileParserWorkerData from './FileParserWorkerData';
import FileParserWorkerResult, {
  NewFileParserWorkerResult,
  ClassDefinition
} from './FileParserWorkerResult';

function work(autoloaderPath: string, paths: string[]): ClassDefinition[] {
  const requires = [...paths];
  if (autoloaderPath && paths.indexOf(autoloaderPath) === -1) {
    requires.unshift(autoloaderPath);
  }

  const script = `'require("${__dirname}${sep}explorer.php"); echo explore(${requires.map(req => `"${req}"`).join(',')});'`;

  try {
    const result = php.run('-r', script);

    return JSON.parse(result);
  } catch (err) {
    let minArgsSize = 2;
    if (autoloaderPath) {
      minArgsSize += 1;
    }

    if (paths.length < minArgsSize) {
      return [];
    }

    const half = Math.ceil(paths.length / 2);
    return [
      ...work(autoloaderPath, paths.slice(0, half)),
      ...work(autoloaderPath, paths.slice(-half)),
    ];
  }
}

const { autoloaderPath, filePaths } = (workerData as FileParserWorkerData);
const results: FileParserWorkerResult = NewFileParserWorkerResult();

try {
  results.classes.push(...work(autoloaderPath, filePaths));
} catch (err) { parentPort.postMessage(err); }

parentPort.postMessage(results);
