<template>
  <div class="fire-dashboard">
    <!-- 顶部欢迎区域 -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="welcome-section">
          <h1 class="welcome-title">
            <i class="el-icon-s-home"></i>
            安众道APS物联网灭火器管理系统
          </h1>
          <p class="welcome-subtitle">{{ greeting }}，{{ userName }}！服务 {{ stats.contractUserCount }} 家合同用户</p>
        </div>
        <div class="time-display">
          <div class="current-date">{{ currentDate }}</div>
          <div class="current-time">{{ currentTime }}</div>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <!-- 合同用户卡片 -->
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <div class="stat-card card-contract" @click="navigateTo('/system/contract/analysis')">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">合同用户</div>
            <div class="stat-value">{{ stats.contractUserCount }}</div>
            <div class="stat-trend trend-up">
              <i class="el-icon-user"></i>
              家
            </div>
          </div>
        </div>
      </el-col>

      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <div class="stat-card card-alarm" @click="navigateTo('/fire/alarm')">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C11 2 10 2.5 10 4C10 4.8 10.4 5.5 11 6V7C11 8 11 9 12 9C13 9 13 8 13 7V6C13.6 5.5 14 4.8 14 4C14 2.5 13 2 12 2Z" fill="currentColor"/>
              <path d="M18 11C18 7.7 15.3 5 12 5C8.7 5 6 7.7 6 11C6 13.4 4 15.5 4 18H20C20 15.5 18 13.4 18 11Z" fill="currentColor" opacity="0.3"/>
              <path d="M10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20H10Z" fill="currentColor"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">待处理报警</div>
            <div class="stat-value alarm-value">{{ stats.alarmPending }}</div>
            <div class="stat-trend trend-down">
              <i class="el-icon-warning"></i>
              {{ stats.alarmPendingHigh }} 条严重
            </div>
          </div>
        </div>
      </el-col>

      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <div class="stat-card card-maintenance" @click="navigateTo('/fire/maintenance')">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" stroke="currentColor" stroke-width="2" fill="none"/>
              <path d="M7 7H17M7 12H17M7 17H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <circle cx="16" cy="17" r="1.5" fill="currentColor"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">本月维护</div>
            <div class="stat-value">{{ stats.maintenanceMonth }}</div>
            <div class="stat-trend trend-up">
              <i class="el-icon-success"></i>
              完成 {{ stats.maintenanceComplete }} 项
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 中间区域 - 地图和近期报警 -->
    <el-row :gutter="20" class="content-row">
      <!-- 左侧 - 腾讯地图 -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <div class="panel-card" :class="{ 'fullscreen-panel': isMapFullscreen }">
          <div class="panel-header">
            <h3 class="panel-title">
              <i class="el-icon-location"></i>
              设备位置分布
            </h3>
            <div style="display:flex; align-items:center; gap:8px;">
              <el-button size="mini" @click="fitToBounds" title="定位全部设备">
                <i class="el-icon-aim"></i>
              </el-button>
              <el-button size="mini" @click="toggleMapFullscreen" title="全屏查看">
                <i :class="isMapFullscreen ? 'el-icon-close' : 'el-icon-full-screen'"></i>
              </el-button>
            </div>
          </div>

          <div class="panel-content map-content">
            <div ref="mapContainer" class="map-container"></div>
            <!-- 地图图例 -->
            <div class="map-legend">
              <div class="legend-item">
                <span class="legend-marker" style="background: #67C23A;"></span>
                <span class="legend-text">正常</span>
              </div>
              <div class="legend-item">
                <span class="legend-marker" style="background: #E6A23C;"></span>
                <span class="legend-text">预警</span>
              </div>
              <div class="legend-item">
                <span class="legend-marker" style="background: #F56C6C;"></span>
                <span class="legend-text">过期</span>
              </div>
              <div class="legend-item">
                <span class="legend-marker" style="background: #909399;"></span>
                <span class="legend-text">低电量</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <!-- 右侧 - 近期报警 -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <div class="panel-card">
          <div class="panel-header">
            <h3 class="panel-title">
              <i class="el-icon-bell"></i>
              近期报警
            </h3>
            <el-link type="primary" @click="navigateTo('/fire/alarm')">查看全部</el-link>
          </div>
          <div class="panel-content">
            <div class="alarm-list">
              <div 
                v-for="alarm in recentAlarms" 
                :key="alarm.id" 
                class="alarm-item"
                :class="'alarm-level-' + alarm.level"
              >
                <div class="alarm-indicator"></div>
                <div class="alarm-info">
                  <div class="alarm-title">{{ alarm.title }}</div>
                  <div class="alarm-meta">
                    <span class="alarm-location">{{ alarm.location }}</span>
                    <span class="alarm-time">{{ alarm.time }}</span>
                  </div>
                </div>
                <div class="alarm-status" :class="'status-' + alarm.status">
                  {{ alarm.statusText }}
                </div>
              </div>
              <div v-if="recentAlarms.length === 0" class="empty-state">
                <i class="el-icon-success"></i>
                <p>暂无报警信息</p>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { listContract } from '@/api/system/contract'
