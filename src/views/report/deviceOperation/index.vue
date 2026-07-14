<template>
  <div class="app-container operation-report-page">
    <div class="page-heading">
      <div>
        <h2>设备运行报告</h2>
        <p>普通设备运行统计与数据质量汇总</p>
      </div>
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
                @change="clearPreview"
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
              placeholder="请选择所属单位"
              check-strictly
              filterable
              @change="clearPreview"
            />
          </el-form-item>
        </div>

        <div class="query-actions">
          <div>
            <el-button type="primary" icon="Refresh" :loading="loading" @click="generatePreview">生成预览</el-button>
            <el-button icon="RefreshLeft" @click="resetQuery">重置</el-button>
          </div>
          <div class="export-actions" v-hasPermi="['report:deviceOperation:export']">
            <el-button icon="Download" :loading="exporting === 'excel'" :disabled="!preview || !!exporting" @click="handleExport('excel')">Excel</el-button>
            <el-button icon="Document" :loading="exporting === 'pdf'" :disabled="!preview || !!exporting" @click="handleExport('pdf')">PDF</el-button>
          </div>
        </div>
      </el-form>
    </div>

    <div v-loading="loading" class="report-stage">
      <el-empty v-if="!preview && !loading" description="请选择单位和周期后生成报告" :image-size="82" />

      <article v-else-if="preview" class="report-paper">
        <header class="report-header">
          <h1>{{ preview.reportTitle }}</h1>
          <div class="report-meta">
            <span>统计周期：{{ text(preview.periodLabel) }}</span>
            <span>生成时间：{{ text(preview.generatedTime) }}</span>
          </div>
        </header>

        <section class="report-section">
          <h3>一、单位与统计周期</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="单位名称">{{ text(preview.unitInfo?.deptName) }}</el-descriptions-item>
            <el-descriptions-item label="上级单位">{{ text(preview.unitInfo?.parentDeptName) }}</el-descriptions-item>
            <el-descriptions-item label="归属地区">{{ unitArea }}</el-descriptions-item>
            <el-descriptions-item label="统计范围">{{ text(preview.scopeName) }}</el-descriptions-item>
            <el-descriptions-item label="报告周期">{{ text(preview.periodLabel) }}</el-descriptions-item>
            <el-descriptions-item label="报告类型">{{ text(preview.periodTypeName) }}</el-descriptions-item>
          </el-descriptions>
        </section>

        <section class="report-section">
          <h3>二、设备资产概况</h3>
          <div class="asset-grid">
            <div v-for="item in assetMetrics" :key="item.label" class="asset-item">
              <span>{{ item.label }}</span>
              <strong>{{ text(item.value) }}</strong>
              <small>{{ item.unit }}</small>
            </div>
          </div>
        </section>

        <section class="report-section">
          <h3>三、传感器采样概况</h3>
          <metric-table :rows="sensorMetrics" />
        </section>

        <section class="report-section">
          <h3>四、网关定位数据概况</h3>
          <metric-table :rows="gatewayMetrics" />
        </section>

        <section class="report-section">
          <h3>五、灭火器资料概况</h3>
          <metric-table :rows="extinguisherMetrics" />
        </section>

        <section class="report-section">
          <h3>六、消防点快照概况</h3>
          <metric-table :rows="firePointMetrics" />
        </section>

        <section class="report-section report-note">
          <h3>七、统计口径说明</h3>
          <p>本报告仅汇总普通设备运行和数据质量信息，不在生成时临时判定低压、高压、低电量、温度异常等预警。</p>
          <p>预警生成、持续覆盖、自动恢复和状态流转由设备预警模块负责；待其历史口径稳定后，本报告再统一读取预警结果。</p>
        </section>
      </article>
    </div>
  </div>
</template>

<script setup name="DeviceOperationReport">
import { defineComponent, h } from 'vue'
import { deviceDeptTreeSelect } from '@/api/manage/deviceDept'
import { previewDeviceOperationReport } from '@/api/report/deviceOperation'

const { proxy } = getCurrentInstance()
const loading = ref(false)
const exporting = ref('')
const deptOptions = ref([])
const preview = ref(null)
const defaultSelectedDeptId = ref(null)

const queryParams = reactive({
  periodType: 'day',
  periodDate: formatDate(new Date()),
  deptId: null
})

const MetricTable = defineComponent({
  name: 'MetricTable',
  props: { rows: { type: Array, default: () => [] } },
  setup(props) {
    return () => h('div', { class: 'metric-table' }, [
      h('div', { class: 'metric-row metric-header' }, [h('span', '统计项'), h('span', '统计值'), h('span', '口径说明')]),
      ...props.rows.map(row => h('div', { class: 'metric-row' }, [h('span', row.label), h('strong', text(row.value)), h('span', row.note)]))
    ])
  }
})

