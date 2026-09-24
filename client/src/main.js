import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/theme.css";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router/index.js";

createApp(App).use(router).mount("#app");
