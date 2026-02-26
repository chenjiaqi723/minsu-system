<template>
  <div class="favorite-container">
    <!-- 页面标题和统计 -->
    <div class="page-header">
      <div class="header-left">
        <h2>我的收藏</h2>
        <p class="subtitle">收藏你喜欢的房源，随时查看预订</p>
      </div>
      <div class="header-right">
        <div class="stats-card">
          <div class="stat-item">
            <span class="stat-label">收藏总数</span>
            <span class="stat-value">{{ total }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">可预订</span>
            <span class="stat-value success">{{ availableCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已下架</span>
            <span class="stat-value danger">{{ offlineCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选和操作栏 -->
    <el-card class="action-card" shadow="hover" v-if="list.length > 0">
      <div class="action-bar">
        <div class="filter-left">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索收藏的房源"
            :prefix-icon="Search"
            clearable
            class="search-input"
            @keyup.enter="handleSearch"
          />
          <el-select v-model="sortBy" placeholder="排序方式" class="sort-select">
            <el-option label="默认排序" value="default" />
            <el-option label="价格从低到高" value="priceAsc" />
            <el-option label="价格从高到低" value="priceDesc" />
            <el-option label="收藏时间最新" value="newest" />
          </el-select>
        </div>
        <div class="filter-right">
          <el-button type="danger" plain @click="showBatchDelete = true" :icon="Delete">
            批量删除
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="3" animated :count="6" />
    </div>

    <!-- 空状态 -->
    <el-empty 
      v-else-if="filteredList.length === 0" 
      description="还没有收藏房源哦～"
      :image-size="200"
    >
      <el-button type="primary" @click="goToHouseList">去浏览房源</el-button>
    </el-empty>

    <!-- 收藏列表 - 网格视图 -->
    <div v-else class="house-grid">
      <el-row :gutter="20">
        <el-col
          v-for="item in filteredList"
          :key="item.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <el-card class="house-card" shadow="hover" :body-style="{ padding: '0' }">
            <!-- 房源图片 -->
            <div class="house-cover" @click="goDetail(item.id)">
              <el-image
                :src="item.coverImage || '/default-house.jpg'"
                fit="cover"
                class="cover-image"
              >
                <template #error>
                  <div class="cover-placeholder">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              
              <!-- 状态标签 -->
              <div class="status-tag" :class="item.status === 1 ? 'online' : 'offline'">
                {{ item.status === 1 ? '可预订' : '已下架' }}
              </div>

              <!-- 价格标签 -->
              <div class="price-tag">
                ￥{{ formatMoney(item.price) }}
                <span class="per-night">/晚</span>
              </div>

              <!-- 收藏时间 -->
              <div class="favorite-time">
                <el-icon><Star /></el-icon>
                {{ formatDate(item.createTime) }}
              </div>

              <!-- 删除按钮 -->
              <el-button
                class="delete-btn"
                circle
                size="small"
                @click.stop="showDeleteConfirm(item)"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>

            <!-- 房源信息 -->
            <div class="house-info" @click="goDetail(item.id)">
              <h3 class="house-title">{{ item.title }}</h3>
              
              <div class="house-rating">
                <el-rate
                  v-model="item.score"
                  disabled
                  text-color="#ff9900"
                  size="small"
                />
                <span class="rating-score">{{ item.score?.toFixed(1) || '暂无' }}</span>
              </div>

              <div class="house-address">
                <el-icon><Location /></el-icon>
                <span class="address-text">{{ item.address || '地址待补充' }}</span>
              </div>

              <div class="house-features">
                <el-tag size="small" type="info" effect="plain">
                  <el-icon><User /></el-icon>
                  {{ item.capacity }}人
                </el-tag>
                <el-tag size="small" type="success" effect="plain" v-if="item.status === 1">
                  可预订
                </el-tag>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="card-actions">
              <el-button
                type="primary"
                size="small"
                :disabled="item.status !== 1"
                @click.stop="quickBook(item)"
              >
                立即预订
              </el-button>
              <el-button
                size="small"
                @click.stop="goDetail(item.id)"
              >
                查看详情
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 分页 -->
    <div class="pagination-container" v-if="total > 0">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[6, 12, 18, 24]"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 删除确认对话框 -->
    <el-dialog v-model="showDeleteDialog" title="取消收藏" width="400px" center>
      <div class="delete-content">
        <el-icon :size="50" color="#f56c6c"><WarningFilled /></el-icon>
        <h3>确定要取消收藏吗？</h3>
        <p class="house-name">《{{ currentHouse?.title }}》</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDeleteDialog = false">再想想</el-button>
          <el-button type="danger" @click="confirmDelete" :loading="deleteLoading">
            确认取消
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量删除对话框 -->
    <el-dialog v-model="showBatchDelete" title="批量取消收藏" width="500px">
      <div class="batch-delete-content">
        <p class="batch-tip">请选择要取消收藏的房源：</p>
        <el-checkbox-group v-model="selectedIds">
          <div v-for="item in list" :key="item.id" class="batch-item">
            <el-checkbox :label="item.id">
              <div class="batch-item-info">
                <span class="batch-item-title">{{ item.title }}</span>
                <span class="batch-item-price">￥{{ formatMoney(item.price) }}</span>
              </div>
            </el-checkbox>
          </div>
        </el-checkbox-group>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showBatchDelete = false">取消</el-button>
          <el-button 
            type="danger" 
            @click="confirmBatchDelete" 
            :loading="batchDeleteLoading"
            :disabled="selectedIds.length === 0"
          >
            确认删除 ({{ selectedIds.length }})
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Delete,
  Picture,
  Star,
  Location,
  User,
  Close,
  WarningFilled
} from '@element-plus/icons-vue'
import request from '../../utils/request'
import { formatMoney } from '../../utils/format'

const router = useRouter()

// 数据
const list = ref([])
const filteredList = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(6)
const loading = ref(false)

// 筛选和排序
const searchKeyword = ref('')
const sortBy = ref('default')

// 删除相关
const showDeleteDialog = ref(false)
const showBatchDelete = ref(false)
const deleteLoading = ref(false)
const batchDeleteLoading = ref(false)
const currentHouse = ref(null)
const selectedIds = ref([])

// 计算属性
const availableCount = computed(() => {
  return list.value.filter(item => item.status === 1).length
})

const offlineCount = computed(() => {
  return list.value.filter(item => item.status !== 1).length
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
    router.push("/login")
    return
  }

  loading.value = true
  try {
    const res = await request.get('/favorite/my', {
      params: {
        page: page.value,
        size: pageSize.value
      },
      headers: {
        "X-User-Id": user.userId,
        "X-User-Role": user.role
      }
    })

    list.value = res.data.records || []
    total.value = res.data.total || 0
    applyFilterAndSort()
  } catch (error) {
    ElMessage.error("加载收藏列表失败")
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 应用筛选和排序
const applyFilterAndSort = () => {
  let filtered = [...list.value]
  
  // 关键词筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(item => 
      item.title?.toLowerCase().includes(keyword) ||
      item.address?.toLowerCase().includes(keyword)
    )
  }
  
  // 排序
  switch (sortBy.value) {
    case 'priceAsc':
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0))
      break
    case 'priceDesc':
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0))
      break
    case 'newest':
      filtered.sort((a, b) => new Date(b.favoriteTime) - new Date(a.favoriteTime))
      break
    default:
      // 默认按收藏时间倒序
      filtered.sort((a, b) => new Date(b.favoriteTime) - new Date(a.favoriteTime))
  }
  
  filteredList.value = filtered
}