const periodPickerType = computed(() => queryParams.periodType === 'month' ? 'month' : queryParams.periodType === 'week' ? 'week' : 'date')
const periodPickerFormat = computed(() => queryParams.periodType === 'month' ? 'YYYY年MM月' : queryParams.periodType === 'week' ? 'YYYY 第 ww 周' : 'YYYY-MM-DD')
const nextPeriodDisabled = computed(() => {
  const next = movePeriod(parseLocalDate(queryParams.periodDate), queryParams.periodType, 1)
  return normalizePeriod(next, queryParams.periodType) > normalizePeriod(new Date(), queryParams.periodType)
})
const unitArea = computed(() => {
  const unit = preview.value?.unitInfo || {}
  return [unit.province, unit.city, unit.area].filter(Boolean).join(' / ') || '-'
})
const assetMetrics = computed(() => {
  const value = preview.value?.assetOverview || {}
  return [
    { label: '消防点', value: value.firePointCount, unit: '处' },
    { label: '网关', value: value.gatewayCount, unit: '台' },
    { label: '传感器', value: value.sensorCount, unit: '个' },
    { label: '灭火器', value: value.extinguisherCount, unit: '具' }
  ]
})
const sensorMetrics = computed(() => {
  const value = preview.value?.sensorSummary || {}
  return [
    metric('纳入传感器', value.sensorCount, '统计范围内有效传感器数量'),
    metric('有采样传感器', value.reportingSensorCount, '本周期至少产生一条历史采样'),
    metric('无采样传感器', value.noSampleSensorCount, '本周期未产生历史采样'),
    metric('历史采样总数', value.sampleCount, '本周期传感器历史记录数量'),
    metric('有效压力样本', value.validPressureCount, '压力值位于0至2000范围'),
    metric('压力脏值', value.invalidPressureCount, '压力小于0或大于2000，仅作数据质量统计'),
    metric('压力缺失样本', value.missingPressureCount, '历史记录存在但压力为空'),
    metric('平均压力(MPa)', value.avgPressure, '仅使用有效压力样本计算'),
    metric('平均温度(℃)', value.avgTemperature, '本周期非空温度样本平均值'),
    metric('平均电量(%)', value.avgBatteryLevel, '本周期非空电量样本平均值')
  ]
})
const gatewayMetrics = computed(() => {
  const value = preview.value?.gatewaySummary || {}
  return [
    metric('纳入网关', value.gatewayCount, '统计范围内有效网关数量'),
    metric('有GPS记录网关', value.reportingGatewayCount, '本周期至少产生一条GPS历史记录'),
    metric('无GPS记录网关', value.noGpsGatewayCount, '本周期未产生GPS历史记录'),
    metric('GPS记录总数', value.gpsRecordCount, '本周期网关GPS历史记录数量')
  ]
})
const extinguisherMetrics = computed(() => {
  const value = preview.value?.extinguisherSummary || {}
  return [
    metric('灭火器总数', value.extinguisherCount, '统计范围内有效灭火器数量'),
    metric('本周期已同步', value.syncedCount, '最后同步时间落在本周期'),
    metric('业务资料完整', value.profileCompleteCount, '生产日期、类型、形式、标准及温度范围齐全'),
    metric('业务资料不完整', value.profileIncompleteCount, '上述资料至少一项缺失'),
    metric('已绑定传感器', value.boundSensorCount, '已建立灭火器与传感器关联'),
    metric('未绑定传感器', value.unboundSensorCount, '尚未建立灭火器与传感器关联')
  ]
})
const firePointMetrics = computed(() => {
  const value = preview.value?.firePointSummary || {}
  return [
    metric('消防点总数', value.firePointCount, '统计范围内有效消防点数量'),
    metric('有快照消防点', value.snapshotCoveredCount, '本周期至少产生一条设备快照'),
    metric('无快照消防点', value.noSnapshotCount, '本周期未产生设备快照'),
    metric('设备快照总数', value.snapshotCount, '本周期消防点设备快照数量'),
    metric('已设置应配数量', value.expectedConfiguredCount, '应配灭火器数量大于0的消防点')
  ]
})

async function getDeptTree() {
  const response = await deviceDeptTreeSelect()
  const values = response.data || []
  const isPlatformRoot = response.currentDeptSource === 'platform_root'
  deptOptions.value = markAllScope(values, isPlatformRoot ? response.currentDeptId : null)
  defaultSelectedDeptId.value = defaultDeptId(values, response.currentDeptId, isPlatformRoot)
  queryParams.deptId = defaultSelectedDeptId.value
}

async function generatePreview() {
  if (!queryParams.deptId) {
    proxy.$modal.msgWarning('请选择所属单位')
    return
  }
  loading.value = true
  try {
    const response = await previewDeviceOperationReport(requestParams())
    preview.value = response.data || null
  } finally {
    loading.value = false
  }
}

async function handleExport(format) {
  if (!preview.value) return
  exporting.value = format
  try {
    await proxy.download(
      `report/device-operation/export/${format}`,
      requestParams(),
      `${preview.value.reportTitle}.${format === 'excel' ? 'xlsx' : 'pdf'}`,
      { timeout: 180000 }
    )
  } finally {
    exporting.value = ''
  }
}

