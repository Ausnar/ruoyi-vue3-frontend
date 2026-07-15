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
          <p class="welcome-subtitle">
            {{ greeting }}，{{ userName }}！
            <template v-if="canViewContractAnalysis">
              服务 {{ stats.paidContractCount }} 家正式合同用户，{{ stats.trialContractCount }} 家试用合同用户
            </template>
          </p>
        </div>
        <div class="time-display">
          <div class="current-date">{{ currentDate }}</div>
          <div class="current-time">{{ currentTime }}</div>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <!-- 正式合同用户卡片 -->
      <el-col v-if="canViewContractAnalysis" :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <div class="stat-card card-contract-paid" @click="navigateToContractAnalysis('paid')">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 3H17C18.1 3 19 3.9 19 5V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V5C5 3.9 5.9 3 7 3Z" stroke="currentColor" stroke-width="2"/>
              <path d="M8.5 8H15.5M8.5 12H15.5M8.5 16H12.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">正式合同用户</div>
            <div class="stat-value">{{ stats.paidContractCount }}</div>
            <div class="stat-trend trend-up">
              <i class="el-icon-success"></i>
              家
            </div>
          </div>
        </div>
      </el-col>

      <!-- 试用合同用户卡片 -->
      <el-col v-if="canViewContractAnalysis" :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <div class="stat-card card-contract-trial" @click="navigateToContractAnalysis('trial')">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3L19 6V11C19 15.6 16.2 19.7 12 21C7.8 19.7 5 15.6 5 11V6L12 3Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              <path d="M9 12L11 14L15.5 9.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">试用合同用户</div>
            <div class="stat-value">{{ stats.trialContractCount }}</div>
            <div class="stat-trend trend-neutral">
              <i class="el-icon-user"></i>
              转化池
            </div>
          </div>
        </div>
      </el-col>

      <el-col v-if="canViewAlarmCard" :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <div class="stat-card card-alarm" @click="navigateTo('/manage/deviceWarning')">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C11 2 10 2.5 10 4C10 4.8 10.4 5.5 11 6V7C11 8 11 9 12 9C13 9 13 8 13 7V6C13.6 5.5 14 4.8 14 4C14 2.5 13 2 12 2Z" fill="currentColor"/>
              <path d="M18 11C18 7.7 15.3 5 12 5C8.7 5 6 7.7 6 11C6 13.4 4 15.5 4 18H20C20 15.5 18 13.4 18 11Z" fill="currentColor" opacity="0.3"/>
              <path d="M10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20H10Z" fill="currentColor"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">待响应预警</div>
            <div class="stat-value alarm-value">{{ stats.alarmPending }}</div>
            <div class="stat-trend trend-down">
              <i class="el-icon-warning"></i>
              {{ stats.alarmPendingHigh }} 条严重
            </div>
          </div>
        </div>
      </el-col>

      <el-col v-if="canViewMaintenanceCard" :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
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

    <!-- 中间区域 - 地图和近期预警 -->
    <el-row :gutter="20" class="content-row">
      <!-- 左侧 - 腾讯地图 -->
      <el-col v-if="canViewMapCard" :xs="24" :sm="24" :md="18" :lg="18" :xl="18">
        <div class="panel-card" :class="{ 'fullscreen-panel': isMapFullscreen }">
          <div class="panel-header">
            <h3 class="panel-title">
              <i class="el-icon-location"></i>
              合同用户分布
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
            <div class="map-legend" v-if="mapMode !== 'firePoint'">
              <div class="legend-item">
                <span class="legend-marker legend-marker--contract-paid"></span>
                <span class="legend-text">正式合同</span>
              </div>
              <div class="legend-item">
                <span class="legend-marker legend-marker--contract-trial"></span>
                <span class="legend-text">试用合同</span>
              </div>
              <div class="legend-item">
                <span class="legend-marker legend-marker--contract-mixed"></span>
                <span class="legend-text">混合合同</span>
              </div>
              <div class="legend-item">
                <span class="legend-marker legend-marker--contract-unset"></span>
                <span class="legend-text">未设置</span>
              </div>
            </div>
            <div class="map-legend" v-else>
              <div class="legend-item">
                <span class="legend-marker legend-marker--success"></span>
                <span class="legend-text">正常</span>
              </div>
              <div class="legend-item">
                <span class="legend-marker legend-marker--warning"></span>
                <span class="legend-text">预警</span>
              </div>
              <div class="legend-item">
                <span class="legend-marker legend-marker--danger"></span>
                <span class="legend-text">过期</span>
              </div>
              <div class="legend-item">
                <span class="legend-marker legend-marker--info"></span>
                <span class="legend-text">低电量</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <!-- 右侧 - 近期预警 -->
      <el-col v-if="canViewAlarmCard" :xs="24" :sm="24" :md="6" :lg="6" :xl="6">
        <div class="panel-card warning-panel">
          <div class="panel-header">
            <h3 class="panel-title">
              <i class="el-icon-bell"></i>
              近期预警
            </h3>
            <el-link type="primary" @click="navigateTo('/manage/deviceWarning')">查看全部</el-link>
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
                  <div class="alarm-main">
                    <div class="alarm-title" :title="alarm.title">{{ alarm.title }}</div>
                    <div class="alarm-status" :class="'status-' + alarm.status">
                      {{ alarm.statusText }}
                    </div>
                  </div>
                  <div class="alarm-dept" :title="alarm.deptName">{{ alarm.deptName }}</div>
                  <div class="alarm-meta">
                    <span class="alarm-location" :title="alarm.location">{{ alarm.location }}</span>
                    <span class="alarm-time">{{ alarm.time }}</span>
                  </div>
                </div>
              </div>
              <div v-if="recentAlarms.length === 0" class="empty-state">
                <i class="el-icon-success"></i>
                <p>暂无预警信息</p>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { getContractOverview } from '@/api/system/contract'
