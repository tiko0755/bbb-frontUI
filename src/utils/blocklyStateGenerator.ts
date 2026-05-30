/**
 * 块实例描述
 */
interface BlockInstance {
  id: string;           // 唯一标识，自动生成或用户指定
  type: string;         // 块类型，例如 'math_number'
  fields?: Record<string, any>;   // 字段值，例如 { NUM: 42 }
  x?: number;           // 可选坐标
  y?: number;
  inputs?: any;       // 输入值
  // 以下为内部生成时使用
  _shadow?: boolean;
  _outputConnection?: string;   // 如果该块有输出，记录连接到的目标输入名
  next?: {block: BlockInstance};
}

interface BlockState {
  block: BlockInstance
}

interface ValueInput {
  id: string,           // 唯一块标识,表明该输入值所隶属的块
  key: string,          // input 对应的 key
  series: string[],   // input 对应的 value, 它是一个块ID的连接系列
}

interface BlockSerial {
  blocks: BlockInstance[],  // 所用到的块实例
  series: string[][],       // series[0]是主线连接系列, 其他是 valueinput 的连接系列
  inputsMap: Map<string, ValueInput>, // valutInputs所对应的series
}


/**
 * 连接描述
 */
interface Connection {
  sourceBlockId: string;    // 源块 ID
  targetBlockId: string;    // 目标块 ID
  targetInputName: string;   // 目标块的输入名称（如 'A', 'DO'）
  // 对于语句块之间的 next/previous 连接，使用特殊输入名 'next' / 'previous'
}

/**
 * 工作区状态生成器
 * 用于自动生成包含块实例及连接关系的 Blockly 序列化状态
 */
export class BlocklyStateGenerator {
  private blocks: Map<string, BlockInstance> = new Map();
  public state: BlockSerial = {
    blocks: [],  // 所用到的块实例
    series: [],  // series
    inputsMap: new Map<string, ValueInput>(), // valutInputs所对应的series
  };

  constructor() {
    // 初始化代码
    console.log('BlocklyStateGenerator.constructor');
  }

  /**
   * 添加一个块的连接系列实例
   * @param type 块类型
   * @param options 可选配置
   * @returns 块 ID
   */
  addHeadBlock(
    x: number,
    y: number,
    type: string,
    options?: {
      fields?: Record<string, any>;
      shadow?: boolean;
    }
  ): string {
    const id = globalThis.crypto.randomUUID();  // globalThis.crypto 全局对象
    const block: BlockInstance = {
      id,
      type,
      fields: options?.fields || {},
      x: x,
      y: y,
      _shadow: options?.shadow || false,
    };
    
    const mainBranch: string[] = [];
    mainBranch.push(id);

    this.state.blocks.push(block);
    this.state.series.push(mainBranch);

    return id;
  }

  addNextBlock(
    sourceBlockID: string,
    type: string,
    options?: {
      fields?: Record<string, any>;
      shadow?: boolean;
    }
  ): string | undefined {
    const id = globalThis.crypto.randomUUID();  // globalThis.crypto 全局对象
    const block: BlockInstance = {
      id,
      type,
      fields: options?.fields || {},
      _shadow: options?.shadow || false,
    };

    // 先在 main 分支查找
    for(const serial of this.state.series){
      const index = serial.indexOf(sourceBlockID);
      if (index !== -1) {
        serial.splice(index + 1, 0, id);
        this.state.blocks.push(block);
        return id;
      }
    }
    // 在 valueInput 的分支查找
    for (const [key, value] of this.state.inputsMap) {
      console.log(key, value);
      for(const serial of value.series){
        const index = serial.indexOf(sourceBlockID);
        if (index !== -1) {
          value.series.splice(index + 1, 0, id);
          this.state.blocks.push(block);
          return id;
        }
      }
    }
    
    return undefined;
  }

