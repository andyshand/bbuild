import Entity from 'modules/entities/Entity'
import MongoEntityManager from 'modules/entities/MongoEntityManager'

class ConversationMessage extends Entity {
  text: string
}

class Conversation extends Entity {
  messages: ConversationMessage[] = []
}

const mongo = new MongoEntityManager('mongodb://localhost:27017', 'test', [Conversation])


export default mongo