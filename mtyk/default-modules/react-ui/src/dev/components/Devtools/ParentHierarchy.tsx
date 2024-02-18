export interface ParentHierarchy {
  fiberProp: string
  parent: HTMLElement
  info: any
  debugSource: {
    fileName: string
    lineNumber: number
    columnNumber: number
  }
  id: string
}
