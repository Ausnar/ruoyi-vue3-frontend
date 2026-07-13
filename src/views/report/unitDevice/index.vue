<template>
  <div class="app-container unit-device-report">
    <div class="report-toolbar">
      <div class="toolbar-title">
        <h2>单位设备报告</h2>
        <span>{{ preview?.scopeName || '当前所属单位及下级单位' }}</span>
      </div>
      <div class="toolbar-controls">
        <el-tree-select
          v-model="queryParams.deptId"
          :data="deptOptions"
          :props="{ value: 'id', label: 'label', children: 'children' }"
          value-key="id"
          placeholder="当前所属单位"
          check-strictly
          filterable
          clearable
          class="dept-select"
          @change="handleDeptChange"
        />
        <el-button type="primary" icon="Refresh" :loading="loading" @click="loadPreview">生成预览</el-button>
        <el-button
          icon="Download"
          :loading="exporting === 'excel'"
          :disabled="!preview || !!exporting"
          v-hasPermi="['report:unitDevice:export']"
          @click="handleExport('excel')"
        >Excel</el-button>
        <el-button
          icon="Document"
          :loading="exporting === 'pdf'"
          :disabled="!preview || !!exporting"
          v-hasPermi="['report:unitDevice:export']"
          @click="handleExport('pdf')"
        >PDF</el-button>
      </div>
    </div>

    <el-skeleton :loading="loading && !preview" animated :rows="12">
      <template #default>
        <div v-if="preview" class="report-paper">
          <header class="report-header">
            <h1>{{ preview.reportTitle }}</h1>
            <div class="report-meta">
              <span>统计范围：{{ preview.scopeName }}</span>
              <span>生成时间：{{ preview.generatedTime }}</span>
            </div>
          </header>

          <section class="report-section">
            <h3><b>一</b>单位基本信息</h3>
            <el-descriptions :column="2" border class="unit-descriptions">
              <el-descriptions-item label="单位名称">{{ text(unitInfo.deptName) }}</el-descriptions-item>
              <el-descriptions-item label="上级单位">{{ text(unitInfo.parentDeptName) }}</el-descriptions-item>
              <el-descriptions-item label="归属地区">{{ areaText(unitInfo) }}</el-descriptions-item>
              <el-descriptions-item label="单位状态">{{ unitStatus(unitInfo.status) }}</el-descriptions-item>
              <el-descriptions-item label="负责人">{{ text(unitInfo.leader) }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ text(unitInfo.phone) }}</el-descriptions-item>
              <el-descriptions-item label="电子邮箱">{{ text(unitInfo.email) }}</el-descriptions-item>
              <el-descriptions-item label="统计口径">所选单位及下级单位</el-descriptions-item>
            </el-descriptions>
          </section>

          <section class="report-section">
            <h3><b>二</b>设备概况</h3>
            <div class="overview-grid">
              <div v-for="item in overviewItems" :key="item.label" class="overview-item">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
                <small>{{ item.unit }}</small>
              </div>
            </div>
          </section>

          <section class="report-section">
            <h3><b>三</b>消防点信息 <em>{{ firePoints.length }}处</em></h3>
            <el-table :data="firePoints" border max-height="460" class="report-table">
              <el-table-column type="index" label="序号" width="60" align="center" />
              <el-table-column prop="deptName" label="所属单位" min-width="180" show-overflow-tooltip />
              <el-table-column prop="firePointName" label="消防点" min-width="150" show-overflow-tooltip />
              <el-table-column prop="firePointCode" label="编号" min-width="130" show-overflow-tooltip />
              <el-table-column label="类型" width="130"><template #default="scope">{{ firePointType(scope.row.stationType) }}</template></el-table-column>
              <el-table-column prop="location" label="位置" min-width="150" show-overflow-tooltip />
              <el-table-column label="应配/实配" width="105" align="center">
                <template #default="scope">{{ text(scope.row.expectedExtinguisherCount) }}/{{ text(scope.row.actualExtinguisherCount) }}</template>
              </el-table-column>
              <el-table-column prop="actualSensorCount" label="传感器" width="82" align="center" />
              <el-table-column label="状态" width="80" align="center">
                <template #default="scope"><el-tag size="small" :type="scope.row.status === '0' ? 'success' : 'info'">{{ firePointStatus(scope.row.status) }}</el-tag></template>
              </el-table-column>
            </el-table>
          </section>

          <section class="report-section">
            <h3><b>四</b>网关信息 <em>{{ gateways.length }}台</em></h3>
            <el-table :data="gateways" border max-height="460" class="report-table">
              <el-table-column type="index" label="序号" width="60" align="center" />
              <el-table-column prop="deptName" label="所属单位" min-width="180" show-overflow-tooltip />
              <el-table-column prop="firePointName" label="消防点" min-width="140" show-overflow-tooltip />
              <el-table-column prop="externalTboxId" label="TBoxID" width="100" :formatter="emptyFormatter" />
              <el-table-column prop="imei" label="网关IMEI" min-width="160" show-overflow-tooltip />
              <el-table-column prop="sim" label="SIM" min-width="130" :formatter="emptyFormatter" />
              <el-table-column label="状态" width="80" align="center">
                <template #default="scope"><el-tag size="small" :type="gatewayTagType(scope.row.status)">{{ gatewayStatus(scope.row.status) }}</el-tag></template>
              </el-table-column>
              <el-table-column label="最后在线时间" width="165"><template #default="scope">{{ dateTime(scope.row.lastOnlineTime) }}</template></el-table-column>
              <el-table-column label="最后同步时间" width="165"><template #default="scope">{{ dateTime(scope.row.lastSyncTime) }}</template></el-table-column>
            </el-table>
          </section>

          <section class="report-section">
            <h3><b>五</b>传感器信息 <em>{{ sensors.length }}个</em></h3>
            <el-table :data="sensors" border max-height="460" class="report-table">
              <el-table-column type="index" label="序号" width="60" align="center" />
              <el-table-column prop="deptName" label="所属单位" min-width="180" show-overflow-tooltip />
              <el-table-column prop="firePointName" label="消防点" min-width="140" show-overflow-tooltip />
              <el-table-column prop="sensorCode" label="传感器编号" min-width="150" show-overflow-tooltip />
              <el-table-column prop="gatewayCode" label="网关编号" min-width="150" show-overflow-tooltip />
              <el-table-column prop="pressure" label="压力(MPa)" width="100" align="center" :formatter="emptyFormatter" />
              <el-table-column prop="temperature" label="温度(℃)" width="90" align="center" :formatter="emptyFormatter" />
              <el-table-column prop="batteryLevel" label="电量(%)" width="85" align="center" :formatter="emptyFormatter" />
              <el-table-column label="状态" width="80" align="center">
                <template #default="scope"><el-tag size="small" :type="sensorTagType(scope.row.status)">{{ sensorStatus(scope.row.status) }}</el-tag></template>
              </el-table-column>
              <el-table-column label="最后在线时间" width="165"><template #default="scope">{{ dateTime(scope.row.lastOnlineTime) }}</template></el-table-column>
            </el-table>
          </section>

          <section class="report-section">
            <h3><b>六</b>灭火器信息 <em>{{ extinguishers.length }}具</em></h3>
            <el-table :data="extinguishers" border max-height="460" class="report-table">
              <el-table-column type="index" label="序号" width="60" align="center" />
              <el-table-column prop="deptName" label="所属单位" min-width="180" show-overflow-tooltip />
              <el-table-column prop="firePointName" label="消防点" min-width="140" show-overflow-tooltip />
              <el-table-column prop="labelCode" label="标志铭码" min-width="150" show-overflow-tooltip />
              <el-table-column label="产品/规格" min-width="180" show-overflow-tooltip><template #default="scope">{{ join(scope.row.productName, scope.row.specification) }}</template></el-table-column>
              <el-table-column label="类型/形式" width="130"><template #default="scope">{{ join(extinguisherType(scope.row.extinguisherType), extinguisherForm(scope.row.extinguisherForm)) }}</template></el-table-column>
              <el-table-column prop="sensorCode" label="传感器编号" min-width="145" :formatter="emptyFormatter" />
              <el-table-column label="生产日期" width="110"><template #default="scope">{{ dateOnly(scope.row.productionDate) }}</template></el-table-column>
              <el-table-column label="到期日期" width="110"><template #default="scope">{{ dateOnly(scope.row.expiryDate) }}</template></el-table-column>
              <el-table-column label="状态" width="80" align="center">
                <template #default="scope"><el-tag size="small" :type="extinguisherTagType(scope.row.status)">{{ extinguisherStatus(scope.row.status) }}</el-tag></template>
              </el-table-column>
            </el-table>
          </section>

          <section class="report-section report-note">
            <h3><b>七</b>数据口径说明</h3>
            <p>本报告按生成时点的当前有效主数据统计。网关最后在线时间当前不一定来自 SDK 真实在线时间，仅作资料展示；缺失所属单位的数据不进入普通用户授权范围统计。</p>
          </section>
        </div>

        <el-empty v-else description="暂无报告预览" />
      </template>
    </el-skeleton>
  </div>
