import { createFile } from './actions/file'
import {
  deleteFileMetadata,
  getFileMetadata,
  saveFileMetadata,
  updateFileMetadata,
} from './actions/fileMetadata'
import FileEntity from './entities/FileEntity'

export const accountid = process.env.CLOUDFLARE_ACCOUNT_ID
export const access_key_id = process.env.CLOUDFLARE_ACCESS_KEY_ID
export const access_key_secret = process.env.CLOUDFLARE_ACCESS_KEY_SECRET

// export { readFile, createFile, deleteFile }
export {
  createFile,
  deleteFileMetadata,
  getFileMetadata,
  saveFileMetadata,
  updateFileMetadata,
}
// export { completeMultipartUpload }
export { FileEntity }
