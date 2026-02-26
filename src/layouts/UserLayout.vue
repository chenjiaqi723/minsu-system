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
  Star
} from '@element-plus/icons-vue'

const userInfo = JSON.parse(localStorage.getItem('user') || '{}')

const role = userInfo.role || 'user'
const name = userInfo.nickname || '用户'

const menuItems = [
  {
    index: '/user/houses',
    title: '浏览房源',
    icon: House
  },
  {
    index: '/user/appointments',
    title: '我的预约',
    icon: Calendar
  },
  {
    index: '/user/comments',
    title: '我的评论',
    icon: Comment
  },
  {
    index: '/user/favorite',
    title: '我的收藏',
    icon: Star
  }
]
</script>