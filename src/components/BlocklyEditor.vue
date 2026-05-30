<template>
  <div ref="blocklyDiv" class="blockly-container"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from "vue";
import * as Blockly from "blockly"; // 正确的方式
import { javascriptGenerator, Order } from 'blockly/javascript';
import { useSolutionStore } from "@/stores/solution.store";
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'

import { WorkspaceDef, Solution, SolutionStoreState } from '@/types/solution.type';

const solutionStore = useSolutionStore();
const { isConnected, blocks, currentSolution, currentSolutionName, forcusSolutionID } = storeToRefs(solutionStore);

const blocklyToolbox = ref<any>({
  kind: "flyoutToolbox",
  contents: [
    {
      kind: "label",
      text: "未识别的toolbox",
    }
  ],
});
const blocklyDiv = ref<any>(null);
const workingSpaceID = ref<string>("");
const blocksSetup = (blocks: Array<any>) => {
  // Explicitly type the elements of solutionStore.blocks to avoid implicit 'any'
  const blocksDef = blocks.map((item: { block: any }) => item.block);
  const myBlockDefinitions = Blockly.common.createBlockDefinitionsFromJsonArray(blocksDef);
  Blockly.common.defineBlocks(myBlockDefinitions);

  javascriptGenerator.addReservedWords('code');   // 'code'作为保留字
  for(const ele of blocks){
    const codeStr = ele.generator.join(""); // ele.generator 是一个字符串数组, 将它们连接成一个完整的代码字符串
    //console.log(`BlocklyEditor codeStr for block type ${ele.block.type}:`, codeStr);
    // 创建包装函数
    const wrappedCode = `${codeStr}`;
    // 创建函数，注入 generator 和 Order
    try{
      const generatorFn = new Function('block', 'generator', 'Order', wrappedCode);  // block, generator 作为参数传入 wrappedCode 中的代码可以直接使用它们
      // 注册. 为了引用 Order, 多增加一层封装
      (javascriptGenerator.forBlock as any)[ele.block.type] = (block:any, generator:any) => {
        return generatorFn(block, generator, Order);
      }
    }
    catch(error){
      console.error(`无法生成Function: ${wrappedCode}`);
    }

  }
}

const makeToolbox = (workspace: WorkspaceDef|undefined): Blockly.BlocklyOptions|undefined => {
  if(workspace === undefined){  return undefined; }
  //if(workspace.toolbox === undefined){  return undefined; }
  const injectOption: Blockly.BlocklyOptions  = {
    toolbox: blocklyToolbox.value,
    media: "/media/", // 指向打包后的 media 目录
    // 其他配置选项
    trashcan: true,
    grid: {
      spacing: 20,
      length: 3,
      colour: "#ccc",
      snap: true,
    },
    zoom: {
      controls: true,
      wheel: true,
      startScale: 0.8,
      maxScale: 1.2,
      minScale: 0.6,
      scaleSpeed: 1.2,
    },
  };

  // add gap
  const gap = {"kind": "sep", "gap": 5}
  if(workspace?.toolbox?.contents){
    const { contents, ...rest } = workspace.toolbox;
    const contentsX = [];
    for(let i=0; i<contents.length; i++){
      contentsX.push(contents[i]);
      contentsX.push(gap);
    }
    blocklyToolbox.value = {...rest};
    blocklyToolbox.value.contents = contentsX;
    //console.log("BlocklyEditor.onMounted blocklyToolbox.value:", blocklyToolbox.value);  
    injectOption.toolbox = blocklyToolbox.value;
  }
  else{
    delete (injectOption as any).toolbox;
  }
  return injectOption;
}

onMounted(() => {
  workingSpaceID.value = solutionStore.focusID;
  const workingNode: Solution|undefined = solutionStore.getWorkingSpace(workingSpaceID.value);
  if(workingNode === undefined){
    ElMessage({
      message: '没有可用的逻辑块数据',
      type: 'error',
      plain: true,
    })
    return;
  }
  console.log(`workspaceName: ${workingNode?.label}`);
  
  const itsBlockDef = (workingNode.content ? workingNode.content.blocks : []);
  const merged = [...blocks.value, ...(itsBlockDef ? itsBlockDef : [])];
  blocksSetup(merged);  

  const workingSpace = workingNode?.content;
  // blocksSetup(blocks.value);  // 所有工作区使用相同的 blocks
  const injectOption = makeToolbox(workingSpace); // 生成工具箱配置参数
  const workspace = Blockly.inject(blocklyDiv.value, injectOption) as any;

  const allBlockTypes = Object.keys(Blockly.Blocks);
  console.log('所有已注册的块类型:', allBlockTypes);

  // 注册按钮回调
  // for(const key of props.callbackkey || []){
  //   workspace.registerButtonCallback(
  //     key,
  //     () => {
  //       console.log("workspace里的 key 单击了");
  //     },
  //   );
  // }

  // 假设 savedState 是你之前保存的 JSON 对象或字符串
  try{
    // const state = typeof props.workspace === 'string' ? JSON.parse(props.workspace) : props.workspace;
    if(workingSpace){
      console.log('<BlocklyEditor.onMounted workingSpace.state:', workingSpace.state);
       Blockly.serialization.workspaces.load(workingSpace.state, workspace);
    }
  }
  catch(e){
    console.error("BlocklyEditor.onMounted 解析 workspace 失败:", e);
  }

  console.log("工具箱初始化完成");
});

// 清理
onUnmounted(() => {
  const workspace = Blockly.getMainWorkspace();
  const state = Blockly.serialization.workspaces.save(workspace); // object
  const code = javascriptGenerator.workspaceToCode(workspace);  // string
  console.log('onUnmounted, workspaceState:', state);
  console.log('onUnmounted, code:', code);
  console.log('onUnmounted, workingID:', workingSpaceID.value);

  solutionStore.setBlocklyConf(workingSpaceID.value, { state, code })
  .then((rslt) => {
    console.log('同步成功 rslt:', rslt);
    // if(rslt?.message === "do change"){
    //   ElMessage({
    //     message: '工作区同步成功了',
    //     type: 'success',
    //     plain: true,
    //   })      
    // }
  }, (rslt) => {
    ElMessage({
      message: rslt.message || '退出前的自动更新失败了',
      type: 'error',
      plain: true,
    })
  });

  if (workspace) {
    workspace.dispose();
  }
});


</script>

<style>
.blockly-container {
  height: 100vh;
  width: 100%;
  min-width: 800px;
}
</style>
