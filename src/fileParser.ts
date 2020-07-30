import { WorkspaceFolder } from 'vscode';
import * as lineReader from 'line-reader';
import * as path from 'path';

export const wsPathPrepender = (workspace: WorkspaceFolder, filePath: string) => workspace.uri.fsPath + path.sep + filePath;

const eachLine = function(
	filename: string | NodeJS.ReadableStream,
	iteratee: (line: string, last?: boolean, cb?: Function) => void,
) {
  return new Promise(function(resolve, reject) {
		// @ts-ignore (bad types)
    lineReader.eachLine(filename, iteratee, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const namespaceExpr = /^namespace ([^;]+);/;
const classExpr = /^(abstract)? ?(class|interface) ([^\s{]+)\s?{?$/;
export const parse = async (filePath: string): Promise<{
  namespaceMap: { namespace: string, path: string }
  class?: { className: string, type: string, abstract: boolean }
}> => {
  const namespaceMap = {
    namespace: '',
    path: '',
  };
  let cls = undefined;

  let foundNamespace = false;
  let foundClassName = false;
  await eachLine(filePath, (line) => {
    const nsExprResult = line.match(namespaceExpr);
    const clsExprResult = line.match(classExpr);

    if (nsExprResult) {
      namespaceMap.path = path.dirname(filePath);
      namespaceMap.namespace = nsExprResult[1];
      foundNamespace = true;
    }

    if (clsExprResult) {
      cls = {
        className: clsExprResult[3],
        type: clsExprResult[2],
        abstract: !!clsExprResult[1]
      };
    }

    if (foundNamespace && foundClassName) {
      return false;
    }
  });

  return {
    namespaceMap,
    class: cls,
  };
};

export default {};