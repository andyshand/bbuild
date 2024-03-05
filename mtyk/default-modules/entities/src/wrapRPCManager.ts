import { pubSub } from 'modules/rpc-ws/central/client'
import startWSServer, { FunctionMap } from 'modules/rpc-ws/server'
import { getPortForName } from 'modules/transport/index'
// import asyncLocalStorage from './asyncLocalStorage';
import { Observable, map } from 'rxjs'

import { publicInvariant } from 'modules/errors/index'
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

function callAuthed(
  method: string,
  args: any[],
  userId: string | null,
  manager: IEntityManager
) {
  if (method === 'find' || method === 'findIds') {
    let [entityType, query, opts] = args as Parameters<IEntityManager['find']>

    if (query.id === 'me') {
      query = { id: userId }
    } else {
      query['$or'] = [{ owner: userId }, { collaborators: userId }]
    }

    return manager[method](entityType, query, opts)
  } else if (method === 'read') {
    // Get the doc first, then check if the user is allowed to read it
    let [entityType, id] = args as Parameters<IEntityManager['read']>
    if (id === 'me') {
      publicInvariant(userId, 'User id is required for this operation')
      id = userId
    }
    return manager.read(entityType, id).then((doc) => {
      if (doc.owner === userId || (doc.collaborators ?? []).includes(userId)) {
        return doc
      }
      throw new Error('Not authorised to read this doc')
    })
  }
  return manager[method](...args)
}

export default function createManagerRPCServer(
  manager: IEntityManager,
  name: string,
  {
    fetchUserIdFromAuthToken,
  }: {
    fetchUserIdFromAuthToken?: (authToken: string) => Promise<string | null>
  } = {}
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
          try {
            let result

            if (fetchUserIdFromAuthToken) {
              publicInvariant(
                payload.auth?.token,
                'Auth token is required for this operation'
              )

              // Fetch the user id associated with the auth_token
              const userIdOrNull = await fetchUserIdFromAuthToken(
                payload.auth.token
              )

              // Modify the arguments to include the user id in owner or collaborators
              result = await callAuthed(
                key,
                payload.args,
                userIdOrNull,
                manager
              )
            } else {
              result = await fn.call(manager, ...payload.args)
            }

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
        })
      }
    }
  }

  const path = `/ws/entities/${name}`
  const server = startWSServer(path, {
    functions: fns,
  })

  pubSub.provideValue('entityManagersChannel', path)
  return server
}
