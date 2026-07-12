<template>
  <div class="app-container">
    <el-form class="gateway-query-form" :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="96px">
      <el-form-item class="query-date" label="最后在线时间">
        <el-date-picker clearable
          class="query-date-picker"
          v-model="lastOnlineTimeRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期">
        </el-date-picker>
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
      <el-form-item class="query-status" label="在线状态" prop="status">
        <el-select class="query-control" v-model="queryParams.status" placeholder="请选择在线状态" clearable>
          <el-option label="在线" value="online" />
          <el-option label="离线" value="offline" />
          <el-option label="异常" value="abnormal" />
        </el-select>
      </el-form-item>
      <el-form-item class="query-tbox" label="TBoxID" prop="externalTboxId">
        <el-input
          class="query-control"
          v-model="queryParams.externalTboxId"
          placeholder="请输入TBoxID"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item class="query-imei" label="网关IMEI" prop="imei">
        <el-input
          class="query-control"
          v-model="queryParams.imei"
          placeholder="请输入网关IMEI"
          clearable
          @keyup.enter="handleQuery"
        />
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
      <el-form-item class="query-actions">
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['manage:gateway:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="gatewayList">
      <el-table-column label="TBoxID" align="center" prop="externalTboxId" min-width="120" />
      <el-table-column label="网关IMEI" align="center" prop="imei" min-width="160" />
      <el-table-column label="归属地区" align="center" min-width="180" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ formatDeptRegion(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="所属单位" align="center" prop="deptName" min-width="180" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ scope.row.deptName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="消防点" align="center" prop="firePointName" min-width="160" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ scope.row.firePointName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="在线状态" align="center" prop="status" width="100">
        <template #default="scope">
          <el-tag :type="statusTagType(scope.row.status)">{{ formatGatewayStatus(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="最后在线时间" align="center" prop="lastOnlineTime" width="170">
        <template #default="scope">
          <span>{{ parseTime(scope.row.lastOnlineTime) || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="100" fixed="right">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['manage:gateway:query']">详情</el-button>
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

    <el-dialog title="网关详情" v-model="open" width="760px" append-to-body>
      <div class="detail-section-title">基础身份</div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="网关ID">{{ form.gatewayId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="TBoxID">{{ form.externalTboxId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="网关IMEI">{{ form.imei || '-' }}</el-descriptions-item>
        <el-descriptions-item label="SIM卡号">{{ form.sim || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div class="detail-section-title">归属关系</div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="归属地区">{{ formatDeptRegion(form) }}</el-descriptions-item>
        <el-descriptions-item label="所属单位">{{ form.deptName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="来源单位">{{ form.sourceDeptName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="外部单位">{{ form.externalCompanyName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="消防点">{{ form.firePointName || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div class="detail-section-title">定位与状态</div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="经度">{{ form.gpsLongitude || '-' }}</el-descriptions-item>
        <el-descriptions-item label="纬度">{{ form.gpsLatitude || '-' }}</el-descriptions-item>
        <el-descriptions-item label="在线状态">
          <el-tag :type="statusTagType(form.status)">{{ formatGatewayStatus(form.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最后在线时间">{{ parseTime(form.lastOnlineTime) || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div class="detail-section-title">同步维护</div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="同步状态">
          <el-tag :type="syncStatusTagType(form.syncStatus)">{{ formatSyncStatus(form.syncStatus) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最后同步时间">{{ parseTime(form.lastSyncTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ parseTime(form.createTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ parseTime(form.updateTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ form.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="open = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Gateway">
import { listGateway, getGateway } from "@/api/manage/gateway"
import { deviceDeptTreeSelect } from "@/api/manage/deviceDept"
import { regionData } from "@/utils/regionData"

const { proxy } = getCurrentInstance()

const gatewayList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const open = ref(false)
const deptOptions = ref([])
const lastOnlineTimeRange = ref([])

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    externalTboxId: null,
    imei: null,
    sim: null,
    firePointName: null,
    externalCompanyName: null,
    deptId: null,
    deptRegion: [],
    deptProvince: null,
    deptCity: null,
    deptArea: null,
    syncStatus: null,
    status: null
  }
})

const { queryParams, form } = toRefs(data)

function getDeptTree(validateDept = false) {
  deviceDeptTreeSelect(buildDeptTreeParams()).then(response => {
    deptOptions.value = response.data || []
    if (validateDept && queryParams.value.deptId && !containsDept(deptOptions.value, queryParams.value.deptId)) {
      queryParams.value.deptId = null
    }
  })
}

function getList() {
  loading.value = true
  listGateway(buildQueryParams()).then(response => {
    gatewayList.value = response.rows
    total.value = response.total
  }).finally(() => {
    loading.value = false
  })
}

function buildQueryParams() {
  const { deptRegion, ...params } = queryParams.value
  return proxy.addDateRange(params, lastOnlineTimeRange.value, 'LastOnlineTime')
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
  getDeptTree(true)
}

function formatDeptRegion(row) {
  return [row.deptProvince, row.deptCity, row.deptArea].filter(Boolean).join(' / ') || '-'
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm("queryRef")
  lastOnlineTimeRange.value = []
  clearDeptRegionQuery()
  handleQuery()
}

function handleDetail(row) {
  form.value = row || {}
  open.value = true

  getGateway(row.gatewayId).then(response => {
    form.value = response.data || row || {}
  }).catch(() => {})
}

function handleExport() {
  proxy.download('manage/gateway/export', {
    ...buildQueryParams()
  }, `gateway_${new Date().getTime()}.xlsx`)
}

function formatGatewayStatus(status) {
  const statusMap = {
    online: '在线',
    offline: '离线',
    abnormal: '异常'
  }
  return statusMap[status] || status || '未设置'
}

function statusTagType(status) {
  const typeMap = {
    online: 'success',
    offline: 'info',
    abnormal: 'danger'
  }
  return typeMap[status] || 'info'
}

function formatSyncStatus(status) {
  const statusMap = {
    synced: '已同步',
    failed: '同步异常'
  }
  return statusMap[status] || status || '未设置'
}

function syncStatusTagType(status) {
  const typeMap = {
    synced: 'success',
    failed: 'danger'
  }
  return typeMap[status] || 'info'
}

getDeptTree()
getList()
</script>

<style scoped>
.gateway-query-form {
  display: grid;
  grid-template-columns: repeat(4, max-content);
  align-items: start;
  column-gap: 24px;
  row-gap: 12px;
  margin-bottom: 18px;
}

.gateway-query-form :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 0;
}

.gateway-query-form :deep(.el-form-item__label) {
  white-space: nowrap;
  font-weight: 600;
}

.query-actions {
  grid-column: 1 / -1;
  white-space: nowrap;
}

.query-date-picker {
  width: 320px;
}

.query-control {
  width: 220px;
}

.query-dept .query-control,
.query-region .query-control {
  width: 240px;
}

.detail-section-title {
  margin: 4px 0 14px;
  padding-left: 8px;
  border-left: 3px solid var(--el-color-primary);
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
}

.detail-section-title:not(:first-child) {
  margin-top: 20px;
}

@media (max-width: 1500px) {
  .gateway-query-form {
    grid-template-columns: repeat(2, max-content);
  }
}
</style>
