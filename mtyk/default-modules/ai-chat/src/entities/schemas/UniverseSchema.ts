import EntityField from 'modules/entities/EntityField'
import Entity from 'modules/entities/Entity'

export class UniverseSchema extends Entity {
  @EntityField()
  name: string

  @EntityField()
  data: Record<string, any>
}
