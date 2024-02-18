import { UniverseContextItem } from './UniverseEntityContextItem'

export type ITokenizedMessage = {
  content: string
  attachments: {
    item: UniverseContextItem
    range: { start: number; end: number }
  }[]
}
