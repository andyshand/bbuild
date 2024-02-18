const _ = require('lodash')

export const omit = _.omit
export const pick = _.pick
export const isEmpty = _.isEmpty
export const isNil = _.isNil
export const isFunction = _.isFunction
export const isObject = _.isObject
export const isArray = _.isArray
export const isString = _.isString
export const isNumber = _.isNumber
export const isBoolean = _.isBoolean
export const isDate = _.isDate
export const isRegExp = _.isRegExp
export const isPlainObject = _.isPlainObject
export const maxBy = _.maxBy
export const mapValues = _.mapValues
export const uniq = _.uniq
export const flatten = _.flatten
export const flattenDeep = _.flattenDeep
export const flattenDepth = _.flattenDepth
export const uniqBy = _.uniqBy
export const uniqWith = _.uniqWith
export const uniqByDeep = _.uniqBy
export const uniqWithDeep = _.uniqWith
export const union = _.union
export const unionBy = _.unionBy
export const unionWith = _.unionWith
export const intersection = _.intersection
export const intersectionBy = _.intersectionBy
export const intersectionWith = _.intersectionWith
export const difference = _.difference
export const differenceBy = _.differenceBy
export const differenceWith = _.differenceWith
export const zip = _.zip
export const zipObject = _.zipObject
export const zipObjectDeep = _.zipObject
export const unzip = _.unzip
export const unzipWith = _.unzipWith
export const fromPairs = _.fromPairs
export const chunk = _.chunk
export const compact = _.compact
export const concat = _.concat
export const pull = _.pull
export const pullAll = _.pullAll
export const pullAllBy = _.pullAllBy
export const pullAllWith = _.pullAllWith
export const pullAt = _.pullAt
export const remove = _.remove
export const reverse = _.reverse
export const slice = _.slice
export const sortedIndex = _.sortedIndex
export const sortedIndexBy = _.sortedIndexBy
export const sortedIndexOf = _.sortedIndexOf
export const sortedLastIndex = _.sortedLastIndex
export const sortedLastIndexBy = _.sortedLastIndexBy
export const sortedLastIndexOf = _.sortedLastIndexOf
export const sortedUniq = _.sortedUniq
export const sortedUniqBy = _.sortedUniqBy
export const tail = _.tail
export const take = _.take
export const takeRight = _.takeRight
export const takeRightWhile = _.takeRightWhile
export const takeWhile = _.takeWhile
export const unionByDeep = _.unionBy
export const unionWithDeep = _.unionWith
export const intersectionByDeep = _.intersectionBy
export const intersectionWithDeep = _.intersectionWith
export const differenceByDeep = _.differenceBy
export const differenceWithDeep = _.differenceWith
export const sortedIndexByDeep = _.sortedIndexBy
export const sortedLastIndexByDeep = _.sortedLastIndexBy
export const sortedUniqByDeep = _.sortedUniqBy
export const takeRightWhileDeep = _.takeRightWhile
export const takeWhileDeep = _.takeWhile
export const find = _.find as <T>(
  array: T[],
  predicate: (value: T) => boolean
) => T | undefined
export const findLast = _.findLast as <T>(
  array: T[],
  predicate: (value: T) => boolean
) => T | undefined
export const get = _.get
export const set = _.set
export const clone = _.clone
export const cloneDeep = _.cloneDeep
export const isEqual = _.isEqual
export const isEqualWith = _.isEqualWith
export const startCase = _.startCase
export const mode = <T>(arr: T[]): T | undefined => {
  if (arr.length === 0) {
    return undefined
  }
  const counts = _.countBy(arr)
  const max = _.max(Object.values(counts))
  const maxKey = Object.keys(counts).find((k) => counts[k] === max)
  return maxKey ? (maxKey as any) : undefined
}
export const mean = (arr: number[]): number | undefined => {
  if (arr.length === 0) {
    return undefined
  }
  let sum = 0
  for (const num of arr) {
    sum += num
  }
  return sum / arr.length
}
