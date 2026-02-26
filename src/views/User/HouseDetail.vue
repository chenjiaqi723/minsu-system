<template>
  <div class="house-detail-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <el-result
        icon="error"
        title="加载失败"
        :sub-title="error"
      >
        <template #extra>
          <el-button type="primary" @click="goBack">返回列表</el-button>
        </template>
      </el-result>
    </div>

    <!-- 房源内容 -->
    <div v-else-if="house" class="house-content">
      <!-- 返回按钮和面包屑 -->
      <div class="nav-header">
        <el-button link @click="goBack">
          <el-icon><ArrowLeft /></el-icon> 返回房源列表
        </el-button>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/user/houses' }">房源列表</el-breadcrumb-item>
          <el-breadcrumb-item>房源详情</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <!-- 主要内容区域 -->
      <el-row :gutter="24">
        <!-- 左侧图片和信息 -->
        <el-col :xs="24" :lg="16">
          <el-card class="detail-card" shadow="hover">
            <!-- 图片区域 -->
            <div class="image-gallery">
              <el-image
                :src="house.cover || '/default-house.jpg'"
                fit="cover"
                class="main-image"
              >
                <template #error>
                  <div class="image-placeholder">
                    <el-icon><Picture /></el-icon>
                    <span>暂无图片</span>
                  </div>
                </template>
              </el-image>
              
              <!-- 缩略图列表（如果有多个图片） -->
              <div v-if="house.images && house.images.length > 0" class="thumbnail-list">
                <el-image
                  v-for="(img, index) in house.images.slice(0, 4)"
                  :key="index"
                  :src="img"
                  fit="cover"
                  class="thumbnail"
                  :preview-src-list="house.images"
                  hide-on-click-modal
                />
              </div>
            </div>

            <!-- 房源标题和基本信息 -->
            <div class="house-header">
              <div class="title-section">
                <h1 class="house-title">{{ house.title }}</h1>
                <div class="house-rating">
                  <el-rate
                    v-model="house.score"
                    disabled
                    text-color="#ff9900"
                  />
                  <span class="rating-score">{{ house.score?.toFixed(1) || '暂无评分' }}</span>
                </div>
              </div>
              
              <div class="house-address">
                <el-icon><Location /></el-icon>
                {{ house.address || '地址信息待补充' }}
              </div>
            </div>

            <!-- 房源特点标签 -->
            <div class="house-features">
              <el-tag type="info" effect="plain" size="large">
                <el-icon><User /></el-icon>
                最多可住 {{ house.capacity }} 人
              </el-tag>
              <el-tag type="success" effect="plain" size="large">
                <el-icon><OfficeBuilding /></el-icon>
                {{ house.roomType || '整套房源' }}
              </el-tag>
              <el-tag type="warning" effect="plain" size="large">
                <el-icon><Timer /></el-icon>
                入住时间 {{ house.checkInTime || '14:00' }}
              </el-tag>
            </div>

            <!-- 房源描述 -->
            <div class="house-description">
              <h3>房源描述</h3>
              <p>{{ house.description || '暂无描述信息' }}</p>
            </div>

            <!-- 设施服务 -->
            <div class="house-amenities" v-if="house.amenities">
              <h3>设施服务</h3>
              <el-row :gutter="16">
                <el-col
                  v-for="(amenity, index) in house.amenities"
                  :key="index"
                  :xs="12"
                  :sm="8"
                  :md="6"
                >
                  <div class="amenity-item">
                    <el-icon><component :is="getAmenityIcon(amenity)" /></el-icon>
                    <span>{{ amenity }}</span>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧预订卡片 -->
        <el-col :xs="24" :lg="8">
          <div class="booking-sidebar">
            <el-card class="booking-card" shadow="hover">
              <div class="price-section">
                <span class="price">￥{{ formatMoney(house.price) }}</span>
                <span class="per-night">/晚</span>
              </div>

              <!-- 日期选择 -->
              <div class="date-picker-section">
                <div class="section-label">
                  <el-icon><Calendar /></el-icon>
                  <span>入住日期</span>
                </div>
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="入住"
                  end-placeholder="离店"
                  :disabled-date="disabledDate"
                  class="full-width"
                  @change="calculateTotal"
                />
              </div>

              <!-- 人数选择 -->
              <div class="guest-section">
                <div class="section-label">
                  <el-icon><User /></el-icon>
                  <span>入住人数</span>
                </div>
                <el-input-number
                  v-model="guestCount"
                  :min="1"
                  :max="house.capacity"
                  class="full-width"
                  controls-position="right"
                  @change="calculateTotal"
                />
                <div class="capacity-hint">最多可住 {{ house.capacity }} 人</div>
              </div>

              <!-- 价格明细 -->
              <div v-if="stayDays > 0" class="price-detail">
                <div class="price-row">
                  <span>￥{{ formatMoney(house.price) }} × {{ stayDays }} 晚</span>
                  <span>￥{{ formatMoney(house.price * stayDays) }}</span>
                </div>
                <div class="price-row total">
                  <span>总计</span>
                  <span class="total-price">￥{{ formatMoney(house.price * stayDays) }}</span>
                </div>
              </div>

              <!-- 预订按钮 -->
              <el-button
                type="primary"
                size="large"
                class="book-button"
                :disabled="!canBook"
                @click="goAppointment"
              >
                {{ bookButtonText }}
              </el-button>

              <!-- 预订提示 -->
              <div v-if="!canBook && dateRange.length === 2" class="book-hint warning">
                <el-icon><Warning /></el-icon>
                所选日期不可预订
              </div>
            </el-card>

            <!-- 房东信息卡片 -->
            <el-card class="host-card" shadow="hover" v-if="house.host">
              <div class="host-info">
                <el-avatar :size="48" :src="house.host.avatar">
                  {{ house.host.username?.charAt(0) }}
                </el-avatar>
                <div class="host-detail">
                  <div class="host-name">{{ house.host.username }}</div>
                  <div class="host-stats">
                    <span>房源 {{ house.host.houseCount || 0 }} 套</span>
                    <span>·</span>
                    <span>回复率 {{ house.host.replyRate || '100%' }}</span>
                  </div>
                </div>
              </div>
              <el-button link type="primary" @click="contactHost">
                联系房东
              </el-button>
            </el-card>

            <!-- 收藏按钮 -->
            <el-button
              class="favorite-side-btn"
              :type="house.favorited ? 'danger' : 'default'"
              @click="toggleFavorite"
            >
              <el-icon>
                <StarFilled v-if="house.favorited" />
                <Star v-else />
              </el-icon>
              {{ house.favorited ? '取消收藏' : '收藏房源' }}
            </el-button>
          </div>
        </el-col>
      </el-row>

      <!-- 评论区域 -->
      <el-card class="comments-section" shadow="hover" v-if="comments.length > 0">
        <div class="comments-header">
          <h3>用户评价</h3>
          <el-button link @click="viewAllComments">查看全部评价</el-button>
        </div>
        
        <div class="comment-list">
          <div v-for="comment in comments.slice(0, 3)" :key="comment.id" class="comment-item">
            <div class="comment-user">
              <el-avatar :size="32">{{ comment.username?.charAt(0) }}</el-avatar>
              <div class="comment-user-info">
                <span class="username">{{ comment.username }}</span>
                <el-rate v-model="comment.score" disabled size="small" />
              </div>
              <span class="comment-date">{{ formatDate(comment.createTime) }}</span>
            </div>
            <p class="comment-content">{{ comment.content }}</p>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";

