// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md

// Vue 3 — component framework for the whole UI (Composition API + <script setup>).
import { createApp } from 'vue'
// Pinia — Vue's official state store; shares user + bookshelf state across views.
import { createPinia } from 'pinia'

// Bootstrap 5 — full stylesheet: grid and utilities everywhere, plus the modal and button
// components the book and quote dialogs are built on.
import 'bootstrap/dist/css/bootstrap.min.css'
// Shared tokens first, then the aliases the room components read.
import './assets/theme.css'
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
