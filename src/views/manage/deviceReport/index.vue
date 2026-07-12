<template>
  <div class="app-container device-report-page">
    <el-card class="report-filter" shadow="never">
      <template #header>
        <div class="filter-header">
          <div>
            <div class="page-title">设备报告</div>
            <div class="page-subtitle">生成日报、周报、月报 Word 报告，面向领导汇报设备运行态势。</div>
          </div>
          <div class="header-actions">
            <el-button type="primary" icon="Refresh" :loading="loading" @click="handlePreview">生成预览</el-button>
            <el-button
              type="success"
              icon="Download"
              :loading="exporting"
              @click="handleExport"
              v-hasPermi="['manage:deviceReport:export']"
            >下载 Word</el-button>
          </div>
        </div>
      </template>

      <el-form :model="queryParams" ref="queryRef" :inline="true" label-width="82px">
        <el-form-item label="报告类型" prop="reportType">
          <el-radio-group v-model="queryParams.reportType" @change="handleReportTypeChange">
            <el-radio-button label="day">日报</el-radio-button>
            <el-radio-button label="week">周报</el-radio-button>
            <el-radio-button label="month">月报</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="统计周期" prop="dateRange">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :clearable="false"
          />
        </el-form-item>
        <el-form-item label="归属单位" prop="deptId">
          <el-tree-select
            v-model="queryParams.deptId"
            :data="deptOptions"
            :props="{ value: 'id', label: 'label', children: 'children' }"
            value-key="id"
            placeholder="全部授权单位"
            clearable
            check-strictly
            filterable
            style="width: 260px"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <el-skeleton :loading="loading && !preview" animated :rows="8">
      <template #default>
        <el-alert
          v-if="!preview"
          title="请先选择统计周期并生成预览"
          type="info"
          :closable="false"
          show-icon
          class="mt16"
        />

        <template v-else>
          <div class="report-meta">
            <span>报告类型：{{ preview.reportTypeName }}</span>
            <span>统计周期：{{ preview.periodText }}</span>
            <span>统计范围：{{ preview.scopeName }}</span>
            <span>生成时间：{{ preview.generatedTime }}</span>
          </div>

          <el-row :gutter="16" class="summary-row">
            <el-col :xs="24" :sm="12" :lg="4">
              <div class="summary-card blue">
                <span>消防点</span>
                <strong>{{ overview.firePointCount || 0 }}</strong>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="4">
              <div class="summary-card cyan">
                <span>网关</span>
                <strong>{{ overview.gatewayCount || 0 }}</strong>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="4">
              <div class="summary-card green">
                <span>传感器</span>
                <strong>{{ overview.sensorCount || 0 }}</strong>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="4">
              <div class="summary-card amber">
                <span>灭火器</span>
                <strong>{{ overview.extinguisherCount || 0 }}</strong>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="4">
              <div class="summary-card red">
                <span>风险设备</span>
                <strong>{{ overview.riskDeviceCount || 0 }}</strong>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="4">
              <div class="summary-card slate">
                <span>有效采样</span>
                <strong>{{ overview.historySampleCount || 0 }}</strong>
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :xs="24" :lg="12">
              <el-card shadow="never" class="report-section">
                <template #header>单位设备与风险 TOP10</template>
                <el-table :data="preview.unitStats || []" height="360">
                  <el-table-column label="单位" prop="deptName" min-width="180" show-overflow-tooltip />
                  <el-table-column label="设备合计" prop="totalCount" width="90" align="center" />
                  <el-table-column label="风险数" prop="riskCount" width="90" align="center" />
                  <el-table-column label="消防点" prop="firePointCount" width="80" align="center" />
                  <el-table-column label="网关" prop="gatewayCount" width="70" align="center" />
                  <el-table-column label="传感器" prop="sensorCount" width="80" align="center" />
                  <el-table-column label="灭火器" prop="extinguisherCount" width="80" align="center" />
                </el-table>
              </el-card>
            </el-col>

            <el-col :xs="24" :lg="12">
              <el-card shadow="never" class="report-section">
                <template #header>异常与风险摘要</template>
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="传感器异常">{{ overview.sensorAbnormalCount || 0 }}</el-descriptions-item>
                  <el-descriptions-item label="传感器离线">{{ overview.sensorOfflineCount || 0 }}</el-descriptions-item>
                  <el-descriptions-item label="持续低电量">{{ overview.sensorLowBatteryCount || 0 }}</el-descriptions-item>
                  <el-descriptions-item label="持续低压力">{{ overview.sensorLowPressureCount || 0 }}</el-descriptions-item>
                  <el-descriptions-item label="持续高压力">{{ overview.sensorHighPressureCount || 0 }}</el-descriptions-item>
                  <el-descriptions-item label="压力脏值">{{ overview.sensorInvalidPressureCount || 0 }}</el-descriptions-item>
                  <el-descriptions-item label="未来采样">{{ overview.historyFutureCount || 0 }}</el-descriptions-item>
                  <el-descriptions-item label="网关未绑定消防点">{{ overview.gatewayUnboundFirePointCount || 0 }}</el-descriptions-item>
                  <el-descriptions-item label="灭火器30天内到期">{{ overview.extinguisherExpiringSoonCount || 0 }}</el-descriptions-item>
                  <el-descriptions-item label="灭火器数量不足">{{ overview.firePointExtinguisherShortageCount || 0 }}</el-descriptions-item>
                </el-descriptions>

                <div class="sensor-metric-title">传感器采样摘要</div>
                <el-row :gutter="10">
                  <el-col :span="8">
                    <div class="metric-box">平均压力<br><b>{{ formatValue(overview.avgPressure) }}</b></div>
                  </el-col>
                  <el-col :span="8">
                    <div class="metric-box">平均温度<br><b>{{ formatValue(overview.avgTemperature) }}</b></div>
                  </el-col>
                  <el-col :span="8">
                    <div class="metric-box">平均电量<br><b>{{ formatValue(overview.avgBatteryLevel) }}</b></div>
                  </el-col>
                </el-row>
              </el-card>
            </el-col>
          </el-row>

          <el-card shadow="never" class="report-section">
            <template #header>重点风险清单</template>
            <el-table :data="preview.riskItems || []" height="420">
              <el-table-column label="类别" prop="category" width="90" />
              <el-table-column label="风险类型" prop="riskType" width="130" />
              <el-table-column label="等级" prop="riskLevel" width="100">
                <template #default="scope">
                  <el-tag :type="riskTagType(scope.row.riskLevel)">{{ scope.row.riskLevel || '-' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="归属单位" prop="deptName" min-width="180" show-overflow-tooltip />
              <el-table-column label="对象" prop="itemName" min-width="140" show-overflow-tooltip />
              <el-table-column label="说明" prop="description" min-width="260" show-overflow-tooltip />
            </el-table>
          </el-card>
        </template>
      </template>
    </el-skeleton>
  </div>
</template>

<script setup name="DeviceReport">
import { previewDeviceReport } from "@/api/manage/deviceReport"
import { deviceDeptTreeSelect } from "@/api/manage/deviceDept"

const { proxy } = getCurrentInstance()

const loading = ref(false)
const exporting = ref(false)
const preview = ref(null)
const deptOptions = ref([])
const dateRange = ref([])

const queryParams = reactive({
  reportType: "month",
  startDate: "",
  endDate: "",
  deptId: null
})

const overview = computed(() => preview.value?.overview || {})

function getDeptTree() {
  deviceDeptTreeSelect().then(response => {
    deptOptions.value = response.data || []
  })
}

function setDefaultDateRange() {
  const now = new Date()
  if (queryParams.reportType === "day") {
    const date = formatDate(now)
    dateRange.value = [date, date]
    return
  }
  if (queryParams.reportType === "week") {
    const day = now.getDay() || 7
    const start = new Date(now)
    start.setDate(now.getDate() - day + 1)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    dateRange.value = [formatDate(start), formatDate(end)]
    return
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  dateRange.value = [formatDate(start), formatDate(end)]
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function buildParams() {
  queryParams.startDate = dateRange.value?.[0]
  queryParams.endDate = dateRange.value?.[1]
  return {
    reportType: queryParams.reportType,
    startDate: queryParams.startDate,
    endDate: queryParams.endDate,
    deptId: queryParams.deptId
  }
}

function handleReportTypeChange() {
  setDefaultDateRange()
}

function handlePreview() {
  loading.value = true
  previewDeviceReport(buildParams()).then(response => {
    preview.value = response.data
  }).finally(() => {
    loading.value = false
  })
}

function handleExport() {
  exporting.value = true
  proxy.download("manage/device-report/export", buildParams(), `device_report_${new Date().getTime()}.docx`)
  setTimeout(() => {
    exporting.value = false
  }, 800)
}

function formatValue(value) {
  return value === null || value === undefined ? "-" : value
}

function riskTagType(level) {
  if (level === "较高") return "danger"
  if (level === "数据质量") return "warning"
  return "info"
}

getDeptTree()
setDefaultDateRange()
handlePreview()
</script>

<style scoped>
.device-report-page {
  background: #f4f8fb;
  min-height: calc(100vh - 84px);
}

.report-filter,
.report-section {
  border: 0;
  border-radius: 16px;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2f46;
}

.page-subtitle {
  margin-top: 6px;
  color: #7b8798;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.report-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 16px 0;
  color: #5d6b80;
}

.report-meta span {
  padding: 6px 12px;
  background: #ffffff;
  border-radius: 999px;
}

.summary-row {
  margin-bottom: 16px;
}

.summary-card {
  min-height: 116px;
  padding: 18px 20px;
  border-radius: 18px;
  color: #ffffff;
  box-shadow: 0 16px 32px rgba(28, 49, 83, 0.12);
}

.summary-card span {
  display: block;
  opacity: 0.9;
}

.summary-card strong {
  display: block;
  margin-top: 18px;
  font-size: 34px;
  line-height: 1;
}

.blue { background: linear-gradient(135deg, #2f6eea, #184fd4); }
.cyan { background: linear-gradient(135deg, #0ea5c6, #057d9c); }
.green { background: linear-gradient(135deg, #16a34a, #0f7a35); }
.amber { background: linear-gradient(135deg, #f59e0b, #d97706); }
.red { background: linear-gradient(135deg, #f05252, #c81e1e); }
.slate { background: linear-gradient(135deg, #64748b, #334155); }

.report-section {
  margin-bottom: 16px;
}

.sensor-metric-title {
  margin: 18px 0 10px;
  font-weight: 700;
  color: #27364b;
}

.metric-box {
  padding: 14px;
  border-radius: 12px;
  background: #f3f7fc;
  color: #66758b;
}

.metric-box b {
  display: inline-block;
  margin-top: 8px;
  color: #1f2f46;
  font-size: 20px;
}

.mt16 {
  margin-top: 16px;
}
</style>