import { listExtinguisher } from '@/api/manage/extinguisher'
import { listSensor } from '@/api/manage/sensor'
import { listPoint } from '@/api/manage/point'

export default {
  name: 'FireDashboard',
  data() {
    return {
      userName: '管理员',
      currentDate: '',
      currentTime: '',
      stats: {
        contractUserCount: 0,
        alarmPending: 0,
        alarmPendingHigh: 0,
        maintenanceMonth: 0,
        maintenanceComplete: 0
      },
      // 地图相关
      map: null,
      markerLayer: null,
      infoWindow: null,
      isMapFullscreen: false,
      // 设备数据
      firePoints: [],
      extinguishers: [],
      sensors: [],
      productLocations: [], // 用于地图标记的数据
      recentAlarms: [],
      // 定时器
      timeIntervalId: null,
      dataIntervalId: null
    }
  },
  computed: {
    greeting() {
      const hour = new Date().getHours()
      if (hour < 6) return '夜深了'
      if (hour < 9) return '早上好'
      if (hour < 12) return '上午好'
      if (hour < 14) return '中午好'
      if (hour < 18) return '下午好'
      if (hour < 22) return '晚上好'
      return '夜深了'
    },
  },
  mounted() {
    this.initPage()
  },
  beforeDestroy() {
    if (this.timeIntervalId) clearInterval(this.timeIntervalId)
    if (this.dataIntervalId) clearInterval(this.dataIntervalId)
    this.clearMap()
  },
  methods: {
    initPage() {
      this.getUserInfo()
      this.updateTime()
      this.loadStatistics()
      this.loadRecentAlarms()
      this.initTencentMap()

      this.timeIntervalId = setInterval(() => {
        this.updateTime()
      }, 1000)

      this.dataIntervalId = setInterval(() => {
        this.loadStatistics()
        this.loadRecentAlarms()
      }, 30000)
    },

    getUserInfo() {
      const userInfo = this.$store?.state?.user || null
      if (userInfo?.nickName) {
        this.userName = userInfo.nickName
      }
    },

    updateTime() {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      const weekDay = weekDays[now.getDay()]
      this.currentDate = `${year}年${month}月${day}日 ${weekDay}`
      
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      this.currentTime = `${hours}:${minutes}:${seconds}`
    },

    loadStatistics() {
      // 获取合同用户数量
      listContract({}).then(response => {
        this.stats.contractUserCount = response.total || 0
      }).catch(error => {
        console.error('获取合同用户数据失败：', error)
        this.stats.contractUserCount = 0
      })

      // 使用API获取灭火器数据（用于地图显示）
      listExtinguisher({}).then(response => {
        this.extinguishers = response.rows || []
        this.updateProductLocations()
      }).catch(error => {
        console.error('获取灭火器数据失败：', error)
      })

      // 使用API获取传感器数据（用于地图显示）
      listSensor({}).then(response => {
        this.sensors = response.rows || []
        this.updateProductLocations()
      }).catch(error => {
        console.error('获取传感器数据失败：', error)
      })

      // 使用API获取消防点数据（用于地图显示）
      listPoint({}).then(response => {
        this.firePoints = response.rows || []
        this.updateProductLocations()
      }).catch(error => {
        console.error('获取消防点数据失败：', error)
      })

      // 其他统计数据暂时使用模拟数据
      this.stats.alarmPending = 8
      this.stats.alarmPendingHigh = 2
      this.stats.maintenanceMonth = 45
      this.stats.maintenanceComplete = 38
    },

    updateProductLocations() {
      // 只要有消防点数据就开始处理，灭火器和传感器可能还没加载完
      if (!this.firePoints.length) {
        return
      }

      // 生成地图标记数据，使用消防点的坐标
      const newProductLocations = this.firePoints.map(point => {
        // 查找与消防点关联的灭火器 (类型转换确保比较正确)
        const pointExtinguishers = this.extinguishers.filter(
          ext => Number(ext.firePointId) === Number(point.firePointId)
        )

        // 查找与消防点关联的传感器（通过灭火器间接关联）
        const pointSensors = []
        pointExtinguishers.forEach(ext => {
          // 通过灭火器的 sensorId 或 sensorCode 查找关联的传感器
          const relatedSensors = this.sensors.filter(
            sensor => Number(sensor.sensorId) === Number(ext.sensorId) || sensor.sensorCode === ext.sensorCode
          )
          pointSensors.push(...relatedSensors)
        })

        // 去重
        const uniqueSensors = [...new Map(pointSensors.map(item => [item.sensorId, item])).values()]

        // 确定消防点状态（根据关联设备的状态）
        let status = 'normal'
        if (pointExtinguishers.some(ext => ext.status === '2')) {
          status = 'expired' // 过期
        } else if (uniqueSensors.some(sensor => sensor.status === '1')) {
          status = 'warning' // 预警
        } else if (uniqueSensors.some(sensor => sensor.status === '2')) {
          status = 'lowbat' // 低电量
        }

        return {
          id: point.firePointId,
          name: point.firePointName,
          lat: parseFloat(point.latitude) || 0,
          lng: parseFloat(point.longitude) || 0,
          status: status,
          info: point.location || point.firePointName,
          extinguishers: pointExtinguishers,
          sensors: uniqueSensors
        }
      }).filter(location => location.lat && location.lng) // 过滤掉没有坐标的消防点

      // 只有当数据发生变化时才更新
      const dataChanged = JSON.stringify(this.productLocations) !== JSON.stringify(newProductLocations)
      if (dataChanged) {
        this.productLocations = newProductLocations
        
        // 如果地图已初始化，更新标记
        if (this.map) {
          this.updateMapMarkers()
        }
      }
    },

    updateMapMarkers() {
      if (!this.map || !this.productLocations || this.productLocations.length === 0) return

      try {
        // 清除现有的标记图层
        if (this.markerLayer) {
          this.markerLayer.setMap(null)
          this.markerLayer = null
        }

        // 创建新的标记数据
        const geometries = this.productLocations.map(loc => {
          return {
            id: loc.id,
            styleId: this._getStyleIdByStatus(loc.status),
            position: new TMap.LatLng(loc.lat, loc.lng),
            properties: {
              id: loc.id,
              title: loc.name,
              info: loc.info || '',
              status: loc.status
            }
          }
        })

        // 创建新的标记图层
        this.markerLayer = new TMap.MultiMarker({
          map: this.map,
          styles: {
            'normal': new TMap.MarkerStyle({
              width: 28,
              height: 36,
              anchor: { x: 14, y: 36 },
              src: this._createMarkerIcon('#67C23A')
            }),
            'warning': new TMap.MarkerStyle({
              width: 28,
              height: 36,
              anchor: { x: 14, y: 36 },
              src: this._createMarkerIcon('#E6A23C')
            }),
            'expired': new TMap.MarkerStyle({
              width: 28,
              height: 36,
              anchor: { x: 14, y: 36 },
              src: this._createMarkerIcon('#F56C6C')
            }),
            'lowbat': new TMap.MarkerStyle({
              width: 28,
              height: 36,
              anchor: { x: 14, y: 36 },
              src: this._createMarkerIcon('#909399')
            })
          },
          geometries: geometries
        })

        // 重新绑定点击事件
        this.bindMarkerClickEvent()

        // 调整地图视图
        this.fitToBounds()
      } catch (e) {
        console.error('更新地图标记失败：', e)
      }
    },

    bindMarkerClickEvent() {
      if (!this.markerLayer) return

      // 点击标记显示信息
      this.markerLayer.on('click', (evt) => {
        const props = evt.geometry.properties

        // 查找与消防点关联的灭火器 (类型转换确保比较正确)
        const pointExtinguishers = this.extinguishers.filter(
          ext => Number(ext.firePointId) === Number(props.id)
        )

        // 查找与消防点关联的传感器（通过灭火器间接关联）
        const pointSensors = []
        pointExtinguishers.forEach(ext => {
          // 通过灭火器的 sensorId 或 sensorCode 查找关联的传感器
          const relatedSensors = this.sensors.filter(
            sensor => Number(sensor.sensorId) === Number(ext.sensorId) || sensor.sensorCode === ext.sensorCode
          )
          pointSensors.push(...relatedSensors)
        })
        // 去重
        const uniqueSensors = [...new Map(pointSensors.map(item => [item.sensorId, item])).values()]

        // 查找消防点详情获取部门信息
        const firePoint = this.firePoints.find(fp => Number(fp.firePointId) === Number(props.id))

        // 统计灭火器各状态数量
        const extNormal = pointExtinguishers.filter(ext => ext.status === '0').length
        const extWarning = pointExtinguishers.filter(ext => ext.status === '1').length
        const extExpired = pointExtinguishers.filter(ext => ext.status === '2').length

        // 构建信息窗口内容 - 简化版
        let content = `
          <div style="padding:16px;min-width:300px;">
            <div style="font-weight:600;margin-bottom:12px;font-size:16px;color:#303133;border-bottom:1px solid #eee;padding-bottom:10px;">
              ${props.title}
            </div>
            <div style="margin-bottom:16px;">
              <div style="font-size:13px;color:#606266;margin-bottom:6px;">
                <span style="color:#909399;">位置：</span>${firePoint?.location || '-'} ${firePoint?.building ? firePoint.building + '栋' : ''} ${firePoint?.floor ? firePoint.floor + '层' : ''}
              </div>
              <div style="font-size:13px;color:#606266;margin-bottom:6px;">
                <span style="color:#909399;">所属部门：</span>${firePoint?.deptName || '-'}
              </div>
              <div style="font-size:13px;color:#606266;margin-bottom:6px;">
                <span style="color:#909399;">负责人：</span>${firePoint?.contactPerson || '-'} ${firePoint?.contactPhone ? '(' + firePoint.contactPhone + ')' : ''}
              </div>
            </div>

            <div style="background:#f5f7fa;border-radius:8px;padding:12px;">
              <div style="font-size:14px;font-weight:500;color:#303133;margin-bottom:10px;">灭火器统计</div>
              <div style="display:flex;gap:12px;font-size:13px;">
                <div style="flex:1;text-align:center;">
                  <div style="font-size:20px;font-weight:600;color:#409EFF;">${pointExtinguishers.length}</div>
                  <div style="color:#909399;">总数</div>
                </div>
                <div style="flex:1;text-align:center;">
                  <div style="font-size:20px;font-weight:600;color:#67C23A;">${extNormal}</div>
                  <div style="color:#909399;">正常</div>
                </div>
                <div style="flex:1;text-align:center;">
                  <div style="font-size:20px;font-weight:600;color:#E6A23C;">${extWarning}</div>
                  <div style="color:#909399;">待检</div>
                </div>
                <div style="flex:1;text-align:center;">
                  <div style="font-size:20px;font-weight:600;color:#F56C6C;">${extExpired}</div>
                  <div style="color:#909399;">过期</div>
                </div>
              </div>
            </div>

            <div style="margin-top:12px;padding-top:12px;border-top:1px solid #eee;">
              <div style="font-size:13px;color:#909399;">
                传感器数量：${uniqueSensors.length} 个
              </div>
            </div>
        </div>`

        // 确保信息窗口已创建
        if (!this.infoWindow) {
          const first = this.productLocations[0]
          const center = first ? new TMap.LatLng(first.lat, first.lng) : new TMap.LatLng(39.916527, 116.397128)
          this.infoWindow = new TMap.InfoWindow({
            map: this.map,
            position: center,
            offset: { x: 0, y: -32 }
          })
        }

        this.infoWindow.setPosition(evt.geometry.position)
        this.infoWindow.setContent(content)
        this.infoWindow.open()
      })
    },

    loadRecentAlarms() {
      this.recentAlarms = [
        { id: 1, title: '传感器SN20240156压力异常', location: '办公楼3层东侧', time: '5分钟前', level: 3, status: 'pending', statusText: '待处理' },
        { id: 2, title: '灭火器FE20240089即将过期', location: '仓库区B区', time: '1小时前', level: 2, status: 'pending', statusText: '待处理' },
        { id: 3, title: '传感器SN20240201低电量预警', location: '生产车间1楼', time: '2小时前', level: 1, status: 'handling', statusText: '处理中' }
      ]
    },

    // ============ 腾讯地图 GL JS API ============
    initTencentMap() {
      if (window.TMap) {
        this._initMapInstance()
        return
      }

      const TENCENT_MAP_KEY = 'RAUBZ-72I33-ZCE3X-RRDRX-CVK7F-E5B2O'

      if (document.querySelector(`script[data-tmap-key="${TENCENT_MAP_KEY}"]`)) {
        const checkTimer = setInterval(() => {
          if (window.TMap) {
            clearInterval(checkTimer)
            this._initMapInstance()
          }
        }, 200)
        setTimeout(() => clearInterval(checkTimer), 5000)
        return
      }

      const script = document.createElement('script')
      script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${TENCENT_MAP_KEY}`
      script.charset = 'utf-8'
      script.setAttribute('data-tmap-key', TENCENT_MAP_KEY)

      script.onload = () => {
        if (!window.TMap) {
          console.error('腾讯地图GL脚本加载完成但 window.TMap 未定义')
          this.$message.error('腾讯地图加载异常')
          return
        }
        this._initMapInstance()
      }

      script.onerror = (err) => {
        console.error('腾讯地图GL脚本加载失败：', err)
        this.$message.error('腾讯地图脚本加载失败')
      }

      document.head.appendChild(script)
    },

    _initMapInstance() {
      if (!this.$refs.mapContainer) {
        console.error('找不到 mapContainer 元素')
        return
      }

      const first = this.productLocations && this.productLocations.length ? this.productLocations[0] : null
      const centerLat = first ? first.lat : 39.916527
      const centerLng = first ? first.lng : 116.397128
      const center = new TMap.LatLng(centerLat, centerLng)

      try {
        this.map = new TMap.Map(this.$refs.mapContainer, {
          center: center,
          zoom: 14,
          viewMode: '2D'
        })
      } catch (e) {
        console.error('创建地图实例失败：', e)
        this.$message.error('地图初始化失败')
        return
      }

      this.initMapMarkers()
    },

    // 初始化地图标记
    initMapMarkers() {
      if (!this.map || !this.productLocations || this.productLocations.length === 0) return

      try {
        // 创建信息窗口
        const first = this.productLocations[0]
        const center = first ? new TMap.LatLng(first.lat, first.lng) : new TMap.LatLng(39.916527, 116.397128)
        this.infoWindow = new TMap.InfoWindow({
          map: this.map,
          position: center,
          offset: { x: 0, y: -32 }
        })
        this.infoWindow.close()

        // 更新标记
        this.updateMapMarkers()
      } catch (e) {
        console.error('初始化地图标记失败：', e)
      }
    },

    _getStyleIdByStatus(status) {
      const map = {
        'normal': 'normal',
        'warning': 'warning',
        'expired': 'expired',
        'lowbat': 'lowbat'
      }
      return map[status] || 'normal'
    },

    _createMarkerIcon(color) {
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='36'>
        <path d='M14 36s-10-7.9-10-18a10 10 0 1 1 20 0c0 10.1-10 18-10 18z' fill='${color}'/>
        <circle cx='14' cy='12' r='4' fill='#fff'/>
      </svg>`
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
    },

    clearMap() {
      try {
        if (this.markerLayer) {
          this.markerLayer.setMap(null)
          this.markerLayer = null
        }
        if (this.infoWindow) {
          this.infoWindow.close()
          this.infoWindow = null
        }
        this.map = null
      } catch (e) {
        console.warn('清理地图失败：', e)
      }
    },

    fitToBounds() {
      if (!this.map || !this.productLocations || this.productLocations.length === 0) return
      
      try {
        const bounds = new TMap.LatLngBounds()
        this.productLocations.forEach(loc => {
          bounds.extend(new TMap.LatLng(loc.lat, loc.lng))
        })
        this.map.fitBounds(bounds, {
          padding: 50
        })
      } catch (e) {
        console.warn('fitToBounds 失败：', e)
      }
    },

    toggleMapFullscreen() {
      this.isMapFullscreen = !this.isMapFullscreen
      this.$nextTick(() => {
        if (this.map) {
          setTimeout(() => {
            const center = this.map.getCenter()
            this.map.setCenter(center)
          }, 300)
        }
      })
    },

    navigateTo(path) {
      this.$router.push(path)
    }
  }
}
</script>

