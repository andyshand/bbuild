import { depFn, keyDep, typeDep } from 'modules/deps'
import {
  Entity,
  EntityField,
  EntityFunction,
  EntityRelation,
} from 'modules/entities'
import { publicInvariant } from 'modules/errors/index'
import type { getChatCompletion } from 'modules/llm'
import { Deps, resolveEngine } from '../Deps'
import { EnhancedMessage } from '../EnhancedMessage'
import { Action } from '../actions/Action'
import getActionInfo from '../actions/getActionInfo'
import { Attachment } from '../attachments/Attachment'
import recomputeDirtyAttachments from '../attachments/recomputeDirtyAttachments'
import { ChatContextValue } from '../chat-context/ChatContextValue'
import { ChatTaskEntity } from '../chat-task/ChatTaskEntity'
import { DockerEntity } from '../docker/DockerEntity'
import { ParseMessage } from '../formattings/parseMessage'
import inputSyntax from '../input-syntax/parse'
import createEnhancedMessage from '../messages/createEnhancedMessage'
import { ActionMessageEntity } from './ActionMessageEntity'
import { ChatActivity } from './ChatActivity'
import { ChatConnection, ChatFile, ChatSettings } from './ChatConnection'
import { ChatMessageQueueEntity } from './ChatMessageQueue'
import estimateSendMessageCost from './chat/estimateSendMessageCost'
import getSlicedMessages from './chat/getSlicedMessages'
import getSuggestions from './chat/getSuggestions'
import runChatAction from './chat/runChatAction'
import spawnThread from './chat/spawnThread'
import updateFiles from './chat/updateFiles'

export class ChatEntity extends Entity {
  @EntityField({ defaultValue: [] })
  messages: EnhancedMessage[]

  @EntityField({ defaultValue: {} })
  tempMessage: { content?: string; id?: string }

  @EntityField({ defaultValue: [] })
  @EntityRelation('ActionMessageEntity')
  actionHistory: ActionMessageEntity[]

  @EntityField({ defaultValue: [] })
  @EntityRelation('ChatTaskEntity')
  tasks: string[] = []

  @EntityField({ defaultValue: null })
  @EntityRelation('ChatMessageQueueEntity')
  messageQueue: string | null = null

  @EntityField()
  parentChatId: string | null = null

  @EntityRelation('DockerEntity')
  @EntityField()
  containers: DockerEntity[] = []

  @EntityField({ defaultValue: [] })
  connections: ChatConnection[]

  @EntityField({ defaultValue: [] })
  attachments: Attachment[] = []

  @EntityField({ defaultValue: '' })
  prediction: string

  @EntityField({ defaultValue: [] })
  outputs: {
    /**
     * id of message
     */
    message: string

    name: string
    arguments: any[]
    output: any
  }[] = []

  @EntityField()
  context?: ChatContextValue[] = []

  @EntityField({ defaultValue: [] })
  activity: ChatActivity[] = []

  @EntityField({ defaultValue: {} })
  settings: ChatSettings = {}

  get engine() {
    return this._proxy.settings.engine ?? 'gpt-4'
  }

  get engineImpl() {
    return resolveEngine(this.engine)
  }

  @EntityFunction()
  startTask = depFn({}, async () => {
    const created = await this.manager.create(ChatTaskEntity, {
      chat: this.id,
      results: [],
    })

    publicInvariant(!!created.id, 'Failed to create task')
    this.tasks = [...(this.tasks ?? []), created.id]
    created.run({})
  })

  updateSettings(settings: Partial<ChatSettings>) {
    this.settings = {
      ...this.settings,
      ...settings,
    }
  }