// 正确导入所有需要的图标
import {
  ArrowLeft,
  Picture,
  Location,
  User,
  OfficeBuilding,
  Timer,
  Calendar,
  Warning,
  Star,
  StarFilled
} from "@element-plus/icons-vue";

import request from "../../utils/request";
import { formatMoney } from "../../utils/format";

const route = useRoute();
const router = useRouter();

// 状态
const house = ref(null);
const loading = ref(false);
const error = ref("");
const dateRange = ref([]);
const guestCount = ref(1);
const comments = ref([]);

// 计算属性
const stayDays = computed(() => {
  if (dateRange.value.length !== 2) return 0;
  const [start, end] = dateRange.value;
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
});

const canBook = computed(() => {
  return dateRange.value.length === 2 && guestCount.value > 0 && house.value;
});

const bookButtonText = computed(() => {
  if (dateRange.value.length !== 2) return "请选择入住日期";
  if (stayDays.value === 0) return "请选择有效日期";
  return "立即预订";
});

// 加载房源详情
async function loadHouseDetail() {
  loading.value = true;
  error.value = "";
  
  try {
    const res = await request.get(`/house/detail/${route.params.id}`);
    house.value = res.data;
    
    // 加载评论
    await loadComments();
  } catch (err) {
    console.error("加载房源详情失败:", err);
    error.value = "房源信息加载失败，请稍后重试";
  } finally {
    loading.value = false;
  }
}

// 加载评论
async function loadComments() {
  try {
    const res = await request.get(`/comment/house/${route.params.id}`, {
      params: { page: 1, size: 10 }
    });
    comments.value = res.data.records || [];
  } catch (err) {
    console.error("加载评论失败:", err);
  }
}

// 计算总价
function calculateTotal() {
  // 只是触发重新计算
}

// 禁用日期
function disabledDate(time) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return time.getTime() < today.getTime();
}

// 返回列表
function goBack() {
  router.push('/user/houses');
}

// 预约
function goAppointment() {
  if (dateRange.value.length !== 2) {
    ElMessage.warning("请选择入住日期");
    return;
  }
  
  router.push({
    path: `/user/appointment/create/${route.params.id}`,
    query: {
      startDate: formatDate(dateRange.value[0]),
      endDate: formatDate(dateRange.value[1]),
      guests: guestCount.value
    }
  });
}

// 收藏/取消收藏
async function toggleFavorite() {
  if (!house.value) return;
  
  try {
    if (house.value.favorited) {
      await request.post(`/favorite/remove/${house.value.id}`);
      house.value.favorited = false;
      ElMessage.success("已取消收藏");
    } else {
      await request.post(`/favorite/add/${house.value.id}`);
      house.value.favorited = true;
      ElMessage.success("收藏成功");
    }
  } catch (error) {
    ElMessage.error("操作失败");
  }
}

