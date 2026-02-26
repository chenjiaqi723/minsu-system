<!-- src/views/User/HouseComments.vue -->
<template>
  <div class="house-comments-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <el-button link @click="goBack">
          <el-icon><ArrowLeft /></el-icon> 返回房源详情
        </el-button>
        <h2>房源评价</h2>
      </div>
      <div class="house-info" v-if="house">
        <span class="house-name">{{ house.title }}</span>
        <el-rate v-model="house.score" disabled size="small" />
        <span class="total-score">{{ house.score?.toFixed(1) || '0.0' }}分</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="3" animated :count="3" />
    </div>

    <!-- 空状态 -->
    <el-empty
      v-else-if="comments.length === 0"
      description="暂无评价"
      :image-size="200"
    />

    <!-- 评价列表 -->
    <div v-else class="comments-list">
      <el-card
        v-for="comment in comments"
        :key="comment.id"
        class="comment-card"
        shadow="hover"
      >
        <div class="comment-header">
          <div class="user-info">
            <el-avatar :size="40">
              {{ comment.username?.charAt(0) || '用' }}
            </el-avatar>
            <div class="user-detail">
              <span class="username">{{ comment.username || '匿名用户' }}</span>
              <span class="comment-time">{{ formatDateTime(comment.createTime) }}</span>
            </div>
          </div>
          <div class="rating">
            <el-rate v-model="comment.score" disabled size="small" />
            <span class="rating-score">{{ comment.score }}分</span>
          </div>
        </div>

        <div class="comment-content">
          <p>{{ comment.content }}</p>
        </div>

        <!-- 房东回复 -->
        <div v-if="comment.reply" class="host-reply">
          <div class="reply-header">
            <el-icon><ChatDotRound /></el-icon>
            <span>房东回复：</span>
          </div>
          <p class="reply-content">{{ comment.reply }}</p>
        </div>

        <!-- 评价图片 -->
        <div v-if="comment.images && comment.images.length > 0" class="comment-images">
          <el-image
            v-for="(img, index) in comment.images.slice(0, 3)"
            :key="index"
            :src="img"
            :preview-src-list="comment.images"
            fit="cover"
            class="comment-image"
          />
          <span v-if="comment.images.length > 3" class="more-images">
            +{{ comment.images.length - 3 }}
          </span>
        </div>
      </el-card>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="total"
          v-model:current-page="page"
          v-model:page-size="size"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  ArrowLeft,
  ChatDotRound
} from "@element-plus/icons-vue";
import request from "../../utils/request";

const route = useRoute();
const router = useRouter();

// 状态
const house = ref(null);
const comments = ref([]);
const loading = ref(false);
const page = ref(1);
const size = ref(10);
const total = ref(0);

// 获取房源ID
const houseId = route.params.id;

// 加载房源信息
async function loadHouseInfo() {
  try {
    const res = await request.get(`/house/detail/${houseId}`);
    house.value = res.data;
  } catch (error) {
    console.error("加载房源信息失败:", error);
  }
}

// 加载评价列表
async function loadComments() {
  loading.value = true;
  try {
    const res = await request.get(`/comment/house/${houseId}`, {
      params: {
        page: page.value,
        size: size.value
      }
    });
    comments.value = res.data.records || [];
    total.value = res.data.total || 0;
  } catch (error) {
    ElMessage.error("加载评价失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 分页处理
function handlePageChange(newPage) {
  page.value = newPage;
  loadComments();
}

// 返回房源详情
function goBack() {
  router.push(`/user/house/${houseId}`);
}

// 格式化日期时间
function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

onMounted(() => {
  loadHouseInfo();
  loadComments();
});
</script>

<style scoped>
.house-comments-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

/* 页面头部 */
.page-header {
  margin-bottom: 24px;
  padding: 16px 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.header-left h2 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.house-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0 0;
  border-top: 1px solid #ebeef5;
}

.house-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.total-score {
  font-size: 14px;
  color: #f7b500;
  font-weight: 500;
}

/* 加载状态 */
.loading-state {
  padding: 40px 0;
}

/* 评价卡片 */
.comment-card {
  margin-bottom: 16px;
  border-radius: 8px;
  transition: all 0.3s;
}

.comment-card:hover {
  transform: translateY(-2px);
}

/* 评价头部 */
.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f2f5;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.username {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.rating {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rating-score {
  font-size: 14px;
  color: #f7b500;
  font-weight: 500;
}

/* 评价内容 */
.comment-content {
  margin-bottom: 16px;
}

.comment-content p {
  color: #606266;
  line-height: 1.8;
  margin: 0;
  white-space: pre-wrap;
}

/* 房东回复 */
.host-reply {
  margin-top: 16px;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  color: #409EFF;
  font-size: 13px;
  font-weight: 500;
}

.reply-content {
  color: #606266;
  line-height: 1.6;
  margin: 0;
  font-size: 14px;
}

/* 评价图片 */
.comment-images {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.comment-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  cursor: pointer;
  object-fit: cover;
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

/* 分页 */
.pagination-container {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}

/* 响应式 */
@media (max-width: 768px) {
  .house-comments-container {
    padding: 12px;
  }
  
  .comment-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .rating {
    align-self: flex-start;
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