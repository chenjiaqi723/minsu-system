<template>
  <div class="page-card" style="padding: 20px;">
    <div class="page-header">
      <h2>房东后台首页</h2>
    </div>

    <div style="margin-top: 20px;">
      <el-button type="primary" @click="go('/host/houses')">房源管理</el-button>
      <el-button type="primary" @click="go('/host/comments')">评论管理</el-button>
      <el-button type="primary" @click="go('/host/appointments')">预约管理</el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

function go(path) {
  router.push(path);
}

</script>