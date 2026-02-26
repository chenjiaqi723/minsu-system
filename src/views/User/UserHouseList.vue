<template>
  <div class="house-list-container">
    <!-- 页面标题与快捷操作 -->
    <div class="page-header">
      <div class="header-left">
        <h2>房源列表</h2>
        <span class="header-subtitle">找到您的理想居所</span>
      </div>
      <div class="header-right">
        <el-button :icon="Refresh" circle @click="refreshData" />
      </div>
    </div>

    <!-- 筛选区域 - 折叠设计节省空间 -->
    <div class="filter-section">
      <el-card shadow="never" class="filter-card">
        <div class="filter-main">
          <!-- 第一行：核心筛选条件 -->
          <div class="filter-row">
            <div class="filter-item">
              <span class="filter-label">
                <el-icon><Calendar /></el-icon>入住日期
              </span>
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="入住"
                end-placeholder="离店"
                :disabled-date="disabledDate"
                :shortcuts="dateShortcuts"
                class="date-picker"
                @change="handleDateChange"
              />
            </div>

            <div class="filter-item">
              <span class="filter-label">
                <el-icon><User /></el-icon>入住人数
              </span>
              <el-input-number
                v-model="guestCount"
                :min="1"
                :max="10"
                controls-position="right"
                class="guest-input"
              />
            </div>

            <el-button 
              type="primary" 
              :icon="Search" 
              @click="handleSearch"
              :loading="loading"
              class="search-btn"
            >
              搜索房源
            </el-button>
          </div>

          <!-- 第二行：高级筛选（可折叠） -->
          <el-collapse-transition>
            <div v-show="showAdvancedFilter" class="filter-row advanced">
              <div class="filter-item">
                <span class="filter-label">房源名称</span>
                <el-input
                  v-model="keyword"
                  placeholder="输入房源名称"
                  clearable
                  class="filter-input"
                  :prefix-icon="Search"
                />
              </div>

              <div class="filter-item">
                <span class="filter-label">价格范围</span>
                <div class="price-range">
                  <el-input-number
                    v-model="minPrice"
                    :min="0"
                    :step="100"
                    placeholder="最低价"
                    controls-position="right"
                    class="price-input"
                  />
                  <span class="price-separator">-</span>
                  <el-input-number
                    v-model="maxPrice"
                    :min="0"
                    :step="100"
                    placeholder="最高价"
                    controls-position="right"
                    class="price-input"
                  />
                  <span class="price-unit">元/晚</span>
                </div>
              </div>

              <div class="filter-item">
                <span class="filter-label">排序方式</span>
                <el-select v-model="sort" placeholder="请选择" class="sort-select">
                  <el-option label="默认排序" value="" />
                  <el-option label="价格从低到高" value="priceAsc" />
                  <el-option label="价格从高到低" value="priceDesc" />
                  <el-option label="评分从高到低" value="scoreDesc" />
                </el-select>
              </div>
            </div>
          </el-collapse-transition>
        </div>

        <!-- 筛选操作栏 -->
        <div class="filter-actions">
          <el-button 
            text 
            :icon="ArrowDown"
            @click="showAdvancedFilter = !showAdvancedFilter"
          >
            {{ showAdvancedFilter ? '收起高级筛选' : '展开高级筛选' }}
          </el-button>
          <el-button text :icon="Delete" @click="resetFilters">清空筛选</el-button>
        </div>

        <!-- 已选条件标签 -->
        <div v-if="hasActiveFilters" class="active-filters">
          <span class="active-label">已选条件：</span>
          <el-tag 
            v-if="dateRange.length === 2"
            closable
            @close="dateRange = []"
            class="filter-tag"
          >
            <el-icon><Calendar /></el-icon>
            {{ formatDate(dateRange[0]) }} 至 {{ formatDate(dateRange[1]) }}
          </el-tag>
          <el-tag 
            v-if="guestCount > 1"
            closable
            @close="guestCount = 1"
            class="filter-tag"
          >
            <el-icon><User /></el-icon>
            {{ guestCount }} 人
          </el-tag>
          <el-tag 
            v-if="keyword"
            closable
            @close="keyword = ''"
            class="filter-tag"
          >
            {{ keyword }}
          </el-tag>
          <el-tag 
            v-if="minPrice || maxPrice"
            closable
            @close="minPrice = null; maxPrice = null"
            class="filter-tag"
          >
            ￥{{ minPrice || 0 }} - ￥{{ maxPrice || '不限' }}
          </el-tag>
        </div>
      </el-card>
    </div>

    <!-- 房源列表 -->
    <div class="list-section">
      <!-- 结果统计 -->
      <div class="result-stats">
        <span>共找到 <strong>{{ total }}</strong> 个房源</span>
        <span v-if="dateRange.length === 2" class="stay-days">
          入住 {{ stayDays }} 晚
        </span>
      </div>

      <!-- 加载状态 -->
      <el-skeleton :loading="loading" animated :count="4" :throttle="500">
        <template #template>
          <el-row :gutter="20">
            <el-col :span="6" v-for="i in 4" :key="i">
              <el-card class="skeleton-card">
                <el-skeleton-item variant="image" style="width:100%; height:160px" />
                <div style="padding: 14px">
                  <el-skeleton-item variant="h3" style="width: 60%" />
                  <el-skeleton-item variant="text" style="margin-top: 10px" />
                  <el-skeleton-item variant="text" style="width: 40%" />
                </div>
              </el-card>
            </el-col>
          </el-row>
        </template>

        <template #default>
          <!-- 空状态 -->
          <el-empty 
            v-if="houses.length === 0" 
            description="暂无符合条件的房源"
            :image-size="200"
          >
            <el-button type="primary" @click="resetFilters">清空筛选条件</el-button>
          </el-empty>

          <!-- 房源卡片网格 -->
          <el-row :gutter="20" v-else>
            <el-col 
              :xs="24" 
              :sm="12" 
              :md="8" 
              :lg="6" 
              v-for="item in houses" 
              :key="item.id"
            >
              <el-card 
                class="house-card" 
                :body-style="{ padding: '0px' }"
                shadow="hover"
              >
                <!-- 房源封面 -->
                <div class="house-cover" @click="goToDetail(item.id)">
                  <el-image
                    :src="item.cover || defaultCover"
                    fit="cover"
                    class="cover-image"
                  >
                    <template #error>
                      <div class="image-error">
                        <el-icon><Picture /></el-icon>
                        <span>暂无图片</span>
                      </div>
                    </template>
                  </el-image>
                  
                  <!-- 价格标签 -->
                  <div class="price-tag">
                    ￥{{ formatMoney(item.price) }}
                    <span class="unit">/晚</span>
                  </div>

                  <!-- 收藏按钮 -->
                  <el-button
                    class="favorite-btn"
                    circle
                    @click.stop="toggleFavorite(item)"
                  >
                    <el-icon :color="item.favorited ? '#ff6b81' : '#999'" :size="18">
                      <!-- 直接使用图标组件，不用动态组件 -->
                      <StarFilled v-if="item.favorited" />
                      <Star v-else />
                    </el-icon>
                  </el-button>
                </div>

                <!-- 房源信息 -->
                <div class="house-info">
                  <h3 class="house-title" @click="goToDetail(item.id)">
                    {{ item.title }}
                  </h3>
                  
                  <div class="house-rating">
                    <el-rate 
                      v-model="item.score" 
                      disabled 
                      text-color="#ff9900"
                      :colors="ratingColors"
                    />
                    <span class="rating-score">{{ item.score?.toFixed(1) || '暂无' }}</span>
                  </div>

                  <div class="house-meta">
                    <div class="meta-item">
                      <el-icon><Location /></el-icon>
                      <span class="address">{{ item.address || '地址待补充' }}</span>
                    </div>
                    <div class="meta-item">
                      <el-icon><User /></el-icon>
                      <span>最多 {{ item.capacity }} 人</span>
                    </div>
                  </div>

                  <!-- 预订状态提示 -->
                  <div class="booking-status">
                    <div v-if="dateRange.length !== 2" class="status-warning">
                      <el-icon><InfoFilled /></el-icon>
                      <span>请先选择入住日期</span>
                    </div>
                    <div v-else-if="item.available" class="status-success">
                      <el-icon><CircleCheckFilled /></el-icon>
                      <span>可预订</span>
                    </div>
                    <div v-else class="status-error">
                      <el-icon><CircleCloseFilled /></el-icon>
                      <span>已满房</span>
                    </div>
                  </div>

                  <!-- 操作按钮 -->
                  <div class="house-actions">
                    <el-button 
                      type="primary" 
                      :disabled="dateRange.length !== 2 || !item.available"
                      @click.stop="goToAppointment(item)"
                      class="book-btn"
                    >
                      立即预订
                    </el-button>
                    <el-button 
                      text
                      @click.stop="goToDetail(item.id)"
                    >
                      查看详情
                    </el-button>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </template>
      </el-skeleton>
    </div>

    <!-- 分页 -->
    <div class="pagination-section" v-if="total > 0">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        v-model:current-page="page"
        v-model:page-size="size"
        :page-sizes="[8, 12, 16, 20]"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import request from "../../utils/request";
