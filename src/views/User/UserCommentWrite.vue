<template>
  <div class="page-card" style="padding: 20px; max-width: 600px; margin: auto;">
    <div class="page-header">
      <h2>发布评论</h2>
    </div>

    <el-form :model="form" label-width="100px" style="margin-top: 20px;">

      <el-form-item label="评分">
        <el-rate v-model="form.rating"></el-rate>
      </el-form-item>

      <el-form-item label="内容">
        <el-input type="textarea" v-model="form.content" rows="4"></el-input>
      </el-form-item>

      <el-button type="primary" @click="submit">提交评论</el-button>

    </el-form>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import request from "../../utils/request"

const route = useRoute()
const router = useRouter()

const form = ref({
  rating: 5,
  content: ""
})

const appointmentId = route.query.appointmentId
const houseId = route.query.houseId

function submit() {
  if (!form.value.content) {
    alert("请输入评论内容")
    return
  }

  const user = JSON.parse(localStorage.getItem("user"))

  request.post("/comment/create", {
    appointmentId,
    houseId,
    rating: form.value.rating,
    content: form.value.content
  }, {
    headers: {
      "X-User-Id": user.userId,
      "X-User-Role": user.role
    }
  }).then(res => {
    alert(res.data)
    router.push("/user/comments")
  })
}
</script>