import { _removeAllMTYK } from './dockerode'

export type AllowedPackage = { name: string; version: string }

// Stable packages that are allowed to be installed. CJS compatible.
export const allowedPackages = [
  { name: 'express', version: '4.17.1' },
  { name: 'lodash', version: '4.17.21' },
  { name: 'axios', version: '0.21.1' },
  { name: 'moment', version: '2.29.1' },
  { name: 'react', version: '17.0.2' },
  { name: 'react-dom', version: '17.0.2' },
  { name: 'react-router-dom', version: '5.2.0' },
  { name: 'redux', version: '4.0.5' },
  { name: 'redux-thunk', version: '2.3.0' },
  { name: 'mongoose', version: '5.12.3' },
  { name: 'cors', version: '2.8.5' },
  { name: 'body-parser', version: '1.19.0' },
  { name: 'jsonwebtoken', version: '8.5.1' },
  { name: 'bcryptjs', version: '2.4.3' },
  { name: 'client-vector-search', version: '0.2.0' },
  { name: 'glob', version: '10.3.10' },
]

export { _removeAllMTYK }

export function findAllowedPackage(name: string): AllowedPackage | undefined {
  return allowedPackages.find((p) => p.name === name)
}
