import { Constructor } from 'modules/types'

export type EntityTypable<T = any> = string | Constructor<T>
