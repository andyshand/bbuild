import { ComponentProps, useCallback } from "react";
import { UploadProgress, useFile } from '../hooks/useFile';
import Dropzone from "./DropZone";
import { MdFileUpload } from 'react-icons/md'; // Importing icon from react-icons

const FileUploader = ({
  onFileStatusUpdate: onFilesUploaded,
  dropzoneProps,
  children,

}: {
  /**
   * ! Currently this will operate one file at a time
   */
  onFileStatusUpdate?: (files: { progress: number, file: File, id?: string }[]) => void
  dropzoneProps?: Omit<ComponentProps<typeof Dropzone>, 'onFilesReceived'>
  children?: React.ReactNode
}) => {
  const { upload } = useFile()

  const onFilesReceived = useCallback((f: File[]) => {
    if (!f) return;

    for (const file of f) {
      upload(file, ({ progress, completed, error }: UploadProgress) => {
        if (error) {
          console.error("Error uploading", error)
        } else if (completed) {
          onFilesUploaded?.([{ id: completed.id, progress: 100, file }])
        } else {
          onFilesUploaded?.([{ progress, file }])
        }
      })
    }
  }, [])

  const display = children ?? <div className="flex flex-col items-center justify-center h-full">
    <MdFileUpload /> {/* Using imported icon */}
    <div className="text-lg text-gray-400">
      Drop files here
    </div>
  </div>

  return <>
    <Dropzone onFilesReceived={onFilesReceived} {...dropzoneProps}>
      {display}
    </Dropzone>
  </>
}

export default FileUploader