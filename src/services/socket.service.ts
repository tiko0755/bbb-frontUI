import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";

class SocketioService {
  socket!: Socket;
  private readonly urlObj = new URL(import.meta.url);
  private readonly fileName = this.urlObj.pathname.split("/").pop() as string;

  constructor() {
    console.log("websocket service is initializing...");
  }

  setupSocketConnection(): void {
    const apiUrl = import.meta.env.VITE_API_BASE_URL as string;
    console.log(`<${this.fileName} VITE_API_BASE_URL:${apiUrl}>`);

    this.socket = io(apiUrl, {
      withCredentials: true,
      transports: ["websocket"],
    });

    this.socket.on("connect", () => {
      console.log(`<${this.fileName} connect socket.id:${this.socket?.id}>`);
    });

    this.socket.on("disconnect", (reason) => {
      console.log(`<${this.fileName} disconnect reason:${reason}>`);
    });

    this.socket.on("connect_error", (error) => {
      console.log(`<${this.fileName} connect_error error:${error}>`);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
  }
}

export default new SocketioService();

