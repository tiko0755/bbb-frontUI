<template >
  <div class="mt-4" v-if="isActive" >
    <el-button @click="handleSave" style="margin-left: 20px; margin-right: 20px;">保存</el-button>
    <el-input
      v-model="newSolutionName"
      style="max-width: 400px"
      placeholder="Please input"
      class="input-with-select"
    >
      <template #append>
        <el-button @click="handleSaveAs">另存为</el-button>
      </template>
    </el-input>
  </div>
  <el-button v-else @click="checkout" style="margin-left: 20px; margin-right: 20px;">应用</el-button>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from "vue";
import { useUserStore } from "@/stores/user.store";
import { useSolutionStore } from "@/stores/solution.store";
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'

import { BlockDef, WorkspaceDef, Solution, SolutionStoreState } from '@/types/solution.type';

const solutionStore = useSolutionStore();
const { isConnected, currentSolution } = solutionStore;
const { blocks, currentSolutionName, forcusSolutionID } = storeToRefs(solutionStore);

const workingSpaceID = ref<string>("");
const newSolutionName = ref("`${currentSolutionName.value}-copy`");

const handleSave = () => {
  //emit("onsave", props.id);
  if(currentSolution === undefined){
    ElMessage({
      message: '当前方案未有指定',
      type: 'error',
      plain: true,
    })
    return;
  }
  solutionStore.uploadSolution(currentSolution.id)
  .then((obj: any) => {
    console.log('VerCtrl_save_handle obj:', obj);
    if(obj.success){
      console.log('VerCtrl_save_handle uploadSolution success:', obj);
      ElMessage({
        message: '推送到配置服务器成功了',
        type: 'success',
        plain: true,
      })
    }
    else{
      ElMessage({
        message: obj?.message || '保存失败了',
        type: 'error',
        plain: true,
      })
    }
  })
  .catch((error: any) => {
    console.error('VerCtrl_save_handle uploadSolution error:', error);
    ElMessage({
      message: error?.message || '保存失败了',
      type: 'error',
      plain: true,
    })
  });
}

const handleSaveAs = () => {
  console.log(`handleSaveAs name:${newSolutionName.value}`);
  let node: any = null;
  solutionStore.cloneAsFreshSolution(newSolutionName.value)
  .then((rsl: any) => {
    console.log(`VerCtrl_saveas_handle cloneAsFreshSolution rsl:`, JSON.parse(rsl));
    node = JSON.parse(rsl);
    return solutionStore.activeSolution(node.id);
  })
  .then((obj)=>{
    console.log('handleSaveAs activeSolution.return:', obj);
    return solutionStore.downloadAllSolutions()
  })
  .then((status) => {
    console.log('VerCtrl_saveas_handle ProjectManager.downloadAllSolutions.status:', status);
    console.log('VerCtrl_saveas_handle ProjectManager.currentSolution:', currentSolution);
    console.log('VerCtrl_saveas_handle ProjectManager.currentSolutionName:', currentSolutionName.value);
  })
  .catch((error: any) => {  
    console.error(`VerCtrl_saveas_handle cloneAsFreshSolution error:${error}`);
  });
}

const checkout = () => {
  console.log('focusID:', forcusSolutionID.value);
  solutionStore.activeSolution(forcusSolutionID.value as string)
  .then((obj)=>{
    return solutionStore.downloadAllSolutions()
  })
  .then((status) => {
    console.log('VerCtrl_checkout_handle ProjectManager.downloadAllSolutions.status:', status);
    console.log('VerCtrl_checkout_handle ProjectManager.currentSolution:', currentSolution);
    console.log('VerCtrl_checkout_handle ProjectManager.currentSolutionName:', currentSolutionName.value);
  });
}

const isActive = computed(() => currentSolution ? currentSolution.id ===  workingSpaceID.value : false);

onMounted(() => {
  workingSpaceID.value = solutionStore.focusID;
  console.log("currentSolutionName.value:", currentSolutionName.value);
  if(currentSolutionName){
    newSolutionName.value = `${currentSolutionName.value}-copy`
  }
  
});


</script>