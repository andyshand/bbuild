export type TreeFile = {
  type: 'file'
  content: string
  name: string
}

export type TreeDirectory = {
  type: 'directory'
  files: (TreeFile | TreeDirectory)[]
  name: string
}
