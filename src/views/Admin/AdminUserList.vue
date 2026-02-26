<template>
  <div class="admin-users-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>用户管理</h2>
        <p class="subtitle">管理系统所有用户，查看用户信息和状态</p>
      </div>
      <div class="header-right">
        <div class="stats-card">
          <div class="stat-item">
            <span class="stat-label">总用户</span>
            <span class="stat-value">{{ total }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">管理员</span>
            <span class="stat-value info">{{ adminCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">房东</span>
            <span class="stat-value success">{{ hostCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">客户</span>
            <span class="stat-value warning">{{ userCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选和搜索栏 -->
    <el-card class="filter-card" shadow="hover">
      <div class="filter-bar">
        <div class="filter-left">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索用户名称/手机号"
            :prefix-icon="Search"
            clearable
            class="search-input"
            @keyup.enter="handleFilter"
          />
          <el-select v-model="filters.role" placeholder="身份筛选" clearable class="filter-select">
            <el-option label="管理员" value="admin" />
            <el-option label="房东" value="host" />
            <el-option label="客户" value="user" />
          </el-select>
          <el-select v-model="filters.status" placeholder="状态筛选" clearable class="filter-select">
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="注册开始"
            end-placeholder="注册结束"
            class="date-picker"
            @change="handleFilter"
          />
        </div>
        <div class="filter-right">
          <el-button @click="resetFilter" :icon="Refresh">重置</el-button>
          <el-button type="primary" @click="handleFilter" :icon="Search">搜索</el-button>
        </div>
      </div>
    </el-card>

    <!-- 用户列表 -->
    <div class="table-wrapper">
      <el-table
        :data="filteredUsers"
        border
        stripe
        style="width: 100%; border-radius: 8px; overflow: hidden;"
        :header-cell-style="{ background: '#f5f7fa', color: '#303133', fontWeight: '600' }"
        v-loading="loading"
        row-key="id"
        :default-sort="{ prop: 'createTime', order: 'descending' }"
      >
        <!-- 展开行 - 显示详细信息 -->
        <el-table-column type="expand" width="50">
          <template #default="scope">
            <div class="expand-content">
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="用户ID">{{ scope.row.id }}</el-descriptions-item>
                <el-descriptions-item label="用户名">{{ scope.row.username }}</el-descriptions-item>
                <el-descriptions-item label="昵称">{{ scope.row.nickname || '未设置' }}</el-descriptions-item>
                <el-descriptions-item label="身份">{{ getRoleText(scope.row.role) }}</el-descriptions-item>
                <el-descriptions-item label="手机号">{{ scope.row.phone || '未绑定' }}</el-descriptions-item>
                <el-descriptions-item label="邮箱">{{ scope.row.email || '未绑定' }}</el-descriptions-item>
                <el-descriptions-item label="注册时间">{{ formatDateTime(scope.row.createTime) }}</el-descriptions-item>
                <el-descriptions-item label="最后更新">{{ formatDateTime(scope.row.updateTime) }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>

        <!-- 用户基本信息 -->
        <el-table-column label="用户信息" min-width="220">
          <template #default="scope">
            <div class="user-info">
              <el-avatar :size="40" :src="scope.row.avatar">
                {{ scope.row.username?.charAt(0) || '用' }}
              </el-avatar>
              <div class="user-detail">
                <div class="user-name">
                  {{ scope.row.nickname || scope.row.username }}
                  <el-tag 
                    v-if="scope.row.role === 'admin'" 
                    size="small" 
                    type="danger" 
                    effect="dark"
                    class="role-tag"
                  >管</el-tag>
                  <el-tag 
                    v-else-if="scope.row.role === 'host'" 
                    size="small" 
                    type="success" 
                    effect="dark"
                    class="role-tag"
                  >房</el-tag>
                  <el-tag 
                    v-else 
                    size="small" 
                    type="info" 
                    effect="dark"
                    class="role-tag"
                  >客</el-tag>
                </div>
                <div class="user-meta">
                  <span>ID: {{ scope.row.id }}</span>
                  <span class="dot">·</span>
                  <span>{{ scope.row.username }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 联系方式 -->
        <el-table-column label="联系方式" min-width="200">
          <template #default="scope">
            <div class="contact-info">
              <div class="contact-item" v-if="scope.row.phone">
                <el-icon><Iphone /></el-icon>
                <span>{{ scope.row.phone }}</span>
              </div>
              <div class="contact-item" v-else>
                <el-icon><Iphone /></el-icon>
                <span class="empty">未绑定</span>
              </div>
              <div class="contact-item" v-if="scope.row.email">
                <el-icon><Message /></el-icon>
                <span>{{ scope.row.email }}</span>
              </div>
              <div class="contact-item" v-else>
                <el-icon><Message /></el-icon>
                <span class="empty">未绑定</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 身份 -->
        <el-table-column label="身份" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getRoleType(scope.row.role)" size="large">
              {{ getRoleText(scope.row.role) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 状态 -->
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag 
              :type="scope.row.status === 1 ? 'success' : 'danger'" 
              size="large"
              effect="plain"
            >
              {{ scope.row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 注册时间 -->
        <el-table-column label="注册时间" width="160" sortable :sort-method="sortByDate">
          <template #default="scope">
            <div class="time-cell">
              <el-icon><Calendar /></el-icon>
              <span>{{ formatDateTime(scope.row.createTime) }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button 
                size="small" 
                type="primary" 
                :icon="View"
                @click="viewDetail(scope.row)"
              >
                详情
              </el-button>
              <el-dropdown @command="(cmd) => handleCommand(cmd, scope.row)">
                <el-button size="small" type="info" :icon="More">
                  更多
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit" :icon="Edit">编辑</el-dropdown-item>
                    <el-dropdown-item 
                      v-if="scope.row.status === 1" 
                      command="disable" 
                      :icon="CircleClose"
                      divided
                    >禁用</el-dropdown-item>
                    <el-dropdown-item 
                      v-else 
                      command="enable" 
                      :icon="CircleCheck"
                      divided
                    >启用</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        v-model:current-page="page"
        v-model:page-size="size"
        :page-sizes="[5, 10, 20, 50]"
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 用户详情对话框 -->
    <el-dialog v-model="detailDialog.visible" title="用户详情" width="500px" destroy-on-close>
      <div v-if="detailDialog.user" class="detail-content">
        <div class="detail-avatar">
          <el-avatar :size="80" :src="detailDialog.user.avatar">
            {{ detailDialog.user.username?.charAt(0) }}
          </el-avatar>
        </div>
        
        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户ID">{{ detailDialog.user.id }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ detailDialog.user.username }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ detailDialog.user.nickname || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="身份">
            <el-tag :type="getRoleType(detailDialog.user.role)">
              {{ getRoleText(detailDialog.user.role) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="detailDialog.user.status === 1 ? 'success' : 'danger'">
              {{ detailDialog.user.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="手机号">{{ detailDialog.user.phone || '未绑定' }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ detailDialog.user.email || '未绑定' }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ formatDateTime(detailDialog.user.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="最后更新">{{ formatDateTime(detailDialog.user.updateTime) }}</el-descriptions-item>
        </el-descriptions>

        <!-- 用户统计数据 -->
        <el-row :gutter="20" class="user-stats">
          <el-col :span="8">
            <div class="stat-box">
              <div class="stat-number">{{ detailDialog.user.houseCount || 0 }}</div>
              <div class="stat-label">发布的房源</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-box">
              <div class="stat-number">{{ detailDialog.user.appointmentCount || 0 }}</div>
              <div class="stat-label">预约订单</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-box">
              <div class="stat-number">{{ detailDialog.user.commentCount || 0 }}</div>
              <div class="stat-label">发表的评论</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-dialog>

    <!-- 编辑用户对话框 -->
    <el-dialog v-model="editDialog.visible" title="编辑用户" width="400px">
      <el-form :model="editDialog.form" label-width="80px">
        <el-form-item label="昵称">
          <el-input v-model="editDialog.form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editDialog.form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editDialog.form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="身份">
          <el-select v-model="editDialog.form.role" placeholder="请选择身份">
            <el-option label="客户" value="user" />
            <el-option label="房东" value="host" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="confirmEdit" :loading="editLoading">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 禁用/启用确认对话框 -->
    <el-dialog 
      v-model="statusDialog.visible" 
      :title="statusDialog.action === 'disable' ? '禁用用户' : '启用用户'" 
      width="400px" 
      center
    >
      <div class="status-content">
        <el-icon 
          :size="50" 
          :color="statusDialog.action === 'disable' ? '#F56C6C' : '#67C23A'"
        >
          <component :is="statusDialog.action === 'disable' ? WarningFilled : SuccessFilled" />
        </el-icon>
        <h3>{{ statusDialog.action === 'disable' ? '确定要禁用该用户吗？' : '确定要启用该用户吗？' }}</h3>
        <p>用户：{{ statusDialog.userName }}</p>
        <p class="status-warning" v-if="statusDialog.action === 'disable'">
          禁用后用户将无法登录系统
        </p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="statusDialog.visible = false">取消</el-button>
          <el-button 
            :type="statusDialog.action === 'disable' ? 'danger' : 'success'"
            @click="confirmStatusChange" 
            :loading="statusLoading"
          >
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue"
import { ElMessage } from "element-plus"
import {
  Search,
  Refresh,
  View,
  More,
  Edit,
  CircleClose,
  CircleCheck,
  Iphone,
  Message,
  Calendar,
  WarningFilled,
  SuccessFilled
} from "@element-plus/icons-vue"
import request from "../../utils/request"

// 数据
const filteredUsers = ref([])
const page = ref(1)
const size = ref(10)
const total = ref(0)
const loading = ref(false)
const adminCount = ref(0)
const hostCount = ref(0)
const userCount = ref(0)

// 筛选条件
const filters = ref({
  keyword: "",
  role: "",
  status: null,
  dateRange: []
})

// 对话框状态
const detailDialog = ref({
  visible: false,
  user: null
})

const editDialog = ref({
  visible: false,
  form: {
    id: null,
    nickname: "",
    phone: "",
    email: "",
    role: ""
  }
})
const editLoading = ref(false)

const statusDialog = ref({
  visible: false,
  userId: null,
  userName: "",
  action: "disable" // disable 或 enable
})
const statusLoading = ref(false)

// 获取用户信息
const getUserInfo = () => {
  try {
    return JSON.parse(localStorage.getItem("user"))
  } catch {
    return null
  }
}

// 加载用户列表
function loadUsers() {
  const user = getUserInfo()
  if (!user) {
    ElMessage.error("请先登录")
    return
  }

  loading.value = true
  request.get("/admin/users", {
    params: {
      page: page.value,
      size: size.value,
      keyword: filters.value.keyword,
      role: filters.value.role,
      status: filters.value.status,
      startDate: formatDate(filters.value.dateRange?.[0]),
      endDate: formatDate(filters.value.dateRange?.[1])
    },
    headers: {
      "X-User-Role": user.role
    }
  }).then(res => {
    filteredUsers.value = res.data.records || []
    total.value = res.data.total || 0
  }).catch(error => {
    ElMessage.error("加载用户列表失败")
    console.error(error)
  }).finally(() => {
    loading.value = false
  })
}

// 加载用户统计数据
function loadUserStats() {
  request.get("/admin/user/stats").then(res => {
    total.value = res.data.total
    adminCount.value = res.data.adminCount
    hostCount.value = res.data.hostCount
    userCount.value = res.data.userCount
  })
}

// 筛选处理
function handleFilter() {
  page.value = 1
  loadUsers()
}

// 重置筛选
function resetFilter() {
  filters.value = {
    keyword: "",
    role: "",
    status: null,
    dateRange: []
  }
  page.value = 1
  loadUsers()
}

// 分页处理
function handleCurrentChange(newPage) {
  page.value = newPage
  loadUsers()
}

function handleSizeChange(newSize) {
  size.value = newSize
  page.value = 1
  loadUsers()
}

// 排序函数
function sortByDate(a, b) {
  return new Date(a.createTime) - new Date(b.createTime)
}

// 查看详情
function viewDetail(row) {
  detailDialog.value = {
    visible: true,
    user: row
  }
}

// 下拉菜单命令处理
function handleCommand(cmd, row) {
  switch (cmd) {
    case 'edit':
      openEditDialog(row)
      break
    case 'disable':
      openStatusDialog(row, 'disable')
      break
    case 'enable':
      openStatusDialog(row, 'enable')
      break
  }
}

// 打开编辑对话框
function openEditDialog(row) {
  editDialog.value = {
    visible: true,
    form: {
      id: row.id,
      nickname: row.nickname || "",
      phone: row.phone || "",
      email: row.email || "",
      role: row.role
    }
  }
}

// 确认编辑
async function confirmEdit() {
  const user = getUserInfo()
  if (!user) return

  editLoading.value = true
  try {
    await request.post("/admin/user/update", editDialog.value.form, {
      headers: {
        "X-User-Role": user.role,
        "X-User-Id": user.userId
      }
    })
    
    ElMessage.success("修改成功")
    editDialog.value.visible = false
    loadUsers()
  } catch (error) {
    ElMessage.error(error.response?.data || "修改失败")
  } finally {
    editLoading.value = false
  }
}

// 打开状态变更对话框
function openStatusDialog(row, action) {
  statusDialog.value = {
    visible: true,
    userId: row.id,
    userName: row.nickname || row.username,
    action
  }
}

// 确认状态变更
async function confirmStatusChange() {
  const user = getUserInfo()
  if (!user) return

  statusLoading.value = true
  try {
    const url = statusDialog.value.action === 'disable' 
      ? `/admin/user/disable/${statusDialog.value.userId}`
      : `/admin/user/enable/${statusDialog.value.userId}`
    
    await request.post(url, {}, {
      headers: {
        "X-User-Role": user.role,
        "X-User-Id": user.userId
      }
    })
    
    ElMessage.success(statusDialog.value.action === 'disable' ? "已禁用" : "已启用")
    statusDialog.value.visible = false
    loadUsers()
  } catch (error) {
    ElMessage.error(error.response?.data || "操作失败")
  } finally {
    statusLoading.value = false
  }
}

// 角色相关函数
function getRoleText(role) {
  const map = {
    admin: '管理员',
    host: '房东',
    user: '客户'
  }
  return map[role] || role
}

function getRoleType(role) {
  const map = {
    admin: 'danger',
    host: 'success',
    user: 'info'
  }
  return map[role] || 'info'
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateTime(dateStr) {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

onMounted(() => {
  loadUsers()
  loadUserStats()
})

watch([page, size], () => {
  loadUsers()
  loadUserStats()
})
</script>

<style scoped>
.admin-users-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left h2 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

/* 统计卡片 */
.stats-card {
  display: flex;
  gap: 24px;
  padding: 16px 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.stat-value.info {
  color: #909399;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.warning {
  color: #e6a23c;
}

/* 筛选栏 */
.filter-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.filter-left {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input {
  width: 250px;
}

.filter-select {
  width: 120px;
}

.date-picker {
  width: 240px;
}

.filter-right {
  display: flex;
  gap: 8px;
}

/* 表格样式 */
.table-wrapper {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

/* 用户信息 */
.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-detail {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.role-tag {
  font-size: 10px;
  padding: 2px 4px;
}

.user-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  color: #dcdfe6;
}

/* 联系方式 */
.contact-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #606266;
}

.contact-item .el-icon {
  font-size: 14px;
  color: #909399;
}

.contact-item .empty {
  color: #909399;
}

/* 时间单元格 */
.time-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #606266;
  font-size: 12px;
}

.time-cell .el-icon {
  font-size: 14px;
  color: #909399;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 8px;
}

/* 展开行内容 */
.expand-content {
  padding: 16px;
  background-color: #fafafa;
}

/* 详情对话框 */
.detail-content {
  padding: 10px;
}

.detail-avatar {
  text-align: center;
  margin-bottom: 20px;
}

.user-stats {
  margin-top: 20px;
}

.stat-box {
  text-align: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-number {
  font-size: 20px;
  font-weight: 600;
  color: #409EFF;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

/* 状态对话框 */
.status-content {
  text-align: center;
  padding: 20px 0;
}

.status-content h3 {
  margin: 16px 0 8px;
  font-size: 18px;
  color: #303133;
}

.status-warning {
  color: #f56c6c;
  font-size: 13px;
  margin-top: 8px;
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .admin-users-container {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .stats-card {
    width: 100%;
    justify-content: space-around;
  }

  .filter-left {
    width: 100%;
  }

  .search-input,
  .filter-select,
  .date-picker {
    width: 100%;
  }

  .filter-bar {
    flex-direction: column;
  }

  .filter-right {
    width: 100%;
    justify-content: space-between;
  }

  .user-info {
    min-width: 180px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons .el-button {
    width: 100%;
  }

  .user-stats .el-col {
    margin-bottom: 12px;
  }
}
</style>