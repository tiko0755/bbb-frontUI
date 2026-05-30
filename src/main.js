import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia";
import "element-plus/dist/index.css";
import socketService from "./services/socket.service";

socketService.setupSocketConnection();

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);

app.use(router);
app.use(ElementPlus);

app.mount("#app");
