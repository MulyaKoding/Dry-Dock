<script setup lang="ts">
interface DryDock {
  id: number;
  dry_dock_no: string;
  vessel_id: number;
  vessel_name: string;
  vessel_photo?: string;
  shipyard_id: number | null;
  shipyard_name: string | null;
  shipyard_photo?: string;
  description: string;
  company: string;
  account_code: string;
  responsible_rank: string;
  budget: number | string;
  currency: string;
  planned_start: string;
  planned_end: string;
  actual_start: string;
  actual_end: string;
  priority: "low" | "medium" | "high";
  status: "planning" | "execution" | "completed";
  specs_count?: number;
}

interface Vessel {
  id: number;
  name: string;
}

interface Shipyard {
  id: number;
  name: string;
}

const api = useApi();
const search = ref("");
const statusFilter = ref("all");
const activeViewTab = ref<"minimal" | "detailed">("minimal");
const toast = ref("");

const { data: dryDocks, refresh } = await useAsyncData<DryDock[]>(
  "dry-docks-list",
  () => api.get<DryDock[]>("/dry-docks"),
);

const { data: vessels } = await useAsyncData<Vessel[]>("vessels-list", () =>
  api.get<Vessel[]>("/vessels"),
);

const { data: shipyards } = await useAsyncData<Shipyard[]>(
  "shipyards-list",
  () => api.get<Shipyard[]>("/shipyards"),
);

// Top 3 for My Dry Docks hero cards
const myDryDocks = computed(() => {
  return (dryDocks.value || []).slice(0, 3).map((dd, idx) => ({
    ...dd,
    photo:
      idx === 0
        ? "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&auto=format&fit=crop"
        : idx === 1
          ? "https://images.unsplash.com/photo-1505705694340-019e1e335916?w=400&auto=format&fit=crop"
          : "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=400&auto=format&fit=crop",
  }));
});

const filteredDryDocks = computed(() => {
  if (!dryDocks.value) return [];
  const q = search.value.toLowerCase().trim();
  const st = statusFilter.value;

  return dryDocks.value.filter((dd) => {
    const matchSearch =
      !q ||
      dd.dry_dock_no.toLowerCase().includes(q) ||
      (dd.vessel_name && dd.vessel_name.toLowerCase().includes(q)) ||
      (dd.shipyard_name && dd.shipyard_name.toLowerCase().includes(q)) ||
      (dd.description && dd.description.toLowerCase().includes(q));
    const matchStatus = st === "all" || dd.status === st;
    return matchSearch && matchStatus;
  });
});

// Modal State
const showModal = ref(false);
const editingId = ref<number | null>(null);
const actionMenuOpenId = ref<number | null>(null);

const form = reactive({
  dry_dock_no: "",
  vessel_id: 1,
  shipyard_id: 1 as number | null,
  description: "",
  company: "UHC Pvt. Ltd.",
  account_code: "ABC-123",
  responsible_rank: "Roshan Ahluwalia/CE",
  budget: 200000,
  currency: "USD",
  planned_start: "2026-10-01",
  planned_end: "2026-10-25",
  actual_start: "2026-10-01",
  actual_end: "2026-10-25",
  priority: "medium" as "low" | "medium" | "high",
  status: "planning" as "planning" | "execution" | "completed",
});

function notify(msg: string) {
  toast.value = msg;
  setTimeout(() => (toast.value = ""), 3000);
}

function openAdd() {
  editingId.value = null;
  form.dry_dock_no = `DD-${Math.floor(Math.random() * 900 + 100)}`;
  form.vessel_id = vessels.value?.[0]?.id || 1;
  form.shipyard_id = shipyards.value?.[0]?.id || 1;
  form.description = "DD Required to change BWT";
  form.company = "UHC Pvt. Ltd.";
  form.account_code = "ABC-123";
  form.responsible_rank = "Roshan Ahluwalia/CE";
  form.budget = 200000;
  form.currency = "USD";
  form.planned_start = new Date().toISOString().split("T")[0];
  form.planned_end = new Date(Date.now() + 25 * 86400000)
    .toISOString()
    .split("T")[0];
  form.actual_start = new Date().toISOString().split("T")[0];
  form.actual_end = new Date(Date.now() + 25 * 86400000)
    .toISOString()
    .split("T")[0];
  form.priority = "medium";
  form.status = "planning";
  showModal.value = true;
  actionMenuOpenId.value = null;
}

