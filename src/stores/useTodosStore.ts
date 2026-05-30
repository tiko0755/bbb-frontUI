import { defineStore } from "pinia";

/**
 * 待办事项接口
 */
interface Todo {
  /** 待办内容 */
  text: string;
  /** 唯一标识 */
  id: number;
  /** 是否已完成 */
  isFinished: boolean;
}

/**
 * 筛选类型
 */
type FilterType = "all" | "finished" | "unfinished";

/**
 * 待办事项状态接口
 */
interface TodosState {
  /** 待办列表 */
  todos: Todo[];
  /** 当前筛选条件 */
  filter: FilterType;
  /** 下一个待办的 ID */
  nextId: number;
}

/**
 * 待办事项 Store
 * 用于管理待办事项的增删改查及筛选功能
 */
export const useTodos = defineStore("todos", {
  state: (): TodosState => ({
    todos: [],
    filter: "all",
    nextId: 0,
  }),
  getters: {
    /**
     * 获取已完成的待办列表
     */
    finishedTodos(state): Todo[] {
      return state.todos.filter((todo) => todo.isFinished);
    },
    /**
     * 获取未完成的待办列表
     */
    unfinishedTodos(state): Todo[] {
      return state.todos.filter((todo) => !todo.isFinished);
    },
    /**
     * 根据当前筛选条件返回对应的待办列表
     */
    filteredTodos(state): Todo[] {
      if (this.filter === "finished") {
        return this.finishedTodos;
      } else if (this.filter === "unfinished") {
        return this.unfinishedTodos;
      }
      return this.todos;
    },
  },
  actions: {
    /**
     * 添加新的待办事项
     * @param text 待办内容
     */
    addTodo(text: string) {
      this.todos.push({ text, id: this.nextId++, isFinished: false });
    },
  },
});
