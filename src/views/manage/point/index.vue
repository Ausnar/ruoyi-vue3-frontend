<template>
  <div class="app-container">
    <el-form class="point-query-form" :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="96px">
      <el-form-item class="query-date" label="最后同步时间">
        <el-date-picker
          class="query-date-picker"
          v-model="lastSyncTimeRange"
          clearable
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
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
      <el-form-item class="query-status" label="状态" prop="status">
        <el-select class="query-control" v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option
            v-for="item in pointStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item class="query-name" label="消防点名称" prop="firePointName">
        <el-input
          class="query-control"
          v-model="queryParams.firePointName"
          placeholder="请输入消防点名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item class="query-code" label="消防点编号" prop="firePointCode">
        <el-input
          class="query-control"
          v-model="queryParams.firePointCode"
          placeholder="请输入消防点编号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item class="query-expected-count" label="应配灭火器" prop="expectedExtinguisherCount">
        <el-input-number
          class="query-control"
          v-model="queryParams.expectedExtinguisherCount"
          :min="0"
          :precision="0"
          controls-position="right"
          placeholder="请输入应配数量"
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
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['manage:point:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['manage:point:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['manage:point:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['manage:point:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="pointList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="消防点名称" align="center" prop="firePointName" min-width="160" :show-overflow-tooltip="true" />
      <el-table-column label="消防点编号" align="center" prop="firePointCode" min-width="140" :show-overflow-tooltip="true" />
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
      <el-table-column label="位置" align="center" min-width="180" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ formatPointLocation(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="应配灭火器" align="center" prop="expectedExtinguisherCount" width="110">
        <template #default="scope">
          <span>{{ scope.row.expectedExtinguisherCount ?? '未设置' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="最后同步时间" align="center" prop="lastSyncTime" width="170">
        <template #default="scope">
          <span>{{ parseTime(scope.row.lastSyncTime) || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <el-tag :type="pointStatusTagType(scope.row.status)">
            {{ formatPointStatus(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="80" class-name="small-padding fixed-width">
        <template #default="scope">
          <div class="table-actions">
            <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['manage:point:query']">详情</el-button>
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['manage:point:edit']">修改</el-button>
            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['manage:point:remove']">删除</el-button>
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

    <el-dialog title="消防点详情" v-model="detailOpen" width="760px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="消防点名称">{{ detailForm.firePointName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="消防点编号">{{ detailForm.firePointCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="pointStatusTagType(detailForm.status)">
            {{ formatPointStatus(detailForm.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="应配灭火器">{{ detailForm.expectedExtinguisherCount ?? '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="归属地区">{{ formatDeptRegion(detailForm) }}</el-descriptions-item>
        <el-descriptions-item label="所属单位">{{ detailForm.deptName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="外部单位">{{ detailForm.externalCompanyName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="来源单位">{{ detailForm.sourceDeptName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="站点编号">{{ detailForm.stationNumber || '-' }}</el-descriptions-item>
        <el-descriptions-item label="站点类型">{{ detailForm.stationType || '-' }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ detailForm.pointType || '-' }}</el-descriptions-item>
        <el-descriptions-item label="位置">{{ formatPointLocation(detailForm) }}</el-descriptions-item>
        <el-descriptions-item label="经度">{{ detailForm.longitude ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="纬度">{{ detailForm.latitude ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ detailForm.contactPerson || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ detailForm.contactPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="同步状态">
          <el-tag :type="syncStatusTagType(detailForm.syncStatus)">{{ formatSyncStatus(detailForm.syncStatus) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最后同步时间">{{ parseTime(detailForm.lastSyncTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="二维码" :span="2">{{ detailForm.qrCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailForm.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailOpen = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加或修改消防点信息对话框 -->
    <el-dialog :title="title" v-model="open" width="780px" append-to-body>
      <el-form class="point-edit-form" ref="pointRef" :model="form" :rules="rules" label-width="118px">
        <div class="form-section-title">基础信息</div>
        <div class="point-form-grid">
          <el-form-item label="消防点名称" prop="firePointName">
            <el-input v-model="form.firePointName" placeholder="请输入消防点名称" />
          </el-form-item>
          <el-form-item label="消防点编号" prop="firePointCode">
            <el-input v-model="form.firePointCode" placeholder="请输入消防点编号" />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="form.status" placeholder="请选择状态" clearable>
              <el-option
                v-for="item in pointStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="应配灭火器" prop="expectedExtinguisherCount">
            <el-input-number
              v-model="form.expectedExtinguisherCount"
              :min="0"
              :precision="0"
              controls-position="right"
              placeholder="请输入应配数量"
            />
          </el-form-item>
          <el-form-item label="类型" prop="pointType">
            <el-input v-model="form.pointType" placeholder="请输入类型" />
          </el-form-item>
        </div>

        <div class="form-section-title">归属关系</div>
        <div class="point-form-grid">
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

        <div class="form-section-title">位置与联系</div>
        <div class="point-form-grid">
          <el-form-item label="建筑物" prop="building">
            <el-input v-model="form.building" placeholder="请输入建筑物" />
          </el-form-item>
          <el-form-item label="楼层" prop="floor">
            <el-input v-model="form.floor" placeholder="请输入楼层" />
          </el-form-item>
          <el-form-item class="form-span-2" label="位置描述" prop="location">
            <el-input v-model="form.location" placeholder="请输入位置描述" />
          </el-form-item>
          <el-form-item label="经度" prop="longitude">
            <el-input v-model="form.longitude" placeholder="请输入经度" />
          </el-form-item>
          <el-form-item label="纬度" prop="latitude">
            <el-input v-model="form.latitude" placeholder="请输入纬度" />
          </el-form-item>
          <el-form-item label="负责人" prop="contactPerson">
            <el-input v-model="form.contactPerson" placeholder="请输入负责人" />
          </el-form-item>
          <el-form-item label="联系电话" prop="contactPhone">
            <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
          </el-form-item>
        </div>

        <div class="form-section-title">同步维护</div>
        <div class="point-form-grid">
          <el-form-item class="form-span-2" label="二维码" prop="qrCode">
            <el-input v-model="form.qrCode" type="textarea" :rows="2" placeholder="请输入二维码" />
          </el-form-item>
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

<script setup name="Point">
import { listPoint, getPoint, delPoint, addPoint, updatePoint } from "@/api/manage/point"
import { deptTreeSelect } from "@/api/system/user"
import { regionData } from "@/utils/regionData"

const { proxy } = getCurrentInstance()

const pointList = ref([])
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
const lastSyncTimeRange = ref([])
const pointStatusOptions = [
  { value: '0', label: '正常', type: 'success' },
  { value: '1', label: '停用', type: 'info' }
]

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    firePointCode: null,
    firePointName: null,
    deptId: null,
    deptRegion: [],
    deptProvince: null,
    deptCity: null,
    deptArea: null,
    expectedExtinguisherCount: null,
    status: null,
  },
  rules: {
    firePointCode: [
      { required: true, message: "消防点编号不能为空", trigger: "blur" }
    ],
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询部门下拉树结构 */
function getDeptTree(validateDept = false) {
  deptTreeSelect(buildDeptTreeParams()).then(response => {
    deptOptions.value = response.data || []
    if (validateDept && queryParams.value.deptId && !containsDept(deptOptions.value, queryParams.value.deptId)) {
      queryParams.value.deptId = null
    }
  })
}

/** 查询消防点信息列表 */
function getList() {
  loading.value = true
  listPoint(buildQueryParams()).then(response => {
    pointList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function buildQueryParams() {
  const { deptRegion, ...params } = queryParams.value
  return proxy.addDateRange(params, lastSyncTimeRange.value, 'LastSyncTime')
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

function formatPointLocation(row) {
  return [row.building, row.floor, row.location].filter(Boolean).join(' / ') || '-'
}

// 取消按钮
function cancel() {
  open.value = false
  reset()
}

// 表单重置
function reset() {
  form.value = {
    firePointId: null,
    firePointCode: null,
    firePointName: null,
    deptId: null,
    pointType: null,
    location: null,
    floor: null,
    building: null,
    longitude: null,
    latitude: null,
    contactPerson: null,
    contactPhone: null,
    expectedExtinguisherCount: null,
    qrCode: null,
    sortOrder: null,
    status: '0',
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    delFlag: null
  }
  proxy.resetForm("pointRef")
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef")
  lastSyncTimeRange.value = []
  clearDeptRegionQuery()
  handleQuery()
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.firePointId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加消防点信息"
}

function handleDetail(row) {
  getPoint(row.firePointId).then(response => {
    detailForm.value = response.data || {}
    detailOpen.value = true
  })
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const _firePointId = row.firePointId || ids.value
  getPoint(_firePointId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改消防点信息"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["pointRef"].validate(valid => {
    if (valid) {
      if (form.value.firePointId != null) {
        updatePoint(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addPoint(form.value).then(response => {
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
  const _firePointIds = row.firePointId || ids.value
  proxy.$modal.confirm('是否确认删除消防点信息编号为"' + _firePointIds + '"的数据项？').then(function() {
    return delPoint(_firePointIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('manage/point/export', {
    ...buildQueryParams()
  }, `point_${new Date().getTime()}.xlsx`)
}

function formatPointStatus(status) {
  return pointStatusOptions.find(item => item.value === String(status))?.label || status || '未设置'
}

function pointStatusTagType(status) {
  return pointStatusOptions.find(item => item.value === String(status))?.type || 'info'
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

getList()
getDeptTree()
</script>

<style scoped>
.point-query-form {
  display: grid;
  grid-template-columns: repeat(4, max-content);
  align-items: start;
  column-gap: 24px;
  row-gap: 12px;
  margin-bottom: 18px;
}

.point-query-form :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 0;
}

.point-query-form :deep(.el-form-item__label) {
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

.table-actions {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.table-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.point-edit-form {
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

.point-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 18px;
}

.point-form-grid :deep(.el-form-item) {
  margin-bottom: 16px;
}

.point-form-grid :deep(.el-select),
.point-form-grid :deep(.el-input-number),
.point-form-grid :deep(.el-tree-select) {
  width: 100%;
}

.form-span-2 {
  grid-column: 1 / -1;
}

@media (max-width: 1500px) {
  .point-query-form {
    grid-template-columns: repeat(2, max-content);
  }
}

@media (max-width: 768px) {
  .point-form-grid {
    grid-template-columns: 1fr;
  }

  .form-span-2 {
    grid-column: auto;
  }
}
</style>
