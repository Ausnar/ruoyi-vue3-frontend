<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="报警编号" prop="alarmNo">
        <el-input
          v-model="queryParams.alarmNo"
          placeholder="请输入报警编号"
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
      <el-form-item label="灭火器ID" prop="extinguisherId">
        <el-input
          v-model="queryParams.extinguisherId"
          placeholder="请输入灭火器ID"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="所属部门ID" prop="deptId">
        <el-input
          v-model="queryParams.deptId"
          placeholder="请输入所属部门ID"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <!-- (1提醒 2警告 3严重) -->
      <el-form-item label="报警级别" prop="alarmLevel">
        <!-- (1提醒 2警告 3严重) -->
        <el-select v-model="queryParams.alarmLevel" placeholder="请选择报警级别" clearable>
          <el-option
            v-for="dict in fe_alarm_record_alarm_level"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="报警值" prop="alarmValue">
        <el-input
          v-model="queryParams.alarmValue"
          placeholder="请输入报警值"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="报警时间" prop="alarmTime">
        <el-date-picker clearable
          v-model="queryParams.alarmTime"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择报警时间">
        </el-date-picker>
      </el-form-item>
      <!-- (0未处理 1处理中 2已处理 3已忽略) -->
      <el-form-item label="处理状态" prop="handleStatus">
        <!-- (0未处理 1处理中 2已处理 3已忽略) -->
        <el-select v-model="queryParams.handleStatus" placeholder="请选择处理状态" clearable>
          <el-option
            v-for="dict in fe_alarm_record_handle_status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <!-- (0否 1是) -->
      <el-form-item label="是否已通知" prop="isNotified">
        <el-input
          v-model="queryParams.isNotified"
          placeholder="请输入是否已通知(0否 1是)"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="通知时间" prop="notifyTime">
        <el-date-picker clearable
          v-model="queryParams.notifyTime"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择通知时间">
        </el-date-picker>
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
          v-hasPermi="['record:Warning_records:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['record:Warning_records:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['record:Warning_records:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['record:Warning_records:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="Warning_recordsList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="报警ID" align="center" prop="alarmId" />
      <el-table-column label="报警编号" align="center" prop="alarmNo" />
      <el-table-column label="传感器ID" align="center" prop="sensorId" />
      <el-table-column label="灭火器ID" align="center" prop="extinguisherId" />
      <el-table-column label="所属部门ID" align="center" prop="deptId" />
      <!-- (压力异常/温度异常/低电量/离线/过期预警) -->
      <el-table-column label="报警类型" align="center" prop="alarmType" />
      <!-- (1提醒 2警告 3严重) -->
      <el-table-column label="报警级别" align="center" prop="alarmLevel">
        <template #default="scope">
          <dict-tag :options="fe_alarm_record_alarm_level" :value="scope.row.alarmLevel"/>
        </template>
      </el-table-column>
      <el-table-column label="报警内容" align="center" prop="alarmContent" />
      <el-table-column label="报警值" align="center" prop="alarmValue" />
      <el-table-column label="报警时间" align="center" prop="alarmTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.alarmTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <!-- (0未处理 1处理中 2已处理 3已忽略) -->
      <el-table-column label="处理状态" align="center" prop="handleStatus">
        <template #default="scope">
          <dict-tag :options="fe_alarm_record_handle_status" :value="scope.row.handleStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="处理人" align="center" prop="handlePerson" />
      <el-table-column label="处理时间" align="center" prop="handleTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.handleTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="处理结果" align="center" prop="handleResult" />
      <!-- (0否 1是) -->
      <el-table-column label="是否已通知" align="center" prop="isNotified">
        <template #default="scope">
          <dict-tag :options="sys_notice_status" :value="scope.row.isNotified"/>
        </template>
      </el-table-column>
      <el-table-column label="通知时间" align="center" prop="notifyTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.notifyTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['record:Warning_records:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['record:Warning_records:remove']">删除</el-button>
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

    <!-- 添加或修改报警记录对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="Warning_recordsRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="报警编号" prop="alarmNo">
          <el-input v-model="form.alarmNo" placeholder="请输入报警编号" />
        </el-form-item>
        <el-form-item label="传感器ID" prop="sensorId">
          <el-input v-model="form.sensorId" placeholder="请输入传感器ID" />
        </el-form-item>
        <el-form-item label="灭火器ID" prop="extinguisherId">
          <el-input v-model="form.extinguisherId" placeholder="请输入灭火器ID" />
        </el-form-item>
        <el-form-item label="所属部门ID" prop="deptId">
          <el-input v-model="form.deptId" placeholder="请输入所属部门ID" />
        </el-form-item>
        <!-- (1提醒 2警告 3严重) -->
        <el-form-item label="报警级别" prop="alarmLevel">
          <!-- (1提醒 2警告 3严重) -->
          <el-select v-model="form.alarmLevel" placeholder="请选择报警级别">
            <el-option
              v-for="dict in fe_alarm_record_alarm_level"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="报警内容">
          <editor v-model="form.alarmContent" :min-height="192"/>
        </el-form-item>
        <el-form-item label="报警值" prop="alarmValue">
          <el-input v-model="form.alarmValue" placeholder="请输入报警值" />
        </el-form-item>
        <el-form-item label="报警时间" prop="alarmTime">
          <el-date-picker clearable
            v-model="form.alarmTime"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择报警时间">
          </el-date-picker>
        </el-form-item>
        <!-- (0未处理 1处理中 2已处理 3已忽略) -->
        <el-form-item label="处理状态" prop="handleStatus">
          <!-- (0未处理 1处理中 2已处理 3已忽略) -->
          <el-select v-model="form.handleStatus" placeholder="请选择处理状态">
            <el-option
              v-for="dict in fe_alarm_record_handle_status"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="处理结果" prop="handleResult">
          <el-input v-model="form.handleResult" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <!-- (0否 1是) -->
        <el-form-item label="是否已通知" prop="isNotified">
          <el-input v-model="form.isNotified" placeholder="请输入是否已通知(0否 1是)" />
        </el-form-item>
        <el-form-item label="通知时间" prop="notifyTime">
          <el-date-picker clearable
            v-model="form.notifyTime"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择通知时间">
          </el-date-picker>
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

