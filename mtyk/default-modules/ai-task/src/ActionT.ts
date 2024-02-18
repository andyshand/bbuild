import { Actionresult } from './Actionresult'

export type ActionT = {
  object: string
  actions: {
    name: string
    tags?: string[]
    params: { name: string; type: string; optional?: true }[]
    run: (params: any) => Promise<Actionresult>
  }[]
}
