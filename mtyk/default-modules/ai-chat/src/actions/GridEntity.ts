import { Entity, EntityField } from 'modules/entities'

export class GridEntity extends Entity {
  @EntityField()
  cells: (string | undefined)[][] = []

  getCell(x: number, y: number) {
    return this.cells?.[y]?.[x] ?? undefined
  }

  setCell(x: number, y: number, value: string | undefined) {
    this.update({}, (draft) => {
      if (draft.cells[y]) {
        draft.cells[y][x] = value
      } else {
        console.warn(`Tried to set cell ${x},${y} but row ${y} doesn't exist`)
      }
    })
  }
}
