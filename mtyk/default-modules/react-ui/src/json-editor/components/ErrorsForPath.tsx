import { usePathErrors } from './usePathErrors'

export function ErrorsForPath({ path }: { path: (string | number)[] }) {
  const errorsForThis = usePathErrors(path)

  return (
    <div className="text-red-500 text-xs space-y-1">
      {errorsForThis.map((e) => (
        <div key={JSON.stringify(e)}>{e.message}</div>
      ))}
    </div>
  )
}
