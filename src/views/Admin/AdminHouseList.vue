<template>
  <div class="admin-houses-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>房源审核管理</h2>
        <p class="subtitle">审核房东提交的房源信息，管理平台上架房源</p>
      </div>
      <div class="header-right">
        <div class="stats-card">
          <div class="stat-item">
            <span class="stat-label">待审核</span>
            <span class="stat-value warning">{{ pendingCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已上架</span>
            <span class="stat-value success">{{ approvedCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已拒绝</span>
            <span class="stat-value danger">{{ rejectedCount }}</span>
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
            placeholder="搜索房源标题/地址/房东"
            :prefix-icon="Search"
            clearable
            class="search-input"
            @keyup.enter="handleFilter"
          />
          <el-select v-model="filters.status" placeholder="状态筛选" clearable class="filter-select">
            <el-option label="待审核" :value="0" />
            <el-option label="已上架" :value="1" />
            <el-option label="已拒绝" :value="2" />
          </el-select>
          <el-input
            v-model="filters.hostId"
            placeholder="房东ID"
            clearable
            class="filter-small"
          />
        </div>
        <div class="filter-right">
          <el-button @click="resetFilter" :icon="Refresh">重置</el-button>
          <el-button type="primary" @click="handleFilter" :icon="Search">搜索</el-button>
        </div>
      </div>
    </el-card>

    <!-- 房源列表 -->
    <div class="table-wrapper">
      <el-table
        :data="filteredHouses"
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
                <el-descriptions-item label="房源ID">{{ scope.row.id }}</el-descriptions-item>
                <el-descriptions-item label="房东ID">{{ scope.row.hostId }}</el-descriptions-item>
                <el-descriptions-item label="房东昵称">{{ scope.row.hostName || '未知' }}</el-descriptions-item>
                <el-descriptions-item label="联系电话">{{ scope.row.contactPhone || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="可住人数">{{ scope.row.capacity || 1 }}人</el-descriptions-item>
                <el-descriptions-item label="创建时间">{{ formatDateTime(scope.row.createTime) }}</el-descriptions-item>
                <el-descriptions-item label="详细地址" :span="2">{{ scope.row.address || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="房源描述" :span="2">{{ scope.row.description || '暂无描述' }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>

        <!-- 房源基本信息 -->
        <el-table-column label="房源信息" min-width="250">
          <template #default="scope">
            <div class="house-info">
              <div class="house-title">{{ scope.row.title }}</div>
              <div class="house-meta">
                <span>ID: {{ scope.row.id }}</span>
                <span class="dot">·</span>
                <span>房东ID: {{ scope.row.hostId }}</span>
              </div>
              <div class="house-price">¥{{ formatMoney(scope.row.price) }}/晚</div>
            </div>
          </template>
        </el-table-column>

        <!-- 地址 -->
        <el-table-column label="地址" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            <div class="address-cell">
              <el-icon><Location /></el-icon>
              <span>{{ scope.row.address || '未填写' }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 房东信息 -->
        <el-table-column label="房东" width="150">
          <template #default="scope">
            <div class="host-info">
              <el-avatar :size="32">
                {{ scope.row.hostName?.charAt(0) || '房' }}
              </el-avatar>
              <div class="host-detail">
                <div class="host-name">{{ scope.row.hostName || '未知' }}</div>
                <div class="host-id">ID: {{ scope.row.hostId }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 价格/容量 -->
        <el-table-column label="详情" width="120" align="center">
          <template #default="scope">
            <div class="detail-cell">
              <div>¥{{ formatMoney(scope.row.price) }}</div>
              <div class="capacity">
                <el-icon><User /></el-icon>
                {{ scope.row.capacity || 1 }}人
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 状态 -->
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag 
              :type="getStatusType(scope.row.status)" 
              effect="dark" 
              size="large"
            >
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 创建时间 -->
        <el-table-column label="提交时间" width="160">
          <template #default="scope">
            <div class="time-cell">
              <el-icon><Calendar /></el-icon>
              <span>{{ formatDate(scope.row.createTime) }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="审核操作" width="200" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <template v-if="scope.row.status === 0">
                <el-button 
                  size="small" 
                  type="success" 
                  :icon="Check"
                  @click="approve(scope.row)"
                >
                  通过
                </el-button>
                <el-button 
                  size="small" 
                  type="danger" 
                  :icon="Close"
                  @click="reject(scope.row)"
                >
                  拒绝
                </el-button>
              </template>
              <el-tag v-else type="info" size="small" effect="plain">
                已处理
              </el-tag>
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

    <!-- 审核确认对话框 - 通过 -->
    <el-dialog v-model="approveDialog.visible" title="通过审核" width="400px" center>
      <div class="audit-content">
        <el-icon :size="50" color="#67C23A"><SuccessFilled /></el-icon>
        <h3>确认通过审核？</h3>
        <p class="house-title">{{ approveDialog.houseTitle }}</p>
        <p class="audit-info">通过后，房源将对外展示并可被用户预订</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="approveDialog.visible = false">取消</el-button>
          <el-button type="success" @click="confirmApprove" :loading="approveLoading">
            确认通过
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 审核确认对话框 - 拒绝 -->
    <el-dialog v-model="rejectDialog.visible" title="拒绝审核" width="400px">
      <div class="audit-content">
        <el-icon :size="50" color="#F56C6C"><WarningFilled /></el-icon>
        <h3>确认拒绝该房源？</h3>
        <p class="house-title">{{ rejectDialog.houseTitle }}</p>
        
        <el-form :model="rejectDialog" label-width="80px" class="reject-form">
          <el-form-item label="拒绝原因">
            <el-input
              v-model="rejectDialog.reason"
              type="textarea"
              :rows="3"
              placeholder="请输入拒绝原因（可选）"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="rejectDialog.visible = false">取消</el-button>
          <el-button type="danger" @click="confirmReject" :loading="rejectLoading">
            确认拒绝
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue"
import { ElMessage } from "element-plus"
import {
  Search,
  Refresh,
  Check,
  Close,
  SuccessFilled,
  WarningFilled,
  Location,
  User,
  Calendar
} from "@element-plus/icons-vue"
import request from "../../utils/request"
import { formatMoney } from "../../utils/format"

// 数据
const filteredHouses = ref([])
const houses = ref([])
const page = ref(1)
const size = ref(10)
const total = ref(0)
const loading = ref(false)

// 筛选条件
const filters = ref({
  keyword: "",
  status: null,
  hostId: ""
})

// 审核对话框
const approveDialog = ref({
  visible: false,
  houseId: null,
  houseTitle: ""
})
const approveLoading = ref(false)

const rejectDialog = ref({
  visible: false,
  houseId: null,
  houseTitle: "",
  reason: ""
})
const rejectLoading = ref(false)

// 计算属性 - 状态统计
const pendingCount = computed(() => {
  return houses.value.filter(item => item.status === 0).length
})

const approvedCount = computed(() => {
  return houses.value.filter(item => item.status === 1).length
})

const rejectedCount = computed(() => {
  return houses.value.filter(item => item.status === 2).length
})

// 获取用户信息
const getUserInfo = () => {
  try {
    return JSON.parse(localStorage.getItem("user"))
  } catch {
    return null
  }
}

// 加载房源
function loadHouses() {
  const user = getUserInfo()
  if (!user) {
    ElMessage.error("请先登录")
    return
  }

  loading.value = true
  request.get("/admin/houses", {
    params: {
      page: page.value,
      size: size.value,
      keyword: filters.value.keyword,
      status: filters.value.status,
      hostId: filters.value.hostId || null
    },
    headers: {
      "X-User-Role": user.role
    }
  }).then(res => {
    filteredHouses.value = res.data.records || []
    total.value = res.data.total || 0
  }).catch(error => {
    ElMessage.error("加载房源失败")
    console.error(error)
  }).finally(() => {
    loading.value = false
  })
}

// 筛选处理
function handleFilter() {
  page.value = 1
  loadHouses()
}

// 重置筛选
function resetFilter() {
  filters.value = {
    keyword: "",
    status: null,
    hostId: ""
  }
  page.value = 1
  handleFilter()
}

// 分页处理
function handleCurrentChange(newPage) {
  page.value = newPage
  loadHouses()
}

function handleSizeChange(newSize) {
  size.value = newSize
  page.value = 1
  loadHouses()
}

// 通过审核
function approve(row) {
  approveDialog.value = {
    visible: true,
    houseId: row.id,
    houseTitle: row.title
  }
}

// 确认通过
async function confirmApprove() {
  const user = getUserInfo()
  if (!user) return

  approveLoading.value = true
  try {
    const res = await request.post(`/admin/house/approve/${approveDialog.value.houseId}`, {}, {
      headers: { 
        "X-User-Role": user.role,
        "X-User-Id": user.userId
      }
    })
    
    ElMessage.success(res.data || "审核通过")
    approveDialog.value.visible = false
    loadHouses()
  } catch (error) {
    ElMessage.error(error.response?.data || "操作失败")
  } finally {
    approveLoading.value = false
  }
}

// 拒绝审核
function reject(row) {
  rejectDialog.value = {
    visible: true,
    houseId: row.id,
    houseTitle: row.title,
    reason: ""
  }
}

// 确认拒绝
async function confirmReject() {
  const user = getUserInfo()
  if (!user) return

  rejectLoading.value = true
  try {
    const res = await request.post(`/admin/house/reject/${rejectDialog.value.houseId}`, {
      reason: rejectDialog.value.reason
    }, {
      headers: { 
        "X-User-Role": user.role,
        "X-User-Id": user.userId
      }
    })
    
    ElMessage.success(res.data || "已拒绝")
    rejectDialog.value.visible = false
    loadHouses()
  } catch (error) {
    ElMessage.error(error.response?.data || "操作失败")
  } finally {
    rejectLoading.value = false
  }
}

// 状态相关函数
function getStatusType(status) {
  const map = {
    0: 'warning',
    1: 'success',
    2: 'danger'
  }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = {
    0: '待审核',
    1: '已上架',
    2: '已拒绝'
  }
  return map[status] || '未知'
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
  loadHouses()
})

watch([page, size], () => {
  loadHouses()
})
</script>

<style scoped>
.admin-houses-container {
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

.stat-value.warning {
  color: #e6a23c;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.danger {
  color: #f56c6c;
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

.filter-small {
  width: 100px;
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

/* 房源信息 */
.house-info {
  padding: 4px 0;
}

.house-title {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.house-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.dot {
  color: #dcdfe6;
}

.house-price {
  font-size: 14px;
  color: #f56c6c;
  font-weight: 500;
}

/* 地址单元格 */
.address-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #606266;
  font-size: 13px;
}

.address-cell .el-icon {
  font-size: 14px;
  color: #909399;
  flex-shrink: 0;
}

/* 房东信息 */
.host-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.host-detail {
  overflow: hidden;
}

.host-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.host-id {
  font-size: 12px;
  color: #909399;
}

/* 详情单元格 */
.detail-cell {
  text-align: center;
}

.detail-cell .capacity {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
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
  justify-content: center;
}

/* 展开行内容 */
.expand-content {
  padding: 16px;
  background-color: #fafafa;
}

/* 审核对话框 */
.audit-content {
  text-align: center;
  padding: 10px 0;
}

.audit-content h3 {
  margin: 16px 0 8px;
  font-size: 18px;
  color: #303133;
}

.house-title {
  font-size: 16px;
  font-weight: 500;
  color: #409EFF;
  margin: 8px 0;
  word-break: break-word;
}

.audit-info {
  color: #606266;
  font-size: 14px;
  margin: 8px 0;
}

.reject-form {
  margin-top: 16px;
  text-align: left;
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .admin-houses-container {
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
  .filter-small {
    width: 100%;
  }

  .filter-bar {
    flex-direction: column;
  }

  .filter-right {
    width: 100%;
    justify-content: space-between;
  }

  .host-info {
    min-width: 100px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons .el-button {
    width: 100%;
  }
}
</style>