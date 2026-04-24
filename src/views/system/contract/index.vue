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

    <el-dialog :title="title" v-model="open" width="640px" append-to-body>
      <el-form ref="contractRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="合同单位" prop="deptId">
          <el-tree-select
            v-model="form.deptId"
            :data="deptOptions"
            :props="deptProps"
            placeholder="请选择合同单位"
            check-strictly
            :disabled="form.configId != null"
            style="width: 100%"
          />
          <span v-if="form.configId != null" class="form-tip">合同单位创建后不可修改</span>
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
          <el-input v-model="form.apiId" placeholder="请输入 API ID" maxlength="100">
            <template #append>
              <el-button @click="generateApiId">自动生成</el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="API KEY" prop="apiKey">
          <el-input v-model="form.apiKey" placeholder="请输入 API KEY" maxlength="100" show-password>
            <template #append>
              <el-button @click="generateApiKey">自动生成</el-button>
            </template>
          </el-input>
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
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
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
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")
const deptOptions = ref([])

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
    deptId: [
      { required: true, message: "请选择合同单位", trigger: "change" }
    ],
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

function generateApiId() {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  form.value.apiId = `API-${timestamp}-${random}`
}

function generateApiKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let key = "KEY-"
  for (let i = 0; i < 32; i += 1) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  form.value.apiKey = key
}

function cancel() {
  open.value = false
  reset()
}

function reset() {
  form.value = {
    configId: null,
    deptId: null,
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
    if (!valid) {
      return
    }
    const request = form.value.configId != null ? updateContract(form.value) : addContract(form.value)
    request.then(() => {
      proxy.$modal.msgSuccess(form.value.configId != null ? "修改成功" : "新增成功")
      open.value = false
      getList()
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
</script>

<style scoped>
.form-tip {
  color: #909399;
  font-size: 12px;
  display: block;
  margin-top: 5px;
}
</style>
