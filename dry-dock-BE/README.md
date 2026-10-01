# Dry Dock Management System - Backend REST API (`dry-dock-BE`)

Robust RESTful API service built with **Node.js**, **Express**, **TypeScript**, and **MySQL 8** (`mysql2/promise`). Provides CRUD operations, relational queries, transaction support, and data aggregation for the Dry Dock Management platform.

---

## 🏗️ Architecture & Design Pattern

The backend follows an extensible **Layered MVC (Model-View-Controller)** pattern with a reusable **Generic CRUD Core**:

```
dry-dock-BE/
├── src/
│   ├── config/
│   │   └── database.ts              # MySQL connection pool configuration
│   ├── core/
│   │   ├── BaseModel.ts             # Generic CRUD model (find, findById, create, update, delete)
│   │   └── BaseController.ts        # Generic CRUD controller with standard HTTP responses
│   ├── models/                      # Domain models extending BaseModel
│   │   ├── VesselModel.ts
│   │   ├── ShipyardModel.ts
│   │   ├── DryDockModel.ts
│   │   ├── WorkOrderModel.ts
│   │   ├── YardQuoteModel.ts
│   │   ├── ChecklistModel.ts
│   │   └── SpecificationGroupModel.ts
│   ├── controllers/                 # API controllers extending BaseController
│   │   ├── DashboardController.ts   # Analytics & aggregations
│   │   ├── VesselController.ts
│   │   ├── ShipyardController.ts
│   │   ├── DryDockController.ts
│   │   ├── WorkOrderController.ts   # Attach to dry dock & sub-jobs handling
│   │   ├── YardQuoteController.ts   # Status change actions
│   │   ├── ChecklistController.ts   # Dynamic checklist item transactions
│   │   ├── SpecificationGroupController.ts
│   │   └── NotificationController.ts
│   ├── routes/                      # Route definitions
│   │   ├── index.ts                 # Central router index
│   │   └── *.routes.ts              # Domain-specific route handlers
│   ├── seed.ts                      # Core database schema & seed data
│   ├── seed-checklists.ts           # Checklist schema & seed data
│   └── server.ts                    # Express application entry point
├── .env                             # Environment variables configuration
├── package.json                     # Dependencies & scripts
└── tsconfig.json                    # TypeScript compiler configuration
```

---

## 🗄️ Database Schema & Entities

The MySQL database `dry_dock` contains the following normalized tables:

| Table | Description | Key Relationships |
|---|---|---|
| `vessels` | Ship / Vessel master records | One-to-Many with `dry_docks`, `work_orders` |
| `shipyards` | Shipyard partners & dry dock facilities | One-to-Many with `dry_docks`, `yard_quotes` |
| `dry_docks` | Dry dock project master | Foreign keys to `vessels`, `shipyards` |
| `work_orders` | Maintenance and overhaul tasks | Foreign keys to `vessels`, `dry_docks`, `spec_groups` |
| `sub_jobs` | Sub-tasks belonging to a work order | Foreign key to `work_orders` (Cascade Delete) |
| `spares` | Spare parts required for work orders | Foreign key to `work_orders` |
| `yard_quotes` | Shipyard quotation submissions | Foreign keys to `dry_docks`, `shipyards`, `vessels` |
| `checklists` | Inspection and operational checklists | One-to-Many with `checklist_items` |
| `checklist_items` | Individual checklist questions / fields | Foreign key to `checklists` (Cascade Delete) |
| `specification_groups` | Spec grouping categories for dockings | Linked to vessels via JSON / relational IDs |
| `notifications` | System alerts and user notifications | Read/Unread state tracking |

---

## ⚙️ Environment Configuration

Create or configure `.env` in the `dry-dock-BE/` directory:

```env
PORT=4000
CLIENT_URL=http://localhost:3000

# MySQL Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=@Permata2026
DB_NAME=dry_dock
```

---

## 🚀 Setup & Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Database Seeding & Schema Setup
```bash
# Setup main tables and seed data
npx tsx src/seed.ts

# Setup checklists and checklist items
npx tsx src/seed-checklists.ts
```

### 3. Start Development Server
```bash
npm run dev
```
Server will start at: **`http://localhost:4000/api`**

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 📡 REST API Reference

### 📊 Dashboard & Analytics
- **`GET /api/dashboard/overview`**: Summary metrics, pending quotes, jobs awaiting dock, status distribution, and cost comparison metrics.

### ⚓ Dry Docks
- **`GET /api/dry-docks`**: List all dry docks with relational vessel and shipyard details.
- **`GET /api/dry-docks/:id`**: Get single dry dock details, associated specifications, tasks, quotes, and cost breakdowns.
- **`POST /api/dry-docks`**: Create a new dry dock project.
- **`PUT /api/dry-docks/:id`**: Update dry dock details (dates, status, yard stay, budget).
- **`DELETE /api/dry-docks/:id`**: Delete a dry dock record.

### 📋 Work Orders
- **`GET /api/work-orders`**: List all work orders with sub job counts and attached dry dock info.
- **`GET /api/work-orders/:id`**: Single work order detail with sub jobs, spares, and tasks.
- **`POST /api/work-orders`**: Create a new work order.
- **`PUT /api/work-orders/:id`**: Update work order header info.
- **`DELETE /api/work-orders/:id`**: Delete a work order.
- **`POST /api/work-orders/:id/sub-jobs`**: Add a sub job.
- **`DELETE /api/work-orders/sub-jobs/:subJobId`**: Delete a sub job.
- **`POST /api/work-orders/:id/attach-dry-dock`**: Attach work order to a dry dock specification group.

### 💰 Yard Quotes
- **`GET /api/yard-quotes`**: List all yard quotes.
- **`PUT /api/yard-quotes/:id/status`**: Update quote status (`Pending Approval`, `Accepted`, `Rejected`).

### ✅ Checklists
- **`GET /api/checklists`**: List all checklists with item counts.
- **`GET /api/checklists/:id`**: Get checklist with all its items.
- **`POST /api/checklists`**: Create a checklist with initial items (transactional).
- **`PUT /api/checklists/:id`**: Update checklist and sync its item list.
- **`DELETE /api/checklists/:id`**: Delete checklist and cascade items.

### 🏷️ Specification Groups
- **`GET /api/specification-groups`**: List all specification groups.
- **`POST /api/specification-groups`**: Create specification group.
- **`PUT /api/specification-groups/:id`**: Update specification group.
- **`DELETE /api/specification-groups/:id`**: Delete specification group.

### 🔔 Notifications
- **`GET /api/notifications`**: List user notifications.
- **`PUT /api/notifications/mark-all-read`**: Mark all unread notifications as read.
- **`PUT /api/notifications/:id/read`**: Mark specific notification as read.
