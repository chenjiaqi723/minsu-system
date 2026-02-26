<template>
  <div class="page-card" style="padding: 20px;">
    <div class="page-header">
      <h2>用户中心</h2>
    </div>

    <div style="margin-top: 30px; display: flex; flex-direction: column; gap: 20px;">

      <el-button type="primary" @click="go('/user/appointments')">我的预约</el-button>
      <el-button type="primary" @click="go('/user/comments')">我的评论</el-button>
      <el-button type="primary" @click="go('/user/houses')">浏览房源</el-button>

    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router"
const router = useRouter()

function go(path) {
  router.push(path)
}
</script>