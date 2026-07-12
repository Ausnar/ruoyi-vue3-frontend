<template>
  <div class="app-container">
    <el-form class="sensor-query-form" :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="96px">
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
      <!-- 关联sys_dept -->
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
      <el-form-item class="query-code" label="传感器编号" prop="sensorCode">
        <el-input
          class="query-control"
          v-model="queryParams.sensorCode"
          placeholder="请输入传感器编号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item class="query-gateway" label="网关编号" prop="gatewayCode">
        <el-input
          class="query-control"
          v-model="queryParams.gatewayCode"
          placeholder="请输入网关编号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <!-- 0正常 1异常 2离线 -->
      <el-form-item class="query-status" label="状态" prop="status">
        <el-select class="query-control" v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option
            v-for="dict in sys_job_status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item class="query-actions">
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['manage:sensor:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['manage:sensor:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['manage:sensor:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['manage:sensor:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="sensorList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="传感器编号" align="center" prop="sensorCode" />
      <el-table-column label="归属地区" align="center" min-width="180" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ formatDeptRegion(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="所属单位" align="center" prop="deptName" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ scope.row.deptName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="网关编号" align="center" prop="gatewayCode" />
      <el-table-column label="压力值(MPa)" align="center" prop="pressure" />
      <el-table-column label="温度值(℃)" align="center" prop="temperature" />
      <el-table-column label="电量(%)" align="center" prop="batteryLevel" />
      <el-table-column label="最后在线时间" align="center" prop="lastOnlineTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.lastOnlineTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <!-- 0正常 1异常 2离线 -->
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :options="sys_job_status" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="80" class-name="small-padding fixed-width">
        <template #default="scope">
          <div class="table-actions">
            <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['manage:sensor:query']">详情</el-button>
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['manage:sensor:edit']">修改</el-button>
            <el-button link type="success" icon="TrendCharts" @click="handleHistory(scope.row)" v-hasPermi="['manage:sensor:query']">历史</el-button>
            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['manage:sensor:remove']">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <el-dialog title="传感器详情" v-model="detailOpen" width="760px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="传感器编号">{{ detailForm.sensorCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <dict-tag :options="sys_job_status" :value="detailForm.status" />
        </el-descriptions-item>
        <el-descriptions-item label="归属地区">{{ formatDeptRegion(detailForm) }}</el-descriptions-item>
        <el-descriptions-item label="所属单位">{{ detailForm.deptName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="外部单位">{{ detailForm.externalCompanyName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="来源单位">{{ detailForm.sourceDeptName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="网关编号">{{ detailForm.gatewayCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="MAC">{{ detailForm.mac || '-' }}</el-descriptions-item>
        <el-descriptions-item label="压力值(MPa)">{{ formatNullable(detailForm.pressure) }}</el-descriptions-item>
        <el-descriptions-item label="温度值(℃)">{{ formatNullable(detailForm.temperature) }}</el-descriptions-item>
        <el-descriptions-item label="电量(%)">{{ formatNullable(detailForm.batteryLevel) }}</el-descriptions-item>
        <el-descriptions-item label="信号强度">{{ formatNullable(detailForm.signalStrength) }}</el-descriptions-item>
        <el-descriptions-item label="最后在线时间">{{ parseTime(detailForm.lastOnlineTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="最后同步时间">{{ parseTime(detailForm.lastSyncTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="同步状态">
          <el-tag :type="syncStatusTagType(detailForm.syncStatus)">{{ formatSyncStatus(detailForm.syncStatus) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注">{{ detailForm.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailOpen = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加或修改传感器信息对话框 -->
    <el-dialog :title="title" v-model="open" width="780px" append-to-body>
      <el-form class="sensor-edit-form" ref="sensorRef" :model="form" :rules="rules" label-width="112px">
        <div class="form-section-title">基础信息</div>
        <div class="sensor-form-grid">
          <el-form-item label="传感器编号" prop="sensorCode">
            <el-input v-model="form.sensorCode" placeholder="请输入传感器编号" />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="form.status" placeholder="请选择状态" clearable>
              <el-option
                v-for="dict in sys_job_status"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="网关编号" prop="gatewayCode">
            <el-input v-model="form.gatewayCode" placeholder="请输入网关编号" />
          </el-form-item>
          <el-form-item label="MAC" prop="mac">
            <el-input v-model="form.mac" placeholder="请输入MAC" />
          </el-form-item>
        </div>

        <div class="form-section-title">归属关系</div>
        <div class="sensor-form-grid">
          <el-form-item class="form-span-2" label="所属单位" prop="deptId">
            <el-tree-select
              v-model="form.deptId"
              :data="deptOptions"
              :props="{ value: 'id', label: 'label', children: 'children' }"
              value-key="id"
              placeholder="请选择所属单位"
              clearable
              check-strictly
            />
          </el-form-item>
        </div>

        <div class="form-section-title">运行数据</div>
        <div class="sensor-form-grid">
          <el-form-item label="压力值(MPa)" prop="pressure">
            <el-input-number v-model="form.pressure" :precision="2" controls-position="right" placeholder="请输入压力值" />
          </el-form-item>
          <el-form-item label="温度值(℃)" prop="temperature">
            <el-input-number v-model="form.temperature" :precision="1" controls-position="right" placeholder="请输入温度值" />
          </el-form-item>
          <el-form-item label="电量(%)" prop="batteryLevel">
            <el-input-number v-model="form.batteryLevel" :min="0" :max="100" :precision="0" controls-position="right" placeholder="请输入电量" />
          </el-form-item>
          <el-form-item label="信号强度" prop="signalStrength">
            <el-input-number v-model="form.signalStrength" :precision="0" controls-position="right" placeholder="请输入信号强度" />
          </el-form-item>
          <el-form-item class="form-span-2" label="最后在线时间" prop="lastOnlineTime">
            <el-date-picker
              v-model="form.lastOnlineTime"
              clearable
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择最后在线时间"
            />
          </el-form-item>
        </div>

        <div class="form-section-title">同步维护</div>
        <div class="sensor-form-grid">
          <el-form-item class="form-span-2" label="备注" prop="remark">
            <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Sensor">
import { listSensor, getSensor, delSensor, addSensor, updateSensor } from "@/api/manage/sensor"
import { deviceDeptTreeSelect } from "@/api/manage/deviceDept"
import router from "@/router"
import { regionData } from "@/utils/regionData"

const { proxy } = getCurrentInstance()
const { sys_job_status } = proxy.useDict('sys_job_status')

const sensorList = ref([])
const open = ref(false)
const detailOpen = ref(false)
const detailForm = ref({})
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")
const deptOptions = ref([])
const lastOnlineTimeRange = ref([])

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    sensorCode: null,
    deptId: null,
    deptRegion: [],
    deptProvince: null,
    deptCity: null,
    deptArea: null,
    gatewayCode: null,
    status: null,
  },
  rules: {
    sensorCode: [
      { required: true, message: "传感器编号不能为空", trigger: "blur" }
    ],
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询部门下拉树结构 */
function getDeptTree(validateDept = false) {
  deviceDeptTreeSelect(buildDeptTreeParams()).then(response => {
    deptOptions.value = response.data || []
    if (validateDept && queryParams.value.deptId && !containsDept(deptOptions.value, queryParams.value.deptId)) {
      queryParams.value.deptId = null
    }
  })
}

/** 查询传感器信息列表 */
function getList() {
  loading.value = true
  listSensor(buildQueryParams()).then(response => {
    sensorList.value = response.rows
    total.value = response.total
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

function formatNullable(value) {
  return value === null || value === undefined || value === '' ? '-' : value
}

function formatSyncStatus(status) {
  const statusMap = {
    synced: '已同步',
    failed: '同步异常',
    unbound: '未绑定',
    manual: '手工维护'
  }
  return statusMap[status] || status || '未设置'
}

function syncStatusTagType(status) {
  const typeMap = {
    synced: 'success',
    failed: 'danger',
    unbound: 'warning',
    manual: 'info'
  }
  return typeMap[status] || 'info'
}

// 取消按钮
function cancel() {
  open.value = false
  reset()
}

// 表单重置
function reset() {
  form.value = {
    sensorId: null,
    sensorCode: null,
    deptId: null,
    gatewayCode: null,
    mac: null,
    pressure: null,
    temperature: null,
    batteryLevel: null,
    signalStrength: null,
    lastOnlineTime: null,
    status: '0',
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    delFlag: null
  }
  proxy.resetForm("sensorRef")
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef")
  lastOnlineTimeRange.value = []
  clearDeptRegionQuery()
  handleQuery()
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.sensorId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加传感器信息"
}

function handleDetail(row) {
  detailForm.value = row || {}
  detailOpen.value = true

  getSensor(row.sensorId).then(response => {
    detailForm.value = response.data || row || {}
  }).catch(() => {})
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const _sensorId = row.sensorId || ids.value
  getSensor(_sensorId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改传感器信息"
  })
}

/** 历史数据按钮操作 */
function handleHistory(row) {
  router.push({
    path: '/fire/sensor/history',
    query: { sensorId: row.sensorId, sensorCode: row.sensorCode }
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["sensorRef"].validate(valid => {
    if (valid) {
      if (form.value.sensorId != null) {
        updateSensor(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addSensor(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _sensorIds = row.sensorId || ids.value
  proxy.$modal.confirm('是否确认删除传感器信息编号为"' + _sensorIds + '"的数据项？').then(function() {
    return delSensor(_sensorIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('manage/sensor/export', {
    ...buildQueryParams()
  }, `sensor_${new Date().getTime()}.xlsx`)
}

getList()
getDeptTree()
</script>

<style scoped>
.sensor-query-form {
  display: grid;
  grid-template-columns: repeat(4, max-content);
  align-items: start;
  column-gap: 24px;
  row-gap: 12px;
  margin-bottom: 18px;
}

.sensor-query-form :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 0;
}

.sensor-query-form :deep(.el-form-item__label) {
  white-space: nowrap;
  font-weight: 600;
}

.query-date {
  grid-column: auto;
  grid-row: auto;
}

.query-region {
  grid-column: auto;
  grid-row: auto;
}

.query-dept {
  grid-column: auto;
  grid-row: auto;
}

.query-status {
  grid-column: auto;
  grid-row: auto;
}

.query-actions {
  grid-column: 1 / -1;
  grid-row: auto;
  white-space: nowrap;
}

.query-code {
  grid-column: auto;
  grid-row: auto;
}

.query-gateway {
  grid-column: auto;
  grid-row: auto;
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

.table-actions {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.table-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.sensor-edit-form {
  padding-right: 4px;
}

.form-section-title {
  margin: 4px 0 14px;
  padding-left: 8px;
  border-left: 3px solid var(--el-color-primary);
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
}

.form-section-title:not(:first-child) {
  margin-top: 20px;
}

.sensor-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 18px;
}

.sensor-form-grid :deep(.el-form-item) {
  margin-bottom: 16px;
}

.sensor-form-grid :deep(.el-select),
.sensor-form-grid :deep(.el-date-editor),
.sensor-form-grid :deep(.el-input-number),
.sensor-form-grid :deep(.el-tree-select) {
  width: 100%;
}

.form-span-2 {
  grid-column: 1 / -1;
}

@media (max-width: 1500px) {
  .sensor-query-form {
    grid-template-columns: repeat(2, max-content);
  }
}

@media (max-width: 768px) {
  .sensor-form-grid {
    grid-template-columns: 1fr;
  }

  .form-span-2 {
    grid-column: auto;
  }
}
</style>