  addValueBlock(
    sourceBlockID: string,
    inputKey: string,
    type: string,
    options?: {
      fields?: Record<string, any>;
      shadow?: boolean;
    }
  ): string | undefined {
    const id = globalThis.crypto.randomUUID();  // globalThis.crypto 全局对象
    const block: BlockInstance = {
      id,
      type,
      fields: options?.fields || {},
      _shadow: options?.shadow || false,
    };
    const inputNode: ValueInput = {
      id: sourceBlockID,      // 唯一块标识,表明该输入值所隶属的块
      key: inputKey,                // input 对应的 key
      series: [],                 // input 对应的 value, 它是一个块ID的连接系列
    }
    inputNode.series.push(id);
    this.state.inputsMap.set(`${sourceBlockID}.${inputKey}`, inputNode);
    this.state.blocks.push(block);

    return id;
  }


  /**
   * 构建 top-bottom 块陈述
   * @returns 符合 Blockly.serialization.workspaces.load 的对象
   */
  buildNext(serial: string[]) {
    let head:BlockInstance|undefined = undefined;
    let curr:BlockInstance|undefined = head;
    for(const id of serial){
      let found = false;
      for(const itm of this.state.blocks){
        if(itm.id === id){
          found = true;
          if(head === undefined){
            head = itm;
            curr = head;
            break;
          }
          if(curr){
            curr.next = {block: itm};
            curr = curr.next.block;
          }
          else{
            curr = itm;
          }
          break;
        }
      }
      if(found === false){
        console.log("在 blocks 列表中未能检索到 next id");
        return undefined;
      }
    }
    return head;
  }

  /**
   * 构建完整的工作区状态 JSON
   * @returns 符合 Blockly.serialization.workspaces.load 的对象
   */
  build(): any {
    const blocks = [];
    for(const serial of this.state.series){
      const blockState = this.buildNext(serial);
      console.log('blockState:', blockState);
      blocks.push(blockState);
    }

    // 对 inputsMap 进行扁平展开
    const valueState = new Map<string, any>();
    for(const [key, value] of this.state.inputsMap){
      const blockState = this.buildNext(value.series);
      if(blockState){
        const obj: Record<string, BlockState> = {};
        const block = blockState
        obj[value.key] = {
          block: blockState
        }

        if(valueState.has(value.id)){
          valueState.get(value.id)[value.key] = {block: blockState};
        }
        else{
          valueState.set(value.id, {  ...obj  });
        }
      }
    }

    // valueState的结构如下:
    //   new Map([
    //     [
    //         "537d0230-5cdf-4a5c-8bd0-f0fb79edd029",
    //         {
    //             "TEXT": {
    //                 "block": {
    //                     "id": "e6b18c84-18e1-42f7-a318-177f87ef805a",
    //                     "type": "text_replace",
    //                     "fields": {},
    //                     "_shadow": false
    //                 }
    //             }
    //         }
    //     ],
    //     [
    //         "e6b18c84-18e1-42f7-a318-177f87ef805a",
    //         {
    //             "TEXT": {
    //                 "block": {
    //                     "id": "2a62679b-dd65-4d4d-b192-1e14a350f892",
    //                     "type": "text",
    //                     "fields": {
    //                         "TEXT": "HELLO,CHINA"
    //                     },
    //                     "_shadow": false
    //                 }
    //             },
    //             "FROM": {
    //                 "FROM": {
    //                     "block": {
    //                         "id": "ee695be1-25bd-4b8d-b2d7-91dbfa7981c9",
    //                         "type": "text",
    //                         "fields": {
    //                             "TEXT": "CHINA"
    //                         },
    //                         "_shadow": false
    //                     }
    //                 }
    //             },
    //             "TO": {
    //                 "TO": {
    //                     "block": {
    //                         "id": "9bcae938-5760-4aff-ac6f-b21fe6bb2d54",
    //                         "type": "text",
    //                         "fields": {
    //                             "TEXT": "WORLD"
    //                         },
    //                         "_shadow": false
    //                     }
    //                 }
    //             }
    //         }
    //     ],
    //     [
    //         "23f312c8-81b7-41df-9bdc-db4001bf22fa",
    //         {
    //             "TEXT": {
    //                 "block": {
    //                     "id": "191adeae-df31-4277-8994-b82276a00ff2",
    //                     "type": "text",
    //                     "fields": {
    //                         "TEXT": "123"
    //                     },
    //                     "_shadow": false
    //                 }
    //             }
    //         }
    //     ]
    // ])

    const getLeafBlock = (blockObj: { block: BlockInstance }, valBlocks: any[]) => {
      const blockInst = (blockObj as { block: BlockInstance }).block;
      if(blockInst?.inputs){
        for(const itm of blockInst.inputs){
          Object.values(itm).forEach(val => {
            getLeafBlock(val as { block: BlockInstance }, valBlocks);
          })
        }
      }
      else{
        valBlocks.push(blockInst);
      }
    }

    // 在 valueBlock:Map<string, any[]> 查找所有父节点的id
    const parentIDs = valueState.keys();

    // 在 valueBlock:Map<string, any[]> 查找所有block
    const valBlocks: any[] = [];
    for(const [key, value] of valueState){
      // value 是一个 object
      Object.values(value).forEach(val => {
        console.log(val);
        if ((val as object).hasOwnProperty("block")) {
          //const blockInst = (val as { block: BlockInstance }).block;
          getLeafBlock(val as { block: BlockInstance }, valBlocks);
        }
      });
    }
    console.log('valBlocks:', valBlocks);

    const blockCat = ():boolean => {
      for (const [key, value] of valueState) {
        for (let i = 0; i < valBlocks.length; i++) {
          const block = valBlocks[i];
          if(block.id === key){
            delete block.fields;
            if(block.inputs === undefined){  block.inputs = {};  }
            Object.keys(value).forEach(key => {
              block.inputs[key] = value[key];
            })
            valueState.delete(key);
            valBlocks.splice(i, 1);
            return true;
          }
        }

      }
      return false;
    }

    while(blockCat() === true){}
    console.log('valueState:', valueState);

// blocks的数例:
// [
//     {
//         "id": "0b954665-fdfd-4485-b5b9-f99b25c7564c",
//         "type": "text_print",
//         "fields": {},
//         "x": -400,
//         "y": -400,
//         "_shadow": false,
//         "next": {
//             "id": "b914e16f-5dda-4445-a029-7beff6d906c4",
//             "type": "text_print",
//             "fields": {},
//             "_shadow": false
//         }
//     }
// ]
  const mergeValue = (block: BlockInstance) => {
    if(valueState.has(block.id)){
      const obj = valueState.get(block.id);
      if(block.inputs === undefined){ block.inputs = {} }
      Object.keys(obj).forEach(key => {
        block.inputs[key] = obj[key];  
      });
    }
    if(block.next){
      mergeValue(block.next.block);
    }
  }
  // 将 valueState 合并到 blocks
  for(const block of blocks){
    if(block === undefined){  continue; }
    mergeValue(block);
  }
  console.log('blocks:', blocks);


    // 最终工作区状态
    const workspaceState = {
      blocks,
      languageVersion: 0
    };

    return workspaceState;
  }

