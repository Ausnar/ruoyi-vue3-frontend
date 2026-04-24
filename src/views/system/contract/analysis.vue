<template>
  <div class="contract-analysis">
    <div class="toolbar-card">
      <div class="toolbar-header">
        <div>
          <h2>合同用户分析</h2>
          <p>按合同性质快速切换分析口径，联动查看地域、状态、到期和单位分布。</p>
        </div>
        <el-radio-group v-model="activeContractType" @change="handleFilterChange">
          <el-radio-button
            v-for="item in contractTypeOptions"
            :key="item.value"
            :label="item.value"
          >
            {{ item.label }}
          </el-radio-button>
        </el-radio-group>
      </div>

      <el-row :gutter="16" class="overview-row">
        <el-col :xs="24" :sm="12" :md="6" v-for="item in overviewCards" :key="item.key">
          <div class="overview-card" :class="item.key">
            <div class="overview-label">{{ item.label }}</div>
            <div class="overview-value">{{ item.value }}</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <div class="chart-card">
          <div class="card-badge"></div>
          <h3 class="chart-title">合同用户地区分布</h3>
          <el-row :gutter="20">
            <el-col :xs="24" :md="12">
              <div ref="provinceChartRef" class="chart-container"></div>
            </el-col>
            <el-col :xs="24" :md="12">
              <div ref="cityChartRef" class="chart-container"></div>
            </el-col>
          </el-row>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :md="12">
        <div class="chart-card">
          <div class="card-badge"></div>
          <h3 class="chart-title">合同状态分布</h3>
          <div ref="statusChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :xs="24" :md="12">
        <div class="chart-card">
          <div class="card-badge"></div>
          <h3 class="chart-title">合同到期状态分布</h3>
          <div ref="expireStatusChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <div class="chart-card">
          <div class="card-badge"></div>
          <h3 class="chart-title">合同数量 TOP10 单位</h3>
          <div ref="topDeptChartRef" class="chart-container-wide"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <div class="chart-card">
          <div class="card-badge"></div>
          <h3 class="chart-title">未来 6 个月到期趋势</h3>
          <div ref="trendChartRef" class="chart-container-wide"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import {
  getContractOverview,
  getStatusStatistics,
  getExpireStatusStatistics,
  getTopDeptStatistics,
  getExpiryTrendStatistics,
  listContract
} from '@/api/system/contract'
import { listDept } from '@/api/system/dept'

const CONTRACT_TYPE_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '试用合同', value: 'trial' },
  { label: '正式付费合同', value: 'paid' },
  { label: '未设置', value: 'unset' }
]

