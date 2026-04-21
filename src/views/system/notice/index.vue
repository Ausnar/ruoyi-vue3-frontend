<template>
   <div class="app-container">
      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
         <el-form-item label="公告标题" prop="noticeTitle">
            <el-input
               v-model="queryParams.noticeTitle"
               placeholder="请输入公告标题"
               clearable
               style="width: 200px"
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item label="操作人员" prop="createBy">
            <el-input
               v-model="queryParams.createBy"
               placeholder="请输入操作人员"
               clearable
               style="width: 200px"
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item label="类型" prop="noticeType">
            <el-select v-model="queryParams.noticeType" placeholder="公告类型" clearable style="width: 200px">
               <el-option
                  v-for="dict in sys_notice_type"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
               />
            </el-select>
         </el-form-item>
         <el-form-item label="发布范围" prop="publishScopeType">
            <el-select v-model="queryParams.publishScopeType" placeholder="发布范围" clearable style="width: 200px">
               <el-option
                  v-for="item in publishScopeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
               />
            </el-select>
         </el-form-item>
         <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
         </el-form-item>
      </el-form>

      <el-row :gutter="10" class="mb8">
         <el-col :span="1.5">
            <el-button
               type="primary"
               plain
               icon="Plus"
               @click="handleAdd"
               v-hasPermi="['system:notice:add']"
            >新增</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="success"
               plain
               icon="Edit"
               :disabled="single"
               @click="handleUpdate"
               v-hasPermi="['system:notice:edit']"
            >修改</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="danger"
               plain
               icon="Delete"
               :disabled="multiple"
               @click="handleDelete"
               v-hasPermi="['system:notice:remove']"
            >删除</el-button>
         </el-col>
         <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <el-table v-loading="loading" :data="noticeList" @selection-change="handleSelectionChange">
         <el-table-column type="selection" width="55" align="center" />
         <el-table-column label="序号" align="center" prop="noticeId" width="100" />
         <el-table-column label="公告标题" align="center" min-width="280">
            <template #default="scope">
               <el-button link type="primary" class="notice-title-button" @click="handlePreview(scope.row)">
                  <span class="notice-title-text">{{ scope.row.noticeTitle }}</span>
               </el-button>
            </template>
         </el-table-column>
         <el-table-column label="公告类型" align="center" prop="noticeType" width="100">
            <template #default="scope">
               <dict-tag :options="sys_notice_type" :value="scope.row.noticeType" />
            </template>
         </el-table-column>
         <el-table-column label="状态" align="center" prop="status" width="100">
            <template #default="scope">
               <dict-tag :options="sys_notice_status" :value="scope.row.status" />
            </template>
         </el-table-column>
         <el-table-column label="发布范围" align="center" min-width="220">
            <template #default="scope">
               <span>{{ formatPublishScope(scope.row) }}</span>
            </template>
         </el-table-column>
         <el-table-column label="创建者" align="center" prop="createBy" width="100" />
         <el-table-column label="创建时间" align="center" prop="createTime" width="100">
            <template #default="scope">
               <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
            </template>
         </el-table-column>
         <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
            <template #default="scope">
               <el-button link type="primary" icon="View" @click="handlePreview(scope.row)" v-hasPermi="['system:notice:query']">查看</el-button>
               <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:notice:edit']">修改</el-button>
               <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:notice:remove']">删除</el-button>
            </template>
         </el-table-column>
      </el-table>

      <pagination
         v-show="total > 0"
         :total="total"
         v-model:page="queryParams.pageNum"
         v-model:limit="queryParams.pageSize"
         @pagination="getList"
      />

      <el-dialog :title="title" v-model="open" width="820px" append-to-body>
         <el-form ref="noticeRef" :model="form" :rules="rules" label-width="88px">
            <el-row>
               <el-col :span="12">
                  <el-form-item label="公告标题" prop="noticeTitle">
                     <el-input v-model="form.noticeTitle" placeholder="请输入公告标题" />
                  </el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item label="公告类型" prop="noticeType">
                     <el-select v-model="form.noticeType" placeholder="请选择">
                        <el-option
                           v-for="dict in sys_notice_type"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                        />
                     </el-select>
                  </el-form-item>
               </el-col>
               <el-col :span="24">
                  <el-form-item label="状态">
                     <el-radio-group v-model="form.status">
                        <el-radio
                           v-for="dict in sys_notice_status"
                           :key="dict.value"
                           :value="dict.value"
                        >{{ dict.label }}</el-radio>
                     </el-radio-group>
                  </el-form-item>
               </el-col>
               <el-col :span="24">
                  <el-form-item label="发布范围" prop="publishScopeType">
                     <el-radio-group v-model="form.publishScopeType">
                        <el-radio
                           v-for="item in publishScopeOptions"
                           :key="item.value"
                           :value="item.value"
                        >{{ item.label }}</el-radio>
                     </el-radio-group>
                  </el-form-item>
               </el-col>
               <el-col :span="24" v-if="form.publishScopeType === '2'">
                  <el-form-item label="指定单位" prop="publishDeptIds">
                     <el-tree-select
                        v-model="form.publishDeptIds"
                        :data="deptOptions"
                        :props="{ value: 'id', label: 'label', children: 'children' }"
                        value-key="id"
                        placeholder="请选择可阅读公告的本地单位"
                        clearable
                        check-strictly
                        multiple
                        show-checkbox
                        collapse-tags
                        collapse-tags-tooltip
                        style="width: 100%"
                     />
                     <div class="form-tip">命中规则：所选本地单位及其全部下级单位都可在公告中心查看。</div>
                  </el-form-item>
               </el-col>
               <el-col :span="24">
                  <el-form-item label="内容">
                    <editor v-model="form.noticeContent" :min-height="192"/>
                  </el-form-item>
               </el-col>
            </el-row>
         </el-form>
         <template #footer>
            <div class="dialog-footer">
               <el-button type="primary" @click="submitForm">确 定</el-button>
               <el-button @click="cancel">取 消</el-button>
            </div>
         </template>
      </el-dialog>

      <el-dialog v-model="previewOpen" title="公告详情" width="860px" append-to-body>
         <div v-loading="previewLoading" class="notice-preview">
            <template v-if="previewNotice.noticeId">
               <div class="notice-preview__header">
                  <h3>{{ previewNotice.noticeTitle }}</h3>
                  <div class="notice-preview__meta">
                     <dict-tag :options="sys_notice_type" :value="previewNotice.noticeType" />
                     <dict-tag :options="sys_notice_status" :value="previewNotice.status" />
                     <span>发布范围：{{ formatPublishScope(previewNotice) }}</span>
                     <span>创建者：{{ previewNotice.createBy || "系统" }}</span>
                     <span>创建时间：{{ parseTime(previewNotice.createTime) }}</span>
                  </div>
               </div>
               <el-divider />
               <div class="notice-preview__content" v-html="previewNotice.noticeContent || '<p>暂无公告内容</p>'"></div>
            </template>
            <el-empty v-else description="未查询到公告详情" />
         </div>
      </el-dialog>
   </div>
