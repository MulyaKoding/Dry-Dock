<script setup lang="ts">
interface QuoteItem {
  id: number;
  title: string;
  description: string;
  job_code?: string;
  category?: string;
  budget?: number | string;
  photo_url?: string;
}

interface VesselQuoteGroup {
  vessel_id: number;
  vessel_name: string;
  dry_dock_id: number;
  dry_dock_no: string;
  shipyard_id: number;
  shipyard_name: string;
  shipyard_photo: string;
  quote_id: number;
  quote_amount: number | string;
  quote_status: string;
  items: QuoteItem[];
}

interface JobItem {
  id: number;
  job_code: string;
  job_name: string;
  description: string;
  job_category: string;
  photo_url: string;
  total_budget?: number | string;
}

interface DryDockJobGroup {
  dry_dock_id: number;
  dry_dock_no: string;
  vessel_name: string;
  status: string;
  jobs: JobItem[];
}

interface StatusStat {
  label: string;
  count: number;
  code: string;
  color: string;
}

interface CostStat {
  id: number;
  dry_dock_no: string;
  vessel_name: string;
  total_budget: number;
  total_estimates: number;
  total_costs: number;
}

interface DashboardOverview {
  quotesPendingApproval: VesselQuoteGroup[];
  pendingYardQuotes: VesselQuoteGroup[];
  jobsAwaitingDock: DryDockJobGroup[];
  activeDryDocksStats: StatusStat[];
  costsStats: CostStat[];
}

interface AppNotification {
  id: number;
  type: 'work_order' | 'dry_dock_add' | 'dry_dock_edit' | 'quotation' | 'approved';
  tag: string;
  title: string;
  description: string;
  date: string;
  by: string;
  is_read: boolean;
  target_section?: string;
}

const api = useApi();
const toast = ref("");

const { data: overview, refresh } = await useAsyncData<DashboardOverview>(
  "dashboard-overview",
  () => api.get<DashboardOverview>("/dashboard/overview")
);

// Search & filter states
const searchQuotes = ref("");
const searchYardQuotes = ref("");
const searchJobs = ref("");
const categoryFilter = ref("all");
const costFilter = ref("all");

// Notifications State
const showNotificationModal = ref(false);
const selectedNotification = ref<AppNotification | null>(null);
const notificationSearch = ref("");
const notificationFilter = ref("all");
const notificationMenuOpenId = ref<number | null>(null);

const notifications = ref<AppNotification[]>([
  {
    id: 1,
    type: 'quotation',
    tag: 'NEW QUOTATION RECEIVED',
    title: 'New Quotation Received',
    description: 'Work Order No. 123DD Added to December Dry Dock',
    date: '11/10/2026',
    by: 'Raja',
    is_read: false,
    target_section: 'quotes-section',
  },
  {
    id: 2,
    type: 'work_order',
    tag: 'WORK ORDER ADDED',
    title: 'Work Order No. Job No, created in specification group Specification Group Name',
    description: 'Job 5 Monthly check of Auxiliary engine created for Ocean Star',
    date: '11/10/2026',
    by: 'Raja',
    is_read: false,
    target_section: 'jobs-section',
  },
  {
    id: 3,
    type: 'dry_dock_add',
    tag: 'NEW DRY DOCK ADDED',
    title: 'New Dry Dock "Dry Dock Description (Dry Dock No)" created',
    description: 'Dry Dock SEPT2020/DD1 for Ocean Star successfully created.',
    date: '11/10/2026',
    by: 'Roshan',
    is_read: false,
    target_section: 'quotes-section',
  },
  {
    id: 4,
    type: 'dry_dock_edit',
    tag: 'DRY DOCK EDITED',
    title: 'Dry Dock "Dry Dock Description (Dry Dock No)" edited',
    description: 'Dry Dock OCT2020DD2 budget and timetable updated.',
    date: '11/10/2026',
    by: 'Roshan',
    is_read: false,
    target_section: 'quotes-section',
  },
  {
    id: 5,
    type: 'approved',
    tag: 'QUOTE APPROVED',
    title: 'Quote Approved for Kempell Shipyard',
    description: 'Quotation amount $142,000 for SEPT2020/DD1 approved by superintendent.',
    date: '10/10/2026',
    by: 'Fleet Manager',
    is_read: true,
    target_section: 'quotes-section',
  },
]);

const unreadCount = computed(() => notifications.value.filter((n) => !n.is_read).length);

const filteredNotifications = computed(() => {
  const q = notificationSearch.value.toLowerCase().trim();
  return notifications.value.filter((n) => {
    const matchSearch =
      !q ||
      n.title.toLowerCase().includes(q) ||
      n.description.toLowerCase().includes(q) ||
      n.by.toLowerCase().includes(q) ||
      n.tag.toLowerCase().includes(q);
    const matchFilter =
      notificationFilter.value === "all" ||
      (notificationFilter.value === "unread" && !n.is_read) ||
      (notificationFilter.value === "read" && n.is_read);
    return matchSearch && matchFilter;
  });
});

