import { Entity, EntityField, EntityRelation } from 'modules/entities'
import { UISelection } from './UISelection'

type UISettings = {
  showBeforeToday?: boolean
}

export class ChatUI extends Entity {
  /**
   * @deprecated use URL params for selected chat
   */
  @EntityField({
    beforeSet: (v, { entity }) => {
      entity.selectedChats = []
      return v
    },
  })
  selectedChatId: string | null = null

  /**
   * @deprecated use url params
   */
  @EntityField({ defaultValue: [] })
  selectedChats: string[] = []

  @EntityField({ defaultValue: [] })
  selection: UISelection[]

  @EntityField({ defaultValue: {} })
  settings: UISettings = {}

  @EntityRelation('UserSession')
  @EntityField({ defaultValue: [] })
  userSessions: string[] = []

  async newUserSession() {
    const session = await this.manager.create('UserSession', {
      name: `Session ${this.userSessions.length + 1}`,
    })
    this.userSessions = this.userSessions.concat(session.id)
  }

  updateSettings(settings: Partial<UISettings>) {
    this.settings = {
      ...this.settings,
      ...settings,
    }
  }

  addToSelection(selection: UISelection) {
    this.selection = this.selection
      .filter((s) => JSON.stringify(s) !== JSON.stringify(selection))
      .concat(selection)
  }

  removeFromSelection(selection: UISelection) {
    this.selection = this.selection.filter(
      (s) => JSON.stringify(s) !== JSON.stringify(selection),
    )
  }

  resetSelection() {
    this.selection = []
  }

  isSelected(selection: UISelection) {
    return this.selection.some((s) => JSON.stringify(s) === JSON.stringify(selection))
  }

  // Navigation history
  @EntityField()
  chatHistory: string[] = []

  @EntityField()
  selectedCell: { x: number; y: number } | null = null

  /**
   * @deprecated use url params
   */
  @EntityField()
  selectedCategory: string | null = null

  @EntityField()
  showKnowledgeBase = false

  @EntityField()
  commandPrompt: {
    open: boolean
    query: string
  }
}
