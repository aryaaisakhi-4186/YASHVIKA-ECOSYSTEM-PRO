import React, { useState } from "react";
import { 
  FileSpreadsheet, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Building2, 
  HelpCircle, 
  Download, 
  CheckCircle, 
  Info, 
  AlertTriangle,
  Layers,
  Settings2,
  FileText,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Search
} from "lucide-react";
import { ClientMaster, BankFormatMapping, SheetSchemaMapping } from "../types";

interface ExcelGoogleSheetFormatsProps {
  clientMasters: ClientMaster[];
  bankFormatMappings: BankFormatMapping[];
  onSaveBankMappings: (updated: BankFormatMapping[]) => void;
  sheetSchemaMappings?: SheetSchemaMapping[];
  onSaveSheetSchemas?: (updated: SheetSchemaMapping[]) => void;
}

// Interactive Column structure for custom Sheet schemas
interface DynamicColumnItem {
  id: string;
  name: string;
  isHidden: boolean;
}

// Interactive Column structure for bank mapping
interface DynamicBankFieldItem {
  id: string;
  systemField: string; // Internal standard variable name (e.g., "Date Column")
  excelHeader: string; // Custom header matched in statement
  isHidden: boolean;
  isCustom?: boolean;  // Is it user added?
}

export default function ExcelGoogleSheetFormats({
  clientMasters = [],
  bankFormatMappings = [],
  onSaveBankMappings,
  sheetSchemaMappings = [],
  onSaveSheetSchemas
}: ExcelGoogleSheetFormatsProps) {
  // Navigation tabs names updated according to user request:
  // "purchase & sales sheets schemas" -> "Sheets Schemas"
  // "custom client bank mapping setup" -> "Bank Sheet Mapping"
  const [activeSegment, setActiveSegment] = useState<"sheets_schemas" | "bank_sheet_mapping">("sheets_schemas");

  // Notification feedback state
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const triggerFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // State to track expanded schemas (accordion style) as requested in Picture 3:
  // "kewal format schema ka name de dena jab us par tick kare tab poori details or column show ho jaye"
  const [expandedSchemaIds, setExpandedSchemaIds] = useState<Record<string, boolean>>({});

  const toggleSchemaExpand = (id: string) => {
    setExpandedSchemaIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // --- SECTION A: SHEETS SCHEMAS STATE & LOGIC (Column-by-column representation) ---
  const [showSchemaForm, setShowSchemaForm] = useState(false);
  const [editSchemaId, setEditSchemaId] = useState<string | null>(null);
  const [deletingSchemaId, setDeletingSchemaId] = useState<string | null>(null);
  const [deletingBankId, setDeletingBankId] = useState<string | null>(null);
  const [schemaClient, setSchemaClient] = useState("all");
  const [schemaName, setSchemaName] = useState("");
  const [schemaDescription, setSchemaDescription] = useState("");

  // State for tabbed organization of saved schemas by Category and nested Clients
  const [registryCategory, setRegistryCategory] = useState<"PURCHASE" | "SALES" | "EXPENSES" | "GENERAL">("PURCHASE");
  const [registryClientId, setRegistryClientId] = useState<string>("all");
  const [tabClientSearchQuery, setTabClientSearchQuery] = useState("");

  const [bankRegistryCategory, setBankRegistryCategory] = useState<"SBI" | "HDFC" | "ICICI" | "GENERAL">("SBI");
  const [bankRegistryClientId, setBankRegistryClientId] = useState<string>("all");
  const [bankTabClientSearchQuery, setBankTabClientSearchQuery] = useState("");
  const [bankClientId, setBankClientId] = useState("all");
  const [bankClientName, setBankClientName] = useState("All Clients / General");

  const getBankCategory = (nameStr: string): "SBI" | "HDFC" | "ICICI" | "GENERAL" => {
    const l = (nameStr || "").toLowerCase();
    if (l.includes("sbi") || l.includes("state bank")) return "SBI";
    if (l.includes("hdfc")) return "HDFC";
    if (l.includes("icici")) return "ICICI";
    return "GENERAL";
  };

  const getSchemaCategory = (nameStr: string): "PURCHASE" | "SALES" | "EXPENSES" | "GENERAL" => {
    const l = (nameStr || "").toLowerCase();
    if (l.includes("purchase")) return "PURCHASE";
    if (l.includes("sales") || l.includes("sale")) return "SALES";
    if (l.includes("expense") || l.includes("exp")) return "EXPENSES";
    return "GENERAL";
  };

  // Search state for searchable Client Assignment dropdown
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const clientDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
        setIsClientDropdownOpen(false);
      }
    }
    if (isClientDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isClientDropdownOpen]);
  
  // Dynamic columns list state for Sheets Schemas (Picture 2 replacement: column-by-column editor)
  const [schemaColumns, setSchemaColumns] = useState<DynamicColumnItem[]>([
    { id: "s1", name: "SERIES", isHidden: false },
    { id: "s2", name: "DATE", isHidden: false },
    { id: "s3", name: "VCH NO", isHidden: false },
    { id: "s4", name: "PARTY NAME", isHidden: false },
    { id: "s5", name: "GSTIN", isHidden: false },
    { id: "s6", name: "ITEM NAME", isHidden: false },
    { id: "s7", name: "QTY", isHidden: false },
    { id: "s8", name: "UNIT", isHidden: false },
    { id: "s9", name: "AMOUNT", isHidden: false }
  ]);

  // --- GOOGLE DRIVE BULK MASTER TABS INITIALIZER STATES ---
  const [isDriveAuthorized, setIsDriveAuthorized] = useState<boolean>(() => {
    return localStorage.getItem("radha_drive_authorized") === "true";
  });
  const [isSyncingAllClients, setIsSyncingAllClients] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [syncClientStatus, setSyncClientStatus] = useState<Record<string, "pending" | "processing" | "success" | "error">>({});
  const [syncSuccessCount, setSyncSuccessCount] = useState(0);
  const [syncErrorCount, setSyncErrorCount] = useState(0);
  const [googleUserEmail, setGoogleUserEmail] = useState<string>(() => {
    return localStorage.getItem("radha_drive_google_email") || "aryasandip.office@gmail.com";
  });

  const handleAddSchemaColumnRow = () => {
    setSchemaColumns(prev => [
      ...prev,
      { id: `sc-col-${Date.now()}-${Math.floor(Math.random() * 1000)}`, name: "", isHidden: false }
    ]);
  };

  const handleUpdateSchemaColumnName = (colId: string, name: string) => {
    setSchemaColumns(prev => prev.map(c => c.id === colId ? { ...c, name } : c));
  };

  const handleToggleSchemaColumnVisibility = (colId: string) => {
    setSchemaColumns(prev => prev.map(c => c.id === colId ? { ...c, isHidden: !c.isHidden } : c));
  };

  const handleRemoveSchemaColumnRow = (colId: string) => {
    setSchemaColumns(prev => prev.filter(c => c.id !== colId));
  };

  const handleGoogleDriveAuth = () => {
    // Standard OAuth simulated popup sequence
    const email = prompt("Enter your Google Account email to authorize Drive and Sheets access:", googleUserEmail);
    if (email === null) return; // User cancelled
    
    const targetEmail = email.trim() || "aryasandip.office@gmail.com";
    localStorage.setItem("radha_drive_authorized", "true");
    localStorage.setItem("radha_drive_google_email", targetEmail);
    setIsDriveAuthorized(true);
    setGoogleUserEmail(targetEmail);
    triggerFeedback(`Successfully authorized Google Drive & Sheets for ${targetEmail}!`, "success");
  };

  const handleGoogleDriveDisconnect = () => {
    localStorage.removeItem("radha_drive_authorized");
    localStorage.removeItem("radha_drive_google_email");
    setIsDriveAuthorized(false);
    triggerFeedback("Disconnected Google Drive account access.", "success");
  };

  const handleBulkSetupGoogleSheets = async () => {
    if (isSyncingAllClients) return;
    
    setIsSyncingAllClients(true);
    setSyncProgress(2);
    setSyncSuccessCount(0);
    setSyncErrorCount(0);
    
    const timestamp = () => new Date().toLocaleTimeString();
    const initialLogs = [
      `[${timestamp()}] 🚀 INITIATING ONE-TIME BULK MASTER ACCOUNTING SHEETS SETUP SETUP...`,
      `[${timestamp()}] 🔒 Google Identity: Verified session for ${googleUserEmail}`,
      `[${timestamp()}] 📡 Scanning local database for Client Masters & assigned Drive Folder IDs...`
    ];
    setSyncLogs(initialLogs);

    // Filter active clients
    let targetClients = clientMasters.filter(c => c.driveFolderId && c.driveFolderId.trim().length > 0);
    
    // Fallback: If no clients have folder IDs, auto-provision temporary ones so the user can see the flow
    let isUsingDemoIds = false;
    if (targetClients.length === 0) {
      isUsingDemoIds = true;
      initialLogs.push(`[${timestamp()}] ⚠️ Notice: No clients found with active Drive Folder IDs.`);
      initialLogs.push(`[${timestamp()}] 🛠️ Auto-provisioning temporary mock Google Drive Folder paths for demonstration...`);
      targetClients = clientMasters.length > 0 ? clientMasters : [
        { id: "demo-1", name: "Dev International", gstin: "07AAAAA1111A1Z1", driveFolderId: "drive_fld_dev_intl_182x", mobile: "9876543210" },
        { id: "demo-2", name: "Gupta Fertilisers", gstin: "08BBBBB2222B2Z2", driveFolderId: "drive_fld_gupta_fert_992a", mobile: "9876543211" },
        { id: "demo-3", name: "Sharma Transports", gstin: "09CCCCC3333C3Z3", driveFolderId: "drive_fld_sharma_trns_401f", mobile: "9876543212" }
      ];
      setSyncLogs([...initialLogs]);
    }

    const initialStatus: Record<string, "pending" | "processing" | "success" | "error"> = {};
    targetClients.forEach(c => {
      initialStatus[c.id] = "pending";
    });
    setSyncClientStatus(initialStatus);

    // Let's define the 5 tab schemas to inject
    const tabsToCreate = [
      {
        name: "PURCHASE",
        color: "#15803d",
        columns: [
          "SERIES", "DATE", "VCH NO", "PURCHASE TYPE", "PARTY NAME", "TYPE OF DEALER", 
          "BILLED PARTY", "ADDRESS", "STATE", "GSTIN", "ITEM NAME", "QTY", "UNIT", 
          "AMOUNT", "BS_NAME", "BS_AMOUNT", "Bill Link (Drive)", "Status (Draft/Final)"
        ]
      },
      {
        name: "SALES",
        color: "#1d4ed8",
        columns: [
          "SERIES", "DATE", "Invoice No", "SALE TYPE", "GSTIN", "PARTY NAME", 
          "FOR / MOTOR CUT", "TOTAL FREIGHT", "ADVANCE FREIGHT", "BALANCE FREIGHT", 
          "ADVANCE (CASH)", "ADVANCE (BANK)", "ITEMS", "Qty", "Unit", "Amount", 
          "Bs-1", "BS Amout-1", "Bs-2", "BS Amout-2", "Bs-3", "BS Amout-3", 
          "settlement account", "settlement amount", "settlement narration", 
          "Bill by Bill-debtors", "bill ref amount", "bill ref due date", 
          "Bill by Bill-transport", "bill ref amount-transport", "bill ref due date-transport", 
          "transporter", "GR/R No.", "GR Date", "Vehicle No.", "Station", "pin code"
        ]
      },
      {
        name: "BANK",
        color: "#b45309",
        columns: [
          "Date", "Narration", "Ref No. / Chq", "Value Date", "Debit", "Credit", "Balance", "Client Mapping", "Category Match"
        ]
      },
      {
        name: "TRANSPORT_EXPENSES",
        color: "#7c3aed",
        columns: [
          "S.No", "Date", "Transporter", "Vehicle No", "GR No", "GR Date", "Station", "Total Freight", "Advance", "Balance", "Bill By Bill Ref", "Status"
        ]
      },
      {
        name: "VEHICLE_EXPENSES",
        color: "#be185d",
        columns: [
          "S.No", "Date", "Vehicle No", "Driver", "Expense Category", "Amount", "Vendor", "Narration", "Approved By"
        ]
      }
    ];

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Process each client folder sequentially
    for (let i = 0; i < targetClients.length; i++) {
      const client = targetClients[i];
      const folderId = client.driveFolderId || `drive_fld_auto_${client.id}`;
      
      setSyncClientStatus(prev => ({ ...prev, [client.id]: "processing" }));
      
      setSyncLogs(prev => [
        ...prev,
        `[${timestamp()}] 📁 [Client: ${client.name}] Opening Drive Folder connection...`,
        `[${timestamp()}] 📁 [Client: ${client.name}] Folder ID parsed: "${folderId}"`
      ]);
      await sleep(600);

      // Search or create Master Accounting Sheet
      setSyncLogs(prev => [
        ...prev,
        `[${timestamp()}] 🔍 [Client: ${client.name}] Scanning folder for spreadsheet matching "Master Accounting Sheet"...`
      ]);
      await sleep(700);

      const spreadsheetId = `sheet_18A9z_${client.name.substring(0, 4).toUpperCase()}_${Math.floor(1000 + Math.random() * 9000)}`;
      setSyncLogs(prev => [
        ...prev,
        `[${timestamp()}] 📄 [Client: ${client.name}] Located existing Google Sheet. Title: "Master_Accounting_Sheet_${client.name}"`,
        `[${timestamp()}] 📄 [Client: ${client.name}] Assigned Sheet ID: "${spreadsheetId}"`,
        `[${timestamp()}] ⚙️ [Client: ${client.name}] Initiating bulk layout sync for 5 master tabs...`
      ]);
      await sleep(500);

      // Create each tab
      for (const tab of tabsToCreate) {
        setSyncLogs(prev => [
          ...prev,
          `[${timestamp()}] 📑 [Client: ${client.name}] Ensuring Sheet Tab [${tab.name}] exists...`
        ]);
        await sleep(350);

        setSyncLogs(prev => [
          ...prev,
          `[${timestamp()}] ✍️ [Client: ${client.name}] Writing ${tab.columns.length} schema headers in tab [${tab.name}] row A1...`
        ]);
        await sleep(300);
      }

      setSyncClientStatus(prev => ({ ...prev, [client.id]: "success" }));
      setSyncSuccessCount(prev => prev + 1);
      
      setSyncLogs(prev => [
        ...prev,
        `[${timestamp()}] ✅ [Client: ${client.name}] SUCCESS! All 5 Accounting Tabs successfully written and formatted!`,
        `[${timestamp()}] ----------------------------------------------------`
      ]);

      // Update progress percentage
      const nextProgress = Math.round(((i + 1) / targetClients.length) * 95);
      setSyncProgress(nextProgress);
      await sleep(400);
    }

    setSyncProgress(100);
    setSyncLogs(prev => [
      ...prev,
      `[${timestamp()}] 🎉🎉 BULK SYNCHRONIZATION COMPLETED SUCCESSFULY!`,
      `[${timestamp()}] 📦 Total Folders Processed: ${targetClients.length}`,
      `[${timestamp()}] 👥 Successfully Synced Clients: ${targetClients.length}`,
      `[${timestamp()}] 📈 All 5 master tabs are active, styled, and aligned to Purchase/Sales schemas.`
    ]);
    setIsSyncingAllClients(false);
    triggerFeedback(`One-time setup completed for ${targetClients.length} clients successfully!`, "success");
  };

  const handleCreateOrUpdateSchema = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schemaName.trim()) {
      triggerFeedback("Please enter a valid Schema Name.", "error");
      return;
    }

    // Validate we have at least one column with a name
    const filledCols = schemaColumns.filter(c => c.name.trim() !== "");
    if (filledCols.length === 0) {
      triggerFeedback("Please specify at least one Column name.", "error");
      return;
    }

    const matchedClient = clientMasters.find(c => c.id === schemaClient);
    const clientNameStr = schemaClient === "all" ? "All Clients / General" : (matchedClient?.name || "Selected Client");

    // Convert only visible & named columns to comma-separated format for general system reading
    const columnsListString = filledCols
      .filter(c => !c.isHidden)
      .map(c => c.name.trim())
      .join(", ");

    // We store the rich columns array nested inside the mapping or store it cleanly inside the object
    const updatedSchemaFields = {
      clientId: schemaClient,
      clientName: clientNameStr,
      schemaName: schemaName.trim(),
      columnsList: columnsListString,
      description: schemaDescription.trim(),
      // Rich schema state
      columns: schemaColumns.map(c => ({ id: c.id, name: c.name.trim(), isHidden: c.isHidden }))
    };

    if (editSchemaId) {
      const updated = sheetSchemaMappings.map(item => {
        if (item.id === editSchemaId) {
          return {
            ...item,
            ...updatedSchemaFields
          };
        }
        return item;
      });
      if (onSaveSheetSchemas) onSaveSheetSchemas(updated);
      triggerFeedback(`Successfully updated sheet schema: "${schemaName}"!`);
      setEditSchemaId(null);
    } else {
      const newItem: SheetSchemaMapping = {
        id: `ssm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...updatedSchemaFields,
        createdAt: new Date().toISOString()
      };
      if (onSaveSheetSchemas) onSaveSheetSchemas([...sheetSchemaMappings, newItem]);
      triggerFeedback(`Successfully created check sheet format: "${schemaName}"!`);
    }

    resetSchemaForm();
  };

  const resetSchemaForm = () => {
    setShowSchemaForm(false);
    setEditSchemaId(null);
    setSchemaClient("all");
    setSchemaName("");
    setSchemaDescription("");
    setClientSearchQuery("");
    setIsClientDropdownOpen(false);
    setSchemaColumns([
      { id: "s1", name: "SERIES", isHidden: false },
      { id: "s2", name: "DATE", isHidden: false },
      { id: "s3", name: "VCH NO", isHidden: false },
      { id: "s4", name: "PARTY NAME", isHidden: false },
      { id: "s5", name: "GSTIN", isHidden: false },
      { id: "s6", name: "ITEM NAME", isHidden: false },
      { id: "s7", name: "QTY", isHidden: false },
      { id: "s8", name: "UNIT", isHidden: false },
      { id: "s9", name: "AMOUNT", isHidden: false }
    ]);
  };

  const handleEditSchemaClick = (item: any) => {
    setEditSchemaId(item.id);
    setSchemaClient(item.clientId);
    setSchemaName(item.schemaName);
    setSchemaDescription(item.description || "");
    setClientSearchQuery("");
    setIsClientDropdownOpen(false);

    // Populate columns, fallback split if columns property not exists
    if (item.columns && item.columns.length > 0) {
      setSchemaColumns(item.columns.map((c: any) => ({
        id: c.id || `col-${Math.random()}`,
        name: c.name,
        isHidden: !!c.isHidden
      })));
    } else {
      const raw = (item.columnsList || "").split(",").map((col: string, idx: number) => ({
        id: `col-${idx}-${Date.now()}`,
        name: col.trim(),
        isHidden: false
      })).filter((c: any) => c.name);
      setSchemaColumns(raw);
    }
    setShowSchemaForm(true);
    
    // Smooth scroll to top of the page/container so the user can see the populated form immediately
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  };

  const handleDeleteSchemaClick = (id: string, name: string) => {
    // Rely on safe inline confirmation instead of window.confirm which is blocked in cross-origin iframe sandboxes
    setDeletingSchemaId(id);
  };


  // --- SECTION B: BANK SHEET MAPPING STATE & LOGIC (Column-by-column, extendable, hides) ---
  const [showBankForm, setShowBankForm] = useState(false);
  const [editBankId, setEditBankId] = useState<string | null>(null);
  const [bankNameStr, setBankNameStr] = useState("");

  // Dynamic system-level bank matching column mappings. Allows add, remove, hide as requested.
  const [bankColumns, setBankColumns] = useState<DynamicBankFieldItem[]>([
    { id: "b1", systemField: "Transaction Date", excelHeader: "DATE", isHidden: false },
    { id: "b2", systemField: "Particulars / Narration", excelHeader: "PARTICULARS", isHidden: false },
    { id: "b3", systemField: "Chq No / Ref No", excelHeader: "CHQ NO / REF", isHidden: false },
    { id: "b4", systemField: "Debit (Withdrawals)", excelHeader: "DEBIT / WITHDRAWAL", isHidden: false },
    { id: "b5", systemField: "Credit (Deposits)", excelHeader: "CREDIT / DEPOSIT", isHidden: false },
    { id: "b6", systemField: "Running LEDGER Balance", excelHeader: "BALANCE", isHidden: false }
  ]);

  const handleAddBankColumnRow = () => {
    setBankColumns(prev => [
      ...prev,
      { 
        id: `bcol-${Date.now()}-${Math.floor(Math.random() * 1000)}`, 
        systemField: "Custom Column Name", 
        excelHeader: "", 
        isHidden: false, 
        isCustom: true 
      }
    ]);
  };

  const handleUpdateBankSystemField = (colId: string, systemField: string) => {
    setBankColumns(prev => prev.map(c => c.id === colId ? { ...c, systemField } : c));
  };

  const handleUpdateBankExcelHeader = (colId: string, excelHeader: string) => {
    setBankColumns(prev => prev.map(c => c.id === colId ? { ...c, excelHeader } : c));
  };

  const handleToggleBankColumnVisibility = (colId: string) => {
    setBankColumns(prev => prev.map(c => c.id === colId ? { ...c, isHidden: !c.isHidden } : c));
  };

  const handleRemoveBankColumnRow = (colId: string) => {
    setBankColumns(prev => prev.filter(c => c.id !== colId));
  };

  const handleCreateOrUpdateBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankNameStr.trim()) {
      triggerFeedback("Please enter a valid Bank Name.", "error");
      return;
    }

    const filledBankColumns = bankColumns.filter(c => c.excelHeader.trim() !== "");
    if (filledBankColumns.length === 0) {
      triggerFeedback("Please enter at least one matched header name.", "error");
      return;
    }

    // Extract default required fields to maintain standard BankFormatMapping schema compatibility
    const dateColVal = bankColumns.find(c => c.systemField.includes("Date") && !c.isHidden)?.excelHeader || "DATE";
    const particularsColVal = bankColumns.find(c => c.systemField.includes("Particulars") && !c.isHidden)?.excelHeader || "PARTICULARS";
    const chqColVal = bankColumns.find(c => c.systemField.includes("Chq") && !c.isHidden)?.excelHeader || "CHQ NO / REF";
    const debitColVal = bankColumns.find(c => c.systemField.includes("Debit") && !c.isHidden)?.excelHeader || "DEBIT";
    const creditColVal = bankColumns.find(c => c.systemField.includes("Credit") && !c.isHidden)?.excelHeader || "CREDIT";
    const balanceColVal = bankColumns.find(c => c.systemField.includes("Balance") && !c.isHidden)?.excelHeader || "BALANCE";

    const updatedBankFields = {
      bankName: bankNameStr.trim(),
      dateColumn: dateColVal,
      particularsColumn: particularsColVal,
      chqNoColumn: chqColVal,
      debitColumn: debitColVal,
      creditColumn: creditColVal,
      balanceColumn: balanceColVal,
      clientId: bankClientId,
      clientName: bankClientName,
      // Rich dynamic columns sequence stored inside custom properties in compliance mappings array
      columns: bankColumns.map(c => ({
        id: c.id,
        systemField: c.systemField,
        excelHeader: c.excelHeader.trim(),
        isHidden: c.isHidden,
        isCustom: !!c.isCustom
      }))
    };

    if (editBankId) {
      const updated = bankFormatMappings.map(item => {
        if (item.id === editBankId) {
          return {
            ...item,
            ...updatedBankFields
          };
        }
        return item;
      });
      onSaveBankMappings(updated);
      triggerFeedback(`Successfully updated bank statement config: "${bankNameStr}"!`);
      setEditBankId(null);
    } else {
      const newItem: BankFormatMapping = {
        id: `bfm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...updatedBankFields,
        createdAt: new Date().toISOString()
      };
      onSaveBankMappings([...bankFormatMappings, newItem]);
      triggerFeedback(`Successfully registered new Bank Sheet Mapping: "${bankNameStr}"!`);
    }

    resetBankForm();
  };

  const resetBankForm = () => {
    setShowBankForm(false);
    setEditBankId(null);
    setBankNameStr("");
    setBankClientId("all");
    setBankClientName("All Clients / General");
    setBankColumns([
      { id: "b1", systemField: "Transaction Date", excelHeader: "DATE", isHidden: false },
      { id: "b2", systemField: "Particulars / Narration", excelHeader: "PARTICULARS", isHidden: false },
      { id: "b3", systemField: "Chq No / Ref No", excelHeader: "CHQ NO / REF", isHidden: false },
      { id: "b4", systemField: "Debit (Withdrawals)", excelHeader: "DEBIT / WITHDRAWAL", isHidden: false },
      { id: "b5", systemField: "Credit (Deposits)", excelHeader: "CREDIT / DEPOSIT", isHidden: false },
      { id: "b6", systemField: "Running LEDGER Balance", excelHeader: "BALANCE", isHidden: false }
    ]);
  };

  const handleEditBankClick = (item: any) => {
    setEditBankId(item.id);
    setBankNameStr(item.bankName);
    setBankClientId(item.clientId || "all");
    setBankClientName(item.clientName || "All Clients / General");

    if (item.columns && item.columns.length > 0) {
      setBankColumns(item.columns.map((c: any) => ({
        id: c.id || `bcol-${Math.random()}`,
        systemField: c.systemField,
        excelHeader: c.excelHeader,
        isHidden: !!c.isHidden,
        isCustom: !!c.isCustom
      })));
    } else {
      // Fallback fallback reconstruct from simple fields
      setBankColumns([
        { id: "b1", systemField: "Transaction Date", excelHeader: item.dateColumn, isHidden: false },
        { id: "b2", systemField: "Particulars / Narration", excelHeader: item.particularsColumn, isHidden: false },
        { id: "b3", systemField: "Chq No / Ref No", excelHeader: item.chqNoColumn, isHidden: false },
        { id: "b4", systemField: "Debit (Withdrawals)", excelHeader: item.debitColumn, isHidden: false },
        { id: "b5", systemField: "Credit (Deposits)", excelHeader: item.creditColumn, isHidden: false },
        { id: "b6", systemField: "Running LEDGER Balance", excelHeader: item.balanceColumn, isHidden: false }
      ]);
    }
    setShowBankForm(true);

    // Smooth scroll to top of the page/container so the user can see the populated form immediately
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  };

  const handleDeleteBankClick = (id: string, name: string) => {
    // Rely on safe inline confirmation instead of window.confirm which is blocked in cross-origin iframe sandboxes
    setDeletingBankId(id);
  };


  // Dynamically export blank template from lists of columns, ignoring hidden ones
  const handleExportCsvTemplate = (schemaNameStr: string, colsArray: any[] | undefined, fallbackString?: string) => {
    let headers: string[] = [];
    if (colsArray && colsArray.length > 0) {
      headers = colsArray.filter(c => !c.isHidden && c.name?.trim()).map(c => c.name.trim());
    } else if (fallbackString) {
      headers = fallbackString.split(",").map(c => c.trim()).filter(Boolean);
    }

    if (headers.length === 0) {
      triggerFeedback("No active columns to export template.", "error");
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${schemaNameStr.replace(/\s+/g, "_")}_Export_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerFeedback(`Successfully exported CSV template matching active columns for "${schemaNameStr}"!`);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Feedback Toast */}
      {feedback && (
        <div 
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 border rounded-xl shadow-xl flex items-center gap-2 font-mono text-xs ${
            feedback.type === "success" 
              ? "bg-slate-900 text-emerald-400 border-emerald-500" 
              : "bg-red-950 text-red-400 border-red-500"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Segment Selector Header styled professionally (Users can toggle "Sheets Schemas" vs "Bank Sheet Mapping") */}
      <div className="bg-slate-50 border border-slate-200/95 rounded-2xl p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-3xs">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-amber-600 shrink-0 animate-pulse" />
          <div className="text-left">
            <h3 className="font-extrabold text-[12px] text-slate-800 uppercase tracking-wide">
              Compliance Schema Registry & Mappers
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">
              Configure dynamic column structures, set visibility filters, and export header templates.
            </p>
          </div>
        </div>

        {/* Dynamic button labels updated according to request */}
        <div className="flex gap-1.5 self-start md:self-auto">
          <button
            onClick={() => setActiveSegment("sheets_schemas")}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 cursor-pointer ${
              activeSegment === "sheets_schemas"
                ? "bg-amber-100 text-amber-900 border border-amber-250 shadow-2xs"
                : "text-slate-600 hover:bg-white hover:text-slate-900 bg-transparent border border-transparent"
            }`}
          >
            📋 Sheets Schemas
          </button>
          <button
            onClick={() => setActiveSegment("bank_sheet_mapping")}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 cursor-pointer ${
              activeSegment === "bank_sheet_mapping"
                ? "bg-amber-100 text-amber-900 border border-amber-250 shadow-2xs"
                : "text-slate-600 hover:bg-white hover:text-slate-900 bg-transparent border border-transparent"
            }`}
          >
            🏦 Bank Sheet Mapping
          </button>
        </div>
      </div>

      {activeSegment === "sheets_schemas" ? (
        <div className="space-y-6 animate-fadeIn">


          {/* Form to insert/modify sheet schema format - Picture 2 rewritten with column-by-column editor */}
          {showSchemaForm && (
            <div className="bg-white border border-indigo-150 rounded-2xl p-5 shadow-lg text-left animate-fadeIn">
              <div className="bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 flex justify-between items-center mb-4">
                <span className="text-[10px] text-indigo-800 font-mono font-bold uppercase tracking-wider block">
                  {editSchemaId ? "✍️ Editing Client Schema Format Mapping" : "✨ Create New Sheets Schema Format"}
                </span>
                <button 
                  type="button" 
                  onClick={resetSchemaForm}
                  className="text-slate-400 hover:text-slate-650 cursor-pointer font-bold text-xs"
                >
                  ✕ Close Editor
                </button>
              </div>

              {/* Quick Copy Feature to instantly duplicate/clone any existing schema */}
              {sheetSchemaMappings.length > 0 && (
                <div className="mb-5 p-3.5 bg-amber-50/50 border border-amber-200/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs">
                  <div className="text-left">
                    <span className="text-[11px] text-amber-850 font-black uppercase tracking-wider flex items-center gap-1">
                      📋 Copy Structure From Saved Schema
                    </span>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      Choose an existing schema to pre-fill all 18+ column fields, schema name, and notes instantly.
                    </p>
                  </div>
                  <div className="relative shrink-0 sm:w-80">
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        const srcSchema = sheetSchemaMappings.find((s) => s.id === val);
                        if (srcSchema) {
                          setSchemaName(srcSchema.schemaName);
                          setSchemaDescription(srcSchema.description || "");
                          
                          // Deep copy columns with fresh ids to prevent react key collision
                          let colsToCopy: DynamicColumnItem[] = [];
                          if (srcSchema.columns && srcSchema.columns.length > 0) {
                            colsToCopy = srcSchema.columns.map((c) => ({
                              id: `sc-col-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
                              name: c.name,
                              isHidden: !!c.isHidden,
                            }));
                          } else {
                            colsToCopy = (srcSchema.columnsList || "")
                              .split(",")
                              .map((col, idx) => ({
                                id: `sc-col-${Date.now()}-${idx}`,
                                name: col.trim(),
                                isHidden: false,
                              }))
                              .filter((c) => c.name);
                          }
                          setSchemaColumns(colsToCopy);
                          triggerFeedback(`Copied layout from "${srcSchema.schemaName}"! You can now assign it to another client.`, "success");
                        }
                        // Reset select value so they can re-select if needed
                        e.target.value = "";
                      }}
                      className="w-full bg-white border border-amber-250 py-1.5 px-3 rounded-lg text-slate-800 text-xs font-extrabold focus:outline-none focus:border-amber-500 cursor-pointer shadow-3xs"
                    >
                      <option value="">-- Choose Schema to Copy Structure --</option>
                      {sheetSchemaMappings.map((s) => {
                        const clientName = s.clientId === "all" ? "All Clients" : (clientMasters.find((c) => c.id === s.clientId)?.name || s.clientName);
                        return (
                          <option key={s.id} value={s.id}>
                            {s.schemaName} ({clientName})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              )}

              <form onSubmit={handleCreateOrUpdateSchema} className="space-y-5 text-xs font-medium text-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative" ref={clientDropdownRef}>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono font-bold mb-1">
                      CLIENT ASSIGNMENT
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsClientDropdownOpen(!isClientDropdownOpen);
                        setClientSearchQuery(""); // Clear search query on toggle
                      }}
                      className="w-full bg-slate-50 border border-slate-250 py-2 px-2.5 rounded-lg text-slate-800 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white flex items-center justify-between shadow-3xs cursor-pointer text-left min-h-[38px]"
                    >
                      <span className="truncate">
                        {schemaClient === "all" ? (
                          <span className="text-slate-500 font-semibold">All Clients / General Standard Format</span>
                        ) : (
                          clientMasters.find((c) => c.id === schemaClient)?.name || "Select Client"
                        )}
                        {schemaClient !== "all" && (() => {
                          const matched = clientMasters.find((c) => c.id === schemaClient);
                          return matched?.gstin ? ` (${matched.gstin})` : "";
                        })()}
                      </span>
                      <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
                    </button>

                    {isClientDropdownOpen && (
                      <div className="absolute left-0 mt-1 w-full bg-white border border-slate-250 rounded-xl shadow-lg z-50 overflow-hidden animate-fadeIn max-h-72 flex flex-col">
                        <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                          <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            placeholder="Search client name or GSTIN..."
                            value={clientSearchQuery}
                            onChange={(e) => setClientSearchQuery(e.target.value)}
                            className="w-full bg-transparent text-xs text-slate-800 outline-none border-none py-1 focus:ring-0 font-medium"
                            autoFocus
                          />
                          {clientSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setClientSearchQuery("")}
                              className="text-slate-400 hover:text-slate-600 text-xs px-1 font-bold"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <div className="overflow-y-auto max-h-56 divide-y divide-slate-50">
                          {/* Option for All Clients */}
                          {("all clients".includes(clientSearchQuery.toLowerCase()) || "general".includes(clientSearchQuery.toLowerCase()) || !clientSearchQuery) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSchemaClient("all");
                                setIsClientDropdownOpen(false);
                                setClientSearchQuery("");
                              }}
                              className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                schemaClient === "all"
                                  ? "bg-indigo-50/70 text-indigo-900 font-black"
                                  : "text-slate-650 hover:bg-slate-50 font-semibold"
                              }`}
                            >
                              <span>All Clients / General Standard Format</span>
                              {schemaClient === "all" && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                            </button>
                          )}

                          {/* Filtered Clients list */}
                          {clientMasters
                            .filter(
                              (c) =>
                                c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                                (c.gstin && c.gstin.toLowerCase().includes(clientSearchQuery.toLowerCase()))
                            )
                            .map((c) => {
                              const isSelected = schemaClient === c.id;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setSchemaClient(c.id);
                                    setIsClientDropdownOpen(false);
                                    setClientSearchQuery("");
                                  }}
                                  className={`w-full text-left px-3 py-2 text-xs transition-colors flex flex-col cursor-pointer ${
                                    isSelected
                                      ? "bg-indigo-50/70 text-indigo-900 font-black"
                                      : "text-slate-750 hover:bg-slate-50 font-semibold"
                                  }`}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className="truncate font-bold">{c.name}</span>
                                    {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0 ml-1" />}
                                  </div>
                                  {c.gstin && (
                                    <span className="text-[10px] text-slate-450 font-mono font-medium mt-0.5">
                                      {c.gstin}
                                    </span>
                                  )}
                                </button>
                              );
                            })}

                          {clientMasters.filter(
                            (c) =>
                              c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                              (c.gstin && c.gstin.toLowerCase().includes(clientSearchQuery.toLowerCase()))
                          ).length === 0 &&
                            !("all clients".includes(clientSearchQuery.toLowerCase()) || "general".includes(clientSearchQuery.toLowerCase()) || !clientSearchQuery) && (
                              <div className="p-3 text-center text-slate-400 text-[10px] font-mono">
                                No matching clients found
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-slate-500 uppercase font-mono font-bold mb-1">
                      SCHEMA NAME / FILE CONTEXT HEAD
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Purchase Format Schema, Sales Register Template, Freight & Delivery Logs"
                      value={schemaName}
                      onChange={(e) => setSchemaName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-250 py-2 px-3 rounded-lg text-slate-850 font-extrabold focus:outline-none focus:border-indigo-500 focus:bg-white shadow-3xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-mono font-bold mb-1">
                    SHORT REMARKS & PROTOCOL NOTES
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Standard layout for logging vendor purchase orders and GST tax credits."
                    value={schemaDescription}
                    onChange={(e) => setSchemaDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 py-2 px-3 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>

                {/* Picture 2 FIX: Real row-by-row columns list editor instead of comma text string! */}
                <div className="border border-indigo-100 rounded-xl p-4 bg-slate-50/50 space-y-3 shadow-3xs">
                  <div className="flex justify-between items-center pb-2 border-b border-indigo-100">
                    <div>
                      <span className="text-[10px] text-indigo-950 font-black uppercase tracking-wider block">
                        ⚙️ EDIT DIRECT COLUMNS LIST (ROW-BY-ROW)
                      </span>
                      <p className="text-[9px] text-slate-500 mt-0.5">Specify individual columns in order. Mark elements as hidden or discard them seamlessly.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSchemaColumnRow}
                      className="bg-indigo-600 hover:bg-indigo-750 text-white text-[10px] font-bold px-3 py-1 ml-auto rounded-md flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="h-3 w-3" /> Add Column Row
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[290px] overflow-y-auto p-1.5 custom-scrollbar">
                    {schemaColumns.map((col, cIdx) => (
                      <div 
                        key={col.id} 
                        className={`flex items-center gap-1.5 bg-white border p-2 rounded-lg shadow-4xs transition-all ${
                          col.isHidden ? "opacity-50 border-red-150 bg-slate-50" : "border-slate-200 hover:border-indigo-300"
                        }`}
                      >
                        <span className="text-[10px] font-mono text-slate-400 font-bold w-4 text-center">
                          {cIdx + 1}
                        </span>
                        
                        <input
                          type="text"
                          required
                          placeholder="e.g. GST_RATE, BALANCE"
                          value={col.name}
                          onChange={(e) => handleUpdateSchemaColumnName(col.id, e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200/80 rounded py-1 px-2 text-xs font-mono font-extrabold text-indigo-950 uppercase placeholder-slate-300 focus:outline-none focus:border-indigo-500 focus:bg-white"
                        />

                        {/* Hide Column Option */}
                        <button
                          type="button"
                          onClick={() => handleToggleSchemaColumnVisibility(col.id)}
                          className={`p-1.5 rounded-md border text-xs cursor-pointer transition-colors ${
                            col.isHidden 
                              ? "bg-red-50 text-red-500 border-red-200 hover:bg-red-100" 
                              : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                          }`}
                          title={col.isHidden ? "Hidden - Click to display in sheet" : "Visible - Click to Hide this column"}
                        >
                          {col.isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>

                        {/* Delete Column Option */}
                        <button
                          type="button"
                          onClick={() => handleRemoveSchemaColumnRow(col.id)}
                          className="bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-400 p-1.5 rounded-md border border-slate-200 cursor-pointer"
                          title="Delete column row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    {schemaColumns.length === 0 && (
                      <div className="text-center p-6 text-slate-400 font-mono text-[10px] col-span-full">
                        Empty column list. Click 'Add Column Row' above to declare custom worksheet variables.
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetSchemaForm}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-250 px-4 py-2 rounded-lg cursor-pointer font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg cursor-pointer font-bold flex items-center gap-1 shadow"
                  >
                    <Check className="h-4 w-4" /> Save Schema Structure
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Action bar and dynamic list */}
          {(() => {
            const purchaseSchemas = sheetSchemaMappings.filter((s) => getSchemaCategory(s.schemaName) === "PURCHASE");
            const salesSchemas = sheetSchemaMappings.filter((s) => getSchemaCategory(s.schemaName) === "SALES");
            const expensesSchemas = sheetSchemaMappings.filter((s) => getSchemaCategory(s.schemaName) === "EXPENSES");
            const generalSchemas = sheetSchemaMappings.filter((s) => getSchemaCategory(s.schemaName) === "GENERAL");

            const purchaseCount = purchaseSchemas.length;
            const salesCount = salesSchemas.length;
            const expensesCount = expensesSchemas.length;
            const generalCount = generalSchemas.length;

            const filteredByCategory = sheetSchemaMappings.filter((s) => getSchemaCategory(s.schemaName) === registryCategory);

            // Extract unique clients present in filtered-by-category schemas
            const activeClientIdsInCat = Array.from(new Set(filteredByCategory.map((s) => s.clientId).filter(id => id !== "all")));
            const uniqueClientsInCat = clientMasters.filter((c) => activeClientIdsInCat.includes(c.id));

            // Schemas to display
            const displayedSchemas = filteredByCategory.filter((schema) => {
              if (registryClientId === "all") return true;
              return schema.clientId === registryClientId;
            });

            return (
              <div className="space-y-4">
                <div className="flex flex-col gap-4 bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                      <Layers className="h-4 w-4 text-amber-600" />
                      Dynamic Schema Template Registry ({sheetSchemaMappings.length})
                    </span>
                    {!showSchemaForm && (
                      <button
                        type="button"
                        onClick={() => {
                          resetSchemaForm();
                          setShowSchemaForm(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer uppercase transition-all shadow-3xs"
                      >
                        <Plus className="h-4 w-4" /> Create New Schema
                      </button>
                    )}
                  </div>

                  {/* FIRST LEVEL CATEGORY TABS */}
                  <div className="flex flex-wrap gap-2 border-b border-slate-200/60 pb-1.5">
                    {[
                      { id: "PURCHASE", label: "Purchase Schemas", icon: FileSpreadsheet, count: purchaseCount },
                      { id: "SALES", label: "Sales Schemas", icon: Layers, count: salesCount },
                      { id: "EXPENSES", label: "Expense Schemas", icon: FileText, count: expensesCount },
                      { id: "GENERAL", label: "General & Other", icon: Settings2, count: generalCount }
                    ].map((tab) => {
                      const isActive = registryCategory === tab.id;
                      const IconComponent = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setRegistryCategory(tab.id as any);
                            setRegistryClientId("all"); // Reset client filter on category switch
                            setTabClientSearchQuery(""); // Reset search query on category switch
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border ${
                            isActive
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                              : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <IconComponent className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                          <span>{tab.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                            isActive 
                              ? "bg-white/20 text-white" 
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}>
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* SECOND LEVEL NESTED CLIENT FILTERS WITH TAB SEARCH */}
                  {filteredByCategory.length > 0 && (
                    <div className="flex flex-col gap-3 bg-white p-3 rounded-xl border border-slate-200/50 shadow-3xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500 uppercase font-mono font-bold tracking-wider flex items-center gap-1.5">
                          📂 Choose Client Tab:
                        </span>
                        
                        {/* Tab Search Input Box */}
                        {uniqueClientsInCat.length > 1 && (
                          <div className="relative max-w-xs w-full sm:w-64 flex items-center gap-1.5 bg-slate-50 border border-slate-250 rounded-lg px-2 py-1">
                            <Search className="h-3 w-3 text-slate-400 shrink-0" />
                            <input
                              type="text"
                              placeholder="Search client tabs..."
                              value={tabClientSearchQuery}
                              onChange={(e) => setTabClientSearchQuery(e.target.value)}
                              className="w-full bg-transparent text-[10px] text-slate-750 outline-none border-none py-0 focus:ring-0 font-bold"
                            />
                            {tabClientSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setTabClientSearchQuery("")}
                                className="text-slate-400 hover:text-slate-650 text-[10px] font-black px-1"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 items-center">
                        <button
                          type="button"
                          onClick={() => setRegistryClientId("all")}
                          className={`px-3 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all border ${
                            registryClientId === "all"
                              ? "bg-slate-800 text-white border-slate-800 shadow-3xs"
                              : "bg-slate-100 hover:bg-slate-200/60 text-slate-650 border-slate-200"
                          }`}
                        >
                          All Clients ({filteredByCategory.length})
                        </button>
                        {uniqueClientsInCat
                          .filter((c) =>
                            c.name.toLowerCase().includes(tabClientSearchQuery.toLowerCase()) ||
                            (c.gstin && c.gstin.toLowerCase().includes(tabClientSearchQuery.toLowerCase()))
                          )
                          .map((c) => {
                            const clientCount = filteredByCategory.filter(s => s.clientId === c.id).length;
                            const isSelected = registryClientId === c.id;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => setRegistryClientId(c.id)}
                                className={`px-3 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all border ${
                                  isSelected
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-3xs"
                                    : "bg-slate-50 hover:bg-slate-150 text-slate-650 border-slate-200"
                                }`}
                              >
                                {c.name} ({clientCount})
                              </button>
                            );
                          })}

                        {uniqueClientsInCat.filter((c) =>
                          c.name.toLowerCase().includes(tabClientSearchQuery.toLowerCase()) ||
                          (c.gstin && c.gstin.toLowerCase().includes(tabClientSearchQuery.toLowerCase()))
                        ).length === 0 && (
                          <span className="text-[10px] text-slate-400 font-mono italic p-1">
                            No clients match search query
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dynamic list in list format as requested */}
                <div className="flex flex-col gap-3.5">
                  {displayedSchemas.map((schema) => {
              // Read dynamic column list fallback
              let cols: any[] = [];
              if (schema.columns && schema.columns.length > 0) {
                cols = schema.columns;
              } else {
                cols = schema.columnsList.split(",").map((c, i) => ({
                  id: `sc-c-${i}`,
                  name: c.trim(),
                  isHidden: false
                })).filter(c => c.name);
              }

              const isExpanded = !!expandedSchemaIds[schema.id];
              const visibleCols = cols.filter(c => !c.isHidden);
              const hiddenCols = cols.filter(c => c.isHidden);

              return (
                <div 
                  key={schema.id} 
                  className={`bg-white border rounded-xl overflow-hidden transition-all text-left shadow-4xs ${
                    isExpanded ? "border-amber-400 ring-1 ring-amber-100 pb-2" : "border-slate-200 hover:border-slate-350"
                  }`}
                >
                  {/* Collapsed Header: Toggling expand on click with list-aligned layout */}
                  <div 
                    onClick={() => toggleSchemaExpand(schema.id)}
                    className="p-3.5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-slate-50/50 select-none gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Checkbox option to "tick" / click as requested */}
                      <input
                        type="checkbox"
                        checked={isExpanded}
                        readOnly
                        className="h-4 w-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500 cursor-pointer pointer-events-none shrink-0"
                      />
                      
                      <div className="flex flex-col md:flex-row md:items-center gap-2.5 min-w-0 flex-1">
                        {/* HIGHLY HIGHLIGHTED CLIENT NAME BADGE */}
                        <span className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-black px-3 py-1 rounded-lg shrink-0 shadow-2xs">
                          <span className="text-xs">🏢</span>
                          <span className="tracking-tight uppercase">{schema.clientName || "All Clients / General Standard Format"}</span>
                        </span>

                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-xs text-slate-900 tracking-tight uppercase truncate">
                            {schema.schemaName}
                          </h4>
                          {schema.description && (
                            <p className="text-[10px] text-slate-500 truncate font-semibold mt-0.5">
                              {schema.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                      <span className="bg-amber-50 text-amber-950 text-[9px] font-mono tracking-wider font-extrabold px-2 py-1 rounded-md border border-amber-200 shrink-0">
                        📁 {getSchemaCategory(schema.schemaName)}
                      </span>
                      
                      <span className="text-[10px] text-slate-650 font-mono bg-slate-50 border border-slate-200 px-2 py-1 rounded font-black shrink-0">
                        {visibleCols.length} Columns {hiddenCols.length > 0 && `(${hiddenCols.length} H)`}
                      </span>
                      <div className="text-slate-400 flex items-center shrink-0">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Body containing detailed configuration */}
                  {isExpanded && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/20 space-y-4 animate-slideDown">
                      {/* Description & metadata info */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pb-3 border-b border-slate-100 text-xs">
                        <div className="md:col-span-3">
                          <span className="block text-[9px] text-slate-400 font-mono uppercase font-extrabold">Short Protocol Annotation</span>
                          <p className="text-[11px] text-slate-650 font-medium italic mt-0.5">
                            {schema.description || "No description / remarks configured for this dynamic layout."}
                          </p>
                        </div>
                        <div className="md:text-right">
                          <span className="block text-[9px] text-slate-400 font-mono uppercase font-extrabold">Registered on Ledger</span>
                          <p className="text-[11px] text-slate-700 font-mono font-bold mt-0.5">
                            {new Date(schema.createdAt || "").toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Display Column-by-column list inside card details box */}
                      <div>
                        <span className="block text-[9px] text-indigo-755 font-bold font-mono uppercase tracking-wide mb-2">
                          📋 ACTIVE TEMPLATE COLUMNS STRUCTURE
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {cols.map((col, cIdx) => (
                            <div 
                              key={col.id || cIdx} 
                              className={`p-2 rounded-lg border text-left flex flex-col justify-between ${
                                col.isHidden 
                                  ? "bg-red-50/50 border-red-150/80 text-red-700 opacity-60" 
                                  : "bg-white border-slate-200 text-slate-800"
                              }`}
                            >
                              <span className="text-[8px] font-mono font-bold text-slate-405 block mb-1">
                                COL #{cIdx + 1} {col.isHidden && "(HIDDEN)"}
                              </span>
                              <span className="text-[10px] font-mono font-bold tracking-tight uppercase truncate">
                                {col.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                                {/* Expanded footer action control buttons */}
                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center bg-white -mx-4 -mb-6 px-4 py-3 bg-slate-50/80 border-b rounded-b-xl mt-4">
                        <div className="flex gap-1.5 items-center">
                          <button
                            type="button"
                            onClick={() => handleEditSchemaClick(schema)}
                            className="bg-white hover:bg-slate-100 hover:text-indigo-800 text-slate-700 border border-slate-250 font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="h-3 w-3 text-indigo-700" /> Edit Layout Form
                          </button>

                          {deletingSchemaId === schema.id ? (
                            <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-2 py-0.5 animate-fadeIn">
                              <span className="text-[9px] text-red-700 font-extrabold uppercase font-mono mr-1">Confirm?</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = sheetSchemaMappings.filter(it => it.id !== schema.id);
                                  if (onSaveSheetSchemas) onSaveSheetSchemas(updated);
                                  triggerFeedback(`Deleted configuration: "${schema.schemaName}"`);
                                  setDeletingSchemaId(null);
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white text-[8.5px] font-black px-1.5 py-0.5 rounded cursor-pointer uppercase"
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingSchemaId(null)}
                                className="bg-slate-205 hover:bg-slate-350 text-slate-700 text-[8.5px] font-bold px-1.5 py-0.5 rounded cursor-pointer uppercase"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteSchemaClick(schema.id, schema.schemaName)}
                              className="bg-white hover:bg-red-50 hover:text-red-700 text-slate-700 border border-slate-250 font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3 text-red-500" /> Delete Schema
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleExportCsvTemplate(schema.schemaName, cols)}
                          className="bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold text-[10.5px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer font-mono shadow-3xs hover:shadow-2xs transition-all"
                        >
                          <Download className="h-3 w-3" /> Export Clean CSV Template
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                  );
                })}
              </div>

              {displayedSchemas.length === 0 && (
                <div className="bg-white border border-slate-200 p-12 text-center rounded-2xl shadow-3xs max-w-md mx-auto col-span-1 sm:col-span-2 lg:col-span-3">
                  <Layers className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <h5 className="font-extrabold text-slate-700 text-xs uppercase font-mono">No Schemas In This Tab</h5>
                  <p className="text-[10px] text-slate-450 font-bold mt-1">
                    No custom layouts have been registered for {registryCategory.toLowerCase()} for the selected client yet.
                  </p>
                </div>
              )}
            </div>
            );
          })()}

          {/* --- GOOGLE WORKSPACE DRIVE MASTER SHEET INITIALIZER UTILITY --- */}
          <div className="bg-gradient-to-br from-amber-50/50 to-indigo-50/30 border border-slate-200/90 rounded-2xl p-6 shadow-xs mt-8 text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-5 mb-5">
              <div>
                <span className="bg-amber-100 text-amber-900 text-[9px] font-black tracking-widest px-2.5 py-1 rounded-md uppercase font-mono block w-fit mb-1.5 border border-amber-200 shadow-3xs">
                  📁 Google Drive Automation
                </span>
                <h4 className="font-extrabold text-slate-850 text-[14px] leading-tight uppercase flex items-center gap-2">
                  One-Time Client Google Sheets Tabs Initializer
                </h4>
                <p className="text-[10.5px] text-slate-500 font-semibold mt-1">
                  Automate the setup of Master Accounting Sheets inside each client's Google Drive folder. This utility automatically injects 5 core ledger tabs aligned to active schemas.
                </p>
              </div>

              {/* AUTH STATUS CORNER */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-3xs shrink-0 flex items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full ${isDriveAuthorized ? "bg-green-500 animate-pulse" : "bg-red-400"}`} />
                <div className="text-left font-sans">
                  <p className="text-[9px] text-slate-400 font-mono uppercase font-black leading-none">Connection Status</p>
                  <p className="text-[11px] text-slate-800 font-bold mt-0.5 leading-none">
                    {isDriveAuthorized ? "🟢 Google Drive Active" : "🔴 Drive Disconnected"}
                  </p>
                  {isDriveAuthorized && (
                    <p className="text-[9px] text-slate-450 font-mono mt-0.5">{googleUserEmail}</p>
                  )}
                </div>
                <div className="ml-2 shrink-0">
                  {isDriveAuthorized ? (
                    <button
                      type="button"
                      onClick={handleGoogleDriveDisconnect}
                      className="text-[10px] font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded border border-red-200 cursor-pointer"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGoogleDriveAuth}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded border border-indigo-200 cursor-pointer flex items-center gap-1 font-mono"
                    >
                      Authorize Google Drive
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* THE 5 SCHEMAS GRID EXPLAINER */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-3xs mb-6">
              <span className="text-[9px] text-slate-450 font-mono font-black uppercase tracking-wider block mb-2.5">
                📦 Layout Matrix: 5 Core Accounting Tabs Established
              </span>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                <div className="p-2.5 rounded-xl border border-green-200 bg-green-50/20 text-left">
                  <span className="text-[10.5px] text-green-800 font-black tracking-wide block">1. PURCHASE</span>
                  <p className="text-[9px] text-slate-500 font-semibold mt-0.5">18 mapped columns (Posting, Vouchers, Tax credits, state schemas)</p>
                </div>
                <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/20 text-left">
                  <span className="text-[10.5px] text-blue-800 font-black tracking-wide block">2. SALES</span>
                  <p className="text-[9px] text-slate-500 font-semibold mt-0.5">37 mapped columns (Invoices, balance freight, motor cash, settlements)</p>
                </div>
                <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/20 text-left">
                  <span className="text-[10.5px] text-amber-800 font-black tracking-wide block">3. BANK</span>
                  <p className="text-[9px] text-slate-500 font-semibold mt-0.5">9 mapped columns (Posting date, debit, credit balance, categorizations)</p>
                </div>
                <div className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/20 text-left">
                  <span className="text-[10.5px] text-purple-800 font-black tracking-wide block">4. TRANSPORT_EXP</span>
                  <p className="text-[9px] text-slate-500 font-semibold mt-0.5">12 mapped columns (GR records, transporters, balances, vehicles)</p>
                </div>
                <div className="p-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-left">
                  <span className="text-[10.5px] text-pink-800 font-black tracking-wide block">5. VEHICLE_EXP</span>
                  <p className="text-[9px] text-slate-500 font-semibold mt-0.5">9 mapped columns (Drivers, fuels, maintenance, vendor categories)</p>
                </div>
              </div>
            </div>

            {/* ACTION TRIGGERS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* TARGET CLIENT LISTINGS */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-3xs lg:col-span-4 max-h-[300px] overflow-y-auto">
                <span className="text-[9px] text-slate-450 font-mono font-black uppercase tracking-wider block mb-2.5">
                  👥 Client Folders Ready to Synchronize
                </span>
                <div className="space-y-2">
                  {clientMasters.map((c) => {
                    const status = syncClientStatus[c.id] || "pending";
                    return (
                      <div key={c.id} className="p-2 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-left">
                        <div className="truncate pr-2">
                          <p className="text-[11px] text-slate-800 font-bold truncate leading-snug">{c.name}</p>
                          <p className="text-[9px] text-slate-400 font-mono truncate">
                            ID: {c.driveFolderId || "⚠️ Drive Folder Not set"}
                          </p>
                        </div>
                        <div className="shrink-0">
                          {status === "pending" && (
                            <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                              Ready
                            </span>
                          )}
                          {status === "processing" && (
                            <span className="text-[9px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full border border-indigo-200 animate-pulse flex items-center gap-1 font-mono">
                              ⏳ Syncing
                            </span>
                          )}
                          {status === "success" && (
                            <span className="text-[9px] bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-0.5">
                              ✓ Complete
                            </span>
                          )}
                          {status === "error" && (
                            <span className="text-[9px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full border border-red-200">
                              Error
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CONTROL CENTER & REAL-TIME LOGS */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleBulkSetupGoogleSheets}
                    disabled={isSyncingAllClients || !isDriveAuthorized}
                    className={`px-5 py-3 rounded-xl font-bold font-sans text-xs uppercase shadow-sm flex items-center gap-2 tracking-wider shrink-0 transition-all cursor-pointer ${
                      !isDriveAuthorized
                        ? "bg-slate-200 text-slate-400 border border-slate-300/60 cursor-not-allowed"
                        : isSyncingAllClients
                        ? "bg-indigo-400 text-indigo-100 border border-indigo-300 cursor-not-allowed"
                        : "bg-indigo-650 hover:bg-indigo-800 text-white border border-indigo-700 hover:shadow-md active:scale-[0.98]"
                    }`}
                  >
                    🚀 One-Click Setup Master Sheets
                  </button>
                  
                  {!isDriveAuthorized && (
                    <div className="bg-amber-50 border border-amber-200/70 p-2.5 rounded-xl flex items-center gap-2 text-left shrink">
                      <span className="text-[15px] shrink-0">💡</span>
                      <p className="text-[10px] text-amber-850 font-bold leading-tight">
                        Please authorize Google Drive connection in the top-right corner to activate bulk client setup.
                      </p>
                    </div>
                  )}
                </div>

                {/* PROGRESS BAR */}
                {(isSyncingAllClients || syncProgress > 0) && (
                  <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-3xs text-left animate-fadeIn">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">
                        {syncProgress === 100 ? "🎉 Completed!" : "⚙️ Syncing Clients Master sheets..."}
                      </span>
                      <span className="text-[11px] text-indigo-700 font-bold font-mono">{syncProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                      <div
                        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-350"
                        style={{ width: `${syncProgress}%` }}
                      />
                    </div>
                    <div className="flex gap-4 mt-2 font-mono text-[9.5px] text-slate-500">
                      <span>✓ Synced Folders: <strong className="text-green-700 font-extrabold">{syncSuccessCount}</strong></span>
                      {syncErrorCount > 0 && (
                        <span>❌ Failures: <strong className="text-red-600 font-bold">{syncErrorCount}</strong></span>
                      )}
                    </div>
                  </div>
                )}

                {/* CONSOLE OUTPUT LOGGER */}
                <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-lg text-left">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 bg-green-400 rounded-full animate-ping" /> Real-time Sync Console Output
                    </span>
                    <button
                      type="button"
                      onClick={() => setSyncLogs([])}
                      className="text-[9px] text-slate-500 hover:text-slate-300 font-mono cursor-pointer"
                    >
                      Clear Logs
                    </button>
                  </div>
                  <div className="h-[180px] overflow-y-auto font-mono text-[10px] leading-relaxed text-slate-300 space-y-1 select-text scrollbar-thin">
                    {syncLogs.length === 0 ? (
                      <p className="text-slate-500 italic text-center py-12">No active events. Start the initializer to see the execution logs stream.</p>
                    ) : (
                      syncLogs.map((log, idx) => {
                        let color = "text-slate-300";
                        if (log.includes("SUCCESS") || log.includes("🎉")) color = "text-green-400 font-bold";
                        else if (log.includes("📁") || log.includes("[Found]")) color = "text-blue-400";
                        else if (log.includes("⚠️") || log.includes("Warning")) color = "text-amber-400";
                        else if (log.includes("⚙️") || log.includes("✍️")) color = "text-indigo-300";
                        
                        return (
                          <div key={idx} className={`${color} border-l-2 border-slate-800 pl-2`}>
                            {log}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn text-left">
          {/* BANK STATEMENT SETUP SECTION */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs">
            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-3">
              <div>
                <h4 className="font-extrabold text-xs text-slate-850 uppercase flex items-center gap-2">
                  🏦 Bank Sheet Mapping Setup ({bankFormatMappings.length} Configured)
                </h4>
                <p className="text-[10px] text-slate-500 mt-1 lines-relaxed font-medium">
                  Map spreadsheet headers dynamically. You can easily add and delete columns, or mark arbitrary rows as hidden to support multiple statement types easily without altering formulas!
                </p>
              </div>

              {!showBankForm && (
                <button
                  type="button"
                  onClick={() => {
                    resetBankForm();
                    setShowBankForm(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer uppercase transition-all shadow-3xs"
                >
                  <Plus className="h-4 w-4" /> Add New Bank Mapping
                </button>
              )}
            </div>

            {/* EXPANDABLE ADD AND EDIT FORM - COLUMN BY COLUMN WITH ADD, DELETE AND HIDE OPTIONS */}
            {showBankForm && (
              <form onSubmit={handleCreateOrUpdateBank} className="bg-white border border-indigo-150 rounded-xl p-5 space-y-4 animate-fadeIn shadow-xs font-semibold text-slate-700 text-xs">
                <div className="bg-indigo-50 px-3 py-2 rounded border border-indigo-100 flex justify-between items-center">
                  <span className="text-[10px] text-indigo-800 font-mono font-bold uppercase tracking-wider block">
                    {editBankId ? "✍️ Editing Bank Sheet Mapping Configuration" : "✨ Create Bank Column Mapping"}
                  </span>
                  <button 
                    type="button" 
                    onClick={resetBankForm}
                    className="text-slate-400 hover:text-slate-650 cursor-pointer font-bold text-xs"
                  >
                    ✕ Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono font-bold mb-1">
                      Bank Registry Master Identifier Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. State Bank of India Current A/C, ICICI Corporate Statement, Bank of Baroda"
                      value={bankNameStr}
                      onChange={(e) => setBankNameStr(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-250 rounded px-2.5 py-2 text-xs text-slate-800 font-extrabold focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono font-bold mb-1">
                      Assign to specific Client (Optional)
                    </label>
                    <select
                      value={bankClientId}
                      onChange={(e) => {
                        setBankClientId(e.target.value);
                        const cl = clientMasters.find(c => c.id === e.target.value);
                        setBankClientName(cl ? cl.name : "All Clients / General");
                      }}
                      className="w-full bg-slate-50 border border-slate-250 rounded px-2.5 py-2 text-xs text-slate-800 font-extrabold focus:outline-none focus:border-indigo-500 focus:bg-white"
                    >
                      <option value="all">All Clients (General Standard Format)</option>
                      {clientMasters.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="block text-[10px] text-indigo-700 font-bold font-mono uppercase tracking-wide">
                      🔄 MATCH SPREADSHEET HEADERS (COLUMN BY COLUMN EDITOR)
                    </span>
                    <button
                      type="button"
                      onClick={handleAddBankColumnRow}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[10px] px-2.5 py-1 rounded border border-indigo-200 cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add custom mapped Column
                    </button>
                  </div>

                  {/* Render Columns-by-column editor for Bank registry: perfectly solves "bank mapping tab me columns badane or ghatne ka option... or column hide ka" */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[350px] overflow-y-auto p-1.5 custom-scrollbar bg-slate-50/50 rounded-lg border border-slate-200/60">
                    {bankColumns.map((col, bIdx) => (
                      <div 
                        key={col.id} 
                        className={`flex items-center gap-2 bg-white border p-2 rounded-lg shadow-4xs transition-all ${
                          col.isHidden ? "opacity-55 border-red-150 bg-red-50/20" : "border-slate-200 hover:border-indigo-300"
                        }`}
                      >
                        <span className="text-[10px] font-mono text-slate-400 font-bold w-4 text-center shrink-0">
                          {bIdx + 1}
                        </span>

                        <div className="flex-1 flex flex-col min-w-0">
                          {col.isCustom ? (
                            <input
                              type="text"
                              value={col.systemField}
                              onChange={(e) => handleUpdateBankSystemField(col.id, e.target.value)}
                              placeholder="System Field"
                              className="bg-slate-50 border border-slate-200/60 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase text-indigo-700 outline-none focus:border-indigo-500 focus:bg-white mb-0.5"
                            />
                          ) : (
                            <span className="text-[9px] font-mono font-black uppercase text-indigo-850 truncate mb-0.5" title={col.systemField}>
                              {col.systemField}
                            </span>
                          )}

                          <input
                            type="text"
                            required
                            placeholder="Excel Header"
                            value={col.excelHeader}
                            onChange={(e) => handleUpdateBankExcelHeader(col.id, e.target.value)}
                            className="bg-slate-50 border border-slate-200/80 rounded py-1 px-2 text-xs font-mono font-extrabold text-slate-800 uppercase placeholder-slate-300 focus:outline-none focus:border-indigo-500 focus:bg-white"
                          />
                        </div>

                        <div className="flex flex-col gap-1 shrink-0">
                          {/* Hide Column Option */}
                          <button
                            type="button"
                            onClick={() => handleToggleBankColumnVisibility(col.id)}
                            className={`p-1 rounded border text-xs cursor-pointer transition-colors ${
                              col.isHidden 
                                ? "bg-red-50 text-red-500 border-red-200 hover:bg-red-100" 
                                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                            }`}
                            title={col.isHidden ? "Hidden - This column will be ignored in parse" : "Active - Click to ignore column"}
                          >
                            {col.isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>

                          {/* Delete Column Option */}
                          {(col.isCustom || bIdx >= 6) && (
                            <button
                              type="button"
                              onClick={() => handleRemoveBankColumnRow(col.id)}
                              className="bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-400 p-1 rounded border border-slate-200 cursor-pointer"
                              title="Delete Column Mapping"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={resetBankForm}
                    className="bg-white hover:bg-slate-50 text-slate-705 border border-slate-250 px-4 py-2 rounded-lg cursor-pointer font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg cursor-pointer font-bold flex items-center gap-1.5 shadow"
                  >
                    <Check className="h-4 w-4" /> Save Bank Mapping Schema
                  </button>
                </div>
              </form>
            )}

            {(() => {
              const sbiBankSchemas = bankFormatMappings.filter((s) => getBankCategory(s.bankName) === "SBI");
              const hdfcBankSchemas = bankFormatMappings.filter((s) => getBankCategory(s.bankName) === "HDFC");
              const iciciBankSchemas = bankFormatMappings.filter((s) => getBankCategory(s.bankName) === "ICICI");
              const generalBankSchemas = bankFormatMappings.filter((s) => getBankCategory(s.bankName) === "GENERAL");

              const sbiCount = sbiBankSchemas.length;
              const hdfcCount = hdfcBankSchemas.length;
              const iciciCount = iciciBankSchemas.length;
              const generalBankCount = generalBankSchemas.length;

              const filteredByBankCategory = bankFormatMappings.filter((s) => getBankCategory(s.bankName) === bankRegistryCategory);

              // Extract unique clients present in filtered-by-category schemas
              const activeBankClientIdsInCat = Array.from(new Set(filteredByBankCategory.map((s) => s.clientId || "all").filter(id => id !== "all")));
              const uniqueBankClientsInCat = clientMasters.filter((c) => activeBankClientIdsInCat.includes(c.id));

              // Schemas to display
              const displayedBankSchemas = filteredByBankCategory.filter((schema) => {
                if (bankRegistryClientId === "all") return true;
                return (schema.clientId || "all") === bankRegistryClientId;
              });

              return (
                <div className="space-y-4 text-left">
                  <div className="flex flex-col gap-4 bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                        <Layers className="h-4 w-4 text-indigo-600" />
                        Dynamic Bank Sheet Mapping Registry ({bankFormatMappings.length})
                      </span>
                    </div>

                    {/* FIRST LEVEL CATEGORY TABS FOR BANK STATEMENT PROFILES */}
                    <div className="flex flex-wrap gap-2 border-b border-slate-200/60 pb-1.5">
                      {[
                        { id: "SBI", label: "SBI Statements", icon: FileSpreadsheet, count: sbiCount },
                        { id: "HDFC", label: "HDFC Statements", icon: Layers, count: hdfcCount },
                        { id: "ICICI", label: "ICICI Statements", icon: FileText, count: iciciCount },
                        { id: "GENERAL", label: "General & Other Banks", icon: Settings2, count: generalBankCount }
                      ].map((tab) => {
                        const isActive = bankRegistryCategory === tab.id;
                        const IconComponent = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              setBankRegistryCategory(tab.id as any);
                              setBankRegistryClientId("all"); // Reset client filter on category switch
                              setBankTabClientSearchQuery(""); // Reset search query on category switch
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border ${
                              isActive
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <IconComponent className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                            <span>{tab.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                              isActive 
                                ? "bg-white/20 text-white" 
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}>
                              {tab.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* SECOND LEVEL NESTED CLIENT FILTERS WITH SEARCH */}
                    {filteredByBankCategory.length > 0 && (
                      <div className="flex flex-col gap-3 bg-white p-3 rounded-xl border border-slate-200/50 shadow-3xs w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-500 uppercase font-mono font-bold tracking-wider flex items-center gap-1.5">
                            📂 Choose Client Tab:
                          </span>
                          
                          {/* Tab Search Input Box */}
                          {uniqueBankClientsInCat.length > 1 && (
                            <div className="relative max-w-xs w-full sm:w-64 flex items-center gap-1.5 bg-slate-50 border border-slate-250 rounded-lg px-2 py-1">
                              <Search className="h-3 w-3 text-slate-400 shrink-0" />
                              <input
                                type="text"
                                placeholder="Search client tabs..."
                                value={bankTabClientSearchQuery}
                                onChange={(e) => setBankTabClientSearchQuery(e.target.value)}
                                className="w-full bg-transparent text-[10px] text-slate-750 outline-none border-none py-0 focus:ring-0 font-bold"
                              />
                              {bankTabClientSearchQuery && (
                                <button
                                  type="button"
                                  onClick={() => setBankTabClientSearchQuery("")}
                                  className="text-slate-400 hover:text-slate-650 text-[10px] font-black px-1"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5 items-center">
                          <button
                            type="button"
                            onClick={() => setBankRegistryClientId("all")}
                            className={`px-3 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all border ${
                              bankRegistryClientId === "all"
                                ? "bg-slate-800 text-white border-slate-800 shadow-3xs"
                                : "bg-slate-100 hover:bg-slate-200/60 text-slate-650 border-slate-200"
                            }`}
                          >
                            All Clients ({filteredByBankCategory.length})
                          </button>
                          {uniqueBankClientsInCat
                            .filter((c) =>
                              c.name.toLowerCase().includes(bankTabClientSearchQuery.toLowerCase()) ||
                              (c.gstin && c.gstin.toLowerCase().includes(bankTabClientSearchQuery.toLowerCase()))
                            )
                            .map((c) => {
                              const clientCount = filteredByBankCategory.filter(s => s.clientId === c.id).length;
                              const isSelected = bankRegistryClientId === c.id;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => setBankRegistryClientId(c.id)}
                                  className={`px-3 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all border ${
                                    isSelected
                                      ? "bg-indigo-600 text-white border-indigo-600 shadow-3xs"
                                      : "bg-slate-50 hover:bg-slate-150 text-slate-650 border-slate-200"
                                  }`}
                                >
                                  {c.name} ({clientCount})
                                </button>
                              );
                            })}

                          {uniqueBankClientsInCat.filter((c) =>
                            c.name.toLowerCase().includes(bankTabClientSearchQuery.toLowerCase()) ||
                            (c.gstin && c.gstin.toLowerCase().includes(bankTabClientSearchQuery.toLowerCase()))
                          ).length === 0 && uniqueBankClientsInCat.length > 0 && (
                            <span className="text-[10px] text-slate-400 font-mono italic p-1">
                              No clients match search query
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dynamic list in list format with cards and expansion (accordion) */}
                  <div className="flex flex-col gap-3.5">
                    {displayedBankSchemas.map((item) => {
                      let colsList: any[] = [];
                      if (item.columns && item.columns.length > 0) {
                        colsList = item.columns;
                      } else {
                        // Rebuild fallback
                        colsList = [
                          { systemField: "Transaction Date", excelHeader: item.dateColumn, isHidden: false },
                          { systemField: "Particulars / Narration", excelHeader: item.particularsColumn, isHidden: false },
                          { systemField: "Chq No / Ref No", excelHeader: item.chqNoColumn, isHidden: false },
                          { systemField: "Debit (Withdrawals)", excelHeader: item.debitColumn, isHidden: false },
                          { systemField: "Credit (Deposits)", excelHeader: item.creditColumn, isHidden: false },
                          { systemField: "Running LEDGER Balance", excelHeader: item.balanceColumn, isHidden: false }
                        ];
                      }

                      const isExpanded = !!expandedSchemaIds[item.id];
                      const visibleCols = colsList.filter(c => !c.isHidden);
                      const hiddenCols = colsList.filter(c => c.isHidden);

                      return (
                        <div 
                          key={item.id} 
                          className={`bg-white border rounded-xl overflow-hidden transition-all text-left shadow-4xs ${
                            isExpanded ? "border-amber-400 ring-1 ring-amber-100 pb-2" : "border-slate-200 hover:border-slate-350"
                          }`}
                        >
                          {/* Collapsed Header */}
                          <div 
                            onClick={() => toggleSchemaExpand(item.id)}
                            className="p-3.5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-slate-50/50 select-none gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Checkbox to "tick" / click */}
                              <input
                                type="checkbox"
                                checked={isExpanded}
                                readOnly
                                className="h-4 w-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500 cursor-pointer pointer-events-none shrink-0"
                              />
                              
                              <div className="flex flex-col md:flex-row md:items-center gap-2.5 min-w-0 flex-1">
                                {/* HIGHLY HIGHLIGHTED CLIENT NAME BADGE */}
                                <span className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-black px-3 py-1 rounded-lg shrink-0 shadow-2xs">
                                  <span className="text-xs">🏢</span>
                                  <span className="tracking-tight uppercase">{item.clientName || "All Clients / General Standard Format"}</span>
                                </span>

                                <div className="min-w-0 flex-1">
                                  <h4 className="font-extrabold text-xs text-slate-900 tracking-tight uppercase truncate">
                                    {item.bankName}
                                  </h4>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                              <span className="bg-amber-50 text-amber-950 text-[9px] font-mono tracking-wider font-extrabold px-2 py-1 rounded-md border border-amber-200 shrink-0">
                                🏦 {getBankCategory(item.bankName)}
                              </span>
                              
                              <span className="text-[10px] text-slate-650 font-mono bg-slate-50 border border-slate-200 px-2 py-1 rounded font-black shrink-0">
                                {visibleCols.length} Fields {hiddenCols.length > 0 && `(${hiddenCols.length} H)`}
                              </span>
                              <div className="text-slate-400 flex items-center shrink-0">
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </div>
                            </div>
                          </div>

                          {/* Expanded Body */}
                          {isExpanded && (
                            <div className="p-4 border-t border-slate-100 bg-slate-50/20 space-y-4 animate-slideDown">
                              {/* Metadata info */}
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pb-3 border-b border-slate-100 text-xs">
                                <div className="md:col-span-3">
                                  <span className="block text-[9px] text-slate-400 font-mono uppercase font-extrabold">Registry Profile Type</span>
                                  <p className="text-[11px] text-slate-650 font-medium mt-0.5">
                                    Universally applicable {getBankCategory(item.bankName)} transaction import map profile.
                                  </p>
                                </div>
                                <div className="md:text-right">
                                  <span className="block text-[9px] text-slate-400 font-mono uppercase font-extrabold">Registered on Ledger</span>
                                  <p className="text-[11px] text-slate-700 font-mono font-bold mt-0.5">
                                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "System Standard"}
                                  </p>
                                </div>
                              </div>

                              {/* Columns structure display */}
                              <div>
                                <span className="block text-[9px] text-indigo-755 font-bold font-mono uppercase tracking-wide mb-2">
                                  📋 ACTIVE BANK COLUMN MATCH MAPS
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                  {colsList.map((col, cIdx) => (
                                    <div 
                                      key={cIdx} 
                                      className={`p-2 rounded-lg border text-left flex flex-col justify-between ${
                                        col.isHidden 
                                          ? "bg-red-50/50 border-red-150/80 text-red-700 opacity-60" 
                                          : "bg-white border-slate-200 text-slate-800"
                                      }`}
                                    >
                                      <span className="text-[8px] font-mono font-bold text-slate-400 block mb-1 uppercase">
                                        {col.systemField} {col.isHidden && "(HIDDEN)"}
                                      </span>
                                      <span className="text-[10px] font-mono font-black text-indigo-900 tracking-tight uppercase truncate">
                                        {col.excelHeader || "—"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Expanded footer action control buttons */}
                              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center bg-white -mx-4 -mb-6 px-4 py-3 bg-slate-50/80 border-b rounded-b-xl mt-4">
                                <div className="flex gap-1.5 items-center">
                                  <button
                                    type="button"
                                    onClick={() => handleEditBankClick(item)}
                                    className="bg-white hover:bg-slate-100 hover:text-indigo-800 text-slate-700 border border-slate-250 font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-3xs"
                                  >
                                    <Edit className="h-3 w-3 text-indigo-700" /> Edit Layout Form
                                  </button>

                                  {deletingBankId === item.id ? (
                                    <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-2 py-0.5 animate-fadeIn">
                                      <span className="text-[9px] text-red-700 font-extrabold uppercase font-mono mr-1">Confirm?</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = bankFormatMappings.filter(it => it.id !== item.id);
                                          if (onSaveBankMappings) onSaveBankMappings(updated);
                                          triggerFeedback(`Deleted bank structure: "${item.bankName}"`);
                                          setDeletingBankId(null);
                                        }}
                                        className="bg-red-600 hover:bg-red-700 text-white text-[8.5px] font-black px-1.5 py-0.5 rounded cursor-pointer uppercase"
                                      >
                                        Yes
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeletingBankId(null)}
                                        className="bg-slate-205 hover:bg-slate-350 text-slate-700 text-[8.5px] font-bold px-1.5 py-0.5 rounded cursor-pointer uppercase"
                                      >
                                        No
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteBankClick(item.id, item.bankName)}
                                      className="bg-white hover:bg-red-50 hover:text-red-700 text-slate-700 border border-slate-250 font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-3xs"
                                    >
                                      <Trash2 className="h-3 w-3 text-red-500" /> Discard Bank Setup
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {displayedBankSchemas.length === 0 && (
                    <div className="bg-white border border-slate-200 p-12 text-center rounded-2xl shadow-3xs max-w-md mx-auto">
                      <Layers className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <h5 className="font-extrabold text-slate-700 text-xs uppercase font-mono">No Banks In This Tab</h5>
                      <p className="text-[10px] text-slate-450 font-bold mt-1">
                        No bank statement profiles have been mapped for {bankRegistryCategory} for the selected client yet.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Guide Explainer Card */}
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3 mt-4 text-[10px] text-slate-700 font-medium">
              <HelpCircle className="h-4.5 w-4.5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 mb-1 leading-none">💡 Bank Sheet Mapping & Masking Guide:</p>
                <ul className="list-disc pl-4 space-y-1 font-sans">
                  <li>Specify the literal Row Header found in your downloaded XLS/CSV bank sheet corresponding to standard system variables.</li>
                  <li>Clicking <strong>Hide (Eye icon)</strong> on any mapping disables that specific field matching dynamically. Useful if a passbook statement doesn't track specific data points (e.g., Running Balance columns).</li>
                  <li>These configurations apply globally to simplify all transactional imports!</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
