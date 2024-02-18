import S3 from 'aws-sdk/clients/s3'
import { globalDepContext } from 'modules/deps'
import { accountid, access_key_id, access_key_secret } from '.'

let s3: S3 | undefined

export const registerR2 = async () => {
  if (process.env.FILES_S3_ACCESS_KEY_ID) {
    const { FILES_S3_ACCESS_KEY_ID, FILES_S3_ACCESS_KEY_SECRET, FILES_S3_REGION } = process.env
    s3 = new S3({
      credentials: {
        accessKeyId: FILES_S3_ACCESS_KEY_ID!,
        secretAccessKey: FILES_S3_ACCESS_KEY_SECRET!,
      },
      region: FILES_S3_REGION ?? 'eu-west-1',
    })
  } else {
    s3 = new S3({
      region: 'auto',
      endpoint: `https://${accountid}.r2.cloudflarestorage.com`,
      accessKeyId: `${access_key_id}`,
      secretAccessKey: `${access_key_secret}`,
      signatureVersion: 'v4',
    })
  }

  globalDepContext.add({
    token: 'r2',
    value: s3,
  })
  console.log('R2 registered')
}

export function getS3() {
  if (!s3) {
    throw new Error('R2 not registered')
  }
  return s3
}
