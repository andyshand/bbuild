import { depFn, globalDepContext, keyDep, typeDep } from 'modules/deps'
import EntityFunction from 'modules/entities/EntityFunction'
import { Deps } from '../Deps'
// import fs from 'fs'

// export class TestActions {
//   @EntityFunction()
//   makeDir = depFn({ path: keyDep<string>('path') }, async ({ path }) => {
//     console.log('makeDir', path)

//     // ... your server-side code
//     try {
//       // Using fs.mkdir with the recursive option will create all directories in the path if they don't exist
//       //@ts-ignore
//       await fs.mkdir(path, { recursive: true })
//       console.log(`Directory created at: ${path}`)
//     } catch (error) {
//       console.error(`Error creating directory: ${error}`)
//     }

//     // fs.mkdirSync(path, { recursive: true })
//   })

//   @EntityFunction()
//   getPath = depFn({ path: Deps.path }, ({ path }) => {
//     return process.cwd()
//   })
// }

import { addWSFunction } from 'modules/rpc-ws/server'

const testFunct = depFn({}, async function testFunct() {
  console.log('testFuncttestFuncttestFuncttestFuncttestFunct')
  console.log('testFuncttestFuncttestFuncttestFuncttestFunct')
  console.log('testFuncttestFuncttestFuncttestFuncttestFunct')
  console.log('testFuncttestFuncttestFuncttestFuncttestFunct')
  console.log('testFuncttestFuncttestFuncttestFuncttestFunct')
  console.log('testFuncttestFuncttestFuncttestFuncttestFunct')

  return null
})

export default addWSFunction(testFunct)
