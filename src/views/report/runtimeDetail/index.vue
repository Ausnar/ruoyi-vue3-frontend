<template>
  <div class="app-container runtime-detail-page">
    <div class="page-heading">
      <div>
        <h2>设备运行明细</h2>
        <p>{{ periodDescription }}</p>
      </div>
      <el-radio-group v-model="queryParams.detailType" @change="handleDetailTypeChange">
        <el-radio-button label="sensor">传感器运行明细</el-radio-button>
        <el-radio-button label="gateway">网关定位明细</el-radio-button>
      </el-radio-group>
    </div>

    <div class="query-band">
      <el-form :model="queryParams" label-width="84px">
        <div class="query-grid">
          <el-form-item label="统计周期">
            <el-radio-group v-model="queryParams.periodType" @change="handlePeriodTypeChange">
              <el-radio-button label="day">日</el-radio-button>
              <el-radio-button label="week">周</el-radio-button>
              <el-radio-button label="month">月</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="周期日期">
            <div class="period-control">
              <el-tooltip content="上一周期" placement="top">
                <el-button icon="ArrowLeft" circle @click="shiftPeriod(-1)" />
              </el-tooltip>
              <el-date-picker
                v-model="queryParams.periodDate"
                :type="periodPickerType"
                :format="periodPickerFormat"
                value-format="YYYY-MM-DD"
                :clearable="false"
                :disabled-date="disableFutureDate"
                class="period-picker"
                @change="clearResults"
              />
              <el-tooltip content="下一周期" placement="top">
                <el-button icon="ArrowRight" circle :disabled="nextPeriodDisabled" @click="shiftPeriod(1)" />
              </el-tooltip>
              <el-button class="current-period" @click="goCurrentPeriod">本期</el-button>
            </div>
          </el-form-item>

          <el-form-item label="所属单位">
            <el-tree-select
              v-model="queryParams.deptId"
              :data="deptOptions"
              :props="{ value: 'id', label: 'label', children: 'children' }"
              value-key="id"
              placeholder="当前所属单位"
              check-strictly
              filterable
              @change="handleDeptChange"
            />
          </el-form-item>

          <el-form-item label="消防点">
            <el-select v-model="queryParams.firePointId" placeholder="全部消防点" filterable clearable @change="handleFirePointChange">
              <el-option
                v-for="item in firePointOptions"
                :key="item.firePointId"
                :label="firePointLabel(item)"
                :value="item.firePointId"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="deviceFieldLabel">
            <el-select
              v-model="queryParams.deviceId"
              :placeholder="devicePlaceholder"
              :loading="deviceLoading"
              filterable
              remote
              clearable
              reserve-keyword
              :remote-method="remoteSearchDevices"
              @change="clearResults"
              @visible-change="handleDeviceSelectVisible"
            >
              <el-option :label="allDevicesLabel" :value="ALL_DEVICES" />
              <el-option
                v-for="item in deviceOptions"
                :key="item.deviceId"
                :label="deviceOptionLabel(item)"
                :value="item.deviceId"
              />
            </el-select>
          </el-form-item>
        </div>

        <div class="query-actions">
          <div>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </div>
          <div class="export-actions" v-hasPermi="['report:runtimeDetail:export']">
            <span>当前筛选 {{ total }} 条</span>
            <el-button icon="Download" :loading="exporting === 'excel'" :disabled="!hasQueried || total === 0 || !!exporting" @click="handleExport('excel')">Excel</el-button>
            <el-button icon="Document" :loading="exporting === 'pdf'" :disabled="!hasQueried || total === 0 || !!exporting" @click="handleExport('pdf')">PDF</el-button>
          </div>
        </div>
      </el-form>
    </div>

    <div class="table-heading">
      <div>
        <strong>{{ queryParams.detailType === 'gateway' ? '网关定位记录' : '传感器采样记录' }}</strong>
        <span>{{ currentPeriodLabel }}</span>
      </div>
      <span v-if="queryParams.detailType === 'gateway'" class="scope-note">数据来源：网关 GPS 历史</span>
      <span v-else class="scope-note">压力脏值保留展示，不参与有效压力判定</span>
    </div>

    <el-table v-loading="loading" :data="detailList" :empty-text="emptyText" height="480" border stripe>
      <template v-if="queryParams.detailType === 'sensor'">
        <el-table-column prop="recordTime" label="采集时间" width="168" />
        <el-table-column prop="deptName" label="所属单位" min-width="190" show-overflow-tooltip />
        <el-table-column prop="firePointName" label="消防点" min-width="145" show-overflow-tooltip>
          <template #default="scope">{{ text(scope.row.firePointName) }}</template>
        </el-table-column>
        <el-table-column prop="deviceCode" label="传感器编号" min-width="155" show-overflow-tooltip />
        <el-table-column prop="gatewayCode" label="网关编号" min-width="165" show-overflow-tooltip>
          <template #default="scope">{{ text(scope.row.gatewayCode) }}</template>
        </el-table-column>
        <el-table-column prop="pressure" label="压力(MPa)" width="105" align="center">
          <template #default="scope">{{ text(scope.row.pressure) }}</template>
        </el-table-column>
        <el-table-column prop="temperature" label="温度(℃)" width="92" align="center">
          <template #default="scope">{{ text(scope.row.temperature) }}</template>
        </el-table-column>
        <el-table-column prop="batteryLevel" label="电量(%)" width="86" align="center">
          <template #default="scope">{{ text(scope.row.batteryLevel) }}</template>
        </el-table-column>
        <el-table-column prop="signalStrength" label="信号(dBm)" width="100" align="center">
          <template #default="scope">{{ text(scope.row.signalStrength) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="82" align="center">
          <template #default="scope"><el-tag size="small" :type="sensorStatusType(scope.row.status)">{{ sensorStatus(scope.row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="数据质量" width="104" align="center">
          <template #default="scope"><el-tag size="small" :type="qualityType(scope.row.dataQuality)">{{ qualityText(scope.row.dataQuality) }}</el-tag></template>
        </el-table-column>
      </template>

      <template v-else>
        <el-table-column prop="recordTime" label="GPS时间" width="168" />
        <el-table-column prop="syncTime" label="同步时间" width="168">
          <template #default="scope">{{ text(scope.row.syncTime) }}</template>
        </el-table-column>
        <el-table-column prop="deptName" label="所属单位" min-width="210" show-overflow-tooltip />
        <el-table-column prop="firePointName" label="消防点" min-width="155" show-overflow-tooltip>
          <template #default="scope">{{ text(scope.row.firePointName) }}</template>
        </el-table-column>
        <el-table-column prop="deviceCode" label="TBoxID" min-width="120" show-overflow-tooltip />
        <el-table-column prop="gatewayImei" label="网关IMEI" min-width="180" show-overflow-tooltip>
          <template #default="scope">{{ text(scope.row.gatewayImei) }}</template>
        </el-table-column>
        <el-table-column prop="longitude" label="经度" width="145" align="center">
          <template #default="scope">{{ text(scope.row.longitude) }}</template>
        </el-table-column>
        <el-table-column prop="latitude" label="纬度" width="145" align="center">
          <template #default="scope">{{ text(scope.row.latitude) }}</template>
        </el-table-column>
      </template>
    </el-table>

    <div v-if="hasQueried" class="pagination-bar">
      <pagination
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :auto-scroll="false"
        @pagination="getList"
      />
    </div>
  </div>