function openEdit(dd: DryDock) {
  editingId.value = dd.id;
  form.dry_dock_no = dd.dry_dock_no;
  form.vessel_id = dd.vessel_id;
  form.shipyard_id = dd.shipyard_id;
  form.description = dd.description || "";
  form.company = dd.company || "UHC Pvt. Ltd.";
  form.account_code = dd.account_code || "ABC-123";
  form.responsible_rank = dd.responsible_rank || "Roshan Ahluwalia/CE";
  form.budget = Number(dd.budget) || 200000;
  form.currency = dd.currency || "USD";
  form.planned_start = dd.planned_start ? dd.planned_start.split("T")[0] : "";
  form.planned_end = dd.planned_end ? dd.planned_end.split("T")[0] : "";
  form.actual_start = dd.actual_start ? dd.actual_start.split("T")[0] : "";
  form.actual_end = dd.actual_end ? dd.actual_end.split("T")[0] : "";
  form.priority = dd.priority || "medium";
  form.status = dd.status || "planning";
  showModal.value = true;
  actionMenuOpenId.value = null;
}

async function submitForm() {
  if (!form.dry_dock_no.trim()) {
    notify("Dry Dock No wajib diisi");
    return;
  }
  try {
    if (editingId.value) {
      await api.put(`/dry-docks/${editingId.value}`, form);
      notify("Dry Dock berhasil diperbarui!");
    } else {
      await api.post("/dry-docks", form);
      notify("Dry Dock berhasil ditambahkan!");
    }
    showModal.value = false;
    await refresh();
  } catch (e: any) {
    notify(e?.data?.message || "Gagal menyimpan data");
  }
}

async function removeDryDock(dd: DryDock) {
  if (!confirm(`Hapus Dry Dock "${dd.dry_dock_no}"?`)) return;
  try {
    await api.del(`/dry-docks/${dd.id}`);
    notify("Dry Dock berhasil dihapus");
    actionMenuOpenId.value = null;
    await refresh();
  } catch (e: any) {
    notify(e?.data?.message || "Gagal menghapus data");
  }
}

function copyDryDock(dd: DryDock) {
  notify(`Dry Dock ${dd.dry_dock_no} disalin!`);
}

