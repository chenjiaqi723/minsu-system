<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="aside">
      <div class="logo-container">
        <div class="logo-text" :class="{ 'collapsed': isCollapse }">
          <span v-if="!isCollapse">民宿管理系统</span>
          <span v-else>MS</span>
        </div>
      </div>

      <!-- 折叠按钮 -->
      <div class="collapse-btn" @click="toggleCollapse">
        <el-icon :size="20">
          <Fold v-if="!isCollapse" />
          <Expand v-else />
        </el-icon>
      </div>

      <!-- 菜单 -->
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        background-color="#001529"
        text-color="#fff"
        active-text-color="#409EFF"
        @select="handleMenuSelect"
        class="menu"
      >
        <template v-for="item in menuItems" :key="item.index">
          <el-menu-item :index="item.index">
            <el-icon><component :is="item.icon" /></el-icon>
            <template #title>
              <span>{{ item.title }}</span>
            </template>
          </el-menu-item>
        </template>
      </el-menu>

      <!-- 底部信息 -->
      <div class="aside-footer" v-if="!isCollapse">
        <div class="user-info">
          <el-avatar :size="32" :src="userAvatar || defaultAvatar">
            {{ userName.charAt(0) }}
          </el-avatar>
          <div class="user-detail">
            <div class="user-name">{{ userName }}</div>
            <div class="user-role">{{ userRoleText }}</div>
          </div>
        </div>
      </div>
    </el-aside>

    <!-- 主体区域 -->
    <el-container class="main-container">
      <!-- 头部 -->
      <el-header class="header">
        <div class="header-left">
          <!-- 动态面包屑 -->
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: getHomePath }">
              {{ getHomeTitle }}
            </el-breadcrumb-item>

            <!-- 房源详情 - 只在详情页显示 -->
            <el-breadcrumb-item v-if="hasHouseDetail" >
              房源详情
            </el-breadcrumb-item>
            
            <!-- 然后在后面显示房源评价 -->
            <el-breadcrumb-item v-if="hasHouseComments">
              房源评价
            </el-breadcrumb-item>
            
             <!-- 其他动态面包屑项 -->
            <el-breadcrumb-item v-for="(item, index) in breadcrumbItems" :key="index">
              {{ item }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <!-- 通知中心 -->
          <el-badge :value="notificationCount" :hidden="notificationCount === 0" class="notification-badge">
            <el-button :icon="Bell" circle @click="handleNotification" />
          </el-badge>

          <!-- 用户下拉菜单 -->
          <el-dropdown @command="handleCommand">
            <div class="user-dropdown">
              <el-avatar :size="32" :src="userAvatar || defaultAvatar">
                {{ userName.charAt(0) }}
              </el-avatar>
              <span class="username">{{ userName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>系统设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区域 -->
      <el-main class="main-content">
        <!-- 页面标题和操作区 -->
        <div class="content-header" v-if="showPageHeader && !isDetailPage">
          <div class="content-title">
            <h2>{{ currentPageTitle }}</h2>
            <p class="content-description">{{ currentPageDescription }}</p>
          </div>
          <div class="content-actions">
            <slot name="actions"></slot>
          </div>
        </div>

        <!-- 路由视图 -->
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>

      <!-- 底部 -->
      <el-footer class="footer" v-if="!hideFooter">
        <div>© 2026 民宿管理系统 - 毕业设计作品</div>
        <div class="footer-links">
          <a href="#" @click.prevent>关于我们</a>
          <a href="#" @click.prevent>帮助中心</a>
          <a href="#" @click.prevent>联系我们</a>
        </div>
      </el-footer>
    </el-container>

    <!-- 退出登录确认对话框 -->
    <el-dialog
      v-model="showLogoutDialog"
      title="退出登录"
      width="300px"
      center
    >
      <div class="logout-content">
        <el-icon :size="40" color="#f56c6c"><WarningFilled /></el-icon>
        <p>确定要退出登录吗？</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showLogoutDialog = false">取消</el-button>
          <el-button type="danger" @click="confirmLogout">退出</el-button>
        </span>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Fold,
  Expand,
  Bell,
  ArrowDown,
  User,
  Setting,
  SwitchButton,
  WarningFilled
} from '@element-plus/icons-vue'

const props = defineProps({
  // 菜单项配置
  menuItems: {
    type: Array,
    required: true
  },
  // 用户角色
  userRole: {
    type: String,
    default: 'user'
  },
  // 用户名
  userName: {
    type: String,
    default: '游客'
  },
  // 用户头像
  userAvatar: {
    type: String,
    default: ''
  },
  // 是否隐藏底部
  hideFooter: {
    type: Boolean,
    default: false
  },
  // 是否显示页面头部
  showPageHeader: {
    type: Boolean,
    default: true
  }
})

const router = useRouter()
const route = useRoute()

// 默认头像
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

// 状态
const isCollapse = ref(false)
const notificationCount = ref(3)
const showLogoutDialog = ref(false)

// 判断是否是详情页（用于隐藏页面头部）
const isDetailPage = computed(() => {
  const detailPatterns = [
    /\/user\/house\/\d+$/,           // 房源详情
    /\/user\/house\/\d+\/comments$/,  // 房源评价列表
    /\/user\/appointment\/create\/\d+$/ // 创建预约
  ]
  return detailPatterns.some(pattern => pattern.test(route.path))
})

// 判断是否有房源详情（严格匹配，排除评价页）
const hasHouseDetail = computed(() => {
  const path = route.path
  return /\/user\/house\/\d+$/.test(path)
})

// 判断是否有房源评价
const hasHouseComments = computed(() => {
  const path = route.path
  return /\/user\/house\/\d+\/comments$/.test(path)
})

// 其他面包屑项（如创建预约等）
const otherBreadcrumbs = computed(() => {
  const items = []
  
  // 创建预约页面
  if (route.path.includes('/appointment/create')) {
    items.push('创建预约')
  }
  
  return items
})

// 获取首页路径
const homePaths = {
  user: '/user/houses',
  host: '/host/dashboard',
  admin: '/admin/users'
}

const getHomePath = computed(() => {
  return homePaths[props.userRole] || '/'
})

// 获取首页标题
const getHomeTitle = computed(() => {
  const homeTitles = {
    user: '浏览房源',
    host: '房源管理',
    admin: '用户管理'
  }
  return homeTitles[props.userRole] || '首页'
})

// 当前激活的菜单
const activeMenu = computed(() => {
  // 如果在详情页，高亮对应的菜单项
  if (route.path.includes('/house/')) {
    return `/${props.userRole}/houses`
  }
  if (route.path.includes('/appointment/')) {
    return `/${props.userRole}/appointments`
  }
  return route.path
})

// 当前页面标题
const currentPageTitle = computed(() => {
  const menuItem = props.menuItems.find(item => item.index === route.path)
  if (menuItem) return menuItem.title
  
  // 详情页标题
  if (route.path.includes('/house/') && !route.path.includes('/comments')) {
    return '房源详情'
  }
  if (route.path.includes('/house/') && route.path.includes('/comments')) {
    return '房源评价'
  }
  if (route.path.includes('/appointment/create')) {
    return '创建预约'
  }
  
  return '首页'
})

// 当前页面描述
const currentPageDescription = computed(() => {
  const descriptions = {
    '/user/houses': '发现心仪的房源，开始你的旅程',
    '/user/appointments': '查看和管理你的预约订单',
    '/user/comments': '管理你的历史评论',
    '/user/favorite': '收藏你喜欢的房源',
    '/host/houses': '管理你的房源信息',
    '/host/appointments': '处理客人的预约请求',
    '/host/comments': '查看客人对房源的评价',
    '/host/dashboard': '查看运营数据和统计',
    '/admin/users': '管理系统用户',
    '/admin/houses': '审核房源信息',
    '/admin/comments': '管理评论内容'
  }
  
  // 如果是详情页，返回对应的描述
  if (route.path.includes('/house/') && !route.path.includes('/comments')) {
    return '查看房源详细信息'
  }
  if (route.path.includes('/house/') && route.path.includes('/comments')) {
    return '查看其他用户的评价'
  }
  if (route.path.includes('/appointment/create')) {
    return '填写预约信息'
  }
  
  return descriptions[route.path] || ''
})

// 用户角色文本
const userRoleText = computed(() => {
  const roles = {
    admin: '管理员',
    host: '房东',
    user: '普通用户'
  }
  return roles[props.userRole] || '用户'
})

// 切换侧边栏折叠
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

// 菜单选择处理
const handleMenuSelect = (index) => {
  router.push(index)
}

// 通知点击
const handleNotification = () => {
  ElMessage.info('通知功能开发中...')
}

// 下拉菜单命令处理
const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push(`/${props.userRole}/profile`)
      break
    case 'settings':
      router.push(`/${props.userRole}/settings`)
      break
    case 'logout':
      showLogoutDialog.value = true
      break
  }
}

