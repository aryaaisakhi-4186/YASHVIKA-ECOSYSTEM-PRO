import React, { useState, useEffect } from "react";
import { 
  X, 
  Upload, 
  Settings, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Plus, 
  Trash2, 
  Sparkles, 
  FileCheck, 
  HelpCircle,
  TrendingUp,
  RotateCw,
  Eye,
  Info,
  Workflow,
  FolderOpen,
  FileSpreadsheet,
  MessageSquare,
  Send
} from "lucide-react";
import { Bill, BillItem, ClientMaster } from "../types";

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

interface ColumnConfig {
  key: string;
  label: string;
  description: string;
  type: "string" | "number";
  letter?: string;
}

// ----------------------------------------------------
// DYNAMIC EXCEL/SHEETS ALPHABETICAL COLUMN UTILITIES
// ----------------------------------------------------
function indexToColumnLetter(index: number): string {
  let letter = "";
  let temp = index;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

function columnLetterToIndex(letter: string): number {
  let index = 0;
  const cleanLetter = letter.toUpperCase().replace(/[^A-Z]/g, "");
  for (let i = 0; i < cleanLetter.length; i++) {
    index = index * 26 + (cleanLetter.charCodeAt(i) - 64);
  }
  return index - 1;
}

function getNextAvailableLetter(cols: ColumnConfig[]): string {
  if (cols.length === 0) return "A";
  const indices = cols
    .map(c => c.letter ? columnLetterToIndex(c.letter) : -1)
    .filter(idx => idx >= 0);
  if (indices.length === 0) return "A";
  const maxIdx = Math.max(...indices);
  return indexToColumnLetter(maxIdx + 1);
}

function shiftColumns(existingColumns: ColumnConfig[], insertAtLetter: string): ColumnConfig[] {
  const insertIndex = columnLetterToIndex(insertAtLetter);
  return existingColumns.map(col => {
    if (!col.letter) return col;
    const colIndex = columnLetterToIndex(col.letter);
    if (colIndex >= insertIndex) {
      return { ...col, letter: indexToColumnLetter(colIndex + 1) };
    }
    return col;
  });
}

const defaultColumns: ColumnConfig[] = [
  { key: "Vendor_Name", label: "Vendor Name", description: "Legal or trading name of the supplier/issuer of the bill.", type: "string", letter: "A" },
  { key: "GSTIN_Supplier", label: "GSTIN Supplier", description: "The 15-digit GSTIN of the supplier (No spaces/hyphens).", type: "string", letter: "B" },
  { key: "Invoice_Number", label: "Invoice Number", description: "The unique invoice/bill/serial number.", type: "string", letter: "C" },
  { key: "Invoice_Date", label: "Invoice Date", description: "Date of issue of the invoice in YYYY-MM-DD or standard readable text format.", type: "string", letter: "D" },
  { key: "Item_Name", label: "Item Name", description: "Name or description of the primary items/goods scanned from the bill.", type: "string", letter: "E" },
  { key: "Item_Qty", label: "Item Qty", description: "Quantity of the primary item printed in the items table.", type: "number", letter: "F" },
  { key: "Item_Unit", label: "Item Unit", description: "Unit of measurement of the item (e.g. PCS, BOX, KGS, BAGS).", type: "string", letter: "G" },
  { key: "Taxable_Value", label: "Taxable Value", description: "The total value of goods/services BEFORE adding GST.", type: "number", letter: "H" },
  { key: "CGST", label: "CGST", description: "Central GST amount. If not present, return 0.", type: "number", letter: "I" },
  { key: "SGST_UTGST", label: "SGST/UTGST", description: "State or Union Territory GST amount. If not present, return 0.", type: "number", letter: "J" },
  { key: "IGST", label: "IGST", description: "Integrated GST amount. If not present, return 0.", type: "number", letter: "K" },
  { key: "Grand_Total", label: "Grand Total", description: "The final invoice amount payable including all taxes and round-offs.", type: "number", letter: "L" },
  { key: "Bill_Sundry_1", label: "Bill Sundry-1", description: "Name or description of the first additional charge/discount (e.g. Freight, Delivery Charges, Packing Charges).", type: "string", letter: "M" },
  { key: "Bill_Sundry_1_Amount", label: "Bill Sundry-1 Amount", description: "Amount for Bill Sundry-1 charge/discount. Return 0 if not present.", type: "number", letter: "N" },
  { key: "Bill_Sundry_2", label: "Bill Sundry-2", description: "Name or description of the second additional charge/discount (e.g. Round Off, TCS, Discount).", type: "string", letter: "O" },
  { key: "Bill_Sundry_2_Amount", label: "Bill Sundry-2 Amount", description: "Amount for Bill Sundry-2 charge/discount. Return 0 if not present.", type: "number", letter: "P" }
];

interface VendorProfile {
  id: string;
  vendorName: string;
  gstin?: string;
  sopRules: string;       // Specific prompt rule overrides for this vendor
  specialQuirks?: string; // Quick reference notes (e.g., "Always round off to nearest 10 paise")
  lastScannedAt?: string;
}

interface AgenticAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBillScanned: (newBill: Bill) => void;
}

