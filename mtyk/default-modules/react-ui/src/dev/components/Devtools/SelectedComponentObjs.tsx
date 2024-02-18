import { stringify } from 'flatted';
import { omit } from 'modules/dash/index';
import React from 'react';
import { ParentHierarchy } from './ParentHierarchy';

interface SelectedComponentObjsProps {
  selectedComponentObjs: ParentHierarchy[];
}
export const SelectedComponentObjs: React.FC<SelectedComponentObjsProps> = ({ selectedComponentObjs }) => {
  return (
    <>
      {selectedComponentObjs
        .filter((a) => false)
        .map((obj) => {
          const findHooksType = (el) => {
            if (!el) {
              return { owner: null, hooks: [] };
            }
            if (el._debugHookTypes) {
              return { owner: el, hooks: el._debugHookTypes ?? [] };
            }
            return findHooksType(el._debugOwner);
          };
          const { owner, hooks } = findHooksType(obj.info) ?? [];

          return (
            <div key={obj.id} className="">
              <div className="font-semibold text-gray-800 dark:text-gray-200">
                {obj.debugSource.fileName.split('/').slice(-1)}
                {hooks.map((h, i) => {
                  const findMemoizedState = (el, i2 = 0) => {
                    if (!el || !el.next) {
                      return null;
                    }

                    // keep getting .next from memoized state until i === i2 or .next is null
                    if (i === i2) {
                      return el;
                    }

                    return findMemoizedState(el.next, i2 + 1);
                  };

                  const state = findMemoizedState(owner.memoizedState);

                  const tryStringifyObject = (obj) => {
                    try {
                      return stringify(obj);
                    } catch (e) {
                      return e.message ?? 'error';
                    }
                  };

                  return (
                    <div key={h}>
                      <details>
                        <summary>{h}</summary>
                        <div>{tryStringifyObject(omit(state, ['next']))}</div>
                      </details>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
    </>
  );
};
