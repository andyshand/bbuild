import { Entity, EntityField } from 'modules/entities'

export class CategoryEntity extends Entity {
  @EntityField({ defaultValue: 'New Category' })
  name: string

  @EntityField()
  projectLocation: {
    type: 'local'
    path: string
  }
}
