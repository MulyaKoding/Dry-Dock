# Dry Dock Management System

A full-stack maritime Dry Dock management web application designed for monitoring vessel dockings, work orders, quotations, checklists, and shipyard project costs. Built to replicate and enhance the workflow of the Glide Dry Dock management platform.

---

## 🏗️ Project Architecture

This project is organized as a monorepo consisting of:
- **Frontend (`/dry-dock-FE`)**: Built with [Nuxt 3](https://nuxt.com/) (Vue 3, Composition API, TypeScript, SSR enabled).
- **Backend (`/dry-dock-BE`)**: Built with [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [TypeScript](https://www.typescriptlang.org/), and [MySQL](https://www.mysql.com/) (`mysql2/promise`).

```
exam/
├── README.md               # Main Project Documentation (This file)
├── dry-dock-FE/            # Frontend (Nuxt 3 + Vue 3 + TypeScript)
│   ├── README.md           # Frontend Documentation
│   ├── app/
│   │   ├── layouts/        # Default layout with responsive sidebar
│   │   ├── pages/          # Dashboard, Work Orders, Checklists, Dry Docks, Specification Groups
│   │   └── composables/    # API communication layer
│   └── package.json
└── dry-dock-BE/            # Backend REST API (Node.js + Express + TypeScript + MySQL)
    ├── README.md           # Backend Documentation
    ├── src/
    │   ├── config/         # Database connection pool
    │   ├── core/           # BaseModel & BaseController (Generic CRUD)
    │   ├── models/         # Database models with relational queries
    │   ├── controllers/    # API controllers
    │   ├── routes/         # Express routing definitions
    │   └── seed.ts         # Database seed script
    └── package.json
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: >= 18.x (v20+ recommended)
- **MySQL / MariaDB**: Server running on `127.0.0.1:3306`
- **npm** or **pnpm** / **yarn**

---

### 1. Database Setup
1. Create a MySQL database named `dry_dock`:
   ```sql
   CREATE DATABASE dry_dock CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. Configure environment variables in `dry-dock-BE/.env`:
   ```env
   PORT=4000
   CLIENT_URL=http://localhost:3000

   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=dry_dock
   ```

3. Seed the initial data:
   ```bash
   cd dry-dock-BE
   npm install
   npx tsx src/seed.ts
   npx tsx src/seed-checklists.ts
   ```

---

### 2. Running the Backend
```bash
cd dry-dock-BE
npm install
npm run dev
```
Backend API will be running at: **`http://localhost:4000/api`**

---

### 3. Running the Frontend
```bash
cd dry-dock-FE
npm install
npm run dev
```
Frontend Web App will be accessible at: **`http://localhost:3000`**

---

## 🌟 Application Modules & Features

### 1. 📊 Dashboard (`/`)
- **Quotes Pending Approval**: Kanban board grouped by vessel and shipyard with approval workflow.
- **Pending Yard Quotes**: Tracking submitted yard quotes awaiting decision.
- **Jobs Awaiting Dock**: Visual column board of work orders and PMS jobs queued for upcoming dry docks.
- **Active Dry Docks Donut Chart**: Interactive status distribution (*Open, In Progress, On Hold, Complete*).
- **Costs Multi-Bar Comparison**: Dynamic visualization comparing *Total Budget*, *Total Estimates*, and *Actual Total Costs*.
- **Interactive Notification Center**: Popup drawer with unread badges, author tags, mark all as read, and detailed action view.

### 2. 📋 Work Order Master (`/work-orders`)
- Multi-view mode switcher: **Minimal**, **Details**, and **Add to Spec**.
- Category filter (*PMS Job, Dock Job, UPM Job, Time, Check*).
- Modal creation & live editing.
- **Work Order Detail Page (`/work-orders/:id`)**:
  - Hero header with machinery group, responsible rank, and budget metrics.
  - Sub Jobs table with sort orders, internal job check, owner/yard estimates, and dynamic item adding.
  - Related Spares management.
  - Direct linking to Dry Dock specifications.

### 3. ✅ Checklists (`/checklists`)
- Master list of operational & audit checklists (*Audit, Cleaning, Safety, Hot Work, Daily, etc.*).
- Active toggle status (*Yes / No*).
- Right-side slide-in modal drawer with dynamic item builder supporting multiple data types (*Text, Number, Boolean, Date*).
- Relational database persistence with transactional consistency.

### 4. ⚓ Dry Docks (`/dry-docks`)
- **My Dry Docks**: Top visual hero cards showcasing active vessels.
- Switchable views: **Minimal List** (with quick copy) and **Detailed Spreadsheet Grid** (with all operational dates, variance, and specs count).
- Full CSV Data Export.
- **Dry Dock Detail Page (`/dry-docks/:id`)**:
  - Segment navigation: *General, Specifications, Tasks, Sourcing, Execution, Reporting, Costs, Purchase Orders*.
  - Status change trigger (**`Start Dry Dock`**).
  - Shipyard selector, priority buttons, and live budget analytics.
  - Cost analysis charts (*Status Donut, Yard Stay Donut, Comparison Bar Chart*).

### 5. 🏷️ Specification Groups (`/specification-groups`)
- Grouping master data by vessel associations, group codes, sort orders, and frontpage toggles.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | [Nuxt 3](https://nuxt.com/) (Vue 3 + Vite) |
| **Styling** | Scoped CSS with modern design tokens & variables |
| **Backend Runtime** | Node.js with TypeScript |
| **Web Framework** | Express.js |
| **Database** | MySQL 8 / MariaDB |
| **Database Driver** | `mysql2/promise` with connection pooling |
| **Architecture Pattern** | Layered MVC (Model-View-Controller) + Generic CRUD |

---

## 📄 License
Internal assessment and development project.
