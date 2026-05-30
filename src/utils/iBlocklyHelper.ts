import { T_State, BlocksState, BlockState, BlockDef, T_BlockArgs0, BlockCodeDef } from '@/utils/iBlockly.types';
import { createId } from '@paralleldrive/cuid2';
import { BlocklyStateGenerator } from '@/utils/blocklyStateGenerator';
import { checkMessageReferences } from 'node_modules/blockly/core/utils/parsing';
import { stringifyQuery } from 'vue-router';

const generator = new BlocklyStateGenerator();

/* 根据 code 生成
 * template_code是一个字符串，例子如下:
  terminal.set("散热风扇", {type:"OUTPUT"});
  terminal.set("状态指示", {type:"OUTPUT"});
  terminal.set("下拉运动控制", {type:"OUTPUT"});
  terminal.set("装载检测", {type:"INPUT"});
*/
const make_template_blocks = (template_code: string, component_code: string): BlockCodeDef[] => {
  const terminateBlocksDef: any[] = [];

  const template_terminal = new Map();
  let fn = new Function('terminal', template_code);  // block, generator 作为参数传入 wrappedCode 中的代码可以直接使用它们
  fn(template_terminal);
  // template_terminal.forEach((value, key) => {
  //   console.log(`template_terminal: ${key} => ${value}`);
  // });

  const public_terminal = new Map();
  const slot = new Map();
  fn = new Function('terminal', "slot", component_code);  // block, generator 作为参数传入 wrappedCode 中的代码可以直接使用它们
  fn(public_terminal, slot);
  // public_terminal.forEach((value, key) => {
  //   console.log(`public_terminal: ${key} => ${value}`);
  // });
  // slot.forEach((value, key) => {
  //   console.log(`slot: ${key} => ${value}`);
  // });


  // matchContrl(public_terminal, template_terminal, slot);
  const templateStr = JSON.stringify({
      block: {
        "type": "block_type",
        "message0": "%1",
        "args0": [
          {
            "type": "field_label_serializable",
            "name": "LABEL",
            "text": ""
          }
        ],
        "output": "OUTPUT",
        "colour": 230,
        "tooltip": "",
        "helpUrl": ""
      },
      generator: [
          "var code = '{slot:\"slot0\"}';",
          "return [`${key}`, Order.NONE];"
      ]
  });

  public_terminal.forEach((value, key) => {
    console.log(`${key} => ${value}`);
    const template = JSON.parse(templateStr);
    template.block.type = `PUBLIC/${key}`;
    template.block.args0[0].text = `PUBLIC/${key}`;
    template.block.args0[0].name = 'LABEL';
    template.block.args0[0].type = "field_label_serializable",
    template.block.output = value.type;
    template.generator[0] = `var code = '{type:\"PUBLIC\", terminate:\"${key}\"}';`;
    template.generator[1] = `return [code, Order.NONE];`;
    terminateBlocksDef.push(template);
  });
  
  let index = 0;
  slot.forEach((slotValue, slotKey) => {
    template_terminal.forEach((value, key) => {
      console.log(`${key} => ${value}`);
      const template = JSON.parse(templateStr);
      template.block.type = `SLOT${index}/${key}`;
      template.block.args0[0].text = `${slotKey}/${key}`;
      template.block.args0[0].name = 'LABEL';
      template.block.args0[0].type = "field_label_serializable",
      template.block.output = value.type;
      template.generator[0] = `var code = '{type:\"${slotKey}\", terminate:\"${key}\"}';`;
      template.generator[1] = `return [code, Order.NONE];`;
      terminateBlocksDef.push(template);
    });
    index++;
  });

  return terminateBlocksDef;
}

