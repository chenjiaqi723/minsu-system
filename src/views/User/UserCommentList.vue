<template>
  <div class="my-comments-container">
    <!-- 页面标题和统计 -->
    <div class="page-header">
      <div class="header-left">
        <h2>我的评论</h2>
        <p class="subtitle">查看和管理你发表的所有评价</p>
      </div>
      <div class="header-right">
        <div class="stats-card">
          <div class="stat-item">
            <span class="stat-label">总评论数</span>
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
        </div>
      </div>
    </div>

    <!-- 筛选和搜索栏 -->
    <el-card class="filter-card" shadow="hover">
      <div class="filter-bar">
        <div class="filter-left">
          <el-select v-model="ratingFilter" placeholder="评分筛选" clearable class="filter-select">
            <el-option label="5星" :value="5" />
            <el-option label="4星" :value="4" />
            <el-option label="3星" :value="3" />
            <el-option label="2星" :value="2" />
            <el-option label="1星" :value="1" />
          </el-select>

          <el-select v-model="replyFilter" placeholder="回复状态" clearable class="filter-select">
            <el-option label="已回复" :value="true" />
            <el-option label="待回复" :value="false" />
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
          <el-input
            v-model="searchKeyword"
            placeholder="搜索房源名称"
            :prefix-icon="Search"
            clearable
            class="search-input"
            @keyup.enter="handleFilter"
          />
          <el-button type="primary" @click="handleFilter" :icon="Search">筛选</el-button>
          <el-button @click="resetFilter" :icon="Refresh">重置</el-button>
        </div>
      </div>
    </el-card>

    <!-- 评论列表 -->
    <div class="comments-list" v-loading="loading">
      <template v-if="filteredList.length > 0">
        <el-card
          v-for="comment in filteredList"
          :key="comment.id"
          class="comment-card"
          shadow="hover"
        >
          <!-- 评论头部 -->
          <div class="comment-header">
            <div class="house-info" @click="goToHouseDetail(comment.houseId)">
              <el-image
                :src="comment.houseCover || '/default-house.jpg'"
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
                <div class="house-title">{{ comment.houseTitle || '未知房源' }}</div>
                <div class="house-sub">
                  <span>房源ID: {{ comment.houseId }}</span>
                  <span class="dot">·</span>
                  <span>{{ formatDate(comment.createTime) }}</span>
                </div>
              </div>
            </div>
            <div class="rating-info">
              <el-rate v-model="comment.rating" disabled />
              <span class="rating-text">{{ comment.rating }}.0分</span>
            </div>
          </div>

          <!-- 评论内容 -->
          <div class="comment-content">
            <p>{{ comment.content }}</p>
          </div>

          <!-- 评论图片 -->
          <div v-if="comment.images && comment.images.length > 0" class="comment-images">
            <el-image
              v-for="(img, index) in comment.images.slice(0, 4)"
              :key="index"
              :src="img"
              :preview-src-list="comment.images"
              fit="cover"
              class="comment-image"
              :initial-index="index"
            />
            <span v-if="comment.images.length > 4" class="more-images">
              +{{ comment.images.length - 4 }}
            </span>
          </div>

          <!-- 商家回复 -->
          <div v-if="comment.reply" class="host-reply">
            <div class="reply-header">
              <el-avatar :size="24" class="host-avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span class="host-name">房东回复</span>
              <span class="reply-time">{{ formatDateTime(comment.replyTime) }}</span>
            </div>
            <p class="reply-content">{{ comment.reply }}</p>
          </div>
          <div v-else class="no-reply">
            <el-tag type="info" size="small" effect="plain">暂未回复</el-tag>
          </div>

          <!-- 操作按钮 -->
          <div class="comment-actions">
            <el-button
              v-if="!comment.reply"
              size="small"
              type="primary"
              plain
              :icon="Edit"
              @click="editComment(comment)"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              plain
              :icon="Delete"
              @click="deleteComment(comment)"
            >
              删除
            </el-button>
            <el-button
              size="small"
              type="info"
              plain
              :icon="View"
              @click="viewHouse(comment.houseId)"
            >
              查看房源
            </el-button>
          </div>
        </el-card>
      </template>

      <!-- 空状态 -->
      <el-empty
        v-else
        description="暂无评论"
        :image-size="200"
      >
        <el-button type="primary" @click="goToUserAppointmentList">去评价房源</el-button>
      </el-empty>
    </div>

    <!-- 分页 -->
    <div class="pagination-container" v-if="total > 0">
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

    <!-- 编辑评论对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑评论" width="500px">
      <el-form :model="editingComment" label-width="80px">
        <el-form-item label="评分">
          <el-rate v-model="editingComment.rating" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input
            v-model="editingComment.content"
            type="textarea"
            :rows="4"
            placeholder="请输入评论内容"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmEdit" :loading="editLoading">
            确认修改
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog v-model="showDeleteDialog" title="删除评论" width="400px" center>
      <div class="delete-content">
        <el-icon :size="50" color="#f56c6c"><WarningFilled /></el-icon>
        <h3>确定要删除这条评论吗？</h3>
        <p>删除后无法恢复，请谨慎操作</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDeleteDialog = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete" :loading="deleteLoading">
            确认删除
          </el-button>
        </span>
      </template>
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
  Edit,
  Delete,
  View,
  User,
  WarningFilled
} from "@element-plus/icons-vue"
import request from "../../utils/request"

