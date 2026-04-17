<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="92px">
      <el-form-item label="外部单位" prop="externalCompanyNameSnapshot">
        <el-input v-model="queryParams.externalCompanyNameSnapshot" placeholder="请输入外部单位" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="传感器号" prop="sensorCode">
        <el-input v-model="queryParams.sensorCode" placeholder="请输入传感器号" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="MAC地址" prop="macAddress">
        <el-input v-model="queryParams.macAddress" placeholder="请输入MAC地址" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="装配地址" prop="assemblyAddress">
        <el-input v-model="queryParams.assemblyAddress" placeholder="请输入装配地址" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="传感器类型" prop="sensorVendorType">
        <el-select v-model="queryParams.sensorVendorType" placeholder="请选择传感器类型" clearable>
          <el-option label="自研" value="self_research" />
          <el-option label="第三方" value="third_party" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="匹配状态" prop="matchStatus">
        <el-select v-model="queryParams.matchStatus" placeholder="请选择匹配状态" clearable>
          <el-option v-for="item in sensorMatchOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['manage:manualSensor:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['manage:manualSensor:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['manage:manualSensor:export']">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="sensorList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="记录ID" align="center" prop="sensorRecordId" width="90" />
      <el-table-column label="外部单位" align="center" prop="externalCompanyNameSnapshot" min-width="220" :show-overflow-tooltip="true" />
      <el-table-column label="当前映射合同单位" align="center" prop="mappedDeptName" min-width="180" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ scope.row.mappedDeptName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="所属网关" align="center" min-width="180">
        <template #default="scope">
          <span>{{ scope.row.gatewayConfigCode || '-' }} / {{ scope.row.gatewayImei || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="传感器号" align="center" prop="sensorCode" min-width="120" />
      <el-table-column label="MAC地址" align="center" prop="macAddress" min-width="140" />
      <el-table-column label="装配地址" align="center" prop="assemblyAddress" min-width="180" :show-overflow-tooltip="true" />
      <el-table-column label="瓶体序列号" align="center" prop="extinguisherBodySerialNo" min-width="160" :show-overflow-tooltip="true" />
      <el-table-column label="出产日期" align="center" prop="extinguisherProductionDate" width="110">
        <template #default="scope">
          <span>{{ parseTime(scope.row.extinguisherProductionDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="类型" align="center" prop="sensorVendorType" width="90">
        <template #default="scope">
          <span>{{ vendorLabel(scope.row.sensorVendorType) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="匹配状态" align="center" prop="matchStatus" width="120">
        <template #default="scope">
          <el-tag :type="sensorMatchTag(scope.row.matchStatus)">{{ matchLabel(scope.row.matchStatus, sensorMatchOptions) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <el-tag :type="statusTag(scope.row.status)">{{ matchLabel(scope.row.status, statusOptions) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180">
        <template #default="scope">
          <el-button link type="primary" @click="handleUpdate(scope.row)" v-hasPermi="['manage:manualSensor:edit']">修改</el-button>
          <el-button link type="danger" @click="handleVoid(scope.row)" v-hasPermi="['manage:manualSensor:void']" v-if="scope.row.status !== 'void'">作废</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="760px" append-to-body>
      <el-form ref="sensorRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属网关记录" prop="gatewayRecordId">
              <el-select v-model="form.gatewayRecordId" filterable placeholder="请选择所属网关记录" style="width: 100%;" @visible-change="handleGatewayVisible" @change="handleGatewayChange">
                <el-option v-for="item in gatewayOptions" :key="item.recordId" :label="buildGatewayLabel(item)" :value="item.recordId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="外部单位">
              <el-input :model-value="form.externalCompanyNameSnapshot || '-'" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="传感器号" prop="sensorCode">
              <el-input v-model="form.sensorCode" placeholder="请输入传感器号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="MAC地址" prop="macAddress">
              <el-input v-model="form.macAddress" placeholder="请输入MAC地址" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="装配地址" prop="assemblyAddress">
              <el-input v-model="form.assemblyAddress" placeholder="请输入装配地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="灭火器瓶体序列号" prop="extinguisherBodySerialNo">
              <el-input v-model="form.extinguisherBodySerialNo" placeholder="请输入灭火器瓶体序列号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="灭火器出产日期" prop="extinguisherProductionDate">
              <el-date-picker v-model="form.extinguisherProductionDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择日期" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="传感器类型" prop="sensorVendorType">
              <el-select v-model="form.sensorVendorType" placeholder="请选择传感器类型" style="width: 100%;">
                <el-option label="自研" value="self_research" />
                <el-option label="第三方" value="third_party" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%;">
                <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
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

<script setup name="ManualSensor">
import { getManualGateway, listManualGateway } from "@/api/manage/manualGateway"
import { addManualSensor, getManualSensor, listManualSensor, updateManualSensor, voidManualSensor } from "@/api/manage/manualSensor"

const { proxy } = getCurrentInstance()

const sensorList = ref([])
const gatewayOptions = ref([])
const loading = ref(false)
const showSearch = ref(true)
const open = ref(false)
const single = ref(true)
const total = ref(0)
const title = ref("")
const ids = ref([])

const statusOptions = [
  { label: "生效", value: "active" },
  { label: "草稿", value: "draft" },
  { label: "已作废", value: "void" }
]

const sensorMatchOptions = [
  { label: "未匹配", value: "unmatched" },
  { label: "部分匹配", value: "partial_matched" },
  { label: "完全匹配", value: "full_matched" }
]

const route = useRoute()

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    gatewayRecordId: route.query.gatewayRecordId ? Number(route.query.gatewayRecordId) : null,
    externalCompanyNameSnapshot: null,
    sensorCode: null,
    macAddress: null,
    assemblyAddress: null,
    sensorVendorType: null,
    status: null,
    matchStatus: null
  },
  rules: {
    gatewayRecordId: [{ required: true, message: "请选择所属网关记录", trigger: "change" }],
    sensorCode: [{ required: true, message: "请输入传感器号", trigger: "blur" }],
    sensorVendorType: [{ required: true, message: "请选择传感器类型", trigger: "change" }]
  }
})

const { form, queryParams, rules } = toRefs(data)

function getList() {
  loading.value = true
  listManualSensor(queryParams.value).then(response => {
    sensorList.value = response.rows
    total.value = response.total
  }).finally(() => {
    loading.value = false
  })
}

function getGatewayOptions() {
  return listManualGateway({ pageNum: 1, pageSize: 1000, status: 'active' }).then(response => {
    gatewayOptions.value = response.rows || []
  })
}

function reset() {
  form.value = {
    sensorRecordId: null,
    gatewayRecordId: route.query.gatewayRecordId ? Number(route.query.gatewayRecordId) : null,
    externalCompanyNameSnapshot: null,
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

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm("queryRef")
  queryParams.value.gatewayRecordId = route.query.gatewayRecordId ? Number(route.query.gatewayRecordId) : null
  handleQuery()
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.sensorRecordId)
  single.value = selection.length !== 1
}

function handleAdd() {
  reset()
  getGatewayOptions()
  open.value = true
  title.value = "新增传感器记录"
}

function handleUpdate(row) {
  reset()
  getGatewayOptions().then(() => {
    const sensorRecordId = row?.sensorRecordId || ids.value[0]
    getManualSensor(sensorRecordId).then(response => {
      form.value = {
        ...response.data,
        status: response.data.status || "active"
      }
      open.value = true
      title.value = "修改传感器记录"
    })
  })
}

function handleVoid(row) {
  proxy.$modal.confirm(`确认作废传感器记录【${row.sensorCode || row.sensorRecordId}】吗？`).then(function() {
    return voidManualSensor(row.sensorRecordId)
  }).then(() => {
    proxy.$modal.msgSuccess("作废成功")
    getList()
  }).catch(() => {})
}

function handleExport() {
  proxy.download('manage/manual-sensor/export', {
    ...queryParams.value
  }, `manual_sensor_${new Date().getTime()}.xlsx`)
}

function handleGatewayVisible(visible) {
  if (visible && gatewayOptions.value.length === 0) {
    getGatewayOptions()
  }
}

function handleGatewayChange(value) {
  if (!value) {
    form.value.externalCompanyNameSnapshot = null
    return
  }
  getManualGateway(value).then(response => {
    form.value.externalCompanyNameSnapshot = response.data.externalCompanyNameSnapshot
  })
}

function submitForm() {
  proxy.$refs["sensorRef"].validate(valid => {
    if (!valid) return
    const action = form.value.sensorRecordId ? updateManualSensor : addManualSensor
    action(form.value).then(() => {
      proxy.$modal.msgSuccess(form.value.sensorRecordId ? "修改成功" : "新增成功")
      open.value = false
      getList()
    })
  })
}

function cancel() {
  open.value = false
  reset()
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

function buildGatewayLabel(item) {
  return `${item.gatewayConfigCode || '-'} / ${item.gatewayImei || '-'} / ${item.externalCompanyNameSnapshot || '-'}`
}

getList()
getGatewayOptions()
</script>
