<script setup lang="ts">
interface WorkOrderDetail {
  id: number;
  job_code: string;
  job_name: string;
  description: string;
  photo_url: string;
  job_category: string;
  job_type: string;
  is_machinery: number | boolean;
  is_critical: number | boolean;
  is_internal: number | boolean;
  responsible_rank: string;
  estimated_hours: number | string;
  total_budget: number | string;
  total_internal_estimate: number | string;
  specification_group_id: number;
  specification_group_name: string | null;
  specification_group_no: string | null;
  dry_dock_nos?: string;
  vessel_names?: string;
}

interface SubJob {
  id: number;
  description: string;
  sort_order: number;
  is_internal: boolean;
  total_budget: number;
  yard_estimates: number;
  owner_estimate: number;
  internal_comment: string;
  responsible_rank: string;
  quantity: number;
  unit: string;
  account_code: string;
}

const route = useRoute();
const id = Number(route.params.id);
const api = useApi();
const toast = ref("");

const activeTab = ref<"general" | "tasks" | "pos">("general");

const { data: wo, refresh } = await useAsyncData<WorkOrderDetail>(
  `work-order-${id}`,
  () => api.get<WorkOrderDetail>(`/work-orders/${id}`)
);

// Sub Jobs State
const subJobsSearch = ref("");
const showAddSubJobModal = ref(false);
const subJobs = ref<SubJob[]>([
  {
    id: 1,
    description: "HP Walter Cleaning",
    sort_order: 1,
    is_internal: true,
    total_budget: 1200,
    yard_estimates: 0,
    owner_estimate: 300,
    internal_comment: "Comments",
    responsible_rank: "Chief Engineer",
    quantity: 1,
    unit: "PCS",
    account_code: "ABC-123",
  },
  {
    id: 2,
    description: "Flat nnPrice, per m2",
    sort_order: 2,
    is_internal: true,
    total_budget: 2000,
    yard_estimates: 0,
    owner_estimate: 400,
    internal_comment: "Comments",
    responsible_rank: "Chief Engineer",
    quantity: 2,
    unit: "SET",
    account_code: "ABC-123",
  },
  {
    id: 3,
    description: "Vertical Sides, price per m2",
    sort_order: 3,
    is_internal: false,
    total_budget: 2500,
    yard_estimates: 500,
    owner_estimate: 0,
    internal_comment: "Urgent",
    responsible_rank: "Chief Engineer",
    quantity: 3,
    unit: "BOX",
    account_code: "ABC-123",
  },
  {
    id: 4,
    description: "Top Sides , price per m2",
    sort_order: 4,
    is_internal: false,
    total_budget: 2200,
    yard_estimates: 600,
    owner_estimate: 0,
    internal_comment: "Test",
    responsible_rank: "Chief Engineer",
    quantity: 4,
    unit: "BOX",
    account_code: "ABC-123",
  },
]);

const newSubJob = reactive({
  description: "",
  sort_order: 5,
  is_internal: true,
  total_budget: 1500,
  yard_estimates: 0,
  owner_estimate: 350,
  internal_comment: "Routine check",
  responsible_rank: "Chief Engineer",
  quantity: 1,
  unit: "PCS",
  account_code: "ABC-123",
});

const filteredSubJobs = computed(() => {
  const q = subJobsSearch.value.toLowerCase().trim();
  if (!q) return subJobs.value;
  return subJobs.value.filter(
    (sj) =>
      sj.description.toLowerCase().includes(q) ||
      sj.internal_comment.toLowerCase().includes(q) ||
      sj.account_code.toLowerCase().includes(q)
  );
});

// Related Spares
const spares = ref([
  { id: 1, part_no: "SP-8891-A", part_name: "Hydraulic Seal Ring Kit", qty: 4, unit: "SET", unit_price: 180 },
  { id: 2, part_no: "VLV-1029", part_name: "Non-return Valve Disc", qty: 2, unit: "PCS", unit_price: 450 },
]);

const { data: dryDocks } = await useAsyncData<any[]>("dry-docks-list", () =>
  api.get<any[]>("/dry-docks")
);

const showAttachSpecModal = ref(false);
const selectedDryDockId = ref<number | "">("");

function notify(msg: string) {
  toast.value = msg;
  setTimeout(() => (toast.value = ""), 3000);
}