function openNotifications() {
  selectedNotification.value = null;
  notificationSearch.value = "";
  notificationMenuOpenId.value = null;
  showNotificationModal.value = true;
}

function markAllAsRead() {
  notifications.value.forEach((n) => (n.is_read = true));
  notify("Semua notifikasi ditandai sebagai sudah dibaca");
}

function openNotificationDetail(item: AppNotification) {
  item.is_read = true;
  selectedNotification.value = item;
  notificationMenuOpenId.value = null;
}

function backToNotificationList() {
  selectedNotification.value = null;
}

function toggleItemRead(item: AppNotification) {
  item.is_read = !item.is_read;
  notify(item.is_read ? "Ditandai sudah dibaca" : "Ditandai belum dibaca");
}

function deleteNotification(id: number) {
  notifications.value = notifications.value.filter((n) => n.id !== id);
  if (selectedNotification.value?.id === id) {
    selectedNotification.value = null;
  }
  notificationMenuOpenId.value = null;
  notify("Notifikasi dihapus");
}

function viewNotificationTarget(item: AppNotification) {
  showNotificationModal.value = false;
  selectedNotification.value = null;
  if (item.target_section) {
    const el = document.getElementById(item.target_section);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

// Modals
const showAddQuoteModal = ref(false);
const activeGroupForAdd = ref<VesselQuoteGroup | null>(null);
const newQuoteForm = reactive({
  title: "",
  description: "",
});

const showAddJobModal = ref(false);
const activeDockForJob = ref<DryDockJobGroup | null>(null);
const newJobForm = reactive({
  job_code: "",
  job_name: "",
  description: "",
  job_category: "PMS Job",
  photo_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&auto=format&fit=crop",
});

function notify(msg: string) {
  toast.value = msg;
  setTimeout(() => (toast.value = ""), 3000);
}

// Filtered Quotes Pending Approval
const filteredQuotes = computed(() => {
  if (!overview.value?.quotesPendingApproval) return [];
  const q = searchQuotes.value.toLowerCase().trim();
  if (!q) return overview.value.quotesPendingApproval;

  return overview.value.quotesPendingApproval.map((group) => {
    const matchedItems = group.items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );
    const vesselMatches = group.vessel_name.toLowerCase().includes(q) ||
      group.shipyard_name.toLowerCase().includes(q) ||
      group.dry_dock_no.toLowerCase().includes(q);

    return {
      ...group,
      items: vesselMatches ? group.items : matchedItems,
    };
  }).filter((group) => group.items.length > 0 || group.vessel_name.toLowerCase().includes(q));
});

// Filtered Pending Yard Quotes
const filteredYardQuotes = computed(() => {
  if (!overview.value?.pendingYardQuotes) return [];
  const q = searchYardQuotes.value.toLowerCase().trim();
  if (!q) return overview.value.pendingYardQuotes;

  return overview.value.pendingYardQuotes.map((group) => {
    const matchedItems = group.items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );
    const vesselMatches = group.vessel_name.toLowerCase().includes(q) ||
      group.shipyard_name.toLowerCase().includes(q);

    return {
      ...group,
      items: vesselMatches ? group.items : matchedItems,
    };
  });
});

// Filtered Jobs Awaiting Dock
const filteredJobsGroups = computed(() => {
  if (!overview.value?.jobsAwaitingDock) return [];
  const q = searchJobs.value.toLowerCase().trim();
  const cat = categoryFilter.value;

  return overview.value.jobsAwaitingDock.map((group) => {
    const matchedJobs = group.jobs.filter((j) => {
      const matchText =
        !q ||
        j.job_name.toLowerCase().includes(q) ||
        j.job_code.toLowerCase().includes(q) ||
        (j.description && j.description.toLowerCase().includes(q));
      const matchCat = cat === "all" || j.job_category === cat;
      return matchText && matchCat;
    });

    return {
      ...group,
      jobs: matchedJobs,
    };
  });
});

// Filtered Cost Stats for Bar Chart
const filteredCostStats = computed(() => {
  if (!overview.value?.costsStats) return [];
  if (costFilter.value === "all") return overview.value.costsStats;
  return overview.value.costsStats.filter(
    (c) => c.dry_dock_no === costFilter.value || c.vessel_name === costFilter.value
  );
});

// Calculate Max Cost for Scaling Bar Chart
const maxCostValue = computed(() => {
  if (!filteredCostStats.value.length) return 300000;
  let max = 0;
  for (const c of filteredCostStats.value) {
    if (c.total_budget > max) max = c.total_budget;
    if (c.total_estimates > max) max = c.total_estimates;
    if (c.total_costs > max) max = c.total_costs;
  }
  return Math.ceil(max * 1.15);
});

// Donut Chart Calculations
const totalDonutCount = computed(() => {
  if (!overview.value?.activeDryDocksStats) return 0;
  return overview.value.activeDryDocksStats.reduce((acc, s) => acc + s.count, 0);
});

