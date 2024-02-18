import { Entity, EntityField } from 'modules/entities/index'

export default class UIEntity extends Entity {
  @EntityField({ defaultValue: 'New UI' })
  name: string
}
