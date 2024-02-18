import { globalDepContext } from 'modules/deps/createDepContext'
import Entity from 'modules/entities/Entity'
import EntityField from 'modules/entities/EntityField'
import vmDep from 'modules/vm/_deps'

export class UIEntity extends Entity {
  @EntityField({ defaultValue: '' })
  name: string

  @EntityField({ defaultValue: '' })
  code: string

  async runUI({}: {}) {
    const { vm } = globalDepContext.provideSync({
      vm: vmDep,
    })

    const out = await vm.run({
      type: 'node',
      packages: [],
      files: {
        type: 'directory',
        name: '/',
        files: [
          {
            type: 'file',
            name: 'index.js',
            content: ``,
          },
          {
            type: 'file',
            name: 'node.js',
            content: ``,
          },
        ],
      },
    })
    return out
  }
}
