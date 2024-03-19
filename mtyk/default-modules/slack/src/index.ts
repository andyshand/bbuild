export type AuthDetails = {
  ok?: boolean
  [key: string]: any
}
export interface SlackChannel {
  id: string
  name: string
  is_channel: boolean
  created: number
  creator: string
  is_archived: boolean
  is_general: boolean
  name_normalized: string
  is_shared: boolean
  is_org_shared: boolean
  is_member: boolean
  is_private: boolean
  is_mpim: boolean
  topic: object
  purpose: object
  previous_names: string[]
  num_members: number
}
export class SlackClient {
  private clientId: string
  private clientSecret: string
  private redirectUrl: string
  private accessToken: string | undefined
  constructor(config: {
    clientId: string
    clientSecret: string
    redirectUrl: string
    accessToken?: string
  }) {
    this.clientId = config.clientId
    this.clientSecret = config.clientSecret
    this.redirectUrl = config.redirectUrl
    this.accessToken = config.accessToken
  }
  personalise(accessToken: string) {
    return new SlackClient({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      redirectUrl: this.redirectUrl,
      accessToken: accessToken,
    })
  }
  async inviteBotToChannel({
    channelId,
    botUserId,
    token = this.accessToken,
  }: {
    channelId: string
    botUserId: string
    token?: string
  }): Promise<void> {
    await this.fetchFromSlack(
      'conversations.invite',
      'POST',
      {
        channel: channelId,
        users: botUserId,
      },
      token
    )
  }
  async fetchFromSlack(
    endpoint: string,
    method: string,
    body: any,
    token = this.accessToken
  ) {
    if (!token) {
      throw new Error('No access token available')
    }
    let url = `https://slack.com/api/${endpoint}`
    let options = {
      method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${token}`,
      },
    } as any
    if (method === 'GET') {
      url += '?' + new URLSearchParams(body).toString()
    } else {
      options.body = new URLSearchParams(body).toString()
    }
    const response = await fetch(url, options)
    if (!response.ok) {
      throw new Error(
        `Response not ok for ${method} ${url}: ${response.status} ${response.statusText}`
      )
    }
    const responseJson = await response.json()
    if (!responseJson.ok) {
      throw new Error(
        `Error parsing JSON: ${responseJson.error} (${responseJson.error_description})`
      )
    }
    return responseJson
  }
  async signIn(code: string): Promise<AuthDetails> {
    if (!this.clientId || !this.clientSecret || !this.redirectUrl) {
      throw new Error('Configuration is missing')
    }
    const responseJson = await this.fetchFromSlack('oauth.v2.access', 'POST', {
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUrl,
    })
    const authDetails: AuthDetails = {
      ...responseJson,
      ok: undefined,
    }
    return authDetails
  }
  async sendMessage({
    channelId,
    text,
    token = this.accessToken,
  }: {
    channelId: string
    text: string
    token?: string
  }) {
    return await this.fetchFromSlack(
      'chat.postMessage',
      'POST',
      {
        channel: channelId,
        text,
      },
      token
    )
  }
  async createChannel({
    name,
    token = this.accessToken,
  }: {
    name: string
    token?: string
  }): Promise<SlackChannel> {
    const responseJson = await this.fetchFromSlack(
      'conversations.create',
      'POST',
      {
        is_private: true,
        name,
      },
      token
    )
    return responseJson.channel as SlackChannel
  }
  async getChannelByNameOrNull({
    name,
    token = this.accessToken,
  }: {
    name: string
    token?: string
  }) {
    const responseJson = await this.fetchFromSlack(
      'conversations.list',
      'GET',
      {
        types: 'public_channel,private_channel',
        limit: 999,
        exclude_archived: true,
      },
      token
    )
    const channels = responseJson.channels
    const channel = channels.find((channel: any) => channel.name === name)
    return channel as SlackChannel | null
  }
  async syncChannelMembers({
    channelId,
    userIds,
    token = this.accessToken,
  }: {
    channelId: string
    userIds: string[]
    token?: string
  }): Promise<void> {
    const responseJson = await this.fetchFromSlack(
      'conversations.members',
      'GET',
      {
        channel: channelId,
      },
      token
    )
    const currentMembers = responseJson.members
    const membersToAdd = userIds.filter((id) => !currentMembers.includes(id))
    const membersToRemove = currentMembers.filter((id) => !userIds.includes(id))
    for (const userId of membersToAdd) {
      await this.fetchFromSlack(
        'conversations.invite',
        'POST',
        {
          channel: channelId,
          users: userId,
        },
        token
      )
    }
    // for (const userId of membersToRemove) {
    //   await this.fetchFromSlack(
    //     'conversations.kick',
    //     'POST',
    //     {
    //       channel: channelId,
    //       user: userId,
    //     },
    //     token
    //   )
    // }
  }
  async findUserByName({
    name,
    token = this.accessToken,
  }: {
    name: string
    token?: string
  }): Promise<string | null> {
    const responseJson = await this.fetchFromSlack(
      'users.list',
      'GET',
      {},
      token
    )
    const users = responseJson.members
    const user = users.find(
      (user: any) =>
        (user.real_name ?? user.name).toLowerCase() === name.toLowerCase()
    )
    return user ? user.id : null
  }
  async openDM({
    userId,
    token = this.accessToken,
  }: {
    userId: string
    token?: string
  }): Promise<string | null> {
    const responseJson = await this.fetchFromSlack(
      'conversations.open',
      'POST',
      { users: userId },
      token
    )
    return responseJson.channel ? responseJson.channel.id : null
  }
  async sendDM({
    userId,
    message,
    token = this.accessToken,
  }: {
    userId: string
    message: string
    token?: string
  }): Promise<void> {
    const channelId = await this.openDM({ userId, token })
    if (channelId) {
      await this.sendMessage({ channelId, text: message, token })
    } else {
      throw new Error('Could not open DM with user')
    }
  }
}
export function createClient(config: {
  clientId: string
  clientSecret: string
  redirectUrl: string
  accessToken?: string
}): SlackClient {
  return new SlackClient(config)
}

// --- BEGIN INJECTED CODE ---

// Inject some code to check if we've imported two different versions of any module. This is a common cause of bugs.
const globalObject: any = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {}
const globalStore = globalObject?.__bbuild ?? {}
if (globalStore["slack"]) {
console.warn(`Duplicate module slack imported. This can lead to bugs.`);
}
globalStore["slack"] = true;
 
// --- END INJECTED CODE ---