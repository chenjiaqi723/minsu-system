<template>
  <div class="appointment-create-container">
    <!-- 页面标题和返回 -->
    <div class="page-header">
      <div class="header-left">
        <el-button link @click="goBack">
          <el-icon><ArrowLeft /></el-icon> 返回房源详情
        </el-button>
        <h2>提交预约申请</h2>
      </div>
      <div class="header-right">
        <el-steps :active="currentStep" simple>
          <el-step title="选择日期" icon="Calendar" />
          <el-step title="填写信息" icon="Edit" />
          <el-step title="确认提交" icon="Check" />
        </el-steps>
      </div>
    </div>

    <el-row :gutter="24">
      <!-- 左侧表单区域 -->
      <el-col :xs="24" :lg="16">
        <el-card class="form-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>预约信息</span>
              <el-tag type="info" size="small">房源ID: {{ houseId }}</el-tag>
            </div>
          </template>

          <el-form 
            :model="form" 
            :rules="rules"
            ref="formRef"
            label-width="100px"
            status-icon
          >
            <!-- 日期选择 -->
            <el-form-item label="入住日期" prop="dateRange" required>
              <div class="date-picker-wrapper">
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="入住日期"
                  end-placeholder="离店日期"
                  :disabled-date="disabledDate"
                  class="full-width"
                  @change="handleDateChange"
                />
                <div class="date-hint">
                  <el-icon><InfoFilled /></el-icon>
                  <span>灰色日期表示已无库存</span>
                </div>
              </div>
            </el-form-item>

            <!-- 入住人数 -->
            <el-form-item label="入住人数" prop="guestCount">
              <el-input-number
                v-model="form.guestCount"
                :min="1"
                :max="house.capacity || 10"
                controls-position="right"
                class="guest-input"
              />
              <span class="capacity-hint">最多可住 {{ house.capacity || '?' }} 人</span>
            </el-form-item>

            <!-- 联系人信息 -->
            <el-form-item label="联系人" prop="contactName">
              <el-input 
                v-model="form.contactName" 
                placeholder="请输入联系人姓名"
                clearable
              />
            </el-form-item>

            <el-form-item label="联系电话" prop="contactPhone">
              <el-input 
                v-model="form.contactPhone" 
                placeholder="请输入联系电话"
                clearable
              >
                <template #prefix>
                  <el-icon><Iphone /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <!-- 备注 -->
            <el-form-item label="备注说明" prop="note">
              <el-input
                v-model="form.note"
                type="textarea"
                :rows="4"
                placeholder="如有特殊需求请在此说明（如：需要加床、带宠物等）"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>

            <!-- 取消政策 -->
            <el-form-item label="取消政策">
              <el-alert
                v-if="form.allowCancel === 1"
                type="success"
                :closable="false"
                show-icon
              >
                <div class="cancel-policy">
                  <strong>灵活取消</strong>
                  <p>入住当天 {{ form.cancelDeadlineHour || '18' }}:00 前取消可全额退款</p>
                </div>
              </el-alert>

              <el-alert
                v-else
                type="warning"
                :closable="false"
                show-icon
              >
                <div class="cancel-policy">
                  <strong>不可取消</strong>
                  <p>此房源预订后不支持取消，请确认行程后再下单</p>
                </div>
              </el-alert>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右侧价格卡片 -->
      <el-col :xs="24" :lg="8">
        <div class="sidebar">
          <!-- 房源信息卡片 -->
          <el-card class="price-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>订单信息</span>
              </div>
            </template>

            <div class="house-summary">
              <el-image
                :src="house.cover || '/default-house.jpg'"
                class="summary-cover"
                fit="cover"
              >
                <template #error>
                  <div class="cover-placeholder">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div class="summary-info">
                <div class="house-title">{{ house.title || '加载中...' }}</div>
                <div class="house-price">￥{{ formatMoney(price) }} /晚</div>
              </div>
            </div>

            <!-- 价格明细 -->
            <div class="price-detail">
              <div class="price-row">
                <span>入住日期</span>
                <span>{{ form.startDate || '未选择' }}</span>
              </div>
              <div class="price-row">
                <span>离店日期</span>
                <span>{{ form.endDate || '未选择' }}</span>
              </div>
              <div class="price-row" v-if="stayDays > 0">
                <span>入住天数</span>
                <span>{{ stayDays }} 晚</span>
              </div>
              <div class="price-row">
                <span>入住人数</span>
                <span>{{ form.guestCount || 1 }} 人</span>
              </div>

              <el-divider />

              <div class="price-row total">
                <span>单价</span>
                <span>￥{{ formatMoney(price) }} × {{ stayDays || 0 }} 晚</span>
              </div>
              <div class="price-row final-total">
                <span>订单总额</span>
                <span class="total-price">￥{{ formatMoney(totalPrice) }}</span>
              </div>
            </div>

            <!-- 库存日历预览 -->
            <div class="inventory-preview" v-if="inventoryList.length > 0">
              <div class="preview-title">
                <el-icon><Calendar /></el-icon>
                <span>近7日库存</span>
              </div>
              <div class="inventory-dots">
                <div 
                  v-for="(item, index) in next7Days" 
                  :key="index"
                  class="inventory-dot"
                  :class="{ 
                    'available': item.stock > 0, 
                    'unavailable': !item.stock || item.stock <= 0,
                    'selected': isDateSelected(item.date)
                  }"
                  :title="`${item.date}: ${item.stock > 0 ? '可订' : '满房'}`"
                >
                  <span class="dot-day">{{ getDayOfMonth(item.date) }}</span>
                  <span class="dot-status"></span>
                </div>
              </div>
            </div>

            <!-- 提交按钮 -->
            <el-button
              type="primary"
              size="large"
              class="submit-btn"
              :loading="submitting"
              @click="submitAppointment"
              :disabled="!canSubmit"
            >
              {{ submitButtonText }}
            </el-button>

            <div class="agreement">
              <el-checkbox v-model="agreeTerms">
                我已阅读并同意 <a href="#" @click.prevent>《预订服务协议》</a>
              </el-checkbox>
            </div>
          </el-card>

          <!-- 注意事项 -->
          <el-card class="tips-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon><Warning /></el-icon>
                <span>预订须知</span>
              </div>
            </template>
            <ul class="tips-list">
              <li>请确保联系方式正确，以便房东联系</li>
              <li>实际入住人数不得超过房源最大容量</li>
              <li>特殊需求请提前在备注中说明</li>
              <li>预订后请留意短信或电话通知</li>
            </ul>
          </el-card>
        </div>
      </el-col>
    </el-row>

    <!-- 提交成功对话框 -->
    <el-dialog v-model="showSuccessDialog" title="提交成功" width="400px" center>
      <div class="success-content">
        <el-icon :size="60" color="#67C23A"><SuccessFilled /></el-icon>
        <h3>预约申请已提交</h3>
        <p>房东将在24小时内确认您的申请</p>
        <p class="order-id">订单号: {{ newAppointmentId }}</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="goToMyAppointments">查看我的预约</el-button>
          <el-button type="primary" @click="goToHouseList">继续浏览</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  Calendar,
  InfoFilled,
  Iphone,
  Picture,
  Warning,
  SuccessFilled
} from "@element-plus/icons-vue";
import request from "../../utils/request";
import { formatMoney } from "../../utils/format";

