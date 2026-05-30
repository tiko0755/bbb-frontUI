<template>
  <el-timeline v-if="props.open" >
    <el-timeline-item
      v-for="(activity, index) in activities"
      :key="index"
      :icon="activity.icon"
      :type="activity.type"
      :color="activity.color"
      :size="activity.size"
      :hollow="activity.hollow"
      :timestamp="activity.timestamp"
    >
      {{ activity.content }}
      <el-button-group v-if="index===0" class="mb-4">
        <el-button @click="onSave">保存</el-button>
        <el-button @click="onSaveAs">另存</el-button>
      </el-button-group>
      <el-button v-else @click="checkout">检出</el-button>
    </el-timeline-item>
  </el-timeline>
  <el-button v-else @click="checkout">检出</el-button>
</template>

<script lang="ts" setup>
import type { TimelineItemProps } from 'element-plus'

interface ActivityType extends Partial<TimelineItemProps> {
  content: string
}
interface TimelineNode {
  label: string;
  header: string;
  remarks: string[];
}
interface propsAlias {
  id: string;
  title: string;
  open: boolean;
}

interface Props {
  props: propsAlias;
}

const propsAlias = defineProps<Props>();
const props = propsAlias.props;
console.log('VerControl.props:', props);

const emit = defineEmits(['onSave', 'onSaveAs', 'checkout']);

const onSave = () => {
  console.log('VerControl.onSave');
  emit("onSave", "hello, it is blocklyEditor");
}

const onSaveAs = () => {
  console.log('VerControl.onSaveAs');
  emit("onSaveAs", "hello, it is blocklyEditor");
}

const checkout = () => {
  console.log('VerControl.checkout');
  emit("checkout", props.id);
}

const activities: ActivityType[] = [
  {
    content: 'PVT2 [dev]',
    timestamp: '1.增加压力测试; 2.优化CT; 3.增加光色检测;',
    size: 'large',
    type: 'primary'
  },
  {
    content: 'PVT1',
    timestamp: '2018-04-03 20:46',
  },
  {
    content: 'DVT1',
    timestamp: '2018-04-03 20:46',
    size: 'large',
  },
  {
    content: 'EVT2',
    timestamp: '2018-04-03 20:46',
  },
  {
    content: 'EVT1',
    timestamp: '2018-04-03 20:46',
  },
]

</script>