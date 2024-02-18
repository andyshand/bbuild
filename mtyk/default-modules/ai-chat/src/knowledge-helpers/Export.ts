
export type File = {
  path: string;
  contents: string;
  modified: Date;
  language: string;
  fileName: string;
  exports: Export[];
  imports: Import[];
};
export type Symbol = {
  type: 'variable' | 'function' | 'react-component' | 'other' | 'class';
};
export type Export = {
  name: string;
  symbol: Symbol;
};
export type Import = {
  name: string;
  symbol: Symbol;
  path: string;
};
