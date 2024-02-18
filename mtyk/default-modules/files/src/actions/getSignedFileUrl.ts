import { depFn, keyArg, keyDep, typeDep } from 'modules/deps'
import { publicInvariant } from 'modules/errors/index'
import FileEntity from '../entities/FileEntity'

export default depFn(
  {
    fileId: keyArg<string>('fileId'),
    expiresHours: typeDep(Number, { optional: true }),
    entityManager: keyDep<any>('entityManager'),
    s3: keyDep<any>('s3'),
  },
  async function generateSignedUrl({ fileId, s3, entityManager, expiresHours }) {
    const file = await entityManager.read(FileEntity, fileId)
    publicInvariant(!!file, 'File not found')

    const { key } = file

    const signedUrlParams = {
      // Bucket:  'mtyk-agent-files',
      Bucket: 'andyshand',
      Key: key,
      Expires: expiresHours ?? 60 * 60 * 24, // 24 hours,
      ResponseContentDisposition: `attachment; filename="${file.fileName}"`,
    }

    const signedUrl = await s3.getSignedUrlPromise('putObject', signedUrlParams)

    return signedUrl
  },
)