</template>

<script setup name="RuntimeDetail">
import { deviceDeptTreeSelect } from '@/api/manage/deviceDept'
import { listRuntimeDetail, listRuntimeDetailDevices, listRuntimeDetailFirePoints } from '@/api/report/runtimeDetail'

const { proxy } = getCurrentInstance()
const loading = ref(false)
const deviceLoading = ref(false)
const exporting = ref('')
const total = ref(0)
const detailList = ref([])
const deptOptions = ref([])
const firePointOptions = ref([])
const deviceOptions = ref([])
const hasQueried = ref(false)
const defaultSelectedDeptId = ref(null)
let deviceSearchTimer

const ALL_DEVICES = '__all_devices__'

const queryParams = reactive({
  pageNum: 1,
  pageSize: 20,
  detailType: 'sensor',
  periodType: 'day',
  periodDate: formatDate(new Date()),
  deptId: null,
  firePointId: null,
  deviceId: null
})

const periodPickerType = computed(() => queryParams.periodType === 'month' ? 'month' : queryParams.periodType === 'week' ? 'week' : 'date')
const periodPickerFormat = computed(() => queryParams.periodType === 'month' ? 'YYYY年MM月' : queryParams.periodType === 'week' ? 'YYYY 第 ww 周' : 'YYYY-MM-DD')
const deviceFieldLabel = computed(() => queryParams.detailType === 'gateway' ? '网关' : '传感器')
const devicePlaceholder = computed(() => queryParams.detailType === 'gateway' ? '请选择或搜索网关' : '请选择或搜索传感器')
const allDevicesLabel = computed(() => queryParams.detailType === 'gateway' ? '该单位全部网关' : '该单位全部传感器')
const periodDescription = computed(() => queryParams.detailType === 'gateway'
  ? '按日、周、月查看网关 GPS 定位记录'
  : '按日、周、月查看传感器采样数据')