// 联系房东
function contactHost() {
  ElMessage.info("联系房东功能开发中...");
}

// 查看所有评论
function viewAllComments() {
  // 跳转到该房源的评价列表页面
  router.push(`/user/house/${route.params.id}/comments`);
}

// 格式化日期
function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 获取设施图标
function getAmenityIcon(amenity) {
  // 返回图标组件名称
  const iconMap = {
    'WiFi': 'Connection',
    '空调': 'WindPower',
    '电视': 'Monitor',
    '冰箱': 'Fridge',
    '洗衣机': 'WashingMachine',
    '厨房': 'KnifeFork',
    '停车场': 'Van',
    '电梯': 'Elevator'
  };
  
  const iconName = iconMap[amenity];
  
  // 如果没有匹配的图标，返回一个默认图标组件
  // 注意：这里需要返回组件本身，而不是字符串
  if (iconName) {
    // 动态返回组件
    const icons = {
      Connection: null,
      WindPower: null,
      Monitor: null,
      Fridge: null,
      WashingMachine: null,
      KnifeFork: null,
      Van: null,
      Elevator: null
    };
    return icons[iconName] || 'Tools';
  }
  
  return 'Tools';
}

// 页面加载
onMounted(() => {
  loadHouseDetail();
});
</script>

<style scoped>
.house-detail-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

/* 导航头部 */
.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

/* 加载和错误状态 */
.loading-state,
.error-state {
  padding: 60px 0;
  display: flex;
  justify-content: center;
}

/* 详情卡片 */
.detail-card {
  margin-bottom: 24px;
  border-radius: 12px;
  overflow: hidden;
}

/* 图片区域 */
.image-gallery {
  margin-bottom: 24px;
}

.main-image {
  width: 100%;
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
  background-color: #f5f7fa;
}

.image-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  background-color: #f5f7fa;
}

.image-placeholder .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.thumbnail-list {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.thumbnail {
  width: 80px;
  height: 60px;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.3s;
}

.thumbnail:hover {
  opacity: 0.8;
}

/* 房源头部 */
.house-header {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.house-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.house-rating {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rating-score {
  font-size: 14px;
  color: #f7b500;
  font-weight: 500;
}

.house-address {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
  font-size: 14px;
}

/* 房源特点 */
.house-features {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}

.house-features .el-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  font-size: 14px;
}

/* 房源描述 */
.house-description {
  margin-bottom: 24px;
}

.house-description h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.house-description p {
  color: #606266;
  line-height: 1.8;
  margin: 0;
}

/* 设施服务 */
.house-amenities h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
}

.amenity-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 8px;
  color: #606266;
}

.amenity-item .el-icon {
  color: #409EFF;
}

/* 预订侧边栏 */
.booking-sidebar {
  position: sticky;
  top: 20px;
}

.booking-card {
  border-radius: 12px;
  margin-bottom: 20px;
}

.price-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.price {
  font-size: 28px;
  font-weight: 600;
  color: #f56c6c;
}

.per-night {
  font-size: 14px;
  color: #909399;
  margin-left: 4px;
}

.date-picker-section,
.guest-section {
  margin-bottom: 20px;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
}

.section-label .el-icon {
  color: #409EFF;
}

.full-width {
  width: 100%;
}

.capacity-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 价格明细 */
.price-detail {
  margin: 20px 0;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #606266;
}

.price-row.total {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #dcdfe6;
  font-weight: 600;
  color: #303133;
}

.total-price {
  color: #f56c6c;
  font-size: 20px;
}

/* 预订按钮 */
.book-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  margin-top: 8px;
}

.book-hint {
  margin-top: 12px;
  padding: 8px 12px;
  background-color: #fdf6ec;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.book-hint.warning {
  color: #e6a23c;
}

/* 房东卡片 */
.host-card {
  border-radius: 12px;
  margin-bottom: 20px;
}

.host-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.host-detail {
  flex: 1;
}

.host-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.host-stats {
  font-size: 12px;
  color: #909399;
  display: flex;
  gap: 8px;
}

/* 收藏按钮 */
.favorite-side-btn {
  width: 100%;
  height: 40px;
}

/* 评论区域 */
.comments-section {
  margin-top: 24px;
  border-radius: 12px;
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.comments-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.comment-item {
  padding: 16px 0;
  border-bottom: 1px solid #f0f2f5;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-user {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.comment-user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.username {
  font-weight: 500;
  color: #303133;
}

.comment-date {
  font-size: 12px;
  color: #909399;
}

.comment-content {
  color: #606266;
  line-height: 1.6;
  margin: 0 0 0 44px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .house-detail-container {
    padding: 12px;
  }
  
  .main-image {
    height: 250px;
  }
  
  .title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .house-title {
    font-size: 20px;
  }
  
  .booking-sidebar {
    position: static;
    margin-top: 20px;
  }
  
  .comment-user {
    flex-wrap: wrap;
  }
  
  .comment-date {
    margin-left: auto;
  }
  
  .comment-content {
    margin-left: 0;
  }
}
</style>