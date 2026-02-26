import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import Elementplus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import 'element-plus/dist/index.css'

createApp(App)
    .use(router)
    .use(Elementplus, {
        locale: zhCn,
    })
    .mount('#app')
    