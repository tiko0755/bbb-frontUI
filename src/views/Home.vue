<template>
  <el-container class="layout-container-demo">
    <el-header style="text-align: right; font-size: 12px; height: 50px">
      <div class="toolbar">
        <el-dropdown>
          <el-icon style="margin-right: 8px; margin-top: 1px">
            <setting />
          </el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="switchTab('ProjectManager')">项目浏览器</el-dropdown-item>
              <el-dropdown-item @click="switchTab('TestPage')">运行界面</el-dropdown-item>
              <el-dropdown-item @click="switchTab('About')">关于</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <span>Tom</span>
      </div>
    </el-header>
    <el-main>
      <component
        :key="currentTabName"
        :is="currentTab.component"
      ></component>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { onMounted, ref, shallowRef, computed } from "vue";
import { Setting } from "@element-plus/icons-vue";
import ProjectManager from "@/components/ProjectManager.vue";
import TestPage from "@/components/TestPage.vue";
import About from "@/components/About.vue";

import { useSolutionStore } from "@/stores/solution.store";
import { useUIStore } from "@/stores/ui.store";

interface HomeComponentMap {
  TestPage: {
    component: typeof TestPage;
  };
  About: {
    component: typeof About;
  };
  ProjectManager: {
    component: typeof ProjectManager;
  };
}

const solutionStore = useSolutionStore();
const uiStore = useUIStore();

uiStore.initializeListeners();
solutionStore.initializeSocketListeners();

// 组件配置映射
const componentsMap = shallowRef<HomeComponentMap>({
  TestPage: {
    component: TestPage,
  },
  About: {
    component: About,
  },
  ProjectManager: {
    component: ProjectManager,
  }
});

// 定义所有可能的 tab 名称类型
type TabName = 'TestPage' | 'About' | 'ProjectManager'
const currentTabName = ref<TabName>('TestPage')

// 统一的 tab 切换函数
const switchTab = (tabName: TabName) => {
  currentTabName.value = tabName;
};

// 计算属性返回当前组件
const currentTab = computed(() => componentsMap.value[currentTabName.value]);

onMounted(async () => {
  console.log("Home.mounted");
});
</script>

<style scoped>
.layout-container-demo .el-header {
  position: relative;
  background-color: var(--el-color-primary-light-7);
  color: var(--el-text-color-primary);
}
.layout-container-demo .el-main {
  padding: 0;
  height: calc(100% - 50px); /* 减去 header 的高度 */
}
.layout-container-demo .toolbar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  right: 20px;
}
</style>