export default {
  name: 'ContractAnalysis',
  data() {
    return {
      activeContractType: 'all',
      contractTypeOptions: CONTRACT_TYPE_OPTIONS,
      overview: {
        total: 0,
        trialCount: 0,
        paidCount: 0,
        unsetCount: 0
      },
      statusChart: null,
      expireStatusChart: null,
      topDeptChart: null,
      trendChart: null,
      provinceChart: null,
      cityChart: null
    }
  },
  computed: {
    overviewCards() {
      return [
        { key: 'total', label: '全部合同数', value: this.overview.total ?? 0 },
        { key: 'trial', label: '试用合同数', value: this.overview.trialCount ?? 0 },
        { key: 'paid', label: '正式付费合同数', value: this.overview.paidCount ?? 0 },
        { key: 'unset', label: '未设置数', value: this.overview.unsetCount ?? 0 }
      ]
    }
  },
  mounted() {
    this.loadOverview()
    this.loadStatistics()
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    this.disposeChart(this.statusChart)
    this.disposeChart(this.expireStatusChart)
    this.disposeChart(this.topDeptChart)
    this.disposeChart(this.trendChart)
    this.disposeChart(this.provinceChart)
    this.disposeChart(this.cityChart)
  },
  methods: {
    normalizeContractType() {
      return this.activeContractType === 'all' ? undefined : this.activeContractType
    },
    loadOverview() {
      getContractOverview().then(response => {
        this.overview = {
          total: Number(response.data?.total || 0),
          trialCount: Number(response.data?.trialCount || 0),
          paidCount: Number(response.data?.paidCount || 0),
          unsetCount: Number(response.data?.unsetCount || 0)
        }
      }).catch(() => {
        this.$message.error('加载合同总览失败')
      })
    },
    loadStatistics() {
      const contractType = this.normalizeContractType()
      Promise.all([
        getStatusStatistics(contractType),
        getExpireStatusStatistics(contractType),
        getTopDeptStatistics(10, contractType),
        getExpiryTrendStatistics(6, contractType),
        listContract({ contractType }),
        listDept({})
      ]).then(([statusRes, expireStatusRes, topDeptRes, trendRes, contractRes, deptRes]) => {
        this.initStatusChart(statusRes.data || [])
        this.initExpireStatusChart(expireStatusRes.data || [])
        this.initTopDeptChart(topDeptRes.data || [])
        this.initTrendChart(trendRes.data || [])
        this.processRegionDistribution(contractRes.rows || [], deptRes.data || [])
      }).catch(() => {
        this.$message.error('加载合同分析数据失败')
      })
    },
    handleFilterChange() {
      this.loadStatistics()
    },
    processRegionDistribution(contracts, depts) {
      const deptMap = {}
      depts.forEach(dept => {
        deptMap[dept.deptId] = dept
      })

      const provinceMap = {}
      const cityMap = {}
      const municipalities = ['北京市', '上海市', '天津市', '重庆市']

      contracts.forEach(contract => {
        const dept = deptMap[contract.deptId]
        if (!dept || !dept.province) {
          return
        }

        const province = dept.province
        const city = dept.city
        const area = dept.area
        const isMunicipality = municipalities.includes(province)

        provinceMap[province] = (provinceMap[province] || 0) + 1

        if (!city) {
          return
        }

        const cityKey = isMunicipality && city === province
          ? (area ? `${province}-${area}` : province)
          : `${province}-${city}`
        cityMap[cityKey] = (cityMap[cityKey] || 0) + 1
      })

      const provinceData = Object.entries(provinceMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)

      const cityData = Object.entries(cityMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 15)

      this.initProvinceChart(provinceData)
      this.initCityChart(cityData)
    },
    initProvinceChart(data) {
      if (!this.$refs.provinceChartRef) {
        return
      }
      this.disposeChart(this.provinceChart)
      this.provinceChart = echarts.init(this.$refs.provinceChartRef)

      const colorList = ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#7C3AED', '#0F766E']
      const chartData = data.length
        ? data.map((item, index) => ({
            ...item,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
                { offset: 0, color: colorList[index % colorList.length] },
                { offset: 1, color: `${colorList[index % colorList.length]}99` }
              ])
            }
          }))
        : [{ name: '暂无数据', value: 0 }]

      this.provinceChart.setOption({
        title: {
          text: '按省份分布',
          left: 'center',
          textStyle: { fontSize: 14, fontWeight: 500, color: '#606266' }
        },
        tooltip: {
          trigger: 'item',
          formatter: params => `
            <div style="font-weight:600;">${params.name}</div>
            <div>合同数量: <span style="color:#2563EB;font-weight:600;">${params.value}</span> 个</div>
            <div>占比: <span style="color:#16A34A;font-weight:600;">${params.percent.toFixed(1)}%</span></div>
          `
        },
        legend: { orient: 'vertical', left: 'left', top: 'middle' },
        series: [{
          name: '省份分布',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['60%', '50%'],
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 3 },
          label: { show: true, formatter: '{b}: {c}' },
          emphasis: {
            label: { show: true, fontSize: 15, fontWeight: 'bold' },
            itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0, 0, 0, 0.25)' }
          },
          data: chartData
        }]
      })
    },
    initCityChart(data) {
      if (!this.$refs.cityChartRef) {
        return
      }
      this.disposeChart(this.cityChart)
      this.cityChart = echarts.init(this.$refs.cityChartRef)

      this.cityChart.setOption({
        title: {
          text: '按城市分布 TOP15',
          left: 'center',
          textStyle: { fontSize: 14, fontWeight: 500, color: '#606266' }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: params => {
            const current = params[0]
            return `
              <div style="font-weight:600;">${current.name}</div>
              <div>合同数量: <span style="color:#2563EB;font-weight:600;">${current.value}</span> 个</div>
            `
          }
        },
        grid: { left: '3%', right: '8%', bottom: '3%', top: '15%', containLabel: true },
        xAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: '#E4E7ED' } },
          axisLabel: { color: '#909399' },
          splitLine: { lineStyle: { color: '#F0F2F5' } }
        },
        yAxis: {
          type: 'category',
          data: data.map(item => item.name).reverse(),
          axisLine: { lineStyle: { color: '#E4E7ED' } },
          axisLabel: { color: '#606266', interval: 0 }
        },
        series: [{
          name: '城市分布',
          type: 'bar',
          data: data.map(item => item.value).reverse(),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#2563EB' },
              { offset: 1, color: '#16A34A' }
            ])
          },
          label: { show: true, position: 'right', color: '#606266' }
        }]
      })
    },
    initStatusChart(data) {
      if (!this.$refs.statusChartRef) {
        return
      }
      this.disposeChart(this.statusChart)
      this.statusChart = echarts.init(this.$refs.statusChartRef)

      const chartData = data.map(item => ({
        name: item.name === '0' ? '停用' : item.name === '1' ? '正常' : item.name,
        value: item.value,
        itemStyle: {
          color: item.name === '0'
            ? new echarts.graphic.LinearGradient(0, 0, 1, 1, [
                { offset: 0, color: '#EF4444' },
                { offset: 1, color: '#FCA5A5' }
              ])
            : new echarts.graphic.LinearGradient(0, 0, 1, 1, [
                { offset: 0, color: '#22C55E' },
                { offset: 1, color: '#86EFAC' }
              ])
        }
      }))

      this.statusChart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: params => `
            <div style="font-weight:600;">${params.name}</div>
            <div>合同数量: <span style="color:#2563EB;font-weight:600;">${params.value}</span> 个</div>
            <div>占比: <span style="color:#16A34A;font-weight:600;">${params.percent.toFixed(1)}%</span></div>
          `
        },
        legend: { orient: 'vertical', left: 'left' },
        series: [{
          name: '合同状态',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['60%', '50%'],
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 3 },
          label: { show: true, formatter: '{b}: {c}' },
          emphasis: {
            label: { show: true, fontSize: 15, fontWeight: 'bold' },
            itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0, 0, 0, 0.25)' }
          },
          data: chartData.length ? chartData : [
            { name: '正常', value: 0 },
            { name: '停用', value: 0 }
          ]
        }]
      })
    },
    initExpireStatusChart(data) {
      if (!this.$refs.expireStatusChartRef) {
        return
      }
      this.disposeChart(this.expireStatusChart)
      this.expireStatusChart = echarts.init(this.$refs.expireStatusChartRef)

      const colorMap = {
        正常: '#22C55E',
        即将过期: '#F59E0B',
        已过期: '#EF4444',
        未设置: '#94A3B8'
      }

      const chartData = data.map(item => ({
        name: item.name,
        value: item.value,
        itemStyle: {
          color: colorMap[item.name] || '#2563EB'
        }
      }))

      this.expireStatusChart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: params => `
            <div style="font-weight:600;">${params.name}</div>
            <div>合同数量: <span style="color:#2563EB;font-weight:600;">${params.value}</span> 个</div>
            <div>占比: <span style="color:#16A34A;font-weight:600;">${params.percent.toFixed(1)}%</span></div>
          `
        },
        legend: { orient: 'vertical', left: 'left' },
        series: [{
          name: '到期状态',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['60%', '50%'],
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 3 },
          label: { show: true, formatter: '{b}: {c}' },
          emphasis: {
            label: { show: true, fontSize: 15, fontWeight: 'bold' },
            itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0, 0, 0, 0.25)' }
          },
          data: chartData.length ? chartData : [{ name: '暂无数据', value: 0 }]
        }]
      })
    },
    initTopDeptChart(data) {
      if (!this.$refs.topDeptChartRef) {
        return
      }
      this.disposeChart(this.topDeptChart)
      this.topDeptChart = echarts.init(this.$refs.topDeptChartRef)

      this.topDeptChart.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: params => {
            const current = params[0]
            return `
              <div style="font-weight:600;">${current.name}</div>
              <div>合同数量: <span style="color:#2563EB;font-weight:600;">${current.value}</span> 个</div>
            `
          }
        },
        grid: { left: '3%', right: '8%', bottom: '3%', top: '3%', containLabel: true },
        xAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: '#E4E7ED' } },
          axisLabel: { color: '#909399' },
          splitLine: { lineStyle: { color: '#F0F2F5' } }
        },
        yAxis: {
          type: 'category',
          data: data.map(item => item.name).reverse(),
          axisLine: { lineStyle: { color: '#E4E7ED' } },
          axisLabel: { color: '#606266', interval: 0 }
        },
        series: [{
          name: '合同数量',
          type: 'bar',
          data: data.map(item => item.value).reverse(),
          barWidth: '60%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#2563EB' },
              { offset: 1, color: '#16A34A' }
            ]),
            borderRadius: [0, 4, 4, 0]
          },
          label: { show: true, position: 'right', color: '#606266' }
        }]
      })
    },
    initTrendChart(data) {
      if (!this.$refs.trendChartRef) {
        return
      }
      this.disposeChart(this.trendChart)
      this.trendChart = echarts.init(this.$refs.trendChartRef)

      this.trendChart.setOption({
        tooltip: {
          trigger: 'axis',
          formatter: params => {
            const current = params[0]
            return `
              <div style="font-weight:600;">${current.name}</div>
              <div>到期合同: <span style="color:#F59E0B;font-weight:600;">${current.value}</span> 个</div>
            `
          }
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: data.map(item => item.name),
          axisLine: { lineStyle: { color: '#E4E7ED' } },
          axisLabel: { color: '#606266' }
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: '#E4E7ED' } },
          axisLabel: { color: '#909399' },
          splitLine: { lineStyle: { color: '#F0F2F5' } }
        },
        series: [{
          name: '到期数量',
          type: 'line',
          data: data.map(item => item.value),
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: { color: '#F59E0B', borderColor: '#fff', borderWidth: 2 },
          lineStyle: { width: 3 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(245, 158, 11, 0.45)' },
              { offset: 1, color: 'rgba(245, 158, 11, 0.08)' }
            ])
          }
        }]
      })
    },
    handleResize() {
      this.statusChart && this.statusChart.resize()
      this.expireStatusChart && this.expireStatusChart.resize()
      this.topDeptChart && this.topDeptChart.resize()
      this.trendChart && this.trendChart.resize()
      this.provinceChart && this.provinceChart.resize()
      this.cityChart && this.cityChart.resize()
    },
    disposeChart(chart) {
      if (chart) {
        chart.dispose()
      }
    }
  }
}
</script>

