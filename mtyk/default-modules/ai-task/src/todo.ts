import { makeStore } from './jsonStore'

const todoStore = makeStore('todos')

export default async function todo(opts: { input: string }) {
  const { input } = opts
}
