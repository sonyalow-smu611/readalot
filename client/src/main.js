// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md

// Vue 3 — component framework for the whole UI (Composition API + <script setup>).
import { createApp } from 'vue'
// Pinia — Vue's official state store; shares user + bookshelf state across views.
import { createPinia } from 'pinia'

// Bootstrap 5 — only the reboot, grid and utility layers; components are our own.
import 'bootstrap/dist/css/bootstrap-reboot.min.css'
import 'bootstrap/dist/css/bootstrap-grid.min.css'
import 'bootstrap/dist/css/bootstrap-utilities.min.css'
import './styles/theme.css'
import './styles/transitions.css'

import App from './App.vue'
import router from './router'
import { registerMotionDirectives } from './directives'

const app = createApp(App)

app.use(createPinia())
app.use(router)
registerMotionDirectives(app)

app.mount('#app')
