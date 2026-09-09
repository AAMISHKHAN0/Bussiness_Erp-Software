# Apex Dynamics ERP — Next-Gen Enterprise Operating Suite (2024–2028 Edition)

A state-of-the-art, unified **Full-Stack Next.js Enterprise Resource Planning (ERP)** software suite designed for modern multi-national businesses.

Built on **Next.js 15 (App Router)**, **React 19**, **Tailwind CSS**, and **Recharts**, this platform replaces legacy split architectures with a single unified codebase deployable to **Vercel in 1-click** with **zero external backend dependencies**.

---

## 🌟 2024–2028 Next-Gen Features & Core Modules

### 1. 🤖 AI ERP Business Copilot
- Intelligent natural language assistant built directly into the UI (`Ask ERP Copilot`).
- Live database queries for real-time treasury balances, inventory restock alerts, sales summaries, and payroll checks.
- Contextual prompt recommendations for rapid executive decision-making.

### 2. ⚡ Universal Command Palette (`Ctrl+K` / `Cmd+K`)
- Omnipresent search and action runner.
- Jump to any module, trigger quick actions (*Draft Sales Order*, *Post Journal Voucher*, *Add Product SKU*, *Toggle Theme*), or switch executive roles in seconds.

### 3. 📊 Executive Dashboard & Business Intelligence
- Real-time KPI aggregation: **Total Revenue**, **Operating Treasury Balance**, **Warehouse Stock Units**, and **Active Workforce**.
- Interactive **Recharts** displaying monthly revenue trends, operational expenses, and gross margins.
- Live stream of recent orders and critical inventory replenishment warnings.
- Integrated digital clock & system telemetry diagnostics.

### 4. 📦 Inventory & Multi-Warehouse Management
- Centralized tracking of products, categories, SKU codes, and barcodes.
- Dynamic stock level indicators with automatic low-stock alerts.
- Transactional stock adjustments with complete audit logging.
- Instant CSV catalog export.

### 5. 💼 Sales & CRM Order Pipeline
- Customer account directory with credit limit tracking and transaction history.
- End-to-end Sales Order processing (`Draft` -> `Confirmed` -> `Shipped` -> `Delivered`).
- **Commercial Printable Invoices**: Formatted corporate invoices with tax breakdown, settlement wire instructions, and direct Print / PDF export.
- Automated inventory deduction upon order creation.

### 6. 🚚 Procurement & Supply Chain
- Vendor catalog with category mapping and verified supplier ratings (1.0 - 5.0).
- Purchase Order system (`Draft` -> `Ordered` -> `Received`).
- **Goods Receipt Note (GRN)**: Receiving shipments automatically restocks warehouse inventory.

### 7. ⚖️ Double-Entry Financial Accounting Suite
- Standardized Chart of Accounts (Assets, Liabilities, Equity, Revenue, Expenses).
- Journal transaction vouchers with **strict mathematical validation** (Debits must equal Credits).
- **Interactive Balance Sheet**: Real-time calculated Assets vs. Liabilities & Equity with balance verification.
- **Statement of Profit & Loss (Income Statement / P&L)**: Gross Revenue, COGS, Gross Profit, Operating Expenses, and Net Operating Income.
- **Trial Balance**: Complete debit/credit ledger equality matrix with live verification.

### 8. 👥 HR & Digital Attendance Punch Clock
- Complete employee directory with designations, departments, basic salaries, and contact details.
- **Digital Punch Clock**: Interactive Clock-In / Clock-Out tracking with real-time timestamps.
- **Automated Payroll Engine**: One-click monthly payroll generation with allowances, tax deductions, and net payouts.

### 9. 🛡️ Immutable System Audit Logs
- Tamper-resistant log of all administrative actions, user sessions, stock adjustments, and journal entries.
- Filtering by module, operator, timestamp, and IP address.

