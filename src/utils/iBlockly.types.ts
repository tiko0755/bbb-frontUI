
export interface T_BlockArgs0 {
  type: string,
  name: string,
  text: string,
  value: number,
  check: string,
}

export interface BlockDef {
  type: string,
  message0: string,
  args0: T_BlockArgs0[],
  output: string,
  colour: number,
  tooltip: string,
  helpUrl: string,
}

export interface BlockCodeDef {
  block: BlockDef,
  generator: string[],
}

export interface BlockState {
  id: string,
  type: string,
  fields: any,
  x?: number,
  y?: number,
  next?: BlockState|undefined,
  inputs?: any[],
}

export interface BlocksState {
  languageVersion: number,
  blocks: BlockState[],
}

export interface T_State {
  blocks: BlocksState,
}
