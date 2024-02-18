import { pubSub } from 'modules/rpc-ws/central/client'
import startWSServer, { FunctionMap } from 'modules/rpc-ws/server'
import { getPortForName } from 'modules/transport/index'
// import asyncLocalStorage from './asyncLocalStorage';
import { Observable, map } from 'rxjs'

import Entity from './Entity'
import { IEntityManager } from './IEntityManager'
import { getEntityTypeName } from './getEntityTypeName'

const serialiseResult = (value: any) => {
  if (value instanceof Entity) {
    return {
      ...value.getEntityFieldValues(),
      revisionNumber: value.revisionNumber,
      type: getEntityTypeName(value),
    }
  } else if (value instanceof Observable) {
    // make sure we pipe serialised results
    return value.pipe(map(serialiseResult))
  } else {
    return value
  }
}

export default function createManagerRPCServer(
  manager: IEntityManager,
  name: string
) {
  const port = getPortForName(name)
  console.log(`Starting RPC server for ${name} on port ${port}`)

  let fns: FunctionMap = {}
  for (const key of [
    'create',
    'find',
    'read',
    'update',
    'delete',
    'watch',
    'call',
    'findIds',
    'readIds',
    'getInvalidateObserver',
  ]) {
    const fn = manager[key]
    if (typeof fn === 'function') {
      console.log(`Adding ${key} to RPC server`)
      fns[key] = async (payload: any) => {
        return new Promise(async (resolve, reject) => {
          // asyncLocalStorage.run(new Map(), async () => {
          // const store = asyncLocalStorage.getStore()
          // Set any required store values here

          try {
            const result = await fn.call(manager, ...payload.args)
            // debugger

            // TODO Now we need to serialise result
            // console.log({ result })
            if (Array.isArray(result)) {
              const res = result.map(serialiseResult)
              return resolve(res)
            }
            const res = serialiseResult(result)
            return resolve(res)
          } catch (e) {
            console.error(e)
            reject(e)
          }
          // });
          // });
        })
      }
    }
  }

  const server = startWSServer(port, {
    functions: fns,
  })

  pubSub.provideValue('entityManagersChannel', name)
  return server
}
