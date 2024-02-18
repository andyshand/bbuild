import { uniqBy } from 'modules/dash'
import { ParentHierarchy } from './ParentHierarchy'

const getParentHierarchyRecursive = (
  element: HTMLElement | null,
  parents: ParentHierarchy[] = []
): ParentHierarchy[] | null => {
  if (!element) {
    return uniqBy(parents, 'id').reverse()
  }

  const fiberProp = Object.keys(element).find((prop) =>
    prop.includes('reactFiber')
  )
  if (fiberProp) {
    const debugSource = element[fiberProp]._debugSource
    const debugOwner = element[fiberProp]._debugOwner
    if (debugSource) {
      if (!element[fiberProp]._debugSource.fileName.includes('node_modules')) {
        parents.push({
          fiberProp,
          info: element[fiberProp],
          parent: element as HTMLElement,
          debugSource,
          id: JSON.stringify(debugSource.fileName),
        })
      } else {
        // ???
      }
    } else {
      if (debugOwner) {
        if (debugOwner._debugSource) {
          if (debugOwner.child) {
            parents.push({
              fiberProp,
              info: element[fiberProp],
              parent: debugOwner.child.stateNode as HTMLElement,
              debugSource: debugOwner._debugSource,
              id: JSON.stringify(debugOwner._debugSource.fileName),
            })
          }
        }
        return getParentHierarchyRecursive(element.parentElement, parents)
      }
    }
  }

  return getParentHierarchyRecursive(element.parentElement, parents)
}

export const getParentHierarchy = (
  element: HTMLElement
): ParentHierarchy[] | null => {
  return getParentHierarchyRecursive(element)
}
