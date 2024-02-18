import { spawn } from 'child_process'
import { Observable } from 'rxjs'

export function observableSpawn(
  cmd: string,
  args: string[],
  opts?: {
    cwd?: string
    env?: NodeJS.ProcessEnv
  }
): Observable<{ stdout: string[]; stderr: string[] }> {
  return new Observable((subscriber) => {
    const localArgs = args.slice()
    const proc = spawn(cmd, localArgs, opts)
    let stdout: string[]
    let stderr: string[]
    function addOutputAndNext(newLine: string, error?: boolean) {
      if (error) {
        stderr = (stderr ?? []).concat(newLine).slice(-1000)
      } else {
        stdout = (stdout ?? []).concat(newLine).slice(-1000)
      }
      subscriber.next({ stdout, stderr })
    }
    proc.stdout.on('data', (data) => {
      addOutputAndNext(data.toString())
    })
    proc.stderr.on('data', (data) => {
      addOutputAndNext(data.toString(), true)
    })
    proc.on('close', (code) => {
      subscriber.complete()
    })
    proc.on('error', (err) => {
      subscriber.error(err)
    })
  })
}
