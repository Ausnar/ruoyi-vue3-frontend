<template>
  <div class="notice-center-page">
    <section class="notice-hero">
      <div>
        <p class="notice-hero__eyebrow">Notice Center</p>
        <h1>公告中心</h1>
        <p class="notice-hero__desc">面向全体登录用户展示当前有效公告，支持按标题快速筛选并查看完整详情。</p>
      </div>
      <div class="notice-hero__badge">
        <span>仅展示状态正常的公告</span>
      </div>
    </section>

    <el-card shadow="never" class="notice-filter-card">
      <el-form :model="queryParams" :inline="true" ref="queryRef">
        <el-form-item label="公告标题" prop="noticeTitle">
          <el-input
            v-model="queryParams.noticeTitle"
            placeholder="请输入公告标题"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="公告类型" prop="noticeType">
          <el-select v-model="queryParams.noticeType" placeholder="全部类型" clearable style="width: 180px">
            <el-option
              v-for="dict in sys_notice_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div v-loading="loading" class="notice-list-wrap">
      <template v-if="noticeList.length">
        <article
          v-for="item in noticeList"
          :key="item.noticeId"
          class="notice-card"
          @click="handleView(item)"
        >
          <div class="notice-card__top">
            <div class="notice-card__title-wrap">
              <h2 class="notice-card__title">{{ item.noticeTitle }}</h2>
              <p class="notice-card__summary">{{ buildSummary(item.noticeContent) }}</p>
            </div>
            <div class="notice-card__tags">
              <dict-tag :options="sys_notice_type" :value="item.noticeType" />
            </div>
          </div>
          <div class="notice-card__footer">
            <span>发布人：{{ item.createBy || "系统" }}</span>
            <span>发布时间：{{ parseTime(item.createTime) }}</span>
            <el-button link type="primary" @click.stop="handleView(item)">查看详情</el-button>
          </div>
        </article>
      </template>
      <el-empty v-else description="暂无可查看的公告" />
    </div>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script setup name="NoticeCenter">
import { html2Text } from "@/utils"
import { listPublishedNotice } from "@/api/system/notice"

const router = useRouter()
const { proxy } = getCurrentInstance()
const { sys_notice_type } = proxy.useDict("sys_notice_type")

const queryRef = ref()
const loading = ref(false)
const total = ref(0)
const noticeList = ref([])

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  noticeTitle: undefined,
  noticeType: undefined
})

function getList() {
  loading.value = true
  listPublishedNotice(queryParams).then(response => {
    noticeList.value = response.rows || []
    total.value = response.total || 0
  }).finally(() => {
    loading.value = false
  })
}

function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

function handleView(row) {
  router.push(`/notice-center/detail/${row.noticeId}`)
}

function buildSummary(content) {
  const text = html2Text(content || "").replace(/\s+/g, " ").trim()
  if (!text) {
    return "暂无公告摘要，请点击查看详情。"
  }
  return text.length > 96 ? `${text.slice(0, 96)}...` : text
}

getList()
</script>

<style lang="scss" scoped>
.notice-center-page {
  min-height: calc(100vh - 84px);
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(19, 84, 122, 0.12), transparent 28%),
    linear-gradient(180deg, #f5f9ff 0%, #edf4ff 100%);
}

.notice-hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
  padding: 28px 32px;
  border-radius: 24px;
  background: linear-gradient(135deg, #16324f 0%, #205375 60%, #2d6a8c 100%);
  color: #fff;
  box-shadow: 0 20px 50px rgba(22, 50, 79, 0.18);
}

.notice-hero__eyebrow {
  margin: 0 0 10px;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
}

.notice-hero h1 {
  margin: 0;
  font-size: 34px;
  line-height: 1.2;
}

.notice-hero__desc {
  max-width: 640px;
  margin: 12px 0 0;
  font-size: 15px;
  line-height: 1.75;
  color: rgba(255, 255, 255, 0.82);
}

.notice-hero__badge {
  display: flex;
  align-items: flex-start;
}

.notice-hero__badge span {
  display: inline-flex;
  align-items: center;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 13px;
  white-space: nowrap;
}

.notice-filter-card {
  margin-bottom: 18px;
  border: none;
  border-radius: 20px;
  box-shadow: 0 16px 40px rgba(37, 78, 120, 0.08);
}

.notice-list-wrap {
  min-height: 320px;
}

.notice-card {
  margin-bottom: 16px;
  padding: 22px 24px;
  border: 1px solid #dbe6f3;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 30px rgba(39, 77, 118, 0.06);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.notice-card:hover {
  transform: translateY(-2px);
  border-color: #8cb4d8;
  box-shadow: 0 20px 36px rgba(39, 77, 118, 0.12);
}

.notice-card__top {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.notice-card__title {
  margin: 0;
  font-size: 22px;
  line-height: 1.5;
  color: #17324d;
}

.notice-card__summary {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.8;
  color: #52637a;
}

.notice-card__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #e8eef6;
  font-size: 13px;
  color: #667085;
}

.notice-card__footer .el-button {
  margin-left: auto;
}

@media (max-width: 768px) {
  .notice-center-page {
    padding: 16px;
  }

  .notice-hero {
    flex-direction: column;
    padding: 24px 20px;
    border-radius: 20px;
  }

  .notice-hero h1 {
    font-size: 28px;
  }

  .notice-card {
    padding: 18px;
  }

  .notice-card__top {
    flex-direction: column;
  }

  .notice-card__footer .el-button {
    margin-left: 0;
  }
}
</style>
