<script setup lang="ts">
interface DryDockDetail {
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
}

interface Shipyard {
  id: number;
  name: string;
}

const route = useRoute();
const id = Number(route.params.id);
const api = useApi();
const toast = ref("");

const activeTab = ref<
  | "general"
  | "specifications"
  | "tasks"
  | "sourcing"
  | "execution"
  | "reporting"
  | "costs"
  | "pos"
>("general");

const { data: dd, refresh } = await useAsyncData<DryDockDetail>(
  `dry-dock-${id}`,
  () => api.get<DryDockDetail>(`/dry-docks/${id}`)
);

const { data: shipyards } = await useAsyncData<Shipyard[]>(
  "shipyards-select",
  () => api.get<Shipyard[]>("/shipyards")
);

const selectedShipyard = ref<number | null>(null);

watch(
  () => dd.value,
  (val) => {
    if (val) {
      selectedShipyard.value = val.shipyard_id;
    }
  },
  { immediate: true }
);

function notify(msg: string) {
  toast.value = msg;
  setTimeout(() => (toast.value = ""), 3000);
}

async function startDryDock() {
  if (!dd.value) return;
  try {
    await api.put(`/dry-docks/${dd.value.id}`, { status: "execution" });
    dd.value.status = "execution";
    notify("Dry Dock status berhasil diubah ke Execution!");
    await refresh();
  } catch (e: any) {
    notify(e?.data?.message || "Gagal mengubah status dry dock");
  }
}

async function updateShipyard() {
  if (!dd.value) return;
  try {
    await api.put(`/dry-docks/${dd.value.id}`, {
      shipyard_id: selectedShipyard.value || null,
    });
    notify("Shipyard berhasil diperbarui di database!");
    await refresh();
  } catch (e: any) {
    notify(e?.data?.message || "Gagal memperbarui shipyard");
  }
}

async function updateStatus(newStatus: "planning" | "execution" | "completed") {
  if (!dd.value) return;
  try {
    await api.put(`/dry-docks/${dd.value.id}`, { status: newStatus });
    dd.value.status = newStatus;
    notify(`Status Dry Dock diubah ke ${newStatus}!`);
  } catch (e: any) {
    notify(e?.data?.message || "Gagal mengubah status");
  }
}

