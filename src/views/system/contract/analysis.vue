<template>
  <div class="contract-analysis">
    <!-- 第一行：省市分布 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <div class="chart-card">
          <div class="card-badge"></div>
          <h3 class="chart-title">
            <i class="el-icon-location-information"></i>
            合同用户地区分布
          </h3>
          <el-row :gutter="20">
            <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
              <div ref="provinceChartRef" class="chart-container"></div>
            </el-col>
            <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
              <div ref="cityChartRef" class="chart-container"></div>
            </el-col>
          </el-row>
        </div>
      </el-col>
    </el-row>

    <!-- 第二行：合同状态饼图 + 过期状态饼图 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <div class="chart-card">
          <div class="card-badge"></div>
          <h3 class="chart-title">
            <i class="el-icon-pie-chart"></i>
            合同状态分布
          </h3>
          <div ref="statusChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <div class="chart-card">
          <div class="card-badge"></div>
          <h3 class="chart-title">
            <i class="el-icon-warning"></i>
            合同过期状态分布
          </h3>
          <div ref="expireStatusChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 第三行：TOP10柱状图 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <div class="chart-card">
          <div class="card-badge"></div>
          <h3 class="chart-title">
            <i class="el-icon-bar-chart"></i>
            合同数量TOP10部门
          </h3>
          <div ref="topDeptChartRef" class="chart-container-wide"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 第四行：到期趋势折线图 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <div class="chart-card">
          <div class="card-badge"></div>
          <h3 class="chart-title">
            <i class="el-icon-data-line"></i>
            合同到期趋势（未来6个月）
          </h3>
          <div ref="trendChartRef" class="chart-container-wide"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { listContract, getStatusStatistics, getExpireStatusStatistics, getTopDeptStatistics, getExpiryTrendStatistics } from '@/api/system/contract'
import { listDept } from '@/api/system/dept'

