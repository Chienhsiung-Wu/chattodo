import { createApp } from 'vue'
import Admin from './Admin.vue'
import '../src/styles/tokens.css' // design tokens first — styles.css maps onto them
import '../src/styles.css'

createApp(Admin).mount('#admin')