  /**
   * 清除所有块和连接
   */
  clear(): void {
    this.blocks.clear();
    this.state.blocks = [];
    this.state.series = [];
    this.state.inputsMap.clear();
  }
}

// 用法例子
// // 创建另一个语句块，并建立 next 连接
// const id1 = generator.addHeadBlock(-400, -400, 'text_print');
// // 给 text_print 的输入安装 text_replace
// const id_textReplace = generator.addValueBlock(id1, "TEXT", "text_replace",  {
//   shadow: false
// })
// // text_replace 有TEXT, FROM, TO 三个inputs
// if(id_textReplace){
//   // 给 id_textReplace 的 TEXT输入 安装 text 输入
//   generator.addValueBlock(id_textReplace, "TEXT", "text",  {
//     fields: {
//       TEXT: "HELLO,CHINA"
//     },
//     shadow: false
//   })
//   // 给 id_textReplace 的 FROM输入 安装 text 输入
//   generator.addValueBlock(id_textReplace, "FROM", "text",  {
//     fields: {
//       TEXT: "CHINA"
//     },
//     shadow: false
//   })
//   // 给 id_textReplace 的 TEXT输入 安装 text 输入
//   generator.addValueBlock(id_textReplace, "TO", "text",  {
//     fields: {
//       TEXT: "WORLD"
//     },
//     shadow: false
//   })
// }

// const id3 = generator.addNextBlock(id1, 'text_print');
// if(id3){
//   generator.addValueBlock(id3, "TEXT", "text",  {
//       fields: {
//         TEXT: "123"
//       },
//       shadow: false
//     })
// }
// console.log('generator.states1:', generator.state);


