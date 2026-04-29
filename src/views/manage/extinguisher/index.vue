<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="生产日期" prop="productionDate">
        <el-date-picker
          v-model="queryParams.productionDate"
          clearable
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择生产日期"
        />
      </el-form-item>
      <el-form-item label="检验日期" prop="inspectionDate">
        <el-date-picker
          v-model="queryParams.inspectionDate"
          clearable
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择检验日期"
        />
      </el-form-item>
      <el-form-item label="有效期至" prop="expiryDate">
        <el-date-picker
          v-model="queryParams.expiryDate"
          clearable
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择有效期至"
        />
      </el-form-item>
      <el-form-item label="报废日期" prop="scrapDate">
        <el-date-picker
          v-model="queryParams.scrapDate"
          clearable
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择报废日期"
        />
      </el-form-item>
      <el-form-item label="归属地区" prop="deptRegion">
        <el-cascader
          v-model="queryParams.deptRegion"
          :options="regionData"
          :props="{ checkStrictly: true }"
          placeholder="请选择归属地区"
          clearable
          style="width: 220px"
          @change="handleDeptRegionChange"
        />
      </el-form-item>
      <el-form-item label="所属单位" prop="deptId">
        <el-tree-select
          v-model="queryParams.deptId"
          :data="deptOptions"
          :props="{ value: 'id', label: 'label', children: 'children' }"
          value-key="id"
          placeholder="请选择所属单位"
          clearable
          check-strictly
        />
      </el-form-item>
      <el-form-item label="标志明码" prop="labelCode">
        <el-input
          v-model="queryParams.labelCode"
          placeholder="请输入标志明码"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="规格型号" prop="specification">
        <el-input
          v-model="queryParams.specification"
          placeholder="请输入规格型号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="传感器ID" prop="sensorId">
        <el-input
          v-model="queryParams.sensorId"
          placeholder="请输入传感器ID"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="传感器编号" prop="sensorCode">
        <el-input
          v-model="queryParams.sensorCode"
          placeholder="请输入传感器编号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="产品名称" prop="productName">
        <el-input
          v-model="queryParams.productName"
          placeholder="请输入产品名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="生产厂家" prop="manufacturer">
        <el-input
          v-model="queryParams.manufacturer"
          placeholder="请输入生产厂家"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="服务商" prop="serviceProvider">
        <el-input
          v-model="queryParams.serviceProvider"
          placeholder="请输入服务商"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="消防点ID" prop="firePointId">
        <el-input
          v-model="queryParams.firePointId"
          placeholder="请输入消防点ID"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="安装位置" prop="installLocation">
        <el-input
          v-model="queryParams.installLocation"
          placeholder="请输入安装位置"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="二维码" prop="qrCode">
        <el-input
          v-model="queryParams.qrCode"
          placeholder="请输入二维码"
          clearable
          @keyup.enter="handleQuery"
        />
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
      <el-table-column label="外部单位" align="center" prop="externalCompanyName" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ scope.row.externalCompanyName || '-' }}</span>
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
      <el-table-column label="灭火器ID" align="center" prop="extinguisherId" />
      <el-table-column label="标志明码" align="center" prop="labelCode" />
      <el-table-column label="规格型号" align="center" prop="specification" />
      <el-table-column label="传感器ID" align="center" prop="sensorId" />
      <el-table-column label="传感器编号" align="center" prop="sensorCode" />
      <el-table-column label="产品名称" align="center" prop="productName" />
      <el-table-column label="生产厂家" align="center" prop="manufacturer" />
      <el-table-column label="服务商" align="center" prop="serviceProvider" />
      <el-table-column label="生产日期" align="center" prop="productionDate" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.productionDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="检验日期" align="center" prop="inspectionDate" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.inspectionDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="有效期至" align="center" prop="expiryDate" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.expiryDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="报废日期" align="center" prop="scrapDate" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.scrapDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="消防点ID" align="center" prop="firePointId" />
      <el-table-column label="安装位置" align="center" prop="installLocation" />
      <el-table-column label="二维码" align="center" prop="qrCode" />
      <el-table-column label="状态" align="center" prop="status" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['manage:extinguisher:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['manage:extinguisher:remove']">删除</el-button>
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

    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="extinguisherRef" :model="form" :rules="rules" label-width="88px">
        <el-form-item label="标志明码" prop="labelCode">
          <el-input v-model="form.labelCode" placeholder="请输入标志明码" />
        </el-form-item>
        <el-form-item label="规格型号" prop="specification">
          <el-input v-model="form.specification" placeholder="请输入规格型号" />
        </el-form-item>
        <el-form-item label="传感器ID" prop="sensorId">
          <el-input v-model="form.sensorId" placeholder="请输入传感器ID" />
        </el-form-item>
        <el-form-item label="传感器编号" prop="sensorCode">
          <el-input v-model="form.sensorCode" placeholder="请输入传感器编号" />
        </el-form-item>
        <el-form-item label="所属单位" prop="deptId">
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
        <el-form-item label="产品名称" prop="productName">
          <el-input v-model="form.productName" placeholder="请输入产品名称" />
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
        <el-form-item label="检验日期" prop="inspectionDate">
          <el-date-picker
            v-model="form.inspectionDate"
            clearable
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择检验日期"
          />
        </el-form-item>
        <el-form-item label="有效期至" prop="expiryDate">
          <el-date-picker
            v-model="form.expiryDate"
            clearable
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择有效期至"
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
        <el-form-item label="消防点ID" prop="firePointId">
          <el-input v-model="form.firePointId" placeholder="请输入消防点ID" />
        </el-form-item>
        <el-form-item label="安装位置" prop="installLocation">
          <el-input v-model="form.installLocation" placeholder="请输入安装位置" />
        </el-form-item>
        <el-form-item label="二维码" prop="qrCode">
          <el-input v-model="form.qrCode" placeholder="请输入二维码" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
        <el-form-item label="删除标志" prop="delFlag">
          <el-input v-model="form.delFlag" placeholder="请输入删除标志" />
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
<script setup name="Extinguisher">
import { listExtinguisher, getExtinguisher, delExtinguisher, addExtinguisher, updateExtinguisher } from "@/api/manage/extinguisher"
import { deptTreeSelect } from "@/api/system/user"
import { regionData } from "@/utils/regionData"

const { proxy } = getCurrentInstance()

const extinguisherList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")
const deptOptions = ref([])

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    labelCode: null,
    specification: null,
    sensorId: null,
    sensorCode: null,
    deptId: null,
    deptRegion: [],
    deptProvince: null,
    deptCity: null,
    deptArea: null,
    productName: null,
    manufacturer: null,
    serviceProvider: null,
    productionDate: null,
    inspectionDate: null,
    expiryDate: null,
    scrapDate: null,
    firePointId: null,
    installLocation: null,
    qrCode: null,
    status: null,
  },
  rules: {
    labelCode: [
      { required: true, message: "标志明码(唯一标识)不能为空", trigger: "blur" }
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
  return params
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
    installLocation: null,
    qrCode: null,
    status: null,
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

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const _extinguisherId = row.extinguisherId || ids.value
  getExtinguisher(_extinguisherId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改灭火器信息"
  })
}

/** 提交按钮 */
function submitForm() {
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

getList()
getDeptTree()
</script>
