import { globalDepContext } from "modules/deps/createDepContext"
import { keyDep } from "modules/deps/tokenDep"

const FileDisplay = ({ id }: { id: string }) => {
  const { globalHooks } = globalDepContext.provideSync({ globalHooks: keyDep('globalHooks') })
  const { useEntity } = globalHooks
  const file = useEntity('FileEntity', id)

  if (!file) {
    return null
  }

  const fileExtension = file.fileName.split('.').pop()
  return <>
    {['jpeg', 'jpg', 'png', 'svg'].includes(fileExtension) ? (
      <img src={file.generateUrl()} alt={file.fileName} />
    ) : (
      null
    )}
  </>
}

export default FileDisplay