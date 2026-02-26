<template>
  <div class="host-dashboard-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h2>运营数据中心</h2>
        <p class="subtitle">全面掌握房源运营状况，数据驱动决策</p>
      </div>
      <div class="header-right">
        <el-radio-group v-model="dateRange" size="large" @change="handleDateRangeChange">
          <el-radio-button label="today">今日</el-radio-button>
          <el-radio-button label="week">本周</el-radio-button>
          <el-radio-button label="month">本月</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 实时运营概览卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6" v-for="stat in realtimeStats" :key="stat.label">
        <el-card class="stats-card" shadow="hover" :body-style="{ padding: '20px' }">
          <div class="stats-icon" :style="{ background: stat.bgColor, color: stat.iconColor }">
            <el-icon><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stats-content">
            <div class="stats-label">{{ stat.label }}</div>
            <div class="stats-value">{{ stat.value }}</div>
            <div class="stats-trend" :class="stat.trendClass">
              <span>{{ stat.trendText }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 核心指标卡片 -->
    <el-card class="section-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>核心运营指标</span>
          <el-date-picker
            v-model="selectedMonth"
            type="month"
            placeholder="选择月份"
            format="YYYY年MM月"
            value-format="YYYY-MM"
            @change="handleMonthChange"
            size="small"
          />
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :xs="12" :sm="12" :md="6" v-for="(item, index) in coreMetrics" :key="index">
          <div class="metric-item">
            <div class="metric-label">{{ item.label }}</div>
            <div class="metric-value">{{ item.value }}</div>
            <div class="metric-compare" :class="{ up: item.trend > 0, down: item.trend < 0 }">
              {{ item.compare }} 环比
              <span v-if="item.trend > 0">↑</span>
              <span v-else>↓</span>
              {{ Math.abs(item.trend) }}%
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <!-- 订单趋势图 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>📊 订单趋势分析</span>
              <div class="header-actions">
                <el-radio-group v-model="orderChartType" size="small" @change="refreshOrderChart">
                  <el-radio-button label="bar">柱状图</el-radio-button>
                  <el-radio-button label="line">折线图</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </template>
          <div id="orderChart" class="chart-box" style="height: 350px;"></div>
        </el-card>
      </el-col>

      <!-- 收入趋势图 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>💰 收入趋势分析</span>
              <div class="header-actions">
                <el-select v-model="incomeChartPeriod" size="small" @change="refreshIncomeChart">
                  <el-option label="近7天" value="week" />
                  <el-option label="近30天" value="month" />
                </el-select>
              </div>
            </div>
          </template>
          <div id="incomeChart" class="chart-box" style="height: 350px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <!-- 房源状态分布 -->
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>🏠 房源状态分布</span>
            </div>
          </template>
          <div id="houseChart" class="chart-box" style="height: 300px;"></div>
          <div class="chart-legend" v-if="houseStatus.length > 0">
            <div v-for="item in houseStatus" :key="item.name" class="legend-item">
              <span class="legend-color" :style="{ background: getStatusColor(item.name) }"></span>
              <span class="legend-label">{{ item.name }}</span>
              <span class="legend-value">{{ item.value }}套</span>
              <span class="legend-percent">({{ getStatusPercent(item.value) }}%)</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 评论分析 -->
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>⭐ 评论分析</span>
              <el-button link type="primary" @click="viewAllComments">查看详情</el-button>
            </div>
          </template>
          <div class="comment-analysis">
            <div class="comment-stats">
              <div class="comment-stat-item">
                <div class="stat-circle" :style="{ background: 'linear-gradient(135deg, #409EFF, #66b1ff)' }">
                  <span class="stat-number">{{ commentStats.total }}</span>
                </div>
                <span class="stat-label">总评论数</span>
              </div>
              <div class="comment-stat-item">
                <div class="stat-circle" :style="{ background: 'linear-gradient(135deg, #67C23A, #85ce61)' }">
                  <span class="stat-number">{{ commentStats.totalAvgRating }}</span>
                </div>
                <span class="stat-label">平均评分</span>
              </div>
            </div>

            <!-- 评分分布 -->
            <div class="rating-distribution" v-if="commentStats.total > 0">
              <div v-for="star in 5" :key="star" class="rating-row">
                <span class="star-label">{{ star }}星</span>
                <el-progress 
                  :percentage="getRatingPercentage(star)" 
                  :color="getRatingColor(star)"
                  :show-text="false"
                  :stroke-width="8"
                />
                <span class="star-count">{{ getRatingCount(star) }}</span>
              </div>
            </div>
            <div v-else class="empty-data">暂无评分数据</div>

            <!-- 最近评论预览 -->
            <div class="recent-comments" v-if="recentComments.length > 0">
              <div class="recent-title">最新评论</div>
              <div v-for="comment in recentComments.slice(0, 3)" :key="comment.id" class="comment-item">
                <div class="comment-header">
                  <el-rate v-model="comment.rating" disabled size="small" />
                  <span class="comment-time">{{ formatDate(comment.createTime) }}</span>
                </div>
                <div class="comment-content">{{ comment.content }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 热门房源排行 -->
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>🔥 热门房源排行</span>
              <el-radio-group v-model="hotRankType" size="small">
                <el-radio-button label="orders">订单量</el-radio-button>
                <el-radio-button label="income">收入</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="rank-list">
            <div 
              v-for="(house, index) in sortedHotHouses" 
              :key="house.id" 
              class="rank-item"
              @click="goToHouseDetail(house.id)"
            >
              <div class="rank-index" :class="{ 'top-three': index < 3 }">#{{ index + 1 }}</div>
              <div class="rank-info">
                <div class="rank-title">{{ house.title }}</div>
                <div class="rank-meta">
                  <span>订单: {{ house.orderCount }}</span>
                  <span>收入: ¥{{ formatMoney(house.income) }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, computed, nextTick, watch } from "vue"
import { useRouter } from "vue-router"
import * as echarts from "echarts"
import { ElMessage } from "element-plus"
import {
  ShoppingCart,
  Money,
  User,
  Warning
} from "@element-plus/icons-vue"
import request from "../../utils/request"
import { formatMoney } from "../../utils/format"

const router = useRouter()

// ==================== 状态定义 ====================
const selectedMonth = ref("")
const dateRange = ref("today")

// 统计数据
const todayCount = ref(0)
const todayIncome = ref(0)
const monthCount = ref(0)
const income = ref(0)
const occupancyRate = ref(0)
const occupancyGrowthRate = ref(0)
const orderGrowthRate = ref(0)
const incomeGrowthRate = ref(0)
const houseStatus = ref([])
const totalHouses = ref(0)

// 评论数据
const commentStats = ref({
  total: 0,
  avgRating: "0.0",
  ratingGrowthRate: "0.0",
  distribution: {}
})
const recentComments = ref([])

// 热门房源
const hotHouses = ref([])

// 图表实例
let orderChart = null
let incomeChart = null
let houseChart = null

// 图表类型
const orderChartType = ref("bar")
const incomeChartPeriod = ref("month")
const hotRankType = ref("orders")

// 加载状态
const loading = ref({
  stats: false,
  comments: false,
  houses: false
})

// ==================== 计算属性 ====================

// 实时统计数据（用于循环渲染）
const realtimeStats = computed(() => [
  {
    label: "今日订单",
    value: todayCount.value,
    icon: ShoppingCart,
    bgColor: "#ecf5ff",
    iconColor: "#409EFF",
    trendClass: todayCount.value > 0 ? "up" : "",
    trendText: todayCount.value > 0 ? `今日 ${todayCount.value} 单` : "暂无订单"
  },
  {
    label: "今日收入",
    value: `¥${formatMoney(todayIncome.value)}`,
    icon: Money,
    bgColor: "#f0f9eb",
    iconColor: "#67C23A",
    trendClass: todayIncome.value > 0 ? "up" : "",
    trendText: todayIncome.value > 0 ? `今日收入 ${formatMoney(todayIncome.value)}` : "暂无收入"
  },
  {
    label: "本月订单",
    value: monthCount.value,
    icon: User,
    bgColor: "#fdf6ec",
    iconColor: "#E6A23C",
    trendClass: monthCount.value > 0 ? "up" : "",
    trendText: `累计 ${monthCount.value} 单`
  },
  {
    label: "本月收入",
    value: `¥${formatMoney(income.value)}`,
    icon: Warning,
    bgColor: "#fef0f0",
    iconColor: "#F56C6C",
    trendClass: income.value > 0 ? "up" : "",
    trendText: `累计收入 ${formatMoney(income.value)}`
  }
])

// 核心指标
const coreMetrics = computed(() => [
  {
    label: "本月订单",
    value: monthCount.value,
    compare: "上月",
    trend: Number((orderGrowthRate.value * 100).toFixed(1))
  },
  {
    label: "本月收入",
    value: `¥${formatMoney(income.value)}`,
    compare: "上月",
    trend: Number((incomeGrowthRate.value * 100).toFixed(1))
  },
  {
    label: "入住率",
    value: `${(occupancyRate.value * 100).toFixed(1)}%`,
    compare: "上月",
    trend: Number((occupancyGrowthRate.value * 100).toFixed(1))
  },
  {
    label: "平均评分",
    value: commentStats.value.avgRating,
    compare: "上月",
    trend: Number((commentStats.value.ratingGrowthRate * 100).toFixed(1))
  }
])

// 排序后的热门房源
const sortedHotHouses = computed(() => {
  const sorted = [...hotHouses.value]
  if (hotRankType.value === 'orders') {
    sorted.sort((a, b) => b.orderCount - a.orderCount)
  } else {
    sorted.sort((a, b) => b.income - a.income)
  }
  return sorted
})

// ==================== 数据加载 ====================

// 获取用户信息
const getUserInfo = () => {
  try {
    const userStr = localStorage.getItem("user")
    return userStr ? JSON.parse(userStr) : null
  } catch {
    return null
  }
}

// 加载主数据
const loadData = async () => {
  const user = getUserInfo()
  if (!user) {
    ElMessage.error("请先登录")
    return
  }

  loading.value.stats = true
  try {
    const res = await request.get("/host/statistics", {
      headers: {
        "X-User-Id": user.userId
      },
      params: {
        month: selectedMonth.value
      }
    })

    // 更新统计数据
    todayCount.value = res.data.todayCount || 0
    todayIncome.value = res.data.todayIncome || 0
    monthCount.value = res.data.monthCount || 0
    income.value = res.data.income || 0
    occupancyRate.value = Number(res.data.occupancyRate) || 0
    orderGrowthRate.value = res.data.orderGrowthRate || 0
    incomeGrowthRate.value = res.data.incomeGrowthRate || 0
    houseStatus.value = res.data.houseStatus || []

    // 计算总房源数
    totalHouses.value = houseStatus.value.reduce((sum, item) => sum + item.value, 0)

    // 初始化图表
    await nextTick()
    initOrderChart(res.data.monthOrders || { month: [], count: [] })
    initHouseChart(houseStatus.value)
    
  } catch (error) {
    console.error("加载数据失败:", error)
    ElMessage.error("加载运营数据失败")
  } finally {
    loading.value.stats = false
  }
}

// 加载评论统计
const loadCommentStats = async () => {
  const user = getUserInfo()
  if (!user) return

  loading.value.comments = true
  try {
    const res = await request.get("/comment/host/stats", {
      headers: {
        "X-User-Id": user.userId,
        "X-User-Role": user.role
      },
      params: {
        month: selectedMonth.value
      }
    })

    console.log("评论接口返回", res.data)

    commentStats.value = {
      total: res.data.total || 0,
      totalAvgRating: (res.data.totalAvgRating || 0).toFixed(1),
      avgRating: (res.data.avgRating || 0).toFixed(1),
      totalRatingGrowthRate: res.data.totalRatingGrowthRate || 0,
      ratingGrowthRate: res.data.ratingGrowthRate || 0,
      totalRatingDistribution: res.data.totalRatingDistribution || {},
      distribution: res.data.distribution || {}
    }
    recentComments.value = res.data.recent || []
  } catch (err) {
    console.error("获取评论统计失败:", err)
    commentStats.value = {
      total: 0,
      avgRating: "0.0",
      ratingGrowthRate: 0,
      distribution: {}
    }
    recentComments.value = []
  } finally {
    loading.value.comments = false
  }
}

// 加载热门房源
const loadHotHouses = async () => {
  const user = getUserInfo()
  if (!user) return

  loading.value.houses = true
  try {
    const res = await request.get("/house/host/hotHouses", {
      headers: {
        "X-User-Id": user.userId,
        "X-User-Role": user.role
      }
    })
    hotHouses.value = res.data.list || []
  } catch (error) {
    console.error("加载热门房源失败:", error)
    hotHouses.value = []
  } finally {
    loading.value.houses = false
  }
}

// ==================== 图表函数 ====================

// 订单图表
const initOrderChart = (data) => {
  const dom = document.getElementById("orderChart")
  if (!dom) return

  if (!orderChart) {
    orderChart = echarts.init(dom)
  }
  
  // 处理空数据
  const months = data.month?.length ? data.month : ['暂无数据']
  const counts = data.count?.length ? data.count : [0]

  const option = {
    tooltip: { 
      trigger: 'axis',
      formatter: '{b}<br/>订单数: {c}'
    },
    grid: { 
      left: '3%', 
      right: '4%', 
      bottom: '3%', 
      containLabel: true 
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: { rotate: months.length > 6 ? 30 : 0 }
    },
    yAxis: {
      type: 'value',
      name: '订单量',
      min: 0
    },
    series: [{
      name: '订单数',
      type: orderChartType.value,
      data: counts,
      itemStyle: { 
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#409EFF' },
          { offset: 1, color: '#66b1ff' }
        ])
      },
      lineStyle: { color: '#409EFF', width: 3 },
      smooth: true,
      symbol: 'circle'
    }]
  }
  orderChart.setOption(option)
}