import { formatMoney } from "../../utils/format";
import {
  Search,
  Refresh,
  Calendar,
  User,
  Location,
  Star,
  StarFilled,
  Picture,
  ArrowDown,
  Delete,
  InfoFilled,
  CircleCheckFilled,
  CircleCloseFilled
} from "@element-plus/icons-vue";

const router = useRouter();
const houses = ref([]);
const page = ref(1);
const size = ref(8);
const total = ref(0);
const loading = ref(false);
const showAdvancedFilter = ref(false);

// 筛选条件
const dateRange = ref([]);
const guestCount = ref(1);
const keyword = ref("");
const minPrice = ref(null);
const maxPrice = ref(null);
const sort = ref("");

// 默认封面图
const defaultCover = "https://via.placeholder.com/300x200?text=No+Image";

// 评分颜色
const ratingColors = ['#ff9900', '#ff9900', '#ff9900'];

// 日期快捷选项
const dateShortcuts = [
  {
    text: '本周',
    value: () => {
      const start = new Date()
      const end = new Date()
      end.setDate(end.getDate() + 7)
      return [start, end]
    }
  },
  {
    text: '本月',
    value: () => {
      const start = new Date()
      const end = new Date()
      end.setMonth(end.getMonth() + 1)
      return [start, end]
    }
  }
];

