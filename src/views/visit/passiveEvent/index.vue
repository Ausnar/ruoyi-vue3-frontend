<template>
  <div class="app-container">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="96px">
      <el-form-item label="事件状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择事件状态" clearable style="width: 180px">
          <el-option v-for="item in fe_visit_passive_event_status" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="目标类型" prop="selectedTargetType">
        <el-select v-model="queryParams.selectedTargetType" placeholder="请选择目标类型" clearable style="width: 180px">
          <el-option v-for="item in targetTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />

    <el-table v-loading="loading" :data="eventList">
      <el-table-column label="事件ID" align="center" prop="eventId" width="100" />
      <el-table-column label="网关IMEI" align="center" prop="gatewayImei" min-width="160" show-overflow-tooltip />
      <el-table-column label="归属单位" align="center" prop="deptName" min-width="160" show-overflow-tooltip />
      <el-table-column label="消防点" align="center" prop="firePointName" min-width="180" show-overflow-tooltip />
      <el-table-column label="触发时间" align="center" prop="triggerTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.triggerTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="位移距离(m)" align="center" prop="distanceM" width="120" />
      <el-table-column label="已选目标" align="center" min-width="220" show-overflow-tooltip>
        <template #default="scope">
          <span>{{ buildSelectedTargetLabel(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="120">
        <template #default="scope">
          <dict-tag :options="fe_visit_passive_event_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" min-width="220">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleView(scope.row)" v-hasPermi="['visit:passiveEvent:query']">详情</el-button>
          <el-button
            v-if="scope.row.status === 'pending_confirm'"
            link
            type="success"
            icon="Select"
            @click="handleConfirm(scope.row)"
            v-hasPermi="['visit:passiveEvent:confirm']"
          >确认转单</el-button>
          <el-button
            v-if="scope.row.status === 'pending_confirm'"
            link
            type="danger"
            icon="CloseBold"
            @click="handleIgnore(scope.row)"
            v-hasPermi="['visit:passiveEvent:ignore']"
          >忽略</el-button>
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

    <el-dialog :title="dialogMode === 'confirm' ? '确认生成被动拜访' : '被动事件详情'" v-model="detailOpen" width="960px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="事件ID">{{ detailForm.eventId }}</el-descriptions-item>
        <el-descriptions-item label="状态"><dict-tag :options="fe_visit_passive_event_status" :value="detailForm.status" /></el-descriptions-item>
        <el-descriptions-item label="网关IMEI">{{ detailForm.gatewayImei || '-' }}</el-descriptions-item>
        <el-descriptions-item label="归属单位">{{ detailForm.deptName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="消防点">{{ detailForm.firePointName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="触发时间">{{ parseTime(detailForm.triggerTime, '{y}-{m}-{d} {h}:{i}:{s}') || '-' }}</el-descriptions-item>
        <el-descriptions-item label="起点坐标" :span="2">{{ buildCoordinate(detailForm.fromLongitude, detailForm.fromLatitude) }}</el-descriptions-item>
        <el-descriptions-item label="终点坐标" :span="2">{{ buildCoordinate(detailForm.toLongitude, detailForm.toLatitude) }}</el-descriptions-item>
        <el-descriptions-item label="位移距离">{{ detailForm.distanceM ? detailForm.distanceM + ' m' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="已选目标">{{ detailForm.selectedTargetName || '-' }}</el-descriptions-item>
        <el-descriptions-item v-if="detailForm.selectedExternalCompanyName || hasContractCandidate" label="具体外部单位">{{ detailForm.selectedExternalCompanyName || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div class="section-block">
        <div class="section-title">候选客户</div>
        <el-table :data="candidateList" size="small" border empty-text="暂无候选客户">
          <el-table-column v-if="dialogMode === 'confirm'" label="选择" align="center" width="70">
            <template #default="scope">
              <el-radio v-model="confirmForm.selectedKey" :label="scope.row.key"> </el-radio>
            </template>
          </el-table-column>
          <el-table-column label="目标类型" align="center" width="120">
            <template #default="scope">
              <el-tag :type="scope.row.targetType === 'contract_dept' ? 'primary' : 'success'">
                {{ scope.row.targetTypeLabel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="目标名称" align="center" prop="targetName" min-width="180" show-overflow-tooltip />
          <el-table-column label="外部单位" align="center" prop="externalCompanyName" min-width="180" show-overflow-tooltip />
          <el-table-column label="距离(m)" align="center" prop="distanceM" width="120" />
          <el-table-column label="消防点" align="center" prop="firePointName" min-width="180" show-overflow-tooltip />
        </el-table>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button v-if="dialogMode === 'confirm'" type="primary" @click="submitConfirm">确认生成</el-button>
          <el-button @click="detailOpen = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="VisitPassiveEvent">
import { confirmPassiveEvent, getPassiveEvent, ignorePassiveEvent, listPassiveEvent } from '@/api/visit/passiveEvent'

const { proxy } = getCurrentInstance()
const { fe_visit_passive_event_status } = proxy.useDict('fe_visit_passive_event_status')

const targetTypeOptions = [
  { label: '合同客户', value: 'contract_dept' },
  { label: '独立客户', value: 'independent_customer' }
]

const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const eventList = ref([])
const detailOpen = ref(false)
const dialogMode = ref('view')
const detailForm = ref({})
const candidateList = ref([])
const confirmForm = reactive({
  selectedKey: null
})
const hasContractCandidate = computed(() => candidateList.value.some(item => item.targetType === 'contract_dept'))

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  status: 'pending_confirm',
  selectedTargetType: null
})

function getList() {
  loading.value = true
  listPassiveEvent(queryParams).then(response => {
    eventList.value = response.rows || []
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
  proxy.resetForm('queryRef')
  queryParams.status = 'pending_confirm'
  handleQuery()
}

function handleView(row) {
  openDetail(row.eventId, 'view')
}

function handleConfirm(row) {
  openDetail(row.eventId, 'confirm')
}

function openDetail(eventId, mode) {
  dialogMode.value = mode
  confirmForm.selectedKey = null
  getPassiveEvent(eventId).then(response => {
    detailForm.value = response.data || {}
    candidateList.value = parseCandidates(detailForm.value.candidateSummary)
    if (mode === 'confirm' && candidateList.value.length > 0) {
      confirmForm.selectedKey = candidateList.value[0].key
    }
    detailOpen.value = true
  })
}

function handleIgnore(row) {
  proxy.$modal.confirm('是否确认忽略该被动事件？').then(() => {
    return ignorePassiveEvent(row.eventId)
  }).then(() => {
    proxy.$modal.msgSuccess('忽略成功')
    getList()
  }).catch(() => {})
}

function submitConfirm() {
  const candidate = candidateList.value.find(item => item.key === confirmForm.selectedKey)
  if (!candidate) {
    proxy.$modal.msgWarning('请选择确认目标')
    return
  }
  confirmPassiveEvent(detailForm.value.eventId, {
    selectedTargetType: candidate.targetType,
    selectedTargetId: candidate.targetId,
    selectedExternalCompanyId: candidate.externalCompanyId || null
  }).then(() => {
    proxy.$modal.msgSuccess('已生成被动拜访')
    detailOpen.value = false
    getList()
  })
}

function parseCandidates(value) {
  if (!value) return []
  try {
    return JSON.parse(value).map((item, index) => ({
      ...item,
      key: `${item.targetType}_${item.targetId}_${item.externalCompanyId || 'none'}_${index}`,
      targetTypeLabel: item.targetType === 'contract_dept' ? '合同客户' : '独立客户'
    }))
  } catch (error) {
    return []
  }
}

function buildSelectedTargetLabel(row) {
  if (!row?.selectedTargetName) return '-'
  return row.selectedExternalCompanyName ? `${row.selectedTargetName} / ${row.selectedExternalCompanyName}` : row.selectedTargetName
}

function buildCoordinate(longitude, latitude) {
  if (longitude == null || latitude == null) return '-'
  return `${longitude}, ${latitude}`
}

getList()
</script>

<style scoped>
.section-block {
  margin-top: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}
</style>