export default {
  name: 'ContractAnalysis',
  data() {
    return {
      statusChart: null,
      expireStatusChart: null,
      topDeptChart: null,
      trendChart: null,
      provinceChart: null,
      cityChart: null
    }
  },
  mounted() {
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
    loadStatistics() {
      Promise.all([
        getStatusStatistics(),
        getExpireStatusStatistics(),
        getTopDeptStatistics(10),
        getExpiryTrendStatistics(6),
        listContract({}),
        listDept({})
      ]).then(([statusRes, expireStatusRes, topDeptRes, trendRes, contractRes, deptRes]) => {
        this.initStatusChart(statusRes.data || [])
        this.initExpireStatusChart(expireStatusRes.data || [])
        this.initTopDeptChart(topDeptRes.data || [])
        this.initTrendChart(trendRes.data || [])
        this.processRegionDistribution(contractRes.rows || [], deptRes.data || [])
      }).catch(error => {
        console.error('加载统计数据失败：', error)
        this.$message.error('加载统计数据失败')
      })
    },

    processRegionDistribution(contracts, depts) {
      const deptMap = {}
      depts.forEach(dept => {
        deptMap[dept.deptId] = dept
      })

      const provinceMap = {}
      const cityMap = {}

      contracts.forEach(contract => {
        const dept = deptMap[contract.deptId]
        if (!dept) return

        const province = dept.province
        const city = dept.city

        if (province) {
          provinceMap[province] = (provinceMap[province] || 0) + 1
        }
        if (city) {
          const cityKey = province ? `${province}-${city}` : city
          cityMap[cityKey] = (cityMap[cityKey] || 0) + 1
        }
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
      if (!this.$refs.provinceChartRef) return
      this.provinceChart = echarts.init(this.$refs.provinceChartRef)

      const colorList = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#C0B37FEB', '#36A3F3', '#34D399', '#FBBF24', '#F87171', '#A8A8A8']
      const chartData = data.length ? data.map((item, index) => ({
        ...item,
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [{ offset: 0, color: colorList[index % colorList.length] }, { offset: 1, color: colorList[index % colorList.length] + '99' }]) }
      })) : [{ name: '暂无数据', value: 0 }]

      const option = {
        title: { text: '按省份分布', left: 'center', textStyle: { fontSize: 14, fontWeight: 500, color: '#606266' } },
        tooltip: {
          trigger: 'item',
          formatter: (params) => {
            return `<div style="font-weight:600;">${params.name}</div>
                    <div>合同用户: <span style="color:#409EFF;font-weight:600;">${params.value}</span> 个</div>
                    <div>占比: <span style="color:#67C23A;font-weight:600;">${params.percent.toFixed(1)}%</span></div>`
          },
          backgroundColor: 'rgba(255,255,255,0.98)',
          borderColor: '#E4E7ED',
          borderWidth: 1,
          textStyle: { color: '#303133' },
          padding: [10, 14],
          extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 6px;'
        },
        legend: { orient: 'vertical', left: 'left', top: 'middle', textStyle: { color: '#606266' } },
        series: [{ name: '省份分布', type: 'pie', radius: ['40%', '70%'], center: ['60%', '50%'], avoidLabelOverlap: false, itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 3 }, label: { show: true, formatter: '{b}: {c}', color: '#606266', fontSize: 12 }, emphasis: { label: { show: true, fontSize: 15, fontWeight: 'bold' }, itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0, 0, 0, 0.3)' } }, data: chartData }]
      }
      this.provinceChart.setOption(option)
    },

    initCityChart(data) {
      if (!this.$refs.cityChartRef) return
      this.cityChart = echarts.init(this.$refs.cityChartRef)

      const option = {
        title: { text: '按城市分布 TOP15', left: 'center', textStyle: { fontSize: 14, fontWeight: 500, color: '#606266' } },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (params) => {
            const val = params[0]
            return `<div style="font-weight:600;">${val.name}</div>
                    <div>合同用户: <span style="color:#409EFF;font-weight:600;">${val.value}</span> 个</div>`
          },
          backgroundColor: 'rgba(255,255,255,0.98)',
          borderColor: '#E4E7ED',
          borderWidth: 1,
          textStyle: { color: '#303133' },
          padding: [10, 14],
          extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 6px;'
        },
        grid: { left: '3%', right: '10%', bottom: '3%', top: '15%', containLabel: true },
        xAxis: { type: 'value', axisLine: { lineStyle: { color: '#E4E7ED' } }, axisLabel: { color: '#909399' }, splitLine: { lineStyle: { color: '#F0F2F5' } } },
        yAxis: { type: 'category', data: data.map(item => item.name).reverse(), axisLine: { lineStyle: { color: '#E4E7ED' } }, axisLabel: { color: '#606266', interval: 0 } },
        series: [{ name: '城市分布', type: 'bar', data: data.map(item => item.value).reverse(), itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#409EFF' }, { offset: 1, color: '#67C23A' }]) }, label: { show: true, position: 'right', color: '#606266' } }]
      }
      this.cityChart.setOption(option)
    },

    initStatusChart(data) {
      if (!this.$refs.statusChartRef) return
      this.statusChart = echarts.init(this.$refs.statusChartRef)

      const chartData = data.map(item => ({
        name: item.name === '0' ? '停用' : item.name === '1' ? '正常' : item.name,
        value: item.value,
        itemStyle: { color: item.name === '0' || item.name === '停用' ? new echarts.graphic.LinearGradient(0, 0, 1, 1, [{ offset: 0, color: '#F56C6C' }, { offset: 1, color: '#F89898' }]) : new echarts.graphic.LinearGradient(0, 0, 1, 1, [{ offset: 0, color: '#67C23A' }, { offset: 1, color: '#85CE61' }]) }
      }))

      const option = {
        tooltip: {
          trigger: 'item',
          formatter: (params) => {
            return `<div style="font-weight:600;">${params.name}</div>
                    <div>合同数量: <span style="color:#409EFF;font-weight:600;">${params.value}</span> 份</div>
                    <div>占比: <span style="color:#67C23A;font-weight:600;">${params.percent.toFixed(1)}%</span></div>`
          },
          backgroundColor: 'rgba(255,255,255,0.98)',
          borderColor: '#E4E7ED',
          borderWidth: 1,
          textStyle: { color: '#303133' },
          padding: [10, 14],
          extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 6px;'
        },
        legend: { orient: 'vertical', left: 'left', textStyle: { color: '#606266' } },
        series: [{ name: '合同状态', type: 'pie', radius: ['40%', '70%'], center: ['60%', '50%'], avoidLabelOverlap: false, itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 3 }, label: { show: true, formatter: '{b}: {c}', color: '#606266' }, emphasis: { label: { show: true, fontSize: 15, fontWeight: 'bold' }, itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0, 0, 0, 0.3)' } }, data: chartData.length ? chartData : [{ name: '正常', value: 0, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [{ offset: 0, color: '#67C23A' }, { offset: 1, color: '#85CE61' }]) } }, { name: '停用', value: 0, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [{ offset: 0, color: '#F56C6C' }, { offset: 1, color: '#F89898' }]) } }] }]
      }
      this.statusChart.setOption(option)
    },

    initExpireStatusChart(data) {
      if (!this.$refs.expireStatusChartRef) return
      this.expireStatusChart = echarts.init(this.$refs.expireStatusChartRef)

      const colorMap = {
        '正常': new echarts.graphic.LinearGradient(0, 0, 1, 1, [{ offset: 0, color: '#67C23A' }, { offset: 1, color: '#85CE61' }]),
        '即将过期': new echarts.graphic.LinearGradient(0, 0, 1, 1, [{ offset: 0, color: '#E6A23C' }, { offset: 1, color: '#F0C78A' }]),
        '已过期': new echarts.graphic.LinearGradient(0, 0, 1, 1, [{ offset: 0, color: '#F56C6C' }, { offset: 1, color: '#F89898' }]),
        '未设置': new echarts.graphic.LinearGradient(0, 0, 1, 1, [{ offset: 0, color: '#909399' }, { offset: 1, color: '#B1B3B8' }])
      }

      const chartData = data.map(item => ({ name: item.name, value: item.value, itemStyle: { color: colorMap[item.name] || '#409EFF' } }))

      const option = {
        tooltip: {
          trigger: 'item',
          formatter: (params) => {
            const statusDesc = {
              '正常': '合同在有效期内',
              '即将过期': '30天内即将到期',
              '已过期': '已超过有效期',
              '未设置': '未设置到期日期'
            }
            return `<div style="font-weight:600;">${params.name}</div>
                    <div>合同数量: <span style="color:#409EFF;font-weight:600;">${params.value}</span> 份</div>
                    <div>占比: <span style="color:#67C23A;font-weight:600;">${params.percent.toFixed(1)}%</span></div>
                    <div style="margin-top:4px;color:#909399;font-size:12px;">${statusDesc[params.name] || ''}</div>`
          },
          backgroundColor: 'rgba(255,255,255,0.98)',
          borderColor: '#E4E7ED',
          borderWidth: 1,
          textStyle: { color: '#303133' },
          padding: [10, 14],
          extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 6px;'
        },
        legend: { orient: 'vertical', left: 'left', textStyle: { color: '#606266' } },
        series: [{ name: '过期状态', type: 'pie', radius: ['40%', '70%'], center: ['60%', '50%'], avoidLabelOverlap: false, itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 3 }, label: { show: true, formatter: '{b}: {c}', color: '#606266' }, emphasis: { label: { show: true, fontSize: 15, fontWeight: 'bold' }, itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0, 0, 0, 0.3)' } }, data: chartData.length ? chartData : [{ name: '正常', value: 0, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [{ offset: 0, color: '#67C23A' }, { offset: 1, color: '#85CE61' }]) } }, { name: '即将过期', value: 0, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [{ offset: 0, color: '#E6A23C' }, { offset: 1, color: '#F0C78A' }]) } }, { name: '已过期', value: 0, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [{ offset: 0, color: '#F56C6C' }, { offset: 1, color: '#F89898' }]) } }] }]
      }
      this.expireStatusChart.setOption(option)
    },

    initTopDeptChart(data) {
      if (!this.$refs.topDeptChartRef) return
      this.topDeptChart = echarts.init(this.$refs.topDeptChartRef)

      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (params) => {
            const val = params[0]
            return `<div style="font-weight:600;">${val.name}</div>
                    <div>合同数量: <span style="color:#409EFF;font-weight:600;">${val.value}</span> 份</div>`
          },
          backgroundColor: 'rgba(255,255,255,0.98)',
          borderColor: '#E4E7ED',
          borderWidth: 1,
          textStyle: { color: '#303133' },
          padding: [10, 14],
          extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 6px;'
        },
        grid: { left: '3%', right: '8%', bottom: '3%', top: '3%', containLabel: true },
        xAxis: { type: 'value', boundaryGap: [0, 0.01], axisLine: { lineStyle: { color: '#E4E7ED' } }, axisLabel: { color: '#909399' }, splitLine: { lineStyle: { color: '#F0F2F5' } } },
        yAxis: { type: 'category', data: data.map(item => item.name).reverse(), axisLine: { lineStyle: { color: '#E4E7ED' } }, axisLabel: { color: '#606266', interval: 0 } },
        series: [{ name: '合同数量', type: 'bar', data: data.map(item => item.value).reverse(), barWidth: '60%', itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#409EFF' }, { offset: 1, color: '#67C23A' }]), borderRadius: [0, 4, 4, 0] }, label: { show: true, position: 'right', color: '#606266', fontSize: 12 } }]
      }
      this.topDeptChart.setOption(option)
    },

    initTrendChart(data) {
      if (!this.$refs.trendChartRef) return
      this.trendChart = echarts.init(this.$refs.trendChartRef)

      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            const val = params[0]
            return `<div style="font-weight:600;">${val.name}</div>
                    <div>到期合同: <span style="color:#E6A23C;font-weight:600;">${val.value}</span> 份</div>`
          },
          backgroundColor: 'rgba(255,255,255,0.98)',
          borderColor: '#E4E7ED',
          borderWidth: 1,
          textStyle: { color: '#303133' },
          padding: [10, 14],
          extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 6px;'
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '3%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: data.map(item => item.name), axisLine: { lineStyle: { color: '#E4E7ED' } }, axisLabel: { color: '#606266' } },
        yAxis: { type: 'value', axisLine: { lineStyle: { color: '#E4E7ED' } }, axisLabel: { color: '#909399' }, splitLine: { lineStyle: { color: '#F0F2F5' } } },
        series: [{ name: '到期数量', type: 'line', data: data.map(item => item.value), smooth: true, symbol: 'circle', symbolSize: 8, itemStyle: { color: '#E6A23C', borderColor: '#fff', borderWidth: 2 }, lineStyle: { width: 3 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(230, 162, 60, 0.5)' }, { offset: 1, color: 'rgba(230, 162, 60, 0.1)' }]) } }]
      }
      this.trendChart.setOption(option)
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
      if (chart) chart.dispose()
    }
  }
}
</script>

<style scoped>
.contract-analysis {
  padding: 20px;
  background: #f0f2f5;
  min-height: calc(100vh - 84px);
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  height: 100%;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.chart-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #409EFF, #67C23A, #E6A23C, #F56C6C);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.chart-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.chart-card:hover::before {
  opacity: 1;
}

.chart-title {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.chart-title i {
  color: #409EFF;
  font-size: 20px;
}

.chart-container {
  height: 320px;
}

.chart-container-wide {
  height: 280px;
}

.chart-card .card-badge {
  position: absolute;
  top: 0;
  right: 0;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(64, 158, 255, 0.05) 100%);
  border-radius: 0 12px 0 100%;
  z-index: 0;
}

.chart-card .card-badge::after {
  content: '';
  position: absolute;
  top: 12px;
  right: 12px;
  width: 20px;
  height: 20px;
  background: rgba(64, 158, 255, 0.2);
  border-radius: 50%;
}
</style>
