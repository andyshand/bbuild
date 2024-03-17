import { useJSONContext } from './JSONEditor'

export const usePathErrors = (path: (string | number)[]) => {
  const { errors } = useJSONContext()
  const errorsForThis = errors.filter((e) => path.every((p, i) => p === e.path[i]))
  return errorsForThis
}