const currentPeriodLabel = computed(() => periodLabel(queryParams.periodType, queryParams.periodDate))
const canQuery = computed(() => !!queryParams.deptId && !!queryParams.deviceId)
const emptyText = computed(() => {
  if (!queryParams.deptId) return '请选择所属单位'
  if (!queryParams.deviceId) return `请选择${deviceFieldLabel.value}后查询`
  return hasQueried.value ? '暂无数据' : '点击搜索加载运行明细'
})
const nextPeriodDisabled = computed(() => {
  const next = movePeriod(parseLocalDate(queryParams.periodDate), queryParams.periodType, 1)
  return normalizePeriod(next, queryParams.periodType) > normalizePeriod(new Date(), queryParams.periodType)
})

async function getDeptTree() {
  const response = await deviceDeptTreeSelect()
  const values = response.data || []
  const isPlatformRoot = response.currentDeptSource === 'platform_root'
  deptOptions.value = markAllScope(values, isPlatformRoot ? response.currentDeptId : null)
  defaultSelectedDeptId.value = defaultDeptId(values, response.currentDeptId, isPlatformRoot)
  queryParams.deptId = defaultSelectedDeptId.value
}

async function getFirePoints() {
  if (!queryParams.deptId) {
    firePointOptions.value = []
    return
  }
  const response = await listRuntimeDetailFirePoints(requestParams())
  firePointOptions.value = response.data || []
}

async function getDevices(keyword = '') {
  if (!queryParams.deptId) {
    deviceOptions.value = []
    return
  }
  deviceLoading.value = true
  try {
    const response = await listRuntimeDetailDevices({
      ...requestParams(),
      deviceId: null,
      allDevices: false,
      deviceKeyword: keyword
    })
    deviceOptions.value = response.data || []
  } finally {
    deviceLoading.value = false
  }
}

async function getList() {
  if (!canQuery.value) {
    proxy.$modal.msgWarning(`请选择${deviceFieldLabel.value}，或主动选择${allDevicesLabel.value}`)
    return
  }
  loading.value = true
  try {
    const response = await listRuntimeDetail(requestParams())
    detailList.value = response.rows || []
    total.value = response.total || 0
    hasQueried.value = true
  } finally {
    loading.value = false
  }
}

function requestParams() {
  const allDevices = queryParams.deviceId === ALL_DEVICES
  return {
    ...queryParams,
    deviceId: allDevices ? null : queryParams.deviceId,
    allDevices,
    periodDate: normalizePeriod(queryParams.periodDate, queryParams.periodType)
  }
}

function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