</template>

<script setup name="Notice">
import { listNotice, getNotice, delNotice, addNotice, updateNotice } from "@/api/system/notice"
import { deptTreeSelect } from "@/api/system/user"

const { proxy } = getCurrentInstance()
const { sys_notice_status, sys_notice_type } = proxy.useDict("sys_notice_status", "sys_notice_type")

const publishScopeOptions = [
  { label: "全体登录用户", value: "1" },
  { label: "指定本地单位", value: "2" }
]

const noticeList = ref([])
const deptOptions = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")
const previewOpen = ref(false)
const previewLoading = ref(false)
const previewNotice = ref({})

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    noticeTitle: undefined,
    createBy: undefined,
    status: undefined,
    publishScopeType: undefined
  },
  rules: {
    noticeTitle: [{ required: true, message: "公告标题不能为空", trigger: "blur" }],
    noticeType: [{ required: true, message: "公告类型不能为空", trigger: "change" }],
    publishScopeType: [{ required: true, message: "请选择发布范围", trigger: "change" }],
    publishDeptIds: [{
      validator: (rule, value, callback) => {
        if (form.value.publishScopeType === "2" && (!Array.isArray(value) || value.length === 0)) {
          callback(new Error("请选择至少一个本地单位"))
          return
        }
        callback()
      },
      trigger: "change"
    }]
  },
})

const { queryParams, form, rules } = toRefs(data)

function getList() {
  loading.value = true
  listNotice(queryParams.value).then(response => {
    noticeList.value = response.rows || []
    total.value = response.total || 0
  }).finally(() => {
    loading.value = false
  })
}

function getDeptOptions() {
  deptTreeSelect().then(response => {
    deptOptions.value = response.data || []
  })
}

function cancel() {
  open.value = false
  reset()
}

function reset() {
  form.value = {
    noticeId: undefined,
    noticeTitle: undefined,
    noticeType: undefined,
    noticeContent: undefined,
    status: "0",
    publishScopeType: "1",
    publishDeptIds: []
  }
  proxy.resetForm("noticeRef")
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.noticeId)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

function handleAdd() {
  reset()
  open.value = true
  title.value = "添加公告"
}

function handleUpdate(row) {
  reset()
  const noticeId = row.noticeId || ids.value
  getNotice(noticeId).then(response => {
    form.value = response.data || {}
    form.value.publishScopeType = form.value.publishScopeType || "1"
    form.value.publishDeptIds = form.value.publishDeptIds || []
    open.value = true
    title.value = "修改公告"
  })
}

function handlePreview(row) {
  const noticeId = row.noticeId || ids.value?.[0]
  if (!noticeId) {
    return
  }
  previewLoading.value = true
  getNotice(noticeId).then(response => {
    previewNotice.value = response.data || {}
    previewOpen.value = true
  }).finally(() => {
    previewLoading.value = false
  })
}

function submitForm() {
  proxy.$refs["noticeRef"].validate(valid => {
    if (valid) {
      const submitData = {
        ...form.value,
        publishDeptIds: form.value.publishScopeType === "2" ? (form.value.publishDeptIds || []) : []
      }
      if (form.value.noticeId !== undefined) {
        updateNotice(submitData).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addNotice(submitData).then(() => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

function handleDelete(row) {
  const noticeIds = row.noticeId || ids.value
  proxy.$modal.confirm('是否确认删除公告编号为"' + noticeIds + '"的数据项？').then(function() {
    return delNotice(noticeIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

function formatPublishScope(row) {
  if (!row || !row.publishScopeType || row.publishScopeType === "1") {
    return "全体登录用户"
  }
  return row.publishDeptNames || "指定本地单位"
}

getDeptOptions()
getList()
</script>

<style lang="scss" scoped>
.form-tip {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: #6b7280;
}

.notice-title-button {
  max-width: 100%;
  padding: 0;
}

.notice-title-text {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice-preview__header h3 {
  margin: 0;
  font-size: 22px;
  line-height: 1.5;
  color: #1f2a44;
}

.notice-preview__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
  font-size: 13px;
  color: #667085;
}

.notice-preview__content {
  min-height: 180px;
  line-height: 1.75;
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
    border: 1px solid #d0d7e2;
    padding: 8px 10px;
  }
}
</style>