const route = useRoute();
const router = useRouter();
const houseId = route.params.houseId;

// 表单引用
const formRef = ref(null);

// 数据
const house = ref({});
const price = ref(0);
const inventoryList = ref([]);
const dateRange = ref([]);
const submitting = ref(false);
const agreeTerms = ref(false);
const showSuccessDialog = ref(false);
const newAppointmentId = ref("");
const currentStep = ref(1);

// 表单数据
const form = reactive({
  startDate: "",
  endDate: "",
  guestCount: 1,
  contactName: "",
  contactPhone: "",
  note: "",
  allowCancel: 1,
  cancelDeadlineHour: 18
});

// 表单验证规则
const rules = {
  dateRange: [
    { required: true, message: '请选择入住日期', trigger: 'change' }
  ],
  contactName: [
    { required: true, message: '请输入联系人姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  guestCount: [
    { required: true, message: '请输入入住人数', trigger: 'change' }
  ]
};

// 计算属性
const stayDays = computed(() => {
  if (!form.startDate || !form.endDate) return 0
  const start = new Date(form.startDate)
  const end = new Date(form.endDate)
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
})

const totalPrice = computed(() => {
  return stayDays.value * price.value
})

const canSubmit = computed(() => {
  return form.startDate && 
         form.endDate && 
         form.contactName && 
         form.contactPhone && 
         agreeTerms.value &&
         !submitting.value
})

const submitButtonText = computed(() => {
  if (!form.startDate || !form.endDate) return "请选择日期"
  if (!form.contactName) return "填写联系人"
  if (!form.contactPhone) return "填写联系电话"
  if (!agreeTerms.value) return "请同意协议"
  return "提交预约申请"
})

// 近7天库存
const next7Days = computed(() => {
  const today = new Date()
  const days = []
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dateStr = formatDate(date)
    
    const inventory = inventoryList.value.find(item => item.date === dateStr)
    days.push({
      date: dateStr,
      stock: inventory ? inventory.stock : 0
    })
  }
  
  return days
})