// 收入图表
const initIncomeChart = async () => {
  const dom = document.getElementById("incomeChart")
  if (!dom) return

  if (!incomeChart) {
    incomeChart = echarts.init(dom)
  }

  try {
    const user = getUserInfo()
    if (!user) return

    const res = await request.get("/house/host/incomeTrend", {
      params: { period: incomeChartPeriod.value },
      headers: {
        "X-User-Id": user.userId,
        "X-User-Role": user.role
      }
    })

    const dates = res.data.dates || []
    const values = res.data.values || []

    const option = {
      tooltip: { 
        trigger: 'axis', 
        formatter: '{b}<br/>收入: ¥{c}' 
      },
      grid: { 
        left: '3%', 
        right: '4%', 
        bottom: '3%', 
        containLabel: true 
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: { rotate: dates.length > 7 ? 30 : 0 }
      },
      yAxis: { 
        type: 'value', 
        name: '收入(元)',
        min: 0
      },
      series: [{
        name: '收入',
        type: 'line',
        data: values,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0)' }
          ])
        },
        lineStyle: { color: '#67C23A', width: 3 },
        smooth: true,
        symbol: 'circle'
      }]
    }
    incomeChart.setOption(option)
  } catch (error) {
    console.error("加载收入趋势失败:", error)
    // 显示空图表
    incomeChart.setOption({
      xAxis: { data: [] },
      yAxis: { type: 'value' },
      series: [{ type: 'line', data: [] }]
    })
  }
}

