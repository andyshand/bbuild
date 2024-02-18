export function promiseWithTimeout<T>(
  ms: number,
  promise: () => Promise<T>,
  msg?: string
): Promise<T> {
  // Create a promise that rejects in <ms> milliseconds
  return new Promise(async (resolve, reject) => {
    let timedOut = false
    const id = setTimeout(() => {
      clearTimeout(id)
      timedOut = true
      reject(msg + 'Timed out in ' + ms + 'ms.')
    }, ms)
    const result = await promise()

    if (!timedOut) {
      clearTimeout(id)
      resolve(result)
    }
  })
}
