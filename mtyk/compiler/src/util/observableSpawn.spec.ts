import { observableSpawn } from './observableSpawn'

describe('observableSpawn', () => {
  it('should spawn a task as an observable', () => {
    const observable = observableSpawn('echo', ['hello world'])
    let sub: any
    sub = observable.subscribe(data => {
      expect(data).toBe('hello world')
      sub.unsubscribe()
    })
  })
})