async function handleDeptChange() {
  queryParams.firePointId = null
  queryParams.deviceId = null
  clearResults()
  await Promise.all([getFirePoints(), getDevices()])
}

async function handleFirePointChange() {
  queryParams.deviceId = null
  clearResults()
  await getDevices()
}

async function handleDetailTypeChange() {
  queryParams.deviceId = null
  deviceOptions.value = []
  clearResults()
  await getDevices()
}

function handlePeriodTypeChange() {
  queryParams.periodDate = normalizePeriod(new Date(), queryParams.periodType)
  clearResults()
}

function shiftPeriod(amount) {
  const target = movePeriod(parseLocalDate(queryParams.periodDate), queryParams.periodType, amount)
  queryParams.periodDate = normalizePeriod(target, queryParams.periodType)
  clearResults()
}

function goCurrentPeriod() {
  queryParams.periodDate = normalizePeriod(new Date(), queryParams.periodType)
  clearResults()
}

async function resetQuery() {
  queryParams.pageNum = 1
  queryParams.pageSize = 20
  queryParams.periodType = 'day'
  queryParams.periodDate = formatDate(new Date())
  queryParams.deptId = defaultSelectedDeptId.value
  queryParams.firePointId = null
  queryParams.deviceId = null
  clearResults()
  await Promise.all([getFirePoints(), getDevices()])
}

function clearResults() {
  queryParams.pageNum = 1
  detailList.value = []
  total.value = 0
  hasQueried.value = false
}

function remoteSearchDevices(keyword) {
  clearTimeout(deviceSearchTimer)
  deviceSearchTimer = setTimeout(() => getDevices(keyword), 250)
}

function handleDeviceSelectVisible(visible) {
  if (visible && deviceOptions.value.length === 0) getDevices()
}

async function handleExport(format) {
  exporting.value = format
  const typeName = queryParams.detailType === 'gateway' ? '网关定位明细' : '传感器运行明细'
  try {
    await proxy.download(
      `report/runtime-detail/export/${format}`,
      requestParams(),
      `${currentPeriodLabel.value}-${typeName}.${format === 'excel' ? 'xlsx' : 'pdf'}`,
      { timeout: 180000 }
    )
  } finally {
    exporting.value = ''
  }
}

function firePointLabel(item) {
  return item.deptName ? `${item.firePointName}（${item.deptName}）` : item.firePointName
}

function deviceOptionLabel(item) {
  const codes = [item.deviceCode, item.secondaryCode].filter(Boolean).join(' / ')
  const location = item.firePointName || item.deptName
  return location ? `${codes || item.deviceId}（${location}）` : (codes || String(item.deviceId))
}

function markAllScope(nodes, platformRootDeptId) {
  return nodes.map(node => ({
    ...node,
    label: String(node.id) === String(platformRootDeptId) ? `${node.label}（全部授权单位）` : node.label,
    children: markAllScope(node.children || [], platformRootDeptId)
  }))
}

function defaultDeptId(nodes, currentDeptId, isPlatformRoot) {
  if (!nodes.length) return null
  const currentDept = findDeptNode(nodes, currentDeptId)
  if (currentDept && !isPlatformRoot) return currentDept.id
  if (currentDept && currentDept.children?.length) return currentDept.children[0].id
  return currentDept?.id || nodes[0].id
}

function findDeptNode(nodes, deptId) {
  for (const node of nodes) {
    if (String(node.id) === String(deptId)) return node
    const child = findDeptNode(node.children || [], deptId)
    if (child) return child
  }
  return null
}

function disableFutureDate(date) {
  return normalizePeriod(date, queryParams.periodType) > normalizePeriod(new Date(), queryParams.periodType)
}

function normalizePeriod(value, type) {
  return formatDate(normalizePeriodDate(parseLocalDate(value), type))
}

function normalizePeriodDate(date, type) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)
  if (type === 'week') {
    const day = result.getDay() || 7
    result.setDate(result.getDate() - day + 1)
  } else if (type === 'month') {
    result.setDate(1)
  }
  return result
}