import { getDashboardMapHierarchy } from '@/api/manage/dashboardMap'
import { getDeviceWarningDashboard } from '@/api/manage/deviceWarning'
import useUserStore from '@/store/modules/user'

const DASHBOARD_CARD_PERMISSIONS = {
  contract: ['system:contract:analysis', 'system:contract:list'],
  alarm: ['dashboard:card:alarm'],
  map: ['dashboard:card:map', 'manage:point:list'],
  maintenance: ['dashboard:card:maintenance']
}

function hasAnyPermission(permissions, candidates) {
  return permissions.includes('*:*:*') || candidates.some(permission => permissions.includes(permission))
}

// 地图弹窗样式常量 - 统一管理弹窗颜色
const POPUP_STYLES = {
  container: 'padding:16px;min-width:300px;',
  title: 'font-weight:600;margin-bottom:12px;font-size:16px;color:var(--color-text-primary);border-bottom:1px solid var(--color-border-light);padding-bottom:10px;',
  label: 'font-size:13px;color:var(--color-text-regular);margin-bottom:6px;',
  labelSecondary: 'color:var(--color-text-secondary);',
  statsBox: 'background:var(--color-bg-page);border-radius:8px;padding:12px;',
  statsTitle: 'font-size:14px;font-weight:500;color:var(--color-text-primary);margin-bottom:10px;',
  statsValue: 'font-size:20px;font-weight:600;',
  statsLabel: 'color:var(--color-text-secondary);',
  primaryBtn: 'background:var(--color-primary);color:#fff;border:none;padding:8px 20px;border-radius:4px;cursor:pointer;font-size:14px;',
  secondaryBtn: 'background:var(--color-info);color:#fff;border:none;padding:8px 20px;border-radius:4px;cursor:pointer;font-size:14px;',
  // 状态颜色
  statusPrimary: 'color:var(--color-primary);',
  statusSuccess: 'color:var(--color-success);',
  statusWarning: 'color:var(--color-warning);',
  statusDanger: 'color:var(--color-danger);'
}

