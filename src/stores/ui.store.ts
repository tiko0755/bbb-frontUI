import { defineStore } from "pinia";
import type { StoreDefinition } from "pinia";
import socketService from "../services/socket.service";

interface HeaderItem {
  enable: boolean;
  label?: string;
  width?: string;
  col_width?: string;
}

interface Header {
  description: HeaderItem;
  lower: HeaderItem;
  upper: HeaderItem;
  unit: HeaderItem;
  slot1: HeaderItem;
  slot2: HeaderItem;
  slot3: HeaderItem;
  slot4: HeaderItem;
  slot5: HeaderItem;
  slot6: HeaderItem;
  slot7: HeaderItem;
  slot8: HeaderItem;
}

interface RowText {
  description: string;
  lower: string;
  upper: string;
  unit: string;
  slot1?: string;
  slot2?: string;
  slot3?: string;
  slot4?: string;
  slot5?: string;
  slot6?: string;
  slot7?: string;
  slot8?: string;
}

interface RowStyle {
  description?: Record<string, any>;
  lower?: Record<string, any>;
  upper?: Record<string, any>;
  unit?: Record<string, any>;
  slot1?: Record<string, any>;
  slot2?: Record<string, any>;
  slot3?: Record<string, any>;
  slot4?: Record<string, any>;
  slot5?: Record<string, any>;
  slot6?: Record<string, any>;
  slot7?: Record<string, any>;
  slot8?: Record<string, any>;
}

interface Row {
  id: string;
  text: RowText;
  style: RowStyle;
}

interface UIState {
  isConnected: boolean;
  messages: any[];
  notifications: any[];
  connectionError: string | null;
  role: string;
  station: string;
  total: number;
  time: number;
  fails: number;
  header: Header;
  rows: Row[];
  socket_id: string | null;
  value_col_width: string;
  description_col_width: string;
  amount1: string;
}

export const useUIStore: StoreDefinition<"ui", UIState> = defineStore("ui", {
  state: (): UIState => ({
    isConnected: false,
    messages: [],
    notifications: [],
    connectionError: null,
    role: "访客",
    station: "",
    total: 0,
    time: 0,
    fails: 0,
    header: {
      description: {
        enable: true,
      },
      lower: {
        enable: false,
      },
      upper: {
        enable: false,
      },
      unit: {
        enable: true,
      },
      slot1: {
        enable: true,
      },
      slot2: {
        enable: true,
      },
      slot3: {
        enable: true,
      },
      slot4: {
        enable: true,
      },
      slot5: {
        enable: true,
      },
      slot6: {
        enable: true,
      },
      slot7: {
        enable: true,
      },
      slot8: {
        enable: true,
      },
    },
    rows: [],
    socket_id: null,
    value_col_width: "120px",
    description_col_width: "300px",
    amount1: "",
  }),

  getters: {
    pass_rate: (state: UIState): number =>
      Math.round(((state.total - state.fails) / state.total) * 10000) / 100,
    tableData: (state: UIState): RowText[] => state.rows.map((row) => row.text),
  },

  actions: {
    setConnected(status: boolean): void {
      this.isConnected = status;
    },

    addMessage(message: any): void {
      this.messages.push(message);
    },

    addNotification(notification: any): void {
      this.notifications.push(notification);
    },

    setError(error: string | null): void {
      this.connectionError = error;
    },

    // 初始化 socket 监听
    initializeListeners(): void {
      if (socketService.socket.connected) {
        this.setConnected(true);
        this.setError(null);
        socketService.socket.emit("ui.initial", { role: this.role });
      }
      socketService.socket.on("connect", () => {
        this.setConnected(true);
        this.setError(null);
        console.debug("<ui> socket.onConnect id", socketService.socket.id);
      });

      socketService.socket.on("disconnect", () => {
        this.setConnected(false);
      });

      socketService.socket.on("connect_error", (error: any) => {
        this.setError(error.message);
      });

      socketService.socket.on("new-message", (message: any) => {
        console.debug("new-message:", message);
        this.addMessage(message);
      });

      socketService.socket.on("notification", (notification: any) => {
        console.debug("onNotification:", notification);
        this.addNotification(notification);
      });

      // 监听工站名称
      socketService.socket.on("ui.station.name", (station_name: string) => {
        console.debug("station_name:", station_name);
        this.station = station_name;
      });

      // 监听统计信息
      socketService.socket.on("ui.station.statistict", (statistict: { total?: number; fails?: number; time?: number }) => {
        console.debug("statistict:", statistict);
        this.total = statistict.total || 0;
        this.fails = statistict.fails || 0;
        this.time = statistict.time || 0;
      });

      // 监听测试表头
      socketService.socket.on("ui.station.header", (header: Header) => {
        console.debug("header:", header);
        this.header = header;
      });

      // 监听测试行
      socketService.socket.on("ui.station.rows", (rows: Row[]) => {
        console.debug("ui.station.rows:", rows);
        this.rows = rows;
      });

      socketService.socket.on("ui.station.row.header.text", (id: string, text: Partial<RowText>) => {
        for (const row of this.rows) {
          if (row.id !== id) {
            continue;
          }
          row.text.description = text.description || row.text.description;
          row.text.lower = text.lower || row.text.lower;
          row.text.upper = text.upper || row.text.upper;
          row.text.unit = text.unit || row.text.unit;
          console.log("ui.station.row.header.text.rows", this.rows);
          break;
        }
      });

      socketService.socket.on("ui.station.row.header.style", (id: string, style: Partial<RowStyle>) => {
        for (const row of this.rows) {
          if (row.id !== id) {
            continue;
          }
          row.style.description = style.description || row.style.description;
          row.style.lower = style.lower || row.style.lower;
          row.style.upper = style.upper || row.style.upper;
          row.style.unit = style.unit || row.style.unit;
          console.log("ui.station.row.header.text.rows", this.rows);
          break;
        }
      });

      socketService.socket.on(
        "ui.station.row.slotcell",
        (row_id: string, slot: string, text: string, style: Record<string, any>, ack: (response: string) => void) => {
          let done = false;
          for (const row of this.rows) {
            if (row.id !== row_id) {
              continue;
            }
            (row.text as any)[slot] = text;
            (row.style as any)[slot] = style;
            console.log("ui.station.row.slotcell.text.rows", this.rows);
            ack("success");
            done = true;
            break;
          }
          if (!done) ack("error! cannot find the row with id: " + row_id);
        },
      );

      // 监听测试时间
    },

    // 发送消息到服务器
    sendMessage(message: any): void {
      if (this.isConnected) {
        socketService.socket.emit("send-message", message);
      }
    },

    // 断开连接
    disconnect(): void {
      socketService.disconnect();
      this.setConnected(false);
    },
  },
});
