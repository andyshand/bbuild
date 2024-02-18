export default class Queue<T> {
  private array: T[]
  private capacity: number
  private mask: number
  private start: number
  private end: number
  private size: number

  constructor(initialCapacity = 16) {
    if ((initialCapacity & (initialCapacity - 1)) !== 0) {
      throw new Error('Capacity must be a power of 2')
    }

    this.array = new Array(initialCapacity)
    this.capacity = initialCapacity
    this.mask = initialCapacity - 1
    this.start = 0
    this.end = 0
    this.size = 0
  }

  enqueue(item: T) {
    if (this.size === this.capacity) {
      this.resize(this.capacity * 2)
    }
    this.array[this.end] = item
    this.end = (this.end + 1) & this.mask
    this.size++
  }

  enqueueAtFront(item: T) {
    if (this.size === this.capacity) {
      this.resize(this.capacity * 2)
    }

    this.start = (this.start - 1 + this.capacity) & this.mask
    this.array[this.start] = item
    this.size++
  }

  dequeue(): T | null {
    if (this.isEmpty()) {
      return null
    }
    const item = this.array[this.start]
    this.array[this.start] = null as any
    this.start = (this.start + 1) & this.mask
    this.size--

    if (this.size > 0 && this.size === this.capacity >> 2) {
      this.resize(this.capacity >> 1)
    }

    return item
  }

  dequeueMultiple(numItems: number): T[] {
    if (numItems <= 0 || this.isEmpty()) {
      return []
    }

    const items: T[] = []
    while (numItems > 0 && !this.isEmpty()) {
      items.push(this.dequeue()!)
      numItems--
    }

    return items
  }

  private resize(newCapacity: number) {
    let newArray: T[] = new Array(newCapacity)
    for (let i = 0; i < this.size; i++) {
      newArray[i] = this.array[(this.start + i) & this.mask]
    }
    this.array = newArray
    this.capacity = newCapacity
    this.mask = newCapacity - 1
    this.start = 0
    this.end = this.size
  }

  isEmpty(): boolean {
    return this.size === 0
  }

  length(): number {
    return this.size
  }
}
