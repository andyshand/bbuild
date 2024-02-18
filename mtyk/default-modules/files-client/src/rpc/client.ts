import RPCClient from 'modules/rpc-ws/client'
import { firstValueFrom } from 'rxjs'

export const call = async (name: string, payload: any): Promise<any> => {
  const rpcclient = RPCClient.getSingleton()
  try {
    console.log(`Invoking rpc ${name}`, payload)
    return await firstValueFrom(rpcclient.callFunction(name, payload))
  } catch (e) {
    console.error(`Error invoking rpc ${name}`, e)
    throw e
  }
}
