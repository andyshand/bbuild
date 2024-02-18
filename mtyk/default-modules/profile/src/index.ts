let profilingData = {}

function startProfiler(func, funcName) {
  if (!profilingData[funcName]) {
    profilingData[funcName] = []
  }

  let startTime = Date.now()

  return function onComplete(result) {
    let endTime = Date.now()
    profilingData[funcName] = profilingData[funcName].slice(-99).concat({
      runTime: endTime - startTime,
      result: result,
    })

    return result
  }
}

const getFnName = (fn) => {
  return fn.name || fn.toString().match(/function\s*([^(]*)\(/)?.[1] || 'unknown'
}

export function profileSync(func, funcName = getFnName(func)) {
  return function wrappedWithSyncProfiler(...args) {
    const profiler = startProfiler(func, funcName)
    const result = func.call(this, ...args)
    return profiler.call(this, result)
  }
}

export function profileAsync(func, funcName = getFnName(func)) {
  return async function wrappedWithProfiler(...args) {
    const profiler = startProfiler(func, funcName)
    const result = await func.call(this, ...args)
    return profiler.call(this, result)
  }
}

export function getAllStats() {
  return profilingData
}