### 10. 🎨 Adaptive Theme & 1-Click Role Switcher
- Sleek **Dark Mode** and **Light Mode** design with custom glassmorphism and Tailwind tokens.
- **1-Click Role Switcher**: Seamlessly test roles (*Super Admin*, *Financial Controller*, *HR Director*, *Inventory Specialist*, *Senior Sales Rep*) without entering passwords.

---

## 🚀 Technology Stack

- **Framework:** Next.js 15 (App Router, Server & Client Components)
- **Frontend Engine:** React 19
- **Styling:** Tailwind CSS + custom glassmorphic tokens & micro-animations
- **Data Visualizations:** Recharts
- **Icons:** Lucide React
- **Data Layer:** High-speed in-memory transactional database with automatic JSON disk persistence (`data/erp_database.json`) and PostgreSQL connection support via `DATABASE_URL`.
- **Target Deployment:** Vercel (1-Click, Zero Config)

---

## 💻 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ or v20+ recommended)
- `npm`

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```

Navigate to:
```
http://localhost:3000
```

### 3. Default Credentials & Role Switcher
- **Email:** `admin@company.com`
- **Password:** `password123`
- *(Alternatively, use the 1-Click Role buttons on `/login` or the top navbar profile menu to instantly switch roles!)*

---

## 🌍 Vercel Production Deployment (1-Click)

Because this is a **100% unified Next.js fullstack application**:

1. Push this repository to **GitHub**.
2. Go to [Vercel.com](https://vercel.com/) and click **Add New Project**.
3. Select your repository. Vercel will automatically detect **Next.js**.
4. Click **Deploy**.
5. *No environment variables or secondary backend servers (like Railway or PM2) are required!*

---

## 📁 Repository Structure

```
├── data/                      # Persistent database file (auto-generated)
├── src/
│   ├── app/
│   │   ├── api/               # Next.js API Route Handlers (REST endpoints)
│   │   │   ├── auth/          # Authentication & Role Switcher
│   │   │   ├── dashboard/     # Executive KPIs & trends
│   │   │   ├── inventory/     # SKUs, categories, adjustments
│   │   │   ├── sales/         # Sales orders & invoices
│   │   │   ├── purchases/     # POs & goods receiving
│   │   │   ├── customers/     # CRM directory
│   │   │   ├── vendors/       # Supplier directory
│   │   │   ├── accounting/    # Double-entry ledger, Balance Sheet, P&L
│   │   │   ├── hr/            # Employees, punch clock, payroll
│   │   │   ├── analytics/     # BI profitability matrices
│   │   │   ├── ai-copilot/    # Natural language ERP assistant
│   │   │   └── admin/         # Global settings & audit logs
│   │   ├── dashboard/         # Executive BI Dashboard
│   │   ├── inventory/         # Warehouse & Catalog management
│   │   ├── sales/             # Sales orders & Printable Invoices
│   │   ├── purchases/         # Procurement & GRN
│   │   ├── customers/         # Customer CRM
│   │   ├── vendors/           # Supplier directory
│   │   ├── accounting/        # Double-entry accounting hub
│   │   ├── hr/                # Workforce & Punch Clock
│   │   ├── analytics/         # BI analytics drill-downs
│   │   ├── audit-logs/        # Audit trail viewer
│   │   ├── admin/             # System settings & health
│   │   ├── login/             # 1-Click Role & Credential login
│   │   ├── globals.css        # Enterprise design tokens & dark mode
│   │   └── layout.jsx         # Root layout with theme & auth providers
│   ├── components/
│   │   ├── common/            # CommandPalette, AICopilotWidget, InvoiceModal, Modal
│   │   └── layout/            # AppShell, Sidebar, Topbar
│   ├── context/               # AuthContext & ThemeContext
│   └── lib/                   # Transactional db engine & enterprise seed data
├── legacy_backup/             # Archived previous React + Express files
├── next.config.mjs
├── tailwind.config.mjs
└── package.json
```