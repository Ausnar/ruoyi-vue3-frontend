<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px" style="width: 100%;">
      <el-form-item label="部门名称" prop="deptId">
        <el-tree-select
          v-model="queryParams.deptId"
          :data="deptOptions"
          :props="deptProps"
          placeholder="请选择部门"
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
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
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
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:contract:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:contract:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['system:contract:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="contractList" @selection-change="handleSelectionChange" style="width: 100%;">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="部门名称" align="center" prop="deptName" min-width="150" :show-overflow-tooltip="true" />
      <el-table-column label="合同号" align="center" prop="contractNo" min-width="130" />
      <el-table-column label="API ID" align="center" prop="apiId" min-width="150" />
      <el-table-column label="API KEY" align="center" prop="apiKey" min-width="200">
        <template #default="scope">
          <span v-if="!scope.row.showKey">{{ maskKey(scope.row.apiKey) }}</span>
          <span v-else>{{ scope.row.apiKey }}</span>
          <el-button
            link
            type="primary"
            size="small"
            @click="toggleKeyVisibility(scope.row)"
            style="margin-left: 5px;"
          >
            {{ scope.row.showKey ? '隐藏' : '显示' }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="到期日期" align="center" prop="expireDate" min-width="110">
        <template #default="scope">
          <span>{{ parseTime(scope.row.expireDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="过期状态" align="center" min-width="90">
        <template #default="scope">
          <el-tag v-if="scope.row.expireStatus === '已过期'" type="danger" size="small">已过期</el-tag>
          <el-tag v-else-if="scope.row.expireStatus === '即将过期'" type="warning" size="small">即将过期</el-tag>
          <el-tag v-else-if="scope.row.expireStatus === '正常'" type="success" size="small">正常</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="剩余天数" align="center" min-width="80">
        <template #default="scope">
          <span v-if="scope.row.daysRemaining != null">
            <span :style="{color: scope.row.daysRemaining < 30 ? '#F56C6C' : '#67C23A'}">
              {{ scope.row.daysRemaining }}天
            </span>
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" min-width="70">
        <template #default="scope">
          <el-tag :type="scope.row.status === '1' ? 'success' : 'danger'" size="small">
            {{ scope.row.status === '1' ? '正常' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" min-width="150">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:contract:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:contract:remove']">删除</el-button>
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

    <!-- 添加或修改对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="contractRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="选择部门" prop="deptId">
          <el-tree-select
            v-model="form.deptId"
            :data="deptOptions"
            :props="deptProps"
            placeholder="请选择部门"
            check-strictly
            :disabled="form.configId != null"
            style="width: 100%"
          />
          <span v-if="form.configId != null" style="color: #909399; font-size: 12px; display: block; margin-top: 5px;">
            部门一旦设置后不可修改
          </span>
        </el-form-item>
        <el-form-item label="合同号" prop="contractNo">
          <el-input v-model="form.contractNo" placeholder="请输入合同号" maxlength="50" />
        </el-form-item>
        <el-form-item label="API ID" prop="apiId">
          <el-input v-model="form.apiId" placeholder="请输入API ID" maxlength="100">
            <template #append>
              <el-button @click="generateApiId">自动生成</el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="API KEY" prop="apiKey">
          <el-input v-model="form.apiKey" placeholder="请输入API KEY" maxlength="100" show-password>
            <template #append>
              <el-button @click="generateApiKey">自动生成</el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="到期日期" prop="expireDate">
          <el-date-picker clearable
            v-model="form.expireDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择到期日期"
            style="width: 100%">
          </el-date-picker>
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

// 部门树形选择器的配置
const deptProps = {
  value: 'deptId',    // 修改为 deptId
  label: 'deptName',   // 修改为 deptName
  children: 'children'
}

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    deptId: null,
    contractNo: null,
    status: null,
  },
  rules: {
    deptId: [
      { required: true, message: "请选择部门", trigger: "change" }
    ],
    contractNo: [
      { required: true, message: "合同号不能为空", trigger: "blur" }
    ],
    apiId: [
      { required: true, message: "API ID不能为空", trigger: "blur" }
    ],
    apiKey: [
      { required: true, message: "API KEY不能为空", trigger: "blur" }
    ],
    status: [
      { required: true, message: "状态不能为空", trigger: "change" }
    ]
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询部门列表 */
function getDeptList() {
  listDept().then(response => {
    console.log('部门数据:', response.data) // 调试日志
    deptOptions.value = proxy.handleTree(response.data, "deptId")
    console.log('树形数据:', deptOptions.value) // 调试日志
  }).catch(error => {
    console.error('获取部门列表失败:', error)
    proxy.$modal.msgError("获取部门列表失败")
  })
}

/** 查询合同管理列表 */
function getList() {
  loading.value = true
  listContract(queryParams.value).then(response => {
    contractList.value = response.rows.map(item => {
      return {
        ...item,
        showKey: false
      }
    })
    total.value = response.total
    loading.value = false
  })
}

/** 隐藏KEY显示 */
function maskKey(key) {
  if (!key) return ''
  if (key.length <= 8) return '***'
  return key.substring(0, 4) + '***' + key.substring(key.length - 4)
}

/** 切换KEY显示/隐藏 */
function toggleKeyVisibility(row) {
  row.showKey = !row.showKey
}

/** 生成API ID */
function generateApiId() {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  form.value.apiId = `API-${timestamp}-${random}`
}

/** 生成API KEY */
function generateApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let key = 'KEY-'
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  form.value.apiKey = key
}

// 取消按钮
function cancel() {
  open.value = false
  reset()
}

// 表单重置
function reset() {
  form.value = {
    configId: null,
    deptId: null,
    contractNo: null,
    apiId: null,
    apiKey: null,
    status: '1',
    expireDate: null,
    remark: null
  }
  proxy.resetForm("contractRef")
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.configId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加部门API配置"
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const _configId = row.configId || ids.value
  getContract(_configId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改部门API配置"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["contractRef"].validate(valid => {
    if (valid) {
      if (form.value.configId != null) {
        updateContract(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addContract(form.value).then(response => {
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
  const _configIds = row.configId || ids.value
  proxy.$modal.confirm('是否确认删除所选的配置数据项？').then(function() {
    return delContract(_configIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('system/contract/export', {
    ...queryParams.value
  }, `contract_${new Date().getTime()}.xlsx`)
}

// 初始化
getDeptList()
getList()
</script>