<style lang="scss" scoped>
.fire-dashboard {
  padding: 20px;
  background: #f0f2f5;
  min-height: calc(100vh - 84px);
}

.dashboard-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 20px;
  color: #fff;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
  }
  
  .welcome-section {
    flex: 1;
    min-width: 280px;
  }
  
  .welcome-title {
    font-size: 28px;
    font-weight: 600;
    margin: 0 0 10px 0;
    display: flex;
    align-items: center;
    gap: 10px;
    
    i {
      font-size: 32px;
    }
  }
  
  .welcome-subtitle {
    font-size: 14px;
    margin: 0;
    opacity: 0.9;
  }
  
  .time-display {
    text-align: right;
    
    .current-date {
      font-size: 16px;
      margin-bottom: 5px;
      opacity: 0.95;
    }
    
    .current-time {
      font-size: 32px;
      font-weight: 600;
      font-family: 'Monaco', 'Courier New', monospace;
      letter-spacing: 2px;
    }
  }
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 20px;
  height: 120px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    transition: width 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
    
    &::before {
      width: 100%;
      opacity: 0.05;
    }
  }
  
  .stat-icon {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    
    svg {
      width: 36px;
      height: 36px;
    }
  }
  
  .stat-content {
    flex: 1;
  }
  
  .stat-label {
    font-size: 14px;
    color: #909399;
    margin-bottom: 8px;
  }
  
  .stat-value {
    font-size: 32px;
    font-weight: 600;
    line-height: 1;
    margin-bottom: 8px;
    
    &.alarm-value {
      color: #F56C6C;
    }
  }
  
  .stat-trend {
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    
    &.trend-up {
      color: #67C23A;
    }
    
    &.trend-down {
      color: #F56C6C;
    }
    
    &.trend-neutral {
      color: #409EFF;
    }
  }
  
  &.card-extinguisher {
    &::before {
      background: #409EFF;
    }
    
    .stat-icon {
      background: rgba(64, 158, 255, 0.1);
      color: #409EFF;
    }
  }
  
  &.card-sensor {
    &::before {
      background: #67C23A;
    }
    
    .stat-icon {
      background: rgba(103, 194, 58, 0.1);
      color: #67C23A;
    }
  }
  
  &.card-alarm {
    &::before {
      background: #F56C6C;
    }

    .stat-icon {
      background: rgba(245, 108, 108, 0.1);
      color: #F56C6C;
    }
  }

  &.card-contract {
    &::before {
      background: #409EFF;
    }

    .stat-icon {
      background: rgba(64, 158, 255, 0.1);
      color: #409EFF;
    }
  }

  &.card-maintenance {
    &::before {
      background: #E6A23C;
    }
    
    .stat-icon {
      background: rgba(230, 162, 60, 0.1);
      color: #E6A23C;
    }
  }
}

