<template>
  <BasicLayout
    :menu-items="menuItems"
    :user-role="role"
    :user-name="name"
  />
</template>

<script setup>
import BasicLayout from './BasicLayout.vue'
import {
  User,
  House,
  Comment,
  DataLine
} from '@element-plus/icons-vue'

const userInfo = JSON.parse(localStorage.getItem("user") || "{}")

const role = userInfo.role || 'admin'
const name = userInfo.nickname || '管理员'

const menuItems = [
  {
    index: '/admin/users',
    title: '用户管理',
    icon: User
  },
  {
    index: '/admin/houses',
    title: '房源审核',
    icon: House
  },
  {
    index: '/admin/comments',
    title: '评论管理',
    icon: Comment
  },
  {
    index: '/admin/statistics',
    title: '数据统计',
    icon: DataLine
  }
]
</script>