// 房源状态图表
const initHouseChart = (data) => {
  const dom = document.getElementById("houseChart")
  if (!dom) return

  if (!houseChart) {
    houseChart = echarts.init(dom)
  }

  if (!data || data.length === 0) {
    houseChart.setOption({
      title: { text: '暂无房源数据', left: 'center', top: 'center' }
    })
    return
  }

  const option = {
    tooltip: { 
      trigger: 'item', 
      formatter: '{b}: {c}套 ({d}%)' 
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: data.map(item => ({ name: item.name, value: item.value })),
      label: { 
        show: true, 
        position: 'outside', 
        formatter: '{b}\n{d}%' 
      },
      emphasis: {
        scale: true,
        label: { show: true }
      }
    }]
  }
  houseChart.setOption(option)
}

// ==================== 辅助函数 ====================

const getStatusPercent = (value) => {
  if (totalHouses.value === 0) return 0
  return ((value / totalHouses.value) * 100).toFixed(1)
}

const getStatusColor = (status) => {
  const colors = {
    '已上架': '#67C23A',
    '待审核': '#E6A23C',
    '已下架': '#909399'
  }
  return colors[status] || '#409EFF'
}

const getRatingPercentage = (star) => {
  if (!commentStats.value.totalRatingDistribution || commentStats.value.total === 0) return 0
  const count = commentStats.value.totalRatingDistribution[star] || 0
  return Number(((count / commentStats.value.total) * 100).toFixed(1))
}

