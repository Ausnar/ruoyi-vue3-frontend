<template>
  <div class="app-container warning-task-page">
    <el-form ref="queryRef" class="task-query-form" :model="queryParams" :inline="true" v-show="showSearch" label-width="96px">
      <el-form-item label="派发时间">
        <el-date-picker
          v-model="dispatchTimeRange"
          class="query-date-picker"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          clearable
        />
      </el-form-item>
      <el-form-item label="所属单位" prop="deptId">
        <el-tree-select
          v-model="queryParams.deptId"
          class="query-control"
          :data="deptOptions"
          :props="{ value: 'id', label: 'label', children: 'children' }"
          value-key="id"
          placeholder="请选择所属单位"
          clearable
          check-strictly
        />
      </el-form-item>
      <el-form-item label="预警类型" prop="warningType">
        <el-select v-model="queryParams.warningType" class="query-control" placeholder="请选择预警类型" clearable>
          <el-option v-for="item in warningTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="任务状态" prop="taskStatus">
        <el-select v-model="queryParams.taskStatus" class="query-control" placeholder="请选择任务状态" clearable>
          <el-option v-for="item in taskStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键词" prop="keyword">
        <el-input v-model="queryParams.keyword" class="query-control" placeholder="设备/消防点/证据/处理人" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item class="query-actions">
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="taskList">
      <el-table-column label="预警类型" align="center" prop="warningType" min-width="130">
        <template #default="scope">
          <el-tag :type="warningTypeTagType(scope.row.warningType)">{{ formatWarningType(scope.row.warningType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="任务状态" align="center" prop="taskStatus" width="120">
        <template #default="scope">
          <el-tag :type="taskStatusTagType(scope.row.taskStatus)">{{ formatTaskStatus(scope.row.taskStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="所属单位" align="center" prop="deptName" min-width="180" show-overflow-tooltip />
      <el-table-column label="消防点" align="center" prop="firePointName" min-width="150" show-overflow-tooltip>
        <template #default="scope">{{ scope.row.firePointName || '-' }}</template>
      </el-table-column>
      <el-table-column label="关联设备" align="center" min-width="190" show-overflow-tooltip>
        <template #default="scope">{{ formatRelatedDevice(scope.row) }}</template>
      </el-table-column>
      <el-table-column label="处理人" align="center" prop="assigneeNickName" min-width="120" show-overflow-tooltip>
        <template #default="scope">{{ formatAssignee(scope.row) }}</template>
      </el-table-column>
      <el-table-column label="派发时间" align="center" prop="dispatchTime" width="170">
        <template #default="scope">{{ parseTime(scope.row.dispatchTime) || '-' }}</template>
      </el-table-column>
      <el-table-column label="最近触发时间" align="center" prop="lastTriggerTime" width="170">
        <template #default="scope">{{ parseTime(scope.row.lastTriggerTime) || '-' }}</template>
      </el-table-column>
      <el-table-column label="证据摘要" align="left" prop="evidenceSummary" min-width="260" show-overflow-tooltip>
        <template #default="scope">{{ scope.row.evidenceSummary || '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="190" fixed="right" class-name="small-padding fixed-width">
        <template #default="scope">
          <div class="action-list">
            <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['manage:deviceWarningTask:query']">详情</el-button>
            <el-button
              v-if="canStart(scope.row)"
              link
              type="success"
              icon="VideoPlay"
              @click="handleStart(scope.row)"
              v-hasPermi="['manage:deviceWarningTask:start']"
            >开始处理</el-button>
            <el-button
              v-if="canTreat(scope.row)"
              link
              type="primary"
              icon="DocumentAdd"
              @click="handleTreatment(scope.row)"
              v-hasPermi="['manage:deviceWarningTask:treat']"
            >记录处置</el-button>
            <el-button
              v-if="canAssign(scope.row)"
              link
              type="warning"
              icon="User"
              @click="handleAssign(scope.row)"
              v-hasPermi="['manage:deviceWarningTask:reassign']"
            >{{ scope.row.taskStatus === 'manual_pending' ? '协调分发' : '改派' }}</el-button>
          </div>
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

    <el-dialog title="预警处理任务详情" v-model="detailOpen" width="860px" append-to-body>
      <div class="detail-section-title">任务信息</div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="任务编号">{{ detailForm.taskId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="预警编号">{{ detailForm.warningId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="任务状态">
          <el-tag :type="taskStatusTagType(detailForm.taskStatus)">{{ formatTaskStatus(detailForm.taskStatus) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="设备状态">
          <el-tag :type="detailForm.alarmState === 'recovered' ? 'success' : 'danger'">
            {{ detailForm.alarmState === 'recovered' ? '已恢复' : '异常中' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="处理角色">{{ detailForm.handlerRoleName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ formatAssignee(detailForm) }}</el-descriptions-item>
        <el-descriptions-item label="派发来源">{{ formatDispatchSource(detailForm.dispatchSource) }}</el-descriptions-item>
        <el-descriptions-item label="派发时间">{{ parseTime(detailForm.dispatchTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="首次查看">{{ parseTime(detailForm.firstViewTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="开始处理">{{ parseTime(detailForm.startTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="终止时间">{{ parseTime(detailForm.endTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="终止原因">{{ detailForm.endReason || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div class="detail-section-title">预警与设备</div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="预警类型">{{ formatWarningType(detailForm.warningType) }}</el-descriptions-item>
        <el-descriptions-item label="所属单位">{{ detailForm.deptName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="来源单位">{{ detailForm.sourceDeptName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="消防点">{{ detailForm.firePointName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="关联设备">{{ formatRelatedDevice(detailForm) }}</el-descriptions-item>
        <el-descriptions-item label="最近触发">{{ parseTime(detailForm.lastTriggerTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="阈值快照" :span="2">{{ detailForm.thresholdSnapshot || '-' }}</el-descriptions-item>
        <el-descriptions-item label="证据摘要" :span="2">{{ detailForm.evidenceSummary || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div class="detail-section-title">改派记录摘要</div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="改派次数">{{ detailForm.reassignCount ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="最近改派时间">{{ parseTime(detailForm.lastReassignTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="最近改派人">{{ detailForm.lastReassignBy || '-' }}</el-descriptions-item>
        <el-descriptions-item label="改派原因">{{ detailForm.reassignReason || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div class="detail-section-title">处置与恢复记录</div>
      <el-alert
        class="treatment-boundary-alert"
        title="设备绑定关系由外部平台维护，本站只记录处置过程，并以 SDK 后续同步结果作为设备恢复依据。"
        type="info"
        :closable="false"
        show-icon
      />
      <el-descriptions v-if="detailForm.alarmState === 'recovered'" :column="2" border class="recovery-summary">
        <el-descriptions-item label="恢复时间">{{ parseTime(detailForm.recoveryTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="恢复来源">{{ formatRecoverySource(detailForm.recoverySource) }}</el-descriptions-item>
        <el-descriptions-item label="恢复证据" :span="2">{{ detailForm.recoveryEvidence || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-timeline v-if="detailForm.treatmentRecords?.length" class="treatment-timeline">
        <el-timeline-item
          v-for="record in detailForm.treatmentRecords"
          :key="record.recordId"
          :timestamp="parseTime(record.actionTime)"
          placement="top"
        >
          <div class="treatment-record-title">
            {{ formatActionType(record.actionType) }} · {{ formatActionChannel(record.actionChannel) }}
          </div>
          <div class="treatment-record-meta">
            {{ record.operatorNickName || record.operatorUserName || '-' }}，任务转为“{{ formatTaskStatus(record.nextTaskStatus) }}”
          </div>
          <div class="treatment-record-description">{{ record.actionDescription }}</div>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无人工处置记录" :image-size="64" />

      <template #footer>
        <el-button @click="detailOpen = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog title="记录预警处置" v-model="treatmentOpen" width="620px" append-to-body>
      <el-alert
        title="本站不执行设备换绑或解绑。涉及扫码、换瓶、换传感器或换网关时，请在外部平台完成操作后，再等待 SDK 同步验证。"
        type="warning"
        :closable="false"
        show-icon
        class="treatment-boundary-alert"
      />
      <el-form ref="treatmentRef" :model="treatmentForm" :rules="treatmentRules" label-width="104px">
        <el-form-item label="预警类型">{{ formatWarningType(treatmentForm.warningType) }}</el-form-item>
        <el-form-item label="关联设备">{{ treatmentForm.relatedDevice || '-' }}</el-form-item>
        <el-form-item label="处置方式" prop="actionType">
          <el-select v-model="treatmentForm.actionType" style="width: 100%" placeholder="请选择本次处置方式">
            <el-option v-for="item in availableActionOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="处置渠道" prop="actionChannel">
          <el-radio-group v-model="treatmentForm.actionChannel">
            <el-radio value="onsite">现场处理</el-radio>
            <el-radio value="external_platform">外部平台/小程序</el-radio>
            <el-radio value="web_record">本站记录</el-radio>
            <el-radio value="other">其他</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="下一步" prop="nextTaskStatus">
          <el-radio-group v-model="treatmentForm.nextTaskStatus" class="next-status-group">
            <el-radio value="waiting_external">待外部操作</el-radio>
            <el-radio value="verifying">操作已完成，待设备验证</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处置说明" prop="actionDescription">
          <el-input
            v-model="treatmentForm.actionDescription"
            type="textarea"
            :rows="4"
            maxlength="1000"
            show-word-limit
            placeholder="请记录检查结果、已执行操作及仍需完成的事项"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="treatmentLoading" @click="submitTreatment">保存记录</el-button>
        <el-button @click="treatmentOpen = false">取消</el-button>
      </template>
    </el-dialog>

    <el-dialog :title="assignForm.originalAssignee ? '改派预警任务' : '协调分发预警任务'" v-model="assignOpen" width="520px" append-to-body>
      <el-form ref="assignRef" :model="assignForm" :rules="assignRules" label-width="96px">
        <el-form-item label="所属单位">{{ assignForm.deptName || '-' }}</el-form-item>
        <el-form-item label="当前处理人">{{ assignForm.originalAssignee || '待协调' }}</el-form-item>
        <el-form-item label="处理人" prop="assigneeUserId">
          <el-select v-model="assignForm.assigneeUserId" style="width: 100%" placeholder="请选择责任范围内的处理员或协调员" filterable>
            <el-option
              v-for="user in candidateList"
              :key="user.userId"
              :label="`${user.nickName || user.userName}（${user.userName}）`"
              :value="user.userId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="改派原因" prop="reassignReason">
          <el-input v-model="assignForm.reassignReason" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="首次协调分发可不填写" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="assignLoading" @click="submitAssign">确定</el-button>
        <el-button @click="assignOpen = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="DeviceWarningTask">
import useUserStore from '@/store/modules/user'
import { deviceDeptTreeSelect } from '@/api/manage/deviceDept'
import {
  getDeviceWarningTask,
  listDeviceWarningTask,
  listTaskCandidates,
  reassignDeviceWarningTask,
  startDeviceWarningTask,
  submitDeviceWarningTreatment
} from '@/api/manage/deviceWarningTask'

const { proxy } = getCurrentInstance()
const userStore = useUserStore()

const taskList = ref([])
const candidateList = ref([])
const deptOptions = ref([])
const dispatchTimeRange = ref([])
const loading = ref(false)
const assignLoading = ref(false)
const treatmentLoading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const detailOpen = ref(false)
const assignOpen = ref(false)
const treatmentOpen = ref(false)
const detailForm = ref({})

const warningTypeOptions = [
  { label: '疑似火灾', value: 'suspected_fire', type: 'danger' },
  { label: '低电量', value: 'low_battery', type: 'warning' },
  { label: '低压', value: 'low_pressure', type: 'warning' },
  { label: '高压', value: 'high_pressure', type: 'danger' },
  { label: '数量不足', value: 'insufficient_extinguisher', type: 'warning' },
  { label: '灭火器临近报废', value: 'extinguisher_scrap_due', type: 'danger' },
  { label: '环境温度异常', value: 'abnormal_temperature', type: 'warning' }
]

const taskStatusOptions = [
  { label: '待协调', value: 'manual_pending', type: 'danger' },
  { label: '已派发', value: 'assigned', type: 'warning' },
  { label: '处理中', value: 'processing', type: 'primary' },
  { label: '待外部操作', value: 'waiting_external', type: 'warning' },
  { label: '待设备验证', value: 'verifying', type: 'primary' },
  { label: '设备已恢复', value: 'recovered', type: 'success' },
  { label: '已完成', value: 'completed', type: 'success' },
  { label: '已取消', value: 'cancelled', type: 'info' }
]

const actionOptions = [
  { label: '现场核查', value: 'onsite_inspection' },
  { label: '火情处置', value: 'fire_disposal' },
  { label: '更换电池', value: 'battery_replacement' },
  { label: '更换传感器', value: 'sensor_replacement' },
  { label: '压力检查', value: 'pressure_inspection' },
  { label: '灭火器维修', value: 'extinguisher_maintenance' },
  { label: '更换灭火器', value: 'extinguisher_replacement' },
  { label: '记录外部平台换绑/解绑', value: 'external_binding' },
  { label: '补充灭火器', value: 'extinguisher_replenishment' },
  { label: '核对应配数量', value: 'expected_count_correction' },
  { label: '调整环境温度', value: 'environment_adjustment' },
  { label: '调整设备位置', value: 'device_relocation' },
  { label: '其他处置', value: 'other' }
]

const warningActionMap = {
  suspected_fire: ['onsite_inspection', 'fire_disposal', 'other'],
  low_battery: ['onsite_inspection', 'battery_replacement', 'sensor_replacement', 'external_binding', 'other'],
  low_pressure: ['onsite_inspection', 'pressure_inspection', 'extinguisher_maintenance', 'extinguisher_replacement', 'external_binding', 'other'],
  high_pressure: ['onsite_inspection', 'pressure_inspection', 'extinguisher_maintenance', 'extinguisher_replacement', 'external_binding', 'other'],
  insufficient_extinguisher: ['onsite_inspection', 'extinguisher_replenishment', 'expected_count_correction', 'other'],
  extinguisher_scrap_due: ['onsite_inspection', 'extinguisher_replacement', 'external_binding', 'other'],
  abnormal_temperature: ['onsite_inspection', 'environment_adjustment', 'device_relocation', 'other']
}

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    deptId: null,
    warningType: null,
    taskStatus: null,
    keyword: null
  },
  assignForm: {},
  assignRules: {
    assigneeUserId: [{ required: true, message: '请选择处理人', trigger: 'change' }]
  },
  treatmentForm: {},
  treatmentRules: {
    actionType: [{ required: true, message: '请选择处置方式', trigger: 'change' }],
    actionChannel: [{ required: true, message: '请选择处置渠道', trigger: 'change' }],
    nextTaskStatus: [{ required: true, message: '请选择下一步状态', trigger: 'change' }],
    actionDescription: [{ required: true, message: '请填写处置说明', trigger: 'blur' }]
  }
})

const { queryParams, assignForm, assignRules, treatmentForm, treatmentRules } = toRefs(data)

const availableActionOptions = computed(() => {
  const allowed = warningActionMap[treatmentForm.value.warningType] || actionOptions.map(item => item.value)
  return actionOptions.filter(item => allowed.includes(item.value))
})

function getList() {
  loading.value = true
  const params = proxy.addDateRange({ ...queryParams.value }, dispatchTimeRange.value, 'DispatchTime')
  listDeviceWarningTask(params).then(response => {
    taskList.value = response.rows || []
    total.value = response.total || 0
  }).finally(() => {
    loading.value = false
  })
}

function getDeptTree() {
  deviceDeptTreeSelect({}).then(response => {
    deptOptions.value = response.data || []
  })
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  dispatchTimeRange.value = []
  handleQuery()
}

function handleDetail(row) {
  getDeviceWarningTask(row.taskId).then(response => {
    detailForm.value = response.data || {}
    detailOpen.value = true
  })
}

function handleStart(row) {
  proxy.$modal.confirm(`确认开始处理“${formatWarningType(row.warningType)}”任务吗？`).then(() => {
    return startDeviceWarningTask(row.taskId)
  }).then(() => {
    proxy.$modal.msgSuccess('任务已进入处理中')
    getList()
  }).catch(() => {})
}

function handleAssign(row) {
  candidateList.value = []
  assignForm.value = {
    taskId: row.taskId,
    deptName: row.deptName,
    originalAssignee: formatAssignee(row) === '-' ? '' : formatAssignee(row),
    assigneeUserId: null,
    reassignReason: null
  }
  listTaskCandidates(row.taskId).then(response => {
    candidateList.value = response.data || []
    if (!candidateList.value.length) {
      proxy.$modal.msgWarning('当前来源责任范围内暂无可用的预警处理员或协调员')
      return
    }
    assignOpen.value = true
  })
}

function submitAssign() {
  proxy.$refs.assignRef.validate(valid => {
    if (!valid) return
    assignLoading.value = true
    reassignDeviceWarningTask(assignForm.value.taskId, {
      assigneeUserId: assignForm.value.assigneeUserId,
      reassignReason: assignForm.value.reassignReason
    }).then(() => {
      proxy.$modal.msgSuccess(assignForm.value.originalAssignee ? '改派成功' : '分发成功')
      assignOpen.value = false
      getList()
    }).finally(() => {
      assignLoading.value = false
    })
  })
}

function handleTreatment(row) {
  treatmentForm.value = {
    taskId: row.taskId,
    warningType: row.warningType,
    relatedDevice: formatRelatedDevice(row),
    actionType: null,
    actionChannel: row.taskStatus === 'waiting_external' ? 'external_platform' : 'onsite',
    nextTaskStatus: 'verifying',
    actionDescription: null
  }
  treatmentOpen.value = true
  nextTick(() => proxy.$refs.treatmentRef?.clearValidate())
}

function submitTreatment() {
  proxy.$refs.treatmentRef.validate(valid => {
    if (!valid) return
    treatmentLoading.value = true
    submitDeviceWarningTreatment(treatmentForm.value.taskId, {
      actionType: treatmentForm.value.actionType,
      actionChannel: treatmentForm.value.actionChannel,
      nextTaskStatus: treatmentForm.value.nextTaskStatus,
      actionDescription: treatmentForm.value.actionDescription
    }).then(() => {
      proxy.$modal.msgSuccess('处置记录已保存，后续将以 SDK 数据验证设备状态')
      treatmentOpen.value = false
      getList()
    }).finally(() => {
      treatmentLoading.value = false
    })
  })
}

function canStart(row) {
  return row.taskStatus === 'assigned' && String(row.assigneeUserId) === String(userStore.id)
}

function canAssign(row) {
  return ['manual_pending', 'assigned'].includes(row.taskStatus)
}

function canTreat(row) {
  return ['processing', 'waiting_external', 'verifying'].includes(row.taskStatus)
    && row.alarmState === 'active'
    && String(row.assigneeUserId) === String(userStore.id)
}

function findOption(options, value) {
  return options.find(item => item.value === value)
}

function formatWarningType(value) {
  if (value === 'extinguisher_expired') return '灭火器到期（历史）'
  return findOption(warningTypeOptions, value)?.label || value || '-'
}

function warningTypeTagType(value) {
  return findOption(warningTypeOptions, value)?.type || 'info'
}

function formatTaskStatus(value) {
  return findOption(taskStatusOptions, value)?.label || value || '-'
}

function taskStatusTagType(value) {
  return findOption(taskStatusOptions, value)?.type || 'info'
}

function formatAssignee(row) {
  return row?.assigneeNickName || row?.assigneeUserName || '-'
}

function formatDispatchSource(value) {
  return value === 'auto' ? '系统自动派发' : value === 'manual' ? '人工分发/改派' : '-'
}

function formatActionType(value) {
  return findOption(actionOptions, value)?.label || value || '-'
}

function formatActionChannel(value) {
  const labels = { onsite: '现场处理', external_platform: '外部平台/小程序', web_record: '本站记录', other: '其他' }
  return labels[value] || value || '-'
}

function formatRecoverySource(value) {
  return value === 'sdk_sync' ? 'SDK 同步验证' : value || '-'
}

function formatRelatedDevice(row) {
  if (row?.sensorCode) return `传感器：${row.sensorCode}`
  if (row?.extinguisherLabelCode) return `灭火器：${row.extinguisherLabelCode}`
  if (row?.gatewayImei) return `网关：${row.gatewayImei}`
  if (row?.firePointName) return `消防点：${row.firePointName}`
  return '-'
}

getDeptTree()
getList()
</script>

<style scoped>
.task-query-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  column-gap: 24px;
  row-gap: 10px;
}

.task-query-form :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 8px;
}

.query-control {
  width: 240px;
}

.query-date-picker {
  width: 360px;
}

.query-actions {
  flex-basis: 100%;
}

.action-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.action-list :deep(.el-button + .el-button) {
  margin-left: 0;
}

.detail-section-title {
  margin: 18px 0 10px;
  padding-left: 8px;
  border-left: 3px solid var(--el-color-primary);
  color: #303133;
  font-weight: 600;
}

.detail-section-title:first-child {
  margin-top: 0;
}

.warning-task-page :deep(.el-descriptions__cell) {
  word-break: break-all;
}

.treatment-boundary-alert {
  margin-bottom: 16px;
}

.recovery-summary {
  margin-bottom: 18px;
}

.treatment-timeline {
  margin-top: 18px;
}

.treatment-record-title {
  color: #303133;
  font-weight: 600;
}

.treatment-record-meta {
  margin-top: 4px;
  color: #909399;
  font-size: 13px;
}

.treatment-record-description {
  margin-top: 8px;
  color: #606266;
  line-height: 1.6;
  white-space: pre-wrap;
}

.next-status-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
</style>