<style scoped>
.contract-analysis {
  padding: 20px;
  background: linear-gradient(180deg, #eef4ff 0%, #f8fafc 100%);
  min-height: calc(100vh - 84px);
}

.toolbar-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 18px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.toolbar-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.toolbar-header h2 {
  margin: 0;
  font-size: 28px;
  color: #0f172a;
}

.toolbar-header p {
  margin: 8px 0 0;
  color: #64748b;
}

.overview-row {
  margin-top: 8px;
}

.overview-card {
  border-radius: 16px;
  padding: 20px 22px;
  color: #fff;
  min-height: 110px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
}

.overview-card.total {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.overview-card.trial {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.overview-card.paid {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
}

.overview-card.unset {
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
}

.overview-label {
  font-size: 14px;
  opacity: 0.92;
}

.overview-value {
  font-size: 34px;
  font-weight: 700;
  line-height: 1;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  height: 100%;
  position: relative;
  overflow: hidden;
}

.chart-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #2563eb, #16a34a, #f59e0b, #ef4444);
}

.chart-title {
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.chart-container {
  height: 320px;
}

.chart-container-wide {
  height: 300px;
}

.card-badge {
  position: absolute;
  top: 0;
  right: 0;
  width: 92px;
  height: 92px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(22, 163, 74, 0.06) 100%);
  border-radius: 0 16px 0 100%;
}

@media (max-width: 768px) {
  .contract-analysis {
    padding: 12px;
  }

  .toolbar-card,
  .chart-card {
    padding: 16px;
  }

  .overview-card {
    min-height: 96px;
  }

  .overview-value {
    font-size: 28px;
  }
}
</style>
