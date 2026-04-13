<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="传感器编号" prop="sensorCode">
        <el-input
          v-model="queryParams.sensorCode"
          placeholder="请输入传感器编号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <!-- 关联sys_dept -->
      <el-form-item label="所属部门" prop="deptId">
        <el-tree-select
          v-model="queryParams.deptId"
          :data="deptOptions"
          :props="{ value: 'id', label: 'label', children: 'children' }"
          value-key="id"
          placeholder="请选择所属部门"
          clearable
          check-strictly
        />
      </el-form-item>
      <el-form-item label="网关编号" prop="gatewayCode">
        <el-input
          v-model="queryParams.gatewayCode"
          placeholder="请输入网关编号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="压力值" prop="pressure">
        <el-input
          v-model="queryParams.pressure"
          placeholder="请输入压力值(MPa)"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="温度值" prop="temperature">
        <el-input
          v-model="queryParams.temperature"
          placeholder="请输入温度值(℃)"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="电量" prop="batteryLevel">
        <el-input
          v-model="queryParams.batteryLevel"
          placeholder="请输入电量(%)"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="最后在线时间" prop="lastOnlineTime">
        <el-date-picker clearable
          v-model="queryParams.lastOnlineTime"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择最后在线时间">
        </el-date-picker>
      </el-form-item>
      <!-- 0正常 1异常 2离线 -->
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option
            v-for="dict in sys_job_status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
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
          v-hasPermi="['manage:sensor:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['manage:sensor:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['manage:sensor:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['manage:sensor:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="sensorList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="传感器ID" align="center" prop="sensorId" />
      <el-table-column label="传感器编号" align="center" prop="sensorCode" />
      <!-- 关联sys_dept -->
      <el-table-column label="外部单位" align="center" prop="externalCompanyName" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ scope.row.externalCompanyName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="归属单位" align="center" prop="deptName" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ scope.row.deptName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="网关编号" align="center" prop="gatewayCode" />
      <el-table-column label="压力值(MPa)" align="center" prop="pressure" />
      <el-table-column label="温度值(℃)" align="center" prop="temperature" />
      <el-table-column label="电量(%)" align="center" prop="batteryLevel" />
      <el-table-column label="最后在线时间" align="center" prop="lastOnlineTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.lastOnlineTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <!-- 0正常 1异常 2离线 -->
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :options="sys_job_status" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['manage:sensor:edit']">修改</el-button>
          <el-button link type="success" icon="TrendCharts" @click="handleHistory(scope.row)" v-hasPermi="['manage:sensor:query']">历史</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['manage:sensor:remove']">删除</el-button>
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

    <!-- 添加或修改传感器管理对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="sensorRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="传感器编号" prop="sensorCode">
          <el-input v-model="form.sensorCode" placeholder="请输入传感器编号" />
        </el-form-item>
        <el-form-item label="所属部门" prop="deptId">
          <el-tree-select
            v-model="form.deptId"
            :data="deptOptions"
            :props="{ value: 'id', label: 'label', children: 'children' }"
            value-key="id"
            placeholder="请选择所属部门"
            clearable
            check-strictly
          />
        </el-form-item>
        <el-form-item label="网关编号" prop="gatewayCode">
          <el-input v-model="form.gatewayCode" placeholder="请输入网关编号" />
        </el-form-item>
        <el-form-item label="压力值(MPa)" prop="pressure">
          <el-input v-model="form.pressure" placeholder="请输入压力值(MPa)" />
        </el-form-item>
        <el-form-item label="温度值(℃)" prop="temperature">
          <el-input v-model="form.temperature" placeholder="请输入温度值(℃)" />
        </el-form-item>
        <el-form-item label="电量(%)" prop="batteryLevel">
          <el-input v-model="form.batteryLevel" placeholder="请输入电量(%)" />
        </el-form-item>
        <el-form-item label="最后在线时间" prop="lastOnlineTime">
          <el-date-picker clearable
            v-model="form.lastOnlineTime"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择最后在线时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="状态(0正常 1异常 2离线)" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio
              v-for="dict in sys_job_status"
              :key="dict.value"
              :label="dict.value"
            >{{dict.label}}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="删除标志(0存在 2删除)" prop="delFlag">
          <el-input v-model="form.delFlag" placeholder="请输入删除标志(0存在 2删除)" />
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

<script setup name="Sensor">
import { listSensor, getSensor, delSensor, addSensor, updateSensor } from "@/api/manage/sensor"
import { deptTreeSelect } from "@/api/system/user"
import router from "@/router"

const { proxy } = getCurrentInstance()
const { sys_job_status } = proxy.useDict('sys_job_status')

const sensorList = ref([])
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
    sensorCode: null,
    deptId: null,
    gatewayCode: null,
    pressure: null,
    temperature: null,
    batteryLevel: null,
    lastOnlineTime: null,
    status: null,
  },
  rules: {
    sensorCode: [
      { required: true, message: "传感器编号不能为空", trigger: "blur" }
    ],
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询部门下拉树结构 */
function getDeptTree() {
  deptTreeSelect().then(response => {
    deptOptions.value = response.data
  })
}

/** 查询传感器管理列表 */
function getList() {
  loading.value = true
  listSensor(queryParams.value).then(response => {
    sensorList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

// 取消按钮
function cancel() {
  open.value = false
  reset()
}

// 表单重置
function reset() {
  form.value = {
    sensorId: null,
    sensorCode: null,
    deptId: null,
    gatewayCode: null,
    pressure: null,
    temperature: null,
    batteryLevel: null,
    lastOnlineTime: null,
    status: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    delFlag: null
  }
  proxy.resetForm("sensorRef")
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
  ids.value = selection.map(item => item.sensorId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加传感器管理"
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const _sensorId = row.sensorId || ids.value
  getSensor(_sensorId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改传感器管理"
  })
}

/** 历史数据按钮操作 */
function handleHistory(row) {
  router.push({
    path: '/fire/sensor/history',
    query: { sensorId: row.sensorId, sensorCode: row.sensorCode }
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["sensorRef"].validate(valid => {
    if (valid) {
      if (form.value.sensorId != null) {
        updateSensor(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addSensor(form.value).then(response => {
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
  const _sensorIds = row.sensorId || ids.value
  proxy.$modal.confirm('是否确认删除传感器管理编号为"' + _sensorIds + '"的数据项？').then(function() {
    return delSensor(_sensorIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('manage/sensor/export', {
    ...queryParams.value
  }, `sensor_${new Date().getTime()}.xlsx`)
}

getList()
getDeptTree()
</script>
