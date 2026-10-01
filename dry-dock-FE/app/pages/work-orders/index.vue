<script setup lang="ts">
interface WorkOrder {
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

interface SpecGroup {
  id: number;
  name: string;
}

const api = useApi();
const search = ref("");
const categoryFilter = ref("all");
const activeViewTab = ref<"minimal" | "details" | "add_spec">("minimal");
const toast = ref("");

const { data: workOrders, refresh } = await useAsyncData<WorkOrder[]>("work-orders", () =>
  api.get<WorkOrder[]>("/work-orders")
);

const { data: specGroups } = await useAsyncData<SpecGroup[]>("spec-groups-list", () =>
  api.get<SpecGroup[]>("/specification-groups")
);

// Form Modal State
const showAddModal = ref(false);
const editingId = ref<number | null>(null);
const form = reactive({
  job_code: "",
  job_name: "",
  description: "",
  photo_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&auto=format&fit=crop",
  job_category: "PMS Job",
  job_type: "Dock Job",
  is_machinery: false,
  is_critical: false,
  is_internal: false,
  responsible_rank: "Second Engineer",
  estimated_hours: 10,
  total_budget: 2500,
  total_internal_estimate: 60000,
  specification_group_id: 2,
});

const actionMenuOpenId = ref<number | null>(null);

function notify(msg: string) {
  toast.value = msg;
  setTimeout(() => (toast.value = ""), 3000);
}

// Group work orders by Specification Group Name
const filteredList = computed(() => {
  if (!workOrders.value) return [];
  const q = search.value.toLowerCase().trim();
  const cat = categoryFilter.value;

  return workOrders.value.filter((wo) => {
    const matchSearch =
      !q ||
      wo.job_name.toLowerCase().includes(q) ||
      wo.job_code.toLowerCase().includes(q) ||
      (wo.description && wo.description.toLowerCase().includes(q));
    const matchCat = cat === "all" || wo.job_category === cat;
    return matchSearch && matchCat;
  });
});

const groupedWorkOrders = computed(() => {
  const groups: Record<string, WorkOrder[]> = {};
  for (const wo of filteredList.value) {
    const groupTitle = wo.specification_group_name || "General";
    if (!groups[groupTitle]) {
      groups[groupTitle] = [];
    }
    groups[groupTitle].push(wo);
  }
  return groups;
});

function openAdd() {
  editingId.value = null;
  Object.assign(form, {
    job_code: `C001.${Math.floor(Math.random() * 900 + 100)}`,
    job_name: "",
    description: "",
    photo_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&auto=format&fit=crop",
    job_category: "PMS Job",
    job_type: "Dock Job",
    is_machinery: false,
    is_critical: false,
    is_internal: false,
    responsible_rank: "Second Engineer",
    estimated_hours: 10,
    total_budget: 2500,
    total_internal_estimate: 60000,
    specification_group_id: specGroups.value?.[0]?.id || 2,
  });
  showAddModal.value = true;
}

function openEdit(wo: WorkOrder) {
  editingId.value = wo.id;
  Object.assign(form, {
    job_code: wo.job_code,
    job_name: wo.job_name,
    description: wo.description || "",
    photo_url: wo.photo_url || "",
    job_category: wo.job_category || "PMS Job",
    job_type: wo.job_type || "Dock Job",
    is_machinery: !!wo.is_machinery,
    is_critical: !!wo.is_critical,
    is_internal: !!wo.is_internal,
    responsible_rank: wo.responsible_rank || "Second Engineer",
    estimated_hours: Number(wo.estimated_hours) || 10,
    total_budget: Number(wo.total_budget) || 2500,
    total_internal_estimate: Number(wo.total_internal_estimate) || 60000,
    specification_group_id: wo.specification_group_id || 2,
  });
  actionMenuOpenId.value = null;
  showAddModal.value = true;
}

async function submitForm() {
  if (!form.job_name.trim()) {
    notify("Job Name wajib diisi");
    return;
  }
  try {
    if (editingId.value) {
      await api.put(`/work-orders/${editingId.value}`, form);
      notify("Work Order berhasil diperbarui!");
    } else {
      await api.post("/work-orders", form);
      notify("Work Order berhasil ditambahkan!");
    }
    showAddModal.value = false;
    await refresh();
  } catch (e: any) {
    notify(e?.data?.message || "Gagal menyimpan data");
  }
}

async function removeWorkOrder(id: number, name: string) {
  if (!confirm(`Hapus Work Order "${name}"?`)) return;
  try {
    await api.del(`/work-orders/${id}`);
    notify("Work Order berhasil dihapus");
    actionMenuOpenId.value = null;
    await refresh();
  } catch (e: any) {
    notify(e?.data?.message || "Gagal menghapus data");
  }
}

function formatCurrency(val: number | string) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);
}
</script>

