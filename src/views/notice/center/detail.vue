<template>
  <div class="notice-detail-page" v-loading="loading">
    <div class="notice-detail__toolbar">
      <el-button link icon="ArrowLeft" @click="goBack">返回公告中心</el-button>
    </div>

    <el-card v-if="notice.noticeId" shadow="never" class="notice-detail__card">
      <header class="notice-detail__header">
        <h1>{{ notice.noticeTitle }}</h1>
        <div class="notice-detail__meta">
          <dict-tag :options="sys_notice_type" :value="notice.noticeType" />
          <span>发布人：{{ notice.createBy || "系统" }}</span>
          <span>发布时间：{{ parseTime(notice.createTime) }}</span>
        </div>
      </header>
      <el-divider />
      <div class="notice-detail__content" v-html="notice.noticeContent || '<p>暂无公告内容</p>'"></div>
    </el-card>

    <el-empty v-else-if="!loading" description="公告不存在或已关闭" />
  </div>
</template>

<script setup name="NoticeCenterDetail">
import { getPublishedNotice } from "@/api/system/notice"

const router = useRouter()
const route = useRoute()
const { proxy } = getCurrentInstance()
const { sys_notice_type } = proxy.useDict("sys_notice_type")

const loading = ref(false)
const notice = ref({})

function getNoticeDetail() {
  loading.value = true
  getPublishedNotice(route.params.noticeId).then(response => {
    notice.value = response.data || {}
  }).catch(() => {
    notice.value = {}
    proxy.$modal.msgError("公告不存在或已关闭")
  }).finally(() => {
    loading.value = false
  })
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push("/noticeCenter")
}

getNoticeDetail()
</script>

<style lang="scss" scoped>
.notice-detail-page {
  min-height: calc(100vh - 84px);
  padding: 24px;
  background:
    linear-gradient(180deg, rgba(18, 50, 78, 0.06), rgba(18, 50, 78, 0)),
    #f7faff;
}

.notice-detail__toolbar {
  margin-bottom: 12px;
}

.notice-detail__card {
  max-width: 980px;
  margin: 0 auto;
  border: none;
  border-radius: 24px;
  box-shadow: 0 24px 50px rgba(22, 50, 79, 0.08);
}

.notice-detail__header h1 {
  margin: 0;
  font-size: 32px;
  line-height: 1.4;
  color: #18324e;
}

.notice-detail__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 16px;
  font-size: 13px;
  color: #667085;
}

.notice-detail__content {
  min-height: 260px;
  font-size: 15px;
  line-height: 1.9;
  color: #24324a;

  :deep(img) {
    max-width: 100%;
    height: auto;
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
  }

  :deep(td),
  :deep(th) {
    border: 1px solid #d3dce8;
    padding: 8px 10px;
  }

  :deep(blockquote) {
    margin: 0;
    padding-left: 16px;
    border-left: 4px solid #9db7d3;
    color: #516579;
  }
}

@media (max-width: 768px) {
  .notice-detail-page {
    padding: 16px;
  }

  .notice-detail__header h1 {
    font-size: 26px;
  }
}
</style>
