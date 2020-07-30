import { existsSync, accessSync, constants } from 'fs';
import { sep } from 'path';
import { execSync } from 'child_process';

let executable: string|undefined = undefined;

const phpExecPath = () => {
  if (executable) {
    return executable;
  }

  const isWin = process.platform === "win32";
  const execName = isWin ? 'php.exe' : 'php';
  const separator = isWin ? ';' : ':';
  const paths = (process.env.PATH || '').split(separator);

  for (const path of paths) {
    const candidate = `${path}${sep}${execName}`;
    try {
      if (existsSync(candidate)) {
        // This will throw an exception if it's not executable
        accessSync(candidate, constants.X_OK);
        executable = candidate;

        return executable;
      }
    } catch (_) {}
  }

  throw new Error("Can't find php executable in PATH");
};

export const run = (...args: string[]): string => {
  const php = phpExecPath();

  const response = execSync(`${php} ${args.join(' ')}`);

  return response.toString();
};

export default {};