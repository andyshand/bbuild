import { IDisposable, StateContext } from './StateMachineTransitions';

export type TransitionStatus = 'IDLE' | 'IN_PROGRESS';

export type Opts<TGlobalState> = {
  initialState?: any;
  initialContext?: StateContext;
  initialStateDisposable?: IDisposable;
  globalState: TGlobalState;
  priorities?: Record<string, number>;
};