const make_blocks_state = (blocksDef: BlockCodeDef[], ctrlsDef: BlockCodeDef[]): T_State => {
  // blocksDef 数例:
  // [
  //     {
  //         "block": {
  //             "type": "public/START",
  //             "message0": "%1",
  //             "args0": [
  //                 {
  //                     "type": "field_label_serializable",
  //                     "name": "LABEL",
  //                     "text": "public/START"
  //                 }
  //             ],
  //             "output": "INPUT",
  //             "colour": 230,
  //             "tooltip": "",
  //             "helpUrl": ""
  //         },
  //         "generator": [
  //             "var code = '{type:\"public\", terminate:\"START\"}';",
  //             "return [code, Order.NONE];"
  //         ]
  //     },
  //     {
  //         "block": {
  //             "type": "SLOT1/状态指示",
  //             "message0": "%1",
  //             "args0": [
  //                 {
  //                     "type": "field_label_serializable",
  //                     "name": "LABEL",
  //                     "text": "SLOT1/状态指示"
  //                 }
  //             ],
  //             "output": "OUTPUT",
  //             "colour": 230,
  //             "tooltip": "",
  //             "helpUrl": ""
  //         },
  //         "generator": [
  //             "var code = '{type:\"SLOT1\", terminate:\"状态指示\"}';",
  //             "return [code, Order.NONE];"
  //         ]
  //     },
  //     {
  //         "block": {
  //             "type": "SLOT1/装载检测",
  //             "message0": "%1",
  //             "args0": [
  //                 {
  //                     "type": "field_label_serializable",
  //                     "name": "LABEL",
  //                     "text": "SLOT1/装载检测"
  //                 }
  //             ],
  //             "output": "INPUT",
  //             "colour": 230,
  //             "tooltip": "",
  //             "helpUrl": ""
  //         },
  //         "generator": [
  //             "var code = '{type:\"SLOT1\", terminate:\"装载检测\"}';",
  //             "return [code, Order.NONE];"
  //         ]
  //     },
  //     {
  //         "block": {
  //             "type": "SLOT2/状态指示",
  //             "message0": "%1",
  //             "args0": [
  //                 {
  //                     "type": "field_label_serializable",
  //                     "name": "LABEL",
  //                     "text": "SLOT2/状态指示"
  //                 }
  //             ],
  //             "output": "OUTPUT",
  //             "colour": 230,
  //             "tooltip": "",
  //             "helpUrl": ""
  //         },
  //         "generator": [
  //             "var code = '{type:\"SLOT2\", terminate:\"状态指示\"}';",
  //             "return [code, Order.NONE];"
  //         ]
  //     },
  //     {
  //         "block": {
  //             "type": "SLOT2/装载检测",
  //             "message0": "%1",
  //             "args0": [
  //                 {
  //                     "type": "field_label_serializable",
  //                     "name": "LABEL",
  //                     "text": "SLOT2/装载检测"
  //                 }
  //             ],
  //             "output": "INPUT",
  //             "colour": 230,
  //             "tooltip": "",
  //             "helpUrl": ""
  //         },
  //         "generator": [
  //             "var code = '{type:\"SLOT2\", terminate:\"装载检测\"}';",
  //             "return [code, Order.NONE];"
  //         ]
  //     }
  // ]

 // 控制板的端口统计
  const ctrlsCheckStat:Record<string, Record<string, number>> = {};
  for(const ctrl of ctrlsDef){
    // 统计所有可用的 value_input, 并按 check 归类
    const check:Record<string, number>  = {};
    for(const arg of ctrl.block.args0){
      if(arg.type !== "input_value"){ continue; }
      if(check.hasOwnProperty(arg.check)){
        check[arg.check]++;
      }
      else{
        check[arg.check] = 1;
      }
    }
    ctrlsCheckStat[ctrl.block.type] = check;
  }
  //  ctrlsCheckStat
  // {
  //     "ctrlb_m44000000": {
  //         "OUTPUT": 4,
  //         "INPUT": 4
  //     },
  //     "ctrlb_m08000000": {
  //         "INPUT": 8
  //     },
  //     "ctrlb_m80000000": {
  //         "OUTPUT": 8
  //     },
  //     "ctrlb_mixboard": {
  //         "BATT": 1,
  //         "undefined": 1,
  //         "VDC": 4,
  //         "UART": 2,
  //         "GPIO": 4
  //     }
  // }
  const checkMul= (objA:Record<string, Record<string, number>>, objB:Record<string, Record<string, number>>):Record<string, Record<string, number>>  => {
    let mul:Record<string, Record<string, number>> = {};
    Object.keys(objA).forEach(keyA => {
      Object.keys(objB).forEach(keyB => {
        const keyAB = `${keyA}.${keyB}`
        mul[keyAB] = structuredClone(objB[keyB]);
        Object.keys(objA[keyA]).forEach(keyC => {
          if(mul[keyAB].hasOwnProperty(keyC)){
            mul[keyAB][keyC] += objA[keyA][keyC];
          }
          else{
            mul[keyAB][keyC] = objA[keyA][keyC];
          }
        });
      })
    })
    return mul;
  }

  // let obj:Record<string, BlockCodeDef[]>  = {};
  // for(const item of blocksDef){
  //   const title = item.block.type.slice(0, item.block.type.indexOf("/"));
  //   if(obj.hasOwnProperty(title)){
  //     obj[title].push(item);
  //   }
  //   else{
  //     obj[title] = [item];
  //   }
  // }
  // const terminalOutputs:Record<string, Record<string, BlockCodeDef[]>> = {};
  // for (let key in obj) {
  //   const sort:Record<string, BlockCodeDef[]> = {};
  //   for(const item of obj[key]){
  //     if(sort.hasOwnProperty(item.block.output)){
  //       sort[item.block.output].push(item);
  //     }
  //     else{
  //       sort[item.block.output] = [item];
  //     }
  //   }
  //   terminalOutputs[key] = sort;
  // }
  // console.log(terminalOutputs);

  const allOutputs:Record<string, number> = {};
  for(const item of blocksDef){
    if(item.block.output){
      if(allOutputs.hasOwnProperty(item.block.output)){
        allOutputs[item.block.output]++;
      }
      else{
        allOutputs[item.block.output] = 1;
      }
    }
  }
  const publicOutputs:Record<string, number> = {};
  const publicTypesSet = new Set();
  for(const item of blocksDef){
    if((item.block.type.toUpperCase().indexOf("PUBLIC/") === 0) && (item.block.output)){
      publicTypesSet.add(item.block.type);
      if(publicOutputs.hasOwnProperty(item.block.output)){
        publicOutputs[item.block.output]++;
      }
      else{
        publicOutputs[item.block.output] = 1;
      }
    }
  }
  const slotOutputs:Record<string, number> = {};
  const Slot0TypesSet = new Set();
  for(const item of blocksDef){
    if((item.block.type.toUpperCase().indexOf("SLOT0/") === 0) && (item.block.output)){
      Slot0TypesSet.add(item.block.type);
      if(slotOutputs.hasOwnProperty(item.block.output)){
        slotOutputs[item.block.output]++;
      }
      else{
        slotOutputs[item.block.output] = 1;
      }
    }
  }
  const SlotNamesSet = new Set();
  for(const item of blocksDef){
    if((item.block.type.toUpperCase().indexOf("SLOT") === 0) && (item.block.output)){
      SlotNamesSet.add(item.block.type.split("/")[0]);
    }
  }

  const matchSolution = (ctrlsCheck:Record<string, Record<string, number>>, ouput:Record<string, number>): any[] => {
    const solutions: any[] = [];
    Object.keys(ctrlsCheck).forEach(key1 => {
      if(Object.keys(ouput).every(key2 => (Object.hasOwn(ctrlsCheck[key1], key2) && (ouput[key2] <= ctrlsCheck[key1][key2])))){
        solutions.push(key1);
      }
    });
    return solutions;
  }

  const moreCtrlsMatchSolution = (ctrlsCheck:Record<string, Record<string, number>>, output:Record<string, number>) => {
    let ctrlsCheckArry:Record<string, Record<string, number>>[] = [ctrlsCheck];
    for(let i = 0; i < 32; i++){
      const matches = matchSolution(ctrlsCheckArry[i], output);  // 匹配解决方案
      if(matches.length > 0){  return matches;  }
      ctrlsCheckArry.push(checkMul(ctrlsCheckArry[ctrlsCheckArry.length-1], ctrlsCheck)); // 增加板子
    }
    return [];
  }

  //BlockCodeDef
  let finalMatchDef: {ctrls: (BlockCodeDef|undefined)[]; terminals: BlockCodeDef[]}[] = [];

  const solutionMatchX1: any[] = matchSolution(ctrlsCheckStat, allOutputs).map(str => str.split("."));  // 匹配解决方案
  if(solutionMatchX1.length <= 0){
    // 没有匹配到单板解决方案, 按public, Slot来匹配
    const publicMatches: string[][] = moreCtrlsMatchSolution(ctrlsCheckStat, publicOutputs).map(str => str.split("."));
    const slotMatches: string[][] = moreCtrlsMatchSolution(ctrlsCheckStat, slotOutputs).map(str => str.split("."));
    let publicMatch: string[] = publicMatches[0];
    let slotMatch: string[] = slotMatches[0];
    let min = 99999;
    for(let pMatch of publicMatches){
      for(let sMatch of slotMatches){
        const merged = [...new Set([...pMatch, ...sMatch])];
        if(min > merged.length){
          min = merged.length;
          publicMatch = pMatch;
          slotMatch = sMatch;
        }
      }
    }

    const publiCtrls = publicMatch.map(type => {
        for(const def of ctrlsDef){
          if(def.block.type === type){  return def;  }
        }
      })
    const terminalCtrls = slotMatch.map(type => {
        for(const def of ctrlsDef){
          if(def.block.type === type){  return def;  }
        }
      })

    finalMatchDef.push({
      ctrls: publiCtrls,
      terminals: blocksDef.filter(item => item.block.type.toUpperCase().indexOf("PUBLIC/") === 0)
    });      

    SlotNamesSet.forEach(type => {
      finalMatchDef.push({
        ctrls: terminalCtrls,
        terminals: blocksDef.filter(item => item.block.type.indexOf(`${type}/`) === 0)
      });
    })
  }    
  else{
    const publiCtrls = solutionMatchX1.map(type => {
      for(const def of ctrlsDef){
        if(def.block.type === type){  return def;  }
      }
    })
    finalMatchDef.push({
      ctrls: publiCtrls,
      terminals: blocksDef
    });      
  }

  const mergeInput = (id: string, inputBlock: BlockDef, valueBlocks: BlockDef[]):any => {
    const doneInputs: string[] = [];
    for(let indx = valueBlocks.length-1; indx >= 0; indx--){
      const valDef = valueBlocks[indx];
      valDef.colour = 150;
      for(const argItem of inputBlock.args0){
        if(argItem.type === "input_value" && argItem.check === valDef.output && (doneInputs.includes(argItem.name)===false)){
          const fields:Record<string, string> = {};
          for(const valArgItem of valDef.args0){
            fields[valArgItem.name] = valArgItem.text;
          }
          generator.addValueBlock(id, argItem.name, valDef.type,  {
            fields,
            shadow: false
          })
          doneInputs.push(argItem.name);
          break;
        }
      }
      valueBlocks.pop();
    }
  }

  generator.clear();
  let addr = 1;
  let nextID = "";
  finalMatchDef.forEach((match, index1) => {
    match.ctrls.forEach((ctrl, index2) => {
      if(ctrl){
        if(index1 == 0 && index2 == 0){
          nextID = generator.addHeadBlock(-200,-200, ctrl.block.type, {
            fields: {  ADDR: addr  },
            shadow: false
          });
          mergeInput(nextID, ctrl.block, match.terminals.map(itm => itm.block));
        }
        else{
          let id = generator.addNextBlock(nextID, ctrl.block.type, {
            fields: {  ADDR: addr  },
            shadow: false
          });
          if(id){ 
            mergeInput(id, ctrl.block, match.terminals.map(itm => itm.block));
            nextID = id;  
          }
        }
        addr++;
      }
    });
  });







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






  const workspaceState = generator.build();
  console.log('workspaceState:', workspaceState);
  const blocksState:BlocksState = workspaceState

  //blocksState.blocks = generator.build().blocks;

  // let x = -1200;
  // let y = -800;
  // const xStep = -200;
  // const yStep = -40;
  // blocksDef.forEach(def => {
  //   const obj:BlockState = {
  //     fields: {},
  //     id: createId(),
  //     type: def.block.type,
  //     x: x,
  //     y: y
  //   }
  //   for(const itm of def.block.args0){
  //     obj.fields[itm.name] = itm.text;
  //   }
  //   blocksState.blocks.push(obj as BlockState);
  //   y += yStep;
  //   if(y < -3000){
  //     x += xStep;
  //     y = -800;
  //   }
  // });
  const state = {
    blocks: blocksState
  }

  return state;
}

// const generateFields = (args0: any[]) => {
//   const fields = {};
//   for(const itm of args0){
//     if(itm.type == "field_number"){
//       fields[itm.name] = itm.value;
//     }
//   }
// }

// const place_block = (blocksDef: BlockDef, x: number, y: number): T_State => {
//   const bState: BlockState = {
//     id: createId(),
//     type: blocksDef.type,
//     fields: generateFields(blocksDef.args0),
//     x: x,
//     y: y,
//     next: undefined,
//     inputs: []
//   };
//   const state: T_State = {
//     blocks: {
//       languageVersion: 0,
//       blocks: []
//     }
//   };
//   return {
//     blocks: {
//       languageVersion: 0,
//       blocks: []
//     }
//   } as T_State;
// }





export {
    make_template_blocks,
    make_blocks_state,


}