</template>

<script setup name="UnitDeviceReport">
import { previewUnitDeviceReport } from '@/api/report/unitDevice'
import { deviceDeptTreeSelect } from '@/api/manage/deviceDept'

const { proxy } = getCurrentInstance()
const loading = ref(false)
const exporting = ref('')
const preview = ref(null)
const deptOptions = ref([])
const queryParams = reactive({ deptId: null })

const unitInfo = computed(() => preview.value?.unitInfo || {})
const overview = computed(() => preview.value?.overview || {})
const firePoints = computed(() => preview.value?.firePoints || [])
const gateways = computed(() => preview.value?.gateways || [])
const sensors = computed(() => preview.value?.sensors || [])
const extinguishers = computed(() => preview.value?.extinguishers || [])
const overviewItems = computed(() => [
  { label: '下级单位', value: overview.value.childDeptCount || 0, unit: '个' },
  { label: '消防点', value: overview.value.firePointCount || 0, unit: '处' },
  { label: '网关', value: overview.value.gatewayCount || 0, unit: '台' },
  { label: '传感器', value: overview.value.sensorCount || 0, unit: '个' },
  { label: '灭火器', value: overview.value.extinguisherCount || 0, unit: '具' },
  { label: '资料待完善', value: qualityCount.value, unit: '项' }
])
const qualityCount = computed(() =>
  Number(overview.value.gatewayUnboundFirePointCount || 0)
  + Number(overview.value.sensorUnboundGatewayCount || 0)
  + Number(overview.value.extinguisherUnboundSensorCount || 0)
)

