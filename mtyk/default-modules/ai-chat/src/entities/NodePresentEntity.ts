import { Entity, EntityField } from 'modules/entities/index'

export default class NodePresetEntity extends Entity {
  @EntityField({ defaultValue: 'New Preset' })
  name: string

  @EntityField()
  node: {
    type: string
    data: any
  }
}