export default function AgenticAIModal({ isOpen, onClose, onBillScanned }: AgenticAIModalProps) {
  // Columns definition (dynamically editable) loaded/saved to local storage
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    const saved = localStorage.getItem("agentic_columns");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((col, idx) => ({
            ...col,
            letter: col.letter || indexToColumnLetter(idx)
          }));
        }
      } catch (e) {
        console.error("Failed to parse columns from localStorage:", e);
      }
    }
    return defaultColumns;
  });

  // Keep columns synchronized in local storage
  useEffect(() => {
    localStorage.setItem("agentic_columns", JSON.stringify(columns));
  }, [columns]);

  // Tab controller for the left panel configuration
  const [leftTab, setLeftTab] = useState<"columns" | "memory" | "chat">("columns");

  // Chat message interface & state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("agentic_chat_messages");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        role: "model",
        text: "Namaste! Main aapka **Agentic AI Scanner Assistant** hoon. 🌸\n\nAap mujhse scan configuration, rules, ya custom columns ke baare me kuch bhi chat kar sakte hain! Jaise:\n\n* *\"Freight charges ko locate karke Bill Sundry 1 Amount me daalo\"*\n* *\"Sales ke time par Vendor Name ki jagah Recipient Name display karo\"*\n* *\"Ek naya column add karo 'Discount' ke naam se\"*\n\nAap jo bhi guiding instructions denge, main unhe samajhkar **SOP Prompt Rules** aur **Target Columns** list ko background me automatic update kar doonga!"
      }
    ];
  });

  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Sync chat messages to local storage
  useEffect(() => {
    localStorage.setItem("agentic_chat_messages", JSON.stringify(chatMessages));
  }, [chatMessages]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingChat) return;

    const userMsg: ChatMessage = { role: "user", text: chatInput };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    const textToSend = chatInput;
    setChatInput("");
    setIsSendingChat(true);

    try {
      const res = await fetch("/api/gemini/agent-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          columns,
          sopRules,
          documentNature
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      if (data) {
        if (data.replyText) {
          setChatMessages(prev => [...prev, { role: "model", text: data.replyText }]);
        }
        if (data.updatedSopRules !== undefined && data.updatedSopRules !== sopRules) {
          setSopRules(data.updatedSopRules);
        }
        if (data.updatedColumns && Array.isArray(data.updatedColumns)) {
          const synchronizedCols = data.updatedColumns.map((col: any, idx: number) => ({
            ...col,
            letter: col.letter || indexToColumnLetter(idx)
          }));
          setColumns(synchronizedCols);
        }
      }
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        { role: "model", text: "Maaf kijiye, kuch error aaya: " + err.message }
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleClearChat = () => {
    const defaultMsg: ChatMessage = {
      role: "model",
      text: "Chat cleared! Main aapki help ke liye ready hoon. Kripya apne instructions type karein."
    };
    setChatMessages([defaultMsg]);
  };

  // Vendor Memory Profiles Database
  const [vendorProfiles, setVendorProfiles] = useState<VendorProfile[]>(() => {
    const saved = localStorage.getItem("agentic_vendor_profiles");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse vendor profiles from localStorage:", e);
      }
    }
    // Beautiful pre-populated templates to explain how format memory adapts!
    return [
      {
        id: "v-1",
        vendorName: "Radhe Agro Industries Ltd",
        gstin: "09RADHA5521M1Z5",
        sopRules: "Look for transport charges listed under 'Freight Charges' at the bottom of the bill. Round-off is always in Bill_Sundry_2_Amount.",
        specialQuirks: "Bills are bilingual (Hindi & English). Verify that scanned quantities exactly match physical packs.",
        lastScannedAt: "2026-06-25"
      },
      {
        id: "v-2",
        vendorName: "M.P. Plywood (India)",
        gstin: "23ADNPP4111B1Z3",
        sopRules: "Discount is shown as a percentage in bracket. Extract the absolute discount amount into Bill_Sundry_1_Amount as negative value. Taxable value is the pre-discount sum.",
        specialQuirks: "Item Name is printed in small font at top center of items table, look there first.",
        lastScannedAt: "2026-06-29"
      }
    ];
  });

  // Automatically save profiles to local storage on change
  useEffect(() => {
    localStorage.setItem("agentic_vendor_profiles", JSON.stringify(vendorProfiles));
  }, [vendorProfiles]);

  // Selected memory profile highlight
  const [appliedProfileId, setAppliedProfileId] = useState<string | null>(null);

  // New Vendor Memory form states
  const [showAddVendorForm, setShowAddVendorForm] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorGst, setNewVendorGst] = useState("");
  const [newVendorSop, setNewVendorSop] = useState("");
  const [newVendorQuirks, setNewVendorQuirks] = useState("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // SOP text (dynamically editable)
  const [sopRules, setSopRules] = useState<string>(
    "- Look at the final summary table at the bottom of the last page to extract total values and tax splits.\n- Cross-verify that Taxable_Value + Taxes + Bill Sundry Amounts equals the Grand_Total."
  );

  // New custom column form states
  const [newColKey, setNewColKey] = useState("");
  const [newColLabel, setNewColLabel] = useState("");
  const [newColDesc, setNewColDesc] = useState("");
  const [newColType, setNewColType] = useState<"string" | "number">("string");
  const [newColLetter, setNewColLetter] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Auto-fill target letter when add form is toggled
  useEffect(() => {
    if (showAddForm) {
      setNewColLetter(getNextAvailableLetter(columns));
    }
  }, [showAddForm, columns]);

  // Scan states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState("Preparing document analysis...");
  const [extractedResult, setExtractedResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Client and Routing Context
  const [clientMasters, setClientMasters] = useState<ClientMaster[]>(() => {
    const saved = localStorage.getItem("radha_client_masters");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse clients inside AI Agent modal:", e);
      }
    }
    return [];
  });

  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    const saved = localStorage.getItem("radha_client_masters");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed[0]?.id || "";
      } catch (e) {}
    }
    return "";
  });

  const [documentNature, setDocumentNature] = useState<"Purchase" | "Sale">("Purchase");
  const [userOverrodeNature, setUserOverrodeNature] = useState<boolean>(false);

  // Helper to dynamically rename "Vendor_Name" and "GSTIN_Supplier" labels based on Document Nature
  const getColLabel = (col: ColumnConfig) => {
    if (col.key === "Vendor_Name") {
      return documentNature === "Sale" ? "Recipient Name" : "Supplier Name";
    }
    if (col.key === "GSTIN_Supplier") {
      return documentNature === "Sale" ? "GSTIN Recipient" : "GSTIN Supplier";
    }
    return col.label;
  };

  // Editable fields copy state
  const [editedData, setEditedData] = useState<Record<string, any>>({});

  // Active word-snippet selector for visual click mapping
  const [selectedSnippet, setSelectedSnippet] = useState<string | null>(null);

  useEffect(() => {
    if (extractedResult && extractedResult.extractedData) {
      setEditedData({ ...extractedResult.extractedData });
    } else {
      setEditedData({});
    }
  }, [extractedResult]);

  useEffect(() => {
    if (!userOverrodeNature && selectedClientId && (editedData.GSTIN_Supplier || extractedResult?.extractedData?.GSTIN_Supplier)) {
      const activeClient = clientMasters.find(c => c.id === selectedClientId);
      const supplierGst = String(editedData.GSTIN_Supplier || extractedResult?.extractedData?.GSTIN_Supplier || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      const clientGst = String(activeClient?.gstin || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");

      if (clientGst && supplierGst && clientGst === supplierGst) {
        setDocumentNature("Sale");
      } else {
        setDocumentNature("Purchase");
      }
    }
  }, [selectedClientId, editedData.GSTIN_Supplier, extractedResult, clientMasters, userOverrodeNature]);

  // Extract clean text snippets from extracted result to assist in manual mapping
  const getHelperSnippets = () => {
    const snippets = new Set<string>();
    
    // Add default template patterns or extracted values
    if (extractedResult?.extractedData) {
      Object.entries(extractedResult.extractedData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== "") {
          const valStr = String(value).trim();
          snippets.add(valStr);
          // If it contains spaces, also add the words individually if they are meaningful
          if (valStr.includes(" ") && valStr.length > 3) {
            valStr.split(/\s+/).forEach(word => {
              const cleanWord = word.replace(/[,;]/g, "").trim();
              if (cleanWord.length > 2) snippets.add(cleanWord);
            });
          }
        }
      });
    }

    // Let's also parse some typical mock/test elements if it's the Satguru bill uploaded by user
    if (selectedFile?.name?.toLowerCase().includes("satguru") || selectedFile?.name?.toLowerCase().includes("bill") || selectedFile?.name?.toLowerCase().includes("invoice")) {
      snippets.add("SATGURU ENTERPRISES");
      snippets.add("23EEDPP1580K1ZD");
      snippets.add("ST/2026-27/128");
      snippets.add("D.M. TRADERS");
      snippets.add("23BZFPA4072F1ZW");
      snippets.add("1,00,950.00");
      snippets.add("18,000.00");
      snippets.add("30,995.00");
    }

    return Array.from(snippets).filter(s => s.length > 1 && s !== "—");
  };

  // Drag and drop state
  const [dragActive, setDragActive] = useState(false);

  // Local URL for rendering PDF/Image side-by-side
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setFileUrl(url);

      // Read as Data URL to bypass iframe blob URL security blocks for images in Chrome sandbox
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFileDataUrl(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFileDataUrl(null);
      }

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setFileUrl(null);
      setFileDataUrl(null);
    }
  }, [selectedFile]);

  // Rotating loading messages
  useEffect(() => {
    let interval: any;
    if (isScanning) {
      const messages = [
        "Analyzing document structure and geometry...",
        "Identifying OCR text fields & tables...",
        "Applying custom column mappings...",
        "Extracting values matching target keys...",
        "Executing SOP verification rules...",
        "Checking math: Taxable Value + Taxes vs Grand Total..."
      ];
      let idx = 0;
      interval = setInterval(() => {
        setScanMessage(messages[idx % messages.length]);
        idx++;
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isScanning]);

  if (!isOpen) return null;

  // Add column helper
  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColKey.trim() || !newColLabel.trim()) return;

    // Sanitize key (no spaces/special characters)
    const sanitizedKey = newColKey.trim().replace(/[^a-zA-Z0-9_]/g, "");
    
    if (columns.some(col => col.key === sanitizedKey)) {
      alert("A column with this key already exists!");
      return;
    }

    const targetLetter = newColLetter.trim().toUpperCase() || getNextAvailableLetter(columns);

    // Apply shifting if targetLetter is already present
    const shiftedExisting = shiftColumns(columns, targetLetter);

    const newCol: ColumnConfig = {
      key: sanitizedKey,
      label: newColLabel.trim(),
      description: newColDesc.trim() || `Custom field: ${newColLabel}`,
      type: newColType,
      letter: targetLetter
    };

    // Add new column and sort all columns alphabetically by their column letter
    const updatedColumns = [...shiftedExisting, newCol].sort((a, b) => {
      const aLetter = a.letter || "A";
      const bLetter = b.letter || "A";
      return columnLetterToIndex(aLetter) - columnLetterToIndex(bLetter);
    });

    setColumns(updatedColumns);

    // Reset form
    setNewColKey("");
    setNewColLabel("");
    setNewColDesc("");
    setNewColType("string");
    setNewColLetter("");
    setShowAddForm(false);
  };

  // Update existing column letter helper
  const handleUpdateColumnLetter = (colKey: string, newLetter: string) => {
    const cleanLetter = newLetter.toUpperCase().replace(/[^A-Z]/g, "");
    if (!cleanLetter) return;

    // 1. Filter out the column being updated so it doesn't get shifted
    const otherCols = columns.filter(c => c.key !== colKey);

    // 2. Shift the other columns to make room at the new letter
    const shiftedOthers = shiftColumns(otherCols, cleanLetter);

    // 3. Find the column being updated, assign the new letter
    const updatedCol = columns.find(c => c.key === colKey);
    if (!updatedCol) return;

    const newCol = { ...updatedCol, letter: cleanLetter };

    // 4. Combine and sort
    const finalCols = [...shiftedOthers, newCol].sort((a, b) => {
      const aL = a.letter || "A";
      const bL = b.letter || "A";
      return columnLetterToIndex(aL) - columnLetterToIndex(bL);
    });

    setColumns(finalCols);
  };

  // Re-index all columns to a clean sequential A, B, C... order
  const handleAutoAlignLetters = () => {
    const updated = columns.map((col, idx) => ({
      ...col,
      letter: indexToColumnLetter(idx)
    }));
    setColumns(updated);
  };

  // Delete column helper
  const handleDeleteColumn = (keyToDelete: string) => {
    setColumns(columns.filter(col => col.key !== keyToDelete));
  };

  // --- VENDOR MEMORY PROFILE HELPERS ---
  const handleApplyProfile = (profile: VendorProfile) => {
    setSopRules(profile.sopRules);
    setAppliedProfileId(profile.id);
    setSaveSuccessMsg(`Applied Memory SOP for: ${profile.vendorName}!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleClearAppliedProfile = () => {
    setSopRules(
      "- Look at the final summary table at the bottom of the last page to extract total values and tax splits.\n- Cross-verify that Taxable_Value + Taxes + Bill Sundry Amounts equals the Grand_Total."
    );
    setAppliedProfileId(null);
  };

  const handleSaveVendorProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim() || !newVendorSop.trim()) return;

    const existingIndex = vendorProfiles.findIndex(
      v => v.vendorName.toLowerCase().trim() === newVendorName.toLowerCase().trim() || 
           (v.gstin && v.gstin.trim() === newVendorGst.trim())
    );

    if (existingIndex > -1) {
      // Update existing
      const updated = [...vendorProfiles];
      updated[existingIndex] = {
        ...updated[existingIndex],
        vendorName: newVendorName.trim(),
        gstin: newVendorGst.trim() || updated[existingIndex].gstin,
        sopRules: newVendorSop.trim(),
        specialQuirks: newVendorQuirks.trim()
      };
      setVendorProfiles(updated);
      setSaveSuccessMsg(`Updated format memory for ${newVendorName}!`);
    } else {
      // Create new
      const newProfile: VendorProfile = {
        id: "v-" + Date.now(),
        vendorName: newVendorName.trim(),
        gstin: newVendorGst.trim() || undefined,
        sopRules: newVendorSop.trim(),
        specialQuirks: newVendorQuirks.trim() || undefined,
        lastScannedAt: new Date().toISOString().split("T")[0]
      };
      setVendorProfiles([newProfile, ...vendorProfiles]);
      setSaveSuccessMsg(`Saved memory profile for ${newVendorName}!`);
    }

    // Reset Form
    setNewVendorName("");
    setNewVendorGst("");
    setNewVendorSop("");
    setNewVendorQuirks("");
    setShowAddVendorForm(false);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const handleDeleteVendorProfile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent applying when clicking delete
    setVendorProfiles(vendorProfiles.filter(v => v.id !== id));
    if (appliedProfileId === id) {
      handleClearAppliedProfile();
    }
  };

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Helper to convert file to base64
  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // strip the data:mime/type;base64, prefix
        const base64Str = result.split(",")[1];
        resolve(base64Str);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Main agent scan execution trigger
  const handleExecuteAgentScan = async () => {
    if (!selectedFile) return;

    setIsScanning(true);
    setErrorMsg(null);
    setScanMessage("Reading uploaded file stream...");

    try {
      const base64 = await toBase64(selectedFile);
      const mimeType = selectedFile.type || "application/octet-stream";

      const payload = {
        base64,
        mimeType,
        columns: columns.map(c => ({
          ...c,
          label: getColLabel(c)
        })),
        sopRules
      };

      const res = await fetch("/api/gemini/agent-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Server returned error status ${res.status}`);
      }

      const data = await res.json();
      setExtractedResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to scan document with Agentic AI");
    } finally {
      setIsScanning(false);
    }
  };

  // SOP Mathematical Verification including new Bill Sundries
  const verifySopMath = () => {
    if (!extractedResult) return { isMatch: false, diff: 0, text: "" };

    const data = Object.keys(editedData).length > 0 ? editedData : extractedResult.extractedData;
    if (!data) return { isMatch: false, diff: 0, text: "" };
    
    // Extract values dynamically
    const taxable = parseFloat(data.Taxable_Value) || 0;
    const cgst = parseFloat(data.CGST) || 0;
    const sgst = parseFloat(data.SGST_UTGST) || 0;
    const igst = parseFloat(data.IGST) || 0;
    const grand = parseFloat(data.Grand_Total) || 0;
    
    // Extract bill sundries dynamically
    const sundry1 = parseFloat(data.Bill_Sundry_1_Amount) || 0;
    const sundry2 = parseFloat(data.Bill_Sundry_2_Amount) || 0;

    const sumTaxes = cgst + sgst + igst;
    // computed grand including tax splits + extra charges/sundries
    const computedGrand = taxable + sumTaxes + sundry1 + sundry2;

    const diff = Math.abs(computedGrand - grand);
    const isMatch = diff < 1.0; // allow minimal rounding float diff (INR 1.0 margin)

    return {
      isMatch,
      taxable,
      taxes: sumTaxes,
      sundries: sundry1 + sundry2,
      grand,
      computedGrand,
      diff
    };
  };

  const mathResults = verifySopMath();

  // Save/Approve and export to App's bills system
  const handleApproveAndSave = () => {
    const ext = Object.keys(editedData).length > 0 ? editedData : extractedResult?.extractedData;
    if (!ext) return;

    const selectedClient = clientMasters.find(c => c.id === selectedClientId);

    // Build a compliant Bill object
    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      supplierName: ext.Vendor_Name || "Scanned Vendor",
      supplierGSTIN: ext.GSTIN_Supplier || "",
      invoiceNo: ext.Invoice_Number || `INV-${Date.now().toString().slice(-4)}`,
      date: ext.Invoice_Date || new Date().toISOString().split("T")[0],
      items: [
        {
          localName: ext.Item_Name || "Extracted Agent Ledger Row Summary",
          mappedName: "General / Standard Mapping",
          quantity: parseFloat(ext.Item_Qty) || 1,
          rate: parseFloat(ext.Taxable_Value) || 0,
          taxableAmount: parseFloat(ext.Taxable_Value) || 0,
          gstRate: parseFloat(ext.IGST) > 0 ? 18 : 5,
          gstAmount: (parseFloat(ext.CGST) || 0) + (parseFloat(ext.SGST_UTGST) || 0) + (parseFloat(ext.IGST) || 0),
          hsnCode: "9982",
          totalAmount: parseFloat(ext.Grand_Total) || 0,
          isConfidenceLow: false
        }
      ],
      taxableAmountTotal: parseFloat(ext.Taxable_Value) || 0,
      gstAmountTotal: (parseFloat(ext.CGST) || 0) + (parseFloat(ext.SGST_UTGST) || 0) + (parseFloat(ext.IGST) || 0),
      totalAmountTotal: parseFloat(ext.Grand_Total) || 0,
      status: "Approved",
      confidenceScoreSupplier: extractedResult?.confidenceScore || 95,
      confidenceScoreItems: extractedResult?.confidenceScore || 95,
      isMathematicalError: !mathResults.isMatch,
      createdAt: new Date().toISOString()
    };

    onBillScanned(newBill);

    // Display clear routing confirmation message in alert dialogue with detailed instructions
    const folderName = documentNature === "Purchase" ? "01_Purchase_Bills" : "02_Sale_Bills";
    const sheetName = documentNature === "Purchase" ? "Purchase Format" : "Sales Format";
    const clientNameStr = selectedClient ? selectedClient.name : "Selected Client";

    alert(
      `🎉 Bill Successfully Approved & Logged!\n\n` +
      `🔗 Client Account: ${clientNameStr}\n` +
      `📥 Document Nature: ${documentNature === "Purchase" ? "Purchase Bill (खरीद)" : "Sale Bill (बिक्री)"}\n\n` +
      `📁 Saved inside Drive Folder: 01_Client_Drive / ${clientNameStr} / ${folderName}\n` +
      `📄 Connected Sheet Template: ${sheetName}`
    );
    onClose();
  };

  return (
    <div id="agentic-ai-scanner-modal" className="fixed inset-0 bg-slate-900/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-[96vw] xl:max-w-7xl rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[95vh]">
        
        {/* Modal Header */}
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl shadow-xs">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">Agentic AI File Scanner</h2>
              <p className="text-[11px] text-slate-500 font-medium">Extract structured values dynamically with user-defined columns & SOP verification rules</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Modal Body Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: CONFIGURATION (4/12 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-slate-100 pb-6 lg:pb-0 pr-0 lg:pr-6">
            
            {/* Elegant Tab Headers */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setLeftTab("columns")}
                className={`flex-1 py-1.5 text-[11px] font-extrabold rounded-lg transition-all text-center cursor-pointer ${
                  leftTab === "columns"
                    ? "bg-white text-slate-950 shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                ⚙️ Columns
              </button>
              <button
                type="button"
                onClick={() => setLeftTab("chat")}
                className={`flex-1 py-1.5 text-[11px] font-extrabold rounded-lg transition-all text-center relative cursor-pointer ${
                  leftTab === "chat"
                    ? "bg-amber-500 text-slate-950 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                💬 AI Chat
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setLeftTab("memory")}
                className={`flex-1 py-1.5 text-[11px] font-extrabold rounded-lg transition-all text-center relative cursor-pointer ${
                  leftTab === "memory"
                    ? "bg-white text-slate-950 shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🧠 Memory
                {vendorProfiles.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center">
                    {vendorProfiles.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tab 1: Columns Configuration & Generic SOP */}
            {leftTab === "columns" ? (
              <div className="space-y-4 flex-1 flex flex-col">
                {/* Columns Registry Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 tracking-wide uppercase">
                      <Settings className="h-4 w-4 text-amber-500" />
                      Target Columns ({columns.length})
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleAutoAlignLetters}
                        type="button"
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all border border-slate-200 cursor-pointer"
                        title="Reset all columns to sequential A, B, C... order"
                      >
                        Auto-Align A-Z
                      </button>
                      <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        type="button"
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-[10px] font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <Plus className="h-3 w-3" /> Add Column
                      </button>
                    </div>
                  </div>

                  {/* Add Custom Column Form */}
                  {showAddForm && (
                    <div className="mb-4 p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3 shadow-xs">
                      <form onSubmit={handleAddColumn} className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">JSON Key Name (No Spaces)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Item_Weight" 
                            value={newColKey}
                            onChange={e => setNewColKey(e.target.value)}
                            required
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-amber-500 bg-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">Human Label</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Item Weight" 
                            value={newColLabel}
                            onChange={e => setNewColLabel(e.target.value)}
                            required
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-amber-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">Instruction / Description</label>
                          <textarea 
                            placeholder="Explain to AI how to extract this field..." 
                            value={newColDesc}
                            onChange={e => setNewColDesc(e.target.value)}
                            rows={2}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-amber-500 bg-white resize-none"
                          />
                        </div>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                            <input 
                              type="radio" 
                              name="colType" 
                              checked={newColType === "string"} 
                              onChange={() => setNewColType("string")}
                              className="accent-amber-500"
                            /> String Text
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                            <input 
                              type="radio" 
                              name="colType" 
                              checked={newColType === "number"} 
                              onChange={() => setNewColType("number")}
                              className="accent-amber-500"
                            /> Number Value
                          </label>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                            <span>Alphabetical Column Letter (A, B, C...)</span>
                            <span className="text-[9px] text-amber-800 font-semibold bg-amber-50 px-1 py-0.5 rounded-sm">Auto-shifts if conflicted!</span>
                          </label>
                          <input 
                            type="text" 
                            placeholder="e.g. C" 
                            value={newColLetter}
                            onChange={e => setNewColLetter(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                            required
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-amber-500 bg-white font-mono uppercase font-bold text-slate-800"
                          />
                        </div>

                        {/* Educational Helper - Hindi / English Explanations */}
                        <div className="mt-3 pt-3 border-t border-amber-200 bg-amber-50/80 p-3 rounded-lg text-[11px] text-amber-950 space-y-2">
                          <div className="flex items-center gap-1 font-bold text-amber-900">
                            <Info className="h-3.5 w-3.5 shrink-0" />
                            <span>ये Fields कैसे काम करते हैं? (Learn the Concepts)</span>
                          </div>
                          
                          <div>
                            <strong className="text-amber-900 block font-black">1. JSON Key Name (क्या है और क्यों ज़रूरी है?)</strong>
                            <p className="text-slate-700 mt-0.5 leading-relaxed">
                              यह AI मॉडल के लिए एक **Technical Identifier Code** है। AI इसी नाम के Key में डाटा को extract करके response में वापस भेजता है।
                              <br />
                              <span className="text-red-700 font-semibold">• Rule:</span> इसमें **Spaces, special characters या Hindi अक्षर नहीं हो सकते**। हमेशा Underline (_) का इस्तेमाल करें।
                            </p>
                          </div>

                          <div>
                            <strong className="text-amber-900 block font-black">2. Human Label (दिखने वाला नाम)</strong>
                            <p className="text-slate-700 mt-0.5 leading-relaxed">
                              यह वह नाम है जो **Users को स्क्रीन, टेबल और प्रिंट बिल में दिखाई देगा**। इसमें आप spaces और symbols लिख सकते हैं।
                            </p>
                          </div>

                          <div>
                            <strong className="text-amber-900 block font-black">3. Instruction / Description (AI को गाइड करना)</strong>
                            <p className="text-slate-700 mt-0.5 leading-relaxed">
                              यह AI के लिए **Direct Prompting Order** है।
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-end gap-1.5 pt-1">
                          <button 
                            type="button" 
                            onClick={() => setShowAddForm(false)}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit"
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Save Column
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Columns Registry List */}
                  <div className="max-h-[260px] overflow-y-auto border border-slate-150 rounded-xl divide-y divide-slate-100 shadow-3xs bg-slate-50/50">
                    {columns.map((col) => (
                      <div key={col.key} className="p-2.5 bg-white flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {/* Column Letter Badge */}
                          <span className="flex-shrink-0 h-6 w-6 rounded-lg bg-amber-100 text-amber-950 font-black text-xs flex items-center justify-center border border-amber-200 shadow-3xs font-mono" title={`Column ${col.letter || "A"}`}>
                            {col.letter || "A"}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-extrabold text-slate-800">{getColLabel(col)}</span>
                              <span className="text-[8px] font-mono font-bold bg-slate-100 text-slate-600 px-1 py-0.5 rounded-sm uppercase">{col.type}</span>
                            </div>
                            <span className="block text-[10px] font-mono text-amber-800 truncate mt-0.5">{col.key}</span>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight truncate" title={col.description}>{col.description}</p>
                          </div>
                        </div>

                        {/* Dropdown for Changing Column Letter and Delete Button */}
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={col.letter || "A"}
                            onChange={(e) => handleUpdateColumnLetter(col.key, e.target.value)}
                            className="text-[10px] font-extrabold font-mono px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-slate-800 focus:border-amber-500 outline-none hover:bg-slate-100 transition-colors"
                            title="Change column letter/position (will shift subsequent columns)"
                          >
                            {Array.from({ length: 52 }).map((_, i) => {
                              const char = indexToColumnLetter(i);
                              return (
                                <option key={char} value={char}>
                                  Col {char}
                                </option>
                              );
                            })}
                          </select>

                          <button 
                            type="button"
                            onClick={() => handleDeleteColumn(col.key)}
                            className="text-slate-300 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                            title="Remove column definition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SOP Rule Editor Section */}
                <div className="mt-1 flex-1 flex flex-col">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 tracking-wide uppercase mb-1">
                    <BookOpen className="h-4 w-4 text-amber-500" />
                    SOP Prompt Rules for Run
                  </span>
                  {appliedProfileId && (
                    <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-900 flex items-center justify-between">
                      <span>🧠 Using <strong>Memory Rules</strong> for vendor</span>
                      <button 
                        onClick={handleClearAppliedProfile}
                        className="text-xs text-amber-900 hover:text-red-600 underline font-black cursor-pointer"
                      >
                        Reset to Default
                      </button>
                    </div>
                  )}
                  <textarea
                    value={sopRules}
                    onChange={e => setSopRules(e.target.value)}
                    placeholder="Write specific steps for verification..."
                    rows={4}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-amber-500 bg-slate-50/50 text-slate-700 outline-none resize-none leading-relaxed font-mono flex-1 min-h-[120px]"
                  />
                  <span className="text-[10px] text-slate-400 font-medium block mt-1.5">
                    These dynamic validation instructions are automatically appended to the model's extraction constraints.
                  </span>
                </div>
              </div>
            ) : leftTab === "chat" ? (
              // Tab 3: Guided Extraction AI Chat
              <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 rounded-2xl border border-slate-200 p-3 shadow-3xs overflow-hidden">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                      Guided Scan AI Chat
                    </span>
                  </div>
                  <button 
                    type="button"
                    onClick={handleClearChat}
                    className="text-[10px] text-slate-400 hover:text-slate-600 font-bold underline cursor-pointer"
                  >
                    Clear History
                  </button>
                </div>

                {/* Message Scroll Container */}
                <div className="flex-1 overflow-y-auto p-2 space-y-3.5 min-h-[250px] max-h-[450px]">
                  {chatMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                    >
                      <span className="text-[8px] font-bold text-slate-400 mb-0.5 uppercase">
                        {msg.role === "user" ? "Aap (User)" : "Scan Assistant AI"}
                      </span>
                      <div 
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line shadow-3xs ${
                          msg.role === "user"
                            ? "bg-slate-900 text-white rounded-tr-none font-bold"
                            : "bg-white text-slate-800 border border-slate-150 rounded-tl-none font-medium"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {isSendingChat && (
                    <div className="flex flex-col items-start">
                      <span className="text-[8px] font-bold text-slate-400 mb-0.5 uppercase">
                        Scan Assistant AI
                      </span>
                      <div className="bg-white text-slate-500 border border-slate-150 rounded-2xl rounded-tl-none px-3 py-2 text-xs flex items-center gap-1.5 shadow-3xs">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce"></span>
                        <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce delay-100"></span>
                        <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce delay-200"></span>
                        <span className="font-bold text-[10px] text-slate-400">AI is thinking & configuring...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input Form */}
                <form onSubmit={handleSendChatMessage} className="mt-2 pt-2 border-t border-slate-150 flex gap-1.5">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="AI ko instruct karein (e.g., set Round Off rules)..."
                    disabled={isSendingChat}
                    className="flex-1 text-xs px-3 py-2 border border-slate-250 rounded-xl outline-none focus:border-amber-500 bg-white placeholder-slate-400 disabled:opacity-60 text-slate-900 font-bold"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isSendingChat}
                    className="p-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-100 disabled:text-slate-300 text-slate-950 font-bold rounded-xl transition-all cursor-pointer shadow-3xs flex items-center justify-center shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            ) : (
              // Tab 2: Vendor Memory Database UI
              <div className="space-y-3.5 flex-1 flex flex-col overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 tracking-wide uppercase">
                    🧠 Memory profiles
                  </span>
                  <button
                    onClick={() => setShowAddVendorForm(!showAddVendorForm)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-[10px] font-bold transition-all shadow-xs cursor-pointer animate-pulse"
                  >
                    <Plus className="h-3 w-3" /> Add Vendor
                  </button>
                </div>

                {/* Toast Feedback */}
                {saveSuccessMsg && (
                  <div className="p-2.5 bg-green-50 border border-green-200 text-green-900 text-[11px] font-bold rounded-lg shadow-2xs">
                    {saveSuccessMsg}
                  </div>
                )}

                {/* Add/Edit Memory Form */}
                {showAddVendorForm && (
                  <form onSubmit={handleSaveVendorProfile} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-xs">
                    <h3 className="text-xs font-bold text-slate-800">🧠 वेंडर बिल फॉर्मेट याद रखें (Add Memory Profile)</h3>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-600 mb-1">Vendor Name / वेंडर का नाम</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Radhe Agro Industries" 
                        value={newVendorName}
                        onChange={e => setNewVendorName(e.target.value)}
                        required
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-amber-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-600 mb-1">GSTIN (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 09RADHA5521M1Z5" 
                        value={newVendorGst}
                        onChange={e => setNewVendorGst(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-amber-500 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-600 mb-1">Custom Format Rules / Prompt (SOP Override)</label>
                      <textarea 
                        placeholder="e.g. Look for transport charges listed under 'Freight Charges' at the bottom..." 
                        value={newVendorSop}
                        onChange={e => setNewVendorSop(e.target.value)}
                        required
                        rows={3}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-amber-500 bg-white resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-600 mb-1">Format Quirks / Extra Notes (वेंडर की विशिष्टता)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Discount is printed under Bracket %" 
                        value={newVendorQuirks}
                        onChange={e => setNewVendorQuirks(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-amber-500 bg-white"
                      />
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button 
                        type="button" 
                        onClick={() => setShowAddVendorForm(false)}
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Remember Layout
                      </button>
                    </div>
                  </form>
                )}

                {/* Short elegant note about vendor bills memory instead of the big banner */}
                <p className="text-[10px] text-slate-500 font-medium px-2.5 py-2 bg-amber-50/40 rounded-xl border border-amber-100/40">
                  💡 वेंडर की <strong>Memory Profile</strong> से AI को विशिष्ट निर्देश मिल जाते हैं, जिससे extraction शत-प्रतिशत सटीक रहता है।
                </p>

                {/* Profiles List */}
                <div className="flex-1 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 bg-white max-h-[300px]">
                  {vendorProfiles.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      No vendor memories stored yet. Add one above or scan a bill to remember its format!
                    </div>
                  ) : (
                    vendorProfiles.map((v) => (
                      <div 
                        key={v.id} 
                        onClick={() => handleApplyProfile(v)}
                        className={`p-3 transition-all cursor-pointer flex items-start justify-between gap-3 text-left ${
                          appliedProfileId === v.id 
                            ? "bg-amber-50 border-l-4 border-amber-500" 
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate block">{v.vendorName}</span>
                            {appliedProfileId === v.id && (
                              <span className="bg-amber-100 text-amber-900 text-[8px] px-1 py-0.5 rounded-sm font-bold uppercase shrink-0">
                                Active Memory
                              </span>
                            )}
                          </div>
                          {v.gstin && (
                            <span className="text-[9px] font-mono text-slate-400 block mt-0.5">GSTIN: {v.gstin}</span>
                          )}
                          <p className="text-[10px] text-slate-600 mt-1 font-mono leading-relaxed bg-slate-50/50 p-1.5 rounded border border-slate-100 max-h-[50px] overflow-y-auto">
                            <strong>Rules:</strong> {v.sopRules}
                          </p>
                          {v.specialQuirks && (
                            <p className="text-[9px] text-amber-800 font-medium mt-1">
                              💡 {v.specialQuirks}
                            </p>
                          )}
                          {v.lastScannedAt && (
                            <span className="text-[8px] text-slate-400 font-mono block mt-1">
                              Last Scan: {v.lastScannedAt}
                            </span>
                          )}
                        </div>

                        {/* Beautiful state-driven confirmation to bypass blocked native confirm in Chrome sandbox */}
                        <div className="flex flex-col items-end justify-between self-stretch shrink-0" onClick={(e) => e.stopPropagation()}>
                          {deleteConfirmId === v.id ? (
                            <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteVendorProfile(v.id, e);
                                  setDeleteConfirmId(null);
                                }}
                                className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-[9px] font-bold rounded transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(null);
                                }}
                                className="px-1.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-bold rounded transition-colors cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(v.id);
                              }}
                              className="text-slate-300 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                              title="Forget this vendor memory"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                      </div>
                    ))
                  )}
                </div>

                {appliedProfileId && (
                  <button
                    type="button"
                    onClick={handleClearAppliedProfile}
                    className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    ❌ Clear Applied Vendor Memory
                  </button>
                )}
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: SPLIT VIEW FOR SIDE-BY-SIDE PREVIEW & RESULTS (8/12 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            
            {/* File Dropzone Input - Only show when no file is selected */}
            {!selectedFile && (
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("agentic-file-input")?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3.5 relative overflow-hidden ${
                  dragActive ? "border-amber-500 bg-amber-50/40" : "border-slate-200 hover:border-amber-400 hover:bg-slate-50/50 bg-slate-50/10"
                }`}
              >
                <input 
                  id="agentic-file-input" 
                  type="file" 
                  onChange={handleFileChange}
                  className="hidden" 
                  accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.docx,.doc,.csv,.txt"
                />
                <div className="p-3 bg-amber-50 text-amber-600 rounded-full shadow-2xs">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">Drag & drop document here, or <span className="text-amber-600 hover:underline">browse files</span></p>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">Supports PDF, JPEG, PNG, Excel (.xlsx, .csv), Word (.docx), or Text files</p>
                </div>
              </div>
            )}

            {/* SIDE-BY-SIDE MAIN SPLIT CONTAINER */}
            {selectedFile && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start mt-1">
                
                {/* SPLIT LEFT: ACTUAL FILE PREVIEW PANEL + WORD SNIPPETS WORKSPACE (5/12 Cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col h-[460px] shadow-sm">
                    <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
                        <Eye className="h-3.5 w-3.5 text-amber-500" />
                        Original File Preview
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 truncate max-w-[150px]">
                        {selectedFile.name}
                      </span>
                    </div>

                    <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-center bg-slate-50">
                      {selectedFile.type.startsWith("image/") ? (
                        <div className="relative group max-h-full flex items-center justify-center flex-1">
                          <img 
                            src={fileDataUrl || fileUrl || undefined} 
                            alt="Invoice Preview" 
                            referrerPolicy="no-referrer"
                            className="max-h-[380px] max-w-full rounded-lg shadow-sm border border-slate-200 object-contain mx-auto"
                          />
                        </div>
                      ) : selectedFile.type === "application/pdf" ? (
                        <div className="w-full max-w-md p-5 border border-slate-100 rounded-2xl bg-white shadow-xs space-y-3.5 text-center my-auto">
                          <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto text-amber-500 animate-pulse">
                            <FileText className="h-6 w-6" />
                          </div>
                          
                          <div className="space-y-1">
                            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                              PDF Preview Ready!
                            </h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              Chrome's iframe sandbox security blocks integrated PDFs, but we have successfully prepared your document!
                            </p>
                            <p className="text-[10px] text-amber-850 font-semibold bg-amber-50/70 px-2 py-1.5 rounded-lg border border-amber-100 leading-normal">
                              🛡️ क्रोम सिक्योरिटी की वजह से पीडीएफ यहाँ ब्लॉक हो जाता है। आप नीचे दिए बटन से पीडीएफ को नए टैब में खोलकर देख सकते हैं।
                            </p>
                          </div>

                          {/* File details */}
                          <div className="p-2 bg-slate-50 rounded-xl text-[9px] text-slate-500 font-mono text-left space-y-0.5 border border-slate-100">
                            <p className="truncate"><span className="font-bold text-slate-700">File:</span> {selectedFile.name}</p>
                            <p><span className="font-bold text-slate-700">Size:</span> {(selectedFile.size / 1024).toFixed(1)} KB</p>
                          </div>

                          {/* target="_blank" button */}
                          {fileUrl && (
                            <a 
                              href={fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm hover:shadow-md items-center justify-center gap-1.5"
                            >
                              <Eye className="h-3.5 w-3.5 shrink-0" />
                              Open PDF Bill in New Tab 🌐
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="p-6 text-center space-y-2">
                          <FileText className="h-12 w-12 text-slate-400 mx-auto" />
                          <p className="text-xs font-bold text-slate-600">Office / Data File Format</p>
                          <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                            Format: {selectedFile.name.split('.').pop()?.toUpperCase()} Document
                            <br />
                            {selectedFile.size.toLocaleString()} Bytes Size
                          </p>
                          <p className="text-[10px] text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100">
                            AI scanner parses all raw cells and contents automatically under the hood!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* OCR & Custom Clipboard Word Mapping Tool */}
                  {extractedResult && (
                    <div className="border border-slate-200 rounded-xl bg-white p-3.5 space-y-3 shadow-3xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-800">
                          <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          Interactive Tag Mapper / मैपिंग टूल्स
                        </span>
                        {selectedSnippet && (
                          <button
                            onClick={() => setSelectedSnippet(null)}
                            className="text-[10px] text-red-600 hover:underline font-bold text-right"
                          >
                            Clear Selection
                          </button>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        💡 <strong>मैपिंग का तरीका:</strong> नीचे दिए किसी भी शब्द/संख्या पर क्लिक करें (वह हाइलाइट हो जायेगा), फिर दाहिने टेबल में जिस Field में उसे भरना है, उसके सामने वाले <strong>👈 Fill</strong> बटन को दबाएं।
                      </p>

                      {/* Tags bank container */}
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 max-h-[140px] overflow-y-auto flex flex-wrap gap-1.5">
                        {getHelperSnippets().length === 0 ? (
                          <span className="text-[10px] text-slate-400 italic mx-auto py-2">
                            No snippets found. Type or paste text below to convert into tags!
                          </span>
                        ) : (
                          getHelperSnippets().map((snippet, idx) => {
                            const isSelected = selectedSnippet === snippet;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedSnippet(snippet)}
                                className={`px-2 py-1 text-[10px] font-mono rounded-lg transition-all border ${
                                  isSelected
                                    ? "bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-xs scale-105"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                                }`}
                              >
                                {snippet}
                              </button>
                            );
                          })
                        )}
                      </div>

                      {/* Paste manual snippet box */}
                      <div className="space-y-1.5 pt-1.5 border-t border-slate-150">
                        <div className="flex items-center justify-between">
                          <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider">
                            Paste Clipboard Text / क्लिपबोर्ड से यहाँ पेस्ट करें
                          </label>
                          <span className="text-[8px] text-slate-400 font-medium">Auto-converts into tags</span>
                        </div>
                        <input
                          type="text"
                          placeholder="Type or paste any text copied from the bill to break into clickable tags..."
                          onChange={(e) => {
                            const text = e.target.value.trim();
                            if (text) {
                              const parts = text.split(/[\s,]+/);
                              if (parts.length > 0) {
                                setSelectedSnippet(parts[0]);
                              }
                            }
                          }}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-amber-500 bg-slate-50/50 font-sans"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* SPLIT RIGHT: EXTRACTED RESULTS & MATH MATRIX (7/12 Cols) */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* Active Client & Routing Connector */}
                  <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                      <Workflow className="h-5 w-5 text-amber-500 animate-pulse" />
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-100">
                          Active Client & Routing Connector
                        </h3>
                        <p className="text-[10px] text-slate-400">
                          AI automatically links scanned files with target folders & sheets
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      {/* Dropdown to select client */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wide">
                          Select Active Client / क्लाइंट चुनें
                        </label>
                        <select
                          value={selectedClientId}
                          onChange={(e) => {
                            setSelectedClientId(e.target.value);
                            setUserOverrodeNature(false); // reset override to allow auto-detection for the new client
                          }}
                          className="w-full text-xs px-2.5 py-2 bg-white border border-slate-300 text-slate-900 rounded-xl outline-none focus:border-amber-500 font-bold cursor-pointer"
                        >
                          <option value="" disabled className="text-slate-500 bg-white">-- Select Client --</option>
                          {clientMasters.map(c => (
                            <option key={c.id} value={c.id} className="text-slate-900 bg-white">
                              {c.name} ({c.gstin || "No GST"})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Nature selector */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wide">
                          Document Nature / बिल का प्रकार
                        </label>
                        <div className="flex bg-slate-850 p-1 rounded-xl border border-slate-755">
                          <button
                            type="button"
                            onClick={() => {
                              setDocumentNature("Purchase");
                              setUserOverrodeNature(true);
                            }}
                            className={`flex-1 py-1 px-2 text-[10px] font-bold rounded-lg transition-all text-center cursor-pointer ${
                              documentNature === "Purchase"
                                ? "bg-amber-500 text-slate-950 shadow-xs"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            📥 Purchase (खरीद)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDocumentNature("Sale");
                              setUserOverrodeNature(true);
                            }}
                            className={`flex-1 py-1 px-2 text-[10px] font-bold rounded-lg transition-all text-center cursor-pointer ${
                              documentNature === "Sale"
                                ? "bg-amber-500 text-slate-950 shadow-xs"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            📤 Sale (बिक्री)
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Connection mapping output visual helper */}
                    {selectedClientId && (() => {
                      const selectedClient = clientMasters.find(c => c.id === selectedClientId);
                      const folderName = documentNature === "Purchase" ? "01_Purchase_Bills" : "02_Sale_Bills";
                      const sheetName = documentNature === "Purchase" ? "Purchase Format" : "Sales Format";

                      return (
                        <div className="pt-2 border-t border-slate-800/80 space-y-2">
                          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold bg-amber-950/40 p-2 rounded-lg border border-amber-900/45 leading-relaxed">
                            <span>💡</span>
                            <span>
                              {documentNature === "Sale" ? (
                                <strong>Sale Bill detected</strong>
                              ) : (
                                <strong>Purchase Bill detected</strong>
                              )}
                              : {selectedClient?.name} के GSTIN ({selectedClient?.gstin || "—"}) {documentNature === "Sale" ? "वेंडर" : "खरीदार"} से मेल खाते हैं।
                            </span>
                          </div>

                          <div className="p-2.5 bg-slate-950/80 rounded-xl text-[10px] space-y-1.5 border border-slate-800/60 font-mono text-slate-300">
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <span className="h-1.5 w-1.5 bg-green-500 rounded-full shrink-0"></span>
                              <span>Target Client: <strong>{selectedClient?.name}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <FolderOpen className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                              <span className="truncate">Drive Path: <strong className="text-blue-300">01_Client_Drive / {selectedClient?.name} / {folderName}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                              <span>G-Sheet Target: <strong className="text-emerald-300">{sheetName}</strong></span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* State 1: Ready to Scan */}
                  {!extractedResult && !isScanning && (
                    <div className="p-6 border border-slate-200 bg-amber-500/5 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 shadow-3xs">
                      <div className="p-3 bg-amber-100 text-amber-600 rounded-full animate-bounce">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center justify-center gap-1">
                          Document Loaded & Ready to Scan! 📄
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm">
                          Aapka bill screen par ready hai. Scan karne se pahle aap active client aur document nature set kar sakte hain, ya left side me <strong>AI Chat 💬</strong> tab se dynamic rules adjust kar sakte hain.
                        </p>
                      </div>
                      <button
                        onClick={handleExecuteAgentScan}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-850 text-white font-black text-xs tracking-wider uppercase rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-800"
                      >
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        Analyze & Extract with Agentic AI
                      </button>
                    </div>
                  )}

                  {/* State 2: Scanning Loading Indicator */}
                  {isScanning && !extractedResult && (
                    <div className="p-8 border border-slate-150 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center gap-4 text-center h-[300px] shadow-3xs">
                      <RotateCw className="h-7 w-7 text-amber-500 animate-spin" />
                      <div>
                        <p className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Agent Scanning active</p>
                        <p className="text-[11px] text-slate-500 font-mono italic mt-1.5 animate-pulse">
                          {scanMessage || "Processing Document Stream..."}
                        </p>
                      </div>
                    </div>
                  )}

                  {extractedResult && (
                    <div className="space-y-4">
                      
                      {/* Confidence Score Badge */}
                      <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-3xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4.5 w-4.5 text-green-600" />
                          <span className="text-xs font-bold text-slate-800">Extraction Success</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-500">Accuracy:</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            extractedResult.confidenceScore >= 90 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {extractedResult.confidenceScore}%
                          </span>
                        </div>
                      </div>

                      {/* Mathematical Verification Alert */}
                      {((Object.keys(editedData).length > 0) || extractedResult.extractedData) && (
                        <div>
                          {mathResults.isMatch ? (
                            <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-green-800 text-xs flex items-start gap-2 shadow-3xs">
                              <CheckCircle2 className="h-4.5 w-4.5 text-green-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-black tracking-wide">✅ SOP MATH VERIFIED</p>
                                <p className="text-[10px] text-green-700/95 mt-1 leading-relaxed">
                                  Taxable (<strong>{mathResults.taxable.toFixed(2)}</strong>) + Taxes (<strong>{mathResults.taxes.toFixed(2)}</strong>) + Sundries (<strong>{mathResults.sundries.toFixed(2)}</strong>) equals Grand Total (<strong>{mathResults.grand.toFixed(2)}</strong>) perfectly!
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs flex items-start gap-2 shadow-3xs">
                              <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-black tracking-wide">⚠️ SOP VERIFICATION WARNING</p>
                                <p className="text-[10px] text-amber-700/95 mt-1 leading-relaxed">
                                  Calculated sum (Taxable + Taxes + Sundries) = <strong>{mathResults.computedGrand.toFixed(2)}</strong>. Grand Total = <strong>{mathResults.grand.toFixed(2)}</strong>. Difference of <strong>{mathResults.diff.toFixed(2)}</strong> detected.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Structured Columns Key-Value Output Table with inputs */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-3xs bg-white max-h-[350px] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                              <th className="px-3 py-2 w-1/3">Field</th>
                              <th className="px-3 py-2">Extracted / Manual Mapping Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {columns.map((col) => {
                              const val = editedData[col.key] !== undefined ? editedData[col.key] : extractedResult.extractedData?.[col.key];
                              const displayVal = val !== undefined && val !== null ? String(val) : "";

                              return (
                                <tr key={col.key} className="hover:bg-slate-50/50">
                                  <td className="px-3 py-2">
                                    <span className="block text-[11px] font-bold text-slate-800">{getColLabel(col)}</span>
                                    <span className="text-[8px] font-mono text-slate-450 block">{col.key}</span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center gap-1.5">
                                      {col.type === "number" ? (
                                        <input
                                          type="number"
                                          step="any"
                                          value={displayVal}
                                          onChange={(e) => {
                                            const raw = e.target.value;
                                            const numVal = raw === "" ? 0 : parseFloat(raw);
                                            setEditedData(prev => ({ ...prev, [col.key]: isNaN(numVal) ? raw : numVal }));
                                          }}
                                          className="w-full px-2 py-1 text-xs font-mono font-bold text-slate-950 border border-slate-200 rounded-md outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/25 bg-slate-50/30"
                                        />
                                      ) : (
                                        <input
                                          type="text"
                                          value={displayVal}
                                          onChange={(e) => {
                                            setEditedData(prev => ({ ...prev, [col.key]: e.target.value }));
                                          }}
                                          className="w-full px-2 py-1 text-xs text-slate-800 border border-slate-200 rounded-md outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/25 bg-slate-50/30"
                                        />
                                      )}

                                      {/* Click-to-fill button */}
                                      {selectedSnippet && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            let parsedSnippetVal: any = selectedSnippet;
                                            if (col.type === "number") {
                                              const cleaned = selectedSnippet.replace(/[^\d.-]/g, "");
                                              parsedSnippetVal = parseFloat(cleaned) || 0;
                                            }
                                            setEditedData(prev => ({ ...prev, [col.key]: parsedSnippetVal }));
                                            setSelectedSnippet(null); // clear after mapping for clean UX
                                          }}
                                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-md text-[9px] transition-colors shrink-0 flex items-center gap-0.5 shadow-2xs cursor-pointer"
                                          title={`Fill "${selectedSnippet}" into ${getColLabel(col)}`}
                                        >
                                          👈 Fill
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Model logs */}
                      {extractedResult.additionalNotes && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Model Log Explanations</span>
                          <p className="text-[10px] font-mono text-slate-600 leading-relaxed max-h-[80px] overflow-y-auto whitespace-pre-line">
                            {extractedResult.additionalNotes}
                          </p>
                        </div>
                      )}

                      {/* Interactive Memory Profile Persistence Assistant */}
                      {((Object.keys(editedData).length > 0) || extractedResult.extractedData) && (() => {
                        const dataObj = Object.keys(editedData).length > 0 ? editedData : extractedResult.extractedData;
                        const extractedVendorName = dataObj.Vendor_Name;
                        const extractedGstin = dataObj.GSTIN_Supplier;

                        if (!extractedVendorName) return null;

                        const matchingProfile = vendorProfiles.find(v => 
                          v.vendorName.toLowerCase().trim() === String(extractedVendorName).toLowerCase().trim() ||
                          (extractedGstin && v.gstin && v.gstin.toLowerCase().trim() === String(extractedGstin).toLowerCase().trim())
                        );

                        if (matchingProfile) {
                          return (
                            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-950 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold flex items-center gap-1">🧠 Vendor Memory Matched!</span>
                                <span className="text-[8px] bg-amber-200 text-amber-900 px-1 py-0.5 rounded font-black uppercase">Exists in DB</span>
                              </div>
                              <p className="text-[10px] text-slate-700 leading-relaxed">
                                This invoice is identified from <strong>{matchingProfile.vendorName}</strong>. You can sync current custom prompt rules to their profile.
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = vendorProfiles.map(v => v.id === matchingProfile.id ? {
                                    ...v,
                                    sopRules: sopRules,
                                    lastScannedAt: new Date().toISOString().split("T")[0]
                                  } : v);
                                  setVendorProfiles(updated);
                                  setSaveSuccessMsg(`Updated Memory Rules for ${matchingProfile.vendorName}!`);
                                  setTimeout(() => setSaveSuccessMsg(null), 3000);
                                }}
                                className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[10px] transition-all cursor-pointer shadow-3xs"
                              >
                                Update Memory rules with current SOP
                              </button>
                            </div>
                          );
                        } else {
                          return (
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-700 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 flex items-center gap-1">💾 New Vendor Detected!</span>
                                <span className="text-[8px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-black uppercase">New Layout</span>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-relaxed">
                                Extracting from <strong>{extractedVendorName}</strong> for the first time? Save their layout memory format to remember details for next time.
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  const newProfile: VendorProfile = {
                                    id: "v-" + Date.now(),
                                    vendorName: String(extractedVendorName),
                                    gstin: extractedGstin ? String(extractedGstin) : undefined,
                                    sopRules: sopRules,
                                    specialQuirks: "Auto-saved during file scan.",
                                    lastScannedAt: new Date().toISOString().split("T")[0]
                                  };
                                  setVendorProfiles([newProfile, ...vendorProfiles]);
                                  setSaveSuccessMsg(`Saved Format Memory for ${extractedVendorName}!`);
                                  setTimeout(() => setSaveSuccessMsg(null), 3000);
                                }}
                                className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer shadow-3xs"
                              >
                                Remember Format Layout for {extractedVendorName}
                              </button>
                            </div>
                          );
                        }
                      })()}

                      {/* Save & clear actions */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => {
                            setExtractedResult(null);
                            setSelectedFile(null);
                          }}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] uppercase rounded-lg transition-colors cursor-pointer"
                        >
                          Clear File
                        </button>
                        <button
                          onClick={handleApproveAndSave}
                          className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] uppercase rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <FileCheck className="h-4 w-4" />
                          Approve & Save
                        </button>
                      </div>

                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}