function movePeriod(date, type, amount) {
  const result = normalizePeriodDate(date, type)
  if (type === 'month') result.setMonth(result.getMonth() + amount)
  else result.setDate(result.getDate() + amount * (type === 'week' ? 7 : 1))
  return result
}

function periodLabel(type, value) {
  const start = normalizePeriodDate(parseLocalDate(value), type)
  if (type === 'month') return `${start.getFullYear()}年${String(start.getMonth() + 1).padStart(2, '0')}月`
  if (type === 'week') {
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return `${formatDate(start)} 至 ${formatDate(end)}`
  }
  return formatDate(start)
}

function parseLocalDate(value) {
  if (value instanceof Date) return value
  const parts = String(value || formatDate(new Date())).split('-').map(Number)
  return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1, 12)
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function text(value) {
  return value === null || value === undefined || value === '' ? '-' : value
}

function sensorStatus(status) {
  if (String(status) === '0') return '正常'
  if (String(status) === '1') return '异常'
  if (String(status) === '2') return '离线'
  return text(status)
}

function sensorStatusType(status) {
  if (String(status) === '0') return 'success'
  if (String(status) === '1') return 'danger'
  return 'info'
}

function qualityText(value) {
  if (value === 'dirty_pressure') return '压力脏值'
  if (value === 'missing') return '数据缺失'
  return '有效'
}

function qualityType(value) {
  if (value === 'dirty_pressure') return 'warning'
  if (value === 'missing') return 'info'
  return 'success'
}

onMounted(async () => {
  await getDeptTree()
  await Promise.all([getFirePoints(), getDevices()])
})

onBeforeUnmount(() => clearTimeout(deviceSearchTimer))
</script>

<style scoped lang="scss">
.runtime-detail-page {
  .page-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 16px;

    h2 {
      margin: 0 0 5px;
      color: #1f374f;
      font-size: 22px;
      letter-spacing: 0;
    }

    p {
      margin: 0;
      color: #758397;
      font-size: 13px;
    }
  }

  .query-band {
    margin: 0 -20px 16px;
    padding: 18px 20px 14px;
    border-top: 1px solid #e4e9f0;
    border-bottom: 1px solid #e4e9f0;
    background: #f7f9fc;
  }

  .query-grid {
    display: grid;
    grid-template-columns: minmax(250px, .85fr) minmax(430px, 1.35fr) minmax(260px, 1fr);
    gap: 2px 18px;

    :deep(.el-form-item) {
      margin-bottom: 14px;
    }

    :deep(.el-select),
    :deep(.el-tree-select),
    :deep(.el-input) {
      width: 100%;
    }
  }

  .period-control {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;

    .period-picker {
      flex: 1;
      min-width: 190px;
    }

    .current-period {
      flex: none;
    }
  }

  .query-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid #e3e8ef;
  }

  .export-actions {
    display: flex;
    align-items: center;
    gap: 10px;

    > span {
      margin-right: 4px;
      color: #7b8798;
      font-size: 13px;
    }
  }

  .table-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 42px;

    strong {
      color: #263c52;
      font-size: 16px;
    }

    div span {
      margin-left: 12px;
      color: #7b8798;
      font-size: 13px;
    }

    .scope-note {
      color: #8390a0;
      font-size: 12px;
    }
  }

  .pagination-bar {
    min-height: 56px;
    border: 1px solid #e4e9f0;
    border-top: 0;
    background: #fff;
  }
}

@media (max-width: 1280px) {
  .runtime-detail-page {
    .query-grid {
      grid-template-columns: repeat(2, minmax(300px, 1fr));
    }
  }
}

@media (max-width: 768px) {
  .runtime-detail-page {
    .page-heading,
    .query-actions,
    .table-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .query-grid {
      grid-template-columns: 1fr;
    }

    .period-control {
      flex-wrap: wrap;
    }

    .export-actions {
      width: 100%;
    }
  }
}
</style>
