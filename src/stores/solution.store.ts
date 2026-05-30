import { defineStore } from "pinia";
import socketService from "../services/socket.service";
import { WorkspaceDef, Solution, SolutionStoreState, ApiResponse } from '@/types/solution.type';
import { T_State, BlocksState, BlockState, BlockDef, T_BlockArgs0, BlockCodeDef } from '@/utils/iBlockly.types';
import { make_template_blocks, make_blocks_state, } from '@/utils/iBlocklyHelper';

const urlObj = new URL(import.meta.url);
const fileName = urlObj.pathname.split("/").pop();
 
const loopNodeByID = (head: Solution|undefined, nodeID: string): Solution|undefined => {
  if(head === undefined){  return undefined;  }
  if(head.id === nodeID){  return head;  }
  if(head.children){
    for(const node of head.children){
      const rslt = loopNodeByID(node, nodeID);
      if(rslt){  return rslt;  }
    }
  }
  return undefined;
}

const loopNodeByLabel = (head: Solution|undefined, label: string): Solution|undefined => {
  if(head === undefined){  return undefined;  }
  if(head.label === label){  return head;  }
  if(head.children){
    for(const node of head.children){
      const rslt = loopNodeByLabel(node, label);
      if(rslt){  return rslt;  }
    }
  }
  return undefined;
}

// const loopBlockByID = (head: Solution|undefined, nodeID: string): WorkspaceDef|undefined => {
//   if(head === undefined){  return undefined;  }
//   if(head.id === nodeID){  return head.content;  }
//   if(head.children){
//     for(const node of head.children){
//       const rslt = loopBlockByID(node, nodeID);
//       if(rslt){  return rslt;  }
//     }
//   }
//   return undefined;
// }
const loopBlockByID = (head: Solution|undefined, nodeID: string): WorkspaceDef|undefined => {
  const node = loopNodeByID(head, nodeID);
  if(node){  return node.content;  }
  return undefined;
}

const loopSolutionByID = (solutions: Solution[], id: string): Solution|undefined => {
  for(const itm of solutions){
    if(itm.id === id){  return itm;  }
    const node = loopNodeByID(itm, id);
    if(node){  return itm;  }
  }
  return undefined;
}


