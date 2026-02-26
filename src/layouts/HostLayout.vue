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
  House,
  Calendar,
  Comment,
  DataLine
} from '@element-plus/icons-vue'

const userInfo = JSON.parse(localStorage.getItem('user') || '{}')

const role = userInfo.role || 'host'
const name = userInfo.nickname || '房东'

const menuItems = [
  {
    index: '/host/houses',
    title: '房源管理',
    icon: House
  },
  {
    index: '/host/appointments',
    title: '预约管理',
    icon: Calendar
  },
  {
    index: '/host/comments',
    title: '评论管理',
    icon: Comment
  },
  {
    index: '/host/dashboard',
    title: '运营统计',
    icon: DataLine
  }
]
</script>