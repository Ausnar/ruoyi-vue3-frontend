<template>
  <div class="app-container">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="88px">
      <el-form-item label="项目" prop="projectId">
        <el-select
          v-model="queryParams.projectId"
          placeholder="请选择项目"
          clearable
          filterable
          style="width: 180px"
          @change="handleQueryProjectChange"
        >
          <el-option v-for="item in projectOptions" :key="item.projectId" :label="item.projectName" :value="item.projectId" />
        </el-select>
      </el-form-item>
      <el-form-item label="模块" prop="moduleId">
        <el-select
          v-model="queryParams.moduleId"
          placeholder="请选择模块"
          clearable
          filterable
          style="width: 180px"
          :disabled="!queryParams.projectId"
        >
          <el-option v-for="item in queryModuleOptions" :key="item.moduleId" :label="item.moduleName" :value="item.moduleId" />
        </el-select>
      </el-form-item>
      <el-form-item label="优先级" prop="priority">
        <el-select v-model="queryParams.priority" placeholder="请选择优先级" clearable style="width: 120px">
          <el-option v-for="item in priorityOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 140px">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="责任侧" prop="ownerSide">
        <el-select v-model="queryParams.ownerSide" placeholder="请选择责任侧" clearable style="width: 140px">
          <el-option v-for="item in ownerSideOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键字" prop="keyword">
        <el-input v-model="queryParams.keyword" placeholder="问题/说明/状态说明" clearable @keyup.enter="handleQuery" />
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
          v-hasPermi="['issue:item:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate()"
          v-hasPermi="['issue:item:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['issue:item:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['issue:item:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="itemList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="issueId" width="90" />
      <el-table-column label="项目" align="center" prop="projectName" min-width="160" :show-overflow-tooltip="true" />
      <el-table-column label="模块" align="center" prop="moduleNameSnapshot" width="140" :show-overflow-tooltip="true" />
      <el-table-column label="问题" align="center" prop="issueTitle" min-width="260" :show-overflow-tooltip="true" />
      <el-table-column label="优先级" align="center" prop="priority" width="90">
        <template #default="scope">
          <el-tag :type="priorityTag(scope.row.priority)">{{ scope.row.priority }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="110">
        <template #default="scope">
          <el-tag :type="statusTag(scope.row.status)">{{ labelOf(scope.row.status, statusOptions) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="责任侧" align="center" prop="ownerSide" width="110">
        <template #default="scope">
          <span>{{ labelOf(scope.row.ownerSide, ownerSideOptions) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="说明" align="center" prop="currentSummary" min-width="280" :show-overflow-tooltip="true" />
      <el-table-column label="更新时间" align="center" prop="updateTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.updateTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="220">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleView(scope.row)" v-hasPermi="['issue:item:query']">查看</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['issue:item:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['issue:item:remove']">删除</el-button>
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

    <el-dialog :title="title" v-model="open" width="920px" append-to-body>
      <el-form ref="itemRef" :model="form" :rules="rules" label-width="96px" :disabled="viewMode">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="项目" prop="projectId">
              <el-select
                v-model="form.projectId"
                filterable
                placeholder="请选择项目"
                style="width: 100%"
                @change="handleFormProjectChange"
              >
                <el-option v-for="item in projectOptions" :key="item.projectId" :label="item.projectName" :value="item.projectId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模块" prop="moduleId">
              <el-select
                v-model="form.moduleId"
                placeholder="请选择模块"
                filterable
                style="width: 100%"
                :disabled="!form.projectId"
              >
                <el-option v-for="item in formModuleOptions" :key="item.moduleId" :label="item.moduleName" :value="item.moduleId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="问题" prop="issueTitle">
              <el-input v-model="form.issueTitle" placeholder="请输入问题" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="form.priority" style="width: 100%">
                <el-option v-for="item in priorityOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" style="width: 100%">
                <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="责任侧" prop="ownerSide">
              <el-select v-model="form.ownerSide" style="width: 100%">
                <el-option v-for="item in ownerSideOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="说明" prop="currentSummary">
              <el-input v-model="form.currentSummary" type="textarea" :rows="3" placeholder="请输入说明" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="状态说明" prop="statusDetail">
              <el-input
                v-model="form.statusDetail"
                type="textarea"
                :rows="2"
                placeholder="请输入当前进展，如待后端回复、已定位未修复"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24" v-if="!viewMode">
            <el-form-item label="变更说明" prop="changeSummary">
              <el-input v-model="form.changeSummary" type="textarea" :rows="2" placeholder="状态或责任侧变更时必填" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <el-divider content-position="left" v-if="form.issueId">状态日志</el-divider>
      <el-table v-if="form.issueId" :data="logList" max-height="260" border>
        <el-table-column label="时间" align="center" prop="createTime" width="170">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作人" align="center" prop="operator" width="120" />
        <el-table-column label="状态变化" align="center" min-width="160">
          <template #default="scope">
            <span>{{ scope.row.fromStatus ? labelOf(scope.row.fromStatus, statusOptions) : '创建' }} → {{ labelOf(scope.row.toStatus, statusOptions) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="责任侧变化" align="center" min-width="160">
          <template #default="scope">
            <span>{{ scope.row.fromOwnerSide ? labelOf(scope.row.fromOwnerSide, ownerSideOptions) : '创建' }} → {{ labelOf(scope.row.toOwnerSide, ownerSideOptions) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="变更说明" align="center" prop="changeSummary" min-width="260" :show-overflow-tooltip="true" />
      </el-table>

      <template #footer>
        <div class="dialog-footer">
          <el-button v-if="!viewMode" type="primary" @click="submitForm">确定</el-button>
          <el-button @click="cancel">{{ viewMode ? '关闭' : '取消' }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="IssueItem">
import { listIssueProject } from '@/api/issue/project'
import { listActiveIssueProjectModules } from '@/api/issue/module'
import { addIssueItem, delIssueItem, getIssueItem, listIssueItem, listIssueItemLogs, updateIssueItem } from '@/api/issue/item'

const { proxy } = getCurrentInstance()

const itemList = ref([])
const logList = ref([])
const projectOptions = ref([])
const queryModuleOptions = ref([])
const formModuleOptions = ref([])
const loading = ref(false)
const showSearch = ref(true)
const open = ref(false)
const title = ref('')
const total = ref(0)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const viewMode = ref(false)
const originalStatus = ref(null)
const originalOwnerSide = ref(null)

const priorityOptions = [
  { label: 'P1', value: 'P1' },
  { label: 'P2', value: 'P2' },
  { label: 'P3', value: 'P3' }
]

const statusOptions = [
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'in_progress' },
  { label: '已解决', value: 'resolved' },
  { label: '已关闭', value: 'closed' }
]

const ownerSideOptions = [
  { label: '前端', value: 'frontend' },
  { label: '后端', value: 'backend' },
  { label: '前后端', value: 'fullstack' },
  { label: '其他', value: 'other' }
]

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    projectId: null,
    moduleId: null,
    priority: null,
    status: null,
    ownerSide: null,
    keyword: null
  },
  rules: {
    projectId: [{ required: true, message: '请选择项目', trigger: 'change' }],
    moduleId: [{ required: true, message: '请选择模块', trigger: 'change' }],
    issueTitle: [{ required: true, message: '请输入问题', trigger: 'blur' }],
    priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
    ownerSide: [{ required: true, message: '请选择责任侧', trigger: 'change' }],
    currentSummary: [{ required: true, message: '请输入说明', trigger: 'blur' }],
    changeSummary: [{
      validator: (rule, value, callback) => {
        if (!form.value.issueId) {
          callback()
          return
        }
        if (form.value.status !== originalStatus.value || form.value.ownerSide !== originalOwnerSide.value) {
          if (!value) {
            callback(new Error('状态或责任侧变更时请输入变更说明'))
            return
          }
        }
        callback()
      },
      trigger: 'blur'
    }]
  }
})

const { form, queryParams, rules } = toRefs(data)

function getList() {
  loading.value = true
  listIssueItem(queryParams.value).then(response => {
    itemList.value = response.rows
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

function loadQueryModules(projectId) {
  if (!projectId) {
    queryModuleOptions.value = []
    return Promise.resolve()
  }
  return listActiveIssueProjectModules(projectId).then(response => {
    queryModuleOptions.value = response.data || []
  })
}

function loadFormModules(projectId) {
  if (!projectId) {
    formModuleOptions.value = []
    return Promise.resolve()
  }
  return listActiveIssueProjectModules(projectId).then(response => {
    formModuleOptions.value = response.data || []
  })
}

function reset() {
  form.value = {
    issueId: null,
    projectId: null,
    moduleId: null,
    moduleNameSnapshot: null,
    issueTitle: null,
    priority: 'P2',
    status: 'pending',
    ownerSide: 'backend',
    currentSummary: null,
    statusDetail: null,
    changeSummary: null,
    remark: null
  }
  formModuleOptions.value = []
  originalStatus.value = null
  originalOwnerSide.value = null
  logList.value = []
  proxy.resetForm('itemRef')
}

function labelOf(value, options) {
  return options.find(item => item.value === value)?.label || value || '-'
}

function priorityTag(priority) {
  if (priority === 'P1') return 'danger'
  if (priority === 'P2') return 'warning'
  return 'info'
}

function statusTag(status) {
  if (status === 'resolved') return 'success'
  if (status === 'closed') return 'info'
  if (status === 'in_progress') return 'warning'
  return 'danger'
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  queryModuleOptions.value = []
  handleQuery()
}

function handleQueryProjectChange(projectId) {
  queryParams.value.moduleId = null
  loadQueryModules(projectId)
}

function handleFormProjectChange(projectId) {
  form.value.moduleId = null
  loadFormModules(projectId)
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.issueId)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

function handleAdd() {
  reset()
  viewMode.value = false
  open.value = true
  title.value = '新增问题事项'
}

async function loadItem(issueId, readOnly) {
  reset()
  viewMode.value = readOnly
  const response = await getIssueItem(issueId)
  await loadFormModules(response.data.projectId)
  form.value = {
    ...response.data,
    changeSummary: null
  }
  originalStatus.value = response.data.status
  originalOwnerSide.value = response.data.ownerSide
  const logResponse = await listIssueItemLogs(issueId)
  logList.value = logResponse.data || []
  open.value = true
  title.value = readOnly ? '查看问题事项' : '修改问题事项'
}

function handleUpdate(row) {
  const issueId = row?.issueId || ids.value[0]
  loadItem(issueId, false)
}

function handleView(row) {
  loadItem(row.issueId, true)
}

function submitForm() {
  proxy.$refs.itemRef.validate(valid => {
    if (!valid) {
      return
    }
    const request = form.value.issueId ? updateIssueItem(form.value) : addIssueItem(form.value)
    request.then(() => {
      proxy.$modal.msgSuccess(form.value.issueId ? '修改成功' : '新增成功')
      open.value = false
      getList()
    })
  })
}

function handleDelete(row) {
  const issueIds = row?.issueId || ids.value
  proxy.$modal.confirm(`确认要删除问题事项编号“${issueIds}”吗？`).then(() => {
    return delIssueItem(issueIds)
  }).then(() => {
    proxy.$modal.msgSuccess('删除成功')
    getList()
  }).catch(() => {})
}

function handleExport() {
  proxy.download('issue/item/export', { ...queryParams.value }, `issue_item_${new Date().getTime()}.xlsx`)
}

function cancel() {
  open.value = false
  viewMode.value = false
  reset()
}

getProjectOptions()
getList()
</script>