// 计算入住天数
const stayDays = computed(() => {
  if (dateRange.value.length !== 2) return 0;
  const [start, end] = dateRange.value;
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
});

// 判断是否有激活的筛选条件
const hasActiveFilters = computed(() => {
  return dateRange.value.length === 2 || 
         guestCount.value > 1 || 
         keyword.value || 
         minPrice.value || 
         maxPrice.value;
});

// 初始化加载
onMounted(() => {
  loadData();
});

// 加载数据
async function loadData() {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      size: size.value,
      keyword: keyword.value || undefined,
      minPrice: minPrice.value,
      maxPrice: maxPrice.value,
      sort: sort.value || undefined,
      startDate: formatDate(dateRange.value?.[0]),
      endDate: formatDate(dateRange.value?.[1]),
      guestCount: guestCount.value
    };
    
    // 移除 undefined 参数
    Object.keys(params).forEach(key => 
      params[key] === undefined && delete params[key]
    );

    const res = await request.get("/house/userList", { params });
    houses.value = res.data.records.map(house => ({
      ...house,
      available: checkAvailability(house) // 模拟检查可用性
    }));
    total.value = res.data.total;
  } catch (error) {
    ElMessage.error("加载失败，请重试");
  } finally {
    loading.value = false;
  }
}

// 模拟检查房源可用性（实际应从后端获取）
function checkAvailability(house) {
  if (dateRange.value.length !== 2) return true;
  // 这里应该有真实的库存检查逻辑
  return Math.random() > 0.3; // 模拟70%的概率可预订
}

// 格式化日期
function formatDate(date) {
  if (!date) return null
  const d = new Date(date)
  // 使用本地时间格式化，避免时区问题
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 日期禁用规则
function disabledDate(time) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return time.getTime() < today.getTime();
}

// 日期变更处理
function handleDateChange() {
  if (dateRange.value.length === 2) {
    loadData();
  }
}

// 搜索
function handleSearch() {
  if (dateRange.value.length !== 2) {
    ElMessage.warning("请选择入住日期");
    return;
  }
  page.value = 1;
  loadData();
}

// 刷新数据
function refreshData() {
  loadData();
  ElMessage.success("已刷新");
}

// 重置筛选
function resetFilters() {
  dateRange.value = [];
  guestCount.value = 1;
  keyword.value = "";
  minPrice.value = null;
  maxPrice.value = null;
  sort.value = "";
  page.value = 1;
  loadData();
}

// 分页处理
function handlePageChange(newPage) {
  page.value = newPage;
  loadData();
}

