import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'

import UserLayout from '../layouts/UserLayout.vue'
import UserHome from '../views/User/UserHome.vue'
import UserHouseList from '../views/User/UserHouseList.vue'
import HouseDetail from '../views/User/HouseDetail.vue'
import HouseComments from '../views/User/HouseComments.vue'
import UserAppointment from '../views/User/UserAppointment.vue'
import UserAppointmentList from '../views/User/UserAppointmentList.vue'
import UserCommentList from '../views/User/UserCommentList.vue'
import UserCommentWrite from '../views/User/UserCommentWrite.vue' 
import UserFavoriteList from '../views/User/UserFavoriteList.vue'

import HostLayout from '../layouts/HostLayout.vue'
import HostHome from '../views/Host/HostHome.vue'
import HostHouseList from '../views/Host/HostHouseList.vue'
import HostHouseEdit from '../views/Host/HostHouseEdit.vue'
import HostCommentList from '../views/Host/HostCommentList.vue'
import HostAppointmentList from '../views/Host/HostAppointmentList.vue'
import HostDashboard from '../views/Host/HostDashboard.vue'

import AdminLayout from '../layouts/AdminLayout.vue'
import AdminStatistics from '../views/Admin/AdminStatistics.vue'
import AdminUserList from '../views/Admin/AdminUserList.vue'
import AdminHouseList from '../views/Admin/AdminHouseList.vue'
import AdminCommentList from '../views/Admin/AdminCommentList.vue'

const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: Login },
    { path: '/register', component: Register },

    {
        path: '/user',
        component: UserLayout,
        meta: {
            requiresAuth: true,
            role: 'user'
        },
        children: [
            { path: 'home', component: UserHome },
            { path: 'houses', component: UserHouseList },
            { path: 'house/:id', component: HouseDetail, meta: { hidePageHeader: true }},
            { path: 'house/:id/comments', component: HouseComments, meta: { hidePageHeader: true }},
            { path: "appointment/create/:houseId", component: UserAppointment},
            { path: 'appointments', component: UserAppointmentList },
            { path: 'comments', component: UserCommentList },
            { path: 'comment/write', component: UserCommentWrite },
            { path: 'favorite', component: UserFavoriteList }
        ]
    },
    {
        path: '/host',
        component: HostLayout,
        meta: {
            requiresAuth: true,
            role: 'host'
        },
        children: [
            { path: 'home', component: HostHome },
            { path: 'houses', component: HostHouseList },
            { path: 'house/edit/:id?', component: HostHouseEdit },
            { path: 'comments', component: HostCommentList },
            { path: 'appointments', component: HostAppointmentList },
            { path: 'dashboard', component: HostDashboard }
        ]
    },
    {
        path: '/admin',
        component: AdminLayout,
        meta: {
            requiresAuth: true,
            role: 'admin'
        },
        children: [
            { path: 'statistics', component: AdminStatistics },
            { path: 'users', component: AdminUserList},
            { path: 'houses', component: AdminHouseList },
            { path: 'comments', component: AdminCommentList }
        ]
    }   
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole')

  // 未登录拦截
  if (to.meta.requiresAuth && !token) {
    return next('/login')
  }

  // 角色不匹配拦截
  if (to.meta.role && to.meta.role !== userRole) {
    return next('/login')
  }

  next()
})

export default router