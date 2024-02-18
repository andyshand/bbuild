import S3 from 'aws-sdk/clients/s3'
import { depFn, keyArg, keyDep } from 'modules/deps'
import { IEntityManager } from 'modules/entities/IEntityManager'
import { v4 as uuidv4 } from 'uuid'
import { deleteFileMetadata, getFileMetadata, saveFileMetadata } from './fileMetadata'
import { CreateFileParams, DeleteFileParams, ReadFileParams } from '../models/fileParams'

const readFile = depFn(
  {
    key: keyArg<string>('key'),
    r2: keyDep<S3>('r2'),
    s3Bucket: keyArg<string>('s3bucket'),
    entityManager: keyDep<IEntityManager>('entityManager'),
  },
  async function readFile({ key, r2, s3Bucket, entityManager }: ReadFileParams) {
    const fileMetadata = await getFileMetadata({ key, entityManager })
    const file = await r2
      .getObject({ Bucket: s3Bucket, Key: fileMetadata.reference })
      .promise()
    return file
  },
)

export const getFileUrl = depFn(
  {
    key: keyArg<string>('key'),
    r2: keyDep<S3>('r2'),
    s3Bucket: keyArg<string>('s3bucket'),
    entityManager: keyDep<IEntityManager>('entityManager'),
  },
  async function getFileUrl({ key, r2, s3Bucket, entityManager }: ReadFileParams) {
    const fileMetadata = await getFileMetadata({ key, entityManager })

    const params = {
      Bucket: s3Bucket,
      Key: fileMetadata.reference,
      Expires: 60 * 60,
      ContentType: fileMetadata.contentType,
    }

    const file = await r2.getSignedUrlPromise('getObject', params)
    return file
  },
)

const deleteFile = depFn(
  {
    key: keyArg<string>('key'),
    r2: keyDep<S3>('r2'),
    s3Bucket: keyArg<string>('s3bucket'),
    entityManager: keyDep<IEntityManager>('entityManager'),
  },
  async function deleteFile({ key, r2, s3Bucket, entityManager }: DeleteFileParams) {
    const fileMetadata = await getFileMetadata({ key, entityManager })
    await r2.deleteObject({ Bucket: s3Bucket, Key: fileMetadata.reference }).promise()
    await deleteFileMetadata({ key, entityManager })
    return 'ok'
  },
)

const createFile = depFn(
  {
    filename: keyArg<string>('filename'),
    size: keyArg<number>('size'),
    contentType: keyArg<string>('contentType'),
    author: keyArg<string>('author'),
    r2: keyDep<S3>('r2'),
    s3Bucket: keyDep<string>('s3Bucket'),
    entityManager: keyDep<IEntityManager>('entityManager'),
  },
  async function createFile({
    filename,
    size,
    contentType,
    author,
    r2,
    s3Bucket,
    entityManager,
  }: CreateFileParams) {
    const fileId = uuidv4()
    const reference = fileId

    const params = {
      Bucket: s3Bucket,
      Key: reference,
      Expires: 60 * 60,
      ContentType: contentType,
    }

    // Save metadata to the entity manager
    const key = await saveFileMetadata({
      reference,
      author,
      created: new Date().toISOString(),
      contentType,
      fileName: filename,
      size,
      uploaded: false,
      entityManager,
    })

    const signedUrl = await r2.getSignedUrlPromise('putObject', { ...params })

    return { key, reference }
  },
)

export { createFile, readFile, deleteFile }