function handleSizeChange(newSize) {
  size.value = newSize;
  page.value = 1;
  loadData();
}

// 跳转详情
function goToDetail(id) {
  router.push(`/user/house/${id}`);
}

// 跳转预订
function goToAppointment(item) {
  if (dateRange.value.length !== 2) {
    ElMessage.warning("请先选择入住日期");
    return;
  }
  if (!item.available) {
    ElMessage.warning("该时段已满房");
    return;
  }
  
  router.push({
    path: `/user/appointment/create/${item.id}`,
    query: {
      startDate: formatDate(dateRange.value[0]),
      endDate: formatDate(dateRange.value[1]),
      guests: guestCount.value
    }
  });
}

// 收藏/取消收藏
async function toggleFavorite(item) {
  try {
    if (item.favorited) {
      await request.post(`/favorite/remove/${item.id}`);
      item.favorited = false;
      ElMessage.success("已取消收藏");
    } else {
      await request.post(`/favorite/add/${item.id}`);
      item.favorited = true;
      ElMessage.success("收藏成功");
    }
  } catch (error) {
    ElMessage.error("操作失败，请重试");
  }
}
</script>

<style scoped>
.house-list-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.header-left h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
}

.header-subtitle {
  color: #909399;
  font-size: 14px;
}

/* 筛选区域 */
.filter-section {
  margin-bottom: 24px;
}

.filter-card {
  border-radius: 12px;
}

.filter-main {
  padding: 16px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  margin-bottom: 16px;
}

.filter-row.advanced {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 400px;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #606266;
  font-size: 14px;
  white-space: nowrap;
}

.date-picker {
  flex: 1;
  min-width: 260px;
}

.guest-input {
  width: 120px;
}

.filter-input {
  width: 100%;
}

.price-range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.price-input {
  width: 120px;
}

.price-separator {
  color: #909399;
}

.price-unit {
  color: #606266;
  font-size: 14px;
  margin-left: 4px;
}

.sort-select {
  width: 160px;
}

.search-btn {
  min-width: 100px;
}

.filter-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: #f5f7fa;
  border-top: 1px solid #ebeef5;
}

/* 已选条件标签 */
.active-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  background-color: #f9f9fc;
  border-top: 1px solid #ebeef5;
}

.active-label {
  color: #606266;
  font-size: 14px;
}

.filter-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 结果统计 */
.result-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  color: #606266;
  font-size: 14px;
}

.result-stats strong {
  color: #409eff;
  font-size: 18px;
}

.stay-days {
  background-color: #ecf5ff;
  padding: 4px 12px;
  border-radius: 16px;
  color: #409eff;
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
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

.house-cover {
  position: relative;
  height: 160px;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.house-card:hover .cover-image {
  transform: scale(1.05);
}

.image-error {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #909399;
}

.price-tag {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: rgba(0,0,0,0.6);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 600;
  backdrop-filter: blur(4px);
}

.price-tag .unit {
  font-size: 12px;
  font-weight: normal;
  opacity: 0.8;
}

.favorite-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: white;
  border: none;
  opacity: 0.9;
}

.favorite-btn:hover {
  opacity: 1;
}

.house-info {
  padding: 16px;
}

.house-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.house-title:hover {
  color: #409eff;
}

.house-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.rating-score {
  color: #ff9900;
  font-size: 14px;
  font-weight: 600;
}

.house-meta {
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #606266;
  font-size: 13px;
  margin-bottom: 4px;
}

.meta-item .address {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 预订状态 */
.booking-status {
  margin-bottom: 16px;
}

.status-warning,
.status-success,
.status-error {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
}

.status-warning {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.status-success {
  background-color: #f0f9eb;
  color: #67c23a;
}

.status-error {
  background-color: #fef0f0;
  color: #f56c6c;
}

.house-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.book-btn {
  flex: 1;
}

/* 骨架屏 */
.skeleton-card {
  margin-bottom: 20px;
}

/* 分页区域 */
.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .house-list-container {
    padding: 16px;
  }

  .filter-item {
    min-width: 100%;
  }

  .date-picker {
    width: 100%;
  }

  .price-range {
    flex-wrap: wrap;
  }

  .price-input {
    width: calc(50% - 20px);
  }

  .house-actions {
    flex-direction: column;
  }

  .book-btn {
    width: 100%;
  }
}
</style>