<template>
  <div class="app-container">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="合同单位" prop="deptId">
        <el-tree-select
          v-model="queryParams.deptId"
          :data="deptOptions"
          :props="deptProps"
          placeholder="请选择合同单位"
          check-strictly
          clearable
          style="width: 240px"
        />
      </el-form-item>
      <el-form-item label="合同号" prop="contractNo">
        <el-input
          v-model="queryParams.contractNo"
          placeholder="请输入合同号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="合同性质" prop="contractType">
        <el-select v-model="queryParams.contractType" placeholder="请选择合同性质" clearable style="width: 160px">
          <el-option
            v-for="item in contractTypeFilterOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 120px">
          <el-option label="正常" value="1" />
          <el-option label="停用" value="0" />
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
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['system:contract:add']"
        >
          新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:contract:edit']"
        >
          修改
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:contract:remove']"
        >
          删除
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['system:contract:export']"
        >
          导出
        </el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="contractList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="合同单位" align="center" prop="deptName" min-width="180" :show-overflow-tooltip="true" />
      <el-table-column label="单位来源" align="center" min-width="100">
        <template #default="{ row }">
          <el-tag :type="getDeptSourceTagType(row.deptSource)" size="small">
            {{ getDeptSourceLabel(row.deptSource) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="合同号" align="center" prop="contractNo" min-width="140" />
      <el-table-column label="合同性质" align="center" min-width="120">
        <template #default="{ row }">
          <el-tag :type="getContractTypeTagType(row.contractType)" size="small">
            {{ getContractTypeLabel(row.contractType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="API ID" align="center" prop="apiId" min-width="180" />
      <el-table-column label="API KEY" align="center" prop="apiKey" min-width="220">
        <template #default="{ row }">
          <span v-if="!row.showKey">{{ maskKey(row.apiKey) }}</span>
          <span v-else>{{ row.apiKey }}</span>
          <el-button link type="primary" size="small" @click="toggleKeyVisibility(row)" style="margin-left: 6px">
            {{ row.showKey ? '隐藏' : '显示' }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="到期日期" align="center" prop="expireDate" min-width="110">
        <template #default="{ row }">
          <span>{{ formatDate(row.expireDate) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="到期状态" align="center" min-width="100">
        <template #default="{ row }">
          <el-tag v-if="row.expireStatus === '已过期'" type="danger" size="small">已过期</el-tag>
          <el-tag v-else-if="row.expireStatus === '即将过期'" type="warning" size="small">即将过期</el-tag>
          <el-tag v-else-if="row.expireStatus === '正常'" type="success" size="small">正常</el-tag>
          <el-tag v-else type="info" size="small">未设置</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="剩余天数" align="center" min-width="90">
        <template #default="{ row }">
          <span v-if="row.daysRemaining != null" :style="{ color: row.daysRemaining < 30 ? '#F56C6C' : '#67C23A' }">
            {{ row.daysRemaining }} 天
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" min-width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === '1' ? 'success' : 'danger'" size="small">
            {{ row.status === '1' ? '正常' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" min-width="150">
        <template #default="{ row }">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(row)" v-hasPermi="['system:contract:edit']">
            修改
          </el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(row)" v-hasPermi="['system:contract:remove']">
            删除
          </el-button>
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

    <el-dialog
      :title="title"
      v-model="open"
      width="640px"
      append-to-body
      :close-on-click-modal="!submitting"
      :close-on-press-escape="!submitting"
      :show-close="!submitting"
    >
      <el-form ref="contractRef" :model="form" :rules="rules" label-width="100px" :disabled="submitting">
        <el-form-item label="合同单位">
          <el-input
            :model-value="form.configId != null ? form.deptName : '由 SDK 凭证自动识别'"
            disabled
          />
        </el-form-item>
        <el-form-item label="合同号" prop="contractNo">
          <el-input v-model="form.contractNo" placeholder="请输入合同号" maxlength="50" />
        </el-form-item>
        <el-form-item label="合同性质" prop="contractType">
          <el-radio-group v-model="form.contractType">
            <el-radio v-for="item in contractTypeFormOptions" :key="item.value" :label="item.value">
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="API ID" prop="apiId">
          <el-input v-model="form.apiId" placeholder="请输入外部平台 API ID" maxlength="100" />
        </el-form-item>
        <el-form-item label="API KEY" prop="apiKey">
          <el-input v-model="form.apiKey" placeholder="请输入外部平台 API KEY" maxlength="100" show-password />
        </el-form-item>
        <el-form-item label="到期日期" prop="expireDate">
          <el-date-picker
            v-model="form.expireDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择到期日期"
            style="width: 100%"
            clearable
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="1">正常</el-radio>
            <el-radio label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <div v-if="submitting" class="contract-submit-status" role="status" aria-live="polite">
        <el-icon class="is-loading contract-submit-status__icon"><Loading /></el-icon>
        <div class="contract-submit-status__content">
          <div class="contract-submit-status__title">
            {{ form.configId != null ? "正在校验凭证并更新单位镜像" : "正在校验凭证并创建单位镜像" }}
          </div>
          <div class="contract-submit-status__detail">
            {{ submitElapsed < 15 ? "正在等待外部平台响应" : "外部平台响应较慢，系统仍在等待" }}，已等待 {{ submitElapsed }} 秒
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :loading="submitting" @click="submitForm">
            {{ submitting ? "处理中" : "确 定" }}
          </el-button>
          <el-button :disabled="submitting" @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Contract">
import { listContract, getContract, delContract, addContract, updateContract } from "@/api/system/contract"
import { listDept } from "@/api/system/dept"

const { proxy } = getCurrentInstance()

const contractList = ref([])
const open = ref(false)
const loading = ref(true)
const submitting = ref(false)
const submitElapsed = ref(0)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")
const deptOptions = ref([])
let submitTimer = null

const contractTypeFilterOptions = [
  { label: "试用合同", value: "trial" },
  { label: "正式付费合同", value: "paid" },
  { label: "未设置", value: "unset" }
]

const contractTypeFormOptions = [
  { label: "试用合同", value: "trial" },
  { label: "正式付费合同", value: "paid" }
]

const deptProps = {
  value: "deptId",
  label: "deptName",
  children: "children"
}

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    deptId: null,
    contractNo: null,
    contractType: null,
    status: null
  },
  rules: {
    contractNo: [
      { required: true, message: "合同号不能为空", trigger: "blur" }
    ],
    contractType: [
      { required: true, message: "请选择合同性质", trigger: "change" }
    ],
    apiId: [
      { required: true, message: "API ID 不能为空", trigger: "blur" }
    ],
    apiKey: [
      { required: true, message: "API KEY 不能为空", trigger: "blur" }
    ],
    status: [
      { required: true, message: "请选择状态", trigger: "change" }
    ]
  }
})

const { queryParams, form, rules } = toRefs(data)

function getDeptSourceLabel(deptSource) {
  if (deptSource === "sdk_company") {
    return "SDK镜像"
  }
  if (deptSource === "manual") {
    return "手工维护"
  }
  if (deptSource === "platform_root") {
    return "平台根"
  }
  return "未知"
}

function getDeptSourceTagType(deptSource) {
  if (deptSource === "sdk_company") {
    return "success"
  }
  if (deptSource === "manual") {
    return "warning"
  }
  if (deptSource === "platform_root") {
    return "info"
  }
  return "danger"
}

function getContractTypeLabel(contractType) {
  if (contractType === "trial") {
    return "试用合同"
  }
  if (contractType === "paid") {
    return "正式付费合同"
  }
  return "未设置"
}

function getContractTypeTagType(contractType) {
  if (contractType === "trial") {
    return "warning"
  }
  if (contractType === "paid") {
    return "success"
  }
  return "info"
}

function formatDate(value) {
  return value ? proxy.parseTime(value, "{y}-{m}-{d}") : "-"
}

function getDeptList() {
  listDept().then(response => {
    deptOptions.value = proxy.handleTree(response.data, "deptId")
  }).catch(() => {
    proxy.$modal.msgError("获取合同单位列表失败")
  })
}

function getList() {
  loading.value = true
  listContract(queryParams.value).then(response => {
    contractList.value = (response.rows || []).map(item => ({
      ...item,
      showKey: false
    }))
    total.value = response.total
  }).finally(() => {
    loading.value = false
  })
}

function maskKey(key) {
  if (!key) {
    return ""
  }
  if (key.length <= 8) {
    return "***"
  }
  return key.substring(0, 4) + "***" + key.substring(key.length - 4)
}

function toggleKeyVisibility(row) {
  row.showKey = !row.showKey
}

function cancel() {
  if (submitting.value) {
    return
  }
  open.value = false
  reset()
}

function startSubmitTimer() {
  submitElapsed.value = 0
  clearSubmitTimer()
  submitTimer = window.setInterval(() => {
    submitElapsed.value += 1
  }, 1000)
}

function clearSubmitTimer() {
  if (submitTimer != null) {
    window.clearInterval(submitTimer)
    submitTimer = null
  }
}

function reset() {
  form.value = {
    configId: null,
    deptId: null,
    deptName: null,
    contractNo: null,
    contractType: null,
    apiId: null,
    apiKey: null,
    status: "1",
    expireDate: null,
    remark: null
  }
  proxy.resetForm("contractRef")
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
  ids.value = selection.map(item => item.configId)
  single.value = selection.length !== 1
  multiple.value = selection.length === 0
}

function handleAdd() {
  reset()
  open.value = true
  title.value = "新增合同配置"
}

function handleUpdate(row) {
  reset()
  const configId = row?.configId || ids.value[0]
  getContract(configId).then(response => {
    form.value = {
      ...response.data,
      contractType: response.data.contractType ?? null
    }
    open.value = true
    title.value = "修改合同配置"
  })
}

function submitForm() {
  proxy.$refs.contractRef.validate(valid => {
    if (!valid || submitting.value) {
      return
    }
    const isEdit = form.value.configId != null
    submitting.value = true
    startSubmitTimer()
    const request = isEdit ? updateContract(form.value) : addContract(form.value)
    request.then(response => {
      const deptName = response.data?.deptName
      const successMessage = deptName
        ? `${isEdit ? "修改成功" : "新增成功"}，已识别合同单位：${deptName}`
        : (isEdit ? "修改成功" : "新增成功")
      proxy.$modal.msgSuccess(successMessage)
      open.value = false
      getList()
    }).finally(() => {
      clearSubmitTimer()
      submitting.value = false
    })
  })
}

function handleDelete(row) {
  const configIds = row?.configId || ids.value
  proxy.$modal.confirm("是否确认删除选中的合同配置？").then(() => {
    return delContract(configIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

function handleExport() {
  proxy.download("system/contract/export", {
    ...queryParams.value
  }, `contract_${new Date().getTime()}.xlsx`)
}

getDeptList()
getList()

onBeforeUnmount(() => {
  clearSubmitTimer()
})
</script>

<style scoped>
.contract-submit-status {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  margin: 2px 0 0 100px;
  padding: 10px 14px;
  color: #303133;
  background: #f4f8ff;
  border-left: 3px solid #409eff;
  border-radius: 4px;
}

.contract-submit-status__icon {
  flex: 0 0 auto;
  font-size: 20px;
  color: #409eff;
}

.contract-submit-status__content {
  min-width: 0;
}

.contract-submit-status__title {
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
}

.contract-submit-status__detail {
  margin-top: 2px;
  color: #606266;
  font-size: 12px;
  line-height: 18px;
}

@media (max-width: 768px) {
  .contract-submit-status {
    margin-left: 0;
  }
}
</style>