function saveSubJob() {
  if (!newSubJob.description.trim()) {
    notify("Description wajib diisi");
    return;
  }
  subJobs.value.push({
    id: Date.now(),
    ...newSubJob,
  });
  notify("Sub Job berhasil ditambahkan!");
  showAddSubJobModal.value = false;
}

function openAddToSpec() {
  selectedDryDockId.value = dryDocks.value?.[0]?.id || "";
  showAttachSpecModal.value = true;
}

async function submitAddToSpec() {
  if (!selectedDryDockId.value) {
    notify("Pilih Dry Dock terlebih dahulu");
    return;
  }
  try {
    await api.post(`/work-orders/${id}/attach`, { dry_dock_id: selectedDryDockId.value });
    notify(`Work Order "${wo.value?.job_code}" berhasil ditautkan ke Dry Dock!`);
    showAttachSpecModal.value = false;
    await refresh();
  } catch (e: any) {
    notify(e?.data?.message || "Gagal menautkan ke specification");
  }
}

function formatCurrency(val: number | string) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);
}
</script>

<template>
  <div v-if="wo" class="wo-detail-page">
    <!-- Top Bar & Breadcrumb -->
    <div class="detail-top-bar">
      <div class="breadcrumb-row">
        <NuxtLink to="/work-orders" class="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Work Order Master
        </NuxtLink>
        <span class="sep">/</span>
        <span class="current-title">{{ wo.job_name }}</span>
      </div>

      <!-- Segment Tabs -->
      <div class="detail-segment-tabs">
        <button
          class="seg-btn"
          :class="{ active: activeTab === 'general' }"
          @click="activeTab = 'general'"
        >
          General
        </button>
        <button
          class="seg-btn"
          :class="{ active: activeTab === 'tasks' }"
          @click="activeTab = 'tasks'"
        >
          Tasks
        </button>
        <button
          class="seg-btn"
          :class="{ active: activeTab === 'pos' }"
          @click="activeTab = 'pos'"
        >
          Purchase Orders
        </button>
      </div>
    </div>

    <!-- TAB 1: GENERAL -->
    <div v-if="activeTab === 'general'" class="tab-content-area">
      <!-- HERO HEADER CARD -->
      <div class="hero-header-card">
        <div class="hero-top-row">
          <img
            :src="wo.photo_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&auto=format&fit=crop'"
            :alt="wo.job_name"
            class="hero-thumb"
          />

          <div class="hero-main-info">
            <span class="hero-code-tag">{{ wo.job_code }}</span>
            <h1 class="hero-job-title">{{ wo.job_name }}</h1>
            <p class="hero-job-desc">
              {{ wo.description || 'Carry out #1(P/S)WBT inspection where condition of coating, and structural checking inspected. Photos and reports to be filled and submitted to office by uploading it here.' }}
            </p>
          </div>

          <div class="hero-action-wrap">
            <button class="add-spec-btn" @click="openAddToSpec">
              Add to Specification
            </button>
          </div>
        </div>

        <!-- Machinery Meta Row -->
        <div class="machinery-meta-row">
          <div class="meta-item">
            <span class="meta-lbl">Machinery Group</span>
            <span class="meta-val">LIFE SAVING AND FIRE FIGHTING SYSTEM</span>
          </div>
          <div class="meta-item">
            <span class="meta-lbl">Machinery</span>
            <span class="meta-val">Thermal Oil Heater Fuel Oil Booster Pump Motor (109.009.010.001)</span>
          </div>
        </div>
      </div>

      <!-- RESPONSIBLE RANK & COSTS SECTION -->
      <div class="costs-and-rank-section">
        <!-- Responsible Rank Card -->
        <div class="rank-card">
          <span class="card-caption">RESPONSIBLE RANK</span>
          <h3 class="rank-value">{{ wo.responsible_rank || 'Second Engineer' }}</h3>
        </div>

        <!-- Costs Block -->
        <div class="costs-block">
          <h3 class="costs-heading">Costs</h3>
          <div class="cost-cards-row">
            <div class="cost-stat-card">
              <span class="cost-lbl">Total Budget</span>
              <span class="cost-val">{{ formatCurrency(wo.total_budget) }}</span>
            </div>
            <div class="cost-stat-card">
              <span class="cost-lbl">Total Internal Estimate</span>
              <span class="cost-val">{{ formatCurrency(wo.total_internal_estimate) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- DETAILS 3-COLUMN GRID -->
      <div class="details-spec-block">
        <h3 class="block-title">Details</h3>

        <div class="details-grid-3">
          <!-- Col 1 -->
          <div class="detail-field">
            <span class="d-label">Job Category</span>
            <span class="d-value">{{ wo.job_category || 'Check' }}</span>
          </div>
          <div class="detail-field">
            <span class="d-label">Vessel Name</span>
            <span class="d-value">{{ wo.vessel_names || 'SDSD20' }}</span>
          </div>
          <div class="detail-field">
            <span class="d-label">Job Code</span>
            <span class="d-value">{{ wo.job_code }}</span>
          </div>

          <!-- Col 2 -->
          <div class="detail-field">
            <span class="d-label">Job Name</span>
            <span class="d-value">{{ wo.job_name }}</span>
          </div>
          <div class="detail-field">
            <span class="d-label">Critical Job</span>
            <span class="d-value">{{ wo.is_critical ? 'Yes' : 'No' }}</span>
          </div>
          <div class="detail-field">
            <span class="d-label">Internal Job</span>
            <span class="d-value">{{ wo.is_internal ? 'Yes' : 'No' }}</span>
          </div>

          <!-- Col 3 -->
          <div class="detail-field">
            <span class="d-label">Specification Group</span>
            <span class="d-value">{{ wo.specification_group_name || 'General' }}</span>
          </div>
          <div class="detail-field">
            <span class="d-label">Job Type</span>
            <span class="d-value">{{ wo.job_type || 'Dock Job' }}</span>
          </div>
          <div class="detail-field">
            <span class="d-label">Estimated Hours</span>
            <span class="d-value">{{ wo.estimated_hours || 10 }}</span>
          </div>
        </div>
      </div>

      <!-- SUB JOBS SECTION (Image 4) -->
      <div class="sub-jobs-section">
        <div class="sub-jobs-header">
          <h3 class="block-title">Sub Jobs</h3>
          <div class="sub-jobs-tools">
            <div class="mini-search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                v-model="subJobsSearch"
                type="text"
                placeholder="Search"
                class="mini-search-input"
              />
            </div>

            <button class="add-subjob-btn" @click="showAddSubJobModal = true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add
            </button>
          </div>
        </div>

        <!-- Sub Jobs Table -->
        <div class="table-responsive-card">
          <table class="subjobs-table">
            <thead>
              <tr>
                <th style="width: 36px;"></th>
                <th>Description</th>
                <th>Sort Order</th>
                <th>Internal Job</th>
                <th>Total budget</th>
                <th>Yard Estimates</th>
                <th>Owner Estimate</th>
                <th>Internal Comment</th>
                <th>Responsible Rank</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Account Code</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sj in filteredSubJobs" :key="sj.id">
                <td class="num-cell">{{ sj.sort_order }}</td>
                <td class="desc-cell">{{ sj.description }}</td>
                <td>{{ sj.sort_order }}</td>
                <td class="check-cell">
                  <input type="checkbox" :checked="sj.is_internal" @change="sj.is_internal = !sj.is_internal" />
                </td>
                <td>{{ formatCurrency(sj.total_budget) }}</td>
                <td>{{ formatCurrency(sj.yard_estimates) }}</td>
                <td>{{ formatCurrency(sj.owner_estimate) }}</td>
                <td>{{ sj.internal_comment }}</td>
                <td>{{ sj.responsible_rank }}</td>
                <td>{{ sj.quantity }}</td>
                <td>{{ sj.unit }}</td>
                <td>{{ sj.account_code }}</td>
              </tr>
              <tr v-if="!filteredSubJobs.length">
                <td colspan="12" class="empty-cell">Tidak ada Sub Job.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- RELATED SPARES SECTION -->
      <div class="spares-section">
        <div class="sub-jobs-header">
          <h3 class="block-title">Related Spares</h3>
          <button class="add-subjob-btn" @click="notify('Tambah spare part baru...')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add
          </button>
        </div>

        <div class="table-responsive-card">
          <table class="subjobs-table">
            <thead>
              <tr>
                <th>Part No</th>
                <th>Part Name</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sp in spares" :key="sp.id">
                <td><b>{{ sp.part_no }}</b></td>
                <td>{{ sp.part_name }}</td>
                <td>{{ sp.qty }}</td>
                <td>{{ sp.unit }}</td>
                <td>{{ formatCurrency(sp.unit_price) }}</td>
                <td><b>{{ formatCurrency(sp.qty * sp.unit_price) }}</b></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 2: TASKS -->
    <div v-else-if="activeTab === 'tasks'" class="tab-content-area">
      <div class="block-card">
        <h3 class="block-title">Tasks for {{ wo.job_name }}</h3>
        <p style="color: #64748b;">Daftar tugas pemeriksaan dan instalasi teknisi galangan.</p>
        <div class="task-row-item">
          <span class="badge-open">OPEN</span>
          <span>Thickness gauging & visual inspection</span>
          <small>Due: 15 Oct 2026</small>
        </div>
      </div>
    </div>

    <!-- TAB 3: PURCHASE ORDERS -->
    <div v-else-if="activeTab === 'pos'" class="tab-content-area">
      <div class="block-card">
        <h3 class="block-title">Purchase Orders</h3>
        <p style="color: #64748b;">Pesanan suku cadang dan material untuk pekerjaan ini.</p>
        <div class="task-row-item">
          <span class="badge-po">PO-2026-001</span>
          <span>Wartsila Marine - $45,000</span>
          <span class="badge-approved">Approved</span>
        </div>
      </div>
    </div>

    <!-- MODAL: Add Sub Job -->
    <div v-if="showAddSubJobModal" class="modal-overlay" @click.self="showAddSubJobModal = false">
      <div class="modal-card">
        <h3 class="modal-heading">Add Sub Job</h3>

        <label class="form-label">Description <span class="req">*</span></label>
        <input v-model="newSubJob.description" type="text" class="form-input" placeholder="e.g. HP Walter Cleaning" />

        <div class="form-grid">
          <div class="field-col">
            <label class="form-label">Sort Order</label>
            <input v-model.number="newSubJob.sort_order" type="number" class="form-input" />
          </div>

          <div class="field-col">
            <label class="form-label">Total Budget ($)</label>
            <input v-model.number="newSubJob.total_budget" type="number" class="form-input" />
          </div>
        </div>

        <div class="form-grid">
          <div class="field-col">
            <label class="form-label">Yard Estimates ($)</label>
            <input v-model.number="newSubJob.yard_estimates" type="number" class="form-input" />
          </div>

          <div class="field-col">
            <label class="form-label">Owner Estimate ($)</label>
            <input v-model.number="newSubJob.owner_estimate" type="number" class="form-input" />
          </div>
        </div>

        <div class="form-grid">
          <div class="field-col">
            <label class="form-label">Quantity</label>
            <input v-model.number="newSubJob.quantity" type="number" class="form-input" />
          </div>

          <div class="field-col">
            <label class="form-label">Unit</label>
            <input v-model="newSubJob.unit" type="text" class="form-input" placeholder="e.g. PCS, SET" />
          </div>
        </div>

        <label class="form-label">Internal Comment</label>
        <input v-model="newSubJob.internal_comment" type="text" class="form-input" />

        <div class="modal-foot">
          <button class="action-btn primary" @click="saveSubJob">Submit</button>
          <button class="action-btn ghost" @click="showAddSubJobModal = false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- MODAL: Add to Specification / Dry Dock -->
    <div v-if="showAttachSpecModal" class="modal-overlay" @click.self="showAttachSpecModal = false">
      <div class="modal-card">
        <h3 class="modal-heading">Add to Specification</h3>
        <p class="modal-sub">Pilih Dry Dock untuk menautkan pekerjaan: <b>{{ wo.job_name }}</b></p>

        <label class="form-label">Select Dry Dock <span class="req">*</span></label>
        <select v-model="selectedDryDockId" class="form-input">
          <option v-for="dd in dryDocks" :key="dd.id" :value="dd.id">
            {{ dd.dry_dock_no }} - {{ dd.vessel_name }} ({{ dd.shipyard_name || 'No Yard' }})
          </option>
        </select>

        <div class="modal-foot">
          <button class="action-btn primary" @click="submitAddToSpec">Add to Spec</button>
          <button class="action-btn ghost" @click="showAttachSpecModal = false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- TOAST -->
    <div v-if="toast" class="toast-box">{{ toast }}</div>
  </div>
</template>

<style scoped>
.wo-detail-page {
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding-bottom: 80px;
}

/* Breadcrumb & Top Bar */
.detail-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.breadcrumb-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #64748b;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.15s;
}

.back-link:hover {
  color: #29a1ff;
}

.back-link svg {
  width: 18px;
  height: 18px;
}

.sep {
  color: #cbd5e1;
}

.current-title {
  color: #1e293b;
  font-weight: 700;
}

.detail-segment-tabs {
  display: flex;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 4px;
  gap: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.seg-btn {
  background: transparent;
  border: 0;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #475467;
  cursor: pointer;
  transition: all 0.15s;
}

.seg-btn.active {
  background: #29a1ff;
  color: #ffffff;
}

.tab-content-area {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* HERO HEADER CARD */
.hero-header-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero-top-row {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.hero-thumb {
  width: 100px;
  height: 100px;
  border-radius: 12px;
  object-fit: cover;
  flex-shrink: 0;
}

.hero-main-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hero-code-tag {
  font-size: 12px;
  font-weight: 800;
  color: #29a1ff;
  letter-spacing: 0.5px;
}

.hero-job-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
}

.hero-job-desc {
  margin: 4px 0 0;
  font-size: 14px;
  color: #475467;
  line-height: 1.5;
}

.hero-action-wrap {
  flex-shrink: 0;
}

.add-spec-btn {
  background: #29a1ff;
  color: #ffffff;
  border: 0;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}

.add-spec-btn:hover {
  background: #1a8dec;
}

.machinery-meta-row {
  display: flex;
  gap: 40px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-lbl {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
}

.meta-val {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

/* COSTS & RESPONSIBLE RANK ROW */
.costs-and-rank-section {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
}

.rank-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.card-caption {
  font-size: 11px;
  font-weight: 800;
  color: #29a1ff;
  letter-spacing: 0.6px;
}

.rank-value {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.costs-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.costs-heading {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.cost-cards-row {
  display: flex;
  gap: 16px;
}

.cost-stat-card {
  flex: 1;
  background: #ffffff;
  border-radius: 14px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cost-lbl {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

.cost-val {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

/* DETAILS BLOCK */
.details-spec-block {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.block-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.details-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px 32px;
}

.detail-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.d-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.d-value {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

/* SUB JOBS & SPARES */
.sub-jobs-section,
.spares-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sub-jobs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.sub-jobs-tools {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mini-search-box {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  padding: 6px 10px;
  gap: 8px;
  width: 200px;
}

.search-icon {
  width: 16px;
  height: 16px;
  color: #94a3b8;
}

.mini-search-input {
  border: 0;
  background: transparent;
  outline: none;
  font-size: 13px;
  width: 100%;
}

.add-subjob-btn {
  background: #29a1ff;
  color: #ffffff;
  border: 0;
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: background 0.15s;
}

.add-subjob-btn:hover {
  background: #1a8dec;
}

.add-subjob-btn svg {
  width: 16px;
  height: 16px;
}

.table-responsive-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow-x: auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.subjobs-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
  min-width: 900px;
}

.subjobs-table th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 600;
  padding: 12px 14px;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.subjobs-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  white-space: nowrap;
}

.desc-cell {
  font-weight: 600;
  color: #1e293b;
}

.num-cell {
  color: #94a3b8;
  font-weight: 600;
}

.check-cell input {
  cursor: pointer;
  width: 16px;
  height: 16px;
  accent-color: #29a1ff;
}

.empty-cell {
  text-align: center;
  color: #94a3b8;
  padding: 24px;
}

/* Tasks & PO Tab Styles */
.block-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-row-item {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 600;
}

.badge-open {
  background: #eff8ff;
  color: #175cd3;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
}

.badge-po {
  background: #f1f5f9;
  color: #475467;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
}

.badge-approved {
  background: #ecfdf3;
  color: #027a48;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 24px;
  width: 480px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-heading {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  margin: 10px 0 4px;
}

.req {
  color: #e63946;
}

.form-input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: #ffffff;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #29a1ff;
}

.modal-foot {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: flex-end;
}

.action-btn {
  padding: 9px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: 0;
}

.action-btn.primary {
  background: #29a1ff;
  color: #ffffff;
}

.action-btn.ghost {
  background: #f1f5f9;
  color: #475467;
}

.toast-box {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: #0f172a;
  color: #ffffff;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

/* Responsive */
@media (max-width: 900px) {
  .costs-and-rank-section {
    grid-template-columns: 1fr;
  }
  .details-grid-3 {
    grid-template-columns: 1fr;
  }
  .hero-top-row {
    flex-direction: column;
  }
}
</style>