export const useSolutionStore = defineStore("solution", {
  state: (): SolutionStoreState => ({
    messages: [],
    notifications: [],
    connectionError: null,
    solutions: [],
    blocks: [],
    currentSolutionName: "",
    focusID: ""
  }),
  getters: {
    currentSolution: (state: SolutionStoreState) => {
      for(const solution of state.solutions){
        if(solution.label === state.currentSolutionName){
          return solution;
        }
      }
      return undefined;
    },
    // 当前焦点所在的工程的ID
    forcusSolutionID: (state: SolutionStoreState): string|undefined => {
      const solution = loopSolutionByID(state.solutions, state.focusID);
      return (solution ? solution.id : undefined)
    },
    isConnected: (state: SolutionStoreState) => {
      return socketService.socket.connected;
    }
  },
  actions: {

    initializeSocketListeners(): void {
      console.log(`<${fileName} initializeSocketListeners >`);
      if (socketService.socket.connected) {
        console.log("solution.store.initializeSocketListeners connected");
        socketService.socket.emit("solution.initial", { role: "operator"});
      }

      socketService.socket.on("connect", () => {
        console.debug("solution.socket.id", socketService.socket.id);
      });

      socketService.socket.on("connect_error", (error: { message: string }) => {
        console.debug("connect_error:", error);
      });

    },

    sendMessage(message: unknown): void {
      console.log("do sendMessage");
      if (this.isConnected) {
        socketService.socket.emit("send-message", message);
      }
    },

    downloadAllSolutions(): Promise<unknown> {
      return new Promise((resolve, reject) => {
        if (this.isConnected === false) {
          reject({
            status: "error",
            message: "服务器未连接"
          });
          return;
        }
        socketService.socket.once("allsolutions", (data: string) => {
          const obj = JSON.parse(data);
          console.log('downloadAllSolutions.obj:', obj);
          /* {
            status: "success",
            current_solution_name: string,
            solutions: array<string>,
            blocks: array<any>
          }
          */
          if(obj?.status !== "success"){
            reject({
              status: "error",
              message: obj?.message || "服务器异常"
            });
            return;
          }
          this.solutions = obj.solutions;
          this.blocks = obj.blocks;
          this.currentSolutionName = obj.current_solution_name;
          resolve({
            status: "success"
          });
        });
        socketService.socket.emit("allsolutions");
      });
    },

    activeSolution(id: string): Promise<ApiResponse<null>> {
      console.log("activeSolution id:", id);
      return new Promise((resolve, reject) => {
        if (this.isConnected === false) {
            reject({
              status: "error",
              message: "服务器未连接"
            });
            return;
        }
        socketService.socket.once("activesolution", (data: string) => {
          //console.log('activeSolution.once data:', data);
          const obj = JSON.parse(data);
          console.log('activesolution.obj:', obj);
          const solution = loopSolutionByID(this.solutions, id);
          if(solution && solution.label){
            this.currentSolutionName = solution.label;
            resolve({
              success: true
            });
          }
          else{
            reject({
              success: false,
              message: "服务器返回的数据不可用"
            });
          }
        });
        socketService.socket.emit("activesolution", id);
      });
    },

    uploadSolution(id: string|undefined): Promise<ApiResponse<null>> {
      return new Promise((resolve, reject) => {
        if(id === undefined){
            reject({
              succeess: false,
              message: "id不能是undefined"
            });
            return;
        }
        if (this.isConnected === false) {
            reject({
              success: false,
              message: "服务器未连接"
            });
            return;
        }
        socketService.socket.once("uploadsolution", (data: unknown) => {
          resolve({  success: true  });
        });
        socketService.socket.emit("uploadsolution", id);
      });
    },

    cloneAsFreshSolution(freshRepo: string): Promise<unknown> {
      return new Promise((resolve, reject) => {
        if (this.isConnected === false) {
            reject({
              status: "error",
              message: "服务器未连接"
            });
            return;
        }
        socketService.socket.once("cloneasfreshsolution", (data: unknown) => {
          resolve(data);
        });
        socketService.socket.emit("cloneasfreshsolution", { srcRepo: this.currentSolutionName, freshRepo });
      });
    },

    setFocusID(id: string){
      this.focusID = id;
    },

    setBlocklyConf(id: string, workspace: any): Promise<ApiResponse<null>> {
      console.log('setBlocklyConf.node workspace:', workspace);
      return new Promise((resolve, reject) => {
        const solution = loopSolutionByID(this.solutions, id);
        const node = loopBlockByID(solution, id);
        if(node === undefined){
          console.error(`<${fileName} 未能识别到当前 solution 中的 block >`);
          reject(new Error("未能识别到当前 solution 中的 block"));
          return;
        }

        let str0 = JSON.stringify(workspace);
        let str1 = JSON.stringify(node);
        if(str0 === str1){
          console.log("all the same");
          resolve({
            success: !!node,
            message: "do not change"
          });
          return;
        }

        if (this.isConnected === false) {
          console.error(`<${fileName} setWorkspace 未连接 >`);
          reject(new Error("未连接到服务器"));
          return;
        }
        if (this.currentSolution === undefined) {
          console.error(`<${fileName} 未能识别到当前的 solution >`);
          reject(new Error("未能识别到当前的 solution"));
          return;
        }

        console.log('setBlocklyConf.node before:', node);
        if (node) {
          if(workspace?.state){
            node.state = workspace.state;
          }
          if(workspace?.code){
            node.code = workspace.code;
          }
          if(workspace?.toolbox){
            node.toolbox = workspace.toolbox;
          }
          console.log('setBlocklyConf.node after:', node);
        }

        socketService.socket.once("updateworkspace", (data: unknown) => {
          resolve({
            success: !!node,
            message: "do change",
          });
        });
        socketService.socket.emit("updateworkspace", this.currentSolution);
      });
    },

    // 当前工作的 blockly workspace
    getWorkingSpace(workspaceID: string): Solution|undefined {
      const solution = loopSolutionByID(this.solutions, workspaceID);
      const node = loopNodeByID(solution, workspaceID);
      // 如果是 Connections, 预处理再输出
      if(node?.label === "Connections"){
        delete node.content?.toolbox;  // 没有toolbox
        if(node.content === undefined){
          node.content = {} as WorkspaceDef;
        }
        // 根据 DUT Template 和 Components 生成的 code 生产工作区
        const template_node = loopNodeByLabel(solution, "DUT Template");
        const component_node = loopNodeByLabel(solution, "Components");
        let template_code = "";
        if(template_node?.content){
          template_code = template_node.content.code;
        } 
        let component_code = "";
        if(component_node?.content){
          component_code = component_node.content.code;
        } 
        
        // 根 template 和 component 组件的代码生成所需要的终端
        node.content.blocks = make_template_blocks(template_code, component_code);
        // 从加载的块定义中提取控制板的块(以"ctrlb_"开头的板子)
        const controlBoards = [];
        for(const blockD of this.blocks){
          if(blockD.block.type.indexOf("ctrlb_") === 0){
            controlBoards.push(blockD);
          }
        }
        // 生成连接关系的工作区
        node.content.state = make_blocks_state(node.content.blocks, controlBoards);
      }
      return node;
    },


    disconnect(): void {
      socketService.disconnect();
    },






  },
});