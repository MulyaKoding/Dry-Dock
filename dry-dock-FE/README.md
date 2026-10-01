# Dry Dock Management System - Frontend (`dry-dock-FE`)

Modern, responsive maritime operations web application built with **Nuxt 3**, **Vue 3 (Composition API)**, and **TypeScript**. Designed as a high-fidelity replica and extension of the Glide Dry Dock management application.

---

## 🚀 Key Features

1. **Dashboard & Analytics (`/`)**
   - **Kanban Board**: _Quotes Pending Approval_ organized by Vessel & Shipyard with accept/reject quick actions.
   - **Jobs Awaiting Dock**: Kanban columns for work orders & PMS jobs waiting for docking.
   - **Multi-Status Donut Chart**: Real-time distribution of dry dock statuses (_Open, In Progress, On Hold, Complete_).
   - **Costs Variance Multi-Bar Chart**: Dynamic comparison between Total Budget, Total Estimates, and Actual Total Costs.
   - **Interactive Notification Center**: Sliding notification drawer with unread count badges, author metadata, mark all as read, and detailed action modal.

2. **Work Order Master (`/work-orders`)**
   - **3 Switchable View Modes**:
     - **Minimal**: Compact table view with quick specs counter.
     - **Details**: Full operational table displaying responsible rank, estimates, budget, and statuses.
     - **Add to Spec**: Interactive selection mode to batch assign work orders to specific Dry Docks.
   - **Work Order Detail (`/work-orders/:id`)**:
     - Hero overview with live budget & estimate summary cards.
     - Dynamic **Sub Jobs** management with inline creator, order sorting, owner/yard estimates, and job checking.
     - **Related Spares** table.
     - Modal for attaching/linking to Dry Dock projects.

3. **Checklists System (`/checklists`)**
   - Master list with active toggle (_Yes/No_).
   - Right-side slide-in modal drawer with dynamic item builder supporting multiple types (_Text, Number, Boolean, Date_).
   - Full CRUD support with transactional backend syncing.

4. **Dry Docks (`/dry-docks`)**
   - **My Dry Docks**: Visual top hero cards for active vessel dockings.
   - **Minimal & Detailed Grid Views**: Operational dates (Spec, Tender, Award, Arrival, Completion), days in yard, and budget variance.
   - **One-click CSV Data Export**.
   - **Dry Dock Detail (`/dry-docks/:id`)**:
     - Actionable workflow triggers (e.g. **`Start Dry Dock`**).
     - Shipyard selector, priority selectors, and operational timeline.
     - Tabbed navigation (_General, Specifications, Tasks, Sourcing, Execution, Reporting, Costs, Purchase Orders_).
     - Visual cost breakdown charts.

5. **Specification Groups (`/specification-groups`)**
   - Management of specification grouping categories with vessel multi-checkbox selector, sort orders, and frontpage toggles.

---

## 📁 Project Structure

```
dry-dock-FE/
├── app/
│   ├── app.vue                   # Root Vue component with global styling
│   ├── layouts/
│   │   └── default.vue           # App shell layout (Top navigation & collapsible sidebar)
│   ├── pages/
│   │   ├── index.vue             # Dashboard page
│   │   ├── work-orders/
│   │   │   ├── index.vue         # Work Order Master (Minimal, Details, Add to Spec)
│   │   │   └── [id].vue          # Work Order Detail (Sub Jobs, Spares, Specifications)
│   │   ├── checklists/
│   │   │   └── index.vue         # Checklists Master & Side Drawer Item Builder
│   │   ├── dry-docks/
│   │   │   ├── index.vue         # Dry Docks Master (Cards, Grid, Spreadsheet, CSV Export)
│   │   │   └── [id].vue          # Dry Dock Detail (Workflow, Cost Analysis, Yard Selector)
│   │   └── specification-groups/
│   │       └── index.vue         # Specification Groups Master
│   └── composables/
│       └── useApi.ts             # Centralized API fetcher and HTTP helpers
├── nuxt.config.ts                # Nuxt configuration and runtime variables
├── package.json                  # Dependencies and scripts
└── tsconfig.json                 # TypeScript compiler configuration
```

---

## ⚙️ Environment Variables

Configure runtime variables in `.env` or `nuxt.config.ts`:

```env
NUXT_PUBLIC_API_BASE=http://localhost:4000/api
```

---

## 🛠️ Installation & Setup

### Prerequisites

- Node.js >= 18.x (v20+ recommended)
- npm, yarn, or pnpm

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The application will be running at: **`http://localhost:3000`**

### 3. Production Build

```bash
npm run build
npm run preview
```

---

## 🔌 API Integration

The frontend communicates with the REST API using the `useApi()` composable (`app/composables/useApi.ts`), wrapping Nuxt's native `$fetch`:

```typescript
import { useApi } from "~/composables/useApi";

const api = useApi();

// Fetch dry docks
const dryDocks = await api.get("/dry-docks");

// Create a new work order
const newWorkOrder = await api.post("/work-orders", {
  wo_no: "WO-999",
  title: "Main Engine Overhaul",
  // ...
});
```

---

## 🎨 Design & Styling

- Clean maritime enterprise UI inspired by Glide and modern SaaS dashboards.
- Scoped CSS with consistent color palette:
  - **Brand Primary**: Navy Blue (`#1a365d`, `#2b6cb0`)
  - **Accents**: Ocean Blue (`#3182ce`), Emerald Green (`#38a169`), Amber Warning (`#d69e2e`), Crimson Danger (`#e53e3e`)
  - **Neutrals**: Crisp White (`#ffffff`), Slate Backgrounds (`#f7fafc`, `#edf2f7`), Subtle Borders (`#e2e8f0`)
