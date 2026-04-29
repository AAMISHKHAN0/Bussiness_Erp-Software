# Kinetic Vault ERP — Enterprise Resource Planning Suite

![Kinetic Vault Banner](https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426&ixlib=rb-4.0.3)

Kinetic Vault is a modern, enterprise-grade **ERP (Enterprise Resource Planning)** software designed to streamline business operations. Built with a focus on real-time intelligence, high performance, and professional aesthetics, it provides a unified platform for managing Every aspect of a business.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **PostgreSQL**: (Optional, MockDB mode available)

### Installation
```bash
# Clone the repository
git clone https://github.com/AAMISHKHAN0/Bussiness-Erp-Software.git

# Install all dependencies (Root, Frontend, Backend)
npm run install:all
```

### Running the Application
```bash
# Start both Frontend & Backend in development mode
npm run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:5000
```

---

## 🏗️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, TanStack Query, Framer Motion |
| **Backend** | Node.js, Express, Winston (Logging), JWT |
| **Database** | PostgreSQL (Primary) / MockDB (Dev Fallback) |
| **Icons** | Lucide React |

---

## 📖 A to Z Module Guide

### 1. Enterprise Dashboard
The central nervous system of your business.
- **Real-time Stats**: Track Total Revenue, Sales volume, Product counts, and Employee headcount at a glance.
- **Interactive Charts**: Visualize Sales trends and Revenue distribution.
- **Digital Clock**: Keep business operations synchronized.
- **Recent Activity**: Quick view of the latest 5 sales orders.

### 2. Inventory & Stock Control
Master your supply chain with precision.
- **Product Management**: Create, edit, and delete products with SKU tracking and pricing.
- **Category Tree**: Organize products into logical hierarchies.
- **Stock Ledger**: Monitor real-time stock levels across all items.
- **CSV Export**: Download your entire inventory for offline analysis.

### 3. Sales & CRM
Drive revenue and manage customer relationships.
- **Customer Directory**: Full CRM capabilities to track client data.
- **Sales Orders**: Lifecycle management from "Pending" to "Completed".
- **Smart Invoicing**: Generate professional PDF invoices directly from orders.
- **Status Tracking**: Visual indicators for order processing stages.

### 4. Purchasing & Procurement
Streamline vendor relations and stock intake.
- **Supplier Directory**: Manage your network of vendors and partners.
- **Purchase Orders (PO)**: Standardized procurement workflows.
- **Goods Received Note (GRN)**: Verify incoming inventory against POs.
- **Total Cost Analysis**: Track procurement spending in real-time.

### 5. Accounting & Finance
Enterprise-grade financial transparency.
- **Chart of Accounts (CoA)**: Manage ledger accounts (Assets, Liabilities, Equity, etc.).
- **General Ledger**: Post and track journal entries with debit/credit balancing.
- **Financial Statements**: Access Income Statements, Balance Sheets, and Trial Balances.
- **Monetary Precision**: Automated balance calculations based on transactions.

### 6. HR & Payroll
Empower your workforce.
- **Employee Directory**: Centralized records for all staff, designations, and join dates.
- **Attendance Tracking**: Monitor daily presence with visual status badges.
- **Payroll Matrix**: Manage monthly salary disbursements and payment statuses.

### 7. Media & Document Manager
Centralized storage for business assets.
- **File Management**: Securely upload and store invoices, contracts, and images.
- **Storage Monitoring**: Real-time tracking of used storage vs. limits.
- **Built-in Previews**: View images and documents directly within the ERP.

### 8. Analytics & Business Intelligence
Data-driven decision making.
- **KPI Engine**: Key metrics for profit margins, gross profit, and costs.
- **Top Customers**: Automatically rank clients by total lifecycle spending.
- **Category Breakdown**: Distribution of inventory value across categories.
- **Completion Rates**: Monitor efficiency of sales and procurement fulfillment.

### 9. Control Center (Admin/Settings)
System-wide governance.
- **System Settings**: Global configuration for Company Profile, Currency, and Timezone.
- **Security Audit Logs**: A live, cryptographic feed of every administrative action.
- **Health Monitoring**: Real-time telemetry for CPU usage, Memory, and Database socket health.
- **Brand Management**: Upload company logos to customize the interface.

---

## 🛡️ Security & Activation
- **JWT Authentication**: Secure, token-based access with brute-force protection.
- **License System**: Tiered activation keys (Day, Month, Quarter, Year) to control software access.
- **Activation Page**: Branding-integrated key validation flow.

---

## 📋 Recommended Credentials (Development)
- **Email**: `admin@company.com`
- **Password**: `password123`
- **Activation Key**: `YER-A1B2-C3D4-E5F6` (1 Year License)

---

Developed with ❤️ for **Production Readiness**.