async function getDeptTree() {
  const response = await deviceDeptTreeSelect()
  deptOptions.value = response.data || []
}

async function loadPreview() {
  loading.value = true
  try {
    const response = await previewUnitDeviceReport({ deptId: queryParams.deptId })
    preview.value = response.data
    if (!queryParams.deptId && response.data?.unitInfo?.deptId) {
      queryParams.deptId = response.data.unitInfo.deptId
    }
  } finally {
    loading.value = false
  }
}

function handleDeptChange() {
  preview.value = null
}

async function handleExport(format) {
  exporting.value = format
  const unitName = unitInfo.value.deptName || '单位'
  try {
    await proxy.download(
      `report/unit-device/export/${format}`,
      { deptId: queryParams.deptId },
      `${unitName}-单位设备报告.${format === 'excel' ? 'xlsx' : 'pdf'}`,
      { timeout: 120000 }
    )
  } finally {
    exporting.value = ''
  }
}

function text(value) {
  return value === null || value === undefined || value === '' ? '-' : value
}

function areaText(unit) {
  return [unit.province, unit.city, unit.area].filter(Boolean).join(' / ') || '-'
}

function dateTime(value) {
  return value ? proxy.parseTime(value, '{y}-{m}-{d} {h}:{i}:{s}') : '-'
}

function dateOnly(value) {
  return value ? proxy.parseTime(value, '{y}-{m}-{d}') : '-'
}

function emptyFormatter(row, column, value) {
  return text(value)
}

function join(first, second) {
  return [first, second].filter(value => value && value !== '-').join(' / ') || '-'
}

function unitStatus(status) {
  return status === '0' ? '正常' : status === '1' ? '停用' : text(status)
}

function firePointStatus(status) {
  return status === '0' ? '正常' : status === '1' ? '停用' : text(status)
}

function firePointType(type) {
  if (String(type).toUpperCase() === 'D') return '楼用 / 建筑物'
  if (String(type).toUpperCase() === 'B') return '车用 / 公交车辆'
  return text(type)
}

function gatewayStatus(status) {
  if (status === '0' || status === 'online') return '在线'
  if (status === '1' || status === 'abnormal') return '异常'
  if (status === '2' || status === 'offline') return '离线'
  return text(status)
}