  @EntityFunction()
  doStuff = depFn(
    {
      getCompletion: Deps.getCompletion,
    },
    async ({ getCompletion }) => {
      const prompt = `I need you to help me understand the user's goal in this conversation in the following format:
	
- Main goal
- Sub goals (if applicable)
- Negative preferences (things the user has been clear about not wanting)
- Positive preferences (things the user has been clear about wanting)

For each of these, I need you to be highly detail-focused, accurate and include references to information in the conversation where appropriate.

Please respond with a single message in the above format.`

      const response = await getCompletion(
        await this.getSlicedMessages({ message: prompt, engine: this.engine }),
        { model: 'claude-2' }
      )

      const prompt2 = `Using the following information about this conversation, in what ways might the above message be veering away from what the user wants to achieve?

${response}`

      const reponse2 = await getCompletion(
        await this.getSlicedMessages({ message: prompt2, engine: this.engine }),
        { model: 'claude-2' }
      )

      this.sendMessage({
        message: `The following is a critical analysis of your response, please try to respond again after reading this feedback thoroughly: \n\n${reponse2}`,
      })

      //       const prompt3 = `The following is an analysis of the assistant's ability to understand the user's goal in this conversation:
      // \`\`\`
      // ${reponse2}
      // \`\`\`

      // With this in mind, please can you predict the next message from the user that addresses the issues identified above?`

      //       const prediction = await getCompletion(
      //         await this.getSlicedMessages({ message: prompt3, engine: this.engine }),
      //         { model: 'gpt-4' }
      //       )
      //       this.prediction = prediction
    }
  )

  /**
   * Files that are relevant for this chat. User editable. Can remove irrelevant stuff, but also regenerate automatically
   * using actions if needed
   */
  @EntityField({ defaultValue: [] })
  files: ChatFile[] = []

  @EntityField()
  loadingActions?: boolean = false

  @EntityField()
  responseLengthFactor = 1 / 3

  getRawMessages() {
    return this.messages.map((m) => ({ role: m.role, content: m.content }))
  }

  @EntityField()
  activeAction?: {
    action: Action
    state: any
  }

  getPrompt(msg = this.newMessage) {
    const minifyAttachment = (attach: Attachment) => {
      return (attach.data as any).content
        .replaceAll(/[ ]{2,}/g, ' ')
        .replaceAll(/[\n]{3,}/g, '\n\n')
        .trim()
    }

    for (const attachment of this.newMessageAttachments) {
      // TODO support other kinds of attachment
      msg +=
        '\n' +
        attachment.label +
        '\n' +
        '```\n' +
        minifyAttachment(attachment) +
        '\n```'
    }

    return msg
  }

  @EntityField({ defaultValue: false })
  archived: boolean = false

  @EntityField({ defaultValue: 'New Conversation' })
  name: string

  @EntityField({ defaultValue: '' })
  newMessage: string = ''

  @EntityField({ defaultValue: [] })
  newMessageAttachments: Attachment[]

  @EntityField()
  newMessageJSON?: any = null

  @EntityField()
  category: string | null

  @EntityField()
  suggestions?: string[] = []

  @EntityField({ defaultValue: 'idle' })
  status: 'idle' | 'loading' = 'idle'

  @EntityField({ defaultValue: [] })
  queuedMessages: string[] = []

  @EntityField({ defaultValue: [] })
  @EntityRelation('ChatEntity')
  threads: string[] = []

  @EntityField({ defaultValue: [] })
  summaries: {
    index: number
    summary: string
  }[] = []

  @EntityField({ defaultValue: true })
  read: boolean = true

  _currStream: any | null

  @EntityFunction()
  spawnThread = spawnThread

  @EntityFunction()
  getSuggestions = getSuggestions

  getSlicedMessages = getSlicedMessages

  getIdealResponseLength() {
    const e = this.engineImpl
    return (
      e.getMaxContentLength(this.engine) * (this.responseLengthFactor ?? 1 / 3)
    )
  }

