<template>
  <div class="admin-stats-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h2>数据统计中心</h2>
        <p class="subtitle">全面了解平台运营状况，数据驱动决策</p>
      </div>
      <div class="header-right">
        <el-button @click="refreshData" :icon="Refresh" :loading="refreshing">
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 概览卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stats-card" shadow="hover" :body-style="{ padding: '20px' }">
          <div class="stats-icon" style="background: #ecf5ff; color: #409EFF">
            <el-icon><House /></el-icon>
          </div>
          <div class="stats-content">
            <div class="stats-label">总房源</div>
            <div class="stats-value">{{ stats.totalHouses || 0 }}</div>
            <div class="stats-trend">
              <span>待审核: {{ stats.pendingHouses || 0 }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stats-card" shadow="hover" :body-style="{ padding: '20px' }">
          <div class="stats-icon" style="background: #f0f9eb; color: #67C23A">
            <el-icon><User /></el-icon>
          </div>
          <div class="stats-content">
            <div class="stats-label">总用户</div>
            <div class="stats-value">{{ stats.totalUsers || 0 }}</div>
            <div class="stats-trend">
              <span>房东: {{ stats.hostCount || 0 }} | 客户: {{ stats.userCount || 0 }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stats-card" shadow="hover" :body-style="{ padding: '20px' }">
          <div class="stats-icon" style="background: #fdf6ec; color: #E6A23C">
            <el-icon><Calendar /></el-icon>
          </div>
          <div class="stats-content">
            <div class="stats-label">总预约</div>
            <div class="stats-value">{{ stats.totalAppointments || 0 }}</div>
            <div class="stats-trend">
              <span>待处理: {{ stats.pendingAppointments || 0 }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stats-card" shadow="hover" :body-style="{ padding: '20px' }">
          <div class="stats-icon" style="background: #fef0f0; color: #F56C6C">
            <el-icon><ChatDotRound /></el-icon>
          </div>
          <div class="stats-content">
            <div class="stats-label">总评论</div>
            <div class="stats-value">{{ stats.totalComments || 0 }}</div>
            <div class="stats-trend">
              <span>平均评分: {{ stats.avgRating?.toFixed(1) || 0 }}分</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 - 两列布局 -->
    <el-row :gutter="20" class="chart-row">
      <!-- 房源状态分布 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="header-title">
                <el-icon><House /></el-icon>
                房源状态分布
              </span>
              <el-tag size="small" type="info">总房源: {{ stats.totalHouses || 0 }}</el-tag>
            </div>
          </template>
          <div id="houseChart" class="chart-box" style="height: 350px;"></div>
          <div class="chart-legend">
            <div class="legend-item">
              <span class="legend-color" style="background: #E6A23C"></span>
              <span class="legend-label">待审核</span>
              <span class="legend-value">{{ stats.pendingHouses || 0 }}</span>
              <span class="legend-percent">{{ getHousePercent('pending') }}%</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #67C23A"></span>
              <span class="legend-label">已上架</span>
              <span class="legend-value">{{ stats.onlineHouses || 0 }}</span>
              <span class="legend-percent">{{ getHousePercent('online') }}%</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #F56C6C"></span>
              <span class="legend-label">已拒绝</span>
              <span class="legend-value">{{ stats.rejectedHouses || 0 }}</span>
              <span class="legend-percent">{{ getHousePercent('rejected') }}%</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 预约状态分布 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="header-title">
                <el-icon><Calendar /></el-icon>
                预约状态分布
              </span>
              <el-tag size="small" type="info">总预约: {{ stats.totalAppointments || 0 }}</el-tag>
            </div>
          </template>
          <div id="appointmentChart" class="chart-box" style="height: 350px;"></div>
          <div class="chart-legend">
            <div class="legend-item">
              <span class="legend-color" style="background: #E6A23C"></span>
              <span class="legend-label">待处理</span>
              <span class="legend-value">{{ stats.pendingAppointments || 0 }}</span>
              <span class="legend-percent">{{ getAppointmentPercent('pending') }}%</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #67C23A"></span>
              <span class="legend-label">已确认</span>
              <span class="legend-value">{{ stats.confirmedAppointments || 0 }}</span>
              <span class="legend-percent">{{ getAppointmentPercent('confirmed') }}%</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #409EFF"></span>
              <span class="legend-label">已完成</span>
              <span class="legend-value">{{ stats.completedAppointments || 0 }}</span>
              <span class="legend-percent">{{ getAppointmentPercent('completed') }}%</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #909399"></span>
              <span class="legend-label">已取消</span>
              <span class="legend-value">{{ stats.cancelledAppointments || 0 }}</span>
              <span class="legend-percent">{{ getAppointmentPercent('cancelled') }}%</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 用户统计和评论统计 -->
    <el-row :gutter="20" class="chart-row">
      <!-- 用户角色分布 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="header-title">
                <el-icon><UserFilled /></el-icon>
                用户角色分布
              </span>
              <el-tag size="small" type="info">总用户: {{ stats.totalUsers || 0 }}</el-tag>
            </div>
          </template>
          <div id="userChart" class="chart-box" style="height: 300px;"></div>
          <div class="chart-legend">
            <div class="legend-item">
              <span class="legend-color" style="background: #409EFF"></span>
              <span class="legend-label">管理员</span>
              <span class="legend-value">{{ stats.adminCount || 0 }}</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #67C23A"></span>
              <span class="legend-label">房东</span>
              <span class="legend-value">{{ stats.hostCount || 0 }}</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #E6A23C"></span>
              <span class="legend-label">客户</span>
              <span class="legend-value">{{ stats.userCount || 0 }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 评分分布 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="header-title">
                <el-icon><StarFilled /></el-icon>
                评分分布
              </span>
              <el-tag size="small" type="info">平均: {{ stats.avgRating?.toFixed(1) || 0 }}分</el-tag>
            </div>
          </template>
          <div id="ratingChart" class="chart-box" style="height: 300px;"></div>
          <div class="rating-distribution">
            <div v-for="star in 5" :key="star" class="rating-row">
              <span class="star-label">{{ star }}星</span>
              <el-progress 
                :percentage="getRatingPercentage(star)" 
                :color="getRatingColor(star)"
                :show-text="false"
                :stroke-width="10"
              />
              <span class="star-count">{{ getRatingCount(star) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import * as echarts from "echarts";
import { onMounted, ref, nextTick, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import {
  House,
  User,
  Calendar,
  ChatDotRound,
  Refresh,
  UserFilled,
  StarFilled
} from "@element-plus/icons-vue";
import request from "../../utils/request";

// 图表实例
let houseChart = null;
let appointmentChart = null;
let userChart = null;
let ratingChart = null;

const stats = ref({});
const refreshing = ref(false);

// 获取用户信息
const getUserInfo = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

// 加载统计数据
async function loadStats() {
  const user = getUserInfo();
  if (!user) {
    ElMessage.error("请先登录");
    return;
  }

  try {
    const res = await request.get("/admin/stats", {
      headers: { "X-User-Role": user.role },
    });
    stats.value = res.data;
    
    // 等待DOM更新后初始化图表
    await nextTick();
    initCharts();
  } catch (error) {
    ElMessage.error("加载统计数据失败");
    console.error(error);
  }
}

// 刷新数据
async function refreshData() {
  refreshing.value = true;
  await loadStats();
  refreshing.value = false;
  ElMessage.success("数据已刷新");
}

// 初始化所有图表
function initCharts() {
  drawHouseChart();
  drawAppointmentChart();
  drawUserChart();
  drawRatingChart();
}

// 饼图：房源状态分布
function drawHouseChart() {
  const chartDom = document.getElementById("houseChart");
  if (!chartDom) return;
  
  if (!houseChart) {
    houseChart = echarts.init(chartDom);
  }
  houseChart.clear();

  const option = {
    tooltip: { 
      trigger: "item",
      formatter: '{b}: {c} ({d}%)'
    },
    legend: { show: false },
    series: [
      {
        name: "房源状态",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{d}%'
        },
        emphasis: {
          scale: true,
          label: { show: true }
        },
        data: [
          { value: stats.value.pendingHouses || 0, name: "待审核", itemStyle: { color: '#E6A23C' } },
          { value: stats.value.onlineHouses || 0, name: "已上架", itemStyle: { color: '#67C23A' } },
          { value: stats.value.rejectedHouses || 0, name: "已拒绝", itemStyle: { color: '#F56C6C' } },
        ],
      },
    ],
  };
  houseChart.setOption(option);
}

// 饼图：预约状态分布
function drawAppointmentChart() {
  const chartDom = document.getElementById("appointmentChart");
  if (!chartDom) return;
  
  if (!appointmentChart) {
    appointmentChart = echarts.init(chartDom);
  }
  appointmentChart.clear();

  const option = {
    tooltip: { 
      trigger: "item",
      formatter: '{b}: {c} ({d}%)'
    },
    legend: { show: false },
    series: [
      {
        name: "预约状态",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{d}%'
        },
        emphasis: {
          scale: true,
          label: { show: true }
        },
        data: [
          { value: stats.value.pendingAppointments || 0, name: "待处理", itemStyle: { color: '#E6A23C' } },
          { value: stats.value.confirmedAppointments || 0, name: "已确认", itemStyle: { color: '#67C23A' } },
          { value: stats.value.completedAppointments || 0, name: "已完成", itemStyle: { color: '#409EFF' } },
          { value: stats.value.cancelledAppointments || 0, name: "已取消", itemStyle: { color: '#909399' } },
        ],
      },
    ],
  };
  appointmentChart.setOption(option);
}

// 饼图：用户角色分布
function drawUserChart() {
  const chartDom = document.getElementById("userChart");
  if (!chartDom) return;
  
  if (!userChart) {
    userChart = echarts.init(chartDom);
  }
  userChart.clear();

  const option = {
    tooltip: { 
      trigger: "item",
      formatter: '{b}: {c} ({d}%)'
    },
    legend: { show: false },
    series: [
      {
        name: "用户角色",
        type: "pie",
        radius: ["40%", "70%"],
        data: [
          { value: stats.value.adminCount || 0, name: "管理员", itemStyle: { color: '#409EFF' } },
          { value: stats.value.hostCount || 0, name: "房东", itemStyle: { color: '#67C23A' } },
          { value: stats.value.userCount || 0, name: "客户", itemStyle: { color: '#E6A23C' } },
        ],
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{d}%'
        },
      },
    ],
  };
  userChart.setOption(option);
}

// 柱状图：评分分布
function drawRatingChart() {
  const chartDom = document.getElementById("ratingChart");
  if (!chartDom) return;
  
  if (!ratingChart) {
    ratingChart = echarts.init(chartDom);
  }
  ratingChart.clear();

  const ratings = stats.value.ratingDistribution || [0, 0, 0, 0, 0];
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['1星', '2星', '3星', '4星', '5星'],
      axisLabel: {
        color: '#606266'
      }
    },
    yAxis: {
      type: 'value',
      name: '评论数'
    },
    series: [
      {
        name: '评论数',
        type: 'bar',
        data: ratings,
        itemStyle: {
          color: function(params) {
            const colors = ['#F56C6C', '#E6A23C', '#909399', '#409EFF', '#67C23A'];
            return colors[params.dataIndex];
          },
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: 30
      }
    ]
  };
  ratingChart.setOption(option);
}

// 计算房源百分比
function getHousePercent(type) {
  const total = stats.value.totalHouses || 0;
  if (total === 0) return 0;
  
  let value = 0;
  if (type === 'pending') value = stats.value.pendingHouses || 0;
  else if (type === 'online') value = stats.value.onlineHouses || 0;
  else if (type === 'rejected') value = stats.value.rejectedHouses || 0;
  
  return ((value / total) * 100).toFixed(1);
}

// 计算预约百分比
function getAppointmentPercent(type) {
  const total = stats.value.totalAppointments || 0;
  if (total === 0) return 0;
  
  let value = 0;
  if (type === 'pending') value = stats.value.pendingAppointments || 0;
  else if (type === 'confirmed') value = stats.value.confirmedAppointments || 0;
  else if (type === 'completed') value = stats.value.completedAppointments || 0;
  else if (type === 'cancelled') value = stats.value.cancelledAppointments || 0;
  
  return ((value / total) * 100).toFixed(1);
}

// 评分相关函数
function getRatingPercentage(star) {
  const ratings = stats.value.ratingDistribution || [0, 0, 0, 0, 0];
  const total = ratings.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  return ((ratings[star - 1] || 0) / total * 100).toFixed(1);
}

function getRatingCount(star) {
  const ratings = stats.value.ratingDistribution || [0, 0, 0, 0, 0];
  return ratings[star - 1] || 0;
}

function getRatingColor(star) {
  const colors = {
    1: '#F56C6C',
    2: '#E6A23C',
    3: '#909399',
    4: '#409EFF',
    5: '#67C23A'
  };
  return colors[star];
}

// 处理窗口大小变化
function handleResize() {
  [houseChart, appointmentChart, userChart, ratingChart].forEach(chart => {
    if (chart && !chart.isDisposed()) {
      chart.resize();
    }
  });
}

onMounted(() => {
  loadStats();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  [houseChart, appointmentChart, userChart, ratingChart].forEach(chart => {
    if (chart && !chart.isDisposed()) {
      chart.dispose();
    }
  });
});
</script>

<style scoped>
.admin-stats-container {
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

.stats-card {
  border-radius: 12px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stats-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
}

.stats-icon .el-icon {
  font-size: 24px;
}

.stats-content {
  flex: 1;
  min-width: 0;
}

.stats-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.stats-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stats-trend {
  font-size: 12px;
  color: #606266;
}

/* 图表卡片 */
.chart-row {
  margin-bottom: 24px;
}

.chart-card {
  border-radius: 12px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  padding: 8px 0;
}

.chart-box {
  width: 100%;
  min-height: 300px;
}

/* 图表图例 */
.chart-legend {
  margin-top: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  flex: 1;
  min-width: 120px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.legend-label {
  color: #606266;
  flex: 1;
}

.legend-value {
  font-weight: 600;
  color: #303133;
  margin-right: 4px;
}

.legend-percent {
  color: #909399;
}

/* 评分分布 */
.rating-distribution {
  margin-top: 20px;
  padding: 0 12px 12px;
}

.rating-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.star-label {
  width: 40px;
  font-size: 13px;
  color: #606266;
  flex-shrink: 0;
}

.rating-distribution .el-progress {
  flex: 1;
}

.star-count {
  width: 40px;
  font-size: 13px;
  color: #909399;
  text-align: right;
  flex-shrink: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .admin-stats-container {
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

  .stats-card {
    margin-bottom: 12px;
  }

  .chart-legend {
    flex-direction: column;
    gap: 8px;
  }

  .legend-item {
    min-width: 100%;
  }
}
</style>