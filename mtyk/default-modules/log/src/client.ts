export * from './log'

/**
 * Turns all lines in stack trace into vscode:// files links
 */
export function makeVSCodeStackTrace(stackTrace: string) {
  return stackTrace
    .split('\n')
    .map((line) => {
      const match = line.match(/at (.*) \((.*):(\d+):(\d+)\)/)
      if (match) {
        const [, func, file, line, column] = match
        return `at ${func} (vscode://file/${file}:${line}:${column})`
      }
      return line
    })
    .join('\n')
}

export function vscodeifyError(error: Error) {
  error.stack = makeVSCodeStackTrace(error.stack ?? '')
  return error
}
