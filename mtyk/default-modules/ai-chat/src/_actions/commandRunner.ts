import { exec } from 'child_process'
import { depFn } from 'modules/deps/index'
import { keyDep } from 'modules/deps/tokenDep'
import { addWSFunction } from 'modules/rpc-ws/server'
import * as path from 'path'
import { promisify } from 'util'

// Promisify the exec function so we can use it with async/await
const execAsync = promisify(exec)

// A general purpose function to run any shell command
const runCommand = depFn(
  {
    command: keyDep<string>(),
    directory: keyDep<string>(),
  },
  async function runCommand({ command, directory }): Promise<void> {
    const fullPath = path.resolve(directory)

    try {
      const { stdout, stderr } = await execAsync(command, { cwd: fullPath })
      if (stdout) console.log(stdout)
      if (stderr) console.error(stderr)
    } catch (error) {
      console.error(`Error executing command: ${error}`)
    }
  }
)

export default addWSFunction(runCommand)
