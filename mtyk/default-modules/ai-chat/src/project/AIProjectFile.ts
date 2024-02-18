export type UserStory = {
  userClasses: string[],
  can: string,
}

export type AIFile = {
  filename: string,
  description: string,
  id: string,
  path: string,
  type: 'action' | 'schema' | 'ui',
  userStories: UserStory[],
  lastKnown: {
    md5: string,
  },
  history: {}[]
}