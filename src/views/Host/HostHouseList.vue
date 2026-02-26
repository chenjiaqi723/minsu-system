<template>
  <div class="host-houses-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>我的房源</h2>
        <p class="subtitle">管理你发布的所有房源信息</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="goCreate" :icon="Plus">
          新增房源
        </el-button>
      </div>
    </div>

    <!-- 统计卡片（快速了解房源概况） -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: #ecf5ff; color: #409EFF">
            <el-icon><HomeFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">总房源</div>
            <div class="stat-value">{{ total }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: #f0f9eb; color: #67C23A">
            <el-icon><SuccessFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">已上架</div>
            <div class="stat-value">{{ onlineCount }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: #fdf6ec; color: #E6A23C">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">待审核</div>
            <div class="stat-value">{{ pendingCount }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: #fef0f0; color: #F56C6C">
            <el-icon><WarningFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">已拒绝</div>
            <div class="stat-value">{{ rejectedCount }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索和筛选栏 -->
    <el-card class="filter-card" shadow="hover">
      <div class="filter-bar">
        <div class="filter-left">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索房源标题"
            :prefix-icon="Search"
            clearable
            class="search-input"
            @keyup.enter="handleSearch"
          />
          <el-select v-model="statusFilter" placeholder="状态筛选" clearable class="filter-select">
            <el-option label="待审核" :value="0" />
            <el-option label="已上架" :value="1" />
            <el-option label="已拒绝" :value="2" />
          </el-select>
        </div>
        <div class="filter-right">
          <el-button @click="resetFilter" :icon="Refresh">重置</el-button>
        </div>
      </div>
    </el-card>

    <!-- 房源列表 -->
    <div class="table-wrapper">
      <el-table
        :data="filteredList"
        style="width: 100%; border-radius: 8px; overflow: hidden;"
        border
        stripe
        :header-cell-style="{ background: '#f5f7fa', color: '#303133', fontWeight: '600' }"
        v-loading="loading"
        empty-text="暂无房源数据"
      >
        <!-- 房源基本信息 -->
        <el-table-column label="房源信息" min-width="250">
          <template #default="scope">
            <div class="house-info">
              <div class="house-title">{{ scope.row.title }}</div>
              <div class="house-meta">
                <span>ID: {{ scope.row.id }}</span>
                <span class="dot">·</span>
                <span>¥{{ formatMoney(scope.row.price) }}/晚</span>
              </div>
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

        <!-- 状态 -->
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)" effect="dark" size="large">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 取消政策 -->
        <el-table-column label="取消政策" min-width="180">
          <template #default="scope">
            <div class="policy-cell">
              <el-tag 
                :type="scope.row.allowCancel === 1 ? 'success' : 'info'" 
                size="small"
                effect="plain"
              >
                {{ scope.row.allowCancel === 1 ? '可取消' : '不可取消' }}
              </el-tag>
              <span v-if="scope.row.allowCancel === 1" class="policy-time">
                入住当日 {{ scope.row.cancelDeadlineHour }}:00 前
              </span>
            </div>
          </template>
        </el-table-column>

        <!-- 创建时间 -->
        <el-table-column label="创建时间" width="160">
          <template #default="scope">
            <div class="time-cell">
              <el-icon><Calendar /></el-icon>
              <span>{{ formatDate(scope.row.createTime) }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button 
                type="primary" 
                size="small" 
                :icon="Edit"
                @click="edit(scope.row.id)"
              >
                编辑
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                :icon="Delete"
                @click="remove(scope.row)"
              >
                删除
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

    <!-- 删除确认对话框 -->
    <el-dialog v-model="deleteDialog.visible" title="删除房源" width="400px" center>
      <div class="delete-content">
        <el-icon :size="50" color="#f56c6c"><WarningFilled /></el-icon>
        <h3>确定要删除这个房源吗？</h3>
        <p class="house-name">《{{ deleteDialog.houseTitle }}》</p>
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Search,
  Refresh,
  Edit,
  Delete,
  HomeFilled,
  SuccessFilled,
  WarningFilled,
  Clock,
  Location,
  Calendar
} from "@element-plus/icons-vue";
import request from "../../utils/request";
import { formatMoney } from "../../utils/format";

const router = useRouter();

// 数据
const list = ref([]);
const page = ref(1);
const size = ref(10);
const total = ref(0);
const loading = ref(false);

// 筛选条件
const searchKeyword = ref("");
const statusFilter = ref(null);

// 删除对话框
const deleteDialog = ref({
  visible: false,
  houseId: null,
  houseTitle: ""
});
const deleteLoading = ref(false);

// 计算属性 - 房源状态统计
const onlineCount = computed(() => {
  return list.value.filter(item => item.status === 1).length;
});

const pendingCount = computed(() => {
  return list.value.filter(item => item.status === 0).length;
});

const rejectedCount = computed(() => {
  return list.value.filter(item => item.status === 2).length;
});

// 筛选后的列表
const filteredList = computed(() => {
  let filtered = [...list.value];
  
  // 关键词筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    filtered = filtered.filter(item => 
      item.title?.toLowerCase().includes(keyword)
    );
  }
  
  // 状态筛选
  if (statusFilter.value !== null) {
    filtered = filtered.filter(item => item.status === statusFilter.value);
  }
  
  return filtered;
});

// 获取用户信息
const getUserInfo = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

// 加载数据
function load() {
  const user = getUserInfo();
  if (!user) {
    ElMessage.error("请先登录");
    return;
  }

  loading.value = true;
  request.get(`/house/listByHost/${user.userId}`, {
    params: {
      page: page.value,
      size: size.value
    }
  }).then(res => {
    list.value = res.data.records || [];
    total.value = res.data.total || 0;
  }).catch(error => {
    ElMessage.error("加载房源失败");
    console.error(error);
  }).finally(() => {
    loading.value = false;
  });
}

// 分页处理
function handleCurrentChange(newPage) {
  page.value = newPage;
  load();
}

function handleSizeChange(newSize) {
  size.value = newSize;
  page.value = 1;
  load();
}

// 搜索
function handleSearch() {
  page.value = 1;
  // 筛选已经在computed中实时进行，不需要重新加载数据
}

// 重置筛选
function resetFilter() {
  searchKeyword.value = "";
  statusFilter.value = null;
}

// 新增房源
function goCreate() {
  router.push("/host/house/edit");
}

// 编辑房源
function edit(id) {
  router.push(`/host/house/edit/${id}`);
}

// 删除房源
function remove(row) {
  deleteDialog.value = {
    visible: true,
    houseId: row.id,
    houseTitle: row.title
  };
}

// 确认删除
async function confirmDelete() {
  const user = getUserInfo();
  if (!user) return;

  deleteLoading.value = true;
  try {
    await request.delete(`/house/delete/${deleteDialog.value.houseId}`, {
      headers: {
        "X-User-Id": user.userId,
        "X-User-Role": user.role
      }
    });
    
    ElMessage.success("删除成功");
    deleteDialog.value.visible = false;
    load(); // 重新加载列表
  } catch (error) {
    ElMessage.error(error.response?.data || "删除失败");
  } finally {
    deleteLoading.value = false;
  }
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 状态相关函数
function getStatusType(status) {
  const map = {
    0: 'warning',
    1: 'success',
    2: 'danger'
  };
  return map[status] || 'info';
}

function getStatusText(status) {
  const map = {
    0: '待审核',
    1: '已上架',
    2: '已拒绝'
  };
  return map[status] || '未知';
}

onMounted(load);
</script>

<style scoped>
.host-houses-container {
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
.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  padding: 16px;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
}

.stat-icon .el-icon {
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
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
}

.dot {
  color: #dcdfe6;
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

/* 取消政策 */
.policy-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.policy-time {
  font-size: 12px;
  color: #909399;
}

/* 时间单元格 */
.time-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #606266;
  font-size: 13px;
}

.time-cell .el-icon {
  font-size: 14px;
  color: #909399;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 8px;
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
  font-size: 16px;
  font-weight: 500;
  color: #409EFF;
  margin: 8px 0;
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
  .host-houses-container {
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

  .stats-row {
    margin-bottom: 12px;
  }

  .stat-card {
    margin-bottom: 12px;
  }

  .filter-left {
    width: 100%;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }

  .filter-bar {
    flex-direction: column;
  }

  .filter-right {
    width: 100%;
  }

  .filter-right .el-button {
    width: 100%;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons .el-button {
    width: 100%;
  }
}
</style>