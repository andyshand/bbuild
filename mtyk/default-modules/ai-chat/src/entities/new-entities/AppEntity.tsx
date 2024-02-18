import { Entity, EntityField } from 'modules/entities/index'

export default class AppEntity extends Entity {
  @EntityField({ defaultValue: 'New App' })
  name: string
}
