<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="灭火器ID" prop="extinguisherId">
        <el-input
          v-model="queryParams.extinguisherId"
          placeholder="请输入灭火器ID"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="标志铭码" prop="labelCode">
        <el-input
          v-model="queryParams.labelCode"
          placeholder="请输入标志铭码"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="维护日期" prop="maintenanceDate">
        <el-date-picker clearable
          v-model="queryParams.maintenanceDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择维护日期">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="维护人员" prop="maintenancePerson">
        <el-input
          v-model="queryParams.maintenancePerson"
          placeholder="请输入维护人员"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="维护单位" prop="maintenanceCompany">
        <el-input
          v-model="queryParams.maintenanceCompany"
          placeholder="请输入维护单位"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <!-- (合格/不合格) -->
      <el-form-item label="维护结果" prop="maintenanceResult">
        <el-input
          v-model="queryParams.maintenanceResult"
          placeholder="请输入维护结果"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="维护费用" prop="cost">
        <el-input
          v-model="queryParams.cost"
          placeholder="请输入维护费用"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="下次维护日期" prop="nextMaintenanceDate">
        <el-date-picker clearable
          v-model="queryParams.nextMaintenanceDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择下次维护日期">
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
          v-hasPermi="['record:Inspection_Records:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['record:Inspection_Records:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['record:Inspection_Records:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['record:Inspection_Records:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="Inspection_RecordsList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="记录ID" align="center" prop="recordId" />
      <el-table-column label="灭火器ID" align="center" prop="extinguisherId" />
      <el-table-column label="标志铭码" align="center" prop="labelCode" />
      <!-- (检查/维修/更换/充装) -->
      <el-table-column label="维护类型" align="center" prop="maintenanceType" />
      <el-table-column label="维护日期" align="center" prop="maintenanceDate" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.maintenanceDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="维护人员" align="center" prop="maintenancePerson" />
      <el-table-column label="维护单位" align="center" prop="maintenanceCompany" />
      <!-- (合格/不合格) -->
      <el-table-column label="维护结果" align="center" prop="maintenanceResult" />
      <el-table-column label="问题描述" align="center" prop="problemDesc" />
      <el-table-column label="解决方案" align="center" prop="solution" />
      <el-table-column label="维护费用" align="center" prop="cost" />
      <el-table-column label="下次维护日期" align="center" prop="nextMaintenanceDate" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.nextMaintenanceDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <!-- (照片/文档) -->
      <el-table-column label="附件" align="center" prop="attachments" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['record:Inspection_Records:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['record:Inspection_Records:remove']">删除</el-button>
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

    <!-- 添加或修改灭火器维护记录对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="Inspection_RecordsRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="灭火器ID" prop="extinguisherId">
          <el-input v-model="form.extinguisherId" placeholder="请输入灭火器ID" />
        </el-form-item>
        <el-form-item label="标志铭码" prop="labelCode">
          <el-input v-model="form.labelCode" placeholder="请输入标志铭码" />
        </el-form-item>
        <el-form-item label="维护日期" prop="maintenanceDate">
          <el-date-picker clearable
            v-model="form.maintenanceDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择维护日期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="维护人员" prop="maintenancePerson">
          <el-input v-model="form.maintenancePerson" placeholder="请输入维护人员" />
        </el-form-item>
        <el-form-item label="维护单位" prop="maintenanceCompany">
          <el-input v-model="form.maintenanceCompany" placeholder="请输入维护单位" />
        </el-form-item>
        <!-- (合格/不合格) -->
        <el-form-item label="维护结果" prop="maintenanceResult">
          <el-input v-model="form.maintenanceResult" placeholder="请输入维护结果(合格/不合格)" />
        </el-form-item>
        <el-form-item label="问题描述" prop="problemDesc">
          <el-input v-model="form.problemDesc" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="解决方案" prop="solution">
          <el-input v-model="form.solution" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="维护费用" prop="cost">
          <el-input v-model="form.cost" placeholder="请输入维护费用" />
        </el-form-item>
        <el-form-item label="下次维护日期" prop="nextMaintenanceDate">
          <el-date-picker clearable
            v-model="form.nextMaintenanceDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择下次维护日期">
          </el-date-picker>
        </el-form-item>
        <!-- (照片/文档) -->
        <el-form-item label="附件" prop="attachments">
          <el-input v-model="form.attachments" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
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

<script setup name="Inspection_Records">
import { listInspection_Records, getInspection_Records, delInspection_Records, addInspection_Records, updateInspection_Records } from "@/api/record/Inspection_Records"

const { proxy } = getCurrentInstance()

const Inspection_RecordsList = ref([])
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
    extinguisherId: null,
    labelCode: null,
    maintenanceType: null,
    maintenanceDate: null,
    maintenancePerson: null,
    maintenanceCompany: null,
    maintenanceResult: null,
    problemDesc: null,
    solution: null,
    cost: null,
    nextMaintenanceDate: null,
    attachments: null,
  },
  rules: {
    extinguisherId: [
      { required: true, message: "灭火器ID不能为空", trigger: "blur" }
    ],
    labelCode: [
      { required: true, message: "标志铭码不能为空", trigger: "blur" }
    ],
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询灭火器维护记录列表 */
function getList() {
  loading.value = true
  listInspection_Records(queryParams.value).then(response => {
    Inspection_RecordsList.value = response.rows
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
    recordId: null,
    extinguisherId: null,
    labelCode: null,
    maintenanceType: null,
    maintenanceDate: null,
    maintenancePerson: null,
    maintenanceCompany: null,
    maintenanceResult: null,
    problemDesc: null,
    solution: null,
    cost: null,
    nextMaintenanceDate: null,
    attachments: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null
  }
  proxy.resetForm("Inspection_RecordsRef")
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
  ids.value = selection.map(item => item.recordId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加灭火器维护记录"
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const _recordId = row.recordId || ids.value
  getInspection_Records(_recordId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改灭火器维护记录"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["Inspection_RecordsRef"].validate(valid => {
    if (valid) {
      if (form.value.recordId != null) {
        updateInspection_Records(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addInspection_Records(form.value).then(response => {
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
  const _recordIds = row.recordId || ids.value
  proxy.$modal.confirm('是否确认删除灭火器维护记录编号为"' + _recordIds + '"的数据项？').then(function() {
    return delInspection_Records(_recordIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('record/Inspection_Records/export', {
    ...queryParams.value
  }, `Inspection_Records_${new Date().getTime()}.xlsx`)
}

getList()
</script>
