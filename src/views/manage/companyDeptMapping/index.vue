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

    <el-alert
      title="外部单位手工映射已切换为历史只读。当前设备归属和合同授权以 SDK 镜像单位为准。"
      type="info"
      :closable="false"
      class="mb8"
    />

    <el-row :gutter="10" class="mb8">
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="mappingList">
      <el-table-column label="映射ID" align="center" prop="mappingId" width="88" />
      <el-table-column label="外部公司ID" align="center" prop="externalCompanyId" width="120" />
      <el-table-column label="外部单位" align="center" prop="externalCompanyName" :show-overflow-tooltip="true" min-width="220" />
      <el-table-column label="历史映射单位" align="center" prop="deptName" :show-overflow-tooltip="true" min-width="180">
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
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

  </div>
</template>

<script setup name="CompanyDeptMapping">
import { useRoute } from "vue-router"
import { deptTreeSelect } from "@/api/system/user"
import {
  listCompanyDeptMapping
} from "@/api/manage/companyDeptMapping"

const { proxy } = getCurrentInstance()
const route = useRoute()

const mappingList = ref([])
const deptOptions = ref([])
const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)

const syncStatusOptions = [
  { label: "启用", value: "active" },
  { label: "停用", value: "disabled" }
]

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    externalCompanyId: null,
    externalCompanyName: null,
    deptId: null,
    syncStatus: null
  }
})

const { queryParams } = toRefs(data)

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

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

function syncStatusLabel(value) {
  const matched = syncStatusOptions.find(item => item.value === value)
  return matched ? matched.label : (value || '-')
}

getList()
getDeptTree()

if (route.query.externalCompanyId) {
  queryParams.value.externalCompanyId = route.query.externalCompanyId
  queryParams.value.externalCompanyName = route.query.externalCompanyName || null
  handleQuery()
}
</script>