// 初始化
onMounted(async () => {
  try {
    // 加载房源详情
    const houseRes = await request.get(`/house/detail/${houseId}`)
    house.value = houseRes.data
    price.value = houseRes.data.price
    
    // 加载库存
    const inventoryRes = await request.get(`/houseInventory/availableDates/${houseId}`)
    inventoryList.value = inventoryRes.data
    
    // 从本地存储获取用户信息
    const userInfo = JSON.parse(localStorage.getItem("user") || "{}")
    if (userInfo.username) {
      form.contactName = userInfo.username
    }
    
    // 从URL参数获取日期
    if (route.query.startDate && route.query.endDate) {
      dateRange.value = [new Date(route.query.startDate), new Date(route.query.endDate)]
      handleDateChange()
    }
    
    // 从URL参数获取人数
    if (route.query.guests) {
      form.guestCount = parseInt(route.query.guests)
    }
  } catch (error) {
    ElMessage.error("加载数据失败")
    console.error(error)
  }
})

// 日期变化处理
function handleDateChange() {
  if (dateRange.value && dateRange.value.length === 2) {
    form.startDate = formatDate(dateRange.value[0])
    form.endDate = formatDate(dateRange.value[1])
    currentStep.value = 2
  } else {
    form.startDate = ""
    form.endDate = ""
  }
}

// 检查日期是否被选中
function isDateSelected(dateStr) {
  if (!form.startDate || !form.endDate) return false
  
  const current = new Date(dateStr)
  const start = new Date(form.startDate)
  const end = new Date(form.endDate)
  
  return current >= start && current < end
}

// 获取日期中的天数
function getDayOfMonth(dateStr) {
  return new Date(dateStr).getDate()
}

// 提交预约
async function submitAppointment() {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning("请填写完整信息")
      return
    }
    
    if (!agreeTerms.value) {
      ElMessage.warning("请同意预订服务协议")
      return
    }
    
    // 检查库存
    let current = new Date(form.startDate)
    const end = new Date(form.endDate)
    
    while (current < end) {
      const formatted = formatDate(current)
      const found = inventoryList.value.find(d => d.date === formatted)
      
      if (!found || found.stock <= 0) {
        ElMessage.error(`日期 ${formatted} 已无库存，请重新选择`)
        return
      }
      current.setDate(current.getDate() + 1)
    }
    
    // 提交预约
    submitting.value = true
    
    try {
      const userInfo = JSON.parse(localStorage.getItem("user") || "{}")
      
      const res = await request.post("/appointment/create", {
        houseId: houseId,
        startDate: form.startDate,
        endDate: form.endDate,
        note: form.note,
        guestCount: form.guestCount,
        contactName: form.contactName,
        contactPhone: form.contactPhone
      }, {
        headers: {
          "X-User-Id": userInfo.userId,
          "X-User-Role": userInfo.role
        }
      })
      
      newAppointmentId.value = res.data.appointmentId || res.data
      showSuccessDialog.value = true
      currentStep.value = 3
      
    } catch (error) {
      ElMessage.error(error.response?.data || "提交失败，请重试")
    } finally {
      submitting.value = false
    }
  })
}