function gatewayTagType(status) {
  if (status === '0' || status === 'online') return 'success'
  if (status === '2' || status === 'offline') return 'danger'
  return 'warning'
}

function sensorStatus(status) {
  return status === '0' ? '正常' : status === '1' ? '异常' : status === '2' ? '离线' : text(status)
}

function sensorTagType(status) {
  return status === '0' ? 'success' : status === '2' ? 'danger' : 'warning'
}

function extinguisherType(type) {
  return ({ water_based: '水基型', dry_powder: '干粉', clean_gas: '洁净气体', co2: '二氧化碳' })[type] || text(type)
}

function extinguisherForm(form) {
  return ({ portable: '手提式', wheeled: '推车式' })[form] || text(form)
}

function extinguisherStatus(status) {
  return ({ 0: '正常', 1: '待检', 2: '过期', 3: '停用', 4: '报废' })[status] || text(status)
}

function extinguisherTagType(status) {
  return status === '0' ? 'success' : ['2', '4'].includes(status) ? 'danger' : 'warning'
}

onMounted(async () => {
  await Promise.all([getDeptTree(), loadPreview()])
})
</script>

<style scoped>
.unit-device-report {
  min-height: calc(100vh - 84px);
  background: #edf2f7;
  color: #243244;
}

.report-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 20px;
  margin-bottom: 16px;
  background: #fff;
  border: 1px solid #dbe3ec;
  border-radius: 6px;
}

.toolbar-title h2 {
  margin: 0;
  font-size: 20px;
  line-height: 28px;
  letter-spacing: 0;
}

.toolbar-title span {
  display: block;
  margin-top: 3px;
  color: #718096;
  font-size: 13px;
}

.toolbar-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.dept-select {
  width: 280px;
}

.report-paper {
  width: 100%;
  padding: 30px 34px 40px;
  background: #fff;
  border: 1px solid #d6dee8;
  box-shadow: 0 8px 24px rgba(34, 54, 78, 0.08);
}

.report-header {
  padding-bottom: 22px;
  border-bottom: 2px solid #223b57;
  text-align: center;
}

.report-header h1 {
  margin: 0;
  color: #1f3751;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0;
}

.report-meta {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 30px;
  margin-top: 13px;
  color: #65758a;
  font-size: 13px;
}

.report-section {
  margin-top: 28px;
}

.report-section h3 {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 12px;
  color: #253d57;
  font-size: 16px;
  letter-spacing: 0;
}

.report-section h3 b {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #fff;
  background: #3270ad;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
}

.report-section h3 em {
  margin-left: auto;
  color: #718096;
  font-size: 13px;
  font-style: normal;
  font-weight: 400;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(130px, 1fr));
  border-top: 1px solid #dbe3ec;
  border-left: 1px solid #dbe3ec;
}

.overview-item {
  min-height: 86px;
  padding: 14px 16px;
  border-right: 1px solid #dbe3ec;
  border-bottom: 1px solid #dbe3ec;
  background: #f8fafc;
}

.overview-item span {
  display: block;
  color: #6b7b90;
  font-size: 13px;
}

.overview-item strong {
  display: inline-block;
  margin-top: 11px;
  color: #1f466c;
  font-size: 26px;
  line-height: 1;
}

.overview-item small {
  margin-left: 5px;
  color: #8b98a9;
}

.report-table :deep(.el-table__header th) {
  color: #263d55;
  background: #eaf1f7;
}

.report-note {
  padding: 16px 18px;
  border-left: 3px solid #3270ad;
  background: #f3f7fb;
}

.report-note h3 {
  margin-bottom: 8px;
}

.report-note p {
  margin: 0;
  color: #5e6f82;
  line-height: 1.8;
}

@media (max-width: 1200px) {
  .report-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .overview-grid {
    grid-template-columns: repeat(3, minmax(130px, 1fr));
  }
}

@media (max-width: 768px) {
  .unit-device-report {
    padding: 10px;
  }

  .toolbar-controls,
  .dept-select {
    width: 100%;
  }

  .report-paper {
    padding: 22px 14px 30px;
  }

  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .report-meta {
    align-items: center;
    flex-direction: column;
    gap: 5px;
  }

  .unit-descriptions :deep(.el-descriptions__label) {
    width: 90px;
  }
}
</style>