const getRatingCount = (star) => {
  return commentStats.value.totalRatingDistribution[star] || 0
}

const getRatingColor = (star) => {
  const colors = { 
    5: '#67C23A', 
    4: '#409EFF', 
    3: '#E6A23C', 
    2: '#F56C6C', 
    1: '#909399' 
  }
  return colors[star] || '#909399'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// ==================== 事件处理 ====================

const handleMonthChange = () => {
  loadData()
  loadCommentStats()
}

const handleDateRangeChange = () => {
  if (dateRange.value === 'week') {
    incomeChartPeriod.value = 'week'
  } else if (dateRange.value === 'month') {
    incomeChartPeriod.value = 'month'
  }
  refreshIncomeChart()
}

const refreshOrderChart = () => {
  loadData()
}

const refreshIncomeChart = () => {
  initIncomeChart()
}

const handleResize = () => {
  [orderChart, incomeChart, houseChart].forEach(chart => {
    if (chart && !chart.isDisposed()) {
      chart.resize()
    }
  })
}

const viewAllComments = () => {
  router.push("/host/comments")
}

const goToHouseDetail = (id) => {
  router.push(`/user/house/${id}`)
}

// ==================== 监听器 ====================

// 监听收入图表周期变化
watch(incomeChartPeriod, () => {
  refreshIncomeChart()
})

// ==================== 生命周期 ====================

onMounted(() => {
  const now = new Date()
  selectedMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  
  // 并行加载所有数据
  Promise.all([
    loadData(),
    loadCommentStats(),
    loadHotHouses()
  ])
  
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  ;[orderChart, incomeChart, houseChart].forEach(chart => {
    if (chart && !chart.isDisposed()) {
      chart.dispose()
    }
  })
})
</script>

<style scoped>
.host-dashboard-container {
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

/* 统计卡片行 */
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stats-trend {
  font-size: 12px;
  display: flex;
  align-items: center;
}

.stats-trend.up {
  color: #67C23A;
}

.stats-trend.down {
  color: #F56C6C;
}

/* 卡片通用样式 */
.section-card,
.chart-card {
  margin-bottom: 24px;
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  padding: 8px 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* 核心指标 */
.metric-item {
  text-align: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.metric-item:hover {
  background: #ecf5ff;
  transform: scale(1.02);
}

.metric-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.metric-compare {
  font-size: 12px;
}

.metric-compare.up {
  color: #67C23A;
}

.metric-compare.down {
  color: #F56C6C;
}

/* 图表区域 */
.chart-row {
  margin-bottom: 24px;
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
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  margin-right: 8px;
  flex-shrink: 0;
}

.legend-label {
  flex: 1;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.legend-value {
  font-weight: 600;
  color: #303133;
  margin-right: 8px;
  flex-shrink: 0;
}

.legend-percent {
  color: #909399;
  flex-shrink: 0;
}

/* 评论分析 */
.comment-analysis {
  padding: 8px;
}

.comment-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24px;
}

.comment-stat-item {
  text-align: center;
}

.stat-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  margin-left: auto;
  margin-right: auto;
}

.stat-number {
  color: white;
  font-size: 28px;
  font-weight: 600;
}

.stat-label {
  font-size: 13px;
  color: #606266;
}

.rating-distribution {
  margin-bottom: 24px;
}

.rating-row {
  display: flex;
  align-items: center;
  gap: 8px;
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

.empty-data {
  text-align: center;
  color: #909399;
  padding: 20px 0;
  font-size: 14px;
}

.recent-comments {
  border-top: 1px solid #ebeef5;
  padding-top: 16px;
}

.recent-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.comment-item {
  margin-bottom: 12px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 6px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.comment-time {
  font-size: 11px;
  color: #909399;
  flex-shrink: 0;
}

.comment-content {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
  word-break: break-word;
}

/* 排行榜 */
.rank-list {
  max-height: 400px;
  overflow-y: auto;
}

.rank-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f2f5;
  cursor: pointer;
  transition: background-color 0.3s;
}

.rank-item:hover {
  background-color: #f5f7fa;
}

.rank-index {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-right: 12px;
  flex-shrink: 0;
}

.rank-index.top-three {
  background: linear-gradient(135deg, #f5f0a0, #f5d76e);
  color: #8a6d3b;
}

.rank-info {
  flex: 1;
  min-width: 0;
}

.rank-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

/* 响应式 */
@media (max-width: 768px) {
  .host-dashboard-container {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .stats-card {
    margin-bottom: 12px;
  }

  .metric-item {
    margin-bottom: 12px;
  }

  .comment-stats {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .rank-item {
    flex-wrap: wrap;
  }
}
</style>