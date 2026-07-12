<template>
  <div class="app-container">
    <el-form class="extinguisher-query-form" :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="96px">
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
            v-for="item in extinguisherStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item class="query-label-code" label="标志明码" prop="labelCode">
        <el-input
          class="query-control"
          v-model="queryParams.labelCode"
          placeholder="请输入标志明码"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item class="query-sensor-code" label="传感器编号" prop="sensorCode">
        <el-input
          class="query-control"
          v-model="queryParams.sensorCode"
          placeholder="请输入传感器编号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item class="query-fire-point" label="消防点名称" prop="firePointName">
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
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['manage:extinguisher:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['manage:extinguisher:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['manage:extinguisher:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['manage:extinguisher:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="extinguisherList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="标志明码" align="center" prop="labelCode" min-width="140" :show-overflow-tooltip="true" />
      <el-table-column label="产品名称" align="center" prop="productName" min-width="120" :show-overflow-tooltip="true" />
      <el-table-column label="规格型号" align="center" prop="specification" min-width="120" :show-overflow-tooltip="true" />
      <el-table-column label="灭火器类型" align="center" prop="extinguisherType" min-width="120">
        <template #default="scope">
          <span>{{ formatExtinguisherType(scope.row.extinguisherType) }}</span>
        </template>
      </el-table-column>
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
      <el-table-column label="传感器编号" align="center" prop="sensorCode" min-width="140" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ scope.row.sensorCode || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="消防点名称" align="center" prop="firePointName" min-width="160" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ scope.row.firePointName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="最后同步时间" align="center" prop="lastSyncTime" width="170">
        <template #default="scope">
          <span>{{ parseTime(scope.row.lastSyncTime) || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="报废日期" align="center" prop="scrapDate" width="120">
        <template #default="scope">
          <span>{{ parseTime(scope.row.scrapDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <el-tag :type="extinguisherStatusTagType(scope.row.status)">
            {{ formatExtinguisherStatus(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="80" class-name="small-padding fixed-width">
        <template #default="scope">
          <div class="table-actions">
            <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['manage:extinguisher:query']">详情</el-button>
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['manage:extinguisher:edit']">修改</el-button>
            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['manage:extinguisher:remove']">删除</el-button>
          </div>
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

    <el-dialog title="灭火器详情" v-model="detailOpen" width="820px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="标志明码">{{ detailForm.labelCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="产品名称">{{ detailForm.productName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="规格型号">{{ detailForm.specification || '-' }}</el-descriptions-item>
        <el-descriptions-item label="灭火器类型">{{ formatExtinguisherType(detailForm.extinguisherType) }}</el-descriptions-item>
        <el-descriptions-item label="灭火器形式">{{ formatExtinguisherForm(detailForm.extinguisherForm) }}</el-descriptions-item>
        <el-descriptions-item label="执行标准">{{ detailForm.standardCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="使用温度范围">{{ formatTemperatureRange(detailForm.temperatureRange) }}</el-descriptions-item>
        <el-descriptions-item label="资料来源">{{ formatProfileSource(detailForm.profileSource) }}</el-descriptions-item>
        <el-descriptions-item label="资料同步状态">
          <el-tag :type="profileSyncStatusTagType(detailForm.profileSyncStatus)">
            {{ formatProfileSyncStatus(detailForm.profileSyncStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="资料同步时间">{{ parseTime(detailForm.profileSyncTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="资料同步说明">{{ detailForm.profileSyncMessage || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="extinguisherStatusTagType(detailForm.status)">
            {{ formatExtinguisherStatus(detailForm.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="归属地区">{{ formatDeptRegion(detailForm) }}</el-descriptions-item>
        <el-descriptions-item label="所属单位">{{ detailForm.deptName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="外部单位">{{ detailForm.externalCompanyName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="传感器编号">{{ detailForm.sensorCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="消防点名称">{{ detailForm.firePointName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="安装位置">{{ detailForm.installLocation || '-' }}</el-descriptions-item>
        <el-descriptions-item label="生产厂家">{{ detailForm.manufacturer || '-' }}</el-descriptions-item>
        <el-descriptions-item label="服务商">{{ detailForm.serviceProvider || '-' }}</el-descriptions-item>
        <el-descriptions-item label="生产日期">{{ parseTime(detailForm.productionDate, '{y}-{m}-{d}') || '-' }}</el-descriptions-item>
        <el-descriptions-item label="检验日期">{{ parseTime(detailForm.inspectionDate, '{y}-{m}-{d}') || '-' }}</el-descriptions-item>
        <el-descriptions-item label="到期时间">{{ parseTime(detailForm.expiryDate, '{y}-{m}-{d}') || '-' }}</el-descriptions-item>
        <el-descriptions-item label="报废日期">{{ parseTime(detailForm.scrapDate, '{y}-{m}-{d}') || '-' }}</el-descriptions-item>
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

    <el-dialog :title="title" v-model="open" width="780px" append-to-body>
      <el-form class="extinguisher-edit-form" ref="extinguisherRef" :model="form" :rules="rules" label-width="110px">
        <div class="form-section-title">基础信息</div>
        <div class="extinguisher-form-grid">
          <el-form-item label="标志明码" prop="labelCode">
            <el-input v-model="form.labelCode" placeholder="请输入标志明码" />
          </el-form-item>
          <el-form-item label="规格型号" prop="specification">
            <el-input v-model="form.specification" placeholder="请输入规格型号" />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="form.status" placeholder="请选择状态" clearable>
              <el-option
                v-for="item in extinguisherStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="产品名称" prop="productName">
            <el-input v-model="form.productName" placeholder="请输入产品名称" />
          </el-form-item>
        </div>

        <div class="form-section-title">归属关系</div>
        <div class="extinguisher-form-grid">
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
          <el-form-item label="传感器编号" prop="sensorCode">
            <el-input v-model="form.sensorCode" placeholder="请输入传感器编号" />
          </el-form-item>
          <el-form-item label="消防点名称">
            <el-input v-model="form.firePointName" placeholder="暂无消防点映射" disabled />
          </el-form-item>
        </div>

        <div class="form-section-title form-section-with-action">
          <span>生产与维护</span>
          <el-button
            type="primary"
            plain
            size="small"
            icon="Refresh"
            :loading="profileRefreshing"
            :disabled="!form.extinguisherId || !form.labelCode"
            @click="handleRefreshProfile"
            v-hasPermi="['manage:extinguisher:edit']"
          >同步标志明码资料</el-button>
        </div>
        <div class="extinguisher-form-grid">
          <el-form-item label="资料来源">
            <el-input :model-value="formatProfileSource(form.profileSource)" disabled />
          </el-form-item>
          <el-form-item label="资料同步状态">
            <el-input :model-value="formatProfileSyncStatus(form.profileSyncStatus)" disabled />
          </el-form-item>
          <el-form-item label="资料同步时间">
            <el-input :model-value="parseTime(form.profileSyncTime) || '-'" disabled />
          </el-form-item>
          <el-form-item label="资料同步说明">
            <el-input :model-value="form.profileSyncMessage || '-'" disabled />
          </el-form-item>
          <el-form-item label="生产厂家" prop="manufacturer">
            <el-input v-model="form.manufacturer" placeholder="请输入生产厂家" />
          </el-form-item>
          <el-form-item label="服务商" prop="serviceProvider">
            <el-input v-model="form.serviceProvider" placeholder="请输入服务商" />
          </el-form-item>
          <el-form-item label="生产日期" prop="productionDate">
            <el-date-picker
              v-model="form.productionDate"
              clearable
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择生产日期"
            />
          </el-form-item>
          <el-form-item label="灭火器类型" prop="extinguisherType">
            <el-select v-model="form.extinguisherType" placeholder="请选择灭火器类型" clearable>
              <el-option
                v-for="item in extinguisherTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="灭火器形式" prop="extinguisherForm">
            <el-select v-model="form.extinguisherForm" placeholder="请选择灭火器形式" clearable>
              <el-option
                v-for="item in extinguisherFormOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="执行标准" prop="standardCode">
            <el-input v-model="form.standardCode" placeholder="由生产日期和灭火器形式自动推导" disabled />
          </el-form-item>
          <el-form-item label="使用温度范围" prop="temperatureRange">
            <el-select
              v-model="form.temperatureRange"
              placeholder="请选择使用温度范围"
              :disabled="!temperatureRangeOptions.length"
              clearable
            >
              <el-option
                v-for="item in temperatureRangeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="检验日期" prop="inspectionDate">
            <el-date-picker
              v-model="form.inspectionDate"
              clearable
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择检验日期"
            />
          </el-form-item>
          <el-form-item label="到期时间" prop="expiryDate">
            <el-date-picker
              v-model="form.expiryDate"
              clearable
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="由生产日期和灭火器类型自动推导"
              disabled
            />
          </el-form-item>
          <el-form-item label="报废日期" prop="scrapDate">
            <el-date-picker
              v-model="form.scrapDate"
              clearable
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择报废日期"
            />
          </el-form-item>
        </div>

        <div class="form-section-title">安装与备注</div>
        <div class="extinguisher-form-grid">
          <el-form-item class="form-span-2" label="安装位置" prop="installLocation">
            <el-input v-model="form.installLocation" placeholder="请输入安装位置" />
          </el-form-item>
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
          <el-button type="primary" @click="submitForm">确定</el-button>
          <el-button @click="cancel">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<script setup name="Extinguisher">
import { listExtinguisher, getExtinguisher, delExtinguisher, addExtinguisher, updateExtinguisher, refreshExtinguisherProfile } from "@/api/manage/extinguisher"
import { deviceDeptTreeSelect } from "@/api/manage/deviceDept"
import { regionData } from "@/utils/regionData"

const { proxy } = getCurrentInstance()

const extinguisherList = ref([])
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
const profileRefreshing = ref(false)
const extinguisherStatusOptions = [
  { value: '0', label: '正常', type: 'success' },
  { value: '1', label: '待检', type: 'warning' },
  { value: '2', label: '过期', type: 'danger' },
  { value: '3', label: '停用', type: 'info' },
  { value: '4', label: '报废', type: 'danger' }
]
const extinguisherTypeOptions = [
  { value: 'water_based', label: '水基型灭火器', serviceLifeYears: 6 },
  { value: 'dry_powder', label: '干粉灭火器', serviceLifeYears: 10 },
  { value: 'clean_gas', label: '洁净气体灭火器', serviceLifeYears: 10 },
  { value: 'co2', label: '二氧化碳灭火器', serviceLifeYears: 12 }
]
const extinguisherFormOptions = [
  { value: 'portable', label: '手提式' },
  { value: 'wheeled', label: '推车式' }
]
const temperatureRangesByStandard = {
  'GB 4351-2023': ['5~60', '-5~60', '-10~60', '-20~60', '-30~60', '-40~60', '-50~60'],
  'GB 8109-2023': ['5~60', '-5~60', '-10~60', '-20~60', '-30~60', '-40~60', '-50~60'],
  'GB 4351.1-2005': ['5~55', '0~55', '-10~55', '-20~55', '-30~55', '-40~55', '-55~55'],
  'GB 8109-2005': ['5~55', '0~55', '-10~55', '-20~55', '-30~55', '-40~55', '-55~55']
}

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    labelCode: null,
    sensorCode: null,
    firePointName: null,
    deptId: null,
    deptRegion: [],
    deptProvince: null,
    deptCity: null,
    deptArea: null,
    status: null,
  },
  rules: {
    labelCode: [
      { required: true, message: "标志明码(唯一标识)不能为空", trigger: "blur" }
    ],
  }
})

const { queryParams, form, rules } = toRefs(data)
const temperatureRangeOptions = computed(() => getTemperatureRangeOptions(form.value.standardCode))

watch(
  () => [
    form.value.specification,
    form.value.productName,
    form.value.productionDate,
    form.value.extinguisherType,
    form.value.extinguisherForm
  ],
  () => completeWarningBusinessFields()
)

/** 查询部门下拉树结构 */
function getDeptTree(validateDept = false) {
  deviceDeptTreeSelect(buildDeptTreeParams()).then(response => {
    deptOptions.value = response.data || []
    if (validateDept && queryParams.value.deptId && !containsDept(deptOptions.value, queryParams.value.deptId)) {
      queryParams.value.deptId = null
    }
  })
}

/** 查询灭火器信息列表 */
function getList() {
  loading.value = true
  listExtinguisher(buildQueryParams()).then(response => {
    extinguisherList.value = response.rows
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

// 取消按钮
function cancel() {
  open.value = false
  reset()
}

// 表单重置
function reset() {
  form.value = {
    extinguisherId: null,
    labelCode: null,
    specification: null,
    extinguisherType: null,
    extinguisherForm: null,
    standardCode: null,
    temperatureRange: null,
    profileSource: null,
    profileSyncTime: null,
    profileSyncStatus: null,
    profileSyncMessage: null,
    sensorId: null,
    sensorCode: null,
    deptId: null,
    productName: null,
    manufacturer: null,
    serviceProvider: null,
    productionDate: null,
    inspectionDate: null,
    expiryDate: null,
    scrapDate: null,
    firePointId: null,
    firePointName: null,
    installLocation: null,
    qrCode: null,
    status: '0',
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    delFlag: null
  }
  proxy.resetForm("extinguisherRef")
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
  ids.value = selection.map(item => item.extinguisherId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "新增灭火器信息"
}

function handleDetail(row) {
  getExtinguisher(row.extinguisherId).then(response => {
    detailForm.value = response.data || {}
    detailOpen.value = true
  })
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const _extinguisherId = row.extinguisherId || ids.value
  getExtinguisher(_extinguisherId).then(response => {
    form.value = response.data
    completeWarningBusinessFields()
    open.value = true
    title.value = "修改灭火器信息"
  })
}

function handleRefreshProfile() {
  if (!form.value.extinguisherId) {
    return
  }
  profileRefreshing.value = true
  refreshExtinguisherProfile(form.value.extinguisherId).then(response => {
    const result = response.data || {}
    const refreshed = result.data || result
    if (refreshed) {
      form.value = refreshed
      completeWarningBusinessFields()
    }
    if (result.success === false) {
      proxy.$modal.msgWarning(result.message || "标志明码资料同步失败，已保留现有资料")
    } else {
      proxy.$modal.msgSuccess(result.message || "标志明码资料已同步")
    }
    getList()
  }).finally(() => {
    profileRefreshing.value = false
  })
}

/** 提交按钮 */
function submitForm() {
  completeWarningBusinessFields()
  proxy.$refs["extinguisherRef"].validate(valid => {
    if (valid) {
      if (form.value.extinguisherId != null) {
        updateExtinguisher(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addExtinguisher(form.value).then(response => {
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
  const _extinguisherIds = row.extinguisherId || ids.value
  proxy.$modal.confirm('是否确认删除灭火器信息编号为"' + _extinguisherIds + '"的数据项？').then(function() {
    return delExtinguisher(_extinguisherIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('manage/extinguisher/export', {
    ...buildQueryParams()
  }, `extinguisher_${new Date().getTime()}.xlsx`)
}

function formatExtinguisherStatus(status) {
  return extinguisherStatusOptions.find(item => item.value === String(status))?.label || status || '未设置'
}

function formatExtinguisherType(value) {
  return extinguisherTypeOptions.find(item => item.value === value)?.label || value || '-'
}

function formatExtinguisherForm(value) {
  return extinguisherFormOptions.find(item => item.value === value)?.label || value || '-'
}

function formatTemperatureRange(value) {
  return value ? `${value.replace('~', '℃~')}℃` : '-'
}

function getTemperatureRangeOptions(standardCode) {
  return (temperatureRangesByStandard[standardCode] || []).map(item => ({
    value: item,
    label: formatTemperatureRange(item)
  }))
}

function completeWarningBusinessFields() {
  if (!form.value) {
    return
  }
  if (!form.value.extinguisherType) {
    form.value.extinguisherType = inferExtinguisherType(form.value)
  }
  if (!form.value.extinguisherForm) {
    form.value.extinguisherForm = inferExtinguisherForm(form.value)
  }
  form.value.standardCode = resolveStandardCode(form.value.extinguisherForm, form.value.productionDate)
  form.value.expiryDate = calculateExpiryDate(form.value.productionDate, form.value.extinguisherType)
  if (
    form.value.temperatureRange &&
    !getTemperatureRangeOptions(form.value.standardCode).some(item => item.value === form.value.temperatureRange)
  ) {
    form.value.temperatureRange = null
  }
}

function inferExtinguisherType(row) {
  const text = normalizeExtinguisherText(row)
  if (text.includes('水基')) {
    return 'water_based'
  }
  if (text.includes('干粉')) {
    return 'dry_powder'
  }
  if (text.includes('洁净气体') || text.includes('洁净')) {
    return 'clean_gas'
  }
  if (text.includes('二氧化碳') || text.includes('co2') || text.includes('co₂')) {
    return 'co2'
  }
  return null
}

function inferExtinguisherForm(row) {
  const text = normalizeExtinguisherText(row)
  if (text.includes('推车')) {
    return 'wheeled'
  }
  if (text.includes('手提')) {
    return 'portable'
  }
  return null
}

function normalizeExtinguisherText(row) {
  return `${row?.specification || ''} ${row?.productName || ''}`.trim().toLowerCase()
}

function resolveStandardCode(extinguisherForm, productionDate) {
  if (!extinguisherForm || !productionDate) {
    return null
  }
  const useNewStandard = productionDate >= '2025-01-01'
  if (extinguisherForm === 'portable') {
    return useNewStandard ? 'GB 4351-2023' : 'GB 4351.1-2005'
  }
  if (extinguisherForm === 'wheeled') {
    return useNewStandard ? 'GB 8109-2023' : 'GB 8109-2005'
  }
  return null
}

function calculateExpiryDate(productionDate, extinguisherType) {
  const serviceLifeYears = extinguisherTypeOptions.find(item => item.value === extinguisherType)?.serviceLifeYears
  if (!productionDate || !serviceLifeYears) {
    return null
  }
  const [year, month, day] = productionDate.split('-').map(Number)
  const targetYear = year + serviceLifeYears
  const lastDayOfTargetMonth = new Date(targetYear, month, 0).getDate()
  return [
    targetYear,
    String(month).padStart(2, '0'),
    String(Math.min(day, lastDayOfTargetMonth)).padStart(2, '0')
  ].join('-')
}

function extinguisherStatusTagType(status) {
  return extinguisherStatusOptions.find(item => item.value === String(status))?.type || 'info'
}

function formatSyncStatus(status) {
  const statusMap = {
    synced: '已同步',
    failed: '同步异常',
    unbound: '未绑定'
  }
  return statusMap[status] || status || '未设置'
}

function syncStatusTagType(status) {
  const typeMap = {
    synced: 'success',
    failed: 'danger',
    unbound: 'warning'
  }
  return typeMap[status] || 'info'
}

function formatProfileSource(source) {
  const sourceMap = {
    sdk: 'SDK原始资料',
    derived: 'SDK资料 + 推导',
    manual: '人工兜底',
    mixed: 'SDK资料/推导 + 人工'
  }
  return sourceMap[source] || source || '-'
}

function formatProfileSyncStatus(status) {
  const statusMap = {
    success: '资料完整',
    failed: '同步失败',
    incomplete: '资料不完整'
  }
  return statusMap[status] || status || '-'
}

function profileSyncStatusTagType(status) {
  const typeMap = {
    success: 'success',
    failed: 'danger',
    incomplete: 'warning'
  }
  return typeMap[status] || 'info'
}

getList()
getDeptTree()
</script>

<style scoped>
.extinguisher-query-form {
  display: grid;
  grid-template-columns: repeat(4, max-content);
  align-items: start;
  column-gap: 24px;
  row-gap: 12px;
  margin-bottom: 18px;
}

.extinguisher-query-form :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 0;
}

.extinguisher-query-form :deep(.el-form-item__label) {
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

.extinguisher-edit-form {
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

.form-section-with-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  line-height: 24px;
}

.extinguisher-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 18px;
}

.extinguisher-form-grid :deep(.el-form-item) {
  margin-bottom: 16px;
}

.extinguisher-form-grid :deep(.el-select),
.extinguisher-form-grid :deep(.el-date-editor),
.extinguisher-form-grid :deep(.el-tree-select) {
  width: 100%;
}

.form-span-2 {
  grid-column: 1 / -1;
}

@media (max-width: 1500px) {
  .extinguisher-query-form {
    grid-template-columns: repeat(2, max-content);
  }
}

@media (max-width: 768px) {
  .extinguisher-form-grid {
    grid-template-columns: 1fr;
  }

  .form-span-2 {
    grid-column: auto;
  }
}
</style>
