export class EventEmitter<T> {
  nextId = 0;
  listenersById: { [id: number]: (...values: [T, ...any[]]) => void } = {};
  listen(cb: (data: T) => void) {
    let nowId = this.nextId++;
    this.listenersById[nowId] = cb;
    return nowId;
  }
  stopListening(id: number) {
    delete this.listenersById[id];
  }
  emit(...values: [T, ...any[]]) {
    for (const listener of Object.values(this.listenersById)) {
      // logWithTime('Emitting to listener' + listener.toString())
      listener(...values);
    }
  }
}

type DataType<
  TypeMap extends { [event: string]: any },
  Key extends keyof TypeMap
> = TypeMap[Key];

export class EventRouter<
  TypeMap extends { [event: string]: any },
  Keys extends string = keyof TypeMap & string
> {
  nextId = 0;
  mutedEvents: Partial<{ [K in Keys]: boolean }> = {};
  muteEvent(eventName: Keys) {
    this.mutedEvents[eventName] = true;
  }
  unmuteEvent(eventName: Keys) {
    delete this.mutedEvents[eventName];
  }
  listenersByEvent: Partial<{ [K in Keys]: { [id: number]: Function } }> = {};
  on<Key extends Keys>(
    eventName: Key,
    cb: (data: DataType<TypeMap, Key>) => void
  ) {
    if (!this.listenersByEvent[eventName]) {
      this.listenersByEvent[eventName] = {};
    }
    let id = this.nextId++;
    this.listenersByEvent[eventName]![id] = cb;
    return id;
  }
  off(eventName: Keys, id: number) {
    if (this.listenersByEvent[eventName]) {
      delete this.listenersByEvent[eventName]![id];
    }
  }
  emit(eventName: Keys, value: DataType<TypeMap, Keys>) {
    if (eventName in this.mutedEvents) {
      return;
      // return console.info(`Event ${eventName} was muted`)
    }
    for (const cb of Object.values(this.listenersByEvent[eventName] || {})) {
      cb(value);
    }
  }
}

export function makeEvent<T>(): EventEmitter<T> {
  return new EventEmitter();
}