  @EntityFunction()
  autoComplete = depFn(
    {
      message: keyDep<string>('message'),
      clipboard: keyDep<string>('clipboard'),
      getCompletion: Deps.getCompletion,
    },
    async ({ message, clipboard, getCompletion }) => {
      const prompt = `You are a highly sophisicated autocompletion engine for expert developers. You have a keen awareness of typical one-off tasks developers need to do in their day-to-day work.

Your greatest strength is in your ability to accurately identify, without any additional context, what the user likely wants to achieve.
			
The nature of your autocompletion will typically be a request to transform data or text in various ways, associated with data currently on the clipboard. The user started typing the following request:
"${message}"

The following data is on the clipboard:
"${clipboard}"
		
Do not include additional explanation or other text. Only include the autocompleted message, in full, using your best judgement based on the incomplete message and the clipboard data.

You also need to include the clipboard content in the autocompleted message body, if it is not already present.`

      const completion = await getCompletion(prompt, {
        model: 'gpt-3.5-turbo',
      })

      let returnn = completion
      // Remove surrounding quotes, if any
      if (returnn.startsWith('"')) {
        returnn = returnn.slice(1, -1)
      }
      if (returnn.endsWith('"')) {
        returnn = returnn.slice(0, -1)
      }
      return returnn
    }
  )

  @EntityFunction()
  spellCheck = depFn(
    {
      message: keyDep<string>('message'),
      getCompletion: Deps.getCompletion,
    },
    async ({ message, getCompletion }) => {
      const prompt = `Spellcheck and grammar check the following message and return the corrected version. Only respond with the corrected message. Do not include any additional headers, explanation or other text. Just the message.
			
The message is:\n\n${message}`

      const completion = await getCompletion(prompt, {
        model: 'gpt-3.5-turbo',
      })

      return completion
    }
  )

  @EntityFunction()
  updateAttachments = depFn(
    { attachments: keyDep<Attachment[]>('attachments') },
    async ({ attachments }) => {
      this.update({ attachments })
      this.writePendingUpdates()
      const newAttach = await recomputeDirtyAttachments(this, attachments)
      if (newAttach) {
        this.update({ attachments: newAttach.attachments })
      }
    }
  )

