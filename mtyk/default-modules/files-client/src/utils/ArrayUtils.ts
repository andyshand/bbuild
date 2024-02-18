export function getItem<Item>(array: Array<Item>, index: number, defaultIndex?: number): Item {
    if (index < 0) return array[defaultIndex ?? 0]
    if (index > array.length - 1) return array[defaultIndex ?? array.length -1]
    return array[index]
}