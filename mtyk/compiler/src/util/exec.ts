import { execSync as _execSync } from 'child_process'

export default function execSync(
  cmd: string,
  opts?: Parameters<typeof _execSync>[1]
) {
  return _execSync(cmd, opts)?.toString() ?? ''
}

export const execSyncInherit = (cmd: string, opts?: { cwd?: string }) => {
  const child = execSync(cmd, {
    ...opts,
    stdio: 'inherit',
  })
  return child
}
