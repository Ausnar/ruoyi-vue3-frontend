<template>
  <div class="app-container">
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="待审批" name="pending" />
      <el-tab-pane label="已处理" name="processed" />
    </el-tabs>

    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="88px">
      <el-form-item label="拜访单号" prop="visitNo">
        <el-input v-model="queryParams.visitNo" placeholder="请输入拜访单号" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="客户名称" prop="customerNameSnapshot">
        <el-input v-model="queryParams.customerNameSnapshot" placeholder="请输入客户名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="客户类型" prop="customerType">
        <el-select v-model="queryParams.customerType" placeholder="请选择客户类型" clearable style="width: 180px">
          <el-option v-for="item in fe_visit_customer_type" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />

    <el-table v-loading="loading" :data="applyList">
      <el-table-column label="拜访单号" align="center" prop="visitNo" width="150" />
      <el-table-column label="申请部门" align="center" prop="applicantDeptName" min-width="160" show-overflow-tooltip />
      <el-table-column label="申请人" align="center" prop="applicantUserName" width="120" />
      <el-table-column label="客户类型" align="center" prop="customerType" width="120">
        <template #default="scope">
          <dict-tag :options="fe_visit_customer_type" :value="scope.row.customerType" />
        </template>
      </el-table-column>
      <el-table-column label="客户名称" align="center" prop="customerNameSnapshot" min-width="180" show-overflow-tooltip />
      <el-table-column label="计划时间" align="center" min-width="320">
        <template #default="scope">
          <span>{{ parseTime(scope.row.plannedStartTime, '{y}-{m}-{d} {h}:{i}:{s}') }} ~ {{ parseTime(scope.row.plannedEndTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="120">
        <template #default="scope">
          <dict-tag :options="fe_visit_apply_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="审批权限" align="center" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.canApprove ? 'success' : 'info'">{{ scope.row.canApprove ? '可审批' : '只读' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="220">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleView(scope.row)">详情</el-button>
          <el-button
            v-if="scope.row.canApprove && scope.row.status === 'pending_approve'"
            link
            type="success"
            icon="Select"
            @click="handleAudit(scope.row, 'approve')"
            v-hasPermi="['visit:apply:approve']"
          >通过</el-button>
          <el-button
            v-if="scope.row.canApprove && scope.row.status === 'pending_approve'"
            link
            type="danger"
            icon="CloseBold"
            @click="handleAudit(scope.row, 'reject')"
            v-hasPermi="['visit:apply:reject']"
          >驳回</el-button>
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

    <el-dialog title="拜访审批详情" v-model="detailOpen" width="920px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="拜访单号">{{ detailForm.visitNo }}</el-descriptions-item>
        <el-descriptions-item label="状态"><dict-tag :options="fe_visit_apply_status" :value="detailForm.status" /></el-descriptions-item>
        <el-descriptions-item label="申请部门">{{ detailForm.applicantDeptName }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ detailForm.applicantUserName }}</el-descriptions-item>
        <el-descriptions-item label="客户类型"><dict-tag :options="fe_visit_customer_type" :value="detailForm.customerType" /></el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ detailForm.customerNameSnapshot }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ detailForm.contactPersonSnapshot || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ detailForm.contactPhoneSnapshot || '-' }}</el-descriptions-item>
        <el-descriptions-item label="计划时间" :span="2">{{ detailPlanTime }}</el-descriptions-item>
        <el-descriptions-item label="拜访地址" :span="2">{{ detailForm.visitAddress || '-' }}</el-descriptions-item>
        <el-descriptions-item label="拜访事由" :span="2">{{ detailForm.visitReason || '-' }}</el-descriptions-item>
        <el-descriptions-item label="拜访目标" :span="2">{{ detailForm.visitTarget || '-' }}</el-descriptions-item>
        <el-descriptions-item label="同行人员" :span="2">{{ detailForm.companionMembers || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审批意见" :span="2">{{ detailForm.approveComment || '-' }}</el-descriptions-item>
        <el-descriptions-item label="结果说明" :span="2">{{ detailForm.resultDesc || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div class="log-section">
        <div class="section-title">流转日志</div>
        <el-table :data="logList" size="small" border>
          <el-table-column label="时间" prop="actionTime" width="180">
            <template #default="scope">
              <span>{{ parseTime(scope.row.actionTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
            </template>
          </el-table-column>
          <el-table-column label="动作" prop="actionType" width="120" />
          <el-table-column label="操作人" prop="operatorUserName" width="120" />
          <el-table-column label="状态流转" min-width="180">
            <template #default="scope">
              <span>{{ scope.row.fromStatus || '-' }} -> {{ scope.row.toStatus || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="说明" prop="actionComment" min-width="220" show-overflow-tooltip />
        </el-table>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button v-if="detailForm.canApprove && detailForm.status === 'pending_approve'" type="success" @click="handleAudit(detailForm, 'approve')">审批通过</el-button>
          <el-button v-if="detailForm.canApprove && detailForm.status === 'pending_approve'" type="danger" @click="handleAudit(detailForm, 'reject')">审批驳回</el-button>
          <el-button @click="detailOpen = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="VisitApprove">
import { ElMessageBox } from 'element-plus'
import { approveVisitApply, getVisitApply, getVisitApplyLogs, listApproveVisitApply, rejectVisitApply } from '@/api/visit/apply'

const { proxy } = getCurrentInstance()
const { fe_visit_customer_type, fe_visit_apply_status } = proxy.useDict('fe_visit_customer_type', 'fe_visit_apply_status')

const activeTab = ref('pending')
const applyList = ref([])
const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const detailOpen = ref(false)
const detailForm = ref({})
const logList = ref([])

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  visitNo: null,
  customerNameSnapshot: null,
  customerType: null,
  status: 'pending_approve',
  excludeStatus: null
})

const detailPlanTime = computed(() => {
  if (!detailForm.value.plannedStartTime) return '-'
  return `${proxy.parseTime(detailForm.value.plannedStartTime, '{y}-{m}-{d} {h}:{i}:{s}')} ~ ${proxy.parseTime(detailForm.value.plannedEndTime, '{y}-{m}-{d} {h}:{i}:{s}')}`
})

function getList() {
  loading.value = true
  listApproveVisitApply(queryParams).then(response => {
    applyList.value = response.rows
    total.value = response.total
  }).finally(() => {
    loading.value = false
  })
}

function handleTabChange(tabName) {
  if (tabName === 'pending') {
    queryParams.status = 'pending_approve'
    queryParams.excludeStatus = null
  } else {
    queryParams.status = null
    queryParams.excludeStatus = 'pending_approve'
  }
  queryParams.pageNum = 1
  getList()
}

function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  handleTabChange(activeTab.value)
}

function handleView(row) {
  Promise.all([getVisitApply(row.visitId), getVisitApplyLogs(row.visitId)]).then(([detailResp, logResp]) => {
    detailForm.value = detailResp.data || {}
    logList.value = logResp.data || []
    detailOpen.value = true
  })
}

function handleAudit(row, action) {
  const actionText = action === 'approve' ? '审批通过' : '审批驳回'
  ElMessageBox.prompt(`请输入${actionText}说明`, actionText, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputType: 'textarea',
    inputValue: row.approveComment || ''
  }).then(({ value }) => {
    const request = { approveComment: value }
    const api = action === 'approve' ? approveVisitApply : rejectVisitApply
    return api(row.visitId, request)
  }).then(() => {
    proxy.$modal.msgSuccess(actionText + '成功')
    detailOpen.value = false
    getList()
  }).catch(() => {})
}

getList()
</script>

<style scoped>
.log-section {
  margin-top: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}
</style>
