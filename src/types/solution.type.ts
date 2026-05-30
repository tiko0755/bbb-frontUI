// solution.type.ts
import { T_State, BlocksState, BlockState, BlockDef, T_BlockArgs0, BlockCodeDef } from '@/utils/iBlockly.types';

export interface WorkspaceDef {
  toolbox?: any|null;    // 工具箱
  state: T_State;  // workspace 的系列化
  code: string;       // 代码文本
  blocks: BlockCodeDef[];  // 预留代码块
}

export interface Solution {
  id: string;
  label: string;
  children?: Solution[];
  content?: WorkspaceDef;
  class?: string;
  important?: boolean;
}

export interface SolutionStoreState {
  messages: string[];
  notifications: unknown[];
  connectionError: string | null;
  solutions: Solution[];
  currentSolutionName: string;
  focusID: string;
//  workSpaceID: string;
  blocks: BlockCodeDef[];
  role?: string;
}






export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
}