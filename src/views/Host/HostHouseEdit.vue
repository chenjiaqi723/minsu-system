<template>
  <div class="house-edit-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button class="back-btn" @click="router.back()">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <h2>{{ isEdit ? "编辑房源" : "新增房源" }}</h2>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="save" :loading="saving">
          <el-icon><Check /></el-icon> 
          {{ isEdit ? "保存修改" : "发布房源" }}
        </el-button>
      </div>
    </div>

    <el-card class="form-card" shadow="hover">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        status-icon
        @submit.prevent="save"
      >
        <!-- 基本信息区域 -->
        <div class="form-section">
          <div class="section-title">
            <el-icon><InfoFilled /></el-icon>
            <span>基本信息</span>
          </div>

          <el-row :gutter="24">
            <el-col :xs="24" :md="12">
              <el-form-item label="房源标题" prop="title" required>
                <el-input
                  v-model="form.title"
                  placeholder="例如：温馨一居室公寓"
                  maxlength="50"
                  show-word-limit
                  clearable
                />
                <div class="field-hint">简洁明了，突出房源特点</div>
              </el-form-item>
            </el-col>

            <el-col :xs="24" :md="12">
              <el-form-item label="房源地址" prop="address">
                <el-input
                  v-model="form.address"
                  placeholder="请输入详细地址"
                  clearable
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="24">
            <el-col :xs="24" :md="12">
              <el-form-item label="每晚价格" prop="price" required>
                <el-input
                  v-model="form.price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                >
                  <template #prefix>¥</template>
                </el-input>
              </el-form-item>
            </el-col>

            <el-col :xs="24" :md="12">
              <el-form-item label="可住人数" prop="capacity">
                <el-input-number
                  v-model="form.capacity"
                  :min="1"
                  :max="20"
                  controls-position="right"
                  style="width: 100%"
                />
                <div class="field-hint">最多可入住人数</div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="房源描述" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="4"
              placeholder="详细描述你的房源，包括设施、周边环境等"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </div>

        <!-- 库存管理区域 -->
        <div class="form-section">
          <div class="section-title">
            <el-icon><Box /></el-icon>
            <span>库存管理</span>
          </div>

          <el-row :gutter="24">
            <el-col :xs="24" :md="12">
              <el-form-item label="总库存" prop="totalStock">
                <el-input-number
                  v-model="form.totalStock"
                  :min="0"
                  :max="999"
                  controls-position="right"
                  style="width: 100%"
                />
                <div class="field-hint">房源总数量</div>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 库存日历预览（简化版） -->
          <div class="stock-preview" v-if="isEdit">
            <div class="preview-header">
              <span>近7日库存预览</span>
              <el-button link type="primary" @click="goToInventoryManage">管理库存</el-button>
            </div>
            <div class="stock-dots">
              <div v-for="day in next7Days" :key="day.date" class="stock-dot-item">
                <div class="dot-date">{{ day.dateDisplay }}</div>
                <div class="stock-dot" :class="{ 'has-stock': day.stock > 0 }">
                  {{ day.stock }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 取消政策区域 -->
        <div class="form-section">
          <div class="section-title">
            <el-icon><Timer /></el-icon>
            <span>取消政策</span>
          </div>

          <el-form-item label="允许取消">
            <el-radio-group v-model="form.allowCancel">
              <el-radio :label="1" size="large">
                <span class="radio-label">允许取消</span>
                <span class="radio-desc">客人可在规定时间内免费取消</span>
              </el-radio>
              <el-radio :label="0" size="large">
                <span class="radio-label">不允许取消</span>
                <span class="radio-desc">预订后不可取消，订单金额不退</span>
              </el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item
            v-if="form.allowCancel === 1"
            label="截止时间"
          >
            <div class="cancel-deadline">
              <span>入住当天</span>
              <el-select
                v-model="form.cancelDeadlineHour"
                style="width: 120px; margin: 0 8px;"
              >
                <el-option
                  v-for="hour in 24"
                  :key="hour - 1"
                  :label="`${String(hour - 1).padStart(2, '0')}:00`"
                  :value="hour - 1"
                />
              </el-select>
              <span>之前取消可全额退款</span>
            </div>
            <div class="field-hint">超过此时间取消将收取违约金</div>
          </el-form-item>
        </div>

        <!-- 操作按钮（底部固定） -->
        <div class="form-actions">
          <el-button @click="router.back()">取消</el-button>
          <el-button type="primary" @click="save" :loading="saving">
            {{ isEdit ? "保存修改" : "发布房源" }}
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  ArrowLeft,
  Check,
  InfoFilled,
  Box,
  Timer
} from "@element-plus/icons-vue";
import request from "../../utils/request";

const route = useRoute();
const router = useRouter();

const isEdit = ref(false);
const saving = ref(false);
const formRef = ref(null);
const inventoryList = ref([]);

