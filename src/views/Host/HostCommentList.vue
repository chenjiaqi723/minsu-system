<template>
  <div class="host-comments-container">
    <!-- 页面标题和统计 -->
    <div class="page-header">
      <div class="header-left">
        <h2>房源评论管理</h2>
        <p class="subtitle">查看和管理所有房源的用户评论</p>
      </div>
      <div class="header-right">
        <div class="stats-card">
          <div class="stat-item">
            <span class="stat-label">总评论</span>
            <span class="stat-value">{{ total }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">平均评分</span>
            <span class="stat-value">{{ averageRating.toFixed(1) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">待回复</span>
            <span class="stat-value warning">{{ pendingReplyCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已回复</span>
            <span class="stat-value success">{{ repliedCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选和搜索栏 -->
    <el-card class="filter-card" shadow="hover">
      <div class="filter-bar">
        <div class="filter-left">
          <el-select v-model="filters.rating" placeholder="评分筛选" clearable class="filter-select">
            <el-option label="5星" :value="5" />
            <el-option label="4星" :value="4" />
            <el-option label="3星" :value="3" />
            <el-option label="2星" :value="2" />
            <el-option label="1星" :value="1" />
          </el-select>

          <el-select v-model="filters.replyStatus" placeholder="回复状态" clearable class="filter-select">
            <el-option label="待回复" :value="0" />
            <el-option label="已回复" :value="1" />
          </el-select>

          <el-input
            v-model="filters.keyword"
            placeholder="搜索房源名称/评论内容"
            :prefix-icon="Search"
            clearable
            class="search-input"
            @keyup.enter="handleFilter"
          />

          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="date-picker"
            @change="handleDateChange"
          />
        </div>

        <div class="filter-right">
          <el-button type="primary" @click="handleFilter" :icon="Search">筛选</el-button>
          <el-button @click="resetFilter" :icon="Refresh">重置</el-button>
          <el-button @click="exportData" :icon="Download">导出</el-button>
        </div>
      </div>
    </el-card>

    <!-- 评论列表 -->
    <div class="table-wrapper">
      <el-table
        :data="filteredComments"
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
                <el-descriptions-item label="评论ID">{{ scope.row.id }}</el-descriptions-item>
                <el-descriptions-item label="评论时间">{{ formatDateTime(scope.row.createTime) }}</el-descriptions-item>
                <el-descriptions-item label="房源名称">{{ scope.row.houseTitle || '未知' }}</el-descriptions-item>
                <el-descriptions-item label="用户昵称">{{ scope.row.userName || '未知' }}</el-descriptions-item>
                <el-descriptions-item label="入住日期">{{ scope.row.startDate }}</el-descriptions-item>
                <el-descriptions-item label="离店日期">{{ scope.row.endDate }}</el-descriptions-item>
                <el-descriptions-item label="入住天数">{{ calculateDays(scope.row.startDate, scope.row.endDate) }}晚</el-descriptions-item>
                <el-descriptions-item label="评分">{{ scope.row.rating }}分</el-descriptions-item>
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
                <div class="house-sub">ID: {{ scope.row.houseId }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 用户信息 -->
        <el-table-column label="用户信息" min-width="150">
          <template #default="scope">
            <div class="user-info">
              <el-avatar :size="32">
                {{ scope.row.userName?.charAt(0) || '用' }}
              </el-avatar>
              <div class="user-detail">
                <div class="user-name">{{ scope.row.userName || '匿名用户' }}</div>
                <div class="user-sub">ID: {{ scope.row.userId }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 评分 -->
        <el-table-column label="评分" width="120" align="center">
          <template #default="scope">
            <div class="rating-cell">
              <el-rate v-model="scope.row.rating" disabled size="small" />
              <span class="rating-text">{{ scope.row.rating }}.0分</span>
            </div>
          </template>
        </el-table-column>

        <!-- 评论内容 -->
        <el-table-column label="评论内容" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            <div class="comment-content">{{ scope.row.content }}</div>
          </template>
        </el-table-column>

        <!-- 回复内容 -->
        <el-table-column label="商家回复" min-width="200">
          <template #default="scope">
            <div v-if="scope.row.reply" class="reply-content">
              <div class="reply-text">{{ scope.row.reply }}</div>
              <div class="reply-time" v-if="scope.row.replyTime">
                回复于 {{ formatDate(scope.row.replyTime) }}
              </div>
            </div>
            <el-tag v-else type="info" size="small" effect="plain">暂未回复</el-tag>
          </template>
        </el-table-column>

        <!-- 评论图片 -->
        <el-table-column label="图片" width="100" align="center">
          <template #default="scope">
            <div v-if="scope.row.images && scope.row.images.length > 0" class="image-preview">
              <el-popover
                placement="right"
                trigger="hover"
                :width="200"
              >
                <template #reference>
                  <el-badge :value="scope.row.images.length" class="image-badge">
                    <el-image
                      :src="scope.row.images[0]"
                      class="thumbnail"
                      fit="cover"
                      :preview-src-list="scope.row.images"
                    />
                  </el-badge>
                </template>
                <div class="image-popover">
                  <el-image
                    v-for="(img, index) in scope.row.images.slice(0, 4)"
                    :key="index"
                    :src="img"
                    class="popover-image"
                    fit="cover"
                    :preview-src-list="scope.row.images"
                    :initial-index="index"
                  />
                  <span v-if="scope.row.images.length > 4" class="more-images">
                    等{{ scope.row.images.length }}张图片
                  </span>
                </div>
              </el-popover>
            </div>
            <span v-else class="no-image">无</span>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <!-- 回复按钮 -->
              <el-button
                v-if="!scope.row.reply"
                size="small"
                type="primary"
                :icon="ChatDotRound"
                @click="openReply(scope.row)"
              >
                回复
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

              <!-- 编辑回复 -->
              <el-button
                v-if="scope.row.reply"
                size="small"
                type="warning"
                :icon="Edit"
                @click="editReply(scope.row)"
              >
                编辑
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

    <!-- 回复/编辑对话框 -->
    <el-dialog 
      v-model="replyDialog.visible" 
      :title="replyDialog.isEdit ? '编辑回复' : '回复评论'" 
      width="500px"
      destroy-on-close
    >
      <div class="reply-dialog">
        <!-- 原评论内容 -->
        <div class="original-comment" v-if="currentComment">
          <div class="comment-header">
            <el-avatar :size="24">{{ currentComment.userName?.charAt(0) || '用' }}</el-avatar>
            <span class="comment-user">{{ currentComment.userName || '匿名用户' }}</span>
            <el-rate v-model="currentComment.rating" disabled size="small" />
          </div>
          <div class="comment-body">{{ currentComment.content }}</div>
        </div>

        <el-divider>回复内容</el-divider>

        <el-form :model="replyDialog" ref="formRef" :rules="rules">
          <el-form-item prop="content">
            <el-input
              v-model="replyDialog.content"
              type="textarea"
              :rows="5"
              placeholder="请输入回复内容..."
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <!-- 快速回复模板 -->
          <div class="quick-reply" v-if="!replyDialog.isEdit">
            <span class="quick-label">常用回复：</span>
            <el-tag
              v-for="template in replyTemplates"
              :key="template"
              size="small"
              @click="replyDialog.content = template"
              class="template-tag"
            >
              {{ template }}
            </el-tag>
          </div>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="replyDialog.visible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="submitReply" 
            :loading="replyLoading"
            :disabled="!replyDialog.content?.trim()"
          >
            {{ replyDialog.isEdit ? '保存修改' : '提交回复' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 评论详情对话框 -->
    <el-dialog v-model="detailVisible" title="评论详情" width="600px" destroy-on-close>
      <div v-if="currentComment" class="detail-dialog">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="评论ID" :span="2">{{ currentComment.id }}</el-descriptions-item>
          <el-descriptions-item label="房源名称">{{ currentComment.houseTitle || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="用户昵称">{{ currentComment.userName || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="评分" :span="2">
            <el-rate v-model="currentComment.rating" disabled size="small" />
            <span style="margin-left: 8px;">{{ currentComment.rating }}分</span>
          </el-descriptions-item>
          <el-descriptions-item label="评论时间" :span="2">{{ formatDateTime(currentComment.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="评论内容" :span="2">{{ currentComment.content }}</el-descriptions-item>
          <el-descriptions-item label="回复内容" :span="2" v-if="currentComment.reply">
            <div class="detail-reply">
              <p>{{ currentComment.reply }}</p>
              <span class="reply-time">回复于 {{ formatDateTime(currentComment.replyTime) }}</span>
            </div>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 评论图片 -->
        <div class="detail-images" v-if="currentComment.images && currentComment.images.length > 0">
          <h4>用户上传的图片</h4>
          <el-image
            v-for="(img, index) in currentComment.images"
            :key="index"
            :src="img"
            :preview-src-list="currentComment.images"
            class="detail-image"
            fit="cover"
          />
        </div>
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
  Download,
  Picture,
  ChatDotRound,
  View,
  Edit
} from "@element-plus/icons-vue"
import request from "../../utils/request"

const router = useRouter()
const formRef = ref(null)

// 数据
const comments = ref([])
const filteredComments = ref([])
const detailVisible = ref(false)
const currentComment = ref(null)
const page = ref(1)
const size = ref(10)
const total = ref(0)
const loading = ref(false)

// 筛选条件
const filters = ref({
  rating: null,
  replyStatus: null,
  keyword: "",
  dateRange: []
})

// 回复对话框
const replyDialog = ref({
  visible: false,
  content: "",
  isEdit: false,
  commentId: null
})
const replyLoading = ref(false)

// 常用回复模板
const replyTemplates = [
  "感谢您的评价，我们会继续努力！",
  "谢谢您的支持，欢迎再次光临！",
  "很高兴您满意我们的服务，期待再次相遇！",
  "感谢您的宝贵意见，我们会持续改进。"
]

// 表单验证规则
const rules = {
  content: [
    { required: true, message: '请输入回复内容', trigger: 'blur' },
    { min: 2, message: '回复内容至少2个字', trigger: 'blur' }
  ]
}

// 计算属性
const averageRating = computed(() => {
  if (comments.value.length === 0) return 0
  const sum = comments.value.reduce((acc, cur) => acc + (cur.rating || 0), 0)
  return sum / comments.value.length
})

const pendingReplyCount = computed(() => {
  return comments.value.filter(item => !item.reply).length
})

const repliedCount = computed(() => {
  return comments.value.filter(item => item.reply).length
})

// 获取用户信息
const getUserInfo = () => {
  try {
    const userStr = localStorage.getItem("user")
    return userStr ? JSON.parse(userStr) : null
  } catch (e) {
    console.error("解析用户信息失败:", e)
    return null
  }
}

// 加载评论
const loadComments = async () => {
  const user = getUserInfo()
  if (!user) {
    ElMessage.error("请先登录")
    return
  }

  loading.value = true
  try {
    const params = {
      page: page.value,
      size: size.value
    }

    const res = await request.get("/comment/byHost", {
      params,
      headers: {
        "X-User-Id": user.userId,
        "X-User-Role": user.role
      }
    })

    comments.value = res.data.records || []
    total.value = res.data.total || 0
    applyFilters()
  } catch (error) {
    ElMessage.error("加载评论失败")
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 计算入住天数
const calculateDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
}

// 应用筛选
const applyFilters = () => {
  let filtered = [...comments.value]
  
  // 评分筛选
  if (filters.value.rating !== null) {
    filtered = filtered.filter(item => item.rating === filters.value.rating)
  }
  
  // 回复状态筛选
  if (filters.value.replyStatus !== null) {
    if (filters.value.replyStatus === 0) {
      filtered = filtered.filter(item => !item.reply)
    } else {
      filtered = filtered.filter(item => item.reply)
    }
  }
  
  // 关键词筛选
  if (filters.value.keyword) {
    const keyword = filters.value.keyword.toLowerCase()
    filtered = filtered.filter(item => 
      (item.houseTitle && item.houseTitle.toLowerCase().includes(keyword)) ||
      (item.content && item.content.toLowerCase().includes(keyword)) ||
      (item.reply && item.reply.toLowerCase().includes(keyword))
    )
  }
  
  // 日期筛选
  if (filters.value.dateRange && filters.value.dateRange.length === 2) {
    const start = new Date(filters.value.dateRange[0]).getTime()
    const end = new Date(filters.value.dateRange[1]).getTime()
    filtered = filtered.filter(item => {
      const createTime = new Date(item.createTime).getTime()
      return createTime >= start && createTime <= end
    })
  }
  
  filteredComments.value = filtered
}

// 筛选处理
const handleFilter = () => {
  applyFilters()
}

const handleDateChange = () => {
  if (filters.value.dateRange && filters.value.dateRange.length === 2) {
    handleFilter()
  }
}

// 重置筛选
const resetFilter = () => {
  filters.value = {
    rating: null,
    replyStatus: null,
    keyword: "",
    dateRange: []
  }
  filteredComments.value = comments.value
}

// 导出数据
const exportData = () => {
  ElMessage.info("导出功能开发中...")
}

// 分页处理
const handleCurrentChange = (newPage) => {
  page.value = newPage
  loadComments()
}

const handleSizeChange = (newSize) => {
  size.value = newSize
  page.value = 1
  loadComments()
}

// 打开回复对话框
const openReply = (row) => {
  currentComment.value = row
  replyDialog.value = {
    visible: true,
    content: "",
    isEdit: false,
    commentId: row.id
  }
}

// 编辑回复
const editReply = (row) => {
  currentComment.value = row
  replyDialog.value = {
    visible: true,
    content: row.reply,
    isEdit: true,
    commentId: row.id
  }
}

// 提交回复
const submitReply = async () => {
  if (!replyDialog.value.content?.trim()) {
    ElMessage.warning("请输入回复内容")
    return
  }

  const user = getUserInfo()
  if (!user) return

  replyLoading.value = true
  try {
    const url = `/comment/reply/${replyDialog.value.commentId}`
    const res = await request.post(url, 
      { reply: replyDialog.value.content },
      {
        headers: {
          "X-User-Id": user.userId,
          "X-User-Role": user.role
        }
      }
    )

    ElMessage.success(replyDialog.value.isEdit ? "回复已修改" : "回复成功")
    replyDialog.value.visible = false
    loadComments()
  } catch (error) {
    ElMessage.error(error.response?.data || "操作失败")
  } finally {
    replyLoading.value = false
  }
}

// 查看详情
const viewDetail = (row) => {
  currentComment.value = row
  detailVisible.value = true
}

// 跳转到房源详情
const goToHouseDetail = (houseId) => {
  router.push(`/user/house/${houseId}`)
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
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

onMounted(() => {
  loadComments()
})

watch([page, size], () => {
  loadComments()
})

watch(comments, () => {
  applyFilters()
})
</script>

<style scoped>
.host-comments-container {
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

.search-input {
  width: 200px;
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

/* 房源信息 */
.house-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.house-info:hover {
  background-color: #f5f7fa;
}

.house-cover {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
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
  overflow: hidden;
}

.house-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.house-sub {
  font-size: 12px;
  color: #909399;
}

/* 用户信息 */
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-detail {
  overflow: hidden;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-sub {
  font-size: 12px;
  color: #909399;
}

/* 评分单元格 */
.rating-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.rating-text {
  font-size: 12px;
  color: #f7b500;
}

/* 评论内容 */
.comment-content {
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;           /* 必须使用 -webkit-box 而不是 flex */
  -webkit-line-clamp: 2;          /* WebKit 浏览器的私有属性 */
  -moz-line-clamp: 2;             /* Firefox 浏览器的私有属性 */
  line-clamp: 2;                  /* 标准属性，用于未来兼容 */
  -webkit-box-orient: vertical;    /* WebKit 浏览器的私有属性 */
  -moz-box-orient: vertical;       /* Firefox 浏览器的私有属性 */
  box-orient: vertical;            /* 标准属性，用于未来兼容 */
  color: #606266;
  font-size: 13px;
}

/* 回复内容 */
.reply-content {
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #409EFF;
}

.reply-text {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}

.reply-time {
  font-size: 12px;
  color: #909399;
  text-align: right;
}

/* 图片预览 */
.image-preview {
  cursor: pointer;
}

.thumbnail {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  object-fit: cover;
}

.image-badge :deep(.el-badge__content) {
  background-color: #409EFF;
}

.image-popover {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
}

.popover-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  cursor: pointer;
  object-fit: cover;
}

.more-images {
  width: 100%;
  text-align: center;
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}

.no-image {
  color: #909399;
  font-size: 12px;
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

/* 回复对话框 */
.reply-dialog {
  padding: 0 10px;
}

.original-comment {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.comment-user {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.comment-body {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

/* 快速回复模板 */
.quick-reply {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-label {
  font-size: 12px;
  color: #909399;
}

.template-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.template-tag:hover {
  transform: scale(1.05);
}

/* 详情对话框 */
.detail-dialog {
  max-height: 500px;
  overflow-y: auto;
}

.detail-reply {
  background-color: #f8f9fa;
  padding: 8px 12px;
  border-radius: 4px;
}

.detail-reply p {
  margin: 0 0 8px 0;
  color: #606266;
}

.detail-images {
  margin-top: 20px;
}

.detail-images h4 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.detail-image {
  width: 100px;
  height: 100px;
  border-radius: 4px;
  margin-right: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  object-fit: cover;
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .host-comments-container {
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
  .search-input,
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

  .quick-reply {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>