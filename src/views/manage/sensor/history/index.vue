<template>
  <div class="app-container">
    <!-- 顶部信息 -->
    <el-card class="sensor-info-card" shadow="hover">
      <el-descriptions :column="4" border>
        <el-descriptions-item label="传感器编号">{{ sensorCode }}</el-descriptions-item>
        <el-descriptions-item label="传感器ID">{{ sensorId }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag :type="getStatusType(currentStatus)">{{ getStatusText(currentStatus) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最新数据时间">{{ latestDataTime || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 筛选条件 -->
    <el-card class="filter-card" shadow="hover">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            :default-time="defaultTime"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          <el-button type="warning" icon="Download" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>压力值趋势 (MPa)</span>
            </div>
          </template>
          <div ref="pressureChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>温度值趋势 (℃)</span>
            </div>
          </template>
          <div ref="temperatureChart" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>电量趋势 (%)</span>
            </div>
          </template>
          <div ref="batteryChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据表格 -->
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>历史数据列表</span>
        </div>
      </template>
      <el-table v-loading="loading" :data="historyList">
        <el-table-column label="采集时间" align="center" prop="createTime" width="180" />
        <el-table-column label="压力值(MPa)" align="center" prop="pressure" />
        <el-table-column label="温度值(℃)" align="center" prop="temperature" />
        <el-table-column label="电量(%)" align="center" prop="batteryLevel" />
        <el-table-column label="信号强度(dBm)" align="center" prop="signalStrength" />
      </el-table>

      <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>
  </div>
</template>

<script setup name="SensorHistory">
import * as echarts from 'echarts'
import { getCurrentInstance } from 'vue'
import { useRoute } from 'vue-router'
import { listSensorHistory, getSensorHistoryData } from "@/api/manage/sensor"

const { proxy } = getCurrentInstance()

const sensorId = ref('')
const sensorCode = ref('')
const currentStatus = ref('0')
const latestDataTime = ref('')
const loading = ref(false)
const historyList = ref([])
const total = ref(0)
const dateRange = ref([])

// 图表实例
const pressureChart = ref(null)
const temperatureChart = ref(null)
const batteryChart = ref(null)
let pressureChartInstance = null
let temperatureChartInstance = null
let batteryChartInstance = null

// 默认时间：最近7天
const defaultTime = ref([
  new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
  new Date()
])

const queryParams = reactive({
  pageNum: 1,
  pageSize: 20,
  sensorId: null,
  startTime: null,
  endTime: null
})

// 获取默认时间范围（最近7天）
function getDefaultDateRange() {
  const end = new Date()
  const start = new Date()
  start.setTime(start.getTime() - 7 * 24 * 60 * 60 * 1000)
  return [
    start.toISOString().replace('T', ' ').substring(0, 19),
    end.toISOString().replace('T', ' ').substring(0, 19)
  ]
}

// 状态类型映射
function getStatusType(status) {
  const map = {
    '0': 'success',
    '1': 'danger',
    '2': 'info'
  }
  return map[status] || 'info'
}

// 状态文本映射
function getStatusText(status) {
  const map = {
    '0': '正常',
    '1': '异常',
    '2': '离线'
  }
  return map[status] || '未知'
}

// 初始化
onMounted(() => {
  const route = useRoute()
  sensorId.value = Number(route.query.sensorId)
  sensorCode.value = route.query.sensorCode || '未知'

  queryParams.sensorId = sensorId.value

  // 设置默认时间范围
  dateRange.value = getDefaultDateRange()

  getList()
  getChartData()

  // 初始化图表
  nextTick(() => {
    initCharts()
  })
})

// 页面销毁时销毁图表
onBeforeUnmount(() => {
  if (pressureChartInstance) pressureChartInstance.dispose()
  if (temperatureChartInstance) temperatureChartInstance.dispose()
  if (batteryChartInstance) batteryChartInstance.dispose()
})

/** 查询列表 */
function getList() {
  loading.value = true
  if (dateRange.value && dateRange.value.length === 2) {
    queryParams.startTime = dateRange.value[0]
    queryParams.endTime = dateRange.value[1]
  } else {
    queryParams.startTime = null
    queryParams.endTime = null
  }

  listSensorHistory(queryParams).then(response => {
    historyList.value = response.rows
    total.value = response.total
    loading.value = false

    // 更新最新数据时间
    if (response.rows && response.rows.length > 0) {
      latestDataTime.value = response.rows[0].createTime
      currentStatus.value = response.rows[0].status || '0'
    }
  })
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNum = 1
  getList()
  getChartData()
}

/** 重置按钮操作 */
function resetQuery() {
  dateRange.value = getDefaultDateRange()
  handleQuery()
}

/** 获取图表数据 */
function getChartData() {
  if (!sensorId.value) return

  getSensorHistoryData(
    sensorId.value,
    dateRange.value?.[0],
    dateRange.value?.[1]
  ).then(response => {
    updateCharts(response.data || [])
  })
}

/** 初始化图表 */
function initCharts() {
  pressureChartInstance = echarts.init(pressureChart.value)
  temperatureChartInstance = echarts.init(temperatureChart.value)
  batteryChartInstance = echarts.init(batteryChart.value)
}

/** 更新图表数据 */
function updateCharts(data) {
  if (!data || data.length === 0) return

  const times = data.map(item => item.createTime)
  const pressures = data.map(item => item.pressure)
  const temperatures = data.map(item => item.temperature)
  const batteries = data.map(item => item.batteryLevel)

  // 压力图表
  pressureChartInstance?.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: times },
    yAxis: { type: 'value', name: 'MPa' },
    series: [{
      name: '压力值',
      type: 'line',
      data: pressures,
      smooth: true,
      itemStyle: { color: '#409EFF' }
    }]
  })

  // 温度图表
  temperatureChartInstance?.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: times },
    yAxis: { type: 'value', name: '℃' },
    series: [{
      name: '温度值',
      type: 'line',
      data: temperatures,
      smooth: true,
      itemStyle: { color: '#E6A23C' }
    }]
  })

  // 电量图表
  batteryChartInstance?.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: times },
    yAxis: { type: 'value', name: '%', min: 0, max: 100 },
    series: [{
      name: '电量',
      type: 'line',
      data: batteries,
      smooth: true,
      itemStyle: { color: '#67C23A' },
      areaStyle: { color: 'rgba(103, 194, 58, 0.2)' }
    }]
  })
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('manage/sensor/history/export', {
    sensorId: sensorId.value,
    startTime: dateRange.value?.[0],
    endTime: dateRange.value?.[1]
  }, `sensor_history_${sensorCode.value}_${new Date().getTime()}.xlsx`)
}
</script>

<style scoped>
.sensor-info-card {
  margin-bottom: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-row .el-col {
  margin-bottom: 0;
}

.chart-container {
  height: 250px;
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}
</style>
