<template>
  <div class="app-container">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="96px">
      <el-form-item label="目标类型" prop="targetType">
        <el-select v-model="queryParams.targetType" placeholder="请选择目标类型" clearable style="width: 180px">
          <el-option v-for="item in targetTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 180px">
          <el-option v-for="item in sys_normal_disable" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['visit:ownerAssign:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['visit:ownerAssign:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['visit:ownerAssign:remove']">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="assignList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="目标类型" align="center" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.targetType === 'contract_dept' ? 'primary' : 'success'">
            {{ scope.row.targetType === 'contract_dept' ? '合同客户' : '独立客户' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="目标名称" align="center" prop="targetName" min-width="200" show-overflow-tooltip />
      <el-table-column label="负责人" align="center" prop="ownerUserName" min-width="140" />
      <el-table-column label="负责人部门" align="center" prop="ownerDeptName" min-width="180" show-overflow-tooltip />
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="220" show-overflow-tooltip />
      <el-table-column label="更新时间" align="center" prop="updateTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.updateTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="160">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['visit:ownerAssign:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['visit:ownerAssign:remove']">删除</el-button>
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

    <el-dialog :title="title" v-model="open" width="680px" append-to-body>
      <el-form ref="assignRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="目标类型" prop="targetType">
          <el-radio-group v-model="form.targetType" @change="handleTargetTypeChange" :disabled="form.assignId != null">
            <el-radio v-for="item in targetTypeOptions" :key="item.value" :label="item.value">{{ item.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="目标对象" prop="targetId">
          <el-select
            v-if="form.targetType === 'contract_dept'"
            v-model="form.targetId"
            placeholder="请选择合同客户"
            filterable
            clearable
            :disabled="form.assignId != null"
            style="width: 100%"
          >
            <el-option v-for="item in contractOptions" :key="item.deptId" :label="buildContractLabel(item)" :value="item.deptId" />
          </el-select>
          <el-select
            v-else
            v-model="form.targetId"
            placeholder="请选择独立客户"
            filterable
            clearable
            :disabled="form.assignId != null"
            style="width: 100%"
          >
            <el-option v-for="item in customerOptions" :key="item.customerId" :label="buildCustomerLabel(item)" :value="item.customerId" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="ownerUserId">
          <el-select v-model="form.ownerUserId" placeholder="请选择负责人" filterable clearable style="width: 100%">
            <el-option v-for="item in userOptions" :key="item.userId" :label="buildUserLabel(item)" :value="item.userId" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio v-for="item in sys_normal_disable" :key="item.value" :label="item.value">{{ item.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
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

<script setup name="VisitOwnerAssign">
import { listUser } from '@/api/system/user'
import { listVisitCustomer } from '@/api/visit/customer'
import { addOwnerAssign, delOwnerAssign, getOwnerAssign, listOwnerAssign, listOwnerAssignContractOptions, updateOwnerAssign } from '@/api/visit/ownerAssign'

const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')

const targetTypeOptions = [
  { label: '合同客户', value: 'contract_dept' },
  { label: '独立客户', value: 'independent_customer' }
]

const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const assignList = ref([])
const open = ref(false)
const title = ref('')
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const contractOptions = ref([])
const customerOptions = ref([])
const userOptions = ref([])

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    targetType: null,
    status: null
  },
  rules: {
    targetType: [{ required: true, message: '请选择目标类型', trigger: 'change' }],
    targetId: [{ required: true, message: '请选择目标对象', trigger: 'change' }],
    ownerUserId: [{ required: true, message: '请选择负责人', trigger: 'change' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
  }
})

const { form, queryParams, rules } = toRefs(data)

function getList() {
  loading.value = true
  listOwnerAssign(queryParams.value).then(response => {
    assignList.value = response.rows || []
    total.value = response.total || 0
  }).finally(() => {
    loading.value = false
  })
}

function loadOptions() {
  listOwnerAssignContractOptions().then(response => {
    contractOptions.value = response.data || []
  })
  listVisitCustomer({ pageNum: 1, pageSize: 1000, status: '0' }).then(response => {
    customerOptions.value = response.rows || []
  })
  listUser({ pageNum: 1, pageSize: 1000, status: '0' }).then(response => {
    userOptions.value = response.rows || []
  })
}

function reset() {
  form.value = {
    assignId: null,
    targetType: 'contract_dept',
    targetId: null,
    ownerUserId: null,
    status: '0',
    remark: null
  }
  proxy.resetForm('assignRef')
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  handleQuery()
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.assignId)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

function handleAdd() {
  reset()
  title.value = '新增责任分配'
  open.value = true
}

function handleUpdate(row) {
  reset()
  const assignId = row.assignId || ids.value[0]
  getOwnerAssign(assignId).then(response => {
    form.value = { ...response.data }
    title.value = '修改责任分配'
    open.value = true
  })
}

function handleDelete(row) {
  const assignIds = row.assignId || ids.value
  proxy.$modal.confirm('是否确认删除责任分配编号为“' + assignIds + '”的数据项？').then(() => {
    return delOwnerAssign(assignIds)
  }).then(() => {
    proxy.$modal.msgSuccess('删除成功')
    getList()
  }).catch(() => {})
}

function handleTargetTypeChange() {
  form.value.targetId = null
}

function submitForm() {
  proxy.$refs.assignRef.validate(valid => {
    if (!valid) return
    const action = form.value.assignId ? updateOwnerAssign : addOwnerAssign
    action(form.value).then(() => {
      proxy.$modal.msgSuccess(form.value.assignId ? '修改成功' : '新增成功')
      open.value = false
      getList()
    })
  })
}

function cancel() {
  open.value = false
  reset()
}

function buildContractLabel(item) {
  const contractNo = item.contractNo ? ` / 合同号:${item.contractNo}` : ''
  return `${item.deptName}${contractNo}`
}

function buildCustomerLabel(item) {
  const contact = item.contactPerson ? ` / 联系人:${item.contactPerson}` : ''
  return `${item.customerName}${contact}`
}

function buildUserLabel(item) {
  const deptName = item.dept?.deptName || item.deptName
  return deptName ? `${item.nickName || item.userName} / ${deptName}` : (item.nickName || item.userName)
}

loadOptions()
getList()
</script>
