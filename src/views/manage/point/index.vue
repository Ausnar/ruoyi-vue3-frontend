<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="消防点编号" prop="firePointCode">
        <el-input
          v-model="queryParams.firePointCode"
          placeholder="请输入消防点编号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="消防点名称" prop="firePointName">
        <el-input
          v-model="queryParams.firePointName"
          placeholder="请输入消防点名称"
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
      <el-form-item label="位置描述" prop="location">
        <el-input
          v-model="queryParams.location"
          placeholder="请输入位置描述"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="楼层" prop="floor">
        <el-input
          v-model="queryParams.floor"
          placeholder="请输入楼层"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="建筑物" prop="building">
        <el-input
          v-model="queryParams.building"
          placeholder="请输入建筑物"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="经度" prop="longitude">
        <el-input
          v-model="queryParams.longitude"
          placeholder="请输入经度"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="纬度" prop="latitude">
        <el-input
          v-model="queryParams.latitude"
          placeholder="请输入纬度"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="负责人" prop="contactPerson">
        <el-input
          v-model="queryParams.contactPerson"
          placeholder="请输入负责人"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="联系电话" prop="contactPhone">
        <el-input
          v-model="queryParams.contactPhone"
          placeholder="请输入联系电话"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="应配灭火器" prop="expectedExtinguisherCount">
        <el-input-number
          v-model="queryParams.expectedExtinguisherCount"
          :min="0"
          :precision="0"
          controls-position="right"
          placeholder="请输入应配数量"
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
      <el-form-item label="显示顺序" prop="sortOrder">
        <el-input
          v-model="queryParams.sortOrder"
          placeholder="请输入显示顺序"
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
          v-hasPermi="['manage:point:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['manage:point:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['manage:point:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['manage:point:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="pointList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="消防点ID" align="center" prop="firePointId" />
      <el-table-column label="消防点编号" align="center" prop="firePointCode" />
      <el-table-column label="消防点名称" align="center" prop="firePointName" />
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
      <!-- 室内/室外/重点区域等 -->
      <el-table-column label="类型" align="center" prop="pointType" />
      <el-table-column label="位置描述" align="center" prop="location" />
      <el-table-column label="楼层" align="center" prop="floor" />
      <el-table-column label="建筑物" align="center" prop="building" />
      <el-table-column label="经度" align="center" prop="longitude" />
      <el-table-column label="纬度" align="center" prop="latitude" />
      <el-table-column label="负责人" align="center" prop="contactPerson" />
      <el-table-column label="联系电话" align="center" prop="contactPhone" />
      <el-table-column label="应配灭火器" align="center" prop="expectedExtinguisherCount" width="110">
        <template #default="scope">
          <span>{{ scope.row.expectedExtinguisherCount ?? '未设置' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="二维码" align="center" prop="qrCode" />
      <el-table-column label="显示顺序" align="center" prop="sortOrder" />
      <!-- 0正常 1停用 -->
      <el-table-column label="状态" align="center" prop="status" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['manage:point:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['manage:point:remove']">删除</el-button>
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

    <!-- 添加或修改消防点信息对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="pointRef" :model="form" :rules="rules" label-width="112px">
        <el-form-item label="消防点编号" prop="firePointCode">
          <el-input v-model="form.firePointCode" placeholder="请输入消防点编号" />
        </el-form-item>
        <el-form-item label="消防点名称" prop="firePointName">
          <el-input v-model="form.firePointName" placeholder="请输入消防点名称" />
        </el-form-item>
        <!-- 关联sys_dept -->
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
        <el-form-item label="位置描述" prop="location">
          <el-input v-model="form.location" placeholder="请输入位置描述" />
        </el-form-item>
        <el-form-item label="楼层" prop="floor">
          <el-input v-model="form.floor" placeholder="请输入楼层" />
        </el-form-item>
        <el-form-item label="建筑物" prop="building">
          <el-input v-model="form.building" placeholder="请输入建筑物" />
        </el-form-item>
        <el-form-item label="经度" prop="longitude">
          <el-input v-model="form.longitude" placeholder="请输入经度" />
        </el-form-item>
        <el-form-item label="纬度" prop="latitude">
          <el-input v-model="form.latitude" placeholder="请输入纬度" />
        </el-form-item>
        <el-form-item label="负责人" prop="contactPerson">
          <el-input v-model="form.contactPerson" placeholder="请输入负责人" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="应配灭火器数量" prop="expectedExtinguisherCount">
          <el-input-number
            v-model="form.expectedExtinguisherCount"
            :min="0"
            :precision="0"
            controls-position="right"
            placeholder="请输入应配灭火器数量"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="二维码" prop="qrCode">
          <el-input v-model="form.qrCode" placeholder="请输入二维码" />
        </el-form-item>
        <el-form-item label="显示顺序" prop="sortOrder">
          <el-input v-model="form.sortOrder" placeholder="请输入显示顺序" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <!-- 0存在 2删除 -->
        <el-form-item label="删除标志" prop="delFlag">
          <el-input v-model="form.delFlag" placeholder="请输入删除标志" />
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

<script setup name="Point">
import { listPoint, getPoint, delPoint, addPoint, updatePoint } from "@/api/manage/point"
import { deptTreeSelect } from "@/api/system/user"

const { proxy } = getCurrentInstance()

const pointList = ref([])
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
    firePointCode: null,
    firePointName: null,
    deptId: null,
    pointType: null,
    location: null,
    floor: null,
    building: null,
    longitude: null,
    latitude: null,
    contactPerson: null,
    contactPhone: null,
    expectedExtinguisherCount: null,
    qrCode: null,
    sortOrder: null,
    status: null,
  },
  rules: {
    firePointCode: [
      { required: true, message: "消防点编号不能为空", trigger: "blur" }
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

/** 查询消防点信息列表 */
function getList() {
  loading.value = true
  listPoint(queryParams.value).then(response => {
    pointList.value = response.rows
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
    firePointId: null,
    firePointCode: null,
    firePointName: null,
    deptId: null,
    pointType: null,
    location: null,
    floor: null,
    building: null,
    longitude: null,
    latitude: null,
    contactPerson: null,
    contactPhone: null,
    expectedExtinguisherCount: null,
    qrCode: null,
    sortOrder: null,
    status: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    delFlag: null
  }
  proxy.resetForm("pointRef")
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
  ids.value = selection.map(item => item.firePointId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加消防点信息"
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const _firePointId = row.firePointId || ids.value
  getPoint(_firePointId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改消防点信息"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["pointRef"].validate(valid => {
    if (valid) {
      if (form.value.firePointId != null) {
        updatePoint(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addPoint(form.value).then(response => {
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
  const _firePointIds = row.firePointId || ids.value
  proxy.$modal.confirm('是否确认删除消防点信息编号为"' + _firePointIds + '"的数据项？').then(function() {
    return delPoint(_firePointIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('manage/point/export', {
    ...queryParams.value
  }, `point_${new Date().getTime()}.xlsx`)
}

getList()
getDeptTree()
</script>
