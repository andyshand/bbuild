import EntityField from 'modules/entities/EntityField'

export default class UserEntity {
  @EntityField({ defaultValue: 'New User' })
  name: string
}
