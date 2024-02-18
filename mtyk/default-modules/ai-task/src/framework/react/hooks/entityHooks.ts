import { useDeps } from 'modules/deps-react/index'
import { keyDep } from 'modules/deps/tokenDep'

export const useEntity = (...args: any[]) => {
  const { value: useEntity } = useDeps({ value: keyDep<any>('useEntity') })
  return useEntity(...args)
}

export const useEntities = (...args: any[]) => {
  const { value: useEntities } = useDeps({
    value: keyDep<any>('useEntities'),
  })
  return useEntities(...args)
}
