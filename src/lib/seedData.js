// Standard Corporate Enterprise Seed Dataset for NEXIS ERP
// Denominated in PKR (Pakistani Rupee) - Realistic, interconnected GAAP compliant dataset

export const INITIAL_SEED_DATA = {
  settings: {
    company_name: "NEXIS Solutions Technologies",
    legal_name: "NEXIS Business Technologies & Systems Ltd.",
    tax_id: "PK-NTN-4029184-7",
    company_email: "corporate@nexis-erp.com",
    company_phone: "+92 (21) 3582-0190",
    address: "Executive Tower B, 14th Floor, Main Clifton Road, Karachi 75600",
    currency: "PKR",
    currency_symbol: "Rs. ",
    timezone: "Asia/Karachi",
    fiscal_year_start: "July",
    default_tax_rate: 8.5,
    logo_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=128&auto=format&fit=crop&q=80"
  },

  branches: [
    { id: "b-1", name: "HQ - Karachi Corporate Tower", code: "KHI-HQ", address: "Executive Tower B, Main Clifton Road, Karachi", is_main: true },
    { id: "b-2", name: "Lahore Regional Logistics Hub", code: "LHR-DIST", address: "Plot 42, Industrial Area, Kot Lakhpat, Lahore", is_main: false },
    { id: "b-3", name: "Islamabad Technical Operations", code: "ISB-OPS", address: "Evacuee Trust Complex, F-5/1, Islamabad", is_main: false }
  ],

  warehouses: [
    { id: "wh-1", name: "Central Distribution Hub (Karachi Port)", code: "WH-KHI-01", branch_id: "b-1", address: "Clifton Logistics Yard, Karachi", capacity_units: 50000, is_active: true },
    { id: "wh-2", name: "Punjab Regional Distribution Depot", code: "WH-LHR-01", branch_id: "b-2", address: "Kot Lakhpat Logistics Center, Lahore", capacity_units: 75000, is_active: true },
    { id: "wh-3", name: "Northern Micro-Fulfillment Staging", code: "WH-ISB-01", branch_id: "b-3", address: "Industrial Triangle, Islamabad", capacity_units: 35000, is_active: true }
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
      phone: "+92 (300) 829-0101",
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
      phone: "+92 (301) 829-0102",
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
      phone: "+92 (302) 829-0103",
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
      phone: "+92 (303) 829-0104",
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
      phone: "+92 (304) 829-0105",
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

  // Products: Exactly matches Inventory Cost = Rs. 32,818,000 and Retail = Rs. 56,855,000
  products: [
    {
      id: "p-1",
      name: "HPE ProLiant DL380 Gen11 2U Server",
      sku: "HPE-DL380-G11",
      barcode: "8901234567890",
      category_id: "cat-1",
      category_name: "Enterprise Rack Servers",
      unit: "Units",
      purchase_price: 345000,
      selling_price: 589000,
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
      purchase_price: 280000,
      selling_price: 475000,
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
      purchase_price: 310000,
      selling_price: 540000,
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
      purchase_price: 24000,
      selling_price: 48000,
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
      purchase_price: 260000,
      selling_price: 480000,
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
      purchase_price: 185000,
      selling_price: 320000,
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
      purchase_price: 75000,
      selling_price: 135000,
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
      purchase_price: 48000,
      selling_price: 89000,
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
      purchase_price: 18000,
      selling_price: 34000,
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
      name: "Habib Bank Limited (HBL)",
      company_name: "HBL Financial Technology Division",
      contact_person: "Tariq Mansoor",
      email: "tmansoor@hbl.com",
      phone: "+92 (21) 3241-8000",
      address: "HBL Tower, I.I. Chundrigar Road, Karachi",
      tax_number: "PK-NTN-110294-8",
      credit_limit: 15000000,
      total_spent: 18450000,
      current_balance: 2875250,
      status: "Active"
    },
    {
      id: "cust-2",
      name: "Shaukat Khanum Memorial Trust",
      company_name: "SKMT Regional Healthcare Network",
      contact_person: "Dr. Asim Farooq",
      email: "afarooq@skm.org.pk",
      phone: "+92 (42) 3590-5000",
      address: "7A Block R-3, Johar Town, Lahore",
      tax_number: "PK-NTN-220491-3",
      credit_limit: 10000000,
      total_spent: 12500000,
      current_balance: 1929130,
      status: "Active"
    },
    {
      id: "cust-3",
      name: "Engro Corporation Limited",
      company_name: "Engro Digital Infrastructure",
      contact_person: "Zainab Bokhari",
      email: "zbokhari@engro.com",
      phone: "+92 (21) 111-211-211",
      address: "Harbour Front Building, HC-3, Marine Drive, Clifton, Karachi",
      tax_number: "PK-NTN-330592-1",
      credit_limit: 25000000,
      total_spent: 34200000,
      current_balance: 0,
      status: "Active"
    },
    {
      id: "cust-4",
      name: "Lucky Core Industries (ICI)",
      company_name: "Lucky Core Chemicals & Tech",
      contact_person: "Khurram Qureshi",
      email: "kqureshi@luckycore.com",
      phone: "+92 (21) 3583-7490",
      address: "ICI House, 5 West Wharf, Karachi",
      tax_number: "PK-NTN-440693-5",
      credit_limit: 20000000,
      total_spent: 42800000,
      current_balance: 0,
      status: "Active"
    },
    {
      id: "cust-5",
      name: "Systems Limited (SysNet)",
      company_name: "Systems Limited Enterprise Services",
      contact_person: "Omer Saeed",
      email: "osaeed@systemsltd.com",
      phone: "+92 (42) 111-797-836",
      address: "E-1, Seepz Industrial Estate, Lahore",
      tax_number: "PK-NTN-550794-9",
      credit_limit: 12000000,
      total_spent: 16800000,
      current_balance: 0,
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

  // Sales Orders: Sum of order amounts = Rs. 11,278,000 (Exactly matches user example)
  sales_orders: [
    {
      id: "so-101",
      order_number: "SO-2026-0891",
      customer_id: "cust-4",
      customer_name: "Lucky Core Industries (ICI)",
      branch_id: "b-1",
      order_date: "2026-09-07",
      due_date: "2026-09-21",
      status: "Delivered",
      total_amount: 6850000,
      tax_amount: 582250,
      discount_amount: 34250,
      net_amount: 7398000,
      payment_status: "Paid",
      payment_method: "Corporate RTGS Settlement",
      created_by: "Derrick Cole",
      items: [
        { product_id: "p-1", name: "HPE ProLiant DL380 Gen11 2U Server", sku: "HPE-DL380-G11", quantity: 10, unit_price: 589000, purchase_cost: 345000, total: 5890000 },
        { product_id: "p-6", name: "Fortinet FortiGate 200F Enterprise Firewall", sku: "FTNT-FG-200F", quantity: 3, unit_price: 320000, purchase_cost: 185000, total: 960000 }
      ]
    },
    {
      id: "so-102",
      order_number: "SO-2026-0892",
      customer_id: "cust-1",
      customer_name: "Habib Bank Limited (HBL)",
      branch_id: "b-2",
      order_date: "2026-09-08",
      due_date: "2026-09-22",
      status: "Shipped",
      total_amount: 2650000,
      tax_amount: 225250,
      discount_amount: 0,
      net_amount: 2875250,
      payment_status: "Pending",
      payment_method: "Net-30 Invoice",
      created_by: "Derrick Cole",
      items: [
        { product_id: "p-2", name: "Cisco Catalyst 9300 48-Port PoE+ Switch", sku: "CSCO-CAT-9300", quantity: 4, unit_price: 475000, purchase_cost: 280000, total: 1900000 },
        { product_id: "p-7", name: "Tripp Lite 42U Server Rack Enclosure Cabinet", sku: "TPL-SR-42U", quantity: 5, unit_price: 135000, purchase_cost: 75000, total: 675000 },
        { product_id: "p-9", name: "Belden Cat6A 1000ft Shielded Bulk Cable Spool", sku: "BLD-CAT6A-1K", quantity: 2, unit_price: 34000, purchase_cost: 18000, total: 68000 }
      ]
    },
    {
      id: "so-103",
      order_number: "SO-2026-0893",
      customer_id: "cust-2",
      customer_name: "Shaukat Khanum Memorial Trust",
      branch_id: "b-1",
      order_date: "2026-09-09",
      due_date: "2026-09-23",
      status: "Confirmed",
      total_amount: 1778000,
      tax_amount: 151130,
      discount_amount: 0,
      net_amount: 1929130,
      payment_status: "Pending",
      payment_method: "Net-30 Invoice",
      created_by: "Derrick Cole",
      items: [
        { product_id: "p-3", name: "Dell PowerEdge R760 Dual-Xeon Server", sku: "DELL-PE-R760", quantity: 2, unit_price: 540000, purchase_cost: 310000, total: 1080000 },
        { product_id: "p-5", name: "Eaton 9PX 10kVA Double-Conversion UPS", sku: "ETN-UPS-10K", quantity: 1, unit_price: 480000, purchase_cost: 260000, total: 480000 },
        { product_id: "p-8", name: "Honeywell Pro-Watch IP Biometric Terminal", sku: "HON-BIO-900", quantity: 2, unit_price: 89000, purchase_cost: 48000, total: 178000 },
        { product_id: "p-4", name: "APC NetShelter 30A Zero-U Metered PDU", sku: "APC-PDU-30A", quantity: 1, unit_price: 48000, purchase_cost: 24000, total: 48000 }
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
      total_amount: 3100000,
      payment_status: "Paid",
      created_by: "Marcus Vance",
      items: [
        { product_id: "p-3", name: "Dell PowerEdge R760 Dual-Xeon Server", quantity: 10, unit_price: 310000, total: 3100000 }
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
      total_amount: 2800000,
      payment_status: "Partial",
      created_by: "Marcus Vance",
      items: [
        { product_id: "p-2", name: "Cisco Catalyst 9300 48-Port PoE+ Switch", quantity: 10, unit_price: 280000, total: 2800000 }
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
      total_amount: 720000,
      payment_status: "Unpaid",
      created_by: "Marcus Vance",
      items: [
        { product_id: "p-4", name: "APC NetShelter 30A Zero-U Metered PDU", quantity: 20, unit_price: 24000, total: 480000 },
        { product_id: "p-9", name: "Belden Cat6A 1000ft Shielded Bulk Cable Spool", quantity: 10, unit_price: 18000, total: 180000 }
      ]
    }
  ],

  // GAAP Compliant Standard Chart of Accounts (in PKR)
  // Operating Treasury (#1010 + #1020) = Rs. 38,450,000 (Exactly matches user example)
  accounts: [
    { id: "acc-1010", code: "1010", name: "Operating Checking Account (Habib Bank)", type: "Asset", category: "Current Assets", balance: 33650000, is_active: true },
    { id: "acc-1020", code: "1020", name: "Payroll Clearing Account (Meezan Bank)", type: "Asset", category: "Current Assets", balance: 4800000, is_active: true },
    { id: "acc-1100", code: "1100", name: "Accounts Receivable", type: "Asset", category: "Current Assets", balance: 4804380, is_active: true },
    { id: "acc-1200", code: "1200", name: "Finished Goods Merchandise Inventory", type: "Asset", category: "Current Assets", balance: 32818000, is_active: true },
    { id: "acc-1500", code: "1500", name: "Machinery, Data Center & Test Equipment", type: "Asset", category: "Fixed Assets", balance: 18500000, is_active: true },
    { id: "acc-2010", code: "2010", name: "Accounts Payable", type: "Liability", category: "Current Liabilities", balance: 3520000, is_active: true },
    { id: "acc-2100", code: "2100", name: "Accrued Statutory Tax & Payroll Liabilities", type: "Liability", category: "Current Liabilities", balance: 2150000, is_active: true },
    { id: "acc-2200", code: "2200", name: "Commercial Credit Facility (HBL Term Finance)", type: "Liability", category: "Long-term Liabilities", balance: 9500000, is_active: true },
    { id: "acc-3010", code: "3010", name: "Paid-in Share Capital", type: "Equity", category: "Equity", balance: 25000000, is_active: true },
    { id: "acc-3020", code: "3020", name: "Retained Corporate Reserves", type: "Equity", category: "Equity", balance: 54602380, is_active: true },
    { id: "acc-4010", code: "4010", name: "Commercial Hardware Sales Revenue", type: "Revenue", category: "Operating Revenue", balance: 11278000, is_active: true },
    { id: "acc-4020", code: "4020", name: "Enterprise Maintenance & Support Contracts", type: "Revenue", category: "Operating Revenue", balance: 2450000, is_active: true },
    { id: "acc-5010", code: "5010", name: "Cost of Goods Sold (COGS)", type: "Expense", category: "Direct Costs", balance: 6840000, is_active: true },
    { id: "acc-6010", code: "6010", name: "Staff Salaries & Executive Compensation", type: "Expense", category: "Operating Expenses", balance: 1500000, is_active: true },
    { id: "acc-6020", code: "6020", name: "Office Facilities, Rent & Utilities", type: "Expense", category: "Operating Expenses", balance: 450000, is_active: true },
    { id: "acc-6030", code: "6030", name: "Data Center Hosting & Network Bandwidth", type: "Expense", category: "Operating Expenses", balance: 320000, is_active: true },
    { id: "acc-6040", code: "6040", name: "Legal, Corporate Audit & Compliance Fees", type: "Expense", category: "Operating Expenses", balance: 180000, is_active: true }
  ],

  journal_entries: [
    {
      id: "je-01",
      entry_number: "JE-2026-0044",
      entry_date: "2026-09-07",
      reference_number: "REF-SO-891",
      description: "Recognize revenue & settlement for SO-2026-0891 (Lucky Core Industries)",
      total_amount: 7398000,
      created_by: "Victoria Chen",
      lines: [
        { account_id: "acc-1010", account_name: "Operating Checking Account (Habib Bank)", debit: 7398000, credit: 0 },
        { account_id: "acc-4010", account_name: "Commercial Hardware Sales Revenue", debit: 0, credit: 7398000 }
      ]
    },
    {
      id: "je-02",
      entry_number: "JE-2026-0045",
      entry_date: "2026-09-08",
      reference_number: "REF-PO-410",
      description: "Inventory capitalization for PO-2026-0410 from Dell Technologies",
      total_amount: 3100000,
      created_by: "Victoria Chen",
      lines: [
        { account_id: "acc-1200", account_name: "Finished Goods Merchandise Inventory", debit: 3100000, credit: 0 },
        { account_id: "acc-1010", account_name: "Operating Checking Account (Habib Bank)", debit: 0, credit: 3100000 }
      ]
    },
    {
      id: "je-03",
      entry_number: "JE-2026-0046",
      entry_date: "2026-09-09",
      reference_number: "REF-PAYROLL-08",
      description: "Disbursement of monthly executive & staff payroll",
      total_amount: 1500000,
      created_by: "Victoria Chen",
      lines: [
        { account_id: "acc-6010", account_name: "Staff Salaries & Executive Compensation", debit: 1500000, credit: 0 },
        { account_id: "acc-1020", account_name: "Payroll Clearing Account (Meezan Bank)", debit: 0, credit: 1500000 }
      ]
    }
  ],

  employees: [
    {
      id: "emp-101",
      employee_code: "NEX-101",
      first_name: "Alexander",
      last_name: "Sterling",
      email: "admin@company.com",
      phone: "+92 (300) 829-0101",
      department: "Executive Leadership",
      designation: "Chief Executive Officer",
      join_date: "2021-04-01",
      basic_salary: 350000,
      status: "Active",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&auto=format&fit=crop&q=80"
    },
    {
      id: "emp-102",
      employee_code: "NEX-102",
      first_name: "Victoria",
      last_name: "Chen",
      email: "accountant@company.com",
      phone: "+92 (301) 829-0102",
      department: "Finance & Accounting",
      designation: "Chief Financial Officer",
      join_date: "2021-06-15",
      basic_salary: 280000,
      status: "Active",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=96&auto=format&fit=crop&q=80"
    },
    {
      id: "emp-103",
      employee_code: "NEX-103",
      first_name: "Marcus",
      last_name: "Vance",
      email: "inventory@company.com",
      phone: "+92 (302) 829-0103",
      department: "Supply Chain & Operations",
      designation: "Director of Logistics & Inventory",
      join_date: "2022-01-10",
      basic_salary: 220000,
      status: "Active",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&auto=format&fit=crop&q=80"
    },
    {
      id: "emp-104",
      employee_code: "NEX-104",
      first_name: "Sophia",
      last_name: "Martinez",
      email: "hr@company.com",
      phone: "+92 (303) 829-0104",
      department: "Human Resources",
      designation: "Head of People & Operations",
      join_date: "2022-05-15",
      basic_salary: 195000,
      status: "Active",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=96&auto=format&fit=crop&q=80"
    },
    {
      id: "emp-105",
      employee_code: "NEX-105",
      first_name: "Derrick",
      last_name: "Cole",
      email: "sales@company.com",
      phone: "+92 (304) 829-0105",
      department: "Enterprise Sales",
      designation: "VP of Commercial Accounts",
      join_date: "2022-09-01",
      basic_salary: 210000,
      status: "Active",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&auto=format&fit=crop&q=80"
    },
    {
      id: "emp-106",
      employee_code: "NEX-106",
      first_name: "David",
      last_name: "Vance",
      email: "dvance@company.com",
      phone: "+92 (305) 829-0106",
      department: "Operations",
      designation: "Principal Infrastructure Lead",
      join_date: "2023-03-12",
      basic_salary: 245000,
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
      total_gross: 1500000,
      total_deductions: 185000,
      total_net: 1315000,
      status: "Disbursed",
      payment_date: "2026-08-31",
      items: [
        { employee_id: "emp-101", employee_name: "Alexander Sterling", basic: 350000, allowance: 30000, deductions: 45000, net: 335000 },
        { employee_id: "emp-102", employee_name: "Victoria Chen", basic: 280000, allowance: 25000, deductions: 36000, net: 269000 },
        { employee_id: "emp-103", employee_name: "Marcus Vance", basic: 220000, allowance: 20000, deductions: 28000, net: 212000 },
        { employee_id: "emp-104", employee_name: "Sophia Martinez", basic: 195000, allowance: 18000, deductions: 24000, net: 189000 },
        { employee_id: "emp-105", employee_name: "Derrick Cole", basic: 210000, allowance: 35000, deductions: 26000, net: 219000 },
        { employee_id: "emp-106", employee_name: "David Vance", basic: 245000, allowance: 22000, deductions: 26000, net: 241000 }
      ]
    }
  ],

  audit_logs: [
    { id: "log-1", timestamp: "2026-09-09T10:45:00Z", user: "Alexander Sterling", role: "Super Admin", action: "SYSTEM_INITIALIZATION", module: "Core", ip: "192.168.1.1", details: "NEXIS ERP enterprise initialized with PKR GAAP general ledger." },
    { id: "log-2", timestamp: "2026-09-09T09:30:12Z", user: "Victoria Chen", role: "Financial Controller", action: "JOURNAL_POSTING", module: "Accounting", ip: "192.168.1.14", details: "Posted journal voucher JE-2026-0044 balanced at Rs. 7,398,000." },
    { id: "log-3", timestamp: "2026-09-09T08:15:33Z", user: "Marcus Vance", role: "Inventory Specialist", action: "PURCHASE_ORDER_ISSUED", module: "Procurement", ip: "192.168.2.45", details: "Generated PO-2026-0412 for Schneider Electric infrastructure." },
    { id: "log-4", timestamp: "2026-09-08T16:20:00Z", user: "Derrick Cole", role: "Senior Sales Representative", action: "SALES_ORDER_CONFIRMED", module: "Sales", ip: "192.168.3.10", details: "Order SO-2026-0892 confirmed for Habib Bank Limited." },
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
      warehouse_name: "Central Distribution Hub (Karachi Port)",
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
      quantity_change: -10,
      balance_before: 45,
      balance_after: 35,
      warehouse_id: "wh-1",
      warehouse_name: "Central Distribution Hub (Karachi Port)",
      reference_id: "SO-2026-0891",
      notes: "Fulfilled for Lucky Core Industries",
      performed_by: "Derrick Cole",
      timestamp: "2026-09-07T11:15:00Z"
    },
    {
      id: "mov-3",
      product_id: "p-2",
      sku: "CSCO-CAT-9300",
      product_name: "Cisco Catalyst 9300 48-Port PoE+ Switch",
      movement_type: "SALES_DISPATCH",
      quantity_change: -4,
      balance_before: 32,
      balance_after: 28,
      warehouse_id: "wh-2",
      warehouse_name: "Punjab Regional Distribution Depot",
      reference_id: "SO-2026-0892",
      notes: "Fulfilled for Habib Bank Limited",
      performed_by: "Derrick Cole",
      timestamp: "2026-09-08T11:20:00Z"
    }
  ],

  quotations: [
    {
      id: "quote-301",
      quotation_number: "QT-2026-0155",
      customer_id: "cust-2",
      customer_name: "Shaukat Khanum Memorial Trust",
      created_by: "Derrick Cole",
      issue_date: "2026-09-08",
      expiry_date: "2026-09-22",
      status: "Draft",
      total_amount: 2280000,
      tax_amount: 193800,
      discount_amount: 30000,
      net_amount: 2443800,
      payment_terms: "Net-30 Invoice",
      items: [
        { product_id: "p-1", name: "HPE ProLiant DL380 Gen11 2U Server", sku: "HPE-DL380-G11", quantity: 3, unit_price: 589000, total: 1767000 },
        { product_id: "p-5", name: "Eaton 9PX 10kVA Double-Conversion UPS", sku: "ETN-UPS-10K", quantity: 1, unit_price: 480000, total: 480000 }
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
      customer_name: "Lucky Core Industries (ICI)",
      invoice_date: "2026-09-07",
      due_date: "2026-09-21",
      total_amount: 6850000,
      tax_amount: 582250,
      net_amount: 7398000,
      paid_amount: 7398000,
      balance_due: 0,
      status: "Paid",
      payment_method: "Corporate RTGS Settlement"
    },
    {
      id: "inv-402",
      invoice_number: "INV-2026-0892",
      order_id: "so-102",
      order_number: "SO-2026-0892",
      customer_id: "cust-1",
      customer_name: "Habib Bank Limited (HBL)",
      invoice_date: "2026-09-08",
      due_date: "2026-09-22",
      total_amount: 2650000,
      tax_amount: 225250,
      net_amount: 2875250,
      paid_amount: 0,
      balance_due: 2875250,
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
      customer_name: "Lucky Core Industries (ICI)",
      payment_date: "2026-09-07",
      amount: 7398000,
      payment_method: "Corporate RTGS Settlement",
      transaction_reference: "RTGS-PK-HBL-920194",
      received_by: "Victoria Chen",
      notes: "Settled in full against Habib Bank checking account"
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
      amount: 2800000,
      threshold_triggered: "PO value > Rs. 1,000,000",
      status: "Approved",
      reviewed_by: "Alexander Sterling",
      reviewed_at: "2026-09-07T12:00:00Z",
      comments: "Approved for Punjab logistics switch deployment."
    }
  ],

  settings: {
    company_name: "NEXIS Enterprise Technologies Ltd.",
    legal_name: "NEXIS Cloud Operating Systems Pvt. Ltd.",
    tax_id: "NTN-4892011-7",
    company_email: "finance@nexiserp.com",
    company_phone: "+92 (21) 3582-9100",
    address: "Level 14, Executive Tower, Clifton Block 4, Karachi, Pakistan",
    currency: "PKR",
    currency_symbol: "Rs. ",
    default_tax_rate: 18.0
  }
};
