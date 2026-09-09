// Standard Corporate Enterprise Seed Dataset for Global Enterprise Solutions ERP
// Realistic, interconnected GAAP compliant data spanning all operational modules

export const INITIAL_SEED_DATA = {
  settings: {
    company_name: "Global Enterprise Solutions Inc.",
    legal_name: "Global Business Technologies & Systems Inc.",
    tax_id: "US-EIN-12-3456789",
    company_email: "contact@globalenterprise.com",
    company_phone: "+1 (212) 555-0180",
    address: "450 Lexington Avenue, 28th Floor, New York, NY 10017",
    currency: "USD",
    currency_symbol: "$",
    timezone: "America/New_York",
    fiscal_year_start: "January",
    default_tax_rate: 8.5,
    logo_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=128&auto=format&fit=crop&q=80"
  },

  branches: [
    { id: "b-1", name: "HQ - New York Corporate Center", code: "NYC-HQ", address: "450 Lexington Ave, New York, NY", is_main: true },
    { id: "b-2", name: "Central Distribution & Logistics", code: "CHI-DIST", address: "3500 Logistics Way, Chicago, IL", is_main: false },
    { id: "b-3", name: "West Coast Technical Operations", code: "SJC-OPS", address: "100 Innovation Blvd, San Jose, CA", is_main: false }
  ],

  warehouses: [
    { id: "wh-1", name: "HQ East Coast Staging Hub", code: "WH-NYC-01", branch_id: "b-1", address: "450 Lexington Ave, New York, NY", capacity_units: 50000, is_active: true },
    { id: "wh-2", name: "Midwest Logistics Distribution Center", code: "WH-CHI-01", branch_id: "b-2", address: "3500 Logistics Way, Chicago, IL", capacity_units: 75000, is_active: true },
    { id: "wh-3", name: "West Coast Micro-Depot", code: "WH-SJC-01", branch_id: "b-3", address: "100 Innovation Blvd, San Jose, CA", capacity_units: 35000, is_active: true }
  ],

  roles: [
    { id: "r-1", name: "Super Admin", description: "Unrestricted operational, accounting, and system authority" },
    { id: "r-2", name: "Executive Admin", description: "Executive departmental oversight and reporting" },
    { id: "r-3", name: "Financial Controller", description: "General ledger, journal vouchers, reconciliation & statements" },
    { id: "r-4", name: "Inventory Specialist", description: "Stock transfers, warehouse adjustments, and catalog management" },
    { id: "r-5", name: "HR Director", description: "Staff directory, digital attendance, and payroll issuance" },
    { id: "r-6", name: "Senior Sales Representative", description: "Customer accounts, quotations, and sales order fulfillment" }
  ],

  users: [
    {
      id: "u-1",
      email: "admin@company.com",
      password_hash: "$2a$10$7rA1mDvh8t1Yq9gP8D0GceJ6b8V6c0sXJ3.FmB3Y8p2vA3J6v3kO6", // password123
      first_name: "Alexander",
      last_name: "Sterling",
      role: "Super Admin",
      role_id: "r-1",
      branch_id: "b-1",
      department: "Executive Leadership",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&auto=format&fit=crop&q=80",
      phone: "+1 (212) 555-0101",
      is_active: true
    },
    {
      id: "u-2",
      email: "accountant@company.com",
      password_hash: "$2a$10$7rA1mDvh8t1Yq9gP8D0GceJ6b8V6c0sXJ3.FmB3Y8p2vA3J6v3kO6",
      first_name: "Victoria",
      last_name: "Chen",
      role: "Financial Controller",
      role_id: "r-3",
      branch_id: "b-1",
      department: "Finance & Corporate Accounting",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=96&auto=format&fit=crop&q=80",
      phone: "+1 (212) 555-0102",
      is_active: true
    },
    {
      id: "u-3",
      email: "inventory@company.com",
      password_hash: "$2a$10$7rA1mDvh8t1Yq9gP8D0GceJ6b8V6c0sXJ3.FmB3Y8p2vA3J6v3kO6",
      first_name: "Marcus",
      last_name: "Vance",
      role: "Inventory Specialist",
      role_id: "r-4",
      branch_id: "b-2",
      department: "Supply Chain & Operations",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&auto=format&fit=crop&q=80",
      phone: "+1 (212) 555-0103",
      is_active: true
    },
    {
      id: "u-4",
      email: "hr@company.com",
      password_hash: "$2a$10$7rA1mDvh8t1Yq9gP8D0GceJ6b8V6c0sXJ3.FmB3Y8p2vA3J6v3kO6",
      first_name: "Sophia",
      last_name: "Martinez",
      role: "HR Director",
      role_id: "r-5",
      branch_id: "b-1",
      department: "Human Resources",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=96&auto=format&fit=crop&q=80",
      phone: "+1 (212) 555-0104",
      is_active: true
    },
    {
      id: "u-5",
      email: "sales@company.com",
      password_hash: "$2a$10$7rA1mDvh8t1Yq9gP8D0GceJ6b8V6c0sXJ3.FmB3Y8p2vA3J6v3kO6",
      first_name: "Derrick",
      last_name: "Cole",
      role: "Senior Sales Representative",
      role_id: "r-6",
      branch_id: "b-3",
      department: "Commercial Enterprise Sales",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&auto=format&fit=crop&q=80",
      phone: "+1 (212) 555-0105",
      is_active: true
    }
  ],

  categories: [
    { id: "cat-1", name: "Enterprise Rack Servers", code: "SRV", description: "2U/4U Rackmount compute servers and virtualization nodes" },
    { id: "cat-2", name: "Industrial Networking", code: "NET", description: "Managed Layer-3 switches, routers, and optical transceivers" },
    { id: "cat-3", name: "Power & Infrastructure", code: "PWR", description: "Online double-conversion UPS units and metered rack PDUs" },
    { id: "cat-4", name: "Network Security & Firewalls", code: "SEC", description: "Next-generation firewalls, VPN concentrators, and appliances" },
    { id: "cat-5", name: "Structured Cabling & Racks", code: "CAB", description: "Enclosure cabinets, patch panels, and bulk Cat6A copper" }
  ],

  products: [
    {
      id: "p-1",
      name: "HPE ProLiant DL380 Gen11 2U Server",
      sku: "HPE-DL380-G11",
      barcode: "8901234567890",
      category_id: "cat-1",
      category_name: "Enterprise Rack Servers",
      unit: "Units",
      purchase_price: 3450.00,
      selling_price: 5890.00,
      quantity: 35,
      min_stock_level: 8,
      location: "Warehouse Bay A-04",
      supplier_name: "Ingram Micro Global Distribution",
      supplier_id: "sup-3",
      status: "In Stock",
      is_active: true
    },
    {
      id: "p-2",
      name: "Cisco Catalyst 9300 48-Port PoE+ Switch",
      sku: "CSCO-CAT-9300",
      barcode: "8901234567891",
      category_id: "cat-2",
      category_name: "Industrial Networking",
      unit: "Units",
      purchase_price: 2800.00,
      selling_price: 4750.00,
      quantity: 28,
      min_stock_level: 6,
      location: "Warehouse Bay B-12",
      supplier_name: "Cisco Systems Commercial Channel",
      supplier_id: "sup-1",
      status: "In Stock",
      is_active: true
    },
    {
      id: "p-3",
      name: "Dell PowerEdge R760 Dual-Xeon Server",
      sku: "DELL-PE-R760",
      barcode: "8901234567892",
      category_id: "cat-1",
      category_name: "Enterprise Rack Servers",
      unit: "Units",
      purchase_price: 3100.00,
      selling_price: 5400.00,
      quantity: 18,
      min_stock_level: 6,
      location: "Warehouse Bay A-06",
      supplier_name: "Dell Technologies Enterprise Channel",
      supplier_id: "sup-2",
      status: "In Stock",
      is_active: true
    },
    {
      id: "p-4",
      name: "APC NetShelter 30A Zero-U Metered PDU",
      sku: "APC-PDU-30A",
      barcode: "8901234567893",
      category_id: "cat-3",
      category_name: "Power & Infrastructure",
      unit: "Units",
      purchase_price: 240.00,
      selling_price: 480.00,
      quantity: 6,
      min_stock_level: 10,
      location: "Warehouse Bay C-02",
      supplier_name: "Schneider Electric / APC Infrastructure",
      supplier_id: "sup-5",
      status: "Low Stock Alert",
      is_active: true
    },
    {
      id: "p-5",
      name: "Eaton 9PX 10kVA Double-Conversion UPS",
      sku: "ETN-UPS-10K",
      barcode: "8901234567894",
      category_id: "cat-3",
      category_name: "Power & Infrastructure",
      unit: "Units",
      purchase_price: 2600.00,
      selling_price: 4800.00,
      quantity: 9,
      min_stock_level: 4,
      location: "Freight Dock Staging 2",
      supplier_name: "Schneider Electric / APC Infrastructure",
      supplier_id: "sup-5",
      status: "In Stock",
      is_active: true
    },
    {
      id: "p-6",
      name: "Fortinet FortiGate 200F Enterprise Firewall",
      sku: "FTNT-FG-200F",
      barcode: "8901234567895",
      category_id: "cat-4",
      category_name: "Network Security & Firewalls",
      unit: "Units",
      purchase_price: 1850.00,
      selling_price: 3200.00,
      quantity: 15,
      min_stock_level: 5,
      location: "Security Storage Vault 1",
      supplier_name: "Ingram Micro Global Distribution",
      supplier_id: "sup-3",
      status: "In Stock",
      is_active: true
    },
    {
      id: "p-7",
      name: "Tripp Lite 42U Server Rack Enclosure Cabinet",
      sku: "TPL-SR-42U",
      barcode: "8901234567896",
      category_id: "cat-5",
      category_name: "Structured Cabling & Racks",
      unit: "Units",
      purchase_price: 750.00,
      selling_price: 1350.00,
      quantity: 12,
      min_stock_level: 4,
      location: "Freight Dock Staging 1",
      supplier_name: "Fastenal Industrial Supply Corp",
      supplier_id: "sup-4",
      status: "In Stock",
      is_active: true
    },
    {
      id: "p-8",
      name: "Honeywell Pro-Watch IP Biometric Terminal",
      sku: "HON-BIO-900",
      barcode: "8901234567897",
      category_id: "cat-4",
      category_name: "Network Security & Firewalls",
      unit: "Units",
      purchase_price: 480.00,
      selling_price: 890.00,
      quantity: 4,
      min_stock_level: 8,
      location: "Warehouse Bay B-02",
      supplier_name: "Fastenal Industrial Supply Corp",
      supplier_id: "sup-4",
      status: "Low Stock Alert",
      is_active: true
    },
    {
      id: "p-9",
      name: "Belden Cat6A 1000ft Shielded Bulk Cable Spool",
      sku: "BLD-CAT6A-1K",
      barcode: "8901234567898",
      category_id: "cat-5",
      category_name: "Structured Cabling & Racks",
      unit: "Spools",
      purchase_price: 180.00,
      selling_price: 340.00,
      quantity: 54,
      min_stock_level: 15,
      location: "Warehouse Bay D-05",
      supplier_name: "Fastenal Industrial Supply Corp",
      supplier_id: "sup-4",
      status: "In Stock",
      is_active: true
    }
  ],

  customers: [
    {
      id: "cust-1",
      name: "Apex Logistics International",
      company_name: "Apex Logistics International Corp",
      contact_person: "David Vance",
      email: "dvance@apexlogistics.com",
      phone: "+1 (312) 555-0144",
      address: "200 South Wacker Drive, Suite 1800, Chicago, IL 60606",
      tax_number: "US-IL-992104",
      credit_limit: 75000.00,
      total_spent: 86400.00,
      current_balance: 14250.00,
      status: "Active"
    },
    {
      id: "cust-2",
      name: "Vanguard Health Systems Inc.",
      company_name: "Vanguard Regional Hospital Network",
      contact_person: "Dr. Marcus Sterling",
      email: "msterling@vanguardhealth.org",
      phone: "+1 (617) 555-0182",
      address: "100 Binney Street, Cambridge, MA 02142",
      tax_number: "US-MA-441029",
      credit_limit: 120000.00,
      total_spent: 194500.00,
      current_balance: 28900.00,
      status: "Active"
    },
    {
      id: "cust-3",
      name: "Horizon Renewable Power LLC",
      company_name: "Horizon Clean Energy Microgrids",
      contact_person: "Chloe Bennett",
      email: "cbennett@horizonpower.com",
      phone: "+1 (512) 555-0193",
      address: "301 Congress Avenue, Suite 1200, Austin, TX 78701",
      tax_number: "US-TX-779330",
      credit_limit: 50000.00,
      total_spent: 58200.00,
      current_balance: 0.00,
      status: "Active"
    },
    {
      id: "cust-4",
      name: "Morgan & Sterling Capital",
      company_name: "Morgan & Sterling Financial Partners LLC",
      contact_person: "Arthur Pendelton",
      email: "apendelton@mscapital.com",
      phone: "+1 (212) 555-0115",
      address: "40 Wall Street, 42nd Floor, New York, NY 10005",
      tax_number: "US-NY-990445",
      credit_limit: 200000.00,
      total_spent: 342000.00,
      current_balance: 47250.00,
      status: "Active"
    },
    {
      id: "cust-5",
      name: "Pacific Coast Manufacturing Group",
      company_name: "Pacific Coast Precision Assemblies Corp",
      contact_person: "Elena Rostova",
      email: "erostova@pacificmfg.com",
      phone: "+1 (415) 555-0177",
      address: "500 Howard Street, San Francisco, CA 94105",
      tax_number: "US-CA-555321",
      credit_limit: 90000.00,
      total_spent: 128400.00,
      current_balance: 8500.00,
      status: "Active"
    }
  ],

  suppliers: [
    {
      id: "sup-1",
      name: "Cisco Systems Commercial Channel",
      contact_person: "Mark Henderson",
      email: "orders@cisco-direct.com",
      phone: "+1 (408) 555-0188",
      address: "170 West Tasman Dr, San Jose, CA 95134",
      tax_number: "US-CA-943019",
      category: "Industrial Networking",
      rating: 4.9,
      total_orders: 36,
      status: "Preferred Vendor"
    },
    {
      id: "sup-2",
      name: "Dell Technologies Enterprise Channel",
      contact_person: "Jennifer Hayes",
      email: "b2b@dell.com",
      phone: "+1 (800) 555-0120",
      address: "One Dell Way, Round Rock, TX 78682",
      tax_number: "US-TX-881023",
      category: "Enterprise Servers",
      rating: 4.8,
      total_orders: 42,
      status: "Preferred Vendor"
    },
    {
      id: "sup-3",
      name: "Ingram Micro Global Distribution",
      contact_person: "Robert Zhang",
      email: "orders@ingrammicro.com",
      phone: "+1 (714) 555-0199",
      address: "3351 Michelson Dr, Irvine, CA 92612",
      tax_number: "US-CA-794609",
      category: "Enterprise Hardware & Security",
      rating: 4.7,
      total_orders: 28,
      status: "Active"
    },
    {
      id: "sup-4",
      name: "Fastenal Industrial Supply Corp",
      contact_person: "Brian Miller",
      email: "commercial@fastenal.com",
      phone: "+1 (507) 555-0140",
      address: "2001 Theurer Blvd, Winona, MN 55987",
      tax_number: "US-MN-555321",
      category: "Cabling, Racks & Enclosures",
      rating: 4.6,
      total_orders: 24,
      status: "Active"
    },
    {
      id: "sup-5",
      name: "Schneider Electric / APC Infrastructure",
      contact_person: "Claire Fontaine",
      email: "orders@se.com",
      phone: "+1 (401) 555-0160",
      address: "132 Fairgrounds Rd, West Kingston, RI 02892",
      tax_number: "US-RI-662910",
      category: "Power Conversion & UPS",
      rating: 4.9,
      total_orders: 31,
      status: "Preferred Vendor"
    }
  ],

  sales_orders: [
    {
      id: "so-101",
      order_number: "SO-2026-0891",
      customer_id: "cust-4",
      customer_name: "Morgan & Sterling Capital",
      branch_id: "b-1",
      order_date: "2026-09-07",
      due_date: "2026-09-21",
      status: "Delivered",
      total_amount: 34250.00,
      tax_amount: 2911.25,
      discount_amount: 500.00,
      net_amount: 36661.25,
      payment_status: "Paid",
      payment_method: "Wire Transfer (ACH)",
      created_by: "Derrick Cole",
      items: [
        { product_id: "p-1", name: "HPE ProLiant DL380 Gen11 2U Server", sku: "HPE-DL380-G11", quantity: 5, unit_price: 5890.00, total: 29450.00 },
        { product_id: "p-2", name: "Cisco Catalyst 9300 48-Port PoE+ Switch", sku: "CSCO-CAT-9300", quantity: 1, unit_price: 4750.00, total: 4750.00 }
      ]
    },
    {
      id: "so-102",
      order_number: "SO-2026-0892",
      customer_id: "cust-1",
      customer_name: "Apex Logistics International",
      branch_id: "b-2",
      order_date: "2026-09-08",
      due_date: "2026-09-22",
      status: "Shipped",
      total_amount: 19800.00,
      tax_amount: 1683.00,
      discount_amount: 0.00,
      net_amount: 21483.00,
      payment_status: "Pending",
      payment_method: "Net-30 Invoice",
      created_by: "Derrick Cole",
      items: [
        { product_id: "p-2", name: "Cisco Catalyst 9300 48-Port PoE+ Switch", sku: "CSCO-CAT-9300", quantity: 3, unit_price: 4750.00, total: 14250.00 },
        { product_id: "p-3", name: "Dell PowerEdge R760 Dual-Xeon Server", sku: "DELL-PE-R760", quantity: 1, unit_price: 5400.00, total: 5400.00 }
      ]
    },
    {
      id: "so-103",
      order_number: "SO-2026-0893",
      customer_id: "cust-2",
      customer_name: "Vanguard Health Systems Inc.",
      branch_id: "b-1",
      order_date: "2026-09-09",
      due_date: "2026-09-23",
      status: "Confirmed",
      total_amount: 15400.00,
      tax_amount: 1309.00,
      discount_amount: 200.00,
      net_amount: 16509.00,
      payment_status: "Pending",
      payment_method: "Net-30 Invoice",
      created_by: "Derrick Cole",
      items: [
        { product_id: "p-5", name: "Eaton 9PX 10kVA Double-Conversion UPS", sku: "ETN-UPS-10K", quantity: 2, unit_price: 4800.00, total: 9600.00 },
        { product_id: "p-6", name: "Fortinet FortiGate 200F Enterprise Firewall", sku: "FTNT-FG-200F", quantity: 1, unit_price: 3200.00, total: 3200.00 },
        { product_id: "p-7", name: "Tripp Lite 42U Server Rack Enclosure Cabinet", sku: "TPL-SR-42U", quantity: 1, unit_price: 1350.00, total: 1350.00 }
      ]
    }
  ],

  purchase_orders: [
    {
      id: "po-201",
      order_number: "PO-2026-0410",
      supplier_id: "sup-2",
      supplier_name: "Dell Technologies Enterprise Channel",
      branch_id: "b-1",
      order_date: "2026-09-04",
      expected_delivery_date: "2026-09-14",
      status: "Received",
      total_amount: 31000.00,
      payment_status: "Paid",
      created_by: "Marcus Vance",
      items: [
        { product_id: "p-3", name: "Dell PowerEdge R760 Dual-Xeon Server", quantity: 10, unit_price: 3100.00, total: 31000.00 }
      ]
    },
    {
      id: "po-202",
      order_number: "PO-2026-0411",
      supplier_id: "sup-1",
      supplier_name: "Cisco Systems Commercial Channel",
      branch_id: "b-2",
      order_date: "2026-09-07",
      expected_delivery_date: "2026-09-18",
      status: "Ordered",
      total_amount: 28000.00,
      payment_status: "Partial",
      created_by: "Marcus Vance",
      items: [
        { product_id: "p-2", name: "Cisco Catalyst 9300 48-Port PoE+ Switch", quantity: 10, unit_price: 2800.00, total: 28000.00 }
      ]
    },
    {
      id: "po-203",
      order_number: "PO-2026-0412",
      supplier_id: "sup-5",
      supplier_name: "Schneider Electric / APC Infrastructure",
      branch_id: "b-1",
      order_date: "2026-09-09",
      expected_delivery_date: "2026-09-22",
      status: "Draft",
      total_amount: 7200.00,
      payment_status: "Unpaid",
      created_by: "Marcus Vance",
      items: [
        { product_id: "p-4", name: "APC NetShelter 30A Zero-U Metered PDU", quantity: 20, unit_price: 240.00, total: 4800.00 },
        { product_id: "p-9", name: "Belden Cat6A 1000ft Shielded Bulk Cable Spool", quantity: 10, unit_price: 180.00, total: 1800.00 }
      ]
    }
  ],

  // GAAP Compliant Standard Chart of Accounts
  accounts: [
    { id: "acc-1010", code: "1010", name: "Operating Checking Account (Chase)", type: "Asset", category: "Current Assets", balance: 412500.00, is_active: true },
    { id: "acc-1020", code: "1020", name: "Payroll Clearing Account", type: "Asset", category: "Current Assets", balance: 55000.00, is_active: true },
    { id: "acc-1100", code: "1100", name: "Accounts Receivable", type: "Asset", category: "Current Assets", balance: 98900.00, is_active: true },
    { id: "acc-1200", code: "1200", name: "Finished Goods Merchandise Inventory", type: "Asset", category: "Current Assets", balance: 278400.00, is_active: true },
    { id: "acc-1500", code: "1500", name: "Machinery, Test Equipment & Hardware", type: "Asset", category: "Fixed Assets", balance: 185000.00, is_active: true },
    { id: "acc-2010", code: "2010", name: "Accounts Payable", type: "Liability", category: "Current Liabilities", balance: 74600.00, is_active: true },
    { id: "acc-2100", code: "2100", name: "Accrued Payroll & Statutory Liabilities", type: "Liability", category: "Current Liabilities", balance: 31200.00, is_active: true },
    { id: "acc-2200", code: "2200", name: "Commercial Revolving Credit Facility", type: "Liability", category: "Long-term Liabilities", balance: 95000.00, is_active: true },
    { id: "acc-3010", code: "3010", name: "Common Stock & Paid-in Capital", type: "Equity", category: "Equity", balance: 250000.00, is_active: true },
    { id: "acc-3020", code: "3020", name: "Retained Earnings", type: "Equity", category: "Equity", balance: 579000.00, is_active: true },
    { id: "acc-4010", code: "4010", name: "Commercial Hardware Sales Revenue", type: "Revenue", category: "Operating Revenue", balance: 486200.00, is_active: true },
    { id: "acc-4020", code: "4020", name: "Enterprise Support & SLA Maintenance", type: "Revenue", category: "Operating Revenue", balance: 94800.00, is_active: true },
    { id: "acc-5010", code: "5010", name: "Cost of Goods Sold (COGS)", type: "Expense", category: "Direct Costs", balance: 298400.00, is_active: true },
    { id: "acc-6010", code: "6010", name: "Staff Salaries & Executive Compensation", type: "Expense", category: "Operating Expenses", balance: 135000.00, is_active: true },
    { id: "acc-6020", code: "6020", name: "Office Facilities, Rent & Utilities", type: "Expense", category: "Operating Expenses", balance: 28500.00, is_active: true },
    { id: "acc-6030", code: "6030", name: "Enterprise Cloud & Data Center Hosting", type: "Expense", category: "Operating Expenses", balance: 19400.00, is_active: true },
    { id: "acc-6040", code: "6040", name: "Professional Legal, Accounting & Auditing", type: "Expense", category: "Operating Expenses", balance: 14700.00, is_active: true }
  ],

  journal_entries: [
    {
      id: "je-01",
      entry_number: "JE-2026-0044",
      entry_date: "2026-09-07",
      reference_number: "REF-SO-891",
      description: "Recognize revenue & settlement for SO-2026-0891 (Morgan & Sterling)",
      total_amount: 36661.25,
      created_by: "Victoria Chen",
      lines: [
        { account_id: "acc-1010", account_name: "Operating Checking Account (Chase)", debit: 36661.25, credit: 0 },
        { account_id: "acc-4010", account_name: "Commercial Hardware Sales Revenue", debit: 0, credit: 36661.25 }
      ]
    },
    {
      id: "je-02",
      entry_number: "JE-2026-0045",
      entry_date: "2026-09-08",
      reference_number: "REF-PO-410",
      description: "Inventory capitalization for PO-2026-0410 from Dell Technologies",
      total_amount: 31000.00,
      created_by: "Victoria Chen",
      lines: [
        { account_id: "acc-1200", account_name: "Finished Goods Merchandise Inventory", debit: 31000.00, credit: 0 },
        { account_id: "acc-1010", account_name: "Operating Checking Account (Chase)", debit: 0, credit: 31000.00 }
      ]
    },
    {
      id: "je-03",
      entry_number: "JE-2026-0046",
      entry_date: "2026-09-09",
      reference_number: "REF-PAYROLL-08",
      description: "Disbursement of monthly executive & staff payroll",
      total_amount: 55000.00,
      created_by: "Victoria Chen",
      lines: [
        { account_id: "acc-6010", account_name: "Staff Salaries & Executive Compensation", debit: 55000.00, credit: 0 },
        { account_id: "acc-1020", account_name: "Payroll Clearing Account", debit: 0, credit: 55000.00 }
      ]
    }
  ],

  employees: [
    {
      id: "emp-101",
      employee_code: "GES-101",
      first_name: "Alexander",
      last_name: "Sterling",
      email: "admin@company.com",
      phone: "+1 (212) 555-0101",
      department: "Executive Leadership",
      designation: "Chief Executive Officer",
      join_date: "2021-04-01",
      basic_salary: 19500.00,
      status: "Active",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&auto=format&fit=crop&q=80"
    },
    {
      id: "emp-102",
      employee_code: "GES-102",
      first_name: "Victoria",
      last_name: "Chen",
      email: "accountant@company.com",
      phone: "+1 (212) 555-0102",
      department: "Finance & Accounting",
      designation: "Chief Financial Officer",
      join_date: "2021-06-15",
      basic_salary: 15200.00,
      status: "Active",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=96&auto=format&fit=crop&q=80"
    },
    {
      id: "emp-103",
      employee_code: "GES-103",
      first_name: "Marcus",
      last_name: "Vance",
      email: "inventory@company.com",
      phone: "+1 (212) 555-0103",
      department: "Supply Chain & Operations",
      designation: "Director of Logistics & Inventory",
      join_date: "2022-01-10",
      basic_salary: 12000.00,
      status: "Active",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&auto=format&fit=crop&q=80"
    },
    {
      id: "emp-104",
      employee_code: "GES-104",
      first_name: "Sophia",
      last_name: "Martinez",
      email: "hr@company.com",
      phone: "+1 (212) 555-0104",
      department: "Human Resources",
      designation: "Head of People & Operations",
      join_date: "2022-05-15",
      basic_salary: 10500.00,
      status: "Active",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=96&auto=format&fit=crop&q=80"
    },
    {
      id: "emp-105",
      employee_code: "GES-105",
      first_name: "Derrick",
      last_name: "Cole",
      email: "sales@company.com",
      phone: "+1 (212) 555-0105",
      department: "Enterprise Sales",
      designation: "VP of Enterprise Accounts",
      join_date: "2022-09-01",
      basic_salary: 11000.00,
      status: "Active",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&auto=format&fit=crop&q=80"
    },
    {
      id: "emp-106",
      employee_code: "GES-106",
      first_name: "David",
      last_name: "Vance",
      email: "dvance@company.com",
      phone: "+1 (212) 555-0106",
      department: "Operations",
      designation: "Principal Infrastructure Lead",
      join_date: "2023-03-12",
      basic_salary: 13500.00,
      status: "Active",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=96&auto=format&fit=crop&q=80"
    }
  ],

  attendance: [
    { id: "att-1", employee_id: "emp-101", employee_name: "Alexander Sterling", date: "2026-09-09", check_in: "08:30 AM", check_out: "--", status: "Present" },
    { id: "att-2", employee_id: "emp-102", employee_name: "Victoria Chen", date: "2026-09-09", check_in: "08:45 AM", check_out: "--", status: "Present" },
    { id: "att-3", employee_id: "emp-103", employee_name: "Marcus Vance", date: "2026-09-09", check_in: "07:50 AM", check_out: "--", status: "Present" },
    { id: "att-4", employee_id: "emp-104", employee_name: "Sophia Martinez", date: "2026-09-09", check_in: "09:00 AM", check_out: "--", status: "Present" },
    { id: "att-5", employee_id: "emp-105", employee_name: "Derrick Cole", date: "2026-09-09", check_in: "08:15 AM", check_out: "--", status: "Remote" },
    { id: "att-6", employee_id: "emp-106", employee_name: "David Vance", date: "2026-09-09", check_in: "09:10 AM", check_out: "--", status: "Present" }
  ],

  payroll: [
    {
      id: "pay-01",
      month: "August",
      year: 2026,
      total_gross: 81700.00,
      total_deductions: 12255.00,
      total_net: 69445.00,
      status: "Disbursed",
      payment_date: "2026-08-31",
      items: [
        { employee_id: "emp-101", employee_name: "Alexander Sterling", basic: 19500.00, allowance: 2000.00, deductions: 3225.00, net: 18275.00 },
        { employee_id: "emp-102", employee_name: "Victoria Chen", basic: 15200.00, allowance: 1500.00, deductions: 2505.00, net: 14195.00 },
        { employee_id: "emp-103", employee_name: "Marcus Vance", basic: 12000.00, allowance: 1000.00, deductions: 1950.00, net: 11050.00 },
        { employee_id: "emp-104", employee_name: "Sophia Martinez", basic: 10500.00, allowance: 800.00, deductions: 1695.00, net: 9605.00 },
        { employee_id: "emp-105", employee_name: "Derrick Cole", basic: 11000.00, allowance: 2500.00, deductions: 2025.00, net: 11475.00 },
        { employee_id: "emp-106", employee_name: "David Vance", basic: 13500.00, allowance: 1200.00, deductions: 2205.00, net: 12495.00 }
      ]
    }
  ],

  audit_logs: [
    { id: "log-1", timestamp: "2026-09-09T10:45:00Z", user: "Alexander Sterling", role: "Super Admin", action: "SYSTEM_INITIALIZATION", module: "Core", ip: "192.168.1.1", details: "Global Enterprise ERP initialized with standard GAAP ledger." },
    { id: "log-2", timestamp: "2026-09-09T09:30:12Z", user: "Victoria Chen", role: "Financial Controller", action: "JOURNAL_POSTING", module: "Accounting", ip: "192.168.1.14", details: "Posted journal voucher JE-2026-0044 balanced at $36,661.25." },
    { id: "log-3", timestamp: "2026-09-09T08:15:33Z", user: "Marcus Vance", role: "Inventory Specialist", action: "PURCHASE_ORDER_ISSUED", module: "Procurement", ip: "192.168.2.45", details: "Generated PO-2026-0412 for Schneider Electric & Fastenal supplies." },
    { id: "log-4", timestamp: "2026-09-08T16:20:00Z", user: "Derrick Cole", role: "Senior Sales Representative", action: "SALES_ORDER_CONFIRMED", module: "Sales", ip: "192.168.3.10", details: "Order SO-2026-0892 confirmed for Apex Logistics International." },
    { id: "log-5", timestamp: "2026-09-08T11:00:00Z", user: "Sophia Martinez", role: "HR Director", action: "ATTENDANCE_VERIFICATION", module: "HR", ip: "192.168.1.22", details: "Staff clock-in records synchronized across corporate facilities." }
  ],

  stock_movements: [
    {
      id: "mov-1",
      product_id: "p-3",
      sku: "DELL-PE-R760",
      product_name: "Dell PowerEdge R760 Dual-Xeon Server",
      movement_type: "PURCHASE_RECEIPT",
      quantity_change: 10,
      balance_before: 8,
      balance_after: 18,
      warehouse_id: "wh-1",
      warehouse_name: "HQ East Coast Staging Hub",
      reference_id: "PO-2026-0410",
      notes: "Goods received from Dell Technologies",
      performed_by: "Marcus Vance",
      timestamp: "2026-09-04T14:30:00Z"
    },
    {
      id: "mov-2",
      product_id: "p-1",
      sku: "HPE-DL380-G11",
      product_name: "HPE ProLiant DL380 Gen11 2U Server",
      movement_type: "SALES_DISPATCH",
      quantity_change: -5,
      balance_before: 40,
      balance_after: 35,
      warehouse_id: "wh-1",
      warehouse_name: "HQ East Coast Staging Hub",
      reference_id: "SO-2026-0891",
      notes: "Fulfilled for Morgan & Sterling Capital",
      performed_by: "Derrick Cole",
      timestamp: "2026-09-07T11:15:00Z"
    },
    {
      id: "mov-3",
      product_id: "p-2",
      sku: "CSCO-CAT-9300",
      product_name: "Cisco Catalyst 9300 48-Port PoE+ Switch",
      movement_type: "SALES_DISPATCH",
      quantity_change: -1,
      balance_before: 29,
      balance_after: 28,
      warehouse_id: "wh-2",
      warehouse_name: "Midwest Logistics Distribution Center",
      reference_id: "SO-2026-0891",
      notes: "Fulfilled for Morgan & Sterling Capital",
      performed_by: "Derrick Cole",
      timestamp: "2026-09-07T11:20:00Z"
    }
  ],

  quotations: [
    {
      id: "quote-301",
      quotation_number: "QT-2026-0155",
      customer_id: "cust-2",
      customer_name: "Vanguard Health Systems Inc.",
      created_by: "Derrick Cole",
      issue_date: "2026-09-08",
      expiry_date: "2026-09-22",
      status: "Draft",
      total_amount: 22800.00,
      tax_amount: 1938.00,
      discount_amount: 300.00,
      net_amount: 24438.00,
      payment_terms: "Net-30 Invoice",
      items: [
        { product_id: "p-1", name: "HPE ProLiant DL380 Gen11 2U Server", sku: "HPE-DL380-G11", quantity: 3, unit_price: 5890.00, total: 17670.00 },
        { product_id: "p-5", name: "Eaton 9PX 10kVA Double-Conversion UPS", sku: "ETN-UPS-10K", quantity: 1, unit_price: 4800.00, total: 4800.00 }
      ]
    }
  ],

  invoices: [
    {
      id: "inv-401",
      invoice_number: "INV-2026-0891",
      order_id: "so-101",
      order_number: "SO-2026-0891",
      customer_id: "cust-4",
      customer_name: "Morgan & Sterling Capital",
      invoice_date: "2026-09-07",
      due_date: "2026-09-21",
      total_amount: 34250.00,
      tax_amount: 2911.25,
      net_amount: 36661.25,
      paid_amount: 36661.25,
      balance_due: 0.00,
      status: "Paid",
      payment_method: "Wire Transfer (ACH)"
    },
    {
      id: "inv-402",
      invoice_number: "INV-2026-0892",
      order_id: "so-102",
      order_number: "SO-2026-0892",
      customer_id: "cust-1",
      customer_name: "Apex Logistics International",
      invoice_date: "2026-09-08",
      due_date: "2026-09-22",
      total_amount: 19800.00,
      tax_amount: 1683.00,
      net_amount: 21483.00,
      paid_amount: 0.00,
      balance_due: 21483.00,
      status: "Unpaid",
      payment_method: "Net-30 Invoice"
    }
  ],

  payments: [
    {
      id: "pay-501",
      payment_number: "RCPT-2026-0044",
      invoice_id: "inv-401",
      invoice_number: "INV-2026-0891",
      customer_id: "cust-4",
      customer_name: "Morgan & Sterling Capital",
      payment_date: "2026-09-07",
      amount: 36661.25,
      payment_method: "Wire Transfer (ACH)",
      transaction_reference: "ACH-WIRE-NY-8910",
      received_by: "Victoria Chen",
      notes: "Settled in full against Chase checking account"
    }
  ],

  approval_requests: [
    {
      id: "appr-01",
      module: "Procurement",
      entity_type: "PURCHASE_ORDER",
      entity_id: "po-202",
      entity_reference: "PO-2026-0411",
      requested_by: "Marcus Vance",
      amount: 28000.00,
      threshold_triggered: "PO value > $10,000",
      status: "Approved",
      reviewed_by: "Alexander Sterling",
      reviewed_at: "2026-09-07T12:00:00Z",
      comments: "Approved for Midwest logistics switch rollout."
    }
  ]
};