<template>
  <div class="work-orders-page">
    <!-- Top Bar -->
    <div class="top-nav-row">
      <h1 class="page-title">Work Order Master</h1>

      <!-- Segment Tabs (Minimal / Details / Add to Spec) -->
      <div class="view-mode-tabs">
        <button
          class="tab-btn"
          :class="{ active: activeViewTab === 'minimal' }"
          @click="activeViewTab = 'minimal'"
        >
          Minimal
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeViewTab === 'details' }"
          @click="activeViewTab = 'details'"
        >
          Details
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeViewTab === 'add_spec' }"
          @click="activeViewTab = 'add_spec'"
        >
          Add to Spec
        </button>
      </div>
    </div>

    <!-- Search & Filter Controls -->
    <div class="controls-row">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="search"
          type="text"
          placeholder="Search"
          class="search-input"
        />
      </div>

      <div class="right-tools">
        <div class="dropdown-filter">
          <select v-model="categoryFilter" class="filter-select">
            <option value="all">Filter by</option>
            <option value="PMS Job">PMS Job</option>
            <option value="Dock Job">Dock Job</option>
            <option value="UPM Job">UPM Job</option>
            <option value="Time">Time</option>
          </select>
        </div>

        <button class="add-btn" @click="openAdd">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add
        </button>
      </div>
    </div>

    <!-- Work Orders Grouped List -->
    <div class="groups-container">
      <div
        v-for="(items, groupName) in groupedWorkOrders"
        :key="groupName"
        class="spec-group-block"
      >
        <h3 class="group-heading">{{ groupName }}</h3>

        <div class="items-list">
          <div
            v-for="wo in items"
            :key="wo.id"
            class="wo-card-row"
            :class="{ 'details-mode': activeViewTab === 'details' }"
            @click="navigateTo(`/work-orders/${wo.id}`)"
          >
            <!-- Thumbnail Photo -->
            <img
              :src="wo.photo_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&auto=format&fit=crop'"
              :alt="wo.job_name"
              class="wo-thumb"
            />

            <!-- Information -->
            <div class="wo-info">
              <span class="wo-category-badge">{{ wo.job_category.toUpperCase() }}</span>
              <h4 class="wo-title">{{ wo.job_name }}</h4>
              <span class="wo-code">{{ wo.job_code }}</span>

              <!-- Extra details in Details Mode -->
              <div v-if="activeViewTab === 'details'" class="wo-extra-details">
                <span class="meta-tag">Rank: {{ wo.responsible_rank }}</span>
                <span class="meta-tag">Budget: {{ formatCurrency(wo.total_budget) }}</span>
                <span class="meta-tag">Hours: {{ wo.estimated_hours }}h</span>
              </div>
            </div>

            <!-- Add to Spec Button in Add to Spec Mode -->
            <div v-if="activeViewTab === 'add_spec'" class="add-spec-action" @click.stop>
              <button class="spec-toggle-btn" @click="notify(`Pekerjaan ${wo.job_code} ditambahkan ke Specification!`)">
                + Add to Spec
              </button>
            </div>

            <!-- Options Menu (...) -->
            <div class="wo-menu-wrap" @click.stop>
              <button
                class="dots-btn"
                title="Options"
                @click="actionMenuOpenId = actionMenuOpenId === wo.id ? null : wo.id"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="2"/>
                  <circle cx="19" cy="12" r="2"/>
                  <circle cx="5" cy="12" r="2"/>
                </svg>
              </button>

              <div v-if="actionMenuOpenId === wo.id" class="dots-popover">
                <button @click="navigateTo(`/work-orders/${wo.id}`)">View Details</button>
                <button @click="openEdit(wo)">Edit</button>
                <button class="danger" @click="removeWorkOrder(wo.id, wo.job_name)">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!filteredList.length" class="empty-state">
        <p>Tidak ada Work Order ditemukan.</p>
      </div>
    </div>

    <!-- FORM MODAL: Add / Edit Work Order -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-card">
        <h3 class="modal-heading">{{ editingId ? "Edit Work Order" : "Add Work Order" }}</h3>

        <div class="form-grid">
          <div class="field-col">
            <label class="form-label">Job Code <span class="req">*</span></label>
            <input v-model="form.job_code" type="text" class="form-input" placeholder="e.g. C001" />
          </div>

          <div class="field-col">
            <label class="form-label">Job Category</label>
            <select v-model="form.job_category" class="form-input">
              <option value="PMS Job">PMS Job</option>
              <option value="Dock Job">Dock Job</option>
              <option value="UPM Job">UPM Job</option>
              <option value="Time">Time</option>
              <option value="Check">Check</option>
            </select>
          </div>
        </div>

        <label class="form-label">Job Name <span class="req">*</span></label>
        <input v-model="form.job_name" type="text" class="form-input" placeholder="e.g. 6 Months Routine Check and Operate..." />

        <label class="form-label">Description</label>
        <textarea v-model="form.description" rows="3" class="form-input" placeholder="Detailed scope of work..."></textarea>

        <div class="form-grid">
          <div class="field-col">
            <label class="form-label">Specification Group</label>
            <select v-model="form.specification_group_id" class="form-input">
              <option v-for="g in specGroups" :key="g.id" :value="g.id">
                {{ g.name }}
              </option>
            </select>
          </div>

          <div class="field-col">
            <label class="form-label">Responsible Rank</label>
            <input v-model="form.responsible_rank" type="text" class="form-input" placeholder="e.g. Second Engineer" />
          </div>
        </div>

        <div class="form-grid">
          <div class="field-col">
            <label class="form-label">Total Budget ($)</label>
            <input v-model.number="form.total_budget" type="number" class="form-input" />
          </div>

          <div class="field-col">
            <label class="form-label">Internal Estimate ($)</label>
            <input v-model.number="form.total_internal_estimate" type="number" class="form-input" />
          </div>
        </div>

        <div class="checks-row">
          <label class="check-item">
            <input type="checkbox" v-model="form.is_critical" />
            Critical Job
          </label>
          <label class="check-item">
            <input type="checkbox" v-model="form.is_internal" />
            Internal Job
          </label>
          <label class="check-item">
            <input type="checkbox" v-model="form.is_machinery" />
            Machinery
          </label>
        </div>

        <div class="modal-foot">
          <button class="action-btn primary" @click="submitForm">Submit</button>
          <button class="action-btn ghost" @click="showAddModal = false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- TOAST -->
    <div v-if="toast" class="toast-box">
      {{ toast }}
    </div>
  </div>