// 确认退出
const confirmLogout = () => {
  // 清除本地存储
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  localStorage.removeItem('userRole')
  
  ElMessage.success('已退出登录')
  showLogoutDialog.value = false
  router.replace('/login')
}

// 组件挂载
onMounted(() => {
  // 检查登录状态
  const token = localStorage.getItem('token')
  if (!token) {
    router.push('/login')
  }
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100%;
}

/* 侧边栏样式 */
.aside {
  background-color: #001529;
  color: white;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 100;
}

.logo-container {
  padding: 24px 0;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-text {
  font-size: 18px;
  font-weight: bold;
  white-space: nowrap;
  transition: all 0.3s ease;
  letter-spacing: 1px;
  
  /* 使用透明文字配合背景渐变 */
  color: transparent;
  background: linear-gradient(135deg, #409EFF, #66b1ff);
  
  /* 标准属性 + 前缀 */
  -webkit-background-clip: text;
  -moz-background-clip: text;
  background-clip: text;
}

.logo-text.collapsed {
  font-size: 16px;
}

.collapse-btn {
  position: absolute;
  top: 20px;
  right: -12px;
  width: 24px;
  height: 24px;
  background: #409EFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
  z-index: 10;
  transition: all 0.3s ease;
}

.collapse-btn:hover {
  transform: scale(1.1);
  background: #66b1ff;
}

.menu {
  flex: 1;
  border-right: none;
  margin-top: 16px;
}

.menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}

.menu :deep(.el-menu-item.is-active) {
  background-color: rgba(64, 158, 255, 0.2) !important;
}

.menu :deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.aside-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-detail {
  flex: 1;
  overflow: hidden;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #fff;
}

.user-role {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 主体区域样式 */
.main-container {
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
}

/* 头部样式 */
.header {
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  height: 60px;
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.notification-badge :deep(.el-badge__content) {
  background-color: #f56c6c;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-dropdown:hover {
  background-color: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #303133;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 内容区域样式 */
.main-content {
  padding: 20px;
  overflow-y: auto;
  background-color: #f0f2f5;
}

.content-header {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content-title h2 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.content-description {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.content-actions {
  display: flex;
  gap: 8px;
}

/* 底部样式 */
.footer {
  background-color: #fff;
  border-top: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  font-size: 13px;
  color: #909399;
  height: 50px;
}

.footer-links {
  display: flex;
  gap: 20px;
}

.footer-links a {
  color: #909399;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-links a:hover {
  color: #409EFF;
}

/* 退出对话框样式 */
.logout-content {
  text-align: center;
  padding: 20px 0;
}

.logout-content p {
  margin-top: 16px;
  font-size: 16px;
  color: #303133;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .aside {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 1000;
  }
  
  .header {
    padding-left: 84px;
  }
  
  .footer {
    flex-direction: column;
    height: auto;
    padding: 12px;
    gap: 8px;
  }
  
  .content-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>