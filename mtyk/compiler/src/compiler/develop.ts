import { projectPath } from '@/compiler/path'
import chokidar from 'chokidar'
import { spawn } from 'child_process'

let runningExec: any

function startOrRestartExec(comand: string, args: any[], options: any) {
  if (runningExec) {
    runningExec.kill()
  }
  runningExec = spawn(comand, args, {
    stdio: 'inherit',
  })
  runningExec.stdout.on('data', (data: any) => {
    console.log(data.toString())
  })
  runningExec.stderr.on('data', (data: any) => {
    console.log(data.toString())
  })
}

export default function develop() {
  const path = projectPath('env.js')

  // Watch config file for env changes
  const watcher = chokidar.watch([path])
  watcher.on('change', () => {
    // When env changes, restart the develop script
    startOrRestartExec('yarn', ['develop'], {})
  })
}
