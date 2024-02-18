export type PromisifyIfNotPromise<T> = T extends Promise<any> ? T : Promise<T>
export type Constructor<T> = new (...args: any[]) => T
