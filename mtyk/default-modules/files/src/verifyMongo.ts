import FileEntity from './entities/FileEntity'
import MongoEntityManager from 'modules/entities/MongoEntityManager'

// const verifyMongo = async (e: MongoEntityManager) => {
//   var err = 1
//   await new Promise(async (resolve) => {
//     const wait = (timems: number) => new Promise((res) => setTimeout(() => res(null), timems))
//     var val = null

//     while (!val) {
//       try {
//         await new Promise((res, err) => {
//           try {
//             e.assertClientReady()
//             res(e)
//           } catch (e) {
//             err(e)
//           }
//         })
//         val = e
//         console.log('Mongo ready')
//       } catch (e) {
//         // nothing
//         console.log('Mongo not ready, trying again', err++)
//         await wait(1000)
//       }
//     }

//     resolve(null)
//   })

//   console.log('Connected to mongo')

//   const { id } = await e.create(FileEntity, {
//     contentType: 'contentType',
//     fileName: 'fileName',
//     size: 2123,
//     reference: 'reference',
//     author: 'author',
//     created: 'created',
//     uploaded: false,
//   })

//   console.log('Entity created with id', id)
//   var record = await e.read(FileEntity, id)
//   console.log('Entity retrieved', record)

//   await e.update(FileEntity, id, { uploaded: true }, undefined)
//   console.log('Entity updated with value', await e.read(FileEntity, id))
// }
