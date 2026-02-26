<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>民宿管理系统</h2>
        <p>欢迎回来，请登录您的账号</p>
      </div>

      <el-form @submit.prevent="doLogin">
        <el-form-item>
          <el-input
            v-model="account"
            placeholder="请输入账号"
            :prefix-icon="User"
            size="large"
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-input
            v-model="password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="doLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            @click="doLogin" 
            size="large" 
            :loading="loading"
            style="width: 100%"
          >
            登录
          </el-button>
        </el-form-item>

        <div class="login-footer">
          <a @click="$router.push('/register')" class="register-link">
            没有账号？点击注册
          </a>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { User, Lock } from "@element-plus/icons-vue";
import request from "../utils/request";

const router = useRouter();

const account = ref("");
const password = ref("");
const loading = ref(false);

const doLogin = async () => {
  if (!account.value || !password.value) {
    ElMessage.warning("请输入账号和密码");
    return;
  }

  loading.value = true;

  try {
    const res = await request.post("/user/login", {
      account: account.value,
      password: password.value
    });

    console.log("登录响应:", res.data);

    if (res.data.code === 200 || res.data.message === "登录成功") {
      
      // 获取用户数据（根据实际返回结构调整）
      const userData = res.data.data || res.data;
      
      // 保存用户信息
      const userInfo = {
        userId: userData.userId,
        account: userData.account,
        nickname: userData.nickname || userData.account,
        role: userData.role,
        token: userData.token || 'temp-token'
      };

      console.log("保存用户信息:", userInfo);

      // 保存到 localStorage
      localStorage.setItem("user", JSON.stringify(userInfo));
      localStorage.setItem("token", userInfo.token);
      localStorage.setItem("userRole", userInfo.role);

      ElMessage.success("登录成功");

      // 根据角色跳转
      const roleRoutes = {
        user: '/user/houses',    // 用户跳转到房源列表
        host: '/host/dashboard',  // 房东跳转到仪表盘
        admin: '/admin/users'     // 管理员跳转到用户管理
      };

      const targetPath = roleRoutes[userInfo.role];
      
      if (targetPath) {
        console.log("跳转到:", targetPath);
        await router.replace(targetPath);
      } else {
        console.error("未知角色:", userInfo.role);
        ElMessage.error("用户角色错误");
      }

    } else {
      ElMessage.error(res.data.message || "账号或密码错误");
    }

  } catch (error) {
    console.error("登录错误:", error);
    ElMessage.error(error.response?.data?.message || "登录失败，请稍后重试");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-box {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  font-size: 28px;
  color: #333;
  margin: 0 0 10px 0;
}

.login-header p {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
}

.register-link {
  color: #409EFF;
  cursor: pointer;
  text-decoration: none;
  font-size: 14px;
}

.register-link:hover {
  text-decoration: underline;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-button) {
  border-radius: 8px;
  height: 48px;
  font-size: 16px;
}
</style>