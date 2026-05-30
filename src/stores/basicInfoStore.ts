import { defineStore } from "pinia";
import { useSocketStore } from "@/stores/socket.store";

/**
 * 基础信息状态接口
 */
interface BasicInfoState {
  /** 用户角色，默认为 "访客" */
  role: string;
  /** 工位标识 */
  station: string;
  /** 总任务数 */
  total: number;
  /** 时间记录 */
  time: number;
  /** 失败次数 */
  fails: number;
  /** WebSocket 连接 ID */
  socket_id: string | null;
}

/**
 * 基础信息 Store
 * 用于管理用户基础信息、任务统计及 WebSocket 连接状态
 */
export const useBasicInfoStore = defineStore("basicInfo", {
  state: (): BasicInfoState => ({
    role: "访客",
    station: "",
    total: 0,
    time: 0,
    fails: 0,
    socket_id: null,
  }),
  getters: {
    /**
     * 计算通过率（百分比，保留两位小数）
     * @returns 通过率，若 total 为 0 则返回 0
     */
    pass_rate: (state): number =>
      state.total === 0
        ? 0
        : Math.round(((state.total - state.fails) / state.total) * 10000) / 100,
  },
  actions: {
    /**
     * 初始化 WebSocket 连接监听器并保存 socketId
     */
    async initialize() {
      const socketStore = useSocketStore();
      socketStore.initializeSocketListeners();
      this.socket_id = socketStore.socketId;
      console.log("basic.id:", this.socket_id);
    },
    /**
     * 同时增加总任务数和失败次数
     */
    increaseFails() {
      this.total += 1;
      this.fails += 1;
    },
  },
});