// 搜索
const handleSearch = () => {
  applyFilterAndSort()
}

// 分页处理
const handlePageChange = (val) => {
  page.value = val
  loadData()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  page.value = 1
  loadData()
}

// 跳转详情
const goDetail = (id) => {
  router.push(`/user/house/${id}`)
}

// 去房源列表
const goToHouseList = () => {
  router.push('/user/houses')
}

// 快速预订
const quickBook = (item) => {
  router.push(`/user/appointment/create/${item.id}`)
}

// 删除确认
const showDeleteConfirm = (item) => {
  currentHouse.value = item
  showDeleteDialog.value = true
}

// 确认删除
const confirmDelete = async () => {
  if (!currentHouse.value) return

  const user = getUserInfo()
  if (!user) return

  deleteLoading.value = true
  try {
    await request.post(`/favorite/remove/${currentHouse.value.id}`, {}, {
      headers: {
        "X-User-Id": user.userId,
        "X-User-Role": user.role
      }
    })
    
    ElMessage.success("已取消收藏")
    showDeleteDialog.value = false
    await loadData()
  } catch (error) {
    ElMessage.error("操作失败")
  } finally {
    deleteLoading.value = false
    currentHouse.value = null
  }
}

// 批量删除确认
const confirmBatchDelete = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning("请选择要取消收藏的房源")
    return
  }

  const user = getUserInfo()
  if (!user) return

  batchDeleteLoading.value = true
  try {
    // 依次删除选中的收藏
    for (const id of selectedIds.value) {
      await request.post(`/favorite/remove/${id}`, {}, {
        headers: {
          "X-User-Id": user.userId,
          "X-User-Role": user.role
        }
      })
    }
    
    ElMessage.success(`已取消 ${selectedIds.value.length} 个收藏`)
    showBatchDelete.value = false
    selectedIds.value = []
    await loadData()
  } catch (error) {
    ElMessage.error("批量删除失败")
  } finally {
    batchDeleteLoading.value = false
  }
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days < 1) {
    return "今天收藏"
  } else if (days < 7) {
    return `${days}天前收藏`
  } else {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}