  @EntityFunction()
  sendMessage = depFn(
    {
      message: keyDep<string>('message'),
      json: keyDep<any>('json', { optional: true }),
      parsed: keyDep<{
        results: any[]
        codeBlocks: { code: string }[]
      }>('parsed', { optional: true }),
      getChatCompletion: Deps.getChatCompletion,
      history: keyDep<EnhancedMessage[]>('history', { optional: true }),
      transient: typeDep(Boolean, { optional: true }),
      engine: typeDep(String, { optional: true }),
      getChatCompletionStream: Deps.getChatCompletionStream,
      autocompleteAction: typeDep(Boolean, { optional: true }),
      ActionMessageId: typeDep(String, { optional: true }),
    },
    async ({
      message: msg,
      parsed,
      json,
      transient,
      engine: _engine,
      getChatCompletionStream,
      getChatCompletion,
      history,
      autocompleteAction,
      ActionMessageId,
    }) => {
      const hadIterator = await inputSyntax(this, msg, !!parsed)
      if (hadIterator) {
        return
      }

      // First, remove any unnecessary whitespace, double newlines, etc
      const userMessage = this.getPrompt(msg)

      const userMsg = createEnhancedMessage({
        role: 'user',
        json,
        content: userMessage,
        threads: [],
      })
      const userMessageId = userMsg.id!
      try {
        this.status = 'loading'
        if (!transient) {
          this.messages = this.messages.concat(userMsg)
        }

        // If it's the first message, auto generate a name based on the content
        if (
          !transient &&
          ((this.messages.length === 1 && !this.parentChatId) ||
            !this.name ||
            /new conversation/i.test(this.name) ||
            /new thread/i.test(this.name))
        ) {
          try {
            const name = await getChatCompletion(
              [
                {
                  role: 'user',
                  content: `The following is a request from a user to an AI assistant.\n\n${userMessage}\n\nPlease respond with a short, specific title to describe the users command/requirements. Be as specific as possible. Just respond with the title please, no explanation.`,
                },
              ],
              {
                model: 'gpt-3.5-turbo',
              }
            )

            // Remove double quotes from name if present
            this.name = name
              .replace(/"/g, '')
              .replace(/\.$/g, '')
              .replace(/^.*: /, '')
              .trim()
          } catch (e) {
            console.error(e)
          }
        }

        const engine = _engine ?? this.engine
        const currMessages = this.messages
        const slicedMessages =
          history?.map((m) => ({ content: m.content, role: m.role })) ??
          (await this.getSlicedMessages({
            message: userMessage,
            engine,
          }))

        const stream = await getChatCompletionStream(slicedMessages, {
          model: engine,
        })
        this._currStream = stream

        let newAssistantMessage = createEnhancedMessage({
          role: 'assistant',
          content: '',
          engine,
        })
        let content = ''
        if (!transient) {
          this.messages = currMessages.concat([newAssistantMessage])
          this.tempMessage = newAssistantMessage
        }
        let actionMessageEntity: ActionMessageEntity | undefined

        if (autocompleteAction) {
          actionMessageEntity = await this.manager.read(
            ActionMessageEntity,
            ActionMessageId
          )
        }

        await new Promise((resolve, reject) => {
          const subscription = stream.messages
            // .pipe(throttleTime(500))
            .subscribe({
              next: ([msg]) => {
                if (autocompleteAction && !!actionMessageEntity) {
                  actionMessageEntity.update({ stealth: true }, (draft) => {
                    draft.content = msg.content
                    return draft
                  })
                }

                if (!transient) {
                  content = msg.content
                  this.update({ stealth: true }, (draft) => {
                    draft.tempMessage = {
                      ...draft.tempMessage,
                      content: msg.content,
                    }
                    this.update({
                      tempMessage: {
                        ...this.tempMessage,
                        content: msg.content,
                      },
                    })

                    // draft.messages = draft.messages.map((m) => {
                    //   if (m.id === newAssistantMessage.id) {
                    //     return {
                    //       ...m,
                    //       content: msg.content,
                    //     }
                    //   }
                    //   return m
                    // })
                  })
                }
              },
              error: (e) => {
                this.tempMessage = {}
                reject(e)
                subscription.unsubscribe()
              },
              complete: () => {
                if (autocompleteAction)
                  this.update({
                    actionHistory: [
                      ...(this.actionHistory || []),
                      ActionMessageId,
                    ],
                  })
                this.update({
                  messages: this.messages.map((m) => {
                    if (m.id === newAssistantMessage.id) {
                      return {
                        ...m,
                        content: this.tempMessage.content,
                      }
                    }
                    return m
                  }),
                })
                // this.update({ stealth: true }, (draft) => {
                //   draft.messages = draft.messages.map((m) => {
                //     if (m.id === newAssistantMessage.id) {
                //       return {
                //         ...m,
                //         content: this.tempMessage.content,
                //       }
                //     }
                //     return m
                //   })
                // })

                this.update({ stealth: true }, (draft) => {
                  draft.messages = draft.messages.map((m) => {
                    if (m.id === newAssistantMessage.id) {
                      return {
                        ...m,
                        content: this.tempMessage.content,
                      }
                    }
                    return m
                  })
                })

                this.tempMessage = {}

                resolve(undefined)
                subscription.unsubscribe()
              },
            })
        })

        if (!transient && this.newMessage === userMessage) {
          this.newMessage = ''
        }
        this.read = false
        // this.genCodeBlockSummaries.call(this, {
        // 	index: this.messages.length - 1,
        // })

        if (!transient) {
          this.maybeSendNextQueuedMessage(true)
        }

        // this.doStuff({})

        return {
          message: this.messages.find(
            (m) => m.id === newAssistantMessage.id
          ) ?? {
            ...newAssistantMessage,
            content,
          },
          userMessageId,
        }
      } catch (e) {
        console.error(e)

        // If an error, attach it to the user message
        this.editMessageId(userMessageId, (msg) => {
          msg.error = {
            message: e.message,
            stack: e.stack,
          }
          return msg
        })
      } finally {
        this.status = 'idle'
      }
    }
  )

  updateFiles = updateFiles

  @EntityFunction()
  runAction = runChatAction

  @EntityFunction()
  estimateSendMessageCost = estimateSendMessageCost

  @EntityFunction()
  countTokens = depFn(
    {
      message: keyDep<string>('message'),
      tokenCounter: Deps.tokenCounter,
    },
    ({ message, tokenCounter }) => {
      // Convert existing messages to JSON and ensure we discard any older messages
      // that cause our message to exceed 8192 token limit of GPT4
      const engineLimit = 8192
      const thisMessageCount = tokenCounter(
        JSON.stringify({ role: 'user' as const, content: message })
      )

      const messages = this.getRawMessages()
        .map((m) => JSON.stringify(m))
        .map((str) => tokenCounter(str) as number)
      const idealResponseLength = this.getIdealResponseLength()
      while (
        messages.length > 0 &&
        thisMessageCount +
          idealResponseLength +
          messages.reduce((a, b) => a + b) >=
          engineLimit
      ) {
        // remove the earliest message
        messages.shift()
      }

      const toInclude = this.getRawMessages().slice(messages.length * -1)
      const allMessages = [
        ...toInclude,
        { role: 'user' as const, content: message },
      ]
      return allMessages
    }
  )

  @EntityFunction()
  regenerateMessage = depFn(
    { index: typeDep(Number, { optional: true }) },
    async ({ index: _index }) => {
      const index = _index ?? this.messages.length - 1
      const msg = this.messages[index]

      if (msg.role === 'assistant') {
        // Message is from assistant, but we need to resend the message before it
        const messageBefore = this.messages[index - 1] ?? this.messages[0]

        // Remove message before and current message
        this.messages = this.messages.slice(0, index - 1)

        // Now request response again
        await this.sendMessage({
          message: messageBefore.content,
          json: messageBefore.json,
        })
      } else {
        // Message if from user. Need to resend this message
        // Remove last message
        this.messages = this.messages.slice(0, index)
        await this.sendMessage({ message: msg.content, json: msg.json })
      }
    }
  )

  editMessageObj(index: number, editor) {
    this.update((d) => {
      d.messages = d.messages.map((m, i) => {
        if (i === index) {
          return editor({ ...m })
        }
        return m
      })
    })
  }

  editMessageId(id: string, editor: (msg: EnhancedMessage) => EnhancedMessage) {
    this.update({ stealth: true }, (d) => {
      d.messages = d.messages.map((m) => {
        if (m.id === id) {
          return editor({ ...m })
        }
        return m
      })
    })
  }

  @EntityFunction()
  cancel = ({ finishWith }: { finishWith?: string }) => {
    try {
      this._currStream?.cancel()
    } catch (e) {
      console.error(e)
    }
    this.status = 'idle'

    if (finishWith) {
      this.sendMessage({
        engine: finishWith as any,
        message: 'Continue',
      })
    }
  }

  // @EntityFunction()
  // extractNamedEntities = depFn(
  // 	{
  // 		message: keyDep<string>("message"),
  // 		getChatCompletion: Deps.getChatCompletion,
  // 	},
  // 	async function extractNamedEntities({ message, getChatCompletion }) {

  // 		const prompt = `Please extract all named entities from the following message:\n\n${message}\n\nFormat your response as a single comma-separated list.`
  // 		const completion = await getChatCompletion(prompt, {
  // 			model: 'gpt-3.5-turbo' as any,
  // 		})

  // 		const entities = completion.split(',').map(s => s.trim()).filter(s => s.length > 0)

  // 		this.update({
  // 			entities
  // 		})
  // 		return entities
  // 	},
  // )

  deleteMessage(index: number) {
    // Remove the message at the given index
    this.messages = this.messages.filter((m, i) => i !== index)
  }

  // private async summariseSoFar({ getChatCompletion }): Promise<string> {

  //   // Prepare a message to ask the AI to summarize the conversation so far
  //   const conversation = this.getRawMessages().slice(-4).map(m => `${m.role}: ${m.content}`).join('\n');
  //   const summaryRequestMessage = `The following is a conversation between a user and an AI assistant:\n\n${conversation}\n\nPlease provide a brief summary of the conversation so far.`;

  //   // Call the OpenAI API to generate the summary
  //   const summary = await getChatCompletion([{ role: 'user', content: summaryRequestMessage }], {
  //     model: 'gpt-3.5-turbo' as any
  //   });

  //   // Shorter
  //   const shorter = await getChatCompletion([{ role: 'user', content: `The following is a summary of a conversation:\n\n${summary}\n\nI'd like it to be readable at a glance while the user is scrolling through a lot of content. Please respond with a very short summary:` }])

  //   // Clean up the summary by removing double quotes and trailing period
  //   return shorter.replace(/"/g, '').replace(/\.$/g, '');
  // }

  @EntityField()
  knowledge: { entity: string; knowledge: string }[] = []

  @EntityFunction()
  learn = depFn(
    {
      getChatCompletion: keyDep<typeof getChatCompletion>('getChatCompletion'),
    },
    async ({ getChatCompletion }) => {
      const prompt = `Now, with this conversation in mind, can you give me a list of salient named entities and knowledge you've learnt about each in the format of a JSON object array of type \`{entity: string, knowledge: string}[]\`. Only respond with JSON, no additional explanation.`

      const sliced = await this.getSlicedMessages({
        message: prompt,
        engine: 'gpt-3.5-turbo',
      })
      const gpt3 = await getChatCompletion(sliced, {
        model: 'gpt-3.5-turbo' as any,
      })

      try {
        this.knowledge = ParseMessage.json(gpt3)
      } catch (e) {
        console.error(e, gpt3)
      }
    }
  )

  @EntityFunction()
  async getActionInfo(message: EnhancedMessage, action: Action, args = {}) {
    const res = await getActionInfo({ action, args: args, message })
    return res
  }

  async getQueue() {
    if (!this.messageQueue) {
      this.messageQueue = (
        await this.manager.create('ChatMessageQueueEntity', {})
      ).id
    }

    return this.messageQueue
      ? this.manager.read('ChatMessageQueueEntity', this.messageQueue)
      : null
  }

  async getQueuedMessages() {
    const queue = await this.getQueue()
    return queue.queuedMessages
  }

  async maybeSendNextQueuedMessage(force?: boolean) {
    if (this.status === 'idle' || force) {
      const queue = await this.getQueue()
      if (queue) {
        const msg = queue.takeMessage()
        if (msg) {
          this.sendMessage({
            message: msg.message.content,
            json: msg.message.json,
          })
        }
      }
    }
  }

  async queueMessage(msg: Pick<EnhancedMessage, 'content' | 'json'>) {
    if (msg) {
      const queue = await this.getQueue()
      queue.queueMessage(msg)
    }
    this.maybeSendNextQueuedMessage()
  }

  async autocompleteAction(
    msg: Pick<EnhancedMessage, 'content' | 'json'>,
    command: string,
    query: string
  ) {
    if (msg) {
      try {
        const actionMessageEntity = (await this.manager.create(
          'ActionMessageEntity',
          {
            command,
            query,
            content: '',
            createdAt: new Date(),
          }
        )) as unknown as ActionMessageEntity

        this.sendMessage({
          message: msg.content,
          json: msg.json,
          transient: true,
          autocompleteAction: true,
          ActionMessageId: actionMessageEntity.id,
        })

        return actionMessageEntity.id
      } catch (error) {
        console.error('Error creating ActionMessageEntity:', error)
      }
    }
  }
}
