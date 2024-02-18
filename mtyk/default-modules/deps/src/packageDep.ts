import { PackageDepSpec } from './TokenDepSpec';

export type PackageType<Package> = Package extends keyof CustomTypeMappings ? CustomTypeMappings[Package] : Package

interface CustomTypeMappings {

}

export const packageDep = <T>(p?: T) => {
  // If no token provided, should use from path of dep spec object
  return { package: p, specType: 'package' } as PackageDepSpec<T, any>
}
