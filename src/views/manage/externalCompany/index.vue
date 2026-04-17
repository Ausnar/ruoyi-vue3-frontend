<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="88px">
      <el-form-item label="外部单位" prop="externalCompanyName">
        <el-input
          v-model="queryParams.externalCompanyName"
          placeholder="请输入外部单位名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="首次来源" prop="firstSourceType">
        <el-select v-model="queryParams.firstSourceType" placeholder="请选择首次来源" clearable>
          <el-option v-for="item in sourceTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="SDK状态" prop="sdkObserved">
        <el-select v-model="queryParams.sdkObserved" placeholder="请选择SDK状态" clearable>
          <el-option v-for="item in observedOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="人工状态" prop="manualCreated">
        <el-select v-model="queryParams.manualCreated" placeholder="请选择人工状态" clearable>
          <el-option v-for="item in manualOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="记录状态" prop="recordStatus">
        <el-select v-model="queryParams.recordStatus" placeholder="请选择记录状态" clearable>
          <el-option v-for="item in recordStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
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
          v-hasPermi="['manage:externalCompany:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate()"
          v-hasPermi="['manage:externalCompany:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['manage:externalCompany:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="companyList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="记录ID" align="center" prop="companyRecordId" width="90" />
      <el-table-column label="外部单位ID" align="center" prop="externalCompanyId" width="120" />
      <el-table-column label="外部单位名称" align="center" min-width="260" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ buildDisplayName(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="首次来源" align="center" prop="firstSourceType" width="100">
        <template #default="scope">
          <span>{{ labelOf(scope.row.firstSourceType, sourceTypeOptions) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="SDK状态" align="center" prop="sdkObserved" width="110">
        <template #default="scope">
          <el-tag :type="scope.row.sdkObserved === '1' ? 'success' : 'info'">
            {{ labelOf(scope.row.sdkObserved, observedOptions) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="人工状态" align="center" prop="manualCreated" width="110">
        <template #default="scope">
          <el-tag :type="scope.row.manualCreated === '1' ? 'warning' : 'info'">
            {{ labelOf(scope.row.manualCreated, manualOptions) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="当前映射合同单位" align="center" prop="mappedDeptName" min-width="180" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ scope.row.mappedDeptName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="最近来源单位" align="center" prop="lastSourceDeptName" min-width="160" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ scope.row.lastSourceDeptName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="最近观测时间" align="center" prop="lastSeenTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.lastSeenTime, '{y}-{m}-{d} {h}:{i}:{s}') || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="记录状态" align="center" prop="recordStatus" width="110">
        <template #default="scope">
          <el-tag :type="recordStatusTag(scope.row.recordStatus)">{{ labelOf(scope.row.recordStatus, recordStatusOptions) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="340">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['manage:externalCompany:edit']">修改</el-button>
          <el-button link type="primary" icon="Connection" @click="handleOpenDuplicates(scope.row)" v-hasPermi="['manage:externalCompany:merge']">并档</el-button>
          <el-button link type="primary" icon="Share" @click="handleGoMapping(scope.row)" v-hasPermi="['manage:companyDeptMapping:list']">去映射</el-button>
          <el-button
            link
            :type="scope.row.recordStatus === 'active' ? 'danger' : 'success'"
            icon="Switch"
            @click="handleToggle(scope.row)"
            v-hasPermi="['manage:externalCompany:edit']"
            v-if="scope.row.recordStatus !== 'merged'"
          >{{ scope.row.recordStatus === 'active' ? '停用' : '启用' }}</el-button>
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

    <el-dialog :title="title" v-model="open" width="720px" append-to-body>
      <el-form ref="companyRef" :model="form" :rules="rules" label-width="112px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="SDK原始名称" prop="externalCompanyName">
              <el-input v-model="form.externalCompanyName" placeholder="请输入外部单位名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="人工治理名" prop="manualConfirmedName">
              <el-input v-model="form.manualConfirmedName" placeholder="选填，用于补充治理名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="编号前缀" prop="numberPrefix">
              <el-input v-model="form.numberPrefix" placeholder="选填" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="组织路径" prop="orgPath">
              <el-input v-model="form.orgPath" placeholder="选填" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="记录状态" prop="recordStatus">
              <el-select v-model="form.recordStatus" style="width: 100%" placeholder="请选择记录状态">
                <el-option
                  v-for="item in editableRecordStatusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当前映射合同单位">
              <el-input :model-value="form.mappedDeptName || '-'" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确定</el-button>
          <el-button @click="cancel">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog title="外部单位并档" v-model="duplicateOpen" width="1100px" append-to-body>
      <el-alert
        title="并档后会保留目标记录作为主记录，SDK观测字段优先采用SDK记录，人工治理信息会尽量保留。"
        type="warning"
        :closable="false"
        class="mb16"
      />
      <el-descriptions :column="2" border v-if="currentCompany.companyRecordId">
        <el-descriptions-item label="当前记录">{{ buildDisplayName(currentCompany) }}</el-descriptions-item>
        <el-descriptions-item label="当前映射合同单位">{{ currentCompany.mappedDeptName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="首次来源">{{ labelOf(currentCompany.firstSourceType, sourceTypeOptions) }}</el-descriptions-item>
        <el-descriptions-item label="最近观测时间">{{ parseTime(currentCompany.lastSeenTime, '{y}-{m}-{d} {h}:{i}:{s}') || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-form label-width="88px" style="margin-top: 16px;">
        <el-form-item label="并档备注">
          <el-input v-model="mergeReason" type="textarea" :rows="2" placeholder="选填，记录并档原因" />
        </el-form-item>
      </el-form>
      <el-table :data="duplicateList" v-loading="duplicateLoading" max-height="420">
        <el-table-column label="候选记录ID" prop="companyRecordId" width="110" />
        <el-table-column label="候选外部单位" min-width="260" :show-overflow-tooltip="true">
          <template #default="scope">
            <span>{{ buildDisplayName(scope.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="匹配类型" prop="duplicateMatchType" width="120" />
        <el-table-column label="匹配说明" prop="duplicateMatchReason" min-width="220" :show-overflow-tooltip="true" />
        <el-table-column label="当前映射合同单位" prop="mappedDeptName" min-width="170" :show-overflow-tooltip="true">
          <template #default="scope">
            <span>{{ scope.row.mappedDeptName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="最近观测时间" prop="lastSeenTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.lastSeenTime, '{y}-{m}-{d} {h}:{i}:{s}') || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="并档操作" align="center" width="210">
          <template #default="scope">
            <el-button
              link
              type="primary"
              @click="handleMerge(scope.row.companyRecordId, currentCompany.companyRecordId)"
              v-if="canMergeToCurrent(scope.row)"
            >并入当前</el-button>
            <el-button
              link
              type="success"
              @click="handleMerge(currentCompany.companyRecordId, scope.row.companyRecordId)"
              v-if="canMergeToCandidate(scope.row)"
            >并入该项</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="duplicateOpen = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ExternalCompany">
import { useRouter } from 'vue-router'
import {
  addExternalCompany,
  getExternalCompany,
  listExternalCompany,
  listExternalCompanyDuplicates,
  mergeExternalCompany,
  toggleExternalCompany,
  updateExternalCompany
} from '@/api/manage/externalCompany'

const { proxy } = getCurrentInstance()
const router = useRouter()

const companyList = ref([])
const loading = ref(false)
const showSearch = ref(true)
const single = ref(true)
const total = ref(0)
const ids = ref([])
const open = ref(false)
const duplicateOpen = ref(false)
const duplicateLoading = ref(false)
const title = ref('')
const duplicateList = ref([])
const mergeReason = ref('')

const currentCompany = reactive({})

const sourceTypeOptions = [
  { label: 'SDK', value: 'sdk' },
  { label: '人工', value: 'manual' }
]

const observedOptions = [
  { label: '已观测', value: '1' },
  { label: '未观测', value: '0' }
]

const manualOptions = [
  { label: '人工补录', value: '1' },
  { label: '非人工补录', value: '0' }
]

const recordStatusOptions = [
  { label: '生效', value: 'active' },
  { label: '停用', value: 'disabled' },
  { label: '已并档', value: 'merged' }
]

const editableRecordStatusOptions = recordStatusOptions.filter(item => item.value !== 'merged')

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    externalCompanyName: null,
    firstSourceType: null,
    sdkObserved: null,
    manualCreated: null,
    recordStatus: 'active'
  },
  rules: {
    externalCompanyName: [{ required: true, message: '请输入外部单位名称', trigger: 'blur' }],
    recordStatus: [{ required: true, message: '请选择记录状态', trigger: 'change' }]
  }
})

const { form, queryParams, rules } = toRefs(data)

function getList() {
  loading.value = true
  listExternalCompany(queryParams.value).then(response => {
    companyList.value = response.rows || []
    total.value = response.total || 0
  }).finally(() => {
    loading.value = false
  })
}

function reset() {
  form.value = {
    companyRecordId: null,
    externalCompanyId: null,
    externalCompanyName: null,
    manualConfirmedName: null,
    numberPrefix: null,
    orgPath: null,
    mappedDeptName: null,
    recordStatus: 'active',
    remark: null
  }
  proxy.resetForm('companyRef')
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  queryParams.value.recordStatus = 'active'
  handleQuery()
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.companyRecordId)
  single.value = selection.length !== 1
}

function handleAdd() {
  reset()
  open.value = true
  title.value = '新增外部单位'
}

function handleUpdate(row) {
  reset()
  const companyRecordId = row?.companyRecordId || ids.value[0]
  getExternalCompany(companyRecordId).then(response => {
    form.value = {
      ...response.data,
      recordStatus: response.data.recordStatus || 'active'
    }
    open.value = true
    title.value = '修改外部单位'
  })
}

function submitForm() {
  proxy.$refs.companyRef.validate(valid => {
    if (!valid) return
    const action = form.value.companyRecordId ? updateExternalCompany : addExternalCompany
    action(form.value).then(() => {
      proxy.$modal.msgSuccess(form.value.companyRecordId ? '修改成功' : '新增成功')
      open.value = false
      getList()
    })
  })
}

function cancel() {
  open.value = false
  reset()
}

function handleToggle(row) {
  const actionText = row.recordStatus === 'active' ? '停用' : '启用'
  proxy.$modal.confirm(`确认要${actionText}外部单位【${buildDisplayName(row)}】吗？`).then(() => {
    return toggleExternalCompany(row.companyRecordId)
  }).then(() => {
    proxy.$modal.msgSuccess(actionText + '成功')
    getList()
  }).catch(() => {})
}

function handleOpenDuplicates(row) {
  Object.assign(currentCompany, row)
  mergeReason.value = ''
  duplicateOpen.value = true
  duplicateLoading.value = true
  listExternalCompanyDuplicates(row.companyRecordId).then(response => {
    duplicateList.value = response.data || []
  }).finally(() => {
    duplicateLoading.value = false
  })
}

function handleMerge(sourceCompanyRecordId, targetCompanyRecordId) {
  proxy.$modal.confirm('确认执行外部单位并档吗？并档后会保留目标记录作为主记录。').then(() => {
    return mergeExternalCompany({
      sourceCompanyRecordId,
      targetCompanyRecordId,
      mergeReason: mergeReason.value
    })
  }).then(() => {
    proxy.$modal.msgSuccess('并档成功')
    duplicateOpen.value = false
    getList()
  }).catch(() => {})
}

function handleGoMapping(row) {
  router.push({
    path: '/unitCenter/companyDeptMapping',
    query: {
      externalCompanyId: row.externalCompanyId,
      externalCompanyName: row.externalCompanyName
    }
  })
}

function handleExport() {
  proxy.download(
    'manage/externalCompany/export',
    { ...queryParams.value },
    `external_company_${new Date().getTime()}.xlsx`
  )
}

function buildDisplayName(row) {
  if (row.manualConfirmedName && row.manualConfirmedName !== row.externalCompanyName) {
    return `${row.externalCompanyName} / ${row.manualConfirmedName}`
  }
  return row.externalCompanyName || row.manualConfirmedName || '-'
}

function labelOf(value, options) {
  const matched = options.find(item => item.value === value)
  return matched ? matched.label : (value || '-')
}

function recordStatusTag(value) {
  if (value === 'active') return 'success'
  if (value === 'disabled') return 'warning'
  return 'info'
}

function canMergeToCurrent(candidate) {
  return currentCompany.sdkObserved === '1' || candidate.sdkObserved !== '1'
}

function canMergeToCandidate(candidate) {
  return candidate.sdkObserved === '1' || currentCompany.sdkObserved !== '1'
}

getList()
</script>
