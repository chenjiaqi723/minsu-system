<template>
  <div class="admin-comments-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>评论管理</h2>
        <p class="subtitle">管理所有用户的房源评论，维护社区氛围</p>
      </div>
      <div class="header-right">
        <el-button 
          type="danger" 
          :icon="Delete" 
          :disabled="!selectedIds.length"
          @click="batchDelete"
        >
          批量删除 ({{ selectedIds.length }})
        </el-button>
      </div>
    </div>

    <!-- 筛选和搜索栏 -->
    <el-card class="filter-card" shadow="hover">
      <div class="filter-bar">
        <div class="filter-left">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索评论内容"
            :prefix-icon="Search"
            clearable
            class="search-input"
            @keyup.enter="handleFilter"
          />
          <el-select v-model="filters.rating" placeholder="评分筛选" clearable class="filter-select">
            <el-option label="5星" :value="5" />
            <el-option label="4星" :value="4" />
            <el-option label="3星" :value="3" />
            <el-option label="2星" :value="2" />
            <el-option label="1星" :value="1" />
          </el-select>
          <el-select v-model="filters.replyStatus" placeholder="回复状态" clearable class="filter-select">
            <el-option label="已回复" :value="1" />
            <el-option label="未回复" :value="0" />
          </el-select>
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
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

    <!-- 评论列表 -->
    <div class="table-wrapper">
      <el-table
        :data="filteredComments"
        border
        stripe
        style="width: 100%; border-radius: 8px; overflow: hidden;"
        :header-cell-style="{ background: '#f5f7fa', color: '#303133', fontWeight: '600' }"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        row-key="id"
      >
        <!-- 多选框 -->
        <el-table-column type="selection" width="55" />

        <!-- 评论ID -->
        <el-table-column prop="id" label="ID" width="80" />

        <!-- 用户信息 -->
        <el-table-column label="用户" width="150">
          <template #default="scope">
            <div class="user-info">
              <el-avatar :size="32">
                {{ scope.row.userName?.charAt(0) || '用' }}
              </el-avatar>
              <div class="user-detail">
                <div class="user-name">{{ scope.row.userName || '匿名用户' }}</div>
                <div class="user-id">ID: {{ scope.row.userId }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 房源信息 -->
        <el-table-column label="房源" min-width="180">
          <template #default="scope">
            <div class="house-info" @click="goToHouseDetail(scope.row.houseId)">
              <div class="house-title">{{ scope.row.houseTitle || '未知房源' }}</div>
              <div class="house-id">ID: {{ scope.row.houseId }}</div>
            </div>
          </template>
        </el-table-column>

        <!-- 评分 -->
        <el-table-column label="评分" width="120" align="center">
          <template #default="scope">
            <div class="rating-cell">
              <el-rate v-model="scope.row.rating" disabled size="small" />
              <span class="rating-text">{{ scope.row.rating }}分</span>
            </div>
          </template>
        </el-table-column>

        <!-- 评论内容 -->
        <el-table-column label="评论内容" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            <div class="comment-content">{{ scope.row.content }}</div>
          </template>
        </el-table-column>

        <!-- 商家回复 -->
        <el-table-column label="商家回复" min-width="180">
          <template #default="scope">
            <div v-if="scope.row.reply" class="reply-content">
              <div class="reply-text">{{ scope.row.reply }}</div>
              <div class="reply-time" v-if="scope.row.replyTime">
                {{ formatDateTime(scope.row.replyTime) }}
              </div>
            </div>
            <el-tag v-else type="info" size="small" effect="plain">暂无回复</el-tag>
          </template>
        </el-table-column>

        <!-- 创建时间 -->
        <el-table-column label="评论时间" width="160">
          <template #default="scope">
            <div class="time-cell">
              <el-icon><Calendar /></el-icon>
              <span>{{ formatDateTime(scope.row.createTime) }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button 
              size="small" 
              type="danger" 
              :icon="Delete"
              @click="remove(scope.row)"
            >
              删除
            </el-button>
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

    <!-- 删除确认对话框 -->
    <el-dialog v-model="deleteDialog.visible" title="删除评论" width="400px" center>
      <div class="delete-content">
        <el-icon :size="50" color="#f56c6c"><WarningFilled /></el-icon>
        <h3>确定要删除这条评论吗？</h3>
        <p class="comment-preview">“{{ deleteDialog.commentContent }}”</p>
        <p class="delete-warning">删除后无法恢复，请谨慎操作</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialog.visible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete" :loading="deleteLoading">
            确认删除
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量删除确认对话框 -->
    <el-dialog v-model="batchDeleteDialog.visible" title="批量删除" width="400px" center>
      <div class="delete-content">
        <el-icon :size="50" color="#f56c6c"><WarningFilled /></el-icon>
        <h3>确定要删除选中的评论吗？</h3>
        <p>共选中 <span class="highlight">{{ selectedIds.length }}</span> 条评论</p>
        <p class="delete-warning">此操作不可恢复，请谨慎确认</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchDeleteDialog.visible = false">取消</el-button>
          <el-button type="danger" @click="confirmBatchDelete" :loading="batchDeleteLoading">
            确认删除
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import {
  Search,
  Refresh,
  Delete,
  Calendar,
  WarningFilled
} from "@element-plus/icons-vue"
import request from "../../utils/request"

const router = useRouter()

// 数据
const filteredComments = ref([])
const page = ref(1)
const size = ref(10)
const total = ref(0)
const loading = ref(false)

// 筛选条件
const filters = ref({
  keyword: "",
  rating: null,
  replyStatus: null,
  dateRange: []
})

// 多选
const selectedIds = ref([])

// 删除对话框
const deleteDialog = ref({
  visible: false,
  commentId: null,
  commentContent: ""
})
const deleteLoading = ref(false)

// 批量删除对话框
const batchDeleteDialog = ref({
  visible: false
})
const batchDeleteLoading = ref(false)

// 获取用户信息
const getUserInfo = () => {
  try {
    return JSON.parse(localStorage.getItem("user"))
  } catch {
    return null
  }
}

// 加载评论
function loadComments() {
  const user = getUserInfo()
  if (!user) {
    ElMessage.error("请先登录")
    return
  }

  loading.value = true
  request.get("/admin/comment/all", {
    params: {
      page: page.value,
      size: size.value,
      keyword: filters.value.keyword,
      rating: filters.value.rating,
      replyStatus: filters.value.replyStatus,
      startDate: formatDate(filters.value.dateRange?.[0]),
      endDate: formatDate(filters.value.dateRange?.[1])
    },
    headers: { "X-User-Role": user.role }
  }).then(res => {
    filteredComments.value = res.data.records || []
    total.value = res.data.total || 0
  }).catch(error => {
    ElMessage.error("加载评论失败")
    console.error(error)
  }).finally(() => {
    loading.value = false
  })
}


// 筛选处理
function handleFilter() {
  page.value = 1 // 重新搜索时回到第一页
  loadComments()
}

// 重置筛选
function resetFilter() {
  filters.value = {
    keyword: "",
    rating: null,
    replyStatus: null,
    dateRange: []
  }
  handleFilter()
}

// 分页处理
function handleCurrentChange(newPage) {
  page.value = newPage
  loadComments()
}

function handleSizeChange(newSize) {
  size.value = newSize
  page.value = 1
  loadComments()
}

// 多选处理
function handleSelectionChange(selection) {
  selectedIds.value = selection.map(item => item.id)
}

// 删除单个评论
function remove(row) {
  deleteDialog.value = {
    visible: true,
    commentId: row.id,
    commentContent: row.content?.substring(0, 50) + (row.content?.length > 50 ? '...' : '')
  }
}

// 确认删除单个
async function confirmDelete() {
  const user = getUserInfo()
  if (!user) return

  deleteLoading.value = true
  try {
    await request.delete(`/admin/comment/delete/${deleteDialog.value.commentId}`, {
      headers: { 
        "X-User-Role": user.role,
        "X-User-Id": user.userId
      }
    })
    ElMessage.success("删除成功")
    deleteDialog.value.visible = false
    loadComments()
  } catch (error) {
    ElMessage.error("删除失败")
  } finally {
    deleteLoading.value = false
  }
}

// 批量删除
function batchDelete() {
  if (!selectedIds.value.length) {
    ElMessage.warning("请选择要删除的评论")
    return
  }
  batchDeleteDialog.value.visible = true
}

// 确认批量删除
async function confirmBatchDelete() {
  const user = getUserInfo()
  if (!user) return

  batchDeleteLoading.value = true
  try {
    await request.post(`/admin/comment/batchDelete`, selectedIds.value, {
      headers: {
        "X-User-Role": user.role,
        "X-User-Id": user.userId
      }
    })

    ElMessage.success(`成功删除 ${selectedIds.value.length} 条评论`)
    batchDeleteDialog.value.visible = false
    selectedIds.value = []
    loadComments()
  } catch (error) {
    console.error(error)
    ElMessage.error("批量删除失败")
  } finally {
    batchDeleteLoading.value = false
  }
}

// 跳转到房源详情
function goToHouseDetail(houseId) {
  router.push(`/user/house/${houseId}`)
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
  loadComments()
})

watch([page, size], () => {
  loadComments()
})

</script>

<style scoped>
.admin-comments-container {
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

.user-id {
  font-size: 12px;
  color: #909399;
}

/* 房源信息 */
.house-info {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.house-info:hover {
  background-color: #f5f7fa;
}

.house-title {
  font-size: 14px;
  font-weight: 500;
  color: #409EFF;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.house-id {
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
  font-size: 11px;
  color: #909399;
  text-align: right;
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

/* 删除对话框 */
.delete-content {
  text-align: center;
  padding: 20px 0;
}

.delete-content h3 {
  margin: 16px 0 8px;
  font-size: 18px;
  color: #303133;
}

.comment-preview {
  font-size: 14px;
  color: #606266;
  background-color: #f5f7fa;
  padding: 12px;
  border-radius: 6px;
  margin: 12px 0;
  font-style: italic;
}

.highlight {
  color: #f56c6c;
  font-weight: 600;
  font-size: 18px;
}

.delete-warning {
  font-size: 13px;
  color: #f56c6c;
  margin: 8px 0 0;
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .admin-comments-container {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
  }

  .header-right .el-button {
    width: 100%;
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
    min-width: 120px;
  }

  .rating-cell {
    min-width: 80px;
  }
}
</style>