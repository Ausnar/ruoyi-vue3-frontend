<template>
  <div class="app-container">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="88px">
      <el-form-item label="项目名称" prop="projectName">
        <el-input v-model="queryParams.projectName" placeholder="请输入项目名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="项目编码" prop="projectCode">
        <el-input v-model="queryParams.projectCode" placeholder="请输入项目编码" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
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
          v-hasPermi="['issue:project:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate()"
          v-hasPermi="['issue:project:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['issue:project:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="projectList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="项目ID" align="center" prop="projectId" width="90" />
      <el-table-column label="项目名称" align="center" prop="projectName" min-width="180" :show-overflow-tooltip="true" />
      <el-table-column label="项目编码" align="center" prop="projectCode" width="140" />
      <el-table-column label="状态" align="center" prop="status" width="110">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
            {{ statusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="220" :show-overflow-tooltip="true" />
      <el-table-column label="更新时间" align="center" prop="updateTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.updateTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="220">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['issue:project:edit']">修改</el-button>
          <el-button link :type="scope.row.status === 'active' ? 'danger' : 'success'" icon="Switch" @click="handleToggle(scope.row)" v-hasPermi="['issue:project:edit']">
            {{ scope.row.status === 'active' ? '停用' : '启用' }}
          </el-button>
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

    <el-dialog :title="title" v-model="open" width="640px" append-to-body>
      <el-form ref="projectRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="项目名称" prop="projectName">
          <el-input v-model="form.projectName" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目编码" prop="projectCode">
          <el-input v-model="form.projectCode" placeholder="请输入项目编码" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" style="width: 100%">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确定</el-button>
          <el-button @click="cancel">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="IssueProject">
import { addIssueProject, getIssueProject, listIssueProject, toggleIssueProject, updateIssueProject } from '@/api/issue/project'

const { proxy } = getCurrentInstance()

const projectList = ref([])
const loading = ref(false)
const showSearch = ref(true)
const open = ref(false)
const title = ref('')
const total = ref(0)
const ids = ref([])
const single = ref(true)

const statusOptions = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' }
]

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    projectName: null,
    projectCode: null,
    status: null
  },
  rules: {
    projectName: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
    projectCode: [{ required: true, message: '请输入项目编码', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
  }
})

const { form, queryParams, rules } = toRefs(data)

function getList() {
  loading.value = true
  listIssueProject(queryParams.value).then(response => {
    projectList.value = response.rows
    total.value = response.total
  }).finally(() => {
    loading.value = false
  })
}

function reset() {
  form.value = {
    projectId: null,
    projectName: null,
    projectCode: null,
    status: 'active',
    remark: null
  }
  proxy.resetForm('projectRef')
}

function statusLabel(value) {
  return statusOptions.find(item => item.value === value)?.label || value || '-'
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  handleQuery()
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.projectId)
  single.value = selection.length !== 1
}

function handleAdd() {
  reset()
  open.value = true
  title.value = '新增项目'
}

function handleUpdate(row) {
  reset()
  const projectId = row?.projectId || ids.value[0]
  getIssueProject(projectId).then(response => {
    form.value = response.data
    open.value = true
    title.value = '修改项目'
  })
}

function submitForm() {
  proxy.$refs.projectRef.validate(valid => {
    if (!valid) {
      return
    }
    const request = form.value.projectId ? updateIssueProject(form.value) : addIssueProject(form.value)
    request.then(() => {
      proxy.$modal.msgSuccess(form.value.projectId ? '修改成功' : '新增成功')
      open.value = false
      getList()
    })
  })
}

function handleToggle(row) {
  const text = row.status === 'active' ? '停用' : '启用'
  proxy.$modal.confirm(`确认要${text}项目“${row.projectName}”吗？`).then(() => {
    return toggleIssueProject(row.projectId)
  }).then(() => {
    proxy.$modal.msgSuccess(`${text}成功`)
    getList()
  }).catch(() => {})
}

function handleExport() {
  proxy.download('issue/project/export', { ...queryParams.value }, `issue_project_${new Date().getTime()}.xlsx`)
}

function cancel() {
  open.value = false
  reset()
}

getList()
</script>