const router = useRouter()

// 数据
const list = ref([])
const filteredList = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const loading = ref(false)

// 筛选条件
const ratingFilter = ref(null)
const replyFilter = ref(null)
const dateRange = ref([])
const searchKeyword = ref("")

// 编辑相关
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const editLoading = ref(false)
const deleteLoading = ref(false)
const editingComment = ref({})
const deletingComment = ref(null)

// 计算属性
const averageRating = computed(() => {
  if (list.value.length === 0) return 0
  const sum = list.value.reduce((acc, cur) => acc + (cur.rating || 0), 0)
  return sum / list.value.length
})

const pendingReplyCount = computed(() => {
  return list.value.filter(item => !item.reply).length
})

// 获取用户信息
const getUserInfo = () => {
  const userStr = localStorage.getItem("user")
  return userStr ? JSON.parse(userStr) : null
}

// 加载数据
async function load() {
  const user = getUserInfo()
  if (!user) {
    ElMessage.error("请先登录")
    router.push("/login")
    return
  }

  loading.value = true
  try {
    const res = await request.get("/comment/my", {
      params: {
        page: page.value,
        size: size.value
      },
      headers: {
        "X-User-Id": user.userId,
        "X-User-Role": user.role
      }
    })
    
    list.value = res.data.records || []
    total.value = res.data.total || 0
    applyFilters()
  } catch (error) {
    ElMessage.error("加载评论失败")
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 应用筛选
function applyFilters() {
  let filtered = [...list.value]
  
  // 评分筛选
  if (ratingFilter.value !== null) {
    filtered = filtered.filter(item => item.rating === ratingFilter.value)
  }
  
  // 回复状态筛选
  if (replyFilter.value !== null) {
    filtered = filtered.filter(item => !!item.reply === replyFilter.value)
  }
  
  // 日期筛选
  if (dateRange.value && dateRange.value.length === 2) {
    const start = new Date(dateRange.value[0]).getTime()
    const end = new Date(dateRange.value[1]).getTime()
    filtered = filtered.filter(item => {
      const createTime = new Date(item.createTime).getTime()
      return createTime >= start && createTime <= end
    })
  }
  
  // 关键词筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(item => 
      (item.houseTitle && item.houseTitle.toLowerCase().includes(keyword)) ||
      (item.content && item.content.toLowerCase().includes(keyword))
    )
  }
  
  filteredList.value = filtered
}

// 筛选处理
function handleFilter() {
  applyFilters()
}

// 重置筛选
function resetFilter() {
  ratingFilter.value = null
  replyFilter.value = null
  dateRange.value = []
  searchKeyword.value = ""
  filteredList.value = list.value
}

// 日期变化
function handleDateChange() {
  if (dateRange.value && dateRange.value.length === 2) {
    handleFilter()
  }
}

// 分页处理
function handleCurrentChange(newPage) {
  page.value = newPage
  load()
}

function handleSizeChange(newSize) {
  size.value = newSize
  page.value = 1
  load()
}