function requestParams() {
  return {
    ...queryParams,
    periodDate: normalizePeriod(queryParams.periodDate, queryParams.periodType)
  }
}

function handlePeriodTypeChange() {
  queryParams.periodDate = normalizePeriod(new Date(), queryParams.periodType)
  clearPreview()
}

function shiftPeriod(amount) {
  queryParams.periodDate = normalizePeriod(movePeriod(parseLocalDate(queryParams.periodDate), queryParams.periodType, amount), queryParams.periodType)
  clearPreview()
}

function goCurrentPeriod() {
  queryParams.periodDate = normalizePeriod(new Date(), queryParams.periodType)
  clearPreview()
}

function resetQuery() {
  queryParams.periodType = 'day'
  queryParams.periodDate = formatDate(new Date())
  queryParams.deptId = defaultSelectedDeptId.value
  clearPreview()
}

function clearPreview() {
  preview.value = null
}

function metric(label, value, note) {
  return { label, value, note }
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

onMounted(getDeptTree)
</script>

<style scoped lang="scss">
.operation-report-page {
  .page-heading {
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
    margin: 0 -20px 18px;
    padding: 18px 20px 14px;
    border-top: 1px solid #e4e9f0;
    border-bottom: 1px solid #e4e9f0;
    background: #f7f9fc;
  }

  .query-grid {
    display: grid;
    grid-template-columns: minmax(250px, .8fr) minmax(430px, 1.25fr) minmax(280px, 1fr);
    gap: 2px 20px;

    :deep(.el-form-item) {
      margin-bottom: 14px;
    }

    :deep(.el-tree-select) {
      width: 100%;
    }
  }

  .period-control {
    display: flex;
    align-items: center;
    gap: 8px;

    .period-picker {
      flex: 1;
      min-width: 190px;
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
    gap: 10px;
  }

  .report-stage {
    min-height: 340px;
  }

  .report-paper {
    padding: 30px 36px 40px;
    border: 1px solid #dfe5ec;
    background: #fff;
  }

  .report-header {
    padding-bottom: 22px;
    border-bottom: 2px solid #2d4054;
    text-align: center;

    h1 {
      margin: 0 0 14px;
      color: #20384f;
      font-size: 26px;
      letter-spacing: 0;
    }
  }

  .report-meta {
    display: flex;
    justify-content: center;
    gap: 36px;
    color: #6d7a8b;
    font-size: 13px;
  }

  .report-section {
    margin-top: 26px;

    h3 {
      margin: 0 0 12px;
      color: #263d53;
      font-size: 16px;
      letter-spacing: 0;
    }

    :deep(.el-descriptions__label) {
      width: 120px;
      color: #405267;
      background: #f4f6f8;
    }
  }

  .asset-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    border: 1px solid #dfe5ec;
  }

  .asset-item {
    min-height: 96px;
    padding: 18px 20px;
    border-right: 1px solid #dfe5ec;

    &:last-child {
      border-right: 0;
    }

    span {
      display: block;
      color: #6e7b8c;
      font-size: 13px;
    }

    strong {
      display: inline-block;
      margin-top: 8px;
      color: #20384f;
      font-size: 28px;
      font-weight: 600;
    }

    small {
      margin-left: 5px;
      color: #7c8897;
    }
  }

  :deep(.metric-table) {
    border: 1px solid #dfe5ec;
    border-bottom: 0;
  }

  :deep(.metric-row) {
    display: grid;
    grid-template-columns: minmax(180px, .8fr) minmax(120px, .45fr) minmax(360px, 1.75fr);
    min-height: 42px;
    border-bottom: 1px solid #dfe5ec;

    > * {
      display: flex;
      align-items: center;
      padding: 9px 14px;
      border-right: 1px solid #dfe5ec;
      color: #45566a;
      font-size: 13px;
    }

    > *:last-child {
      border-right: 0;
    }

    strong {
      justify-content: center;
      color: #20384f;
      font-size: 15px;
    }
  }

  :deep(.metric-header) {
    min-height: 40px;
    background: #f4f6f8;
    font-weight: 600;
  }

  .report-note {
    padding: 16px 18px;
    border: 1px solid #dfe5ec;
    background: #f8f9fb;

    p {
      margin: 7px 0;
      color: #5e6c7d;
      font-size: 13px;
      line-height: 1.75;
    }
  }
}

@media (max-width: 1280px) {
  .operation-report-page {
    .query-grid {
      grid-template-columns: repeat(2, minmax(300px, 1fr));
    }
  }
}

@media (max-width: 768px) {
  .operation-report-page {
    .query-grid {
      grid-template-columns: 1fr;
    }

    .query-actions,
    .report-meta {
      align-items: flex-start;
      flex-direction: column;
    }

    .period-control {
      flex-wrap: wrap;
    }

    .asset-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .asset-item:nth-child(2) {
      border-right: 0;
    }

    .report-paper {
      padding: 22px 16px 30px;
      overflow-x: auto;
    }

    :deep(.metric-table) {
      min-width: 720px;
    }
  }
}
</style>