const donutSegments = computed(() => {
  if (!overview.value?.activeDryDocksStats || totalDonutCount.value === 0) return [];
  const circumference = 2 * Math.PI * 65;
  let offset = 0;

  return overview.value.activeDryDocksStats.map((stat) => {
    const strokeDasharray = (stat.count / totalDonutCount.value) * circumference;
    const strokeDashoffset = -offset;
    offset += strokeDasharray;
    return {
      ...stat,
      strokeDasharray: `${strokeDasharray} ${circumference}`,
      strokeDashoffset,
    };
  });
});

// Action handlers
function openAddQuote(group: VesselQuoteGroup) {
  activeGroupForAdd.value = group;
  newQuoteForm.title = "";
  newQuoteForm.description = "";
  showAddQuoteModal.value = true;
}

async function saveNewQuote() {
  if (!newQuoteForm.title.trim()) {
    notify("Title wajib diisi");
    return;
  }
  if (activeGroupForAdd.value) {
    try {
      await api.post("/work-orders", {
        job_name: newQuoteForm.title.trim(),
        description: newQuoteForm.description.trim() || "Specification pending review",
        dry_dock_id: activeGroupForAdd.value.dry_dock_id,
        job_category: "PMS Job",
      });

      notifications.value.unshift({
        id: Date.now(),
        type: 'quotation',
        tag: 'NEW QUOTATION RECEIVED',
        title: newQuoteForm.title,
        description: `New quote specification added for ${activeGroupForAdd.value.vessel_name}`,
        date: 'Just now',
        by: 'User',
        is_read: false,
        target_section: 'quotes-section',
      });

      notify("Item quote berhasil disimpan ke database!");
      showAddQuoteModal.value = false;
      await refresh();
    } catch (e: any) {
      notify(e?.data?.message || "Gagal menyimpan quote");
    }
  }
}

function openAddJob(group: DryDockJobGroup) {
  activeDockForJob.value = group;
  newJobForm.job_code = `C001.${Math.floor(Math.random() * 900 + 100)}`;
  newJobForm.job_name = "";
  newJobForm.description = "";
  newJobForm.job_category = "PMS Job";
  showAddJobModal.value = true;
}

async function saveNewJob() {
  if (!newJobForm.job_name.trim()) {
    notify("Job Name wajib diisi");
    return;
  }
  if (activeDockForJob.value) {
    try {
      await api.post("/work-orders", {
        job_code: newJobForm.job_code || `C001.${Math.floor(Math.random() * 900 + 100)}`,
        job_name: newJobForm.job_name.trim(),
        description: newJobForm.description.trim(),
        job_category: newJobForm.job_category,
        photo_url: newJobForm.photo_url,
        dry_dock_id: activeDockForJob.value.dry_dock_id,
        total_budget: 12000,
      });

      notifications.value.unshift({
        id: Date.now(),
        type: 'work_order',
        tag: 'WORK ORDER ADDED',
        title: `Job ${newJobForm.job_name} added to ${activeDockForJob.value.dry_dock_no}`,
        description: newJobForm.description || 'New work order specification added',
        date: 'Just now',
        by: 'User',
        is_read: false,
        target_section: 'jobs-section',
      });

      notify("Job berhasil disimpan ke database!");
      showAddJobModal.value = false;
      await refresh();
    } catch (e: any) {
      notify(e?.data?.message || "Gagal menyimpan job");
    }
  }
}

function formatCurrency(val: number | string) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);
}
</script>

