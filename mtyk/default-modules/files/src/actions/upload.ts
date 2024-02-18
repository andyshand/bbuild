import S3, { CompletedPart, UploadPartRequest } from 'aws-sdk/clients/s3'
import { depFn } from 'modules/deps'
import { keyArg, keyDep } from 'modules/deps/tokenDep'
import { IEntityManager } from 'modules/entities/IEntityManager'
import { publicInvariant } from 'modules/errors/index'
import { deleteFileMetadata, getFileMetadata, updateFileMetadata } from './fileMetadata'
import {
  BeginMultipartUploadParams,
  CancelMultipartUploadParams,
  CompleteMultipartUploadParams,
  MultipartUploadParams,
} from '../models/uploadParams'

export const completeUpload = depFn(
  {
    parts: keyArg<CompletedPart>('parts'),
    uploadId: keyArg<string>('uploadId'),
    key: keyArg<string>('key'),
    reference: keyArg<string>('reference'),
    r2: keyDep<S3>('r2'),
    s3Bucket: keyDep<string>('s3Bucket'),
    entityManager: keyDep<IEntityManager>('entityManager'),
  },
  async function completeUpload({
    parts,
    uploadId,
    key,
    reference,
    r2,
    s3Bucket,
    entityManager,
  }: CompleteMultipartUploadParams) {
    const command: S3.Types.CompleteMultipartUploadRequest = {
      Bucket: s3Bucket,
      MultipartUpload: { Parts: parts },
      Key: reference,
      UploadId: uploadId,
    }

    const data = await r2!.completeMultipartUpload(command).promise()
    publicInvariant(!!data.Location, 'No location returned from S3')

    var record = await getFileMetadata({ key, entityManager })
    await updateFileMetadata({ key, data: { uploaded: true }, entityManager })

    return { ...record.draft, uploaded: true }
  },
)

export const cancelUpload = depFn(
  {
    uploadId: keyArg<string>('uploadId'),
    key: keyArg<string>('key'),
    reference: keyArg<string>('reference'),
    r2: keyDep<S3>('r2'),
    s3Bucket: keyDep<string>('s3Bucket'),
    entityManager: keyDep<IEntityManager>('entityManager'),
  },
  async function cancelUpload({
    uploadId,
    key,
    reference,
    r2,
    s3Bucket,
    entityManager,
  }: CancelMultipartUploadParams) {
    const command: S3.Types.AbortMultipartUploadRequest = {
      Bucket: s3Bucket,
      Key: reference,
      UploadId: uploadId,
    }

    await r2!.abortMultipartUpload(command).promise()
    await deleteFileMetadata({ key, entityManager })

    return 'ko'
  },
)

export const beginUpload = depFn(
  {
    reference: keyArg<string>('reference'),
    contentType: keyArg<string>('contentType'),
    r2: keyDep<S3>('r2'),
    s3Bucket: keyDep<string>('s3Bucket'),
    entityManager: keyDep<IEntityManager>('entityManager'),
  },
  async function beginUpload({
    reference,
    contentType,
    r2,
    s3Bucket,
  }: BeginMultipartUploadParams) {
    console.log({ reference, contentType })
    const command: S3.Types.CreateMultipartUploadRequest = {
      Bucket: s3Bucket,
      Key: reference,
      ContentType: contentType,
    }
    const result = await r2!.createMultipartUpload(command).promise()
    console.log(result)
    return { uploadId: result.UploadId }
  },
)

export const uploadPart = depFn(
  {
    reference: keyArg<string>('reference'),
    part: keyArg<string>('part'),
    partId: keyArg<number>('partId'),
    uploadId: keyArg<string>('uploadId'),
    r2: keyDep<S3>('r2'),
    s3Bucket: keyArg<string>('s3Bucket'),
  },
  async function uploadPart({
    reference,
    part: _base64Part,
    partId,
    uploadId,
    r2,
    s3Bucket,
  }: MultipartUploadParams) {
    const bodyBuffer = Buffer.from(_base64Part, 'base64')
    const command: S3.Types.UploadPartRequest = {
      Body: bodyBuffer,
      Bucket: s3Bucket,
      Key: reference,
      PartNumber: partId,
      UploadId: uploadId,
    }

    return { etag: (await r2!.uploadPart(command).promise()).ETag }
  },
)
