<template>
  <el-container v-loading="isConnected===false" class="layout-container-demo">
    <el-aside width="200px">
      <el-tree
        :data="solutions"
        node-key="id"
        accordion
        @node-click="onTreeNodeClick"
        :default-expanded-keys="expandedKeys"
      >
        <template #default="{ data }">
          <div
            :class="[
              'default-tree-node',
              { 'level-1-bg': isForcused(data), 'bold-text': data.important },
              { 'level-1-bg-bold-text': isForcused(data) && data.important }
            ]"
          >
            {{ data.label }}
          </div>
        </template>
      </el-tree>
    </el-aside>
    <el-main class="main-content">
      <component
        :key="toggleKey"
        :is="currentTab.component"
      ></component>
    </el-main>
  </el-container>
</template>

<script lang="ts" setup>
//v-loading="loading"
import { onMounted, onUnmounted, ref, computed, watch, shallowRef } from "vue";
import BlocklyEditor from "@/components/BlocklyEditor.vue";
import VerControl from "@/components/VerControl.vue";
import type {
  FilterNodeMethodFunction,
  RenderContentContext,
  RenderContentFunction,
  TreeInstance,
} from "element-plus";
import { ElMessage } from 'element-plus'

import { useSolutionStore } from "@/stores/solution.store";
import { storeToRefs } from 'pinia'
import { useUserStore } from "@/stores/user.store";

interface Tree {
  id: string;
  label: string;
  children?: Tree[];
  content?: any;
  class?: string;
  important?: boolean;
}

type Node = RenderContentContext["node"]; // 节点对象类型
type Data = RenderContentContext["data"]; // 节点数据类型
type NodeClickHandler = (data: Tree, node: Node, component: any) => void; // 定义 node-click 事件的完整参数类型
// 定义所有可能的 tab 名称类型
type TreeKey = 'label' | 'content' | 'class' | 'important' | 'id' // 定义树节点数据中可能的键名类型
// 定义所有可能的 tab 名称类型
type TabName = 'BlocklyEditor' | 'VerControl'

const userStore = useUserStore();
const loading = ref<boolean>(true)
const toggleKey = ref<string>("");
const solutionStore = useSolutionStore();
const { isConnected, solutions, currentSolution, currentSolutionName } = storeToRefs(solutionStore);

solutionStore.initializeSocketListeners();

solutionStore.downloadAllSolutions()
  .then((status) => {
    console.log('ProjectManager.downloadAllSolutions.status:', status);
    console.log('ProjectManager.currentSolution:', currentSolution.value);
    console.log('ProjectManager.currentSolutionName:', currentSolutionName.value);
    console.log('ProjectManager.solutions:', solutions.value);
  });

console.log(`<ProjectManager userStore.name: ${userStore.name}, userStore.role: ${userStore.role}`);

// 组件配置映射
const componentsMap = shallowRef({
  BlocklyEditor: {
    component: BlocklyEditor,
  },
  VerControl: {
    component: VerControl,
  }
}) as any;

const currentTabName = ref<TabName>('VerControl')
const currentTab = computed(() => componentsMap.value[currentTabName.value]);

const forcusedNodeKey = ref("0");  // 初始选择的节点
const expandedKeys = ref<string[]>([]);

// const prjTree = ref<Tree[]>([]);
//prjTree.value = {props.tree};

// 订阅 state 的变化
solutionStore.$subscribe((mutation, state) => {
  // mutation 包含了变化的具体信息，如 mutation.type (修改方式)
  // state 是 store 当前最新的完整状态
  console.log('Store 数据更新了', state)
  // 实际应用：比如将购物车数据自动保存到本地
})

const handleButtonClick = (event:string, param2: any, param3: any) => {
  console.log(event, param2, param3)
}

// 将所有后代节点的指定键设置为特定值的递归函数
const loopChildren_set = (children: Tree[], key: TreeKey, val: any) => {
    for(let _child of children){
      _child[key] = val;
      if(_child.children){
        loopChildren_set(_child.children, key, val);
      }
    }
}

const loopChildren_get = (children: Tree[], key: TreeKey, val: string[]) => {
    for(let _child of children){
      val.push(_child[key] as string);
      if(_child.children){
        loopChildren_get(_child.children, key, val);
      }
    }
}

console.log('solutions:', solutions.value);
console.log("forcusedNodeKey:", forcusedNodeKey.value);

// 先确认 store 中有哪些属性
// console.log(Object.keys(solutionStore));  // 查看所有属性
// console.log(solutionStore.currentSolutionName);  // 直接访问看是否报错

const onTreeNodeClick: NodeClickHandler = (data: Tree, node, component) => {
  //console.log("onTreeNodeClick.node:", node);
  console.log("onTreeNodeClick.data:", data);

  solutionStore.setFocusID(data.id);
  
  let type:TabName = "BlocklyEditor"
  for(let ele of solutions.value){
    if(data.id === ele.id){
      type = "VerControl"
      break;
    }
  }

  currentTabName.value = type;
  toggleKey.value = data.id;
  forcusedNodeKey.value = data.id;
  console.log('onTreeNodeClick.toggleKey:', toggleKey.value);
  console.log("onTreeNodeClick forcusedNodeKey:", forcusedNodeKey.value);
};

onMounted(() => {
  console.log("ProjectManager.mounted");
  console.log('onMounted.componentsMap:', componentsMap.value);
  console.log("onMounted.forcusedNodeKey:", forcusedNodeKey.value);
  loading.value = false;
  //console.log(`prjTree: ${JSON.stringify(prjTree?.value)}`);
});

onUnmounted(() => {});

const isForcused = (data: Tree) => forcusedNodeKey.value === data.id;


watch(currentSolutionName, (newValue, oldValue) => {
  console.log(`currentSolutionName 从 ${oldValue} 变为 ${newValue}`)
})

</script>

<style scoped>
.layout-container-demo {
  height: calc(100vh - 70px); /* 设置容器高度为视口高度减去 header 高度 */
  width: 100%; /* 设置容器宽度为100%减去左右边距 */
}

.main-content {
  height: 100%; /* 确保el-main占满剩余高度 */
  padding: 0; /* 移除内边距，让Blockly完全填满 */
  position: relative; /* 为子元素的绝对定位提供参考 */
  width: 100%;
}

.defualt-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  padding-right: 4px;
  line-height: 28px;
}

/* 自定义高亮样式，确保一直显示 */
.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content {
  background-color: #dadadb !important;
  color: #fff !important;
}

.el-tree--highlight-current
  .el-tree-node.is-current
  > .el-tree-node__content
  .el-tree-node__label {
  color: #e21313 !important;
}

/* 可选：添加 hover 效果 */
.el-tree-node__content:hover {
  background-color: #ecf5ff !important;
}

.level-1-bg {
  background-color: #dadadb;
}

.level-1-bg-bold-text {
  background-color: #dadadb;
  font-weight: bold;
}

.bold-text {
  font-weight: bold;
}


.auto-aside {
  transition: width 0.3s ease;
  overflow: hidden;
  position: relative;
}

</style>
