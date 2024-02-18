import EntityField from 'modules/entities/EntityField'

export type IModelField = {
  type: string
  label: string
  required?: boolean
  defaultValue?: any
}

export default class ModelEntity {
  @EntityField({ defaultValue: '' })
  name: string

  @EntityField({ defaultValue: {} })
  fields: Record<string, IModelField>

  /**
   * A string representing an import from react-icons e.g. react-icons/fa/FaUser
   */
  @EntityField({ defaultValue: 'react-icons/fa/FaUser' })
  icon: string
}
