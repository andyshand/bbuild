import EntityField from 'modules/entities/EntityField'

export default class NoteEntity {
  /**
   * tiptap content
   */
  @EntityField({ defaultValue: {} })
  content: any
}
