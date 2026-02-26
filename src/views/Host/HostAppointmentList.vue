<template>
  <div class="host-appointments-container">
    <!-- 页面标题和统计 -->
    <div class="page-header">
      <div class="header-left">
        <h2>房源预约管理</h2>
        <p class="subtitle">管理所有房源的预约订单</p>
      </div>
      <div class="header-right">
        <div class="stats-card">
          <div class="stat-item">
            <span class="stat-label">总预约</span>
            <span class="stat-value">{{ total }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">待处理</span>
            <span class="stat-value warning">{{ pendingCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已接受</span>
            <span class="stat-value success">{{ acceptedCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已完成</span>
            <span class="stat-value info">{{ completedCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选和搜索栏 -->
    <el-card class="filter-card" shadow="hover">
      <div class="filter-bar">
        <div class="filter-left">
          <el-select v-model="filters.status" placeholder="预约状态" clearable class="filter-select">
            <el-option label="待处理" :value="0" />
            <el-option label="已接受" :value="1" />
            <el-option label="已拒绝" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
            <el-option label="未入住" :value="5" />
          </el-select>

          <el-select v-model="filters.payStatus" placeholder="支付状态" clearable class="filter-select">
            <el-option label="待支付" :value="0" />
            <el-option label="已支付" :value="1" />
            <el-option label="部分退款" :value="2" />
            <el-option label="已退款" :value="3" />
          </el-select>

          <!-- 关键词搜索（房源名称） -->
          <el-input
            v-model="filters.keyword"
            placeholder="房源名称"
            clearable
            class="filter-input"
            :prefix-icon="Search"
          />

          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="date-picker"
          />
        </div>

        <div class="filter-right">
          <el-button type="primary" @click="handleFilter" :icon="Search">筛选</el-button>
          <el-button @click="resetFilter" :icon="Refresh">重置</el-button>
          <el-button @click="exportData" :icon="Download">导出</el-button>
        </div>
      </div>
    </el-card>

    <!-- 预约列表 -->
    <div class="table-wrapper">
      <el-table
        :data="appointments"
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
                <el-descriptions-item label="预约编号">{{ scope.row.id }}</el-descriptions-item>
                <el-descriptions-item label="创建时间">{{ formatDateTime(scope.row.createTime) }}</el-descriptions-item>
                <el-descriptions-item label="房源名称">{{ scope.row.houseTitle || '未知' }}</el-descriptions-item>
                <el-descriptions-item label="用户昵称">{{ scope.row.userName || '未知' }}</el-descriptions-item>
                <el-descriptions-item label="联系电话">{{ scope.row.contactPhone || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="入住人数">{{ scope.row.guestCount || 1 }}人</el-descriptions-item>
                <el-descriptions-item label="特殊要求" :span="2">{{ scope.row.specialRequests || '无' }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>

        <!-- 预约基本信息 -->
        <el-table-column label="预约信息" min-width="200">
          <template #default="scope">
            <div class="appointment-info">
              <div class="info-row">
                <span class="info-label">预约ID:</span>
                <span class="info-value">#{{ scope.row.id }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">房源:</span>
                <span class="info-value">{{ scope.row.houseTitle || `ID:${scope.row.houseId}` }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">用户:</span>
                <span class="info-value">{{ scope.row.userName || `ID:${scope.row.userId}` }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 日期信息 -->
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

        <!-- 金额信息 -->
        <el-table-column label="金额信息" min-width="200">
          <template #default="scope">
            <div class="amount-info">
              <div class="amount-row">
                <span>总金额:</span>
                <span class="total-amount">￥{{ formatMoney(scope.row.totalPrice) }}</span>
              </div>
              <div v-if="scope.row.refundAmount > 0" class="amount-row refund">
                <span>退款:</span>
                <span>￥{{ formatMoney(scope.row.refundAmount) }}</span>
              </div>
              <div v-if="scope.row.penaltyAmount > 0" class="amount-row penalty">
                <span>违约金:</span>
                <span>￥{{ formatMoney(scope.row.penaltyAmount) }}</span>
              </div>
              <div v-if="scope.row.payStatus === 1" class="amount-row received">
                <span>实收:</span>
                <span>￥{{ formatMoney(scope.row.totalPrice - (scope.row.refundAmount || 0)) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 状态信息 -->
        <el-table-column label="预约状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status).type" effect="dark" size="large">
              {{ getStatusTag(scope.row.status).text }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="支付状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getPayStatusTag(scope.row.payStatus).type" effect="plain" size="large">
              {{ getPayStatusTag(scope.row.payStatus).text }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 备注 -->
        <el-table-column label="备注" min-width="150" show-overflow-tooltip>
          <template #default="scope">
            <span v-if="scope.row.note" class="note-text">{{ scope.row.note }}</span>
            <span v-else class="note-empty">-</span>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <!-- 接受预约 -->
              <el-button
                v-if="scope.row.status === 0"
                size="small"
                type="success"
                :icon="Check"
                @click="accept(scope.row)"
              >
                接受
              </el-button>

              <!-- 拒绝预约 -->
              <el-button
                v-if="scope.row.status === 0"
                size="small"
                type="danger"
                :icon="Close"
                @click="reject(scope.row)"
              >
                拒绝
              </el-button>

              <!-- 标记已完成 -->
              <el-button
                v-if="scope.row.status === 1 && scope.row.endDate && new Date(scope.row.endDate) < new Date()"
                size="small"
                type="primary"
                :icon="SuccessFilled"
                @click="complete(scope.row)"
              >
                完成
              </el-button>

              <!-- 联系用户 -->
              <el-button
                size="small"
                type="info"
                :icon="Message"
                @click="contactUser(scope.row)"
              >
                联系
              </el-button>

              <!-- 查看详情 -->
              <el-button
                size="small"
                type="primary"
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

    <!-- 订单详情对话框 -->
    <el-dialog v-model="detailVisible" title="订单详情" width="600px" destroy-on-close>
      <div v-if="currentRow" class="detail-dialog">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="预约ID" :span="2">{{ currentRow.id }}</el-descriptions-item>
          <el-descriptions-item label="房源名称" :span="2">{{ currentRow.houseTitle || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="用户昵称">{{ currentRow.userName || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="用户ID">{{ currentRow.userId }}</el-descriptions-item>
          <el-descriptions-item label="入住日期">{{ currentRow.startDate }}</el-descriptions-item>
          <el-descriptions-item label="离店日期">{{ currentRow.endDate }}</el-descriptions-item>
          <el-descriptions-item label="入住天数">{{ calculateDays(currentRow.startDate, currentRow.endDate) }}晚</el-descriptions-item>
          <el-descriptions-item label="入住人数">{{ currentRow.guestCount || 1 }}人</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentRow.contactPhone || '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="预约状态">
            <el-tag :type="getStatusTag(currentRow.status).type" size="small">
              {{ getStatusTag(currentRow.status).text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="支付状态">
            <el-tag :type="getPayStatusTag(currentRow.payStatus).type" size="small">
              {{ getPayStatusTag(currentRow.payStatus).text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="总金额">￥{{ formatMoney(currentRow.totalPrice) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(currentRow.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="退款金额" v-if="currentRow.refundAmount > 0">
            ￥{{ formatMoney(currentRow.refundAmount) }}
          </el-descriptions-item>
          <el-descriptions-item label="违约金" v-if="currentRow.penaltyAmount > 0">
            ￥{{ formatMoney(currentRow.penaltyAmount) }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentRow.note || '无' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 拒绝预约对话框 -->
    <el-dialog v-model="rejectDialog.visible" title="拒绝预约" width="400px">
      <el-form :model="rejectDialog" label-width="80px">
        <el-form-item label="拒绝原因">
          <el-input
            v-model="rejectDialog.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入拒绝原因（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="rejectDialog.visible = false">取消</el-button>
          <el-button type="danger" @click="confirmReject" :loading="rejectLoading">
            确认拒绝
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 联系用户对话框 -->
    <el-dialog v-model="contactDialog.visible" title="联系用户" width="400px">
      <div class="contact-info">
        <p>预约ID: {{ contactDialog.appointmentId }}</p>
        <p>用户ID: {{ contactDialog.userId }}</p>
        <p>联系电话: {{ contactDialog.phone || '暂无联系方式' }}</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="contactDialog.visible = false">关闭</el-button>
          <el-button type="primary" @click="copyPhone(contactDialog.phone)" v-if="contactDialog.phone">
            复制号码
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import {
  Search,
  Refresh,
  Download,
  Calendar,
  Check,
  Close,
  SuccessFilled,
  Message,
  View
} from "@element-plus/icons-vue"
import request from "../../utils/request"
import { formatMoney } from "../../utils/format"

// 数据
const appointments = ref([])
const detailVisible = ref(false)
const currentRow = ref(null)
const page = ref(1)
const size = ref(10)
const total = ref(0)
const loading = ref(false)

// 筛选条件 - 修改为和后端参数匹配
const filters = ref({
  status: null,
  payStatus: null,
  keyword: "",  // 改为 keyword 匹配后端
  dateRange: []
})

// 拒绝对话框
const rejectDialog = ref({
  visible: false,
  appointmentId: null,
  reason: ""
})
const rejectLoading = ref(false)

// 联系对话框
const contactDialog = ref({
  visible: false,
  appointmentId: null,
  userId: null,
  phone: ""
})

// 计算属性
const pendingCount = computed(() => {
  return appointments.value.filter(item => item.status === 0).length
})

const acceptedCount = computed(() => {
  return appointments.value.filter(item => item.status === 1).length
})

const completedCount = computed(() => {
  return appointments.value.filter(item => item.status === 3).length
})

// 获取用户信息
const getUserInfo = () => {
  const userStr = localStorage.getItem("user")
  return userStr ? JSON.parse(userStr) : null
}

// 加载数据
const loadData = async () => {
  const user = getUserInfo()
  if (!user) {
    ElMessage.error("请先登录")
    return
  }

  loading.value = true
  try {
    const params = {
      page: page.value,
      size: size.value,
      hostId: user.userId
    }

    // 添加筛选条件 - 匹配后端接口参数
    if (filters.value.keyword) {
      params.keyword = filters.value.keyword  // 房源名称搜索
    }
    if (filters.value.dateRange && filters.value.dateRange.length === 2) {
      params.startDate = formatDate(filters.value.dateRange[0])
      params.endDate = formatDate(filters.value.dateRange[1])
    }

    const res = await request.get("/appointment/host", {
      params,
      headers: {
        "X-User-Id": user.userId,
        "X-User-Role": user.role
      }
    })

    appointments.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (error) {
    ElMessage.error("加载预约列表失败")
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 筛选处理
const handleFilter = () => {
  page.value = 1
  loadData()
}

// 重置筛选
const resetFilter = () => {
  filters.value = {
    status: null,
    payStatus: null,
    keyword: "",
    dateRange: []
  }
  page.value = 1
  loadData()
}

// 导出数据
const exportData = () => {
  ElMessage.info("导出功能开发中...")
}

// 分页处理
const handleCurrentChange = (newPage) => {
  page.value = newPage
  loadData()
}

const handleSizeChange = (newSize) => {
  size.value = newSize
  page.value = 1
  loadData()
}

// 查看详情
const viewDetail = (row) => {
  currentRow.value = row
  detailVisible.value = true
}

// 接受预约
const accept = (row) => {
  ElMessageBox.confirm(
    `确定接受预约 #${row.id} 吗？`,
    '接受预约',
    {
      confirmButtonText: '确认接受',
      cancelButtonText: '取消',
      type: 'success'
    }
  ).then(async () => {
    const user = getUserInfo()
    try {
      const res = await request.post(`/appointment/accept/${row.id}`, {}, {
        headers: {
          "X-User-Id": user.userId,
          "X-User-Role": user.role
        }
      })
      ElMessage.success(res.data || "已接受预约")
      loadData()
    } catch (error) {
      ElMessage.error("操作失败")
    }
  }).catch(() => {})
}

// 拒绝预约
const reject = (row) => {
  rejectDialog.value = {
    visible: true,
    appointmentId: row.id,
    reason: ""
  }
}

const confirmReject = async () => {
  const user = getUserInfo()
  rejectLoading.value = true
  try {
    const res = await request.post(`/appointment/reject/${rejectDialog.value.appointmentId}`, {
      reason: rejectDialog.value.reason
    }, {
      headers: {
        "X-User-Id": user.userId,
        "X-User-Role": user.role
      }
    })
    ElMessage.success(res.data || "已拒绝预约")
    rejectDialog.value.visible = false
    loadData()
  } catch (error) {
    ElMessage.error("操作失败")
  } finally {
    rejectLoading.value = false
  }
}

// 标记已完成
const complete = (row) => {
  ElMessageBox.confirm(
    `确定将预约 #${row.id} 标记为已完成吗？`,
    '完成预约',
    {
      confirmButtonText: '确认完成',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(async () => {
    const user = getUserInfo()
    try {
      // 调用完成预约接口
      const res = await request.post(`/appointment/complete/${row.id}`, {}, {
        headers: {
          "X-User-Id": user.userId,
          "X-User-Role": user.role
        }
      })
      ElMessage.success(res.data || "已标记完成")
      loadData()
    } catch (error) {
      ElMessage.error("操作失败")
    }
  }).catch(() => {})
}

// 联系用户
const contactUser = (row) => {
  contactDialog.value = {
    visible: true,
    appointmentId: row.id,
    userId: row.userId,
    phone: row.contactPhone || '暂无联系方式'
  }
}

// 复制电话号码
const copyPhone = (phone) => {
  navigator.clipboard.writeText(phone).then(() => {
    ElMessage.success("已复制到剪贴板")
  }).catch(() => {
    ElMessage.error("复制失败")
  })
}

// 计算入住天数
const calculateDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return null
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDateTime = (dateStr) => {
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
const getStatusTag = (status) => {
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

const getPayStatusTag = (payStatus) => {
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

watch([page, size], () => {
  loadData()
})
</script>

<style scoped>
.host-appointments-container {
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

.stat-value.info {
  color: #909399;
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
  width: 120px;
}

.filter-input {
  width: 120px;
}

.date-picker {
  width: 240px;
}

.filter-right {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 表格样式 */
.table-wrapper {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

/* 预约信息 */
.appointment-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-size: 12px;
  color: #909399;
  min-width: 40px;
}

.info-value {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
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
  gap: 4px;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.amount-row.refund {
  color: #67c23a;
}

.amount-row.penalty {
  color: #f56c6c;
}

.amount-row.received {
  color: #409EFF;
  font-weight: 500;
}

.total-amount {
  color: #f56c6c;
  font-weight: 600;
}

/* 备注 */
.note-text {
  color: #606266;
  font-size: 13px;
}

.note-empty {
  color: #909399;
  font-size: 13px;
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

/* 详情对话框 */
.detail-dialog {
  max-height: 500px;
  overflow-y: auto;
}

.action-history {
  margin-top: 24px;
}

.action-history h4 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
}

/* 联系对话框 */
.contact-info {
  padding: 20px;
}

.contact-info p {
  margin: 8px 0;
  color: #606266;
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .host-appointments-container {
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
  .filter-input,
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

  .action-buttons .el-button {
    width: 100%;
  }
}
</style>