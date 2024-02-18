import { Observable } from 'rxjs'
import { scan } from 'rxjs/operators'

export function reducer<T, R>(
  initialState: T,
  reducer: (state: T, action: R) => T
) {
  return function (source: Observable<R>): Observable<T> {
    return source.pipe(
      scan((state: T, action: R) => reducer(state, action), initialState)
    )
  }
}

// // Define the initial state
// const initialState = { count: 0 }

// // Define the reducer function
// function reducer(state: any, action: any) {
//   switch (action.type) {
//     case 'increment':
//       return { count: state.count + 1 }
//     case 'decrement':
//       return { count: state.count - 1 }
//     default:
//       return state
//   }
// }

// // Create an observable of actions
// const actions$ = from([
//   { type: 'increment' },
//   { type: 'increment' },
//   { type: 'decrement' },
//   { type: 'unknown' },
//   { type: 'increment' },
// ])

// // Apply the reduxReducer operator
// const state$ = actions$.pipe(reduxReducer(initialState, reducer))

// // Subscribe to the state changes
// state$.subscribe(state => console.log(state))

// // Output:
// // { count: 1 }
// // { count: 2 }
// // { count: 1 }
// // { count: 1 }
// // { count: 2 }