async function updatePriority(newPriority: "low" | "medium" | "high") {
  if (!dd.value) return;
  try {
    await api.put(`/dry-docks/${dd.value.id}`, { priority: newPriority });
    dd.value.priority = newPriority;
    notify(`Prioritas Dry Dock diubah ke ${newPriority}!`);
  } catch (e: any) {
    notify(e?.data?.message || "Gagal mengubah prioritas");
  }
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
  <div v-if="dd" class="dock-detail-page">
    <!-- Breadcrumb & Top Bar -->
    <div class="top-nav-bar">
      <div class="breadcrumb-row">
        <NuxtLink to="/dry-docks" class="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Dry Docks
        </NuxtLink>
        <span class="sep">/</span>
        <span class="current-dock">{{ dd.dry_dock_no }}</span>
      </div>

      <!-- Segment Tabs (General, Specifications, Tasks, Sourcing, Execution, Reporting, Costs, Purchase Orders) -->
      <div class="nav-segment-tabs">
        <button
          class="seg-btn"
          :class="{ active: activeTab === 'general' }"
          @click="activeTab = 'general'"
        >
          General
        </button>
        <button
          class="seg-btn"
          :class="{ active: activeTab === 'specifications' }"
          @click="activeTab = 'specifications'"
        >
          Specifications
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
          :class="{ active: activeTab === 'sourcing' }"
          @click="activeTab = 'sourcing'"
        >
          Sourcing
        </button>
        <button
          class="seg-btn"
          :class="{ active: activeTab === 'execution' }"
          @click="activeTab = 'execution'"
        >
          Execution
        </button>
        <button
          class="seg-btn"
          :class="{ active: activeTab === 'reporting' }"
          @click="activeTab = 'reporting'"
        >
          Reporting
        </button>
        <button
          class="seg-btn"
          :class="{ active: activeTab === 'costs' }"
          @click="activeTab = 'costs'"
        >
          Costs
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

    <!-- HERO BLUE BANNER (Image 4) -->
    <div class="dock-hero-banner">
      <div class="hero-left-col">
        <img
          :src="dd.shipyard_photo || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300&auto=format&fit=crop'"
          :alt="dd.vessel_name"
          class="hero-ship-img"
        />

        <div class="hero-text-block">
          <span class="hero-vessel-title">{{ dd.vessel_name.toUpperCase() }}</span>
          <h1 class="hero-dock-heading">{{ dd.dry_dock_no }}</h1>
          <p class="hero-dock-desc">{{ dd.description || 'DD Required to change BWT' }}</p>
        </div>
      </div>

      <div class="hero-right-col">
        <button class="start-dock-btn" @click="startDryDock">
          Start Dry Dock
        </button>
      </div>
    </div>

    <!-- TAB: GENERAL (Image 4) -->
    <div v-if="activeTab === 'general'" class="tab-body-container">
      <!-- Details Info Grid -->
      <div class="info-grid-block">
        <div class="info-col">
          <span class="info-label">Dry Dock No</span>
          <span class="info-value">{{ dd.dry_dock_no }}</span>
        </div>

        <div class="info-col">
          <span class="info-label">Description</span>
          <span class="info-value">{{ dd.description || 'DD Required to change BWT' }}</span>
        </div>

        <div class="info-col">
          <span class="info-label">Company</span>
          <span class="info-value">{{ dd.company || 'UHC Pvt. Ltd.' }}</span>
        </div>

        <div class="info-col">
          <span class="info-label">Account Code</span>
          <span class="info-value">{{ dd.account_code || 'ABC-123' }}</span>
        </div>

        <div class="info-col">
          <span class="info-label">Responsible Rank</span>
          <span class="info-value">{{ dd.responsible_rank || 'Roshan Ahluwalia/CE' }}</span>
        </div>

        <div class="info-col">
          <span class="info-label">Budget</span>
          <span class="info-value">{{ formatCurrency(dd.budget || 200000) }}</span>
        </div>

        <div class="info-col">
          <span class="info-label">Currency</span>
          <span class="info-value">{{ dd.currency || 'USD' }}</span>
        </div>

        <div class="info-col">
          <span class="info-label">Planned Start Date</span>
          <span class="info-value">{{ dd.planned_start ? dd.planned_start.split('T')[0] : '01/01/2026' }}</span>
        </div>

        <div class="info-col">
          <span class="info-label">Planned End Date</span>
          <span class="info-value">{{ dd.planned_end ? dd.planned_end.split('T')[0] : '01/01/2026' }}</span>
        </div>

        <div class="info-col">
          <span class="info-label">Actual Start Date</span>
          <span class="info-value">{{ dd.actual_start ? dd.actual_start.split('T')[0] : '01/01/2026' }}</span>
        </div>

        <div class="info-col">
          <span class="info-label">Actual End Date</span>
          <span class="info-value">{{ dd.actual_end ? dd.actual_end.split('T')[0] : '01/01/2026' }}</span>
        </div>
      </div>

      <!-- Shipyard Selector Card -->
      <div class="section-card">
        <label class="card-title-lbl">Shipyard</label>
        <div class="shipyard-select-row">
          <select v-model="selectedShipyard" class="custom-select">
            <option :value="null">-- No Shipyard Selected --</option>
            <option v-for="s in shipyards" :key="s.id" :value="s.id">
              {{ s.name }}
            </option>
          </select>
          <button class="action-blue-btn" @click="updateShipyard">
            SELECT SHIPYARD
          </button>
          <div v-if="!selectedShipyard" class="empty-yard-badge">
            No Shipyard Selected
          </div>
        </div>
      </div>

      <!-- Priority & Status Cards Row -->
      <div class="status-priority-row">
        <!-- Priority -->
        <div class="section-card">
          <label class="card-title-lbl">Priority</label>
          <div class="btn-group-row">
            <button
              class="choice-btn"
              :class="{ active: dd.priority === 'low' }"
              @click="updatePriority('low')"
            >
              Low
            </button>
            <button
              class="choice-btn"
              :class="{ active: dd.priority === 'medium' }"
              @click="updatePriority('medium')"
            >
              Medium
            </button>
            <button
              class="choice-btn"
              :class="{ active: dd.priority === 'high' }"
              @click="updatePriority('high')"
            >
              High
            </button>
          </div>
        </div>

        <!-- Status -->
        <div class="section-card">
          <label class="card-title-lbl">Status</label>
          <div class="btn-group-row">
            <button
              class="choice-btn"
              :class="{ active: dd.status === 'planning' }"
              @click="updateStatus('planning')"
            >
              Planning
            </button>
            <button
              class="choice-btn"
              :class="{ active: dd.status === 'execution' }"
              @click="updateStatus('execution')"
            >
              Execution
            </button>
            <button
              class="choice-btn"
              :class="{ active: dd.status === 'completed' }"
              @click="updateStatus('completed')"
            >
              Completed
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB: COSTS / REPORTING (Image 5) -->
    <div v-else-if="activeTab === 'costs' || activeTab === 'reporting'" class="tab-body-container">
      <!-- 8 STAT CARDS GRID -->
      <div class="costs-stat-grid">
        <div class="stat-card">
          <span class="stat-lbl">Budget</span>
          <h3 class="stat-num">{{ formatCurrency(dd.budget || 200000) }}</h3>
        </div>

        <div class="stat-card">
          <span class="stat-lbl">Yard Estimates</span>
          <h3 class="stat-num">{{ formatCurrency(300) }}</h3>
        </div>

        <div class="stat-card">
          <span class="stat-lbl">Owner Estimates</span>
          <h3 class="stat-num">{{ formatCurrency(500) }}</h3>
        </div>

        <div class="stat-card">
          <span class="stat-lbl">Total Estimates</span>
          <h3 class="stat-num">{{ formatCurrency(50000) }}</h3>
        </div>

        <div class="stat-card">
          <span class="stat-lbl">Actual Yard Costs</span>
          <h3 class="stat-num">{{ formatCurrency(400) }}</h3>
        </div>

        <div class="stat-card">
          <span class="stat-lbl">Actual Owner Costs</span>
          <h3 class="stat-num">{{ formatCurrency(300) }}</h3>
        </div>

        <div class="stat-card">
          <span class="stat-lbl">Total Costs</span>
          <h3 class="stat-num">{{ formatCurrency(60000) }}</h3>
        </div>

        <div class="stat-card">
          <span class="stat-lbl">Variance</span>
          <h3 class="stat-num" style="color: #12b76a;">500. ↑</h3>
        </div>
      </div>

      <!-- CHARTS SECTION: STATUS & YARD STAY -->
      <div class="charts-two-col">
        <!-- Status Donut Chart -->
        <div class="section-card chart-box">
          <h3 class="chart-box-title">Status</h3>
          <div class="donut-center-wrap">
            <svg viewBox="0 0 160 160" class="donut-chart-svg">
              <circle cx="80" cy="80" r="55" fill="none" stroke="#eef2f6" stroke-width="26" />
              <circle cx="80" cy="80" r="55" fill="none" stroke="#29a1ff" stroke-width="26" stroke-dasharray="110 345" stroke-dashoffset="0" transform="rotate(-90 80 80)" />
              <circle cx="80" cy="80" r="55" fill="none" stroke="#12b76a" stroke-width="26" stroke-dasharray="85 345" stroke-dashoffset="-110" transform="rotate(-90 80 80)" />
              <circle cx="80" cy="80" r="55" fill="none" stroke="#f79009" stroke-width="26" stroke-dasharray="75 345" stroke-dashoffset="-195" transform="rotate(-90 80 80)" />
              <circle cx="80" cy="80" r="55" fill="none" stroke="#e63946" stroke-width="26" stroke-dasharray="75 345" stroke-dashoffset="-270" transform="rotate(-90 80 80)" />
            </svg>
          </div>
          <div class="chart-legend-row">
            <span class="leg-item"><span class="dot" style="background:#29a1ff;"></span> Open 64</span>
            <span class="leg-item"><span class="dot" style="background:#12b76a;"></span> In Progress 50</span>
            <span class="leg-item"><span class="dot" style="background:#f79009;"></span> On Hold 68</span>
            <span class="leg-item"><span class="dot" style="background:#e63946;"></span> Complete 40</span>
            <span class="leg-item"><span class="dot" style="background:#a16207;"></span> 132</span>
          </div>
        </div>

        <!-- Yard Stay Donut Chart -->
        <div class="section-card chart-box">
          <h3 class="chart-box-title">Yard Stay</h3>
          <div class="donut-center-wrap">
            <svg viewBox="0 0 160 160" class="donut-chart-svg">
              <circle cx="80" cy="80" r="55" fill="none" stroke="#29a1ff" stroke-width="26" stroke-dasharray="172 345" stroke-dashoffset="0" transform="rotate(-90 80 80)" />
              <circle cx="80" cy="80" r="55" fill="none" stroke="#12b76a" stroke-width="26" stroke-dasharray="172 345" stroke-dashoffset="-172" transform="rotate(-90 80 80)" />
            </svg>
          </div>
          <div class="chart-legend-row">
            <span class="leg-item"><span class="dot" style="background:#29a1ff;"></span> In Dock 80806</span>
            <span class="leg-item"><span class="dot" style="background:#12b76a;"></span> Repair 80808</span>
          </div>
        </div>
      </div>

      <!-- COMPARISON BAR CHART -->
      <div class="section-card">
        <h3 class="chart-box-title">Comparison</h3>
        <div class="chart-legend-row" style="justify-content: flex-start; margin-bottom: 20px;">
          <span class="leg-item"><span class="dot" style="background:#29a1ff;"></span> Total Costs</span>
          <span class="leg-item"><span class="dot" style="background:#12b76a;"></span> Total Estimates</span>
          <span class="leg-item"><span class="dot" style="background:#e63946;"></span> Total Budget</span>
        </div>

        <div class="bar-chart-visual">
          <div class="bar-col-item">
            <div class="single-bar" style="height: 180px; background-color: #12b76a;" title="Estimates: 50,000$"></div>
            <span class="bar-lbl">300</span>
          </div>
          <div class="bar-col-item">
            <div class="single-bar" style="height: 220px; background-color: #29a1ff;" title="Costs: 60,000$"></div>
            <span class="bar-lbl">250</span>
          </div>
          <div class="bar-col-item">
            <div class="single-bar" style="height: 140px; background-color: #e63946;" title="Budget: 200,000$"></div>
            <span class="bar-lbl">200</span>
          </div>
        </div>
      </div>
    </div>

    <!-- OTHER TABS PLACEHOLDERS -->
    <div v-else class="tab-body-container">
      <div class="section-card">
        <h3 class="card-title-lbl">{{ activeTab.toUpperCase() }}</h3>
        <p style="color: #64748b;">Informasi data {{ activeTab }} untuk Dry Dock {{ dd.dry_dock_no }}.</p>
      </div>
    </div>

    <!-- TOAST -->
    <div v-if="toast" class="toast-box">{{ toast }}</div>
  </div>
</template>

<style scoped>
.dock-detail-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 60px;
}

