import createHardConfigs from './createHardConfigs'
import { getApps } from 'modules/core'

async function main() {
  for (const app of getApps()) {
    await createHardConfigs(app)
  }
}

main()
