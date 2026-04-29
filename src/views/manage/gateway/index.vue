<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="92px">
      <el-form-item label="网关IMEI" prop="imei">
        <el-input
          v-model="queryParams.imei"
          placeholder="请输入网关IMEI"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="外部TBox ID" prop="externalTboxId">
        <el-input
          v-model="queryParams.externalTboxId"
          placeholder="请输入外部TBox ID"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="SIM卡号" prop="sim">
        <el-input
          v-model="queryParams.sim"
          placeholder="请输入SIM卡号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="消防点" prop="firePointName">
        <el-input
          v-model="queryParams.firePointName"
          placeholder="请输入消防点名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="外部单位" prop="externalCompanyName">
        <el-input
          v-model="queryParams.externalCompanyName"
          placeholder="请输入外部单位"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="归属单位" prop="deptId">
        <el-tree-select
          v-model="queryParams.deptId"
          :data="deptOptions"
          :props="{ value: 'id', label: 'label', children: 'children' }"
          value-key="id"
          placeholder="请选择归属单位"
          clearable
          check-strictly
        />
      </el-form-item>
      <el-form-item label="归属地区" prop="deptRegion">
        <el-cascader
          v-model="queryParams.deptRegion"
          :options="regionData"
          :props="{ checkStrictly: true }"
          placeholder="请选择归属地区"
          clearable
          style="width: 220px"
          @change="handleDeptRegionChange"
        />
      </el-form-item>
      <el-form-item label="同步状态" prop="syncStatus">
        <el-select v-model="queryParams.syncStatus" placeholder="请选择同步状态" clearable>
          <el-option label="已同步" value="synced" />
          <el-option label="同步异常" value="failed" />
        </el-select>
      </el-form-item>
      <el-form-item label="在线状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择在线状态" clearable>
          <el-option label="在线" value="online" />
          <el-option label="离线" value="offline" />
          <el-option label="异常" value="abnormal" />
        </el-select>
      </el-form-item>
      <el-form-item>
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
      <el-table-column label="网关ID" align="center" prop="gatewayId" width="90" />
      <el-table-column label="外部TBox ID" align="center" prop="externalTboxId" width="120" />
      <el-table-column label="网关IMEI" align="center" prop="imei" min-width="160" />
      <el-table-column label="SIM卡号" align="center" prop="sim" min-width="140">
        <template #default="scope">
          <span>{{ scope.row.sim || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="外部单位" align="center" prop="externalCompanyName" min-width="180" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ scope.row.externalCompanyName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="归属单位" align="center" prop="deptName" min-width="180" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ scope.row.deptName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="归属地区" align="center" min-width="180" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ formatDeptRegion(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="来源单位" align="center" prop="sourceDeptName" min-width="180" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ scope.row.sourceDeptName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="消防点" align="center" prop="firePointName" min-width="160" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ scope.row.firePointName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="经纬度" align="center" min-width="180">
        <template #default="scope">
          <span v-if="scope.row.gpsLongitude && scope.row.gpsLatitude">
            {{ scope.row.gpsLongitude }}, {{ scope.row.gpsLatitude }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="在线状态" align="center" prop="status" width="100">
        <template #default="scope">
          <el-tag :type="statusTagType(scope.row.status)">{{ formatGatewayStatus(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="同步状态" align="center" prop="syncStatus" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.syncStatus === 'synced' ? 'success' : 'warning'">
            {{ formatSyncStatus(scope.row.syncStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="最后在线时间" align="center" prop="lastOnlineTime" width="170">
        <template #default="scope">
          <span>{{ parseTime(scope.row.lastOnlineTime) || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="最后同步时间" align="center" prop="lastSyncTime" width="170">
        <template #default="scope">
          <span>{{ parseTime(scope.row.lastSyncTime) || '-' }}</span>
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
      <el-descriptions :column="2" border>
        <el-descriptions-item label="网关ID">{{ form.gatewayId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="外部TBox ID">{{ form.externalTboxId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="网关IMEI">{{ form.imei || '-' }}</el-descriptions-item>
        <el-descriptions-item label="SIM卡号">{{ form.sim || '-' }}</el-descriptions-item>
        <el-descriptions-item label="外部单位">{{ form.externalCompanyName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="归属单位">{{ form.deptName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="归属地区">{{ formatDeptRegion(form) }}</el-descriptions-item>
        <el-descriptions-item label="来源单位">{{ form.sourceDeptName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="消防点">{{ form.firePointName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="经度">{{ form.gpsLongitude || '-' }}</el-descriptions-item>
        <el-descriptions-item label="纬度">{{ form.gpsLatitude || '-' }}</el-descriptions-item>
        <el-descriptions-item label="在线状态">{{ formatGatewayStatus(form.status) }}</el-descriptions-item>
        <el-descriptions-item label="同步状态">{{ formatSyncStatus(form.syncStatus) }}</el-descriptions-item>
        <el-descriptions-item label="最后在线时间">{{ parseTime(form.lastOnlineTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="最后同步时间">{{ parseTime(form.lastSyncTime) || '-' }}</el-descriptions-item>
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
import { deptTreeSelect } from "@/api/system/user"
import { regionData } from "@/utils/regionData"

const { proxy } = getCurrentInstance()

const gatewayList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const open = ref(false)
const deptOptions = ref([])

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

function getDeptTree() {
  deptTreeSelect().then(response => {
    deptOptions.value = response.data
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
  return params
}

function handleDeptRegionChange(value) {
  const region = value || []
  queryParams.value.deptProvince = region[0] || null
  queryParams.value.deptCity = region[1] || null
  queryParams.value.deptArea = region[2] || null
}

function clearDeptRegionQuery() {
  queryParams.value.deptRegion = []
  queryParams.value.deptProvince = null
  queryParams.value.deptCity = null
  queryParams.value.deptArea = null
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
  clearDeptRegionQuery()
  handleQuery()
}

function handleDetail(row) {
  getGateway(row.gatewayId).then(response => {
    form.value = response.data || {}
    open.value = true
  })
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

getDeptTree()
getList()
</script>
