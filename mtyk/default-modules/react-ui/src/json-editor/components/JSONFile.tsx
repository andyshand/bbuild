import { ChangeEvent } from 'react'
import { useJSONContext } from './JSONEditor'
import { JSONValueProps } from './JSONValue'

export function JSONFile({ value, className, path, diff }: JSONValueProps) {
  const { handleChange } = useJSONContext()
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleChange(path, event.target.value)
  }
  return null
  // const ctx = useAdminContext()
  // return (
  //   <div>
  //     <ImageUpload
  //       location={path.join('.') + ctx.selectedItem.item?._id}
  //       onRemove={() => {
  //         handleChange(path, null)
  //       }}
  //       value={value}
  //       onChange={(val) => {
  //         handleChange(path, val)
  //       }}
  //     />
  //   </div>
  // )
}
