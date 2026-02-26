<template>
  <div class="login-box">
    <h2>注册账号</h2>

      <el-input v-model="account" placeholder="请输入账号"></el-input>
      <el-input v-model="nickname" placeholder="请输入昵称"></el-input>
      <el-input v-model="password" type="password" placeholder="请输入密码"></el-input>
      <el-input v-model="phone" placeholder="请输入手机号"></el-input>

    <el-select v-model="role" placeholder="请选择身份">
      <el-option label="普通用户" value="user"></el-option>
      <el-option label="房东" value="host"></el-option>
      <el-option label="管理员" value="admin"></el-option>
    </el-select>

    <el-button type="primary" @click="doRegister">注册</el-button>
    <el-button @click="goLogin">返回登录</el-button>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
import request from "../utils/request"

const router = useRouter()

const account = ref("")
const nickname = ref("")
const password = ref("")
const phone = ref("")
const role = ref("user")

const doRegister = async () => {

  if (!account.value || !password.value) {
    alert("请输入账号密码")
    return
  }

  const res = await request.post("/user/register", {
    account: account.value,
    nickname: nickname.value,
    password: password.value,
    phone: phone.value,
    role: role.value
  })

  alert(res.data)
  if (res.data === "注册成功") {
    router.push("/login")
  }
}

function goLogin() {
  router.push("/login")
}
</script>

<style>
.login-box {
  width: 300px;
  margin: 100px auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>