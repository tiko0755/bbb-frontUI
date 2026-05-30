import { defineStore } from "pinia";

interface UserState {
  name: string;
  role: string | string[];  // 更清晰的数组语法
}

export const useUserStore = defineStore("userInfo", {
  state: (): UserState => ({
    name: "guest",
    role: "guest",
  }),
  getters: {
    // 如果有需要，可以添加有意义的计算属性
    isGuest: (state) => state.name === "guest",
    isAdmin: (state) => 
      Array.isArray(state.role) 
        ? state.role.includes("admin") 
        : state.role === "admin",
  },
  actions: {
    async login(name: string, role: string | string[]): Promise<void> {
      this.name = name;
      this.role = role;
      
      // 模拟登录请求
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    },
    logout(): void {
      this.name = "guest";
      this.role = "guest";
    },
  },
});