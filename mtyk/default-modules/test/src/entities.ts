
import { Entity, EntityField, EntityFunction } from 'modules/entities'

export type TestRun = {
  id: string,
  time: Date
  logs: string[]
}

export class Test extends Entity {
  @EntityField()
  file: string

  @EntityField()
  runs: TestRun[] = []

  @EntityFunction()
  async run() {

    // Assume for now the runtime is node



  }

}