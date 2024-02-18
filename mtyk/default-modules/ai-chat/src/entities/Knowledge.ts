import { Entity, EntityField, IEntityManager } from "modules/entities";
import { KnowledgeRepresentation } from "./KnowledgeRepresentation";

export class Knowledge extends Entity {
  @EntityField()
  about: string[] = [];

  @EntityField()
  category: string = ''

  @EntityField()
  representations: KnowledgeRepresentation[] = []

  @EntityField()
  knowledge: string[]

  addOrUpdateRepresentation(representation: KnowledgeRepresentation) {
    return this._editArrField<KnowledgeRepresentation>('representations', arr => {
      const existing = arr.find(r => r.id === representation.id)
      if (existing) {
        existing.content = representation.content
        existing.version = representation.version
      } else {
        arr.push(representation)
      }
      return arr
    })
  }

  /**
   * Should be auto-generated from about. Split into tokens and lowercase
   */
  @EntityField()
  tags: string[] = []

  static async findAbout(manager: IEntityManager, about: string) {
    const results = await manager.find(Knowledge, {
      about: {
        $in: [about]
      }
    })
    return results
  }
}