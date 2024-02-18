import { depFn, keyArg, keyDep, typeDep } from 'modules/deps'
import { publicInvariant } from 'modules/errors/index'
import FileEntity from '../entities/FileEntity'
import { IEntityManager } from 'modules/entities/IEntityManager'

const getFileMetadata = depFn(
  {
    key: keyArg<string>('key'),
    entityManager: keyDep<IEntityManager>('entityManager'),
  },
  async function ({ key, entityManager }) {
    return await entityManager.read(FileEntity, key)
  },
)

const saveFileMetadata = depFn(
  {
    reference: keyArg<string>('reference'),
    author: keyArg<string>('author'),
    created: keyArg<string>('created'),
    contentType: keyArg<string>('contentType'),
    fileName: keyArg<string>('fileName'),
    size: keyArg<number>('size'),
    uploaded: keyArg<boolean>('uploaded'),
    entityManager: keyDep<IEntityManager>('entityManager'),
  },
  async function ({
    reference,
    author,
    created,
    contentType,
    fileName,
    size,
    uploaded,
    entityManager,
  }) {
    const record = await entityManager.create(FileEntity, {
      reference,
      author,
      created,
      contentType,
      fileName,
      size,
      uploaded,
    })
    return record.id
  },
)

const updateFileMetadata = depFn(
  {
    key: keyArg<string>('key'),
    data: keyArg<any>('data'),
    entityManager: keyDep<IEntityManager>('entityManager'),
  },
  async function ({ key, data, entityManager }) {
    console.log('Uploading entity', key, data)
    await entityManager.update(FileEntity, key, data)
  },
)

const deleteFileMetadata = depFn(
  {
    key: keyArg<string>('key'),
    entityManager: keyDep<IEntityManager>('entityManager'),
  },
  async function ({ key, entityManager }) {
    return await entityManager.delete(FileEntity, key)
  },
)

export { getFileMetadata, saveFileMetadata, updateFileMetadata, deleteFileMetadata }