function exportData() {
  const csvContent =
    "data:text/csv;charset=utf-8," +
    ["Dry Dock No,Vessel,Shipyard,Status,Budget,Planned Start,Planned End"]
      .concat(
        (dryDocks.value || []).map(
          (d) =>
            `"${d.dry_dock_no}","${d.vessel_name}","${d.shipyard_name || ""}","${d.status}","${d.budget}","${d.planned_start}","${d.planned_end}"`,
        ),
      )
      .join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `dry_docks_export_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  notify("Data Dry Docks berhasil diexport!");
}

function formatCurrency(val: number | string) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}
</script>

<template>
  <div class="dry-docks-page">
    <!-- Top Blue Header Banner -->
    <header class="dash-top-header">
      <h1 class="dash-title">Dry Docks</h1>
    </header>

    <!-- SECTION 1: MY DRY DOCKS HERO CARDS -->
    <section class="my-docks-section">
      <h2 class="section-title">My Dry Docks</h2>
      <div class="hero-cards-grid">
        <div
          v-for="dd in myDryDocks"
          :key="`hero-${dd.id}`"
          class="hero-dock-card"
          @click="navigateTo(`/dry-docks/${dd.id}`)"
        >
          <img :src="dd.photo" :alt="dd.vessel_name" class="hero-dock-img" />
          <div class="hero-dock-meta">
            <span class="hero-vessel-name">{{
              dd.vessel_name.toUpperCase()
            }}</span>
            <span class="hero-dock-status">{{
              dd.status === "execution" ? "Execution" : "Planning"
            }}</span>
            <span class="hero-dock-code">{{ dd.dry_dock_no }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 2: ALL DRY DOCKS -->
    <section class="all-docks-section">
      <div class="all-docks-header">
        <h2 class="section-title">All Dry Docks</h2>

        <!-- Segment View Tabs (Minimal / Detailed) -->
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
            :class="{ active: activeViewTab === 'detailed' }"
            @click="activeViewTab = 'detailed'"
          >
            Detailed
          </button>
        </div>
      </div>

      <!-- Controls Row (Search, Filter, Add, Export) -->
      <div class="controls-row">
        <div class="search-box">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="search-icon"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="search"
            type="text"
            placeholder="Search"
            class="search-input"
          />
        </div>

        <div class="right-tools">
          <select v-model="statusFilter" class="filter-select">
            <option value="all">Filter by</option>
            <option value="planning">Planning</option>
            <option value="execution">Execution</option>
            <option value="completed">Completed</option>
          </select>

          <button class="add-btn" @click="openAdd">Add</button>

          <button class="export-btn" @click="exportData">Export</button>
        </div>
      </div>

      <!-- VIEW 1: MINIMAL LIST (Image 1 & 3) -->
      <div v-if="activeViewTab === 'minimal'" class="minimal-list-container">
        <div
          v-for="dd in filteredDryDocks"
          :key="dd.id"
          class="minimal-row-card"
          @click="navigateTo(`/dry-docks/${dd.id}`)"
        >
          <!-- Thumbnail Image -->
          <img
            :src="
              dd.shipyard_photo ||
              'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=150&auto=format&fit=crop'
            "
            :alt="dd.dry_dock_no"
            class="min-thumb"
          />

          <!-- Dry Dock Code -->
          <div class="min-code-col">
            <span class="min-code">{{ dd.dry_dock_no }}</span>
          </div>

          <!-- Description -->
          <div class="min-desc-col">
            <span class="min-desc">{{
              dd.description || "DD Required to change BWT"
            }}</span>
          </div>

          <!-- Vessel Name -->
          <div class="min-vessel-col">
            <span class="min-vessel">{{ dd.vessel_name }}</span>
          </div>

          <!-- Action Buttons -->
          <div class="min-action-col" @click.stop>
            <button class="copy-btn" @click="copyDryDock(dd)">Copy</button>

            <!-- Three dots menu -->
            <div class="dots-wrapper">
              <button
                class="dots-btn"
                title="Options"
                @click="
                  actionMenuOpenId = actionMenuOpenId === dd.id ? null : dd.id
                "
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                  <circle cx="5" cy="12" r="2" />
                </svg>
              </button>

              <div v-if="actionMenuOpenId === dd.id" class="dots-popover">
                <button @click="navigateTo(`/dry-docks/${dd.id}`)">
                  View Details
                </button>
                <button @click="openEdit(dd)">Edit</button>
                <button class="danger" @click="removeDryDock(dd)">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!filteredDryDocks.length" class="empty-list">
          Tidak ada data Dry Dock ditemukan.
        </div>
      </div>

      <!-- VIEW 2: DETAILED SPREADSHEET GRID (Image 2) -->
      <div v-else class="detailed-table-wrap">
        <table class="detailed-table">
          <thead>
            <tr>
              <th style="width: 32px"></th>
              <th>Dry Dock No.</th>
              <th>Manager (User)</th>
              <th>Planned Start Date</th>
              <th>Planned End Date</th>
              <th>Actual Start Date</th>
              <th>Actual End Date</th>
              <th>Status</th>
              <th>No of Specs</th>
              <th>Total Budget</th>
              <th>Total Estimates</th>
              <th>Variance</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(dd, idx) in filteredDryDocks"
              :key="`grid-${dd.id}`"
              @click="navigateTo(`/dry-docks/${dd.id}`)"
            >
              <td class="num-cell">{{ idx + 1 }}</td>
              <td class="dock-no-cell">
                <b>{{ dd.dry_dock_no }}</b>
              </td>
              <td>{{ dd.responsible_rank || "Roshan Ahluwalia/CE" }}</td>
              <td>
                {{
                  dd.planned_start
                    ? dd.planned_start.split("T")[0]
                    : "01/01/2026"
                }}
              </td>
              <td>
                {{
                  dd.planned_end ? dd.planned_end.split("T")[0] : "01/01/2026"
                }}
              </td>
              <td>
                {{
                  dd.actual_start ? dd.actual_start.split("T")[0] : "01/01/2026"
                }}
              </td>
              <td>
                {{ dd.actual_end ? dd.actual_end.split("T")[0] : "01/01/2026" }}
              </td>
              <td>
                {{
                  dd.status === "execution"
                    ? "Execution"
                    : dd.status === "completed"
                      ? "Completed"
                      : "Planning"
                }}
              </td>
              <td>{{ 35 + idx * 5 }}.00</td>
              <td>{{ formatCurrency(dd.budget || 2000) }}</td>
              <td>{{ formatCurrency(60000) }}</td>
              <td>{{ formatCurrency(500) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- MODAL: Add / Edit Dry Dock -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card">
        <h3 class="modal-heading">
          {{ editingId ? "Edit Dry Dock" : "Add Dry Dock" }}
        </h3>

        <div class="form-grid">
          <div class="field-col">
            <label class="form-label"
              >Dry Dock No <span class="req">*</span></label
            >
            <input
              v-model="form.dry_dock_no"
              type="text"
              class="form-input"
              placeholder="e.g. SEPT2020/DD1"
            />
          </div>

          <div class="field-col">
            <label class="form-label">Vessel <span class="req">*</span></label>
            <select v-model="form.vessel_id" class="form-input">
              <option v-for="v in vessels" :key="v.id" :value="v.id">
                {{ v.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-grid">
          <div class="field-col">
            <label class="form-label">Shipyard</label>
            <select v-model="form.shipyard_id" class="form-input">
              <option :value="null">-- Unassigned --</option>
              <option v-for="s in shipyards" :key="s.id" :value="s.id">
                {{ s.name }}
              </option>
            </select>
          </div>

          <div class="field-col">
            <label class="form-label">Budget ($)</label>
            <input
              v-model.number="form.budget"
              type="number"
              class="form-input"
            />
          </div>
        </div>

        <label class="form-label">Description</label>
        <textarea
          v-model="form.description"
          rows="2"
          class="form-input"
          placeholder="e.g. DD Required to change BWT"
        ></textarea>

        <div class="form-grid">
          <div class="field-col">
            <label class="form-label">Company</label>
            <input
              v-model="form.company"
              type="text"
              class="form-input"
              placeholder="UHC Pvt. Ltd."
            />
          </div>

          <div class="field-col">
            <label class="form-label">Account Code</label>
            <input
              v-model="form.account_code"
              type="text"
              class="form-input"
              placeholder="ABC-123"
            />
          </div>
        </div>

        <div class="form-grid">
          <div class="field-col">
            <label class="form-label">Planned Start</label>
            <input
              v-model="form.planned_start"
              type="date"
              class="form-input"
            />
          </div>

          <div class="field-col">
            <label class="form-label">Planned End</label>
            <input v-model="form.planned_end" type="date" class="form-input" />
          </div>
        </div>

        <div class="form-grid">
          <div class="field-col">
            <label class="form-label">Status</label>
            <select v-model="form.status" class="form-input">
              <option value="planning">Planning</option>
              <option value="execution">Execution</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div class="field-col">
            <label class="form-label">Priority</label>
            <select v-model="form.priority" class="form-input">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div class="modal-foot">
          <button class="action-btn primary" @click="submitForm">Submit</button>
          <button class="action-btn ghost" @click="showModal = false">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- TOAST -->
    <div v-if="toast" class="toast-box">{{ toast }}</div>
  </div>
</template>

<style scoped>
.dry-docks-page {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-bottom: 60px;
}

/* Header */
.dash-top-header {
  background: #29a1ff;
  color: #ffffff;
  padding: 18px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(41, 161, 255, 0.2);
}

.dash-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
}

.section-title {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

/* Hero Cards Grid */
.hero-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  max-width: 800px;
}

.hero-dock-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
  display: flex;
  flex-direction: column;
}

.hero-dock-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px -1px rgba(0, 0, 0, 0.1);
}

.hero-dock-img {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.hero-dock-meta {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.hero-vessel-name {
  font-size: 11px;
  font-weight: 800;
  color: #29a1ff;
  letter-spacing: 0.5px;
}

.hero-dock-status {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.hero-dock-code {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

/* All Dry Docks */
.all-docks-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.all-docks-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.view-mode-tabs {
  display: flex;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 4px;
  gap: 4px;
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
  transition: all 0.15s;
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
  max-width: 440px;
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
  gap: 10px;
}

.filter-select {
  padding: 8px 14px;
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
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.add-btn:hover {
  background: #1a8dec;
}

.export-btn {
  background: #ffffff;
  color: #475467;
  border: 1px solid #d0d5dd;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.export-btn:hover {
  background: #f1f5f9;
}

/* Minimal List Rows */
.minimal-list-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.minimal-row-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 18px;
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.minimal-row-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.06);
}

.min-thumb {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.min-code-col {
  width: 150px;
  flex-shrink: 0;
}

.min-code {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.min-desc-col {
  flex: 1;
  min-width: 0;
}

.min-desc {
  font-size: 13.5px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.min-vessel-col {
  width: 140px;
  flex-shrink: 0;
}

.min-vessel {
  font-size: 13.5px;
  font-weight: 500;
  color: #334155;
}

.min-action-col {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.copy-btn {
  background: #f1f5f9;
  color: #475467;
  border: 1px solid #e2e8f0;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.copy-btn:hover {
  background: #e2e8f0;
}

.dots-wrapper {
  position: relative;
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
  width: 18px;
  height: 18px;
}

.dots-popover {
  position: absolute;
  right: 0;
  top: 30px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 4px;
  display: flex;
  flex-direction: column;
  min-width: 130px;
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

.empty-list {
  background: #ffffff;
  border-radius: 10px;
  padding: 40px;
  text-align: center;
  color: #94a3b8;
}

/* Detailed Spreadsheet Table */
.detailed-table-wrap {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow-x: auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.detailed-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
  min-width: 1000px;
}

.detailed-table th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 600;
  padding: 12px 14px;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.detailed-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  white-space: nowrap;
  cursor: pointer;
}

.detailed-table tr:hover td {
  background: #f8fafc;
}

.num-cell {
  color: #94a3b8;
  font-weight: 600;
}

.dock-no-cell {
  color: #1e293b;
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