<script setup name="Warning_records">
import { listWarning_records, getWarning_records, delWarning_records, addWarning_records, updateWarning_records } from "@/api/record/Warning_records"

const { proxy } = getCurrentInstance()
const { fe_alarm_record_handle_status, fe_alarm_record_alarm_level } = proxy.useDict('fe_alarm_record_handle_status', 'fe_alarm_record_alarm_level')

const Warning_recordsList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    alarmNo: null,
    sensorId: null,
    extinguisherId: null,
    deptId: null,
    alarmType: null,
    alarmLevel: null,
    alarmContent: null,
    alarmValue: null,
    alarmTime: null,
    handleStatus: null,
    handleResult: null,
    isNotified: null,
    notifyTime: null,
  },
  rules: {
    alarmType: [
      { required: true, message: "报警类型(压力异常/温度异常/低电量/离线/过期预警)不能为空", trigger: "change" }
    ],
    alarmTime: [
      { required: true, message: "报警时间不能为空", trigger: "blur" }
    ],
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询报警记录列表 */
function getList() {
  loading.value = true
  listWarning_records(queryParams.value).then(response => {
    Warning_recordsList.value = response.rows
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
    alarmId: null,
    alarmNo: null,
    sensorId: null,
    extinguisherId: null,
    deptId: null,
    alarmType: null,
    alarmLevel: null,
    alarmContent: null,
    alarmValue: null,
    alarmTime: null,
    handleStatus: null,
    handlePerson: null,
    handleTime: null,
    handleResult: null,
    isNotified: null,
    notifyTime: null,
    createTime: null
  }
  proxy.resetForm("Warning_recordsRef")
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
  ids.value = selection.map(item => item.alarmId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加报警记录"
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const _alarmId = row.alarmId || ids.value
  getWarning_records(_alarmId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改报警记录"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["Warning_recordsRef"].validate(valid => {
    if (valid) {
      if (form.value.alarmId != null) {
        updateWarning_records(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addWarning_records(form.value).then(response => {
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
  const _alarmIds = row.alarmId || ids.value
  proxy.$modal.confirm('是否确认删除报警记录编号为"' + _alarmIds + '"的数据项？').then(function() {
    return delWarning_records(_alarmIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('record/Warning_records/export', {
    ...queryParams.value
  }, `Warning_records_${new Date().getTime()}.xlsx`)
}

getList()
</script>