export default {
  name: 'FireDashboard',
  data() {
    return {
      userName: '管理员',
      currentDate: '',
      currentTime: '',
      stats: {
        paidContractCount: 0,
        trialContractCount: 0,
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
      gateways: [],
      sensors: [],
      productLocations: [], // 用于地图标记的数据
      // 部门数据（用于地图合同单位显示）
      mapHierarchy: null,
      // 地图模式：parent 业务根单位，child 下级单位，firePoint 消防点
      mapMode: 'parent',
      // 当前选中的部门
      mapStack: [],
      currentMapNode: null,
      recentAlarms: [],
      // 定时器
      timeIntervalId: null,
      dataIntervalId: null
    }
  },
  computed: {
    userPermissions() {
      return useUserStore().permissions || []
    },
    canViewContractAnalysis() {
      return hasAnyPermission(this.userPermissions, DASHBOARD_CARD_PERMISSIONS.contract)
    },
    canViewAlarmCard() {
      return hasAnyPermission(this.userPermissions, DASHBOARD_CARD_PERMISSIONS.alarm)
    },
    canViewMapCard() {
      return hasAnyPermission(this.userPermissions, DASHBOARD_CARD_PERMISSIONS.map)
    },
    canViewMaintenanceCard() {
      return hasAnyPermission(this.userPermissions, DASHBOARD_CARD_PERMISSIONS.maintenance)
    },
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
      if (this.canViewMapCard) {
        this.initTencentMap()
      }

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
      if (this.canViewContractAnalysis) {
        getContractOverview().then(response => {
          const data = response.data || {}
          this.stats.paidContractCount = Number(data.paidCount || 0)
          this.stats.trialContractCount = Number(data.trialCount || 0)
        }).catch(error => {
          console.error('获取合同用户数据失败：', error)
          this.stats.paidContractCount = 0
          this.stats.trialContractCount = 0
        })
      } else {
        this.stats.paidContractCount = 0
        this.stats.trialContractCount = 0
      }

      if (this.canViewMapCard) {
        // 获取部门数据（用于地图显示合同单位）
        getDashboardMapHierarchy().then(response => {
          this.mapHierarchy = response.data || { roots: [] }
          this.firePoints = this.flattenFirePoints(this.mapHierarchy.roots || [])
          if (this.mapMode === 'parent' || !this.currentMapNode) {
            this.showParentUnits()
          } else {
            this.refreshCurrentMapLevel()
          }
        }).catch(error => {
          console.error('获取地图层级数据失败：', error)
        })
      } else {
        this.mapHierarchy = null
        this.firePoints = []
        this.setMapLocations([])
      }

      this.stats.maintenanceMonth = this.canViewMaintenanceCard ? 45 : 0
      this.stats.maintenanceComplete = this.canViewMaintenanceCard ? 38 : 0
    },

    updateProductLocations() {
      if (this.mapMode === 'firePoint' && this.currentMapNode) {
        this.showFirePoints(this.currentMapNode, false)
      }
    },

    flattenFirePoints(nodes = []) {
      const result = []
      nodes.forEach(node => {
        if (node.nodeType === 'firePoint') {
          result.push(node)
        }
        if (node.firePoints && node.firePoints.length) {
          result.push(...node.firePoints)
        }
        if (node.children && node.children.length) {
          result.push(...this.flattenFirePoints(node.children))
        }
      })
      return [...new Map(result.map(item => [item.firePointId, item])).values()]
    },

    normalizeMapNode(node) {
      const lat = parseFloat(node.latitude)
      const lng = parseFloat(node.longitude)
      if (!lat || !lng) return null
      const isFirePoint = node.nodeType === 'firePoint'
      return {
        id: node.nodeId || `${node.nodeType}-${node.deptId || node.firePointId}`,
        nodeType: node.nodeType,
        name: node.name || node.deptName || node.firePointName,
        title: node.name || node.deptName || node.firePointName,
        lat,
        lng,
        status: isFirePoint ? this.getFirePointStatus(node) : 'normal',
        info: isFirePoint ? (node.location || node.firePointName) : [node.province, node.city, node.area].filter(Boolean).join('-'),
        deptId: node.deptId,
        deptName: node.deptName,
        contractType: this.normalizeDeptContractType(node.contractType),
        firePointId: node.firePointId,
        firePointName: node.firePointName,
        leader: node.leader,
        phone: node.phone,
        contactPerson: node.contactPerson,
        contactPhone: node.contactPhone,
        externalCompanyId: node.externalCompanyId,
        externalCompanyName: node.externalCompanyName,
        location: node.location,
        building: node.building,
        floor: node.floor,
        childUnitCount: node.childUnitCount || 0,
        firePointCount: node.firePointCount || 0,
        directFirePointCount: node.directFirePointCount || 0,
        gatewayCount: node.gatewayCount || 0,
        sensorCount: node.sensorCount || 0,
        extinguisherCount: node.extinguisherCount || 0,
        normalExtinguisherCount: node.normalExtinguisherCount || 0,
        warningExtinguisherCount: node.warningExtinguisherCount || 0,
        expiredExtinguisherCount: node.expiredExtinguisherCount || 0,
        children: node.children || [],
        firePoints: node.firePoints || [],
        sourceNode: node
      }
    },

    setMapLocations(nodes) {
      const locations = (nodes || []).map(node => this.normalizeMapNode(node)).filter(Boolean)
      const dataChanged = JSON.stringify(this.productLocations) !== JSON.stringify(locations)
      this.productLocations = locations
      if (locations.length === 0 && this.markerLayer) {
        this.markerLayer.setMap(null)
        this.markerLayer = null
      }
      if (this.map && dataChanged) {
        this.updateMapMarkers()
      }
    },

    showParentUnits() {
      this.mapMode = 'parent'
      this.mapStack = []
      this.currentMapNode = null
      this.updateMapTitle()
      this.setMapLocations(this.mapHierarchy?.roots || [])
    },

    showChildUnits(parentNode) {
      const children = parentNode.children || []
      const childDeptNodes = children.filter(item => item.nodeType === 'childDept')
      const directGroup = children.find(item => item.nodeType === 'directGroup')
      if (childDeptNodes.length === 0 && directGroup && directGroup.firePointCount > 0) {
        this.mapMode = 'firePoint'
        this.currentMapNode = directGroup
        this.mapStack = [{ mode: 'parent', node: null }]
        this.updateMapTitle()
        this.setMapLocations(directGroup.firePoints || [])
        return
      }
      this.mapMode = 'child'
      this.currentMapNode = parentNode
      this.mapStack = [{ mode: 'parent', node: null }]
      this.updateMapTitle()
      this.setMapLocations(children)
    },

    showFirePoints(node, pushStack = true) {
      if (pushStack) {
        this.mapStack.push({ mode: this.mapMode, node: this.currentMapNode })
      }
      this.mapMode = 'firePoint'
      this.currentMapNode = node
      this.updateMapTitle()
      this.setMapLocations(node.firePoints || [])
    },

    goBackMapLevel() {
      const previous = this.mapStack.pop()
      if (!previous || previous.mode === 'parent') {
        this.showParentUnits()
        return
      }
      if (previous.mode === 'child') {
        this.mapMode = 'child'
        this.currentMapNode = previous.node
        this.updateMapTitle()
        this.setMapLocations(previous.node?.children || [])
      }
    },

    refreshCurrentMapLevel() {
      if (this.mapMode === 'parent') {
        this.showParentUnits()
      } else if (this.mapMode === 'child' && this.currentMapNode) {
        const latest = this.findNodeById(this.currentMapNode.nodeId, this.mapHierarchy?.roots || [])
        this.showChildUnits(latest || this.currentMapNode)
      } else if (this.mapMode === 'firePoint' && this.currentMapNode) {
        const latest = this.findNodeById(this.currentMapNode.nodeId, this.mapHierarchy?.roots || [])
        this.showFirePoints(latest || this.currentMapNode, false)
      }
    },

    findNodeById(nodeId, nodes = []) {
      for (const node of nodes) {
        if (node.nodeId === nodeId) return node
        const child = this.findNodeById(nodeId, node.children || [])
        if (child) return child
      }
      return null
    },

    getFirePointStatus(point) {
      const pointGateways = this.getPointGateways(point.firePointId)
      const pointSensors = this.getPointSensors(point.firePointId, pointGateways)
      const pointExtinguishers = this.getPointExtinguishers(point.firePointId, pointSensors)
      if (pointExtinguishers.some(ext => ext.status === '2')) return 'expired'
      if (pointSensors.some(sensor => sensor.status === '1')) return 'warning'
      if (pointSensors.some(sensor => sensor.status === '2')) return 'lowbat'
      if (Number(point.expiredExtinguisherCount || 0) > 0) return 'expired'
      if (Number(point.warningExtinguisherCount || 0) > 0) return 'warning'
      if (point.status) return point.status
      return 'normal'
    },

    getPointGateways(firePointId) {
      return this.gateways.filter(gateway => Number(gateway.firePointId) === Number(firePointId))
    },

    getPointSensors(firePointId, pointGateways = null) {
      const gateways = pointGateways || this.getPointGateways(firePointId)
      const gatewayIds = new Set(gateways.map(gateway => Number(gateway.gatewayId)).filter(Boolean))
      const pointSensors = this.sensors.filter(sensor => gatewayIds.has(Number(sensor.gatewayId)))
      return [...new Map(pointSensors.map(item => [item.sensorId, item])).values()]
    },

    getPointExtinguishers(firePointId, pointSensors = null) {
      const sensors = pointSensors || this.getPointSensors(firePointId)
      const sensorIds = new Set(sensors.map(sensor => Number(sensor.sensorId)).filter(Boolean))
      const sensorCodes = new Set(sensors.map(sensor => sensor.sensorCode).filter(Boolean))
      const pointExtinguishers = this.extinguishers.filter(ext => {
        const matchedByFirePoint = Number(ext.firePointId) === Number(firePointId)
        const matchedBySensor = sensorIds.has(Number(ext.sensorId))
        const matchedBySensorCode = sensorCodes.has(ext.sensorCode)
        return matchedByFirePoint || matchedBySensor || matchedBySensorCode
      })
      return [...new Map(pointExtinguishers.map(item => [item.extinguisherId, item])).values()]
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
          const styleId = loc.nodeType === 'firePoint'
            ? this._getStyleIdByStatus(loc.status)
            : this.getDeptMarkerStyleId(loc.contractType)
          return {
            id: loc.id,
            styleId: styleId,
            position: new TMap.LatLng(loc.lat, loc.lng),
            properties: {
              id: loc.id,
              title: loc.name,
              info: loc.info || '',
              status: loc.status,
              mapMode: this.mapMode,
              nodeType: loc.nodeType,
              deptId: loc.deptId,
              deptName: loc.deptName,
              contractType: loc.contractType,
              firePointId: loc.firePointId,
              firePointName: loc.firePointName,
              leader: loc.leader,
              phone: loc.phone,
              contactPerson: loc.contactPerson,
              contactPhone: loc.contactPhone,
              externalCompanyId: loc.externalCompanyId,
              externalCompanyName: loc.externalCompanyName,
              location: loc.location,
              building: loc.building,
              floor: loc.floor,
              childUnitCount: loc.childUnitCount,
              firePointCount: loc.firePointCount,
              directFirePointCount: loc.directFirePointCount,
              gatewayCount: loc.gatewayCount,
              sensorCount: loc.sensorCount,
              extinguisherCount: loc.extinguisherCount,
              normalExtinguisherCount: loc.normalExtinguisherCount,
              warningExtinguisherCount: loc.warningExtinguisherCount,
              expiredExtinguisherCount: loc.expiredExtinguisherCount
            }
          }
        })

        // 创建新的标记图层
        this.markerLayer = new TMap.MultiMarker({
          map: this.map,
          styles: {
            // 部门标记样式（按合同性质区分）
            'dept-paid': new TMap.MarkerStyle({
              width: 32,
              height: 40,
              anchor: { x: 16, y: 40 },
              src: this._createMarkerIcon('#409EFF', true)
            }),
            'dept-trial': new TMap.MarkerStyle({
              width: 32,
              height: 40,
              anchor: { x: 16, y: 40 },
              src: this._createMarkerIcon('#67C23A', true)
            }),
            'dept-mixed': new TMap.MarkerStyle({
              width: 32,
              height: 40,
              anchor: { x: 16, y: 40 },
              src: this._createMarkerIcon('#8B5CF6', true)
            }),
            'dept-unset': new TMap.MarkerStyle({
              width: 32,
              height: 40,
              anchor: { x: 16, y: 40 },
              src: this._createMarkerIcon('#909399', true)
            }),
            // 设备标记样式
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
        const location = this.productLocations.find(item => String(item.id) === String(evt.geometry.id)) || props
        const content = location.nodeType === 'firePoint'
          ? this._buildDeviceInfoContent(location)
          : this._buildDeptInfoContent(location)

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

        // 添加按钮点击事件（使用setTimeout确保DOM已渲染）
        setTimeout(() => {
          // 查看设备分布按钮
          const viewBtn = document.getElementById('view-devices-btn')
          if (viewBtn) {
            viewBtn.onclick = () => {
              if (location.nodeType === 'parentDept') {
                this.showChildUnits(location.sourceNode)
              } else {
                this.showFirePoints(location.sourceNode)
              }
              if (this.infoWindow) this.infoWindow.close()
            }
          }

          const backBtn = document.getElementById('back-to-dept-btn')
          if (backBtn) {
            backBtn.onclick = () => {
              this.goBackMapLevel()
              if (this.infoWindow) this.infoWindow.close()
            }
          }
        }, 100)
      })
    },

    // 更新地图标题
    updateMapTitle() {
      const titleEl = document.querySelector('.panel-title')
      if (titleEl) {
        const name = this.currentMapNode?.name || this.currentMapNode?.deptName || ''
        if (this.mapMode === 'parent') titleEl.innerHTML = '<i class="el-icon-location"></i> 业务单位分布'
        if (this.mapMode === 'child') titleEl.innerHTML = `<i class="el-icon-location"></i> ${name} 下级单位`
        if (this.mapMode === 'firePoint') titleEl.innerHTML = `<i class="el-icon-location"></i> ${name} 消防点分布`
      }
    },

    // 构建部门信息窗口内容
    _buildDeptInfoContent(props) {
      const actionText = props.nodeType === 'parentDept' ? '查看下级单位' : '查看消防点'
      const canDrill = props.nodeType === 'parentDept'
        ? ((props.children && props.children.length > 0) || props.firePointCount > 0)
        : props.firePointCount > 0
      return `
        <div style="${POPUP_STYLES.container}">
          <div style="${POPUP_STYLES.title}">
            ${props.title || props.name}
          </div>
          <div style="margin-bottom:16px;">
            <div style="${POPUP_STYLES.label}">
              <span style="${POPUP_STYLES.labelSecondary}">位置：</span>${props.info || '-'}
            </div>
            <div style="${POPUP_STYLES.label}">
              <span style="${POPUP_STYLES.labelSecondary}">合同性质：</span>${this.getDeptContractTypeText(props.contractType)}
            </div>
            <div style="${POPUP_STYLES.label}">
              <span style="${POPUP_STYLES.labelSecondary}">负责人：</span>${props.leader || '-'}
            </div>
            <div style="${POPUP_STYLES.label}">
              <span style="${POPUP_STYLES.labelSecondary}">联系电话：</span>${props.phone || '-'}
            </div>
            <div style="${POPUP_STYLES.label}">
              <span style="${POPUP_STYLES.labelSecondary}">消防点数量：</span>${props.firePointCount || 0} 个
            </div>
            ${props.nodeType === 'parentDept' ? `
            <div style="${POPUP_STYLES.label}">
              <span style="${POPUP_STYLES.labelSecondary}">下级单位：</span>${props.childUnitCount || 0} 个
            </div>
            <div style="${POPUP_STYLES.label}">
              <span style="${POPUP_STYLES.labelSecondary}">直属/未分配：</span>${props.directFirePointCount || 0} 个
            </div>
            ` : ''}
          </div>
          ${canDrill ? `
          <div style="text-align:center;margin-top:12px;padding-top:12px;border-top:1px solid var(--color-border-light);">
            <button id="view-devices-btn" style="${POPUP_STYLES.primaryBtn}">${actionText}</button>
          </div>
          ` : ''}
        </div>`
    },

    // 构建设备信息窗口内容
    _buildDeviceInfoContent(props) {
      const firePointId = props.firePointId || props.id
      const pointGateways = this.getPointGateways(firePointId)
      const pointSensors = this.getPointSensors(firePointId, pointGateways)
      const pointExtinguishers = this.getPointExtinguishers(firePointId, pointSensors)

      // 查找消防点详情
      const firePoint = this.firePoints.find(fp => Number(fp.firePointId) === Number(firePointId)) || props

      // 统计灭火器各状态数量
      const extTotal = pointExtinguishers.length || Number(firePoint?.extinguisherCount || props.extinguisherCount || 0)
      const extNormal = pointExtinguishers.length
        ? pointExtinguishers.filter(ext => ext.status === '0').length
        : Number(firePoint?.normalExtinguisherCount || props.normalExtinguisherCount || 0)
      const extWarning = pointExtinguishers.length
        ? pointExtinguishers.filter(ext => ext.status === '1').length
        : Number(firePoint?.warningExtinguisherCount || props.warningExtinguisherCount || 0)
      const extExpired = pointExtinguishers.length
        ? pointExtinguishers.filter(ext => ext.status === '2').length
        : Number(firePoint?.expiredExtinguisherCount || props.expiredExtinguisherCount || 0)
      const gatewayCount = pointGateways.length || Number(firePoint?.gatewayCount || props.gatewayCount || 0)
      const sensorCount = pointSensors.length || Number(firePoint?.sensorCount || props.sensorCount || 0)

      return `
        <div style="${POPUP_STYLES.container}">
          <div style="${POPUP_STYLES.title}">
            ${props.title || props.name}
          </div>
          <div style="margin-bottom:16px;">
            <div style="${POPUP_STYLES.label}">
              <span style="${POPUP_STYLES.labelSecondary}">位置：</span>${firePoint?.location || '-'} ${firePoint?.building ? firePoint.building + '栋' : ''} ${firePoint?.floor ? firePoint.floor + '层' : ''}
            </div>
            <div style="${POPUP_STYLES.label}">
              <span style="${POPUP_STYLES.labelSecondary}">外部单位：</span>${firePoint?.externalCompanyName || '-'}
            </div>
            <div style="${POPUP_STYLES.label}">
              <span style="${POPUP_STYLES.labelSecondary}">归属单位：</span>${firePoint?.deptName || '-'}
            </div>
            <div style="${POPUP_STYLES.label}">
              <span style="${POPUP_STYLES.labelSecondary}">负责人：</span>${firePoint?.contactPerson || '-'} ${firePoint?.contactPhone ? '(' + firePoint.contactPhone + ')' : ''}
            </div>
          </div>

          <div style="${POPUP_STYLES.statsBox}">
            <div style="${POPUP_STYLES.statsTitle}">灭火器统计</div>
            <div style="display:flex;gap:12px;font-size:13px;">
              <div style="flex:1;text-align:center;">
                <div style="${POPUP_STYLES.statsValue} ${POPUP_STYLES.statusPrimary}">${extTotal}</div>
                <div style="${POPUP_STYLES.statsLabel}">总数</div>
              </div>
              <div style="flex:1;text-align:center;">
                <div style="${POPUP_STYLES.statsValue} ${POPUP_STYLES.statusSuccess}">${extNormal}</div>
                <div style="${POPUP_STYLES.statsLabel}">正常</div>
              </div>
              <div style="flex:1;text-align:center;">
                <div style="${POPUP_STYLES.statsValue} ${POPUP_STYLES.statusWarning}">${extWarning}</div>
                <div style="${POPUP_STYLES.statsLabel}">待检</div>
              </div>
              <div style="flex:1;text-align:center;">
                <div style="${POPUP_STYLES.statsValue} ${POPUP_STYLES.statusDanger}">${extExpired}</div>
                <div style="${POPUP_STYLES.statsLabel}">过期</div>
              </div>
            </div>
          </div>

          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--color-border-light);">
            <div style="${POPUP_STYLES.label}">
              网关数量：${gatewayCount} 个
            </div>
            <div style="${POPUP_STYLES.label}">
              传感器数量：${sensorCount} 个
            </div>
          </div>
          <div style="text-align:center;margin-top:12px;padding-top:12px;border-top:1px solid var(--color-border-light);">
            <button id="back-to-dept-btn" style="${POPUP_STYLES.secondaryBtn}">返回上一级</button>
          </div>
        </div>`
    },

    loadRecentAlarms() {
      if (!this.canViewAlarmCard) {
        this.stats.alarmPending = 0
        this.stats.alarmPendingHigh = 0
        this.recentAlarms = []
        return
      }
      getDeviceWarningDashboard().then(response => {
        const data = response.data || {}
        this.stats.alarmPending = Number(data.pendingCount || 0)
        this.stats.alarmPendingHigh = Number(data.severeCount || 0)
        this.recentAlarms = (data.recentWarnings || []).map(this.mapDashboardWarning)
      }).catch(error => {
        console.error('获取首页预警数据失败：', error)
        this.stats.alarmPending = 0
        this.stats.alarmPendingHigh = 0
        this.recentAlarms = []
      })
    },

    mapDashboardWarning(warning) {
      const typeText = this.getWarningTypeText(warning.warningType)
      const deviceText = this.getWarningDeviceText(warning)
      return {
        id: warning.warningId,
        title: deviceText ? `${typeText}：${deviceText}` : typeText,
        deptName: warning.deptName || warning.sourceDeptName || '-',
        location: warning.firePointName || '-',
        time: this.formatDashboardTime(warning.lastTriggerTime || warning.triggerTime),
        level: this.getWarningLevel(warning.warningType),
        status: warning.warningStatus || 'pending',
        statusText: this.getWarningStatusText(warning.warningStatus)
      }
    },

    getWarningTypeText(type) {
      const map = {
        suspected_fire: '疑似火灾',
        low_battery: '低电量',
        low_pressure: '压力过低',
        high_pressure: '压力过高',
        insufficient_extinguisher: '灭火器数量不足',
        extinguisher_scrap_due: '灭火器临近报废',
        extinguisher_expired: '灭火器到期（历史）',
        abnormal_temperature: '环境温度异常',
        gateway_offline: '网关失联'
      }
      return map[type] || type || '设备预警'
    },

    getWarningStatusText(status) {
      const map = {
        pending: '待响应',
        processing: '处理中',
        resolved: '已解除',
        false_alarm: '误报'
      }
      return map[status] || status || '待响应'
    },

    getWarningDeviceText(warning) {
      if (warning.sensorCode) return warning.sensorCode
      if (warning.extinguisherLabelCode) return warning.extinguisherLabelCode
      if (warning.gatewayImei) return warning.gatewayImei
      if (warning.firePointName) return warning.firePointName
      return ''
    },

    getWarningLevel(type) {
      if (type === 'suspected_fire') return 3
      if (['high_pressure', 'extinguisher_scrap_due', 'extinguisher_expired', 'abnormal_temperature'].includes(type)) return 2
      return 1
    },

    formatDashboardTime(value) {
      if (!value) return '-'
      const time = new Date(value).getTime()
      if (Number.isNaN(time)) return value
      const diff = Date.now() - time
      const minute = 60 * 1000
      const hour = 60 * minute
      const day = 24 * hour
      if (diff >= 0 && diff < minute) return '刚刚'
      if (diff >= 0 && diff < hour) return `${Math.floor(diff / minute)}分钟前`
      if (diff >= 0 && diff < day) return `${Math.floor(diff / hour)}小时前`
      const date = new Date(value)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const dayOfMonth = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${month}-${dayOfMonth} ${hours}:${minutes}`
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

    normalizeDeptContractType(contractType) {
      const map = {
        paid: 'paid',
        trial: 'trial',
        mixed: 'mixed',
        unset: 'unset'
      }
      return map[contractType] || 'unset'
    },

    getDeptMarkerStyleId(contractType) {
      return `dept-${this.normalizeDeptContractType(contractType)}`
    },

    getDeptContractTypeText(contractType) {
      const map = {
        paid: '正式合同',
        trial: '试用合同',
        mixed: '混合合同',
        unset: '未设置'
      }
      return map[this.normalizeDeptContractType(contractType)] || '未设置'
    },

    _createMarkerIcon(color, isDept = false) {
      let svg
      if (isDept) {
        // 部门标记：大楼形状
        svg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='40'>
          <path d='M16 0L0 12v28h32V12L16 0z' fill='${color}'/>
          <rect x='6' y='18' width='6' height='8' fill='#fff' opacity='0.8'/>
          <rect x='13' y='18' width='6' height='8' fill='#fff' opacity='0.8'/>
          <rect x='20' y='18' width='6' height='8' fill='#fff' opacity='0.8'/>
          <rect x='6' y='30' width='6' height='6' fill='#fff' opacity='0.8'/>
          <rect x='20' y='30' width='6' height='6' fill='#fff' opacity='0.8'/>
        </svg>`
      } else {
        // 设备标记：气球形状
        svg = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='36'>
          <path d='M14 36s-10-7.9-10-18a10 10 0 1 1 20 0c0 10.1-10 18-10 18z' fill='${color}'/>
          <circle cx='14' cy='12' r='4' fill='#fff'/>
        </svg>`
      }
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
    },

    navigateToContractAnalysis(contractType) {
      this.$router.push({
        path: '/contract-analysis',
        query: { contractType }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.fire-dashboard {
  padding: 20px;
  background: var(--workspace-bg, linear-gradient(180deg, #F0F7FF 0%, #FFFFFF 100%));
  min-height: calc(100vh - 84px);
}

.dashboard-header {
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 20px;
  color: #fff;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2);
  
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
  background: var(--color-bg-card);
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--card-shadow);
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
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);

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
    color: var(--color-text-secondary);
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 32px;
    font-weight: 600;
    line-height: 1;
    margin-bottom: 8px;

    &.alarm-value {
      color: var(--color-danger);
    }
  }

  .stat-trend {
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;

    &.trend-up {
      color: var(--color-success);
    }

    &.trend-down {
      color: var(--color-danger);
    }

    &.trend-neutral {
      color: var(--color-primary);
    }
  }

  &.card-extinguisher {
    &::before {
      background: var(--color-primary);
    }

    .stat-icon {
      background: var(--color-primary-bg);
      color: var(--color-primary);
    }
  }

  &.card-sensor {
    &::before {
      background: var(--color-success);
    }

    .stat-icon {
      background: var(--color-success-bg);
      color: var(--color-success);
    }
  }

  &.card-alarm {
    &::before {
      background: var(--color-danger);
    }

    .stat-icon {
      background: var(--color-danger-bg);
      color: var(--color-danger);
    }
  }

  &.card-contract-paid {
    &::before {
      background: var(--color-primary);
    }

    .stat-icon {
      background: var(--color-primary-bg);
      color: var(--color-primary);
    }
  }

  &.card-contract-trial {
    &::before {
      background: var(--color-success);
    }

    .stat-icon {
      background: var(--color-success-bg);
      color: var(--color-success);
    }
  }

  &.card-maintenance {
    &::before {
      background: var(--color-warning);
    }

    .stat-icon {
      background: var(--color-warning-bg);
      color: var(--color-warning);
    }
  }
}

.panel-card {
  background: var(--color-bg-card);
  border-radius: 12px;
  box-shadow: var(--card-shadow);
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
    border-bottom: 1px solid var(--color-border);
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
      color: var(--color-text-primary);
      
      i {
        font-size: 18px;
        color: var(--color-primary);
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

.warning-panel {
  .panel-content {
    height: 520px;
    box-sizing: border-box;
    overflow: hidden;
  }
}

.map-container {
  width: 100%;
  height: 100%;
  background: var(--color-bg-page);
}

.map-legend {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: var(--color-bg-card);
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
      border: 2px solid var(--color-bg-card);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);

      &--primary { background: var(--color-primary); }
      &--success { background: var(--color-success); }
      &--warning { background: var(--color-warning); }
      &--danger { background: var(--color-danger); }
      &--info { background: var(--color-info); }
      &--contract-paid { background: var(--color-primary); }
      &--contract-trial { background: var(--color-success); }
      &--contract-mixed { background: #8b5cf6; }
      &--contract-unset { background: var(--color-info); }
    }

    .legend-text {
      font-size: 13px;
      color: var(--color-text-regular);
      white-space: nowrap;
    }
  }
}

.alarm-list {
  height: 100%;
  overflow-y: auto;
  padding-right: 2px;

  .alarm-item {
    display: flex;
    align-items: flex-start;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 10px;
    background: var(--color-bg-light);
    gap: 12px;
    transition: all 0.3s ease;

    &:hover {
      background: var(--color-bg-hover);
      transform: translateX(4px);
    }

    .alarm-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 8px;
    }

    .alarm-info {
      flex: 1;
      min-width: 0;

      .alarm-main {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 4px;
      }

      .alarm-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--color-text-primary);
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .alarm-dept {
        font-size: 12px;
        color: var(--color-text-regular);
        margin-bottom: 3px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        &::before {
          content: '单位：';
          color: var(--color-text-secondary);
        }
      }

      .alarm-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        font-size: 12px;
        color: var(--color-text-secondary);
        min-width: 0;

        .alarm-location {
          display: flex;
          align-items: center;
          gap: 4px;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          &::before {
            content: '📍';
            flex-shrink: 0;
          }
        }

        .alarm-time {
          flex-shrink: 0;
        }
      }
    }

    .alarm-status {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      flex-shrink: 0;
      line-height: 1;
      white-space: nowrap;

      &.status-pending {
        background: var(--color-danger-bg);
        color: var(--color-danger);
      }

      &.status-processing {
        background: var(--color-warning-bg);
        color: var(--color-warning);
      }
    }

    &.alarm-level-3 .alarm-indicator {
      background: var(--color-danger);
      box-shadow: 0 0 0 4px var(--color-danger-bg);
    }

    &.alarm-level-2 .alarm-indicator {
      background: var(--color-warning);
      box-shadow: 0 0 0 4px var(--color-warning-bg);
    }

    &.alarm-level-1 .alarm-indicator {
      background: var(--color-primary);
      box-shadow: 0 0 0 4px var(--color-primary-bg);
    }
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-secondary);

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

  .warning-panel .panel-content {
    height: auto;
    overflow: visible;
  }

  .alarm-list {
    height: auto;
    overflow: visible;
    padding-right: 0;
  }
  
  .map-legend {
    bottom: 10px;
    left: 10px;
    padding: 8px 12px;
  }
}
</style>
