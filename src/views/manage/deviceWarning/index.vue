<template>
  <div class="app-container device-warning-page">
    <el-form class="warning-query-form" :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="96px">
      <el-form-item class="query-date" label="最近触发时间">
        <el-date-picker
          clearable
          class="query-date-picker"
          v-model="lastTriggerTimeRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
      </el-form-item>
      <el-form-item class="query-region" label="归属地区" prop="deptRegion">
        <el-cascader
          class="query-control"
          v-model="queryParams.deptRegion"
          :options="regionData"
          :props="{ checkStrictly: true }"
          placeholder="请选择归属地区"
          clearable
          @change="handleDeptRegionChange"
        />
      </el-form-item>
      <el-form-item class="query-dept" label="所属单位" prop="deptId">
        <el-tree-select
          class="query-control"
          v-model="queryParams.deptId"
          :data="deptOptions"
          :props="{ value: 'id', label: 'label', children: 'children' }"
          value-key="id"
          placeholder="请选择所属单位"
          clearable
          check-strictly
        />
      </el-form-item>
      <el-form-item class="query-type" label="预警类型" prop="warningType">
        <el-select class="query-control" v-model="queryParams.warningType" placeholder="请选择预警类型" clearable>
          <el-option v-for="item in warningTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item class="query-status" label="预警状态" prop="warningStatus">
        <el-select class="query-control" v-model="queryParams.warningStatus" placeholder="请选择预警状态" clearable>
          <el-option v-for="item in warningStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item class="query-fire-point" label="消防点" prop="firePointName">
        <el-input
          class="query-control"
          v-model="queryParams.firePointName"
          placeholder="请输入消防点名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item class="query-keyword" label="关键词" prop="keyword">
        <el-input
          class="query-control"
          v-model="queryParams.keyword"
          placeholder="证据/设备编号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item class="query-actions">
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="warningList">
      <el-table-column label="预警类型" align="center" prop="warningType" min-width="130">
        <template #default="scope">
          <el-tag :type="warningTypeTagType(scope.row.warningType)">{{ formatWarningType(scope.row.warningType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="warningStatus" width="100">
        <template #default="scope">
          <el-tag :type="warningStatusTagType(scope.row.warningStatus)">{{ formatWarningStatus(scope.row.warningStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="所属单位" align="center" prop="deptName" min-width="170" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ scope.row.deptName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="消防点" align="center" prop="firePointName" min-width="160" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ scope.row.firePointName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="关联设备" align="center" min-width="210" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ formatRelatedDevice(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="首次触发时间" align="center" prop="triggerTime" width="170">
        <template #default="scope">
          <span>{{ parseTime(scope.row.triggerTime) || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="最近触发时间" align="center" prop="lastTriggerTime" width="170">
        <template #default="scope">
          <span>{{ parseTime(scope.row.lastTriggerTime) || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="样本数" align="center" prop="sampleCount" width="80" />
      <el-table-column label="证据摘要" align="left" prop="evidenceSummary" min-width="280" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ scope.row.evidenceSummary || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="90" fixed="right">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['manage:deviceWarning:query']">详情</el-button>
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

    <el-dialog title="设备预警详情" v-model="detailOpen" width="860px" append-to-body>
      <div class="detail-section-title">预警信息</div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="预警类型">
          <el-tag :type="warningTypeTagType(detailForm.warningType)">{{ formatWarningType(detailForm.warningType) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="预警状态">
          <el-tag :type="warningStatusTagType(detailForm.warningStatus)">{{ formatWarningStatus(detailForm.warningStatus) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="对象类型">{{ formatObjectType(detailForm.objectType) }}</el-descriptions-item>
        <el-descriptions-item label="对象ID">{{ detailForm.objectId || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div class="detail-section-title">归属与设备链路</div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="归属地区">{{ formatDeptRegion(detailForm) }}</el-descriptions-item>
        <el-descriptions-item label="所属单位">{{ detailForm.deptName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="来源单位">{{ detailForm.sourceDeptName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="消防点">{{ detailForm.firePointName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="传感器">{{ detailForm.sensorCode || formatId(detailForm.sensorId) }}</el-descriptions-item>
        <el-descriptions-item label="网关">{{ detailForm.gatewayImei || formatId(detailForm.gatewayId) }}</el-descriptions-item>
        <el-descriptions-item label="灭火器">{{ formatExtinguisher(detailForm) }}</el-descriptions-item>
        <el-descriptions-item label="关联设备">{{ formatRelatedDevice(detailForm) }}</el-descriptions-item>
      </el-descriptions>

      <div class="detail-section-title">触发证据</div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="首次触发时间">{{ parseTime(detailForm.triggerTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="最近触发时间">{{ parseTime(detailForm.lastTriggerTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="窗口开始">{{ parseTime(detailForm.windowStartTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="窗口结束">{{ parseTime(detailForm.windowEndTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="样本数">{{ formatNullable(detailForm.sampleCount) }}</el-descriptions-item>
        <el-descriptions-item label="阈值快照">{{ detailForm.thresholdSnapshot || '-' }}</el-descriptions-item>
        <el-descriptions-item label="证据摘要" :span="2">{{ detailForm.evidenceSummary || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div class="detail-section-title">闭环预留</div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="确认人">{{ detailForm.confirmBy || '-' }}</el-descriptions-item>
        <el-descriptions-item label="确认时间">{{ parseTime(detailForm.confirmTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ detailForm.handleBy || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ parseTime(detailForm.handleTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="解除人">{{ detailForm.resolveBy || '-' }}</el-descriptions-item>
        <el-descriptions-item label="解除时间">{{ parseTime(detailForm.resolveTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="误报原因" :span="2">{{ detailForm.falseAlarmReason || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailForm.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailOpen = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="DeviceWarning">
import { listDeviceWarning, getDeviceWarning } from "@/api/manage/deviceWarning"
import { deptTreeSelect } from "@/api/system/user"
import { regionData } from "@/utils/regionData"

const { proxy } = getCurrentInstance()

const warningList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const detailOpen = ref(false)
const deptOptions = ref([])
const lastTriggerTimeRange = ref([])
const detailForm = ref({})

const warningTypeOptions = [
  { label: '疑似火灾', value: 'suspected_fire', type: 'danger' },
  { label: '低电量', value: 'low_battery', type: 'warning' },
  { label: '低压', value: 'low_pressure', type: 'warning' },
  { label: '高压', value: 'high_pressure', type: 'danger' },
  { label: '数量不足', value: 'insufficient_extinguisher', type: 'warning' },
  { label: '灭火器到期', value: 'extinguisher_expired', type: 'danger' },
  { label: '环境温度异常', value: 'abnormal_temperature', type: 'warning' },
  { label: '网关失联', value: 'gateway_offline', type: 'info' }
]

const warningStatusOptions = [
  { label: '待响应', value: 'pending', type: 'danger' },
  { label: '处理中', value: 'processing', type: 'warning' },
  { label: '已解除', value: 'resolved', type: 'success' },
  { label: '误报', value: 'false_alarm', type: 'info' }
]

const objectTypeOptions = [
  { label: '传感器', value: 'sensor' },
  { label: '灭火器', value: 'extinguisher' },
  { label: '消防点', value: 'fire_point' },
  { label: '网关', value: 'gateway' }
]

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    warningType: null,
    warningStatus: null,
    firePointName: null,
    keyword: null,
    deptId: null,
    deptRegion: [],
    deptProvince: null,
    deptCity: null,
    deptArea: null
  }
})

const { queryParams } = toRefs(data)

function getDeptTree(validateDept = false) {
  deptTreeSelect(buildDeptTreeParams()).then(response => {
    deptOptions.value = response.data || []
    if (validateDept && queryParams.value.deptId && !containsDept(deptOptions.value, queryParams.value.deptId)) {
      queryParams.value.deptId = null
    }
  })
}

function getList() {
  loading.value = true
  listDeviceWarning(buildQueryParams()).then(response => {
    warningList.value = response.rows || []
    total.value = response.total || 0
  }).finally(() => {
    loading.value = false
  })
}

function buildQueryParams() {
  const { deptRegion, ...params } = queryParams.value
  return proxy.addDateRange(params, lastTriggerTimeRange.value, 'LastTriggerTime')
}

function buildDeptTreeParams() {
  return {
    province: queryParams.value.deptProvince,
    city: queryParams.value.deptCity,
    area: queryParams.value.deptArea
  }
}

function containsDept(nodes, deptId) {
  return nodes.some(node => String(node.id) === String(deptId) || containsDept(node.children || [], deptId))
}

function handleDeptRegionChange(value) {
  const region = value || []
  queryParams.value.deptProvince = region[0] || null
  queryParams.value.deptCity = region[1] || null
  queryParams.value.deptArea = region[2] || null
  getDeptTree(true)
}

function clearDeptRegionQuery() {
  queryParams.value.deptRegion = []
  queryParams.value.deptProvince = null
  queryParams.value.deptCity = null
  queryParams.value.deptArea = null
  getDeptTree()
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm("queryRef")
  lastTriggerTimeRange.value = []
  clearDeptRegionQuery()
  handleQuery()
}

function handleDetail(row) {
  getDeviceWarning(row.warningId).then(response => {
    detailForm.value = response.data || {}
    detailOpen.value = true
  })
}

function findOption(options, value) {
  return options.find(item => item.value === value)
}

function formatWarningType(value) {
  return findOption(warningTypeOptions, value)?.label || value || '-'
}

function warningTypeTagType(value) {
  return findOption(warningTypeOptions, value)?.type || 'info'
}

function formatWarningStatus(value) {
  return findOption(warningStatusOptions, value)?.label || value || '-'
}

function warningStatusTagType(value) {
  return findOption(warningStatusOptions, value)?.type || 'info'
}

function formatObjectType(value) {
  return findOption(objectTypeOptions, value)?.label || value || '-'
}

function formatDeptRegion(row) {
  return [row.deptProvince, row.deptCity, row.deptArea].filter(Boolean).join(' / ') || '-'
}

function formatNullable(value) {
  return value === null || value === undefined || value === '' ? '-' : value
}

function formatId(value) {
  return value ? `ID:${value}` : '-'
}

function formatExtinguisher(row) {
  const label = row.extinguisherLabelCode || ''
  const product = row.extinguisherProductName || ''
  if (label && product) return `${label} / ${product}`
  return label || product || formatId(row.extinguisherId)
}

function formatRelatedDevice(row) {
  if (!row) return '-'
  if (row.sensorCode) return `传感器：${row.sensorCode}`
  if (row.extinguisherLabelCode) return `灭火器：${row.extinguisherLabelCode}`
  if (row.gatewayImei) return `网关：${row.gatewayImei}`
  if (row.firePointName) return `消防点：${row.firePointName}`
  return `${formatObjectType(row.objectType)} ${formatId(row.objectId)}`
}

getDeptTree()
getList()
</script>

<style scoped>
.warning-query-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  column-gap: 24px;
  row-gap: 10px;
}

.warning-query-form :deep(.el-form-item) {
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

.device-warning-page :deep(.el-descriptions__cell) {
  word-break: break-all;
}
</style>
