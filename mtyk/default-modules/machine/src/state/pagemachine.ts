import { createMachine } from './createMachine'

export const makePageMachine = (pages: any) =>
  createMachine({
    ...pages,
  })
