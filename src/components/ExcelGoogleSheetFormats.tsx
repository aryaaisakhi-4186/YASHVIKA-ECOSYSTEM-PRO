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
  ChevronUp
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

              <form onSubmit={handleCreateOrUpdateSchema} className="space-y-5 text-xs font-medium text-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono font-bold mb-1">
                      CLIENT ASSIGNMENT
                    </label>
                    <select
                      value={schemaClient}
                      onChange={(e) => setSchemaClient(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-250 py-2 px-2.5 rounded-lg text-slate-800 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                    >
                      <option value="all">All Clients / General Standard Format</option>
                      {clientMasters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.gstin ? `(${c.gstin})` : ""}
                        </option>
                      ))}
                    </select>
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
          <div className="flex justify-between items-center bg-slate-50/50 border border-slate-200/60 p-3.5 rounded-xl">
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

          {/* Picture 3 FIX: Compact bento style cards in a grid of 3 per row for high density on large screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5 items-start">
            {sheetSchemaMappings.map((schema) => {
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
                    isExpanded ? "border-amber-400 ring-1 ring-amber-100 col-span-1 sm:col-span-2 lg:col-span-3 pb-2" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Collapsed Header: Toggling expand on click with compact styles */}
                  <div 
                    onClick={() => toggleSchemaExpand(schema.id)}
                    className="p-3.5 flex flex-col justify-between cursor-pointer hover:bg-slate-50/50 select-none space-y-3"
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Checkbox option to "tick" / click as requested */}
                      <input
                        type="checkbox"
                        checked={isExpanded}
                        onChange={() => {}} // Controlled by header click
                        className="h-4 w-4 mt-0.5 rounded text-amber-600 border-slate-300 focus:ring-amber-500 cursor-pointer pointer-events-none shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="bg-amber-100 text-amber-900 text-[8px] font-mono tracking-wider font-extrabold px-1.5 py-0.5 rounded border border-amber-200">
                            {schema.schemaName.toLowerCase().includes("purchase") ? "PURCHASE" : schema.schemaName.toLowerCase().includes("sales") ? "SALES" : schema.schemaName.toLowerCase().includes("expense") ? "EXPENSES" : "GENERAL SHEETS"}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono font-bold truncate">
                            {schema.clientName}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-900 tracking-tight uppercase mt-1">
                          {schema.schemaName}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[9px] text-slate-500 font-mono bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-black">
                        {visibleCols.length} Columns {hiddenCols.length > 0 && `(${hiddenCols.length} H)`}
                      </span>
                      <div className="text-slate-400 flex items-center">
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

            {sheetSchemaMappings.length === 0 && (
              <div className="bg-slate-50 p-12 text-center rounded-2xl border border-dashed border-slate-250 text-slate-400 font-mono col-span-1 sm:col-span-2 lg:col-span-3">
                No custom schema formats registered. Click "Create New Schema" to declare custom sheet layouts.
              </div>
            )}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-dashed border-slate-200">
                    {bankColumns.map((col, bIdx) => (
                      <div 
                        key={col.id} 
                        className={`bg-white p-3 rounded-lg border flex flex-col justify-between space-y-2 relative transition-all ${
                          col.isHidden ? "opacity-55 border-red-150 bg-red-50/20" : "border-slate-205 scroll-m-2 hover:border-indigo-300"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          {col.isCustom ? (
                            <input
                              type="text"
                              value={col.systemField}
                              onChange={(e) => handleUpdateBankSystemField(col.id, e.target.value)}
                              placeholder="System Parameter Name"
                              className="text-[10px] font-mono font-bold uppercase text-indigo-700 bg-slate-50 border border-slate-200 px-1 py-0.5 rounded w-36 outline-none"
                            />
                          ) : (
                            <span className="text-[10px] font-mono font-black uppercase text-indigo-850">
                              {col.systemField}
                            </span>
                          )}

                          <div className="flex gap-1">
                            {/* Hide/Show Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleBankColumnVisibility(col.id)}
                              className={`p-1 rounded cursor-pointer border text-[10px] flex items-center gap-0.5 ${
                                col.isHidden 
                                  ? "bg-red-100 text-red-600 border-red-200" 
                                  : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                              }`}
                              title={col.isHidden ? "Hidden - This column will be ignored in parse" : "Active - Click to ignore column"}
                            >
                              {col.isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              <span className="text-[8px] font-mono">{col.isHidden ? "HIDDEN" : "ACTIVE"}</span>
                            </button>

                            {/* Delete dynamically requested Column */}
                            {(col.isCustom || bIdx >= 6) && (
                              <button
                                type="button"
                                onClick={() => handleRemoveBankColumnRow(col.id)}
                                className="text-red-400 hover:text-red-650 p-1 rounded hover:bg-red-50 border border-slate-100 cursor-pointer"
                                title="Delete Mapping"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[8px] text-slate-405 font-mono uppercase font-bold mb-1">
                            STATEMENT EXCEL ROW HEADER NAME
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Cr Amt, Txn Date, Description"
                            value={col.excelHeader}
                            onChange={(e) => handleUpdateBankExcelHeader(col.id, e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200/90 rounded px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:bg-white"
                          />
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

            {/* CONFIGURATION LIST REGISTRY TAB */}
            <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-3xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-[10px] tracking-wider uppercase text-slate-500 font-mono">
                      <th className="p-3 text-center">S.No</th>
                      <th className="p-3">Bank registry profile head</th>
                      <th className="p-3">Columns configuration list</th>
                      <th className="p-3 text-right">Action Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {bankFormatMappings.map((item: any, idx) => {
                      // Retrieve dynamic column mapping models
                      let colsList: any[] = [];
                      if (item.columns && item.columns.length > 0) {
                        colsList = item.columns;
                      } else {
                        // Rebuild fallback
                        colsList = [
                          { systemField: "Transaction Date", excelHeader: item.dateColumn, isHidden: false },
                          { systemField: "Particulars", excelHeader: item.particularsColumn, isHidden: false },
                          { systemField: "Chq No", excelHeader: item.chqNoColumn, isHidden: false },
                          { systemField: "Debit", excelHeader: item.debitColumn, isHidden: false },
                          { systemField: "Credit", excelHeader: item.creditColumn, isHidden: false },
                          { systemField: "Balance", excelHeader: item.balanceColumn, isHidden: false }
                        ];
                      }

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/40 text-slate-700">
                          <td className="p-3 text-center font-bold text-slate-350">{idx + 1}</td>
                          <td className="p-3 font-extrabold text-slate-900 font-sans">
                            {item.bankName}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {colsList.map((col, cIdx) => (
                                <span 
                                  key={cIdx} 
                                  className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                                    col.isHidden 
                                      ? "bg-red-50 text-red-700 border-red-150 line-through opacity-50" 
                                      : "bg-slate-50 text-slate-850 border-slate-205 font-bold"
                                  }`}
                                  title={`${col.systemField} internally mapped to "${col.excelHeader}"`}
                                >
                                  {col.systemField}: <strong>{col.excelHeader}</strong>
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1.5 items-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleEditBankClick(item)}
                                className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded hover:bg-slate-50 border border-slate-100 bg-white shadow-3xs cursor-pointer"
                                title="Modify Mapping form"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>

                              {deletingBankId === item.id ? (
                                <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded px-1.5 py-0.5 animate-fadeIn">
                                  <span className="text-[8px] text-red-700 font-extrabold uppercase font-mono mr-1">Del?</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = bankFormatMappings.filter(it => it.id !== item.id);
                                      if (onSaveBankMappings) onSaveBankMappings(updated);
                                      triggerFeedback(`Deleted bank structure: "${item.bankName}"`);
                                      setDeletingBankId(null);
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white text-[8px] font-black px-1.5 py-0.5 rounded cursor-pointer uppercase"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingBankId(null)}
                                    className="bg-slate-205 hover:bg-slate-350 text-slate-700 text-[8px] font-bold px-1.5 py-0.5 rounded cursor-pointer uppercase"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBankClick(item.id, item.bankName)}
                                  className="text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-slate-50 border border-slate-100 bg-white shadow-3xs cursor-pointer"
                                  title="Discard bank setup"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {bankFormatMappings.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-slate-400 font-mono">
                          No custom Bank configurations registered. Click 'Add New Bank Mapping' above to map column headers.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

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