<template>
  <div class="dashboard-page">
    <!-- Top Blue Header Banner -->
    <header class="dash-top-header">
      <h1 class="dash-title">Dashboard</h1>
      <div class="dash-top-actions">
        <button
          class="notification-btn"
          title="Open Notifications"
          @click="openNotifications"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="bell-icon">
            <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
          <span v-if="unreadCount > 0" class="badge-count">{{ unreadCount }}</span>
        </button>
      </div>
    </header>

    <!-- SECTION 1: Quotes Pending Approval -->
    <section id="quotes-section" class="board-section">
      <div class="section-header">
        <h2 class="section-title">Quotes Pending Approval</h2>
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="searchQuotes"
            type="text"
            placeholder="Search"
            class="search-input"
          />
        </div>
      </div>

      <div class="kanban-scroller">
        <div class="kanban-columns">
          <div
            v-for="group in filteredQuotes"
            :key="group.vessel_id"
            class="kanban-col"
          >
            <!-- Column Title & Add Button -->
            <div class="col-head">
              <span class="vessel-label">{{ group.vessel_name.toUpperCase() }}</span>
              <button class="plus-btn" title="Add item" @click="openAddQuote(group)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>

            <div class="col-body">
              <!-- Shipyard Header Card -->
              <div class="shipyard-header-card">
                <img
                  :src="group.shipyard_photo"
                  :alt="group.shipyard_name"
                  class="shipyard-thumb"
                />
                <div class="shipyard-meta">
                  <span class="shipyard-title">{{ group.shipyard_name }}</span>
                  <span class="dock-code">{{ group.dry_dock_no }}</span>
                </div>
              </div>

              <!-- Item Cards -->
              <div
                v-for="item in group.items"
                :key="item.id"
                class="item-card active-card"
              >
                <div class="card-inner">
                  <h4 class="card-title">{{ item.title }}</h4>
                  <p class="card-desc">{{ item.description }}</p>
                </div>
              </div>

              <!-- Placeholder / Ghost Cards -->
              <div
                v-for="idx in Math.max(0, 3 - group.items.length)"
                :key="`ph-${idx}`"
                class="item-card placeholder-card"
                @click="openAddQuote(group)"
              >
                <span class="ph-text title">Title...</span>
                <span class="ph-text desc">Description...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 2: Pending Yard Quotes -->
    <section class="board-section">
      <div class="section-header">
        <h2 class="section-title">Pending Yard Quotes</h2>
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="searchYardQuotes"
            type="text"
            placeholder="Search"
            class="search-input"
          />
        </div>
      </div>

      <div class="kanban-scroller">
        <div class="kanban-columns">
          <div
            v-for="group in filteredYardQuotes"
            :key="`yard-${group.vessel_id}`"
            class="kanban-col"
          >
            <div class="col-head">
              <span class="vessel-label">{{ group.vessel_name.toUpperCase() }}</span>
              <button class="plus-btn" title="Add item" @click="openAddQuote(group)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>

            <div class="col-body">
              <div class="shipyard-header-card">
                <img
                  :src="group.shipyard_photo"
                  :alt="group.shipyard_name"
                  class="shipyard-thumb"
                />
                <div class="shipyard-meta">
                  <span class="shipyard-title">{{ group.shipyard_name }}</span>
                  <span class="dock-code">{{ group.dry_dock_no }}</span>
                </div>
              </div>

              <!-- Cards -->
              <div
                v-for="item in group.items"
                :key="`yitem-${item.id}`"
                class="item-card active-card"
              >
                <div class="card-inner">
                  <h4 class="card-title">{{ item.title }}</h4>
                  <p class="card-desc">{{ item.description }}</p>
                </div>
              </div>

              <div
                v-for="idx in Math.max(0, 3 - group.items.length)"
                :key="`yph-${idx}`"
                class="item-card placeholder-card"
                @click="openAddQuote(group)"
              >
                <span class="ph-text title">Title...</span>
                <span class="ph-text desc">Description...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 3: Jobs Awaiting Dock -->
    <section id="jobs-section" class="board-section">
      <div class="section-header">
        <h2 class="section-title">Jobs Awaiting Dock</h2>
        <div class="filter-tools">
          <div class="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              v-model="searchJobs"
              type="text"
              placeholder="Search"
              class="search-input"
            />
          </div>

          <div class="dropdown-wrap">
            <select v-model="categoryFilter" class="filter-select">
              <option value="all">Filter by</option>
              <option value="PMS Job">PMS Job</option>
              <option value="UPM Job">UPM Job</option>
              <option value="Dock Job">Dock Job</option>
              <option value="Time">Time</option>
            </select>
          </div>
        </div>
      </div>

      <div class="kanban-scroller">
        <div class="kanban-columns">
          <div
            v-for="group in filteredJobsGroups"
            :key="group.dry_dock_no"
            class="kanban-col jobs-col"
          >
            <div class="col-head">
              <span class="dock-header-label">{{ group.dry_dock_no }}</span>
              <button class="plus-btn" title="Add Job" @click="openAddJob(group)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>

            <div class="col-body">
              <div
                v-for="job in group.jobs"
                :key="job.id"
                class="job-card"
              >
                <img :src="job.photo_url" :alt="job.job_name" class="job-thumb" />
                <div class="job-content">
                  <h4 class="job-title">{{ job.job_name }}</h4>
                  <span class="job-code">{{ job.job_code }}</span>
                  <span class="badge-pill" :class="job.job_category.toLowerCase().replace(/\s+/g, '-')">
                    {{ job.job_category }}
                  </span>
                </div>
              </div>

              <!-- Placeholder Card if empty or few -->
              <div
                v-if="group.jobs.length < 2"
                class="item-card placeholder-card"
                @click="openAddJob(group)"
              >
                <span class="ph-text title">Title...</span>
                <span class="ph-text desc">Description...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 4 & 5: Charts Row (Active Dry Docks & Costs) -->
    <div class="charts-row">
      <!-- Active Dry Docks Donut Chart Card -->
      <section class="chart-card">
        <h2 class="chart-title">Active Dry Docks</h2>
        
        <div class="donut-chart-container">
          <div class="donut-visual-wrap">
            <svg viewBox="0 0 160 160" class="donut-svg">
              <circle
                cx="80"
                cy="80"
                r="65"
                fill="transparent"
                stroke="#eef2f6"
                stroke-width="22"
              />
              <circle
                v-for="seg in donutSegments"
                :key="seg.label"
                cx="80"
                cy="80"
                r="65"
                fill="transparent"
                :stroke="seg.color"
                stroke-width="22"
                :stroke-dasharray="seg.strokeDasharray"
                :stroke-dashoffset="seg.strokeDashoffset"
                transform="rotate(-90 80 80)"
                class="donut-segment"
              />
            </svg>
          </div>

          <div class="donut-legend">
            <div
              v-for="stat in overview?.activeDryDocksStats"
              :key="stat.label"
              class="legend-item"
            >
              <span class="legend-dot" :style="{ backgroundColor: stat.color }"></span>
              <span class="legend-text">{{ stat.label }} {{ stat.code }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Costs Multi-Bar Chart Card -->
      <section class="chart-card">
        <div class="chart-header-row">
          <h2 class="chart-title">Costs</h2>
          <div class="filter-tools">
            <select v-model="costFilter" class="filter-select">
              <option value="all">Filter by</option>
              <option
                v-for="c in overview?.costsStats"
                :key="c.id"
                :value="c.dry_dock_no"
              >
                {{ c.dry_dock_no }} ({{ c.vessel_name }})
              </option>
            </select>
          </div>
        </div>

        <div class="bar-chart-container">
          <!-- Legend -->
          <div class="bar-legend">
            <div class="legend-item">
              <span class="legend-dot" style="background-color: #29a1ff;"></span>
              <span class="legend-text">Total Budget</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot" style="background-color: #12b76a;"></span>
              <span class="legend-text">Total Estimates</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot" style="background-color: #e63946;"></span>
              <span class="legend-text">Total Costs</span>
            </div>
          </div>

          <!-- Bar Chart Visual -->
          <div class="bar-visual-wrap">
            <div class="bars-group-container">
              <div
                v-for="stat in filteredCostStats"
                :key="stat.id"
                class="dock-bar-column"
              >
                <div class="bars-trio">
                  <!-- Total Budget -->
                  <div
                    class="cost-bar budget-bar"
                    :style="{ height: `${(stat.total_budget / maxCostValue) * 180}px` }"
                    :title="`Budget: ${formatCurrency(stat.total_budget)}`"
                  ></div>
                  <!-- Total Estimates -->
                  <div
                    class="cost-bar estimates-bar"
                    :style="{ height: `${(stat.total_estimates / maxCostValue) * 180}px` }"
                    :title="`Estimates: ${formatCurrency(stat.total_estimates)}`"
                  ></div>
                  <!-- Total Costs -->
                  <div
                    class="cost-bar costs-bar"
                    :style="{ height: `${(stat.total_costs / maxCostValue) * 180}px` }"
                    :title="`Costs: ${formatCurrency(stat.total_costs)}`"
                  ></div>
                </div>
                <span class="dock-bar-label">{{ stat.dry_dock_no }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- NOTIFICATION MAIN MODAL (Image 1) -->
    <div
      v-if="showNotificationModal && !selectedNotification"
      class="modal-overlay"
      @click.self="showNotificationModal = false"
    >
      <div class="notif-modal-card">
        <!-- Modal Top Bar -->
        <div class="notif-modal-top">
          <span class="notif-modal-title">Notifications</span>
          <button class="notif-close-btn" @click="showNotificationModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Blue Hero Header Card -->
        <div class="notif-hero-card">
          <span class="notif-hero-badge">{{ unreadCount }} NEW NOTIFICATIONS</span>
          <h2 class="notif-hero-title">Notifications</h2>
          <p class="notif-hero-sub">You have {{ unreadCount }} unread notifications</p>
        </div>

        <!-- Mark All As Read Bar -->
        <div class="notif-actions-bar">
          <button class="mark-all-btn" @click="markAllAsRead">Mark All As Read</button>
        </div>

        <!-- Search & Filter Bar -->
        <div class="notif-search-row">
          <div class="notif-search-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              v-model="notificationSearch"
              type="text"
              placeholder="Search"
              class="notif-search-input"
            />
          </div>
          <select v-model="notificationFilter" class="notif-filter-btn" title="Filter Status">
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>

        <!-- Notification Items List -->
        <div class="notif-list-container">
          <div
            v-for="item in filteredNotifications"
            :key="item.id"
            class="notif-item-row"
            :class="{ unread: !item.is_read }"
            @click="openNotificationDetail(item)"
          >
            <!-- Left Circular Icon -->
            <div class="notif-icon-wrap" :class="item.type">
              <!-- Quotation icon -->
              <svg v-if="item.type === 'quotation'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <!-- Work order icon -->
              <svg v-else-if="item.type === 'work_order'" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="9" opacity="0.25"/>
                <path d="M12 7v5l3 3"/>
              </svg>
              <!-- Add dry dock icon -->
              <svg v-else-if="item.type === 'dry_dock_add'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <!-- Edit dry dock icon -->
              <svg v-else-if="item.type === 'dry_dock_edit'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              </svg>
              <!-- Approved icon -->
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>

            <!-- Content -->
            <div class="notif-content-wrap">
              <span class="notif-tag-label">{{ item.tag }}</span>
              <h4 class="notif-item-title">{{ item.title }}</h4>
              <span class="notif-item-author">On {{ item.date }} By {{ item.by }}</span>
            </div>

            <!-- Three Dots Action Menu -->
            <div class="notif-action-menu-wrap" @click.stop>
              <button
                class="three-dots-btn"
                title="Options"
                @click="notificationMenuOpenId = notificationMenuOpenId === item.id ? null : item.id"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="2"/>
                  <circle cx="19" cy="12" r="2"/>
                  <circle cx="5" cy="12" r="2"/>
                </svg>
              </button>
              <!-- Popover Menu -->
              <div v-if="notificationMenuOpenId === item.id" class="notif-popover">
                <button @click="toggleItemRead(item); notificationMenuOpenId = null">
                  {{ item.is_read ? 'Mark as unread' : 'Mark as read' }}
                </button>
                <button @click="openNotificationDetail(item)">View detail</button>
                <button class="danger" @click="deleteNotification(item.id)">Delete</button>
              </div>
            </div>
          </div>

          <div v-if="!filteredNotifications.length" class="empty-notifs">
            Tidak ada notifikasi ditemukan.
          </div>
        </div>

        <!-- Bottom Actions -->
        <div class="notif-modal-foot">
          <button class="notif-foot-btn primary" @click="showNotificationModal = false">Submit</button>
          <button class="notif-foot-btn cancel" @click="showNotificationModal = false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- NOTIFICATION DETAIL MODAL (Image 2) -->
    <div
      v-if="showNotificationModal && selectedNotification"
      class="modal-overlay"
      @click.self="showNotificationModal = false"
    >
      <div class="notif-detail-card">
        <!-- Header with Back & Close -->
        <div class="notif-detail-header">
          <button class="detail-back-btn" title="Back to notifications" @click="backToNotificationList">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <span class="detail-header-title">{{ selectedNotification.title }}</span>
          <button class="notif-close-btn" @click="showNotificationModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Detail Body -->
        <div class="notif-detail-body">
          <div class="detail-left-visual">
            <!-- Stylized Inbox / Download tray icon -->
            <div class="inbox-art-icon">
              <svg viewBox="0 0 64 64" fill="none" class="art-svg">
                <!-- Blue tray base -->
                <path d="M8 36 L18 52 L46 52 L56 36 L44 36 L38 42 L26 42 L20 36 Z" fill="#29a1ff"/>
                <path d="M8 36 L12 20 L52 20 L56 36 Z" fill="#1b85e0" opacity="0.6"/>
                <!-- Green Down Arrow -->
                <path d="M32 10 L32 34 M24 26 L32 34 L40 26" stroke="#12b76a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>

          <div class="detail-center-info">
            <span class="detail-author-tag">ON {{ selectedNotification.date }} BY {{ selectedNotification.by.toUpperCase() }}</span>
            <h3 class="detail-main-title">{{ selectedNotification.title }}</h3>
            <p class="detail-main-desc">{{ selectedNotification.description }}</p>
          </div>

          <div class="detail-right-actions">
            <button class="detail-view-btn" @click="viewNotificationTarget(selectedNotification)">VIEW</button>
            <button class="detail-unread-btn" @click="toggleItemRead(selectedNotification)">
              {{ selectedNotification.is_read ? 'Mark As Unread' : 'Mark As Read' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Add Quote / Item -->
    <div v-if="showAddQuoteModal" class="modal-overlay" @click.self="showAddQuoteModal = false">
      <div class="modal-card">
        <h3 class="modal-heading">Add Quote / Item</h3>
        <p class="modal-sub">Vessel: <b>{{ activeGroupForAdd?.vessel_name }}</b> ({{ activeGroupForAdd?.shipyard_name }})</p>

        <label class="form-label">Title <span class="req">*</span></label>
        <input v-model="newQuoteForm.title" type="text" class="form-input" placeholder="e.g. Engine Overhaul Quote" />

        <label class="form-label">Description</label>
        <textarea v-model="newQuoteForm.description" rows="3" class="form-input" placeholder="Enter specification details..."></textarea>

        <div class="modal-foot">
          <button class="action-btn primary" @click="saveNewQuote">Submit</button>
          <button class="action-btn ghost" @click="showAddQuoteModal = false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- MODAL: Add Job -->
    <div v-if="showAddJobModal" class="modal-overlay" @click.self="showAddJobModal = false">
      <div class="modal-card">
        <h3 class="modal-heading">Add Job to {{ activeDockForJob?.dry_dock_no }}</h3>
        
        <label class="form-label">Job Code</label>
        <input v-model="newJobForm.job_code" type="text" class="form-input" placeholder="e.g. C001.009" />

        <label class="form-label">Job Name <span class="req">*</span></label>
        <input v-model="newJobForm.job_name" type="text" class="form-input" placeholder="e.g. Routine Pump Overhaul" />

        <label class="form-label">Job Category</label>
        <select v-model="newJobForm.job_category" class="form-input">
          <option value="PMS Job">PMS Job</option>
          <option value="UPM Job">UPM Job</option>
          <option value="Dock Job">Dock Job</option>
          <option value="Time">Time</option>
        </select>

        <label class="form-label">Description</label>
        <textarea v-model="newJobForm.description" rows="2" class="form-input" placeholder="Job description..."></textarea>

        <div class="modal-foot">
          <button class="action-btn primary" @click="saveNewJob">Add Job</button>
          <button class="action-btn ghost" @click="showAddJobModal = false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- TOAST -->
    <div v-if="toast" class="dash-toast">
      {{ toast }}
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-bottom: 60px;
}

/* Header Banner */
.dash-top-header {
  background: #29a1ff;
  color: #ffffff;
  padding: 18px 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(41, 161, 255, 0.2);
}

.dash-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.notification-btn {
  position: relative;
  background: #ffffff;
  border: 0;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.notification-btn:hover {
  transform: scale(1.06);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
  background: #f8fafc;
}

.bell-icon {
  width: 22px;
  height: 22px;
  color: #29a1ff;
}

.badge-count {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: #e63946;
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 10px;
  border: 2px solid #ffffff;
}

/* Sections */
.board-section {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.filter-tools {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 6px 12px;
  gap: 8px;
  width: 240px;
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
  color: #334155;
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

/* Kanban Columns */
.kanban-scroller {
  overflow-x: auto;
  padding-bottom: 12px;
}

.kanban-columns {
  display: flex;
  gap: 20px;
  min-width: max-content;
}

.kanban-col {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.col-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 4px 10px;
}

.vessel-label,
.dock-header-label {
  font-size: 13px;
  font-weight: 700;
  color: #475467;
  letter-spacing: 0.5px;
}

.plus-btn {
  background: transparent;
  border: 0;
  color: #94a3b8;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.plus-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.plus-btn svg {
  width: 16px;
  height: 16px;
}

.col-body {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 280px;
}

/* Shipyard Header Card */
.shipyard-header-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.shipyard-thumb {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.shipyard-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.shipyard-title {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dock-code {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

/* Item Card */
.item-card {
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.active-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
}

.card-title {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.card-desc {
  margin: 0;
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
}

.placeholder-card {
  border: 1.5px dashed #cbd5e1;
  background: #f8fafc;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.placeholder-card:hover {
  border-color: #94a3b8;
  background: #f1f5f9;
}

.ph-text {
  color: #94a3b8;
}

.ph-text.title {
  font-size: 13px;
  font-weight: 600;
}

.ph-text.desc {
  font-size: 12px;
}

/* Job Cards */
.jobs-col {
  width: 280px;
}

.job-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.job-thumb {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.job-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.job-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
}

.job-code {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

.badge-pill {
  display: inline-block;
  align-self: flex-start;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: #f1f5f9;
  color: #475467;
  margin-top: 2px;
}

.badge-pill.pms-job {
  background: #eff8ff;
  color: #175cd3;
}

.badge-pill.upm-job {
  background: #ecfdf3;
  color: #027a48;
}

.badge-pill.dock-job {
  background: #fef6ee;
  color: #b54708;
}

.badge-pill.time {
  background: #fdf2fa;
  color: #c11574;
}

/* Charts Section */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.chart-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.chart-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.chart-title {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px;
}

.donut-chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 10px 0;
}

.donut-visual-wrap {
  width: 200px;
  height: 200px;
}

.donut-svg {
  width: 100%;
  height: 100%;
}

.donut-segment {
  transition: stroke-width 0.2s ease;
}

.donut-segment:hover {
  stroke-width: 26;
  cursor: pointer;
}

.donut-legend,
.bar-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 20px;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}

.legend-text {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

/* Bar Chart */
.bar-chart-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
}

.bar-visual-wrap {
  min-height: 220px;
  display: flex;
  align-items: flex-end;
  border-bottom: 2px solid #e2e8f0;
  padding-top: 20px;
  padding-bottom: 4px;
}

.bars-group-container {
  display: flex;
  justify-content: space-around;
  width: 100%;
  align-items: flex-end;
  gap: 16px;
}

.dock-bar-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.bars-trio {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 190px;
}

.cost-bar {
  width: 12px;
  border-radius: 3px 3px 0 0;
  transition: height 0.3s ease, filter 0.15s ease;
  cursor: pointer;
}

.cost-bar:hover {
  filter: brightness(0.9);
}

.cost-bar.budget-bar {
  background-color: #29a1ff;
}

.cost-bar.estimates-bar {
  background-color: #12b76a;
}

.cost-bar.costs-bar {
  background-color: #e63946;
}

.dock-bar-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
  white-space: nowrap;
}

/* ================= NOTIFICATION MODALS ================= */
.notif-modal-card {
  background: #ffffff;
  border-radius: 16px;
  width: 540px;
  max-width: 92vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.notif-modal-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.notif-modal-title {
  font-size: 15px;
  font-weight: 600;
  color: #475467;
}

.notif-close-btn {
  background: none;
  border: 0;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.notif-close-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.notif-close-btn svg {
  width: 18px;
  height: 18px;
}

/* Hero Banner */
.notif-hero-card {
  background: #29a1ff;
  color: #ffffff;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notif-hero-badge {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  opacity: 0.9;
}

.notif-hero-title {
  margin: 2px 0 0;
  font-size: 26px;
  font-weight: 700;
}

.notif-hero-sub {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.notif-actions-bar {
  display: flex;
  justify-content: flex-end;
  padding: 12px 20px 4px;
}

.mark-all-btn {
  background: #29a1ff;
  color: #ffffff;
  border: 0;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.mark-all-btn:hover {
  background: #1a8dec;
}

.notif-search-row {
  display: flex;
  padding: 8px 20px 12px;
  gap: 10px;
}

.notif-search-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 6px 10px;
  gap: 8px;
}

.notif-search-input {
  border: 0;
  background: transparent;
  outline: none;
  font-size: 13px;
  width: 100%;
}

.notif-filter-btn {
  padding: 6px 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  color: #475467;
  cursor: pointer;
  outline: none;
}

/* List */
.notif-list-container {
  flex: 1;
  overflow-y: auto;
  max-height: 360px;
  border-top: 1px solid #f1f5f9;
}

.notif-item-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 20px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}

.notif-item-row:hover {
  background: #f8fafc;
}

.notif-item-row.unread {
  background: #f0f7ff;
}

.notif-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #e2e8f0;
  color: #475467;
}

.notif-icon-wrap svg {
  width: 18px;
  height: 18px;
}

.notif-icon-wrap.quotation {
  background: #e0f2fe;
  color: #0284c7;
}

.notif-icon-wrap.dry_dock_add {
  background: #29a1ff;
  color: #ffffff;
}

.notif-icon-wrap.dry_dock_edit {
  background: #29a1ff;
  color: #ffffff;
}

.notif-icon-wrap.approved {
  background: #dcfce7;
  color: #16a34a;
}

.notif-content-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.notif-tag-label {
  font-size: 10.5px;
  font-weight: 800;
  color: #29a1ff;
  letter-spacing: 0.5px;
}

.notif-item-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
}

.notif-item-author {
  font-size: 11px;
  color: #64748b;
}

.notif-action-menu-wrap {
  position: relative;
}

.three-dots-btn {
  background: none;
  border: 0;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.three-dots-btn:hover {
  background: #e2e8f0;
  color: #334155;
}

.three-dots-btn svg {
  width: 18px;
  height: 18px;
}

.notif-popover {
  position: absolute;
  right: 0;
  top: 28px;
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

.notif-popover button {
  background: none;
  border: 0;
  text-align: left;
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  color: #334155;
}

.notif-popover button:hover {
  background: #f1f5f9;
}

.notif-popover button.danger {
  color: #e63946;
}

.empty-notifs {
  padding: 30px 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}

.notif-modal-foot {
  display: flex;
  gap: 10px;
  padding: 14px 20px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.notif-foot-btn {
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 0;
}

.notif-foot-btn.primary {
  background: #29a1ff;
  color: #ffffff;
}

.notif-foot-btn.cancel {
  background: #e2e8f0;
  color: #475467;
}

/* Detail Modal (Image 2) */
.notif-detail-card {
  background: #ffffff;
  border-radius: 16px;
  width: 720px;
  max-width: 92vw;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.notif-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.detail-back-btn {
  background: none;
  border: 0;
  color: #29a1ff;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.detail-back-btn:hover {
  background: #eff8ff;
}

.detail-back-btn svg {
  width: 20px;
  height: 20px;
}

.detail-header-title {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}

.notif-detail-body {
  display: flex;
  align-items: center;
  padding: 36px 28px;
  gap: 24px;
}

.detail-left-visual {
  flex-shrink: 0;
}

.inbox-art-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.art-svg {
  width: 100%;
  height: 100%;
}

.detail-center-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-author-tag {
  font-size: 11px;
  font-weight: 800;
  color: #29a1ff;
  letter-spacing: 0.6px;
}

.detail-main-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.detail-main-desc {
  margin: 0;
  font-size: 13.5px;
  color: #475467;
  line-height: 1.4;
}

.detail-right-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}

.detail-view-btn {
  background: #29a1ff;
  color: #ffffff;
  border: 0;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: background 0.15s;
}

.detail-view-btn:hover {
  background: #1a8dec;
}

.detail-unread-btn {
  background: #f1f5f9;
  color: #475467;
  border: 1px solid #e2e8f0;
  padding: 9px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.detail-unread-btn:hover {
  background: #e2e8f0;
}

/* Regular Form Modals */
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
  width: 440px;
  max-width: 90vw;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-heading {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.modal-sub {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  margin: 12px 0 6px;
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

.action-btn.primary:hover {
  background: #1e8ae6;
}

.action-btn.ghost {
  background: #f1f5f9;
  color: #475467;
}

.dash-toast {
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
@media (max-width: 960px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
  
  .notif-detail-body {
    flex-direction: column;
    text-align: center;
  }
  
  .detail-right-actions {
    width: 100%;
  }
}
</style>