.panel-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &.fullscreen-panel {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    margin: 0;
    border-radius: 0;
    
    .map-content {
      height: calc(100vh - 70px) !important;
    }
    
    .map-container {
      height: 100% !important;
    }
  }
  
  .panel-header {
    padding: 20px 24px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .panel-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #303133;
      
      i {
        font-size: 18px;
        color: #409EFF;
      }
    }
  }
  
  .panel-content {
    padding: 20px 24px;
    
    &.map-content {
      padding: 0;
      position: relative;
      height: 520px;
    }
  }
}

.map-container {
  width: 100%;
  height: 100%;
  background: #eef3f8;
}

.map-legend {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .legend-marker {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    }
    
    .legend-text {
      font-size: 13px;
      color: #606266;
      white-space: nowrap;
    }
  }
}

.alarm-list {
  .alarm-item {
    display: flex;
    align-items: center;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 12px;
    background: #f8f9fa;
    gap: 12px;
    transition: all 0.3s ease;
    
    &:hover {
      background: #f0f2f5;
      transform: translateX(4px);
    }
    
    .alarm-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    
    .alarm-info {
      flex: 1;
      min-width: 0;
      
      .alarm-title {
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .alarm-meta {
        display: flex;
        gap: 12px;
        font-size: 12px;
        color: #909399;
        
        .alarm-location {
          display: flex;
          align-items: center;
          gap: 4px;
          
          &::before {
            content: '📍';
          }
        }
      }
    }
    
    .alarm-status {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      flex-shrink: 0;
      
      &.status-pending {
        background: #fef0f0;
        color: #F56C6C;
      }
      
      &.status-handling {
        background: #fdf6ec;
        color: #E6A23C;
      }
    }
    
    &.alarm-level-3 .alarm-indicator {
      background: #F56C6C;
      box-shadow: 0 0 0 4px rgba(245, 108, 108, 0.2);
    }
    
    &.alarm-level-2 .alarm-indicator {
      background: #E6A23C;
      box-shadow: 0 0 0 4px rgba(230, 162, 60, 0.2);
    }
    
    &.alarm-level-1 .alarm-indicator {
      background: #409EFF;
      box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2);
    }
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
  
  i {
    font-size: 48px;
    margin-bottom: 12px;
    display: block;
    opacity: 0.5;
  }
  
  p {
    margin: 0;
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .fire-dashboard {
    padding: 12px;
  }
  
  .dashboard-header {
    padding: 20px;
    
    .welcome-title {
      font-size: 20px;
      
      i {
        font-size: 24px;
      }
    }
    
    .time-display .current-time {
      font-size: 24px;
    }
  }
  
  .stat-card {
    height: auto;
    min-height: 100px;
    padding: 16px;
    
    .stat-icon {
      width: 48px;
      height: 48px;
      
      svg {
        width: 28px;
        height: 28px;
      }
    }
    
    .stat-value {
      font-size: 24px;
    }
  }
  
  .panel-card .panel-header {
    padding: 16px;
  }
  
  .panel-card .panel-content {
    padding: 16px;
    
    &.map-content {
      padding: 0;
      height: 400px;
    }
  }
  
  .map-legend {
    bottom: 10px;
    left: 10px;
    padding: 8px 12px;
  }
}
</style>