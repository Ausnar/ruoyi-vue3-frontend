<template>
  <div class="app-container">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="88px">
      <el-form-item label="拜访单号" prop="visitNo">
        <el-input v-model="queryParams.visitNo" placeholder="请输入拜访单号" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="客户名称" prop="customerNameSnapshot">
        <el-input v-model="queryParams.customerNameSnapshot" placeholder="请输入客户名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="客户类型" prop="customerType">
        <el-select v-model="queryParams.customerType" placeholder="请选择客户类型" clearable style="width: 180px">
          <el-option v-for="item in fe_visit_customer_type" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 180px">
          <el-option v-for="item in fe_visit_apply_status" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['visit:apply:add']">新增申请</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="applyList">
      <el-table-column label="拜访单号" align="center" prop="visitNo" width="150" />
      <el-table-column label="客户类型" align="center" prop="customerType" width="120">
        <template #default="scope">
          <dict-tag :options="fe_visit_customer_type" :value="scope.row.customerType" />
        </template>
      </el-table-column>
      <el-table-column label="拜访模式" align="center" prop="visitMode" width="120">
        <template #default="scope">
          <dict-tag :options="fe_visit_mode" :value="scope.row.visitMode" />
        </template>
      </el-table-column>
      <el-table-column label="来源类型" align="center" prop="sourceType" width="160">
        <template #default="scope">
          <dict-tag :options="fe_visit_source_type" :value="scope.row.sourceType" />
        </template>
      </el-table-column>
      <el-table-column label="客户名称" align="center" min-width="240" show-overflow-tooltip>
        <template #default="scope">
          <span>{{ buildCustomerDisplayName(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="计划时间" align="center" min-width="320">
        <template #default="scope">
          <span>{{ parseTime(scope.row.plannedStartTime, '{y}-{m}-{d} {h}:{i}:{s}') }} ~ {{ parseTime(scope.row.plannedEndTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="拜访地址" align="center" prop="visitAddress" min-width="180" show-overflow-tooltip />
      <el-table-column label="状态" align="center" prop="status" width="120">
        <template #default="scope">
          <dict-tag :options="fe_visit_apply_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="审批人" align="center" prop="approveUserName" width="120" />
      <el-table-column label="更新时间" align="center" prop="updateTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.updateTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" min-width="240">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleView(scope.row)" v-hasPermi="['visit:apply:query']">详情</el-button>
          <el-button
            v-if="canEdit(scope.row)"
            link
            type="primary"
            icon="Edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['visit:apply:resubmit']"
          >重提</el-button>
          <el-button
            v-if="canWithdraw(scope.row)"
            link
            type="warning"
            icon="RefreshLeft"
            @click="handleWithdraw(scope.row)"
            v-hasPermi="['visit:apply:withdraw']"
          >撤回</el-button>
          <el-button
            v-if="canFeedback(scope.row)"
            link
            type="success"
            icon="EditPen"
            @click="handleFeedback(scope.row)"
            v-hasPermi="['visit:apply:feedback']"
          >结果回填</el-button>
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

    <el-dialog :title="subjectTitle" v-model="subjectOpen" width="900px" append-to-body>
      <el-form ref="subjectRef" :model="subjectForm" :rules="subjectRules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="客户类型" prop="customerType">
              <el-radio-group v-model="subjectForm.customerType" :disabled="subjectReadonly" @change="handleCustomerTypeChange">
                <el-radio v-for="item in fe_visit_customer_type" :key="item.value" :label="item.value">{{ item.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户选择" prop="customerRefValue">
              <el-select
                v-if="subjectForm.customerType === 'contract'"
                v-model="subjectForm.contractConfigId"
                placeholder="请选择合同客户"
                filterable
                clearable
                style="width: 100%"
                :disabled="subjectReadonly"
              >
                <el-option v-for="item in contractOptions" :key="item.configId" :label="buildContractLabel(item)" :value="item.configId" />
              </el-select>
              <div v-else style="display: flex; gap: 8px; width: 100%">
                <el-select
                  v-model="subjectForm.customerId"
                  placeholder="请选择独立客户"
                  filterable
                  clearable
                  style="flex: 1"
                  :disabled="subjectReadonly"
                >
                  <el-option v-for="item in customerOptions" :key="item.customerId" :label="buildCustomerLabel(item)" :value="item.customerId" />
                </el-select>
                <el-button @click="goCustomerPage" :disabled="subjectReadonly">客户档案</el-button>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计划开始" prop="plannedStartTime">
              <el-date-picker v-model="subjectForm.plannedStartTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择计划开始时间" style="width: 100%" :disabled="subjectReadonly" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计划结束" prop="plannedEndTime">
              <el-date-picker v-model="subjectForm.plannedEndTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择计划结束时间" style="width: 100%" :disabled="subjectReadonly" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="拜访地址" prop="visitAddress">
              <el-input v-model="subjectForm.visitAddress" placeholder="请输入拜访地址" :disabled="subjectReadonly" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="同行人员" prop="companionMembers">
              <el-input v-model="subjectForm.companionMembers" placeholder="请输入同行人员" :disabled="subjectReadonly" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="拜访事由" prop="visitReason">
              <el-input v-model="subjectForm.visitReason" type="textarea" :rows="3" placeholder="请输入拜访事由" :disabled="subjectReadonly" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="拜访目标" prop="visitTarget">
              <el-input v-model="subjectForm.visitTarget" type="textarea" :rows="2" placeholder="请输入拜访目标" :disabled="subjectReadonly" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="subjectForm.remark" type="textarea" :rows="2" placeholder="请输入备注" :disabled="subjectReadonly" />
            </el-form-item>
          </el-col>
          <el-col v-if="subjectMode === 'view' && subjectForm.visitMode === 'passive'" :span="24">
            <el-alert type="info" :closable="false" show-icon>
              <template #title>
                来源：{{ formatDictLabel(fe_visit_source_type, subjectForm.sourceType) || '-' }}，
                位移：{{ subjectForm.triggerDistanceM || '-' }} m，
                现场外部单位：{{ subjectForm.triggerExternalCompanyNameSnapshot || '-' }}，
                起点：{{ buildCoordinate(subjectForm.triggerFromLongitude, subjectForm.triggerFromLatitude) }}，
                终点：{{ buildCoordinate(subjectForm.triggerToLongitude, subjectForm.triggerToLatitude) }}
              </template>
            </el-alert>
          </el-col>
        </el-row>
      </el-form>

      <div v-if="subjectMode === 'view'" class="log-section">
        <div class="section-title">流转日志</div>
        <el-table :data="logList" size="small" border>
          <el-table-column label="时间" prop="actionTime" width="180">
            <template #default="scope">
              <span>{{ parseTime(scope.row.actionTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
            </template>
          </el-table-column>
          <el-table-column label="动作" prop="actionType" width="120" />
          <el-table-column label="操作人" prop="operatorUserName" width="120" />
          <el-table-column label="状态流转" min-width="180">
            <template #default="scope">
              <span>{{ scope.row.fromStatus || '-' }} -> {{ scope.row.toStatus || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="说明" prop="actionComment" min-width="220" show-overflow-tooltip />
        </el-table>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button v-if="!subjectReadonly" type="primary" @click="submitSubjectForm">确定提交</el-button>
          <el-button @click="subjectOpen = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog title="结果回填" v-model="feedbackOpen" width="760px" append-to-body>
      <el-descriptions :column="2" border style="margin-bottom: 16px">
        <el-descriptions-item label="拜访单号">{{ feedbackBase.visitNo }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ buildCustomerDisplayName(feedbackBase) }}</el-descriptions-item>
        <el-descriptions-item v-if="feedbackBase.visitMode === 'passive' && feedbackBase.customerType === 'contract'" label="具体外部单位">
          {{ feedbackBase.triggerExternalCompanyNameSnapshot || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="计划时间" :span="2">{{ feedbackPlanTime }}</el-descriptions-item>
        <el-descriptions-item label="拜访事由" :span="2">{{ feedbackBase.visitReason }}</el-descriptions-item>
      </el-descriptions>
      <el-form ref="feedbackRef" :model="feedbackForm" :rules="feedbackRules" label-width="110px">
        <el-form-item label="实际开始" prop="actualStartTime">
          <el-date-picker v-model="feedbackForm.actualStartTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择实际开始时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="实际结束" prop="actualEndTime">
          <el-date-picker v-model="feedbackForm.actualEndTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择实际结束时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="拜访结论" prop="visitConclusion">
          <el-select v-model="feedbackForm.visitConclusion" placeholder="请选择拜访结论" clearable style="width: 100%">
            <el-option v-for="item in fe_visit_conclusion" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="意向等级" prop="intentionLevel">
          <el-select v-model="feedbackForm.intentionLevel" placeholder="请选择意向等级" clearable style="width: 100%">
            <el-option v-for="item in fe_visit_intention_level" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="下次跟进" prop="nextFollowTime">
          <el-date-picker v-model="feedbackForm.nextFollowTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择下次跟进时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结果附件" prop="resultAttachmentsText">
          <FileUpload v-model="feedbackForm.resultAttachmentsText" :limit="5" />
        </el-form-item>
        <el-form-item label="结果说明" prop="resultDesc">
          <el-input v-model="feedbackForm.resultDesc" type="textarea" :rows="4" placeholder="请输入拜访结果说明" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="feedbackForm.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitFeedbackForm">确定回填</el-button>
          <el-button @click="feedbackOpen = false">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="VisitApply">
import router from '@/router'
import FileUpload from '@/components/FileUpload/index.vue'
import { listVisitCustomer } from '@/api/visit/customer'
import { feedbackVisitApply, getVisitApply, getVisitApplyLogs, listContractOptions, listMyVisitApply, resubmitVisitApply, submitVisitApply, withdrawVisitApply } from '@/api/visit/apply'

const { proxy } = getCurrentInstance()
const { fe_visit_customer_type, fe_visit_apply_status, fe_visit_conclusion, fe_visit_intention_level, fe_visit_mode, fe_visit_source_type } = proxy.useDict(
  'fe_visit_customer_type',
  'fe_visit_apply_status',
  'fe_visit_conclusion',
  'fe_visit_intention_level',
  'fe_visit_mode',
  'fe_visit_source_type'
)

const applyList = ref([])
const contractOptions = ref([])
const customerOptions = ref([])
const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const subjectOpen = ref(false)
const feedbackOpen = ref(false)
const subjectMode = ref('add')
const logList = ref([])
const feedbackBase = ref({})

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    visitNo: null,
    customerNameSnapshot: null,
    customerType: null,
    status: null
  },
  subjectForm: {},
  feedbackForm: {}
})

const { queryParams, subjectForm, feedbackForm } = toRefs(data)

const subjectRules = {
  customerType: [{ required: true, message: '请选择客户类型', trigger: 'change' }],
  plannedStartTime: [{ required: true, message: '请选择计划开始时间', trigger: 'change' }],
  plannedEndTime: [{ required: true, message: '请选择计划结束时间', trigger: 'change' }],
  visitReason: [{ required: true, message: '请输入拜访事由', trigger: 'blur' }]
}

const feedbackRules = {
  resultDesc: [{ required: true, message: '请输入拜访结果说明', trigger: 'blur' }]
}

const subjectTitle = computed(() => {
  if (subjectMode.value === 'add') return '新增拜访申请'
  if (subjectMode.value === 'edit') return '修改并重提'
  return '拜访申请详情'
})

const subjectReadonly = computed(() => subjectMode.value === 'view')
const feedbackPlanTime = computed(() => {
  if (!feedbackBase.value.plannedStartTime) return '-'
  return `${proxy.parseTime(feedbackBase.value.plannedStartTime, '{y}-{m}-{d} {h}:{i}:{s}')} ~ ${proxy.parseTime(feedbackBase.value.plannedEndTime, '{y}-{m}-{d} {h}:{i}:{s}')}`
})

function getList() {
  loading.value = true
  listMyVisitApply(queryParams.value).then(response => {
    applyList.value = response.rows
    total.value = response.total
  }).finally(() => {
    loading.value = false
  })
}

function loadContractOptions() {
  listContractOptions().then(response => {
    contractOptions.value = response.data || []
  })
}

function loadCustomerOptions() {
  listVisitCustomer({ pageNum: 1, pageSize: 1000, status: '0' }).then(response => {
    customerOptions.value = response.rows || []
  })
}

function resetSubjectForm() {
  subjectForm.value = {
    visitId: null,
    customerType: 'contract',
    contractConfigId: null,
    customerId: null,
    visitAddress: null,
    plannedStartTime: null,
    plannedEndTime: null,
    visitReason: null,
    visitTarget: null,
    companionMembers: null,
    remark: null
  }
  logList.value = []
  proxy.resetForm('subjectRef')
}

function resetFeedbackForm() {
  feedbackForm.value = {
    visitId: null,
    actualStartTime: null,
    actualEndTime: null,
    resultDesc: null,
    visitConclusion: null,
    intentionLevel: null,
    nextFollowTime: null,
    resultAttachmentsText: '',
    remark: null
  }
  feedbackBase.value = {}
  proxy.resetForm('feedbackRef')
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  handleQuery()
}

function handleAdd() {
  subjectMode.value = 'add'
  resetSubjectForm()
  subjectOpen.value = true
}

function handleUpdate(row) {
  subjectMode.value = 'edit'
  resetSubjectForm()
  loadSubjectDetail(row.visitId)
}

function handleView(row) {
  subjectMode.value = 'view'
  resetSubjectForm()
  loadSubjectDetail(row.visitId)
}

function loadSubjectDetail(visitId) {
  Promise.all([getVisitApply(visitId), getVisitApplyLogs(visitId)]).then(([detailResp, logResp]) => {
    subjectForm.value = {
      ...detailResp.data
    }
    logList.value = logResp.data || []
    subjectOpen.value = true
  })
}

function handleFeedback(row) {
  resetFeedbackForm()
  getVisitApply(row.visitId).then(response => {
    feedbackBase.value = response.data
    feedbackForm.value = {
      visitId: response.data.visitId,
      actualStartTime: response.data.actualStartTime,
      actualEndTime: response.data.actualEndTime,
      resultDesc: response.data.resultDesc,
      visitConclusion: response.data.visitConclusion,
      intentionLevel: response.data.intentionLevel,
      nextFollowTime: response.data.nextFollowTime,
      resultAttachmentsText: attachmentJsonToText(response.data.resultAttachments),
      remark: response.data.remark
    }
    feedbackOpen.value = true
  })
}

function handleWithdraw(row) {
  proxy.$modal.confirm('是否确认撤回拜访申请“' + row.visitNo + '”？').then(() => {
    return withdrawVisitApply(row.visitId)
  }).then(() => {
    proxy.$modal.msgSuccess('撤回成功')
    getList()
  }).catch(() => {})
}

function handleCustomerTypeChange() {
  subjectForm.value.contractConfigId = null
  subjectForm.value.customerId = null
}

function goCustomerPage() {
  router.push('/visit/customer')
}

function submitSubjectForm() {
  proxy.$refs.subjectRef.validate(valid => {
    if (!valid) return
    const payload = {
      ...subjectForm.value
    }
    const action = payload.visitId ? resubmitVisitApply : submitVisitApply
    action(payload).then(() => {
      proxy.$modal.msgSuccess(payload.visitId ? '重提成功' : '提交成功')
      subjectOpen.value = false
      getList()
    })
  })
}

function submitFeedbackForm() {
  proxy.$refs.feedbackRef.validate(valid => {
    if (!valid) return
    const payload = {
      ...feedbackForm.value,
      resultAttachments: attachmentTextToJson(feedbackForm.value.resultAttachmentsText)
    }
    delete payload.resultAttachmentsText
    feedbackVisitApply(payload).then(() => {
      proxy.$modal.msgSuccess('回填成功')
      feedbackOpen.value = false
      getList()
    })
  })
}

function canEdit(row) {
  return row.visitMode !== 'passive' && ['rejected', 'withdrawn'].includes(row.status)
}

function canWithdraw(row) {
  return row.visitMode !== 'passive' && row.status === 'pending_approve'
}

function canFeedback(row) {
  return row.status === 'approved_pending_feedback'
}

function buildContractLabel(item) {
  const contact = item.contactPerson ? ` / 联系人:${item.contactPerson}` : ''
  const phone = item.contactPhone ? ` / 电话:${item.contactPhone}` : ''
  const contractNo = item.contractNo ? ` / 合同号:${item.contractNo}` : ''
  return `${item.deptName}${contractNo}${contact}${phone}`
}

function buildCustomerLabel(item) {
  const contact = item.contactPerson ? ` / 联系人:${item.contactPerson}` : ''
  const phone = item.contactPhone ? ` / 电话:${item.contactPhone}` : ''
  return `${item.customerName}${contact}${phone}`
}

function buildCustomerDisplayName(row) {
  if (!row) return '-'
  const customerName = row.customerNameSnapshot || '-'
  if (row.visitMode === 'passive' && row.customerType === 'contract' && row.triggerExternalCompanyNameSnapshot) {
    return `${customerName} / ${row.triggerExternalCompanyNameSnapshot}`
  }
  return customerName
}

function buildCoordinate(longitude, latitude) {
  if (longitude == null || latitude == null) return '-'
  return `${longitude}, ${latitude}`
}

function formatDictLabel(options, value) {
  const match = options.value?.find(item => item.value === value)
  return match ? match.label : value
}

function attachmentJsonToText(value) {
  if (!value) return ''
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.join(',') : ''
  } catch (error) {
    return value
  }
}

function attachmentTextToJson(value) {
  if (!value) return '[]'
  return JSON.stringify(value.split(',').map(item => item.trim()).filter(Boolean))
}

loadContractOptions()
loadCustomerOptions()
resetSubjectForm()
resetFeedbackForm()
getList()
</script>

<style scoped>
.log-section {
  margin-top: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}
</style>
