<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="88px">
      <el-form-item label="外部单位" prop="externalCompanyNameSnapshot">
        <el-input v-model="queryParams.externalCompanyNameSnapshot" placeholder="请输入外部单位" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="TBOX配置号" prop="gatewayConfigCode">
        <el-input v-model="queryParams.gatewayConfigCode" placeholder="请输入TBOX配置号" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="4G号" prop="gatewayImei">
        <el-input v-model="queryParams.gatewayImei" placeholder="请输入4G号" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="SIM卡号" prop="simNo">
        <el-input v-model="queryParams.simNo" placeholder="请输入SIM卡号" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="匹配状态" prop="matchStatus">
        <el-select v-model="queryParams.matchStatus" placeholder="请选择匹配状态" clearable>
          <el-option v-for="item in gatewayMatchOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['manage:manualGateway:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['manage:manualGateway:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['manage:manualGateway:export']">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="gatewayList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="记录ID" align="center" prop="recordId" width="90" />
      <el-table-column label="外部单位" align="center" prop="externalCompanyNameSnapshot" min-width="220" :show-overflow-tooltip="true" />
      <el-table-column label="当前映射合同单位" align="center" prop="mappedDeptName" min-width="180" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ scope.row.mappedDeptName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="TBOX配置号" align="center" prop="gatewayConfigCode" min-width="130" />
      <el-table-column label="二维码号" align="center" prop="gatewayQrCode" min-width="120" />
      <el-table-column label="4G号" align="center" prop="gatewayImei" min-width="150" />
      <el-table-column label="SIM卡号" align="center" prop="simNo" min-width="170" :show-overflow-tooltip="true" />
      <el-table-column label="SIM开卡月" align="center" prop="simOpenMonth" width="120" />
      <el-table-column label="放置地点" align="center" prop="placementLocation" min-width="220" :show-overflow-tooltip="true" />
      <el-table-column label="传感器数" align="center" prop="sensorCount" width="100" />
      <el-table-column label="匹配状态" align="center" prop="matchStatus" width="110">
        <template #default="scope">
          <el-tag :type="gatewayMatchTag(scope.row.matchStatus)">
            {{ matchLabel(scope.row.matchStatus, gatewayMatchOptions) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <el-tag :type="statusTag(scope.row.status)">{{ matchLabel(scope.row.status, statusOptions) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="更新人" align="center" prop="updateBy" width="100" />
      <el-table-column label="更新时间" align="center" prop="updateTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.updateTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="260">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['manage:manualGateway:query']">详情</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['manage:manualGateway:edit']">修改</el-button>
          <el-button link type="success" icon="Connection" @click="handleManageSensors(scope.row)" v-hasPermi="['manage:manualSensor:list']">传感器</el-button>
          <el-button link type="danger" icon="CircleClose" @click="handleVoid(scope.row)" v-hasPermi="['manage:manualGateway:void']" v-if="scope.row.status !== 'void'">作废</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="1080px" append-to-body>
      <el-form ref="gatewayRef" :model="form" :rules="rules" label-width="104px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="外部单位" prop="externalCompanyId">
              <div style="display: flex; gap: 8px; width: 100%;">
                <el-select v-model="form.externalCompanyId" filterable placeholder="请选择外部单位" style="flex: 1;" @visible-change="handleExternalCompanyVisible" @change="handleExternalCompanyChange">
                  <el-option v-for="item in externalCompanyOptions" :key="item.externalCompanyId" :label="buildExternalCompanyLabel(item)" :value="item.externalCompanyId" />
                </el-select>
                <el-button type="primary" plain @click="openExternalCompanyDialog" v-hasPermi="['manage:manualExternalCompany:add']">新建</el-button>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当前映射合同单位">
              <el-input :model-value="form.mappedDeptName || '-'" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="TBOX配置号" prop="gatewayConfigCode">
              <el-input v-model="form.gatewayConfigCode" placeholder="请输入TBOX配置号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="二维码号" prop="gatewayQrCode">
              <el-input v-model="form.gatewayQrCode" placeholder="请输入二维码号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="4G号" prop="gatewayImei">
              <el-input v-model="form.gatewayImei" placeholder="请输入4G号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="SIM卡号" prop="simNo">
              <el-input v-model="form.simNo" placeholder="请输入SIM卡号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="SIM开卡月" prop="simOpenMonth">
              <el-input v-model="form.simOpenMonth" placeholder="例如：2026年4月" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%;">
                <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="施工人员" prop="installerName">
              <el-input v-model="form.installerName" placeholder="请输入施工人员" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="施工时间" prop="installTime">
              <el-date-picker v-model="form.installTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择施工时间" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="放置地点" prop="placementLocation">
              <el-input v-model="form.placementLocation" placeholder="请输入放置地点" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div v-if="form.recordId" style="margin-top: 8px;">
        <el-divider content-position="left">传感器记录</el-divider>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAddSensor" v-hasPermi="['manage:manualSensor:add']">新增传感器</el-button>
          </el-col>
        </el-row>
        <el-table :data="sensorRows" size="small" max-height="280">
          <el-table-column label="传感器号" prop="sensorCode" min-width="120" />
          <el-table-column label="MAC地址" prop="macAddress" min-width="140" />
          <el-table-column label="装配地址" prop="assemblyAddress" min-width="180" :show-overflow-tooltip="true" />
          <el-table-column label="瓶体序列号" prop="extinguisherBodySerialNo" min-width="160" :show-overflow-tooltip="true" />
          <el-table-column label="类型" prop="sensorVendorType" width="100">
            <template #default="scope">
              <span>{{ vendorLabel(scope.row.sensorVendorType) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="匹配状态" prop="matchStatus" width="120">
            <template #default="scope">
              <el-tag :type="sensorMatchTag(scope.row.matchStatus)">{{ matchLabel(scope.row.matchStatus, sensorMatchOptions) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" prop="status" width="100">
            <template #default="scope">
              <el-tag :type="statusTag(scope.row.status)">{{ matchLabel(scope.row.status, statusOptions) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="180">
            <template #default="scope">
              <el-button link type="primary" @click="handleEditSensor(scope.row)" v-hasPermi="['manage:manualSensor:edit']">修改</el-button>
              <el-button link type="danger" @click="handleVoidSensor(scope.row)" v-hasPermi="['manage:manualSensor:void']" v-if="scope.row.status !== 'void'">作废</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确定</el-button>
          <el-button @click="cancel">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog title="新建外部单位" v-model="externalCompanyOpen" width="500px" append-to-body>
      <el-form ref="externalCompanyRef" :model="externalCompanyForm" :rules="externalCompanyRules" label-width="104px">
        <el-form-item label="外部单位名称" prop="externalCompanyName">
          <el-input v-model="externalCompanyForm.externalCompanyName" placeholder="请输入外部单位名称" />
        </el-form-item>
        <el-form-item label="编号前缀" prop="numberPrefix">
          <el-input v-model="externalCompanyForm.numberPrefix" placeholder="选填" />
        </el-form-item>
        <el-form-item label="组织路径" prop="orgPath">
          <el-input v-model="externalCompanyForm.orgPath" placeholder="选填" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="externalCompanyForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitExternalCompany">确定</el-button>
          <el-button @click="externalCompanyOpen = false">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog :title="sensorDialogTitle" v-model="sensorOpen" width="720px" append-to-body>
      <el-form ref="sensorRef" :model="sensorForm" :rules="sensorRules" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="传感器号" prop="sensorCode">
              <el-input v-model="sensorForm.sensorCode" placeholder="请输入传感器号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="MAC地址" prop="macAddress">
              <el-input v-model="sensorForm.macAddress" placeholder="请输入MAC地址" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="装配地址" prop="assemblyAddress">
              <el-input v-model="sensorForm.assemblyAddress" placeholder="请输入装配地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="灭火器瓶体序列号" prop="extinguisherBodySerialNo">
              <el-input v-model="sensorForm.extinguisherBodySerialNo" placeholder="请输入灭火器瓶体序列号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="灭火器出产日期" prop="extinguisherProductionDate">
              <el-date-picker v-model="sensorForm.extinguisherProductionDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择日期" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="传感器类型" prop="sensorVendorType">
              <el-select v-model="sensorForm.sensorVendorType" placeholder="请选择传感器类型" style="width: 100%;">
                <el-option label="自研" value="self_research" />
                <el-option label="第三方" value="third_party" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="sensorForm.status" placeholder="请选择状态" style="width: 100%;">
                <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="sensorForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitSensorForm">确定</el-button>
          <el-button @click="sensorOpen = false">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ManualGateway">
import { addManualExternalCompany, addManualGateway, getManualGateway, listManualExternalCompanies, listManualGateway, updateManualGateway, voidManualGateway } from "@/api/manage/manualGateway"
import { addManualSensor, getManualSensor, listManualSensor, updateManualSensor, voidManualSensor } from "@/api/manage/manualSensor"

const { proxy } = getCurrentInstance()

const gatewayList = ref([])
const externalCompanyOptions = ref([])
const sensorRows = ref([])
const loading = ref(false)
const showSearch = ref(true)
const open = ref(false)
const single = ref(true)
const total = ref(0)
const title = ref("")
const ids = ref([])
const externalCompanyOpen = ref(false)
const sensorOpen = ref(false)
const sensorDialogTitle = ref("")

const statusOptions = [
  { label: "生效", value: "active" },
  { label: "草稿", value: "draft" },
  { label: "已作废", value: "void" }
]

const gatewayMatchOptions = [
  { label: "未匹配", value: "unmatched" },
  { label: "已匹配", value: "matched" }
]

const sensorMatchOptions = [
  { label: "未匹配", value: "unmatched" },
  { label: "部分匹配", value: "partial_matched" },
  { label: "完全匹配", value: "full_matched" }
]

const data = reactive({
  form: {},
  sensorForm: {},
  externalCompanyForm: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    externalCompanyNameSnapshot: null,
    gatewayConfigCode: null,
    gatewayImei: null,
    simNo: null,
    status: null,
    matchStatus: null
  },
  rules: {
    externalCompanyId: [{ required: true, message: "请选择外部单位", trigger: "change" }],
    gatewayConfigCode: [{ required: true, message: "请输入TBOX配置号", trigger: "blur" }],
    gatewayImei: [{ required: true, message: "请输入4G号", trigger: "blur" }]
  },
  sensorRules: {
    sensorCode: [{ required: true, message: "请输入传感器号", trigger: "blur" }],
    sensorVendorType: [{ required: true, message: "请选择传感器类型", trigger: "change" }]
  },
  externalCompanyRules: {
    externalCompanyName: [{ required: true, message: "请输入外部单位名称", trigger: "blur" }]
  }
})

const { form, sensorForm, externalCompanyForm, queryParams, rules, sensorRules, externalCompanyRules } = toRefs(data)

function getList() {
  loading.value = true
  listManualGateway(queryParams.value).then(response => {
    gatewayList.value = response.rows
    total.value = response.total
  }).finally(() => {
    loading.value = false
  })
}

function getExternalCompanyOptions() {
  return listManualExternalCompanies({}).then(response => {
    externalCompanyOptions.value = response.data || []
  })
}

function loadGatewayDetail(recordId) {
  return getManualGateway(recordId).then(response => {
    form.value = {
      ...response.data,
      status: response.data.status || "active"
    }
    sensorRows.value = response.data.sensorRecords || []
  })
}

function loadSensors() {
  if (!form.value.recordId) {
    sensorRows.value = []
    return
  }
  listManualSensor({ pageNum: 1, pageSize: 1000, gatewayRecordId: form.value.recordId }).then(response => {
    sensorRows.value = response.rows || []
  })
}

function reset() {
  form.value = {
    recordId: null,
    externalCompanyId: null,
    externalCompanyNameSnapshot: null,
    mappedDeptName: null,
    gatewayConfigCode: null,
    gatewayQrCode: null,
    gatewayImei: null,
    simNo: null,
    simOpenMonth: null,
    placementLocation: null,
    installerName: null,
    installTime: null,
    status: "active",
    remark: null
  }
  sensorRows.value = []
  proxy.resetForm("gatewayRef")
}

function resetSensorForm() {
  sensorForm.value = {
    sensorRecordId: null,
    gatewayRecordId: form.value.recordId,
    sensorCode: null,
    macAddress: null,
    assemblyAddress: null,
    extinguisherBodySerialNo: null,
    extinguisherProductionDate: null,
    sensorVendorType: null,
    status: "active",
    remark: null
  }
  proxy.resetForm("sensorRef")
}

function resetExternalCompanyForm() {
  externalCompanyForm.value = {
    externalCompanyName: null,
    numberPrefix: null,
    orgPath: null,
    remark: null
  }
  proxy.resetForm("externalCompanyRef")
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.recordId)
  single.value = selection.length !== 1
}

function handleAdd() {
  reset()
  getExternalCompanyOptions()
  open.value = true
  title.value = "新增网关记录"
}

function handleUpdate(row) {
  reset()
  getExternalCompanyOptions().then(() => {
    const recordId = row?.recordId || ids.value[0]
    loadGatewayDetail(recordId).then(() => {
      open.value = true
      title.value = "修改网关记录"
    })
  })
}

function handleDetail(row) {
  reset()
  getExternalCompanyOptions().then(() => {
    loadGatewayDetail(row.recordId).then(() => {
      open.value = true
      title.value = "查看网关记录"
    })
  })
}

function handleManageSensors(row) {
  handleUpdate(row)
}

function handleVoid(row) {
  proxy.$modal.confirm(`确认作废网关记录【${row.gatewayConfigCode || row.recordId}】吗？`).then(function() {
    return voidManualGateway(row.recordId)
  }).then(() => {
    proxy.$modal.msgSuccess("作废成功")
    getList()
  }).catch(() => {})
}

function handleExport() {
  proxy.download('manage/manual-gateway/export', {
    ...queryParams.value
  }, `manual_gateway_${new Date().getTime()}.xlsx`)
}

function handleExternalCompanyVisible(visible) {
  if (visible && externalCompanyOptions.value.length === 0) {
    getExternalCompanyOptions()
  }
}

function handleExternalCompanyChange(value) {
  const current = externalCompanyOptions.value.find(item => item.externalCompanyId === value)
  form.value.externalCompanyNameSnapshot = current ? current.externalCompanyName : null
  form.value.mappedDeptName = current ? current.mappedDeptName : null
}

function openExternalCompanyDialog() {
  resetExternalCompanyForm()
  externalCompanyOpen.value = true
}

function submitExternalCompany() {
  proxy.$refs["externalCompanyRef"].validate(valid => {
    if (!valid) return
    addManualExternalCompany(externalCompanyForm.value).then(response => {
      externalCompanyOpen.value = false
      proxy.$modal.msgSuccess("外部单位创建成功")
      getExternalCompanyOptions().then(() => {
        form.value.externalCompanyId = response.data.externalCompanyId
        form.value.externalCompanyNameSnapshot = response.data.externalCompanyName
        form.value.mappedDeptName = response.data.mappedDeptName || null
      })
    })
  })
}

function submitForm() {
  proxy.$refs["gatewayRef"].validate(valid => {
    if (!valid) return
    const action = form.value.recordId ? updateManualGateway : addManualGateway
    action(form.value).then(() => {
      proxy.$modal.msgSuccess(form.value.recordId ? "修改成功" : "新增成功")
      open.value = false
      getList()
    })
  })
}

function cancel() {
  open.value = false
  reset()
}

function handleAddSensor() {
  resetSensorForm()
  sensorDialogTitle.value = "新增传感器记录"
  sensorOpen.value = true
}

function handleEditSensor(row) {
  resetSensorForm()
  getManualSensor(row.sensorRecordId).then(response => {
    sensorForm.value = {
      ...response.data,
      gatewayRecordId: form.value.recordId,
      status: response.data.status || "active"
    }
    sensorDialogTitle.value = "修改传感器记录"
    sensorOpen.value = true
  })
}

function handleVoidSensor(row) {
  proxy.$modal.confirm(`确认作废传感器记录【${row.sensorCode || row.sensorRecordId}】吗？`).then(function() {
    return voidManualSensor(row.sensorRecordId)
  }).then(() => {
    proxy.$modal.msgSuccess("作废成功")
    loadSensors()
  }).catch(() => {})
}

function submitSensorForm() {
  proxy.$refs["sensorRef"].validate(valid => {
    if (!valid) return
    sensorForm.value.gatewayRecordId = form.value.recordId
    const action = sensorForm.value.sensorRecordId ? updateManualSensor : addManualSensor
    action(sensorForm.value).then(() => {
      proxy.$modal.msgSuccess(sensorForm.value.sensorRecordId ? "修改成功" : "新增成功")
      sensorOpen.value = false
      loadSensors()
      getList()
    })
  })
}

function buildExternalCompanyLabel(item) {
  return `${item.externalCompanyName} (${item.externalCompanyId})`
}

function matchLabel(value, options) {
  const current = options.find(item => item.value === value)
  return current ? current.label : (value || "-")
}

function statusTag(value) {
  if (value === "active") return "success"
  if (value === "draft") return "warning"
  return "info"
}

function gatewayMatchTag(value) {
  return value === "matched" ? "success" : "info"
}

function sensorMatchTag(value) {
  if (value === "full_matched") return "success"
  if (value === "partial_matched") return "warning"
  return "info"
}

function vendorLabel(value) {
  if (value === "self_research") return "自研"
  if (value === "third_party") return "第三方"
  return "-"
}

getList()
getExternalCompanyOptions()
</script>
