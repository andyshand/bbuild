import Entity from 'modules/entities/Entity'
import EntityField from 'modules/entities/EntityField'

export type UserWindowType =
  | {
      type: 'chat'
      data: {
        id: string
      }
    }
  | { type: 'file'; data: { id: string } }

export type UserWindow = UserWindowType & {
  dismissed?: boolean
}

export default class UserSession extends Entity {
  @EntityField({ defaultValue: [] })
  scratchPads: {
    name: string
    files: { id: string }[]
  }[] = []

  @EntityField({ defaultValue: [] })
  windows: UserWindow[] = []
}