// 编辑评论
function editComment(comment) {
  editingComment.value = { ...comment }
  showEditDialog.value = true
}

async function confirmEdit() {
  const user = getUserInfo()
  if (!user) return

  editLoading.value = true
  try {
    await request.post("/comment/update", {
      id: editingComment.value.id,
      rating: editingComment.value.rating,
      content: editingComment.value.content
    }, {
      headers: {
        "X-User-Id": user.userId,
        "X-User-Role": user.role
      }
    })
    
    ElMessage.success("修改成功")
    showEditDialog.value = false
    load()
  } catch (error) {
    ElMessage.error("修改失败")
  } finally {
    editLoading.value = false
  }
}

// 删除评论
function deleteComment(comment) {
  deletingComment.value = comment
  showDeleteDialog.value = true
}

async function confirmDelete() {
  const user = getUserInfo()
  if (!user || !deletingComment.value) return

  deleteLoading.value = true
  try {
    await request.delete(`/comment/delete/${deletingComment.value.id}`, {
      headers: {
        "X-User-Id": user.userId,
        "X-User-Role": user.role
      }
    })
    
    ElMessage.success("删除成功")
    showDeleteDialog.value = false
    load()
  } catch (error) {
    ElMessage.error("删除失败")
  } finally {
    deleteLoading.value = false
    deletingComment.value = null
  }
}

// 跳转到房源详情
function goToHouseDetail(houseId) {
  router.push(`/user/house/${houseId}`)
}

// 查看房源
function viewHouse(houseId) {
  router.push(`/user/house/${houseId}`)
}

// 去用户预约列表
function goToUserAppointmentList() {
  router.push("/user/appointments")
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
  load()
})

// 监听列表变化，更新筛选结果
watch(list, () => {
  applyFilters()
})
</script>

<style scoped>
.my-comments-container {
  max-width: 1200px;
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

/* 筛选栏 */
.filter-card {
  margin-bottom: 24px;
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

.date-picker {
  width: 240px;
}

.filter-right {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.search-input {
  width: 200px;
}

/* 评论列表 */
.comments-list {
  margin-bottom: 24px;
}

.comment-card {
  margin-bottom: 16px;
  border-radius: 8px;
  transition: all 0.3s;
}

.comment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 评论头部 */
.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f2f5;
}

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
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.house-sub {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  color: #dcdfe6;
}

.rating-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rating-text {
  font-size: 14px;
  color: #f7b500;
  font-weight: 500;
}

/* 评论内容 */
.comment-content {
  margin-bottom: 16px;
}

.comment-content p {
  color: #606266;
  line-height: 1.8;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 评论图片 */
.comment-images {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.comment-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  cursor: pointer;
  object-fit: cover;
  transition: opacity 0.3s;
}

.comment-image:hover {
  opacity: 0.8;
}

.more-images {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border-radius: 4px;
  color: #909399;
  font-size: 14px;
}

/* 商家回复 */
.host-reply {
  margin-top: 16px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #409EFF;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.host-avatar {
  background-color: #409EFF;
}

.host-name {
  font-size: 13px;
  font-weight: 500;
  color: #409EFF;
}

.reply-time {
  font-size: 12px;
  color: #909399;
  margin-left: auto;
}

.reply-content {
  color: #606266;
  line-height: 1.6;
  margin: 0 0 0 32px;
  font-size: 14px;
}

.no-reply {
  margin-top: 12px;
  text-align: right;
}

/* 操作按钮 */
.comment-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
  justify-content: flex-end;
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

.delete-content p {
  color: #909399;
  margin: 0;
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .my-comments-container {
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

  .filter-bar {
    flex-direction: column;
  }

  .filter-left {
    width: 100%;
  }

  .filter-select,
  .date-picker {
    width: 100%;
  }

  .filter-right {
    width: 100%;
    flex-wrap: wrap;
  }

  .search-input {
    width: 100%;
  }

  .comment-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .rating-info {
    align-self: flex-start;
  }

  .comment-actions {
    flex-wrap: wrap;
  }

  .comment-image {
    width: 60px;
    height: 60px;
  }

  .more-images {
    width: 60px;
    height: 60px;
  }
}
</style>