</template>

<style scoped>
.work-orders-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 60px;
}

/* Top Nav Row */
.top-nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.view-mode-tabs {
  display: flex;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 4px;
  gap: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.tab-btn {
  background: transparent;
  border: 0;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #475467;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn.active {
  background: #29a1ff;
  color: #ffffff;
}

/* Controls */
.controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #d0d5dd;
  border-radius: 10px;
  padding: 8px 14px;
  gap: 10px;
  flex: 1;
  max-width: 480px;
}

.search-icon {
  width: 18px;
  height: 18px;
  color: #94a3b8;
}

.search-input {
  border: 0;
  background: transparent;
  outline: none;
  font-size: 14px;
  width: 100%;
}

.right-tools {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-select {
  padding: 9px 14px;
  background: #ffffff;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  font-size: 14px;
  color: #475467;
  cursor: pointer;
  outline: none;
}

.add-btn {
  background: #29a1ff;
  color: #ffffff;
  border: 0;
  padding: 9px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.add-btn:hover {
  background: #1a8dec;
}

.add-btn svg {
  width: 16px;
  height: 16px;
}

/* Groups */
.groups-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.spec-group-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-heading {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wo-card-row {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 18px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.wo-card-row:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px -1px rgba(0, 0, 0, 0.08);
}

.wo-thumb {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
}

.wo-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.wo-category-badge {
  font-size: 11px;
  font-weight: 800;
  color: #29a1ff;
  letter-spacing: 0.6px;
}

.wo-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
}

.wo-code {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

.wo-extra-details {
  display: flex;
  gap: 10px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.meta-tag {
  font-size: 12px;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 6px;
  color: #475467;
}

.add-spec-action {
  flex-shrink: 0;
}

.spec-toggle-btn {
  background: #eff8ff;
  color: #175cd3;
  border: 1px solid #b2ddff;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.spec-toggle-btn:hover {
  background: #d1e9ff;
}

.wo-menu-wrap {
  position: relative;
  flex-shrink: 0;
}

.dots-btn {
  background: none;
  border: 0;
  color: #94a3b8;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
}

.dots-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.dots-btn svg {
  width: 20px;
  height: 20px;
}

.dots-popover {
  position: absolute;
  right: 0;
  top: 32px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 4px;
  display: flex;
  flex-direction: column;
  min-width: 140px;
  z-index: 10;
}

.dots-popover button {
  background: none;
  border: 0;
  text-align: left;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  color: #334155;
}

.dots-popover button:hover {
  background: #f1f5f9;
}

.dots-popover button.danger {
  color: #e63946;
}

.empty-state {
  background: #ffffff;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  color: #94a3b8;
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
  width: 500px;
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

.checks-row {
  display: flex;
  gap: 16px;
  margin: 16px 0;
  flex-wrap: wrap;
}

.check-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #475467;
  cursor: pointer;
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
</style>
