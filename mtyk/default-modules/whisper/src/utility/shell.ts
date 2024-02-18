import { exec as _exec, which as _which} from 'shelljs';

export interface ShellOptions {
  silent: boolean, // true: won't print to console
  async: boolean // Is this overridden by passing in a callback?
}

export const which = _which;

export const execute = (command: string, options: ShellOptions): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      _exec(
        command,
        options,
        (code: number, stdout: string, stderr: string) => {
          if (code === 0) {
            resolve(stdout);
          } else {
            reject(stderr);
          }
        }
      )
    } catch (error) {
      reject(error)
    }
  });
}