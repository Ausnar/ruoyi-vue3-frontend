<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="88px">
      <el-form-item label="外部单位" prop="externalCompanyName">
        <el-input
          v-model="queryParams.externalCompanyName"
          placeholder="请输入外部单位名称"
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
      <el-form-item label="状态" prop="syncStatus">
        <el-select v-model="queryParams.syncStatus" placeholder="请选择状态" clearable>
          <el-option
            v-for="item in syncStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
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
          v-hasPermi="['manage:companyDeptMapping:add']"
        >新增映射</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['manage:companyDeptMapping:edit']"
        >修改映射</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['manage:companyDeptMapping:remove']"
        >删除映射</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="mappingList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="映射ID" align="center" prop="mappingId" width="88" />
      <el-table-column label="外部公司ID" align="center" prop="externalCompanyId" width="120" />
      <el-table-column label="外部单位" align="center" prop="externalCompanyName" :show-overflow-tooltip="true" min-width="220" />
      <el-table-column label="归属单位" align="center" prop="deptName" :show-overflow-tooltip="true" min-width="180">
        <template #default="scope">
          <span>{{ scope.row.deptName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="syncStatus" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.syncStatus === 'active' ? 'success' : 'info'">
            {{ syncStatusLabel(scope.row.syncStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" min-width="180" />
      <el-table-column label="更新时间" align="center" prop="updateTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.updateTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['manage:companyDeptMapping:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['manage:companyDeptMapping:remove']">删除</el-button>
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
      <el-form ref="mappingRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="外部单位" prop="externalCompanyId">
          <el-select
            v-model="form.externalCompanyId"
            filterable
            placeholder="请选择外部单位"
            style="width: 100%"
            @visible-change="handleExternalCompanyVisible"
            @change="handleExternalCompanyChange"
          >
            <el-option
              v-for="item in externalCompanyOptions"
              :key="item.externalCompanyId"
              :label="buildExternalCompanyLabel(item)"
              :value="item.externalCompanyId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="归属单位" prop="deptId">
          <el-tree-select
            v-model="form.deptId"
            :data="deptOptions"
            :props="{ value: 'id', label: 'label', children: 'children' }"
            value-key="id"
            placeholder="请选择归属单位"
            clearable
            check-strictly
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="syncStatus">
          <el-select v-model="form.syncStatus" placeholder="请选择状态" style="width: 100%">
            <el-option
              v-for="item in syncStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
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

<script setup name="CompanyDeptMapping">
import { useRoute } from "vue-router"
import { deptTreeSelect } from "@/api/system/user"
import {
  listCompanyDeptMapping,
  getCompanyDeptMapping,
  addCompanyDeptMapping,
  updateCompanyDeptMapping,
  delCompanyDeptMapping,
  listExternalCompanies
} from "@/api/manage/companyDeptMapping"

const { proxy } = getCurrentInstance()
const route = useRoute()

const mappingList = ref([])
const externalCompanyOptions = ref([])
const deptOptions = ref([])
const loading = ref(false)
const showSearch = ref(true)
const open = ref(false)
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")
const ids = ref([])

const syncStatusOptions = [
  { label: "启用", value: "active" },
  { label: "停用", value: "disabled" }
]

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    externalCompanyId: null,
    externalCompanyName: null,
    deptId: null,
    syncStatus: null
  },
  rules: {
    externalCompanyId: [
      { required: true, message: "请选择外部单位", trigger: "change" }
    ],
    deptId: [
      { required: true, message: "请选择归属单位", trigger: "change" }
    ],
    syncStatus: [
      { required: true, message: "请选择状态", trigger: "change" }
    ]
  }
})

const { form, queryParams, rules } = toRefs(data)

function getList() {
  loading.value = true
  listCompanyDeptMapping(queryParams.value).then(response => {
    mappingList.value = response.rows
    total.value = response.total
  }).finally(() => {
    loading.value = false
  })
}

function getDeptTree() {
  deptTreeSelect().then(response => {
    deptOptions.value = response.data
  })
}

function getExternalCompanyOptions() {
  return listExternalCompanies({}).then(response => {
    externalCompanyOptions.value = response.data || []
  })
}

function reset() {
  form.value = {
    mappingId: null,
    externalCompanyId: null,
    externalCompanyName: null,
    deptId: null,
    syncStatus: "active",
    remark: null
  }
  proxy.resetForm("mappingRef")
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
  ids.value = selection.map(item => item.mappingId)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

function handleAdd() {
  reset()
  getExternalCompanyOptions()
  open.value = true
  title.value = "新增外部公司映射"
}

function handleUpdate(row) {
  reset()
  getExternalCompanyOptions().then(() => {
    const mappingId = row.mappingId || ids.value[0]
    getCompanyDeptMapping(mappingId).then(response => {
      form.value = {
        ...response.data,
        syncStatus: response.data.syncStatus || "active"
      }
      open.value = true
      title.value = "修改外部公司映射"
    })
  })
}

function handleDelete(row) {
  const mappingIds = row.mappingId || ids.value
  proxy.$modal.confirm('是否确认删除映射编号为 "' + mappingIds + '" 的数据项？').then(function() {
    return delCompanyDeptMapping(mappingIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

function handleExternalCompanyVisible(visible) {
  if (visible && externalCompanyOptions.value.length === 0) {
    getExternalCompanyOptions()
  }
}

function handleExternalCompanyChange(value) {
  const selected = externalCompanyOptions.value.find(item => item.externalCompanyId === value)
  form.value.externalCompanyName = selected ? selected.externalCompanyName : null
}

function syncStatusLabel(value) {
  const matched = syncStatusOptions.find(item => item.value === value)
  return matched ? matched.label : (value || '-')
}

function buildExternalCompanyLabel(item) {
  const sourceDept = item.lastSourceDeptName ? ` / 来源单位：${item.lastSourceDeptName}` : ""
  return `${item.externalCompanyName} (${item.externalCompanyId})${sourceDept}`
}

function submitForm() {
  proxy.$refs["mappingRef"].validate(valid => {
    if (!valid) return
    const action = form.value.mappingId ? updateCompanyDeptMapping : addCompanyDeptMapping
    action(form.value).then(() => {
      proxy.$modal.msgSuccess(form.value.mappingId ? "修改成功" : "新增成功")
      open.value = false
      getList()
    })
  })
}

function cancel() {
  open.value = false
  reset()
}

getList()
getDeptTree()
getExternalCompanyOptions()

if (route.query.externalCompanyId) {
  queryParams.value.externalCompanyId = route.query.externalCompanyId
  queryParams.value.externalCompanyName = route.query.externalCompanyName || null
  handleQuery()
}
</script>
