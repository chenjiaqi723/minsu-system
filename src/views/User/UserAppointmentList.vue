<template>
  <div class="appointment-container">
    <!-- 页面标题和统计 -->
    <div class="page-header">
      <div class="header-left">
        <h2>我的预约</h2>
        <p class="subtitle">查看和管理你的所有预约订单</p>
      </div>
      <div class="header-right">
        <div class="stats-card">
          <div class="stat-item">
            <span class="stat-label">全部预约</span>
            <span class="stat-value">{{ total }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">待处理</span>
            <span class="stat-value warning">{{ pendingCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">待支付</span>
            <span class="stat-value danger">{{ unpaidCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已完成</span>
            <span class="stat-value success">{{ completedCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选和搜索栏 -->
    <el-card class="filter-card" shadow="hover">
      <div class="filter-bar">
        <div class="filter-left">
          <el-select v-model="statusFilter" placeholder="预约状态" clearable class="filter-select">
            <el-option label="待处理" :value="0" />
            <el-option label="已接受" :value="1" />
            <el-option label="已拒绝" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
            <el-option label="未入住" :value="5" />
          </el-select>

          <el-select v-model="payStatusFilter" placeholder="支付状态" clearable class="filter-select">
            <el-option label="待支付" :value="0" />
            <el-option label="已支付" :value="1" />
            <el-option label="部分退款" :value="2" />
            <el-option label="已退款" :value="3" />
          </el-select>

          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="date-picker"
            @change="handleDateChange"
          />
        </div>

        <div class="filter-right">
          <el-button type="primary" @click="handleFilter" :icon="Search">
            筛选
          </el-button>
          <el-button @click="resetFilter" :icon="Refresh">
            重置
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 预约列表 -->
    <div class="table-wrapper">
      <el-table
        :data="list"
        border
        stripe
        size="default"
        :header-cell-style="{ background: '#f5f7fa', color: '#303133', fontWeight: '600' }"
        style="width: 100%; border-radius: 8px; overflow: hidden;"
        v-loading="loading"
        empty-text="暂无预约记录"
      >
        <!-- 展开行 - 显示详细信息 -->
        <el-table-column type="expand" width="50">
          <template #default="scope">
            <div class="expand-content">
              <el-descriptions :column="3" border size="small">
                <el-descriptions-item label="预约编号">{{ scope.row.id }}</el-descriptions-item>
                <el-descriptions-item label="房源ID">{{ scope.row.houseId }}</el-descriptions-item>
                <el-descriptions-item label="创建时间">{{ formatDateTime(scope.row.createTime) }}</el-descriptions-item>
                <el-descriptions-item label="入住日期">{{ scope.row.startDate }}</el-descriptions-item>
                <el-descriptions-item label="离店日期">{{ scope.row.endDate }}</el-descriptions-item>
                <el-descriptions-item label="入住天数">{{ calculateDays(scope.row.startDate, scope.row.endDate) }}晚</el-descriptions-item>
                <el-descriptions-item label="联系人">{{ scope.row.contactName || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="联系电话">{{ scope.row.contactPhone || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="特殊要求">{{ scope.row.specialRequests || '无' }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>

        <!-- 房源信息 -->
        <el-table-column label="房源信息" min-width="200">
          <template #default="scope">
            <div class="house-info" @click="goToHouseDetail(scope.row.houseId)">
              <el-image
                :src="scope.row.houseCover || '/default-house.jpg'"
                class="house-cover"
                fit="cover"
              >
                <template #error>
                  <div class="cover-placeholder">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div class="house-detail">
                <div class="house-title">{{ scope.row.houseTitle || '未知房源' }}</div>
                <div class="house-price">￥{{ formatMoney(scope.row.totalPrice) }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 日期 -->
        <el-table-column label="入住-离店" min-width="180">
          <template #default="scope">
            <div class="date-info">
              <div class="date-range">
                <el-icon><Calendar /></el-icon>
                <span>{{ scope.row.startDate }} → {{ scope.row.endDate }}</span>
              </div>
              <div class="stay-days">共 {{ calculateDays(scope.row.startDate, scope.row.endDate) }} 晚</div>
            </div>
          </template>
        </el-table-column>

        <!-- 状态 -->
        <el-table-column label="预约状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status).type" effect="dark" size="large">
              {{ getStatusTag(scope.row.status).text }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="支付状态" width="100">
          <template #default="scope">
            <el-tag :type="getPayStatusTag(scope.row.payStatus).type" effect="plain" size="large">
              {{ getPayStatusTag(scope.row.payStatus).text }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 金额 -->
        <el-table-column label="金额" width="120">
          <template #default="scope">
            <div class="amount-info">
              <div class="total-amount">￥{{ formatMoney(scope.row.totalPrice) }}</div>
              <div v-if="scope.row.refundAmount > 0" class="refund-amount">
                退款: ￥{{ formatMoney(scope.row.refundAmount) }}
              </div>
              <div v-if="scope.row.penaltyAmount > 0" class="penalty-amount">
                违约金: ￥{{ formatMoney(scope.row.penaltyAmount) }}
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <!-- 立即支付 -->
              <el-button
                v-if="scope.row.status === 1 && scope.row.payStatus === 0"
                size="small"
                type="primary"
                :icon="Money"
                @click="pay(scope.row)"
              >
                支付
              </el-button>
              
              <!-- 取消预约 -->
              <el-button
                v-if="scope.row.status === 0 || scope.row.status === 1"
                size="small"
                type="warning"
                :icon="Close"
                @click="cancel(scope.row)"
              >
                取消
              </el-button>

              <!-- 评论 -->
              <el-button
                v-if="scope.row.status === 3 && !scope.row.hasCommented"
                size="small"
                type="success"
                :icon="ChatDotRound"
                @click="goComment(scope.row)"
              >
                评论
              </el-button>

              <!-- 查看详情 -->
              <el-button
                size="small"
                type="info"
                :icon="View"
                @click="viewDetail(scope.row)"
              >
                详情
              </el-button>
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

    <!-- 支付对话框 -->
    <el-dialog v-model="showPayDialog" title="支付确认" width="400px" center>
      <div class="pay-dialog-content">
        <el-icon :size="50" color="#67C23A"><SuccessFilled /></el-icon>
        <h3>确认支付</h3>
        <p>预约ID: {{ currentAppointment?.id }}</p>
        <p class="pay-amount">支付金额: ￥{{ formatMoney(currentAppointment?.totalPrice) }}</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPayDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmPay" :loading="payLoading">
            确认支付
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 取消确认对话框 -->
    <el-dialog v-model="showCancelDialog" title="取消预约" width="400px" center>
      <div class="cancel-dialog-content">
        <el-icon :size="50" color="#E6A23C"><WarningFilled /></el-icon>
        <h3>确定要取消这个预约吗？</h3>
        <p v-if="currentAppointment?.penaltyAmount > 0" class="penalty-warning">
          取消将产生违约金: ￥{{ formatMoney(currentAppointment.penaltyAmount) }}
        </p>
        <p v-else class="info-text">取消后可以重新预约</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCancelDialog = false">再想想</el-button>
          <el-button type="danger" @click="confirmCancel" :loading="cancelLoading">
            确认取消
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="预约详情" width="600px">
      <div v-if="currentAppointment" class="detail-dialog-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="预约ID" :span="2">{{ currentAppointment.id }}</el-descriptions-item>
          <el-descriptions-item label="房源名称" :span="2">{{ currentAppointment.houseTitle || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="入住日期">{{ currentAppointment.startDate }}</el-descriptions-item>
          <el-descriptions-item label="离店日期">{{ currentAppointment.endDate }}</el-descriptions-item>
          <el-descriptions-item label="入住天数">{{ calculateDays(currentAppointment.startDate, currentAppointment.endDate) }}晚</el-descriptions-item>
          <el-descriptions-item label="人数">{{ currentAppointment.guestCount || 1 }}人</el-descriptions-item>
          <el-descriptions-item label="预约状态">
            <el-tag :type="getStatusTag(currentAppointment.status).type" size="small">
              {{ getStatusTag(currentAppointment.status).text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="支付状态">
            <el-tag :type="getPayStatusTag(currentAppointment.payStatus).type" size="small">
              {{ getPayStatusTag(currentAppointment.payStatus).text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="总金额">￥{{ formatMoney(currentAppointment.totalPrice) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(currentAppointment.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="联系人" :span="2">{{ currentAppointment.contactName || '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话" :span="2">{{ currentAppointment.contactPhone || '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="特殊要求" :span="2">{{ currentAppointment.specialRequests || '无' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue"
import { useRouter } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import {
  Search,
  Refresh,
  Picture,
  Calendar,
  Money,
  Close,
  ChatDotRound,
  View,
  SuccessFilled,
  WarningFilled
} from "@element-plus/icons-vue"
import request from "../../utils/request"
import { formatMoney } from "../../utils/format"

const router = useRouter()

// 数据
const total = ref(0)
const page = ref(1)
const size = ref(10)
const list = ref([])
const loading = ref(false)

// 筛选条件
const statusFilter = ref(null)
const payStatusFilter = ref(null)
const dateRange = ref([])

// 对话框
const showPayDialog = ref(false)
const showCancelDialog = ref(false)
const showDetailDialog = ref(false)
const payLoading = ref(false)
const cancelLoading = ref(false)
const currentAppointment = ref(null)

// 统计信息
const pendingCount = computed(() => {
  return list.value.filter(item => item.status === 0).length
})

const unpaidCount = computed(() => {
  return list.value.filter(item => item.payStatus === 0).length
})

const completedCount = computed(() => {
  return list.value.filter(item => item.status === 3).length
})

// 获取用户信息
const getUserInfo = () => {
  const userStr = localStorage.getItem("user")
  return userStr ? JSON.parse(userStr) : null
}

// 加载数据
async function loadData() {
  const user = getUserInfo()
  if (!user) {
    ElMessage.error("请先登录")
    router.push("/login")
    return
  }

  loading.value = true
  try {
    const params = {
      page: page.value,
      size: size.value
    }

    // 添加筛选条件
    if (statusFilter.value !== null && statusFilter.value !== '') {
      params.status = statusFilter.value
    }
    if (payStatusFilter.value !== null && payStatusFilter.value !== '') {
      params.payStatus = payStatusFilter.value
    }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = formatDate(dateRange.value[0])
      params.endDate = formatDate(dateRange.value[1])
    }

    const res = await request.get("/appointment/my", {
      params,
      headers: {
        "X-User-Id": user.userId,
        "X-User-Role": user.role
      }
    })
    
    list.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (error) {
    ElMessage.error("加载预约列表失败")
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 筛选
function handleFilter() {
  page.value = 1
  loadData()
}

// 重置筛选
function resetFilter() {
  statusFilter.value = null
  payStatusFilter.value = null
  dateRange.value = []
  page.value = 1
  loadData()
}

// 日期变化
function handleDateChange() {
  if (dateRange.value && dateRange.value.length === 2) {
    handleFilter()
  }
}

// 分页
function handleCurrentChange(newPage) {
  page.value = newPage
  loadData()
}

function handleSizeChange(newSize) {
  size.value = newSize
  page.value = 1
  loadData()
}

// 支付
function pay(appointment) {
  currentAppointment.value = appointment
  showPayDialog.value = true
}

async function confirmPay() {
  const user = getUserInfo()
  if (!user) return

  payLoading.value = true
  try {
    const res = await request.post(`/appointment/pay/${currentAppointment.value.id}`, {}, {
      headers: { "X-User-Id": user.userId }
    })
    
    ElMessage.success(res.data || "支付成功")
    showPayDialog.value = false
    loadData()
  } catch (error) {
    ElMessage.error("支付失败")
  } finally {
    payLoading.value = false
  }
}

// 取消
function cancel(appointment) {
  currentAppointment.value = appointment
  showCancelDialog.value = true
}

async function confirmCancel() {
  const user = getUserInfo()
  if (!user) return

  cancelLoading.value = true
  try {
    const res = await request.post(`/appointment/cancel/${currentAppointment.value.id}`, {}, {
      headers: { "X-User-Id": user.userId }
    })
    
    ElMessage.success(res.data || "取消成功")
    showCancelDialog.value = false
    loadData()
  } catch (error) {
    ElMessage.error("取消失败")
  } finally {
    cancelLoading.value = false
  }
}

// 评论
function goComment(appointment) {
  router.push(`/user/comment/write?appointmentId=${appointment.id}&houseId=${appointment.houseId}`)
}

// 查看详情
function viewDetail(appointment) {
  currentAppointment.value = appointment
  showDetailDialog.value = true
}

// 跳转到房源详情
function goToHouseDetail(houseId) {
  router.push(`/user/house/${houseId}`)
}

// 计算入住天数
function calculateDays(startDate, endDate) {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
}

// 格式化日期
function formatDate(date) {
  if (!date) return null
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化日期时间
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

// 状态标签
function getStatusTag(status) {
  const map = {
    0: { type: "warning", text: "待处理" },
    1: { type: "success", text: "已接受" },
    2: { type: "danger", text: "已拒绝" },
    3: { type: "info", text: "已完成" },
    4: { type: "", text: "已取消" },
    5: { type: "danger", text: "未入住" }
  }
  return map[status] || { type: "info", text: "未知" }
}

function getPayStatusTag(payStatus) {
  const map = {
    0: { type: "warning", text: "待支付" },
    1: { type: "success", text: "已支付" },
    2: { type: "danger", text: "部分退款" },
    3: { type: "info", text: "已退款" }
  }
  return map[payStatus] || { type: "info", text: "未知" }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.appointment-container {
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

.stat-value.danger {
  color: #f56c6c;
}

.stat-value.success {
  color: #67c23a;
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

.filter-select {
  width: 140px;
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

/* 房源信息 */
.house-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.house-info:hover {
  background-color: #f5f7fa;
}

.house-cover {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  overflow: hidden;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #909399;
}

.house-detail {
  flex: 1;
}

.house-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.house-price {
  font-size: 12px;
  color: #f56c6c;
}

/* 日期信息 */
.date-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #606266;
}

.stay-days {
  font-size: 12px;
  color: #909399;
}

/* 金额信息 */
.amount-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.total-amount {
  font-size: 16px;
  font-weight: 600;
  color: #f56c6c;
}

.refund-amount {
  font-size: 12px;
  color: #67c23a;
}

.penalty-amount {
  font-size: 12px;
  color: #f56c6c;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

/* 展开行内容 */
.expand-content {
  padding: 16px;
  background-color: #fafafa;
}

/* 对话框内容 */
.pay-dialog-content,
.cancel-dialog-content {
  text-align: center;
  padding: 20px 0;
}

.pay-dialog-content h3,
.cancel-dialog-content h3 {
  margin: 16px 0 8px;
  font-size: 18px;
  color: #303133;
}

.pay-amount {
  font-size: 24px;
  font-weight: 600;
  color: #f56c6c;
  margin: 16px 0 0;
}

.penalty-warning {
  color: #e6a23c;
  font-weight: 500;
  margin: 16px 0 0;
}

.info-text {
  color: #909399;
  margin: 16px 0 0;
}

/* 详情对话框 */
.detail-dialog-content {
  max-height: 500px;
  overflow-y: auto;
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .appointment-container {
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

  .filter-select,
  .date-picker {
    width: 100%;
  }

  .filter-bar {
    flex-direction: column;
  }

  .filter-right {
    width: 100%;
    justify-content: flex-end;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>