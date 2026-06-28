export interface BillItem {
  localName: string;
  mappedName: string; // From mapping dictionary
  quantity: number;
  rate: number;
  taxableAmount: number;
  gstRate: number; // e.g. 5, 12, 18
  gstAmount: number;
  hsnCode: string;
  totalAmount: number;
  isConfidenceLow: boolean; // confidence score < 90%
}

export type BillStatus = "Draft" | "Approved";

export interface Bill {
  id: string;
  supplierName: string;
  supplierGSTIN: string;
  invoiceNo: string;
  date: string;
  items: BillItem[];
  taxableAmountTotal: number;
  gstAmountTotal: number;
  totalAmountTotal: number;
  status: BillStatus;
  confidenceScoreSupplier: number;
  confidenceScoreItems: number;
  isMathematicalError: boolean; // Total mismatch taxable + tax !== total
  createdAt: string;
  approvedBy?: string;
}

export interface MasterItem {
  id: string;
  itemName: string;
  printName: string;
  group: string;
  unit: string;
  gstRate: string; // e.g. "0%", "5%", "12%", "18%", "28%"
  hsn: string;
  clientName?: string; // Optional client mapping for optimized filtering
  mappingName?: string; // Regular/scanned item name mapping
  saleAccount?: string; // Sale account specification
  purchaseAccount?: string; // Purchase account specification
}

export interface ItemMapping {
  id: string;
  localName: string; // e.g. "A4 Copier", "A4 Copy Paper"
  masterName: string; // e.g. "A4 Copy Paper Bundle"
}

export interface ChatMessage {
  id: string;
  sender: "user" | "sakhi";
  text: string;
  timestamp: Date;
}

export interface SheetRow {
  sNo: number;
  vendorName: string;
  gstin: string;
  invoiceNo: string;
  date: string;
  itemSummary: string;
  hsnCodes: string;
  taxableAmount: number;
  gstRateSummary: string;
  gstAmount: number;
  totalAmount: number;
  syncStatus: "Success" | "Pending";
  approvedBy: string;
}

export interface UserSession {
  name: string;
  mobile: string;
  role: "Admin" | "Team";
}

export interface ClientMaster {
  id: string;
  name: string; // Business Name
  mobile: string; // Contact Number
  gstin: string; // GST
  address?: string; // Address
  type?: "Vendor" | "Buyer" | "Arhatiya" | "Other";
  businessCode?: string;
  contactPerson?: string;
  contactPersonDob?: string;
  pan?: string;
  tan?: string;
  vat?: string;
  aadhar?: string;
  dobFirm?: string;
  waGroupIcon?: string;
  employeeName?: string;
  employeeContact?: string;
  employeePassword?: string;
  assignedTo?: string;
  firmStatus?: string;
  loginPassword?: string;
  mailId?: string;
  driveFolderId?: string;
}

export interface TeamMaster {
  id: string;
  name: string;
  mobile: string;
  role: string; // e.g. "Accountant", "Manager", "Assistant", "HOD"
  status: "Active" | "Inactive";
  totpSecret?: string;
}

export interface LedgerMaster {
  id: string;
  accountName: string;
  accountType: "Bank Account" | "Supplier Account" | "Recipient Account";
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  gstin?: string;
  address?: string;
  mobile?: string;
  createdAt: string;
}

export interface BankFormatMapping {
  id: string;
  bankName: string; // e.g. "SBI CURRENT", "HDFC GENERAL" (universally applicable, no longer client-specific)
  dateColumn: string; // Column letter or Header like 'A' / 'DATE'
  particularsColumn: string;
  chqNoColumn: string;
  debitColumn: string;
  creditColumn: string;
  balanceColumn: string;
  clientId?: string;
  clientName?: string;
  columns?: any[];
  createdAt: string;
}

export interface SheetSchemaMapping {
  id: string;
  clientId: string; // references ClientMaster.id or 'all'
  clientName: string; // for display/rendering
  schemaName: string; // e.g. "Purchase Format", "Sales Format", "Expenses Format", "Journal Vouchers"
  columnsList: string; // CSV string or newline list of columns, e.g. "SERIES, DATE, VCH NO"
  columns?: Array<{ id: string; name: string; isHidden: boolean; isCustom?: boolean }>;
  description?: string;
  createdAt: string;
}