/* Top Nav & Breadcrumb */
.top-nav-bar {
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

.current-dock {
  color: #1e293b;
  font-weight: 700;
}

.nav-segment-tabs {
  display: flex;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 4px;
  gap: 4px;
  overflow-x: auto;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.seg-btn {
  background: transparent;
  border: 0;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #475467;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.seg-btn.active {
  background: #29a1ff;
  color: #ffffff;
}

/* Hero Banner (Image 4) */
.dock-hero-banner {
  background: #29a1ff;
  color: #ffffff;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 12px rgba(41, 161, 255, 0.2);
  gap: 20px;
  flex-wrap: wrap;
}

.hero-left-col {
  display: flex;
  align-items: center;
  gap: 20px;
}

.hero-ship-img {
  width: 90px;
  height: 90px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.4);
}

.hero-text-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero-vessel-title {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.8px;
  opacity: 0.9;
}

.hero-dock-heading {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
}

.hero-dock-desc {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.start-dock-btn {
  background: #e2e8f0;
  color: #1e293b;
  border: 0;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}

.start-dock-btn:hover {
  background: #ffffff;
}

/* Tab Body */
.tab-body-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Info Grid */
.info-grid-block {
  background: #ffffff;
  border-radius: 16px;
  padding: 28px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px 20px;
}

.info-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

/* Section Cards */
.section-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.card-title-lbl {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.shipyard-select-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.custom-select {
  padding: 9px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: #ffffff;
  min-width: 240px;
}

.action-blue-btn {
  background: #29a1ff;
  color: #ffffff;
  border: 0;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
}

.action-blue-btn:hover {
  background: #1a8dec;
}

.empty-yard-badge {
  background: #fef6ee;
  color: #b54708;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}

/* Priority & Status */
.status-priority-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.btn-group-row {
  display: flex;
  gap: 10px;
}

.choice-btn {
  flex: 1;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #475467;
  cursor: pointer;
  transition: all 0.15s;
}

.choice-btn.active {
  background: #29a1ff;
  color: #ffffff;
  border-color: #29a1ff;
}

/* Costs Stats Grid (Image 5) */
.costs-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 18px 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-lbl {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

.stat-num {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
}

/* Charts (Image 5) */
.charts-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.chart-box {
  align-items: center;
}

.chart-box-title {
  align-self: flex-start;
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.donut-center-wrap {
  width: 180px;
  height: 180px;
  margin: 10px 0;
}

.donut-chart-svg {
  width: 100%;
  height: 100%;
}

.chart-legend-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  justify-content: center;
}

.leg-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

/* Bar Chart */
.bar-chart-visual {
  height: 240px;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  align-items: flex-end;
  gap: 32px;
  padding-left: 20px;
}

.bar-col-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.single-bar {
  width: 32px;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
}

.bar-lbl {
  font-size: 11px;
  color: #64748b;
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
  .info-grid-block {
    grid-template-columns: 1fr 1fr;
  }
  .costs-stat-grid {
    grid-template-columns: 1fr 1fr;
  }
  .charts-two-col {
    grid-template-columns: 1fr;
  }
  .status-priority-row {
    grid-template-columns: 1fr;
  }
}
</style>
