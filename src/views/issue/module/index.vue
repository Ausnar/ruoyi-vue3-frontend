<template>
  <div class="app-container">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="88px">
      <el-form-item label="项目" prop="projectId">
        <el-select v-model="queryParams.projectId" placeholder="请选择项目" clearable filterable style="width: 220px">
          <el-option v-for="item in projectOptions" :key="item.projectId" :label="item.projectName" :value="item.projectId" />
        </el-select>
      </el-form-item>
      <el-form-item label="模块名称" prop="moduleName">
        <el-input v-model="queryParams.moduleName" placeholder="请输入模块名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 140px">
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
          v-hasPermi="['issue:module:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate()"
          v-hasPermi="['issue:module:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['issue:module:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="moduleList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="模块ID" align="center" prop="moduleId" width="90" />
      <el-table-column label="项目名称" align="center" prop="projectName" min-width="180" :show-overflow-tooltip="true" />
      <el-table-column label="模块名称" align="center" prop="moduleName" min-width="180" :show-overflow-tooltip="true" />
      <el-table-column label="排序" align="center" prop="sortOrder" width="100" />
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
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['issue:module:edit']">修改</el-button>
          <el-button link :type="scope.row.status === 'active' ? 'danger' : 'success'" icon="Switch" @click="handleToggle(scope.row)" v-hasPermi="['issue:module:edit']">
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

    <el-dialog :title="title" v-model="open" width="680px" append-to-body>
      <el-form ref="moduleRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="所属项目" prop="projectId">
          <el-select v-model="form.projectId" filterable placeholder="请选择项目" style="width: 100%">
            <el-option v-for="item in projectOptions" :key="item.projectId" :label="item.projectName" :value="item.projectId" />
          </el-select>
        </el-form-item>
        <el-form-item label="模块名称" prop="moduleName">
          <el-input v-model="form.moduleName" placeholder="请输入模块名称" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="1" controls-position="right" style="width: 100%" />
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

<script setup name="IssueProjectModule">
import { listIssueProject } from '@/api/issue/project'
import {
  addIssueProjectModule,
  getIssueProjectModule,
  listIssueProjectModule,
  toggleIssueProjectModule,
  updateIssueProjectModule
} from '@/api/issue/module'

const { proxy } = getCurrentInstance()

const moduleList = ref([])
const projectOptions = ref([])
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
    projectId: null,
    moduleName: null,
    status: null
  },
  rules: {
    projectId: [{ required: true, message: '请选择项目', trigger: 'change' }],
    moduleName: [{ required: true, message: '请输入模块名称', trigger: 'blur' }],
    sortOrder: [{ required: true, message: '请输入排序', trigger: 'change' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
  }
})

const { form, queryParams, rules } = toRefs(data)

function getList() {
  loading.value = true
  listIssueProjectModule(queryParams.value).then(response => {
    moduleList.value = response.rows
    total.value = response.total
  }).finally(() => {
    loading.value = false
  })
}

function getProjectOptions() {
  return listIssueProject({ pageNum: 1, pageSize: 9999 }).then(response => {
    projectOptions.value = response.rows || []
  })
}

function reset() {
  form.value = {
    moduleId: null,
    projectId: null,
    moduleName: null,
    sortOrder: 1,
    status: 'active',
    remark: null
  }
  proxy.resetForm('moduleRef')
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
  ids.value = selection.map(item => item.moduleId)
  single.value = selection.length !== 1
}

function handleAdd() {
  reset()
  open.value = true
  title.value = '新增项目模块'
}

function handleUpdate(row) {
  reset()
  const moduleId = row?.moduleId || ids.value[0]
  getIssueProjectModule(moduleId).then(response => {
    form.value = response.data
    open.value = true
    title.value = '修改项目模块'
  })
}

function submitForm() {
  proxy.$refs.moduleRef.validate(valid => {
    if (!valid) {
      return
    }
    const request = form.value.moduleId ? updateIssueProjectModule(form.value) : addIssueProjectModule(form.value)
    request.then(() => {
      proxy.$modal.msgSuccess(form.value.moduleId ? '修改成功' : '新增成功')
      open.value = false
      getList()
    })
  })
}

function handleToggle(row) {
  const text = row.status === 'active' ? '停用' : '启用'
  proxy.$modal.confirm(`确认要${text}项目模块“${row.moduleName}”吗？`).then(() => {
    return toggleIssueProjectModule(row.moduleId)
  }).then(() => {
    proxy.$modal.msgSuccess(`${text}成功`)
    getList()
  }).catch(() => {})
}

function handleExport() {
  proxy.download('issue/project-module/export', { ...queryParams.value }, `issue_project_module_${new Date().getTime()}.xlsx`)
}

function cancel() {
  open.value = false
  reset()
}

getProjectOptions()
getList()
</script>