// 返回房源详情
function goBack() {
  router.push(`/user/house/${houseId}`)
}

// 查看我的预约
function goToMyAppointments() {
  router.push("/user/appointments")
}

// 继续浏览房源
function goToHouseList() {
  router.push("/user/houses")
}

// 格式化日期
function formatDate(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 禁用日期
function disabledDate(time) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // 不能选择今天之前
  if (time.getTime() < today.getTime()) {
    return true
  }
  
  const formatted = formatDate(time)
  const found = inventoryList.value.find(d => d.date === formatted)
  return !found || found.stock <= 0
}
</script>

<style scoped>
.appointment-create-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

/* 页面头部 */
.page-header {
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.header-left h2 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

/* 步骤条 */
:deep(.el-steps--simple) {
  background: #fff;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 表单卡片 */
.form-card {
  border-radius: 12px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

/* 日期选择 */
.date-picker-wrapper {
  width: 100%;
}

.full-width {
  width: 100%;
}

.date-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.guest-input {
  width: 150px;
}

.capacity-hint {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}

/* 取消政策 */
.cancel-policy p {
  margin: 4px 0 0;
  font-size: 13px;
}

/* 侧边栏 */
.sidebar {
  position: sticky;
  top: 20px;
}

.price-card,
.tips-card {
  border-radius: 12px;
  margin-bottom: 20px;
}

/* 房源摘要 */
.house-summary {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.summary-cover {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f5f7fa;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.summary-info {
  flex: 1;
}

.house-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.house-price {
  font-size: 14px;
  color: #f56c6c;
}

/* 价格明细 */
.price-detail {
  margin-bottom: 20px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
}

.price-row.total {
  margin-top: 8px;
  font-weight: 500;
}

.price-row.final-total {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 2px dashed #dcdfe6;
  font-size: 16px;
  font-weight: 600;
}

.total-price {
  color: #f56c6c;
  font-size: 20px;
}

/* 库存预览 */
.inventory-preview {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.preview-title {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #606266;
}

.inventory-dots {
  display: flex;
  justify-content: space-between;
}

.inventory-dot {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.3s;
}

.inventory-dot:hover {
  background-color: rgba(64, 158, 255, 0.1);
}

.dot-day {
  font-size: 12px;
  color: #606266;
}

.dot-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.inventory-dot.available .dot-status {
  background-color: #67c23a;
}

.inventory-dot.unavailable .dot-status {
  background-color: #f56c6c;
}

.inventory-dot.selected {
  background-color: rgba(64, 158, 255, 0.1);
}

.inventory-dot.selected .dot-day {
  color: #409EFF;
  font-weight: 600;
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  margin-bottom: 16px;
}

.agreement {
  text-align: center;
  font-size: 13px;
}

.agreement a {
  color: #409EFF;
  text-decoration: none;
}

.agreement a:hover {
  text-decoration: underline;
}

/* 注意事项 */
.tips-card .card-header {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #e6a23c;
}

.tips-list {
  margin: 0;
  padding-left: 20px;
  color: #606266;
  font-size: 13px;
  line-height: 1.8;
}

.tips-list li {
  margin-bottom: 8px;
}

/* 成功对话框 */
.success-content {
  text-align: center;
  padding: 20px 0;
}

.success-content h3 {
  margin: 16px 0 8px;
  font-size: 20px;
  color: #303133;
}

.success-content p {
  color: #606266;
  margin: 4px 0;
}

.order-id {
  font-size: 14px;
  color: #909399;
  margin-top: 12px;
}

/* 响应式 */
@media (max-width: 768px) {
  .appointment-create-container {
    padding: 12px;
  }
  
  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .sidebar {
    position: static;
    margin-top: 20px;
  }
  
  .inventory-dots {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .inventory-dot {
    min-width: 40px;
  }
}
</style>