import { addWSFunction } from 'modules/rpc-ws/server'
import { createFile, deleteFile, getFileUrl } from '../actions/file'
import { getFileMetadata } from '../actions/fileMetadata'
import { beginUpload, cancelUpload, completeUpload, uploadPart } from '../actions/upload'

export const registerRpcCalls = () => {
  addWSFunction('createFile', createFile)
  addWSFunction('beginUpload', beginUpload)
  addWSFunction('uploadPart', uploadPart)
  addWSFunction('completeUpload', completeUpload)
  addWSFunction('cancelUpload', cancelUpload)
  addWSFunction('getFileMetadata', getFileMetadata)
  addWSFunction('deleteFile', deleteFile)
  addWSFunction('getFileUrl', getFileUrl)
}
