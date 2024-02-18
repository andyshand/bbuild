import { CreateFileClientParams } from 'modules/files/models/fileParams'
import {
  BeginMultipartUploadParams,
  CompleteMultipartUploadParams,
  MultipartUploadParams,
} from 'modules/files/models/uploadParams'
import { call } from '../rpc/client'

// const defaultS3Bucket = process.env.FILES_S3_BUCKET ?? 'mtyk-containers-files'
const defaultS3Bucket = 'andyshand'

export type UploadProgress = any & {
  progress: number
  completed: any
  error: Error
}

export const useFile = (key?: string, bucket?: string) => {
  const s3Bucket = bucket ?? defaultS3Bucket

  const upload = (file: File, onUploadProgress: ({ progress }: UploadProgress) => void) => {
    if (key) throw new Error('File already present. Use new reference to upload another file')

    var reference: string

    const _up = async (file: File) => {
      try {
        const createFileParams: CreateFileClientParams = {
          filename: file.name,
          size: file.size,
          contentType: file.type,
          author: 'author1',
          s3Bucket,
        }

        const fileInfo = await call('createFile', createFileParams)
        key = fileInfo.key
        reference = fileInfo.reference

        const startUploadParams: BeginMultipartUploadParams = {
          reference,
          contentType: file.type,
          s3Bucket,
        }
        const { uploadId } = await call('beginUpload', startUploadParams)

        const partSize = 6 * 1024 * 1024 // 6MB, aws requires every part at least 5 mb
        const numParts = Math.ceil(file.size / partSize)
        const result = []

        const retryDelay = 1000 // 1 second
        const maxRetries = 3

        for (let i = 0; i < numParts; i++) {
          let retries = 0
          let success = false
          let cancelled = false

          while (!success && retries < maxRetries) {
            try {
              const start = i * partSize
              const end = Math.min(start + partSize, file.size)
              const partNumber = i + 1
              const blob = file.slice(start, end)
              const reader = new FileReader()

              const arrayBuffer = await new Promise((resolve, reject) => {
                reader.onloadend = () => {
                  resolve(reader.result)
                }
                reader.onerror = reject
                reader.readAsArrayBuffer(blob)
              })
              const base64 = Buffer.from(arrayBuffer as ArrayBuffer).toString('base64')

              const uploadParams: MultipartUploadParams = {
                part: base64,
                partId: partNumber,
                uploadId,
                reference,
                s3Bucket,
              }

              const { etag } = await call('uploadPart', uploadParams)
              result.push({ ETag: etag, PartNumber: partNumber })
              success = true

              onUploadProgress({ progress: partNumber / numParts })
            } catch (error) {
              console.error('Error uploading part:', error)
              retries++
              if (retries < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, retryDelay * retries))
              }
            }
          }

          if (cancelled) {
            // cancel on server
            return
          }

          if (!success) {
            console.error('Max retries reached for part', i)
            throw new Error('Max retries reached')
          }
        }

        onUploadProgress({ progress: 100 })

        console.log(`Completing uploads with parts`, result)
        const completeUploadParams: CompleteMultipartUploadParams = {
          parts: result,
          uploadId,
          key,
          reference,
          s3Bucket,
        }

        const uploadResult = await call('completeUpload', completeUploadParams)
        console.log({ uploadResult })
        onUploadProgress({ completed: { ...uploadResult, key } })
      } catch (e) {
        onUploadProgress({ error: e })
        console.log('Obtained error', e)
        console.log('Removing pending download', { key, s3Bucket })
        if (key && s3Bucket && reference)
          await call('cancelUpload', { key, reference, s3Bucket })
      }
    }

    _up(file)
  }

  const assertKey = () => {
    if (!key) throw new Error('Reference not created, upload a file to get a reference')
  }

  const metadata = async () => {
    assertKey()
    return await call('getFileMetadata', { key })
  }

  const url = async () => {
    assertKey()
    return await call('getFileUrl', { key, s3Bucket })
  }

  const deleteFile = async () => {
    assertKey()
    return await call('deleteFile', { key, s3Bucket })
  }

  return { upload, metadata, url, deleteFile }
}
