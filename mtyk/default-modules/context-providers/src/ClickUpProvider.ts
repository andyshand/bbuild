import axios from 'axios'
// import { ContextProvider, ContextResolverMap } from 'modules/context'

const team = '9005007782'
export class ClickUpClient {
  async getSpaces({ token }: { token: string }) {
    const response = await axios.get(
      `https://api.clickup.com/api/v2/team/${team}/space`,
      {
        headers: { Authorization: token },
      }
    )
    return response.data as { spaces: any[] }
  }

  async getSpaceFolders(spaceId: string, token: string) {
    const response = await axios.get(
      `https://api.clickup.com/api/v2/space/${spaceId}/folder`,
      {
        headers: { Authorization: token },
      }
    )
    return response.data
  }

  async getSpaceTasks(spaceId: string, token: string) {
    const response = await axios.get(
      `https://api.clickup.com/api/v2/space/${spaceId}/task`,
      {
        headers: { Authorization: token },
      }
    )
    return response.data
  }
  async getSpaceLists(spaceId: string, token: string) {
    const response = await axios.get(
      `https://api.clickup.com/api/v2/space/${spaceId}/list`,
      {
        headers: { Authorization: token },
      }
    )
    return response.data
  }
}

export class ClickUpProvider {
  private clickUpClient: ClickUpClient
  id = 'ClickUp'

  constructor(clickUpClient: ClickUpClient) {
    // super()
    this.clickUpClient = clickUpClient
  }

  matcher = (item) => true

  resolver: any
}
