import { MemoryEntityManager } from 'modules/entities'
import { MTYKContainer } from './MTYKContainer'

export const em = new MemoryEntityManager([MTYKContainer])