// 监听筛选条件变化
watch([searchKeyword, sortBy], () => {
  applyFilterAndSort()
})

// 监听列表变化
watch(list, () => {
  applyFilterAndSort()
})

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.favorite-container {
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

.stat-value.success {
  color: #67c23a;
}

.stat-value.danger {
  color: #f56c6c;
}

/* 操作栏 */
.action-card {
  margin-bottom: 24px;
  border-radius: 8px;
}

.action-bar {
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

.sort-select {
  width: 150px;
}

/* 加载状态 */
.loading-state {
  padding: 40px 0;
}

/* 房源网格 */
.house-grid {
  margin-bottom: 30px;
}

/* 房源卡片 */
.house-card {
  margin-bottom: 20px;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
}

.house-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

/* 封面区域 */
.house-cover {
  position: relative;
  height: 180px;
  overflow: hidden;
  background-color: #f5f7fa;
}

.cover-image {
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
}

.house-card:hover .cover-image {
  transform: scale(1.05);
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  background-color: #f5f7fa;
}

.cover-placeholder .el-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

/* 状态标签 */
.status-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  z-index: 2;
}

.status-tag.online {
  background-color: #67c23a;
}

.status-tag.offline {
  background-color: #909399;
}

/* 价格标签 */
.price-tag {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 18px;
  font-weight: 600;
  backdrop-filter: blur(4px);
  z-index: 2;
}

.per-night {
  font-size: 12px;
  font-weight: normal;
  margin-left: 2px;
}

/* 收藏时间 */
.favorite-time {
  position: absolute;
  top: 12px;
  right: 48px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  backdrop-filter: blur(4px);
  z-index: 2;
}

/* 删除按钮 */
.delete-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 3;
  width: 30px;
  height: 30px;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  transform: scale(1.1);
  background: #f56c6c;
  color: white;
}

/* 房源信息 */
.house-info {
  padding: 16px;
}

.house-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.house-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.rating-score {
  font-size: 13px;
  color: #f7b500;
  font-weight: 500;
}

.house-address {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
}

.address-text {
  font-size: 13px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.house-features {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.house-features .el-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* 卡片操作按钮 */
.card-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px 16px;
  border-top: 1px solid #f0f2f5;
}

.card-actions .el-button {
  flex: 1;
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

.house-name {
  color: #606266;
  font-size: 14px;
  margin: 0;
}

/* 批量删除对话框 */
.batch-delete-content {
  max-height: 400px;
  overflow-y: auto;
  padding: 0 10px;
}

.batch-tip {
  margin: 0 0 16px;
  color: #606266;
  font-size: 14px;
}

.batch-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f2f5;
}

.batch-item:last-child {
  border-bottom: none;
}

.batch-item-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  margin-left: 8px;
}

.batch-item-title {
  font-size: 14px;
  color: #303133;
}

.batch-item-price {
  font-size: 14px;
  color: #f56c6c;
  font-weight: 500;
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .favorite-container {
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

  .action-bar {
    flex-direction: column;
  }

  .filter-left {
    width: 100%;
  }

  .search-input,
  .sort-select {
    width: 100%;
  }

  .filter-right {
    width: 100%;
  }

  .filter-right .el-button {
    width: 100%;
  }

  .favorite-time {
    display: none;
  }

  .card-actions {
    flex-direction: column;
  }
}
</style>