// 表单数据
const form = ref({
  id: null,
  title: "",
  price: "",
  address: "",
  description: "",
  capacity: 2,
  totalStock: 1,
  allowCancel: 1,
  cancelDeadlineHour: 18
});

// 表单验证规则
const rules = {
  title: [
    { required: true, message: "请输入房源标题", trigger: "blur" },
    { min: 2, max: 50, message: "标题长度在2-50个字符之间", trigger: "blur" }
  ],
  price: [
    { required: true, message: "请输入价格", trigger: "blur" },
    { pattern: /^\d+(\.\d{1,2})?$/, message: "请输入有效的价格", trigger: "blur" }
  ],
  address: [
    { required: true, message: "请输入地址", trigger: "blur" }
  ],
  capacity: [
    { required: true, message: "请输入可住人数", trigger: "blur" }
  ]
};

async function loadInventory(houseId) {
  const res = await request.get(`/houseInventory/availableDates/${houseId}`);
  inventoryList.value = res.data;
}

// 近7天日期（用于库存预览）
const next7Days = computed(() => {
  const days = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    const dateStr = `${y}-${m}-${d}`;

    const inv = inventoryList.value.find(item => item.date === dateStr);

    days.push({
      date: dateStr,
      dateDisplay: `${m}/${d}`,
      stock: inv ? inv.availableStock : 0
    });
  }

  return days;
});

// 判断模式
onMounted(() => {
  const id = route.params.id;
  if (id) {
    isEdit.value = true;
    loadDetail(id);
    loadInventory(id);
  }
});

// 加载房源详情
function loadDetail(id) {
  request.get(`/house/detail/${id}`).then(res => {
    form.value = res.data;
  });
}

// 保存房源
async function save() {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning("请完整填写房源信息");
      return;
    }
    
    saving.value = true;
    
    try {
      const url = isEdit.value ? "/house/update" : "/house/create";
      const user = JSON.parse(localStorage.getItem("user"));
      
      const res = await request.post(url, form.value, {
        headers: {
          "X-User-Id": user?.userId,
          "X-User-Role": user?.role
        }
      });
      
      ElMessage.success(isEdit.value ? "房源信息已更新" : "房源发布成功");
      
      // 成功后跳转
      if (isEdit.value) {
        router.push("/host/houses");
      } else {
        router.push("/host/houses");
      }
      
    } catch (error) {
      ElMessage.error(error.response?.data || "操作失败，请重试");
    } finally {
      saving.value = false;
    }
  });
}

// 跳转到库存管理
function goToInventoryManage() {
  router.push(`/host/inventory/${form.value.id}`);
}
</script>

<style scoped>
.house-edit-container {
  max-width: 900px;
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

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  padding: 8px 16px;
  border-radius: 20px;
}

.header-left h2 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

/* 表单卡片 */
.form-card {
  border-radius: 12px;
  overflow: hidden;
}

.form-card :deep(.el-card__body) {
  padding: 30px;
}

/* 表单区块 */
.form-section {
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid #ebeef5;
}

.form-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.section-title .el-icon {
  font-size: 18px;
  color: #409EFF;
}

/* 字段提示 */
.field-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

/* 单选按钮样式 */
:deep(.el-radio) {
  display: flex;
  align-items: flex-start;
  margin-right: 0;
  margin-bottom: 12px;
  height: auto;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  width: 100%;
}

:deep(.el-radio:last-child) {
  margin-bottom: 0;
}

:deep(.el-radio.is-checked) {
  border-color: #409EFF;
  background-color: #ecf5ff;
}

.radio-label {
  font-weight: 500;
  color: #303133;
  display: block;
  margin-bottom: 2px;
}

.radio-desc {
  font-size: 12px;
  color: #909399;
  display: block;
  line-height: 1.4;
}

/* 取消截止时间 */
.cancel-deadline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: #606266;
}

/* 库存预览 */
.stock-preview {
  margin-top: 20px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  color: #606266;
}

.stock-dots {
  display: flex;
  gap: 8px;
  justify-content: space-between;
}

.stock-dot-item {
  flex: 1;
  text-align: center;
}

.dot-date {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stock-dot {
  width: 100%;
  padding: 6px 0;
  background-color: #f0f2f5;
  border-radius: 4px;
  color: #909399;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s;
}

.stock-dot.has-stock {
  background-color: #e1f3d8;
  color: #67c23a;
}

/* 底部操作按钮 */
.form-actions {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-actions .el-button {
  min-width: 100px;
}

/* 响应式 */
@media (max-width: 768px) {
  .house-edit-container {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .header-left {
    width: 100%;
  }

  .header-right {
    width: 100%;
  }

  .header-right .el-button {
    width: 100%;
  }

  .form-card :deep(.el-card__body) {
    padding: 20px;
  }

  .cancel-deadline {
    flex-direction: column;
    align-items: flex-start;
  }

  .stock-dots {
    flex-wrap: wrap;
  }

  .stock-dot-item {
    min-width: 60px;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .el-button {
    width: 100%;
  }
}
</style>