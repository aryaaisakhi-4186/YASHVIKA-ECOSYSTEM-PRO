import React, { useState, useRef } from "react";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Check, 
  X, 
  Upload, 
  Sparkles, 
  Database, 
  Users, 
  Phone, 
  MapPin, 
  Percent, 
  Globe, 
  Layers, 
  Contact, 
  CheckSquare,
  ShieldAlert,
  Sliders,
  RefreshCw,
  Wallet,
  BookOpen
} from "lucide-react";
import { MasterItem, ClientMaster, TeamMaster, ItemMapping, LedgerMaster } from "../types";
import { generateStableSecret } from "../App";

interface MasterItemRegistryProps {
  masterItems: MasterItem[];
  onAddMasterItem: (item: Omit<MasterItem, "id">) => void;
  onUpdateMasterItem: (updated: MasterItem) => void;
  onDeleteMasterItem: (id: string) => void;

  // New Client Master Props passed down from App state
  clientMasters: ClientMaster[];
  onAddClientMaster: (client: Omit<ClientMaster, "id">) => void;
  onUpdateClientMaster: (updated: ClientMaster) => void;
  onDeleteClientMaster: (id: string) => void;

  // New Team Master Props
  teamMasters: TeamMaster[];
  onAddTeamMaster: (team: Omit<TeamMaster, "id">) => void;
  onUpdateTeamMaster: (updated: TeamMaster) => void;
  onDeleteTeamMaster: (id: string) => void;

  // Mapping Props
  itemMappings: ItemMapping[];
  onAddMapping: (localName: string, masterName: string) => void;
  onRemoveMapping: (id: string) => void;

  // Ledger Master Props
  ledgerMasters?: LedgerMaster[];
  onAddLedgerMaster?: (ledger: Omit<LedgerMaster, "id" | "createdAt">) => void;
  onUpdateLedgerMaster?: (updated: LedgerMaster) => void;
  onDeleteLedgerMaster?: (id: string) => void;
}

const COMMON_GROUPS = [
  "Electronics/Hardware",
  "Office Furniture",
  "Stationery/Utilities",
  "Textiles/Apparel",
  "Construction/Cement",
  "Construction/Steel",
  "Consultancy Services",
  "Logistics/Freight",
  "IT/Support Services",
  "FMCG/Groceries",
  "Chemicals/Supplies"
];

const COMMON_UNITS = [
  "KG",
  "Bag",
  "Quintal",
  "Metric Ton",
  "PCS",
  "NOS",
  "BOX",
  "Ltr",
  "Mtr",
];

const GST_RATES = ["0%", "5%", "12%", "18%", "28%"];

export default function MasterItemRegistry({
  masterItems,
  onAddMasterItem,
  onUpdateMasterItem,
  onDeleteMasterItem,
  clientMasters = [],
  onAddClientMaster,
  onUpdateClientMaster,
  onDeleteClientMaster,
  teamMasters = [],
  onAddTeamMaster,
  onUpdateTeamMaster,
  onDeleteTeamMaster,
  itemMappings = [],
  onAddMapping,
  onRemoveMapping,
  ledgerMasters = [],
  onAddLedgerMaster,
  onUpdateLedgerMaster,
  onDeleteLedgerMaster,
}: MasterItemRegistryProps) {
  // Master Active Sub-Tab Configuration
  const [activeSubTab, setActiveSubTab] = useState<"items" | "clients" | "team" | "mappings" | "ledger">("clients");

  // ==========================================
  // STATE DEFINITIONS FOR: ITEM/PRODUCT MASTER
  // ==========================================
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedClient, setSelectedClient] = useState("all");
  const [itemCurrentPage, setItemCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Manual Add Item Form State
  const [itemName, setItemName] = useState("");
  const [printName, setPrintName] = useState("");
  const [group, setGroup] = useState("");
  const [unit, setUnit] = useState("");
  const [gstRate, setGstRate] = useState("18%");
  const [hsn, setHsn] = useState("");
  const [clientMappedName, setClientMappedName] = useState("");

  const [customGroupModel, setCustomGroupModel] = useState(false);
  const [customUnitModel, setCustomUnitModel] = useState(false);
  const [customGstModel, setCustomGstModel] = useState(false);

  // Edit Item State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editPrintName, setEditPrintName] = useState("");
  const [editGroup, setEditGroup] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editGstRate, setEditGstRate] = useState("");
  const [editHsn, setEditHsn] = useState("");
  const [editClientName, setEditClientName] = useState("");

  // Confirmation warning states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // AI Scanner components for product parsing from sheets/receipt layouts
  const [aiLoading, setAiLoading] = useState(false);
  const [scannedRegistryItems, setScannedRegistryItems] = useState<Omit<MasterItem, "id">[]>([]);
  const [selectedScannedIndices, setSelectedScannedIndices] = useState<number[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // STATE DEFINITIONS FOR: CLIENT/VENDOR MASTER
  // ==========================================
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [clientTypeFilter, setClientTypeFilter] = useState("all");
  const [clientCurrentPage, setClientCurrentPage] = useState(1);
  const clientsPerPage = 8;

  // Manual Add Client Form State
  const [clientBusinessCode, setClientBusinessCode] = useState("");
  const [clientNameInput, setClientNameInput] = useState("");
  const [clientContactPerson, setClientContactPerson] = useState("");
  const [clientContactPersonDob, setClientContactPersonDob] = useState("");
  const [clientPan, setClientPan] = useState("");
  const [clientGstin, setClientGstin] = useState("");
  const [clientTan, setClientTan] = useState("");
  const [clientVat, setClientVat] = useState("");
  const [clientAadhar, setClientAadhar] = useState("");
  const [clientDobFirm, setClientDobFirm] = useState("");
  const [clientMobile, setClientMobile] = useState("");
  const [clientWaGroupIcon, setClientWaGroupIcon] = useState("");
  const [clientEmployeeName, setClientEmployeeName] = useState("");
  const [clientEmployeeContact, setClientEmployeeContact] = useState("");
  const [clientEmployeePassword, setClientEmployeePassword] = useState("");
  const [clientAssignedTo, setClientAssignedTo] = useState("");
  const [clientFirmStatus, setClientFirmStatus] = useState("Active");
  const [clientLoginPassword, setClientLoginPassword] = useState("");
  const [clientMailId, setClientMailId] = useState("");
  const [clientDriveFolderId, setClientDriveFolderId] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientType, setClientType] = useState<"Vendor" | "Buyer" | "Arhatiya" | "Other">("Vendor");

  // Edit Client State
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editClientBusinessCode, setEditClientBusinessCode] = useState("");
  const [editClientNameInput, setEditClientNameInput] = useState("");
  const [editClientContactPerson, setEditClientContactPerson] = useState("");
  const [editClientContactPersonDob, setEditClientContactPersonDob] = useState("");
  const [editClientPan, setEditClientPan] = useState("");
  const [editClientGstin, setEditClientGstin] = useState("");
  const [editClientTan, setEditClientTan] = useState("");
  const [editClientVat, setEditClientVat] = useState("");
  const [editClientAadhar, setEditClientAadhar] = useState("");
  const [editClientDobFirm, setEditClientDobFirm] = useState("");
  const [editClientMobile, setEditClientMobile] = useState("");
  const [editClientWaGroupIcon, setEditClientWaGroupIcon] = useState("");
  const [editClientEmployeeName, setEditClientEmployeeName] = useState("");
  const [editClientEmployeeContact, setEditClientEmployeeContact] = useState("");
  const [editClientEmployeePassword, setEditClientEmployeePassword] = useState("");
  const [editClientAssignedTo, setEditClientAssignedTo] = useState("");
  const [editClientFirmStatus, setEditClientFirmStatus] = useState("Active");
  const [editClientLoginPassword, setEditClientLoginPassword] = useState("");
  const [editClientMailId, setEditClientMailId] = useState("");
  const [editClientDriveFolderId, setEditClientDriveFolderId] = useState("");
  const [editClientAddress, setEditClientAddress] = useState("");
  const [editClientType, setEditClientType] = useState<"Vendor" | "Buyer" | "Arhatiya" | "Other">("Vendor");

  const [deleteClientConfirmId, setDeleteClientConfirmId] = useState<string | null>(null);

  // States to toggle collapsible form sections
  const [isSec1Open, setIsSec1Open] = useState(true);
  const [isSec2Open, setIsSec2Open] = useState(false);
  const [isSec3Open, setIsSec3Open] = useState(false);
  const [isSec4Open, setIsSec4Open] = useState(false);
  const [isSec5Open, setIsSec5Open] = useState(false);

  // ==========================================
  // STATE DEFINITIONS FOR: TEAM MEMBER MASTER
  // ==========================================
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [teamStatusFilter, setTeamStatusFilter] = useState("all");
  const [teamCurrentPage, setTeamCurrentPage] = useState(1);
  const teamPerPage = 8;

  // Manual Add Team Form State
  const [teamNameInput, setTeamNameInput] = useState("");
  const [teamMobile, setTeamMobile] = useState("");
  const [teamRole, setTeamRole] = useState("Accountant");
  const [teamStatus, setTeamStatus] = useState<"Active" | "Inactive">("Active");
  const [teamTotpSecret, setTeamTotpSecret] = useState("");

  // Edit Team State
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editTeamNameInput, setEditTeamNameInput] = useState("");
  const [editTeamMobile, setEditTeamMobile] = useState("");
  const [editTeamRole, setEditTeamRole] = useState("");
  const [editTeamStatus, setEditTeamStatus] = useState<"Active" | "Inactive">("Active");
  const [editTeamTotpSecret, setEditTeamTotpSecret] = useState("");

  const [deleteTeamConfirmId, setDeleteTeamConfirmId] = useState<string | null>(null);

  // Auto-generate stable TOTP key as name or mobile updates
  const [prevGeneratedKey, setPrevGeneratedKey] = useState("");
  const [prevEditGeneratedKey, setPrevEditGeneratedKey] = useState("");

  React.useEffect(() => {
    const trimmedName = teamNameInput.trim();
    const trimmedMobile = teamMobile.trim().replace(/[^0-9]/g, "");
    if (trimmedName && trimmedMobile.length >= 4) {
      const generated = generateStableSecret(trimmedName, trimmedMobile);
      if (!teamTotpSecret || teamTotpSecret === prevGeneratedKey) {
        setTeamTotpSecret(generated);
        setPrevGeneratedKey(generated);
      }
    } else if (!trimmedName && !trimmedMobile) {
      if (teamTotpSecret === prevGeneratedKey) {
        setTeamTotpSecret("");
        setPrevGeneratedKey("");
      }
    }
  }, [teamNameInput, teamMobile, teamTotpSecret, prevGeneratedKey]);

  React.useEffect(() => {
    if (editingTeamId) {
      const trimmedName = editTeamNameInput.trim();
      const trimmedMobile = editTeamMobile.trim().replace(/[^0-9]/g, "");
      if (trimmedName && trimmedMobile.length >= 4) {
        const generated = generateStableSecret(trimmedName, trimmedMobile);
        if (!editTeamTotpSecret || editTeamTotpSecret === prevEditGeneratedKey) {
          setEditTeamTotpSecret(generated);
          setPrevEditGeneratedKey(generated);
        }
      }
    }
  }, [editTeamNameInput, editTeamMobile, editingTeamId, editTeamTotpSecret, prevEditGeneratedKey]);

  // ==========================================
  // STATE DEFINITIONS FOR: LEDGER MASTER
  // ==========================================
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState("");
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState("all");
  const [ledgerCurrentPage, setLedgerCurrentPage] = useState(1);
  const ledgerPerPage = 8;

  // Form states for Add Ledger
  const [ledgerAccountName, setLedgerAccountName] = useState("");
  const [ledgerAccountType, setLedgerAccountType] = useState<"Bank Account" | "Supplier Account" | "Recipient Account">("Bank Account");
  const [ledgerAccountNumber, setLedgerAccountNumber] = useState("");
  const [ledgerBankName, setLedgerBankName] = useState("");
  const [ledgerIfscCode, setLedgerIfscCode] = useState("");
  const [ledgerGstin, setLedgerGstin] = useState("");
  const [ledgerAddress, setLedgerAddress] = useState("");
  const [ledgerMobile, setLedgerMobile] = useState("");

  // Edit states for Ledger
  const [editingLedgerId, setEditingLedgerId] = useState<string | null>(null);
  const [editLedgerAccountName, setEditLedgerAccountName] = useState("");
  const [editLedgerAccountType, setEditLedgerAccountType] = useState<"Bank Account" | "Supplier Account" | "Recipient Account">("Bank Account");
  const [editLedgerAccountNumber, setEditLedgerAccountNumber] = useState("");
  const [editLedgerBankName, setEditLedgerBankName] = useState("");
  const [editLedgerIfscCode, setEditLedgerIfscCode] = useState("");
  const [editLedgerGstin, setEditLedgerGstin] = useState("");
  const [editLedgerAddress, setEditLedgerAddress] = useState("");
  const [editLedgerMobile, setEditLedgerMobile] = useState("");

  const [deleteLedgerConfirmId, setDeleteLedgerConfirmId] = useState<string | null>(null);

  // ==========================================
  // STATE DEFINITIONS FOR: ITEM MAPPING RULE INTERACTION
  // ==========================================
  const [mappingSearchQuery, setMappingSearchQuery] = useState("");
  const [mappingCurrentPage, setMappingCurrentPage] = useState(1);
  const mappingsPerPage = 10;

  const [mappingLocalName, setMappingLocalName] = useState("");
  const [mappingMasterName, setMappingMasterName] = useState("");

  const handleAddTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamNameInput.trim() || !teamMobile.trim()) {
      alert("Please fill in Team Name and Mobile Number.");
      return;
    }
    onAddTeamMaster({
      name: teamNameInput.trim(),
      mobile: teamMobile.trim().replace(/[^0-9]/g, ""),
      role: teamRole.trim(),
      status: teamStatus,
      totpSecret: teamTotpSecret.trim().toUpperCase() || undefined,
    });
    setTeamNameInput("");
    setTeamMobile("");
    setTeamRole("Accountant");
    setTeamStatus("Active");
    setTeamTotpSecret("");
    alert("New team member successfully registered!");
  };

  const handleStartEditTeam = (team: TeamMaster) => {
    setEditingTeamId(team.id);
    setEditTeamNameInput(team.name);
    setEditTeamMobile(team.mobile);
    setEditTeamRole(team.role);
    setEditTeamStatus(team.status);
    const initialSecret = team.totpSecret || generateStableSecret(team.name, team.mobile);
    setEditTeamTotpSecret(initialSecret);
    setPrevEditGeneratedKey(initialSecret);
  };

  const handleSaveEditTeam = (id: string) => {
    if (!editTeamNameInput.trim() || !editTeamMobile.trim()) {
      alert("Missing required fields for update.");
      return;
    }
    onUpdateTeamMaster({
      id,
      name: editTeamNameInput.trim(),
      mobile: editTeamMobile.trim().replace(/[^0-9]/g, ""),
      role: editTeamRole.trim(),
      status: editTeamStatus,
      totpSecret: editTeamTotpSecret.trim().toUpperCase() || undefined
    });
    setEditingTeamId(null);
  };

  // ==========================================
  // LEDGER MASTER OPERATIONAL HANDLERS
  // ==========================================
  const handleAddLedgerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ledgerAccountName.trim() || !ledgerAccountType) {
      alert("Please fill in the Account Name and select the Account Type.");
      return;
    }

    if (onAddLedgerMaster) {
      onAddLedgerMaster({
        accountName: ledgerAccountName.trim(),
        accountType: ledgerAccountType,
        accountNumber: ledgerAccountNumber.trim() || undefined,
        bankName: ledgerBankName.trim() || undefined,
        ifscCode: ledgerIfscCode.trim() || undefined,
        gstin: ledgerGstin.trim() || undefined,
        address: ledgerAddress.trim() || undefined,
        mobile: ledgerMobile.trim() || undefined,
      });
    }

    // Reset Form
    setLedgerAccountName("");
    setLedgerAccountType("Bank Account");
    setLedgerAccountNumber("");
    setLedgerBankName("");
    setLedgerIfscCode("");
    setLedgerGstin("");
    setLedgerAddress("");
    setLedgerMobile("");
    alert("New Ledger Account successfully created!");
  };

  const handleStartEditLedger = (ledger: LedgerMaster) => {
    setEditingLedgerId(ledger.id);
    setEditLedgerAccountName(ledger.accountName);
    setEditLedgerAccountType(ledger.accountType);
    setEditLedgerAccountNumber(ledger.accountNumber || "");
    setEditLedgerBankName(ledger.bankName || "");
    setEditLedgerIfscCode(ledger.ifscCode || "");
    setEditLedgerGstin(ledger.gstin || "");
    setEditLedgerAddress(ledger.address || "");
    setEditLedgerMobile(ledger.mobile || "");
  };

  const handleSaveEditLedger = (id: string, origCreatedAt: string) => {
    if (!editLedgerAccountName.trim() || !editLedgerAccountType) {
      alert("Please fill in the Account Name.");
      return;
    }

    if (onUpdateLedgerMaster) {
      onUpdateLedgerMaster({
        id,
        accountName: editLedgerAccountName.trim(),
        accountType: editLedgerAccountType,
        accountNumber: editLedgerAccountNumber.trim() || undefined,
        bankName: editLedgerBankName.trim() || undefined,
        ifscCode: editLedgerIfscCode.trim() || undefined,
        gstin: editLedgerGstin.trim() || undefined,
        address: editLedgerAddress.trim() || undefined,
        mobile: editLedgerMobile.trim() || undefined,
        createdAt: origCreatedAt
      });
    }
    setEditingLedgerId(null);
    alert("Ledger Account successfully updated!");
  };

  const handleDeleteLedger = (id: string) => {
    if (onDeleteLedgerMaster) {
      onDeleteLedgerMaster(id);
    }
    setDeleteLedgerConfirmId(null);
  };

  const handleAddMappingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mappingLocalName.trim() || !mappingMasterName.trim()) {
      alert("Please enter both Local Synonym and Master Item Name.");
      return;
    }
    onAddMapping(mappingLocalName.trim(), mappingMasterName.trim());
    setMappingLocalName("");
    setMappingMasterName("");
    alert("Synonym mapping rule successfully added!");
  };

  // ==========================================
  // ITEM SUBMIT / EDIT OPERATIONAL HANDLERS
  // ==========================================
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !printName.trim() || !group || !unit || !hsn.trim()) {
      alert("Please fill in all mandatory standard fields.");
      return;
    }

    const isDuplicate = masterItems.some(
      (it) => it.itemName.toLowerCase().trim() === itemName.toLowerCase().trim()
    );
    if (isDuplicate) {
      alert(`An item with name "${itemName}" is already stored in the Busy ERP database.`);
      return;
    }

    onAddMasterItem({
      itemName: itemName.trim(),
      printName: printName.trim(),
      group: group.trim(),
      unit: unit.trim(),
      gstRate: gstRate.trim(),
      hsn: hsn.trim(),
      clientName: clientMappedName.trim() || "General",
    });

    setItemName("");
    setPrintName("");
    setGroup("");
    setUnit("");
    setGstRate("18%");
    setHsn("");
    setClientMappedName("");
    alert("New product item successfully registered in Master Registry!");
  };

  const handleStartEdit = (item: MasterItem) => {
    setEditingId(item.id);
    setEditItemName(item.itemName);
    setEditPrintName(item.printName);
    setEditGroup(item.group);
    setEditUnit(item.unit);
    setEditGstRate(item.gstRate);
    setEditHsn(item.hsn);
    setEditClientName(item.clientName || "General");
  };

  const handleSaveEdit = () => {
    if (!editItemName.trim() || !editPrintName.trim() || !editGroup || !editUnit || !editHsn.trim()) {
      alert("Missing required fields for update.");
      return;
    }

    const isDuplicate = masterItems.some(
      (it) =>
        it.id !== editingId &&
        it.itemName.toLowerCase().trim() === editItemName.toLowerCase().trim()
    );
    if (isDuplicate) {
      alert("Another item with this name is already saved in the registry.");
      return;
    }

    if (editingId) {
      onUpdateMasterItem({
        id: editingId,
        itemName: editItemName.trim(),
        printName: editPrintName.trim(),
        group: editGroup.trim(),
        unit: editUnit.trim(),
        gstRate: editGstRate.trim(),
        hsn: editHsn.trim(),
        clientName: editClientName.trim() || "General",
      });
      setEditingId(null);
    }
  };

  // AI Scanner upload & parser trigger (keeps major capabilities standard)
  const handleAiScannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAiLoading(true);
    setAiError(null);
    setScannedRegistryItems([]);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(",")[1];
        try {
          const res = await fetch("/api/gemini/scan-master-items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              base64: base64String,
              mimeType: file.type || "image/jpeg",
            }),
          });

          if (!res.ok) {
            throw new Error(`AI Scanner returned status: ${res.status}`);
          }

          const responseData = await res.json();
          if (responseData && Array.isArray(responseData.items)) {
            setScannedRegistryItems(responseData.items);
            setSelectedScannedIndices(responseData.items.map((_: any, idx: number) => idx));
          } else {
            throw new Error("No products found in the document context. Check alignment format.");
          }
        } catch (scanErr: any) {
          console.error(scanErr);
          setAiError(scanErr?.message || "An error occurred while deciphering standard list.");
        } finally {
          setAiLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setAiError("Failed to convert image structure.");
      setAiLoading(false);
    }
  };

  const handleAddSelectedScannedItems = () => {
    if (selectedScannedIndices.length === 0) return;

    let addedCount = 0;
    selectedScannedIndices.forEach((idx) => {
      const item = scannedRegistryItems[idx];
      const isDuplicate = masterItems.some(
        (it) => it.itemName.toLowerCase().trim() === item.itemName.toLowerCase().trim()
      );
      if (!isDuplicate) {
        onAddMasterItem(item);
        addedCount++;
      }
    });

    alert(`Successfully registered ${addedCount} standard item(s) from AI Scan!`);
    setScannedRegistryItems([]);
    setSelectedScannedIndices([]);
  };

  // ==========================================
  // CLIENT SUBMIT / EDIT OPERATIONAL HANDLERS
  // ==========================================
  const handleAddClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = clientNameInput.trim();
    const cleanMobile = clientMobile.trim();
    const cleanGstin = clientGstin.trim().toUpperCase();

    if (!cleanName) {
      alert("Please write the Client or Firm Name.");
      return;
    }

    const isDuplicate = clientMasters.some(
      (c) => c.name.toLowerCase().trim() === cleanName.toLowerCase()
    );
    if (isDuplicate) {
      alert(`Client or Firm with name "${cleanName}" is already saved in standard master.`);
      return;
    }

    onAddClientMaster({
      businessCode: clientBusinessCode.trim(),
      name: cleanName,
      contactPerson: clientContactPerson.trim(),
      contactPersonDob: clientContactPersonDob.trim(),
      pan: clientPan.trim().toUpperCase(),
      gstin: cleanGstin,
      tan: clientTan.trim().toUpperCase(),
      vat: clientVat.trim().toUpperCase(),
      aadhar: clientAadhar.trim(),
      dobFirm: clientDobFirm.trim(),
      mobile: cleanMobile,
      waGroupIcon: clientWaGroupIcon.trim(),
      employeeName: clientEmployeeName.trim(),
      employeeContact: clientEmployeeContact.trim(),
      employeePassword: clientEmployeePassword.trim(),
      assignedTo: clientAssignedTo.trim(),
      firmStatus: clientFirmStatus,
      loginPassword: clientLoginPassword.trim(),
      mailId: clientMailId.trim(),
      driveFolderId: clientDriveFolderId.trim(),
      address: clientAddress.trim() || undefined,
      type: clientType,
    });

    // Reset Form fields
    setClientBusinessCode("");
    setClientNameInput("");
    setClientContactPerson("");
    setClientContactPersonDob("");
    setClientPan("");
    setClientGstin("");
    setClientTan("");
    setClientVat("");
    setClientAadhar("");
    setClientDobFirm("");
    setClientMobile("");
    setClientWaGroupIcon("");
    setClientEmployeeName("");
    setClientEmployeeContact("");
    setClientEmployeePassword("");
    setClientAssignedTo("");
    setClientFirmStatus("Active");
    setClientLoginPassword("");
    setClientMailId("");
    setClientDriveFolderId("");
    setClientAddress("");
    setClientType("Vendor");
    alert("New Client Master account securely setup!");
  };

  const handleStartEditClient = (client: ClientMaster) => {
    setEditingClientId(client.id);
    setEditClientBusinessCode(client.businessCode || "");
    setEditClientNameInput(client.name);
    setEditClientContactPerson(client.contactPerson || "");
    setEditClientContactPersonDob(client.contactPersonDob || "");
    setEditClientPan(client.pan || "");
    setEditClientGstin(client.gstin);
    setEditClientTan(client.tan || "");
    setEditClientVat(client.vat || "");
    setEditClientAadhar(client.aadhar || "");
    setEditClientDobFirm(client.dobFirm || "");
    setEditClientMobile(client.mobile);
    setEditClientWaGroupIcon(client.waGroupIcon || "");
    setEditClientEmployeeName(client.employeeName || "");
    setEditClientEmployeeContact(client.employeeContact || "");
    setEditClientEmployeePassword(client.employeePassword || "");
    setEditClientAssignedTo(client.assignedTo || "");
    setEditClientFirmStatus(client.firmStatus || "Active");
    setEditClientLoginPassword(client.loginPassword || "");
    setEditClientMailId(client.mailId || "");
    setEditClientDriveFolderId(client.driveFolderId || "");
    setEditClientAddress(client.address || "");
    setEditClientType(client.type || "Vendor");
  };

  const handleSaveClientEdit = () => {
    if (!editClientNameInput.trim()) {
      alert("Firm/Client Name is required.");
      return;
    }

    const isDuplicate = clientMasters.some(
      (c) =>
        c.id !== editingClientId &&
        c.name.toLowerCase().trim() === editClientNameInput.toLowerCase().trim()
    );
    if (isDuplicate) {
      alert("Another client account with this firm name is already active.");
      return;
    }

    if (editingClientId) {
      onUpdateClientMaster({
        id: editingClientId,
        businessCode: editClientBusinessCode.trim(),
        name: editClientNameInput.trim(),
        contactPerson: editClientContactPerson.trim(),
        contactPersonDob: editClientContactPersonDob.trim(),
        pan: editClientPan.trim().toUpperCase(),
        gstin: editClientGstin.trim().toUpperCase(),
        tan: editClientTan.trim().toUpperCase(),
        vat: editClientVat.trim().toUpperCase(),
        aadhar: editClientAadhar.trim(),
        dobFirm: editClientDobFirm.trim(),
        mobile: editClientMobile.trim(),
        waGroupIcon: editClientWaGroupIcon.trim(),
        employeeName: editClientEmployeeName.trim(),
        employeeContact: editClientEmployeeContact.trim(),
        employeePassword: editClientEmployeePassword.trim(),
        assignedTo: editClientAssignedTo.trim(),
        firmStatus: editClientFirmStatus,
        loginPassword: editClientLoginPassword.trim(),
        mailId: editClientMailId.trim(),
        driveFolderId: editClientDriveFolderId.trim(),
        address: editClientAddress.trim(),
        type: editClientType,
      });
      setEditingClientId(null);
      alert("Client Details successfully updated!");
    }
  };

  // ==========================================
  // FILTRATIVE AND RENDERING CALCULATIONS
  // ==========================================
  const registeredGroups = Array.from(
    new Set(masterItems.map((item) => item.group))
  ).filter(Boolean);

  const registeredClients = Array.from(
    new Set(masterItems.map((item) => item.clientName || "General"))
  ).filter(Boolean);

  const filteredItems = masterItems.filter((item) => {
    const matchesSearch =
      item.itemName.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
      item.printName.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
      item.hsn.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
      item.group.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
      (item.clientName || "General").toLowerCase().includes(itemSearchQuery.toLowerCase());

    const matchesGroup = selectedGroup === "all" || item.group === selectedGroup;
    const matchesClient = selectedClient === "all" || (item.clientName || "General") === selectedClient;

    return matchesSearch && matchesGroup && matchesClient;
  });

  const totalItemPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const startItemIndex = (itemCurrentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startItemIndex, startItemIndex + itemsPerPage);

  const goToPrevItemPage = () => {
    if (itemCurrentPage > 1) setItemCurrentPage((p) => p - 1);
  };
  const goToNextItemPage = () => {
    if (itemCurrentPage < totalItemPages) setItemCurrentPage((p) => p + 1);
  };

  // CLIENTS FILTER & PAGINATION CALCULATIONS
  const filteredClients = clientMasters.filter((c) => {
    const q = clientSearchQuery.toLowerCase().trim();
    const matchesSearch = !q ? true : (
      c.name.toLowerCase().includes(q) ||
      c.mobile.toLowerCase().includes(q) ||
      c.gstin.toLowerCase().includes(q) ||
      (c.businessCode && c.businessCode.toLowerCase().includes(q)) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
      (c.pan && c.pan.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q)) ||
      (c.mailId && c.mailId.toLowerCase().includes(q))
    );

    const matchesType = clientTypeFilter === "all" || c.type === clientTypeFilter;

    return matchesSearch && matchesType;
  });

  const totalClientPages = Math.ceil(filteredClients.length / clientsPerPage) || 1;
  const startClientIndex = (clientCurrentPage - 1) * clientsPerPage;
  const paginatedClients = filteredClients.slice(startClientIndex, startClientIndex + clientsPerPage);

  const goToPrevClientPage = () => {
    if (clientCurrentPage > 1) setClientCurrentPage((p) => p - 1);
  };
  const goToNextClientPage = () => {
    if (clientCurrentPage < totalClientPages) setClientCurrentPage((p) => p + 1);
  };

  // TEAM FILTER & PAGINATION CALCULATIONS
  const filteredTeam = teamMasters.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
      t.mobile.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
      t.role.toLowerCase().includes(teamSearchQuery.toLowerCase());

    const matchesStatus = teamStatusFilter === "all" || t.status === teamStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalTeamPages = Math.ceil(filteredTeam.length / teamPerPage) || 1;
  const startTeamIndex = (teamCurrentPage - 1) * teamPerPage;
  const paginatedTeam = filteredTeam.slice(startTeamIndex, startTeamIndex + teamPerPage);

  const goToPrevTeamPage = () => {
    if (teamCurrentPage > 1) setTeamCurrentPage((p) => p - 1);
  };
  const goToNextTeamPage = () => {
    if (teamCurrentPage < totalTeamPages) setTeamCurrentPage((p) => p + 1);
  };

  // MAPPINGS FILTER & PAGINATION CALCULATIONS
  const filteredMappings = itemMappings.filter((m) => {
    return (
      m.localName.toLowerCase().includes(mappingSearchQuery.toLowerCase()) ||
      m.masterName.toLowerCase().includes(mappingSearchQuery.toLowerCase())
    );
  });

  const totalMappingPages = Math.ceil(filteredMappings.length / mappingsPerPage) || 1;
  const startMappingIndex = (mappingCurrentPage - 1) * mappingsPerPage;
  const paginatedMappings = filteredMappings.slice(startMappingIndex, startMappingIndex + mappingsPerPage);

  const goToPrevMappingPage = () => {
    if (mappingCurrentPage > 1) setMappingCurrentPage((p) => p - 1);
  };
  const goToNextMappingPage = () => {
    if (mappingCurrentPage < totalMappingPages) setMappingCurrentPage((p) => p + 1);
  };

  // LEDGER FILTER & PAGINATION CALCULATIONS
  const filteredLedgers = ledgerMasters.filter(item => {
    const q = ledgerSearchQuery.toLowerCase().trim();
    const typeMatch = ledgerTypeFilter === "all" ? true : item.accountType === ledgerTypeFilter;
    const searchMatch = !q ? true : (
      item.accountName.toLowerCase().includes(q) ||
      (item.accountNumber && item.accountNumber.toLowerCase().includes(q)) ||
      (item.bankName && item.bankName.toLowerCase().includes(q)) ||
      (item.ifscCode && item.ifscCode.toLowerCase().includes(q)) ||
      (item.gstin && item.gstin.toLowerCase().includes(q)) ||
      (item.address && item.address.toLowerCase().includes(q)) ||
      (item.mobile && item.mobile.toLowerCase().includes(q))
    );
    return typeMatch && searchMatch;
  });

  const totalLedgerPages = Math.ceil(filteredLedgers.length / ledgerPerPage) || 1;
  const startLedgerIndex = (ledgerCurrentPage - 1) * ledgerPerPage;
  const paginatedLedgers = filteredLedgers.slice(startLedgerIndex, startLedgerIndex + ledgerPerPage);

  const goToPrevLedgerPage = () => {
    if (ledgerCurrentPage > 1) setLedgerCurrentPage(p => p - 1);
  };
  const goToNextLedgerPage = () => {
    if (ledgerCurrentPage < totalLedgerPages) setLedgerCurrentPage(p => p + 1);
  };

  return (
    <div className="space-y-4">
      {/* HEADER ROW: Title block and Sub-tabs integrated side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* Left column: Shrunk Title Block */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-100/60 p-4 rounded-2xl shadow-2xs border border-amber-200 text-slate-800 flex flex-col justify-center">
          <span className="text-[9px] bg-amber-200/50 text-amber-800 font-mono font-bold px-2 py-0.5 rounded border border-amber-300 uppercase tracking-wider block w-fit mb-1 shadow-2xs">
            Centralized Business Standardizer
          </span>
          <h2 className="text-base font-extrabold tracking-tight text-slate-900">Master Database</h2>
          <p className="text-[11px] text-slate-655 mt-0.5 leading-normal font-semibold">
            Complete database console to manage account settings, team masters, product standard indexes, and synapse synonyms.
          </p>
        </div>

        {/* Right column: Integrated Sub-tabs (Client Master, Ledger Master, Item Master, Team Master, Synonym Mapping) */}
        <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-2xs flex flex-col justify-center">
          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
            Database Sections (Click to Switch):
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <button
              id="subtab-clients"
              onClick={() => {
                setActiveSubTab("clients");
                setDeleteClientConfirmId(null);
                setEditingClientId(null);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                activeSubTab === "clients"
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Users className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Client Master</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold shrink-0 ml-1.5 ${activeSubTab === "clients" ? "bg-white/20 text-white" : "bg-slate-250 text-slate-600"}`}>
                {clientMasters.length}
              </span>
            </button>

            <button
              id="subtab-ledger"
              onClick={() => {
                setActiveSubTab("ledger");
                setDeleteLedgerConfirmId(null);
                setEditingLedgerId(null);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                activeSubTab === "ledger"
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Wallet className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span className="truncate">Ledger Master</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold shrink-0 ml-1.5 ${activeSubTab === "ledger" ? "bg-white/20 text-white" : "bg-slate-250 text-slate-600"}`}>
                {ledgerMasters.length}
              </span>
            </button>

            <button
              id="subtab-items"
              onClick={() => {
                setActiveSubTab("items");
                setDeleteConfirmId(null);
                setEditingId(null);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                activeSubTab === "items"
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Layers className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Item Master</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold shrink-0 ml-1.5 ${activeSubTab === "items" ? "bg-white/20 text-white" : "bg-slate-250 text-slate-600"}`}>
                {masterItems.length}
              </span>
            </button>

            <button
              id="subtab-team"
              onClick={() => {
                setActiveSubTab("team");
                setDeleteTeamConfirmId(null);
                setEditingTeamId(null);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                activeSubTab === "team"
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Contact className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Team Master</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold shrink-0 ml-1.5 ${activeSubTab === "team" ? "bg-white/20 text-white" : "bg-slate-250 text-slate-600"}`}>
                {teamMasters.length}
              </span>
            </button>

            <button
              id="subtab-mappings"
              onClick={() => {
                setActiveSubTab("mappings");
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                activeSubTab === "mappings"
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Sliders className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Synonym Mapping</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold shrink-0 ml-1.5 ${activeSubTab === "mappings" ? "bg-white/20 text-white" : "bg-slate-250 text-slate-600"}`}>
                {itemMappings.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ==========================================
          SUBTAB 1 VIEW: ITEM MASTER SETUP (ENABLED)
          ========================================== */}
      {activeSubTab === "items" && (
        <div className="space-y-6 animate-fade-in">
          {/* Form + Scanner on left */}
          <div className="space-y-6 animate-fade-in">
            {/* ADD PRODUCT */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Plus className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm uppercase tracking-wide">
                  Add New Product
                </h3>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-3.5">
                {/* Row 1: Item Name and Print Name (2 columns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                      Item Name (ERP Standard Category)*
                    </label>
                    <input
                      id="form-item-name"
                      type="text"
                      required
                      placeholder="e.g. Ambuja Cement, Tata Salt, HP LaserJet Printer"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400 h-9 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                      Print Name (Standard Bill Print Name)*
                    </label>
                    <input
                      id="form-print-name"
                      type="text"
                      required
                      placeholder="e.g. Ambuja Kawach Bag, Tata Salt Iodized"
                      value={printName}
                      onChange={(e) => setPrintName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400 h-9"
                    />
                  </div>
                </div>

                {/* Row 2: Group Trade, Unit, GST Rate, HSN Code (4 columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                      Group Trade*
                    </label>
                    <input
                      id="form-custom-group"
                      type="text"
                      required
                      placeholder="e.g. Hardware"
                      value={group}
                      onChange={(e) => setGroup(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 h-9"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                      Unit*
                    </label>
                    <input
                      id="form-custom-unit"
                      type="text"
                      required
                      placeholder="e.g. Quintal"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 h-9"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono tracking-wider text-slate-505 font-bold uppercase block mb-1">
                      GST Rate*
                    </label>
                    <input
                      id="form-custom-gst-rate"
                      type="text"
                      required
                      placeholder="e.g. 18%"
                      value={gstRate}
                      onChange={(e) => setGstRate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-250 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 h-9 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono tracking-wider text-slate-550 font-bold uppercase block mb-1">
                      HSN Code*
                    </label>
                    <input
                      id="form-hsn"
                      type="text"
                      required
                      placeholder="e.g. 1001"
                      value={hsn}
                      onChange={(e) => setHsn(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 h-9 font-mono"
                    />
                  </div>
                </div>

                {/* Row 3: Remaining (Client Association Mapping) */}
                <div>
                  <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                    Client Association Mapping
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="form-client-master-association-select"
                      value={clientMappedName}
                      onChange={(e) => setClientMappedName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs px-3 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 h-9 font-sans"
                    >
                      <option value="">General (No specific client linked)</option>
                      {clientMasters.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} ({c.type})
                        </option>
                      ))}
                      <option value="custom_input">Type custom client name...</option>
                    </select>
                  </div>
                  {clientMappedName === "custom_input" && (
                    <input
                      id="form-client-custom-override"
                      type="text"
                      placeholder="Enter custom associated client name"
                      onChange={(e) => setClientMappedName(e.target.value)}
                      className="w-full mt-1.5 bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 h-9 font-medium"
                    />
                  )}
                </div>

                <button
                  id="form-submit-add-master-item-btn"
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-450 hover:to-amber-550 text-slate-950 font-bold text-xs py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer mt-2"
                >
                  <Plus className="h-4 w-4" /> Save Changes
                </button>
              </form>
            </div>
          </div>

          {/* Table under form */}
          <div className="w-full bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                  Product Master Database (ERP Catalog)
                </h3>
                <p className="text-[10px] text-slate-450 font-mono">
                  Showing {filteredItems.length} matching rows out of {masterItems.length} total registered items
                </p>
              </div>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  id="master-search-registry"
                  type="text"
                  placeholder="Search Item, HSN, Code, Client..."
                  value={itemSearchQuery}
                  onChange={(e) => {
                    setItemSearchQuery(e.target.value);
                    setItemCurrentPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-xs pl-8 pr-4 py-2 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400"
                />
              </div>

              <div>
                <select
                  id="master-filter-group"
                  value={selectedGroup}
                  onChange={(e) => {
                    setSelectedGroup(e.target.value);
                    setItemCurrentPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-xs py-2 px-3 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-indigo-400"
                >
                  <option value="all">All Groups / Classes</option>
                  {registeredGroups.map((grp) => (
                    <option key={grp} value={grp}>{grp}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  id="master-filter-client"
                  value={selectedClient}
                  onChange={(e) => {
                    setSelectedClient(e.target.value);
                    setItemCurrentPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-xs py-2 px-3 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-indigo-400"
                >
                  <option value="all">All Linked Client Masters</option>
                  {registeredClients.map((cl) => (
                    <option key={cl} value={cl}>{cl}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Items Table container */}
            <div className="overflow-x-auto border border-slate-150 rounded-xl bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] tracking-wider uppercase text-slate-500 font-mono">
                    <th className="p-3">Standard Item Name</th>
                    <th className="p-3">Print Label</th>
                    <th className="p-3">Trade Group</th>
                    <th className="p-3 text-center">Unit</th>
                    <th className="p-3 text-center">GST Rate</th>
                    <th className="p-3 text-center">HSN</th>
                    <th className="p-3">Associated Firm</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-mono">
                        No trade item entries matched standard search parameters.
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((item) => {
                      const isEditing = editingId === item.id;
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/50 transition-all font-sans text-slate-700 ${
                            isEditing ? "bg-amber-50/40" : ""
                          }`}
                        >
                          {isEditing ? (
                            <>
                              <td className="p-2">
                                <input
                                  type="text"
                                  className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-800 font-bold"
                                  value={editItemName}
                                  onChange={(e) => setEditItemName(e.target.value)}
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-600"
                                  value={editPrintName}
                                  onChange={(e) => setEditPrintName(e.target.value)}
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-650"
                                  value={editGroup}
                                  onChange={(e) => setEditGroup(e.target.value)}
                                />
                              </td>
                              <td className="p-2 text-center">
                                <input
                                  type="text"
                                  className="w-14 bg-white border border-slate-300 rounded px-1 text-center py-1 text-xs text-slate-600"
                                  value={editUnit}
                                  onChange={(e) => setEditUnit(e.target.value)}
                                />
                              </td>
                              <td className="p-2 text-center">
                                <input
                                  type="text"
                                  className="w-14 bg-white border border-slate-300 rounded px-1 text-center py-1 text-xs font-mono font-bold"
                                  value={editGstRate}
                                  onChange={(e) => setEditGstRate(e.target.value)}
                                />
                              </td>
                              <td className="p-2 text-center">
                                <input
                                  type="text"
                                  className="w-16 bg-white border border-slate-300 rounded px-1 text-center py-1 text-xs font-mono"
                                  value={editHsn}
                                  onChange={(e) => setEditHsn(e.target.value)}
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-indigo-700 h-7"
                                  value={editClientName}
                                  onChange={(e) => setEditClientName(e.target.value)}
                                />
                              </td>
                              <td className="p-2 text-right">
                                <div className="flex gap-1 justify-end">
                                  <button
                                    onClick={handleSaveEdit}
                                    className="p-1.5 bg-emerald-100 hover:bg-emerald-250 text-emerald-700 rounded transition-colors cursor-pointer"
                                    title="Save changes"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="p-1.5 bg-red-100 hover:bg-red-200 text-red-650 rounded transition-colors cursor-pointer"
                                    title="Cancel"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 font-bold text-slate-800">{item.itemName}</td>
                              <td className="p-3 text-slate-500 font-mono text-[11px]">{item.printName}</td>
                              <td className="p-3">
                                <span className="bg-slate-50 text-slate-650 px-2.5 py-0.5 rounded text-[10px] border border-slate-200 font-mono font-medium">
                                  {item.group}
                                </span>
                              </td>
                              <td className="p-3 text-center font-semibold text-slate-600 font-mono">{item.unit}</td>
                              <td className="p-3 text-center">
                                <span className="text-purple-700 font-mono font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                  {item.gstRate}
                                </span>
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-slate-600">{item.hsn}</td>
                              <td className="p-3 text-indigo-700 font-mono text-[11px] font-medium">
                                {item.clientName || "General"}
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex gap-1 justify-end">
                                  {deleteConfirmId === item.id ? (
                                    <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded border border-red-200">
                                      <span className="text-[10px] text-red-700 font-bold">Delete?</span>
                                      <button
                                        onClick={() => {
                                          onDeleteMasterItem(item.id);
                                          setDeleteConfirmId(null);
                                        }}
                                        className="px-2 py-0.5 bg-red-600 hover:bg-red-750 text-white rounded text-[9px] font-bold uppercase transition-colors"
                                      >
                                        Yes
                                      </button>
                                      <button
                                        onClick={() => setDeleteConfirmId(null)}
                                        className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] font-bold uppercase transition-colors"
                                      >
                                        No
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleStartEdit(item)}
                                        className="text-slate-500 hover:text-indigo-650 hover:bg-indigo-50 p-1.5 rounded transition-colors"
                                        title="Edit Item parameters"
                                      >
                                        <Edit3 className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setDeleteConfirmId(item.id)}
                                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                                        title="Delete standard row"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalItemPages > 1 && (
              <div className="flex justify-between items-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-150">
                <span className="text-slate-500 text-xs">
                  Page <strong className="text-slate-755">{itemCurrentPage}</strong> of{" "}
                  <strong className="text-slate-755">{totalItemPages}</strong>
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={goToPrevItemPage}
                    disabled={itemCurrentPage === 1}
                    className="bg-white border border-slate-200 hover:border-indigo-400 py-1 px-2.5 text-xs rounded-lg transition-colors cursor-pointer text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    Previous
                  </button>
                  <button
                    onClick={goToNextItemPage}
                    disabled={itemCurrentPage === totalItemPages}
                    className="bg-white border border-slate-200 hover:border-indigo-400 py-1 px-2.5 text-xs rounded-lg transition-colors cursor-pointer text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          SUBTAB 2 VIEW: CLIENT & VENDOR MASTER
          ========================================== */}
      {activeSubTab === "clients" && (
        <div className="space-y-6 animate-fade-in">
          {/* Add Client form column full width */}
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Plus className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm uppercase tracking-wide">
                  Register Client
                </h3>
              </div>

              <form onSubmit={handleAddClientSubmit} className="space-y-2">
                 {/* SECTION 1: BUSINESS BASE INFO */}
                 <div className={`transition-all duration-200 rounded-xl ${isSec1Open ? "space-y-3 bg-slate-50/50 p-3 border border-slate-200" : "p-1.5 bg-slate-50/30 border border-slate-100"}`}>
                  <button
                    type="button"
                    onClick={() => setIsSec1Open(!isSec1Open)}
                    className="w-full text-left flex items-center gap-2.5 text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50/70 hover:bg-indigo-50 border border-indigo-200 rounded px-2.5 py-1.5 uppercase tracking-wider focus:outline-none transition-all cursor-pointer"
                  >
                    <span className="font-extrabold text-sm bg-white border border-indigo-200/60 rounded px-1 min-w-[20px] text-center inline-flex items-center justify-center h-[20px] select-none shadow-xs">
                      {isSec1Open ? "−" : "+"}
                    </span>
                    <span className="flex items-center gap-1.5">📁 Business Base Info</span>
                  </button>
                  {isSec1Open && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                            Business Code
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. RADHA-001"
                            value={clientBusinessCode}
                            onChange={(e) => setClientBusinessCode(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400 font-medium h-9"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                            Business / Firm Name*
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Shree Radhe Agro Foods"
                            value={clientNameInput}
                            onChange={(e) => setClientNameInput(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400 font-bold h-9"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                            DOB-Firm (Establishment Date)
                          </label>
                          <input
                            type="date"
                            value={clientDobFirm}
                            onChange={(e) => setClientDobFirm(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 h-9 font-medium"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                            Mail ID
                          </label>
                          <input
                            type="email"
                            placeholder="e.g. firm@gmail.com"
                            value={clientMailId}
                            onChange={(e) => setClientMailId(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400 font-medium h-9"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                            Client Office Location / Address
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Suite 420, Mandi Complex, Bhopal"
                            value={clientAddress}
                            onChange={(e) => setClientAddress(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400 h-9 font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 2: PERSONAL & CONTACT INFORMATION */}
                <div className={`transition-all duration-200 rounded-xl ${isSec2Open ? "space-y-3 bg-slate-50/50 p-3 border border-slate-200" : "p-1.5 bg-slate-50/30 border border-slate-100"}`}>
                  <button
                    type="button"
                    onClick={() => setIsSec2Open(!isSec2Open)}
                    className="w-full text-left flex items-center gap-2.5 text-[11px] font-mono font-bold text-amber-600 bg-amber-50/70 hover:bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5 uppercase tracking-wider focus:outline-none transition-all cursor-pointer"
                  >
                    <span className="font-extrabold text-sm bg-white border border-amber-200/60 rounded px-1 min-w-[20px] text-center inline-flex items-center justify-center h-[20px] select-none shadow-xs">
                      {isSec2Open ? "−" : "+"}
                    </span>
                    <span className="flex items-center gap-1.5">👤 Owner / Contact Details</span>
                  </button>
                  {isSec2Open && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                      <div>
                        <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                          Contact Person
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Ajit Sharma"
                          value={clientContactPerson}
                          onChange={(e) => setClientContactPerson(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400 font-medium h-9"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                          Contact Person DOB
                        </label>
                        <input
                          type="date"
                          value={clientContactPersonDob}
                          onChange={(e) => setClientContactPersonDob(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 h-9 font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                          Contact Number (WhatsApp)*
                        </label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="e.g. 9876543210"
                          value={clientMobile}
                          onChange={(e) => setClientMobile(e.target.value.replace(/[^0-9]/g, ""))}
                          className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400 h-9 font-mono font-bold tracking-wider"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                          Aadhar Number
                        </label>
                        <input
                          type="text"
                          maxLength={12}
                          placeholder="e.g. 453123456789"
                          value={clientAadhar}
                          onChange={(e) => setClientAadhar(e.target.value.replace(/[^0-9]/g, ""))}
                          className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400 h-9 font-mono font-medium"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 3: TAXATION & REGISTRATION IDENTIFICATION */}
                <div className={`transition-all duration-200 rounded-xl ${isSec3Open ? "space-y-3 bg-slate-50/50 p-3 border border-slate-200" : "p-1.5 bg-slate-50/30 border border-slate-100"}`}>
                  <button
                    type="button"
                    onClick={() => setIsSec3Open(!isSec3Open)}
                    className="w-full text-left flex items-center gap-2.5 text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-200 rounded px-2.5 py-1.5 uppercase tracking-wider focus:outline-none transition-all cursor-pointer"
                  >
                    <span className="font-extrabold text-sm bg-white border border-emerald-200/60 rounded px-1 min-w-[20px] text-center inline-flex items-center justify-center h-[20px] select-none shadow-xs">
                      {isSec3Open ? "−" : "+"}
                    </span>
                    <span className="flex items-center gap-1.5">💳 Taxation & Licenses</span>
                  </button>
                  {isSec3Open && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                      <div>
                        <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                          PAN Identification
                        </label>
                        <input
                          type="text"
                          maxLength={10}
                          placeholder="e.g. ABCDE1234F"
                          value={clientPan}
                          onChange={(e) => setClientPan(e.target.value.toUpperCase())}
                          className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400 h-9 font-mono uppercase font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                          GST Identifier*
                        </label>
                        <input
                          type="text"
                          maxLength={15}
                          required
                          placeholder="e.g. 09SARA7766K1Z9"
                          value={clientGstin}
                          onChange={(e) => setClientGstin(e.target.value.toUpperCase())}
                          className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400 h-9 font-mono uppercase font-black tracking-widest"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                          TAN Identification
                        </label>
                        <input
                          type="text"
                          maxLength={10}
                          placeholder="e.g. BPLM12345A"
                          value={clientTan}
                          onChange={(e) => setClientTan(e.target.value.toUpperCase())}
                          className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400 h-9 font-mono uppercase font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                          VAT Identification
                        </label>
                        <input
                          type="text"
                          maxLength={11}
                          placeholder="e.g. 23849182746"
                          value={clientVat}
                          onChange={(e) => setClientVat(e.target.value.toUpperCase())}
                          className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400 h-9 font-mono uppercase font-semibold"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 4: ASSIGNMENTS & CHANNELS */}
                <div className={`transition-all duration-200 rounded-xl ${isSec4Open ? "space-y-3 bg-slate-50/50 p-3 border border-slate-200" : "p-1.5 bg-slate-50/30 border border-slate-100"}`}>
                  <button
                    type="button"
                    onClick={() => setIsSec4Open(!isSec4Open)}
                    className="w-full text-left flex items-center gap-2.5 text-[11px] font-mono font-bold text-purple-600 bg-purple-50/70 hover:bg-purple-50 border border-purple-200 rounded px-2.5 py-1.5 uppercase tracking-wider focus:outline-none transition-all cursor-pointer"
                  >
                    <span className="font-extrabold text-sm bg-white border border-purple-200/60 rounded px-1 min-w-[20px] text-center inline-flex items-center justify-center h-[20px] select-none shadow-xs">
                      {isSec4Open ? "−" : "+"}
                    </span>
                    <span className="flex items-center gap-1.5">⚡ Integrations & Status</span>
                  </button>
                  {isSec4Open && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                      <div>
                        <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                          WhatsApp Group Icon/Id
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Chat Link or Group ID"
                          value={clientWaGroupIcon}
                          onChange={(e) => setClientWaGroupIcon(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400 h-9 font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                          Google Drive Folder ID
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 1A_B2C3D4E5FG..."
                          value={clientDriveFolderId}
                          onChange={(e) => setClientDriveFolderId(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400 h-9 font-mono font-medium text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                          Assigned To
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Rahul Verma"
                          value={clientAssignedTo}
                          onChange={(e) => setClientAssignedTo(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400 h-9 font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                          Firm Status*
                        </label>
                        <select
                          value={clientFirmStatus}
                          onChange={(e) => setClientFirmStatus(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 h-9 font-bold bg-white"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 5: LOGIN & EMPLOYEE INFO */}
                <div className={`transition-all duration-200 rounded-xl ${isSec5Open ? "space-y-3 bg-slate-50/50 p-3 border border-slate-200" : "p-1.5 bg-slate-50/30 border border-slate-100"}`}>
                  <button
                    type="button"
                    onClick={() => setIsSec5Open(!isSec5Open)}
                    className="w-full text-left flex items-center gap-2.5 text-[11px] font-mono font-bold text-rose-600 bg-rose-50/70 hover:bg-rose-50 border border-rose-200 rounded px-2.5 py-1.5 uppercase tracking-wider focus:outline-none transition-all cursor-pointer"
                  >
                    <span className="font-extrabold text-sm bg-white border border-rose-200/60 rounded px-1 min-w-[20px] text-center inline-flex items-center justify-center h-[20px] select-none shadow-xs">
                      {isSec5Open ? "−" : "+"}
                    </span>
                    <span className="flex items-center gap-1.5">🔐 Access & Employee Credentials</span>
                  </button>
                  {isSec5Open && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in">
                      <div>
                        <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                          Employee Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Ramesh Giri"
                          value={clientEmployeeName}
                          onChange={(e) => setClientEmployeeName(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400 h-9 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                          Employee Contact
                        </label>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="e.g. 7895241360"
                          value={clientEmployeeContact}
                          onChange={(e) => setClientEmployeeContact(e.target.value.replace(/[^0-9]/g, ""))}
                          className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400 h-9 font-mono text-slate-700"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                          Employee Password
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. EmpPass@12"
                          value={clientEmployeePassword}
                          onChange={(e) => setClientEmployeePassword(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400 h-9 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono tracking-wider text-slate-500 font-bold uppercase block mb-1">
                          Login Password
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. LoginPass@99"
                          value={clientLoginPassword}
                          onChange={(e) => setClientLoginPassword(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400 h-9 font-mono"
                        />
                      </div>

                      <div className="sm:col-span-1 lg:col-span-1 flex items-end">
                        <button
                          id="client-form-submit-btn"
                          type="submit"
                          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-650 hover:to-indigo-750 text-white font-extrabold text-xs h-9 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="h-4 w-4" /> Save Client
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Search and Database column full width beneath form */}
          <div className="w-full bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 animate-fade-in">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                  Licensed Business Accounts Directory
                </h3>
                <p className="text-[10px] text-slate-450 font-mono">
                  Showing {filteredClients.length} registered accounts of {clientMasters.length} profiles
                </p>
              </div>
            </div>

            {/* Filter tools */}
            <div className="grid grid-cols-1 gap-3 py-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Name, Mobile number, GSTIN, Address..."
                  value={clientSearchQuery}
                  onChange={(e) => {
                    setClientSearchQuery(e.target.value);
                    setClientCurrentPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-xs pl-8 pr-4 py-2 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400"
                />
              </div>
            </div>

            {/* Clients Table view */}
            <div className="overflow-x-auto border border-slate-150 rounded-xl bg-white">
              <table className="w-full text-left border-collapse text-xs min-w-[1600px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] tracking-wider uppercase text-slate-500 font-mono">
                    <th className="p-1 px-1.5 text-center bg-indigo-50/45 text-indigo-700 w-12 min-w-[50px] border-r border-indigo-100">Actions</th>
                    <th className="p-3 pr-0 w-24">Business Code</th>
                    <th className="p-3 pl-1.5 w-60 max-w-[240px]">Business Name</th>
                    {editingClientId !== null && <th className="p-3">Contact Person</th>}
                    {editingClientId !== null ? (
                      <>
                        <th className="p-3 text-center">PAN</th>
                        <th className="p-3 text-center">GST</th>
                        <th className="p-3 text-center">TAN</th>
                        <th className="p-3 text-center">VAT</th>
                      </>
                    ) : (
                      <th className="p-3 text-left min-w-[180px] bg-slate-50">GST / PAN / TAN / VAT</th>
                    )}
                    {editingClientId !== null && <th className="p-3 text-center">Aadhar</th>}
                    <th className="p-3 text-center">DOB-Firm</th>
                    <th className="p-3 text-center">Contact Number</th>
                    {editingClientId !== null && <th className="p-3 text-center">W/A Group Icon</th>}
                    {editingClientId !== null && <th className="p-3">Employee Name</th>}
                    {editingClientId !== null && <th className="p-3 text-center">Employee Contact</th>}
                    {editingClientId !== null && <th className="p-3 text-center">Employee Password</th>}
                    <th className="p-3">Assigned To</th>
                    {editingClientId !== null && <th className="p-3 text-center">Firm Status</th>}
                    {editingClientId !== null && <th className="p-3 text-center">Login Password</th>}
                    <th className="p-3">Mail ID</th>
                    <th className="p-3">Drive Folder ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedClients.length === 0 ? (
                    <tr>
                      <td colSpan={editingClientId !== null ? 20 : 12} className="p-8 text-center text-slate-400 font-mono">
                        No client master entries matched criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedClients.map((client) => {
                      const isEditingClient = editingClientId === client.id;
                      return (
                        <tr
                          key={client.id}
                          className={`hover:bg-slate-50/50 transition-all font-sans text-slate-705 ${
                            isEditingClient ? "bg-amber-50/40" : ""
                          }`}
                        >
                          {isEditingClient ? (
                            <>
                              {/* Actions */}
                              <td className="p-1 px-1.5 border-r border-indigo-150 bg-amber-50/70 text-center">
                                <div className="flex flex-col gap-1 items-center justify-center">
                                  <button
                                    onClick={handleSaveClientEdit}
                                    className="text-[10px] text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 font-sans font-bold uppercase py-0.5 px-0.5 rounded cursor-pointer leading-tight"
                                    title="Save Client"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingClientId(null)}
                                    className="text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50 font-sans font-bold uppercase py-0.5 px-0.5 rounded cursor-pointer leading-tight"
                                    title="Cancel"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                              {/* 1. Business Code */}
                              <td className="p-2 pr-0 w-24">
                                <input
                                  type="text"
                                  className="w-24 bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-800 font-medium h-8"
                                  value={editClientBusinessCode}
                                  onChange={(e) => setEditClientBusinessCode(e.target.value)}
                                />
                              </td>
                              {/* 2. Business Name */}
                              <td className="p-2 pl-1.5 max-w-[240px]">
                                <input
                                  type="text"
                                  className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-800 font-bold h-8"
                                  value={editClientNameInput}
                                  onChange={(e) => setEditClientNameInput(e.target.value)}
                                />
                              </td>
                              {/* 3. Contact Person */}
                              <td className="p-2 min-w-[120px]">
                                <input
                                  type="text"
                                  className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-850 h-8"
                                  value={editClientContactPerson}
                                  onChange={(e) => setEditClientContactPerson(e.target.value)}
                                />
                              </td>
                              {/* 4. PAN */}
                              <td className="p-2 text-center">
                                <input
                                  type="text"
                                  maxLength={10}
                                  className="w-24 bg-white border border-slate-300 rounded text-center py-1 text-xs font-mono font-bold uppercase h-8"
                                  value={editClientPan}
                                  onChange={(e) => setEditClientPan(e.target.value.toUpperCase())}
                                />
                              </td>
                              {/* 5. GST */}
                              <td className="p-2 text-center">
                                <input
                                  type="text"
                                  maxLength={15}
                                  className="w-28 bg-white border border-slate-300 rounded text-center py-1 text-xs font-mono font-bold uppercase h-8"
                                  value={editClientGstin}
                                  onChange={(e) => setEditClientGstin(e.target.value.toUpperCase())}
                                />
                              </td>
                              {/* 6. TAN */}
                              <td className="p-2 text-center">
                                <input
                                  type="text"
                                  maxLength={10}
                                  className="w-24 bg-white border border-slate-300 rounded text-center py-1 text-xs font-mono uppercase h-8"
                                  value={editClientTan}
                                  onChange={(e) => setEditClientTan(e.target.value.toUpperCase())}
                                />
                              </td>
                              {/* 7. VAT */}
                              <td className="p-2 text-center">
                                <input
                                  type="text"
                                  maxLength={11}
                                  className="w-24 bg-white border border-slate-300 rounded text-center py-1 text-xs font-mono uppercase h-8"
                                  value={editClientVat}
                                  onChange={(e) => setEditClientVat(e.target.value.toUpperCase())}
                                />
                              </td>
                              {/* 8. AADHAR */}
                              <td className="p-2 text-center">
                                <input
                                  type="text"
                                  maxLength={12}
                                  className="w-28 bg-white border border-slate-300 rounded text-center py-1 text-xs font-mono h-8"
                                  value={editClientAadhar}
                                  onChange={(e) => setEditClientAadhar(e.target.value.replace(/[^0-9]/g, ""))}
                                />
                              </td>
                              {/* 9. DOB-Firm */}
                              <td className="p-2">
                                <input
                                  type="date"
                                  className="w-28 bg-white border border-slate-300 rounded px-1.5 py-1 text-[11px] font-mono text-slate-800 h-8"
                                  value={editClientDobFirm}
                                  onChange={(e) => setEditClientDobFirm(e.target.value)}
                                />
                              </td>
                              {/* 10. Contact Number */}
                              <td className="p-2 text-center">
                                <input
                                  type="text"
                                  maxLength={10}
                                  className="w-24 bg-white border border-slate-300 rounded text-center py-1 text-xs font-mono font-bold h-8"
                                  value={editClientMobile}
                                  onChange={(e) => setEditClientMobile(e.target.value.replace(/[^0-9]/g, ""))}
                                />
                              </td>
                              {/* 11. W/A GROUP ICON */}
                              <td className="p-2">
                                <input
                                  type="text"
                                  className="w-24 bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-800 h-8 font-mono"
                                  value={editClientWaGroupIcon}
                                  onChange={(e) => setEditClientWaGroupIcon(e.target.value)}
                                />
                              </td>
                              {/* 12. EMPLOYEE NAME */}
                              <td className="p-2">
                                <input
                                  type="text"
                                  className="w-24 bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-800 h-8 font-sans"
                                  value={editClientEmployeeName}
                                  onChange={(e) => setEditClientEmployeeName(e.target.value)}
                                />
                              </td>
                              {/* 13. EMPLOYEE CONTACT */}
                              <td className="p-2 text-center">
                                <input
                                  type="text"
                                  maxLength={10}
                                  className="w-24 bg-white border border-slate-300 rounded text-center py-1 text-xs font-mono text-slate-705 h-8"
                                  value={editClientEmployeeContact}
                                  onChange={(e) => setEditClientEmployeeContact(e.target.value.replace(/[^0-9]/g, ""))}
                                />
                              </td>
                              {/* 14. EMPLOYEE PASSWORD */}
                              <td className="p-2">
                                <input
                                  type="text"
                                  className="w-24 bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-800 h-8 font-mono"
                                  value={editClientEmployeePassword}
                                  onChange={(e) => setEditClientEmployeePassword(e.target.value)}
                                />
                              </td>
                              {/* 15. ASSIGNED TO */}
                              <td className="p-2">
                                <input
                                  type="text"
                                  className="w-24 bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-800 h-8"
                                  value={editClientAssignedTo}
                                  onChange={(e) => setEditClientAssignedTo(e.target.value)}
                                />
                              </td>
                              {/* 16. FIRM STATUS */}
                              <td className="p-2">
                                <select
                                  className="w-24 bg-white border border-slate-300 rounded px-1.5 h-8 text-xs font-bold text-slate-800"
                                  value={editClientFirmStatus}
                                  onChange={(e) => setEditClientFirmStatus(e.target.value)}
                                >
                                  <option value="Active">Active</option>
                                  <option value="Inactive">Inactive</option>
                                </select>
                              </td>
                              {/* 17. LOGIN PASSWORD */}
                              <td className="p-2">
                                <input
                                  type="text"
                                  className="w-24 bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-800 h-8 font-mono"
                                  value={editClientLoginPassword}
                                  onChange={(e) => setEditClientLoginPassword(e.target.value)}
                                />
                              </td>
                              {/* 18. Mail ID */}
                              <td className="p-2">
                                <input
                                  type="email"
                                  className="w-28 bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-800 h-8 font-mono"
                                  value={editClientMailId}
                                  onChange={(e) => setEditClientMailId(e.target.value)}
                                />
                              </td>
                              {/* 19. Drive Folder ID */}
                              <td className="p-2">
                                <input
                                  type="text"
                                  className="w-28 bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-800 h-8 font-mono"
                                  value={editClientDriveFolderId}
                                  onChange={(e) => setEditClientDriveFolderId(e.target.value)}
                                />
                              </td>
                            </>
                          ) : (
                            <>
                              {/* Actions */}
                              <td className="p-1 px-1.5 bg-indigo-50/15 border-r border-slate-150 sticky left-0 z-10 text-center">
                                <div className="flex flex-col gap-1 items-center justify-center">
                                  <button
                                    onClick={() => handleStartEditClient(client)}
                                    className="text-[10px] text-indigo-600 hover:text-indigo-850 hover:bg-slate-100/70 font-sans font-bold uppercase py-0.5 px-1 rounded cursor-pointer leading-tight"
                                    title="Edit Client Account"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => setDeleteClientConfirmId(client.id)}
                                    className="text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50 font-sans font-bold uppercase py-0.5 px-1 rounded cursor-pointer leading-tight"
                                    title="Delete Client Account"
                                  >
                                    Del
                                  </button>
                                </div>
                              </td>
                              {/* 1. Business Code */}
                              <td className="p-3 pr-0 w-24 font-mono text-slate-500 font-semibold">{client.businessCode || "-"}</td>
                              {/* 2. Business Name */}
                              <td className="p-3 pl-1.5 font-bold text-slate-800 max-w-[240px] break-words">
                                <div className="flex items-start gap-1.5">
                                  <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                                    client.firmStatus === "Inactive" ? "bg-slate-300" : "bg-emerald-500"
                                  }`} />
                                  <span>{client.name}</span>
                                </div>
                              </td>
                              {/* 3. Contact Person */}
                              {editingClientId !== null && (
                                <td className="p-3 text-slate-800 font-semibold">{client.contactPerson || "-"}</td>
                              )}
                              {/* 4. Tax/Registration Details Stack */}
                              {editingClientId !== null ? (
                                <>
                                  <td className="p-3 text-center font-mono font-bold text-indigo-700">{client.pan || "-"}</td>
                                  <td className="p-3 text-center">
                                    <span className="bg-slate-100 text-slate-750 font-mono font-bold px-2 py-0.5 rounded border border-slate-205 text-[11px]">
                                      {client.gstin || "URD"}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center font-mono font-semibold text-teal-700">{client.tan || "-"}</td>
                                  <td className="p-3 text-center font-mono font-semibold text-rose-700">{client.vat || "-"}</td>
                                </>
                              ) : (
                                <td className="p-3 text-left">
                                  <div className="flex flex-col gap-1.5 py-0.5" id={`tax-stack-${client.id}`}>
                                    {client.gstin && client.gstin !== "-" && client.gstin !== "" && client.gstin.toUpperCase() !== "URD" && (
                                      <div className="flex items-center gap-1.5 leading-none">
                                        <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider w-8 uppercase shrink-0">GST:</span>
                                        <span className="bg-indigo-50 text-indigo-750 font-mono font-bold px-1.5 py-0.5 rounded border border-indigo-150 text-[10px]">
                                          {client.gstin}
                                        </span>
                                      </div>
                                    )}
                                    {client.pan && client.pan !== "-" && client.pan !== "" && (
                                      <div className="flex items-center gap-1.5 leading-none">
                                        <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider w-8 uppercase shrink-0">PAN:</span>
                                        <span className="bg-slate-50 text-indigo-750 font-mono font-bold px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                                          {client.pan}
                                        </span>
                                      </div>
                                    )}
                                    {client.tan && client.tan !== "-" && client.tan !== "" && (
                                      <div className="flex items-center gap-1.5 leading-none">
                                        <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider w-8 uppercase shrink-0">TAN:</span>
                                        <span className="bg-teal-50 text-teal-700 font-mono font-bold px-1.5 py-0.5 rounded border border-teal-150 text-[10px]">
                                          {client.tan}
                                        </span>
                                      </div>
                                    )}
                                    {client.vat && client.vat !== "-" && client.vat !== "" && (
                                      <div className="flex items-center gap-1.5 leading-none">
                                        <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider w-8 uppercase shrink-0">VAT:</span>
                                        <span className="bg-rose-50 text-rose-700 font-mono font-bold px-1.5 py-0.5 rounded border border-rose-150 text-[10px]">
                                          {client.vat}
                                        </span>
                                      </div>
                                    )}
                                    {!(client.gstin && client.gstin !== "-" && client.gstin !== "" && client.gstin.toUpperCase() !== "URD") &&
                                     !(client.pan && client.pan !== "-" && client.pan !== "") &&
                                     !(client.tan && client.tan !== "-" && client.tan !== "") &&
                                     !(client.vat && client.vat !== "-" && client.vat !== "") && (
                                      <span className="text-slate-400 font-mono italic text-[11px]">-</span>
                                    )}
                                  </div>
                                </td>
                              )}
                              {/* 8. AADHAR */}
                              {editingClientId !== null && (
                                <td className="p-3 text-center font-mono text-slate-600">{client.aadhar || "-"}</td>
                              )}
                              {/* 9. DOB-Firm */}
                              <td className="p-3 text-center font-mono text-slate-650">{client.dobFirm || "-"}</td>
                              {/* 10. Contact Number */}
                              <td className="p-3 text-center font-mono font-bold text-slate-800">{client.mobile || "-"}</td>
                              {/* 11. W/A Group Icon */}
                              {editingClientId !== null && (
                                <td className="p-3 text-center font-mono text-xs max-w-[120px] truncate" title={client.waGroupIcon}>
                                  {client.waGroupIcon || "-"}
                                </td>
                              )}
                              {/* 12. Employee Name */}
                              {editingClientId !== null && (
                                <td className="p-3 text-slate-800 font-semibold">{client.employeeName || "-"}</td>
                              )}
                              {/* 13. Employee Contact */}
                              {editingClientId !== null && (
                                <td className="p-3 text-center font-mono text-slate-500">{client.employeeContact || "-"}</td>
                              )}
                              {/* 14. Employee Password */}
                              {editingClientId !== null && (
                                <td className="p-3 text-center font-mono text-slate-500">{client.employeePassword || "-"}</td>
                              )}
                              {/* 15. Assigned To */}
                              <td className="p-3 text-slate-755 font-medium">{client.assignedTo || "-"}</td>
                              {/* 16. Firm Status */}
                              {editingClientId !== null && (
                                <td className="p-3 text-center font-bold">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                                    client.firmStatus === "Inactive"
                                      ? "bg-slate-50 text-slate-500 border-slate-200"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  }`}>
                                    {client.firmStatus || "Active"}
                                  </span>
                                </td>
                              )}
                              {/* 17. Login Password */}
                              {editingClientId !== null && (
                                <td className="p-3 text-center font-mono text-slate-500">{client.loginPassword || "-"}</td>
                              )}
                              {/* 18. Mail ID */}
                              <td className="p-3 text-slate-600 font-mono text-xs">{client.mailId || "-"}</td>
                              {/* 19. Drive Folder ID */}
                              <td className="p-3 text-slate-600 font-mono text-xs max-w-[150px] truncate" title={client.driveFolderId}>
                                {client.driveFolderId || "-"}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalClientPages > 1 && (
              <div className="flex justify-between items-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-150">
                <span className="text-slate-500 text-xs">
                  Page <strong className="text-slate-755">{clientCurrentPage}</strong> of{" "}
                  <strong className="text-slate-755">{totalClientPages}</strong>
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={goToPrevClientPage}
                    disabled={clientCurrentPage === 1}
                    className="bg-white border border-slate-200 hover:border-indigo-400 py-1 px-2.5 text-xs rounded-lg transition-colors cursor-pointer text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    Previous
                  </button>
                  <button
                    onClick={goToNextClientPage}
                    disabled={clientCurrentPage === totalClientPages}
                    className="bg-white border border-slate-200 hover:border-indigo-400 py-1 px-2.5 text-xs rounded-lg transition-colors cursor-pointer text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          SUBTAB 3 VIEW: TEAM MEMBER MASTER
          ========================================== */}
      {activeSubTab === "team" && (
        <div className="space-y-6 animate-fade-in">
          {/* Google Sheets Team Tab Layout Instructions */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-2xl shadow-sm text-xs text-slate-705 space-y-2">
            <span className="font-extrabold uppercase text-[10px] text-amber-800 tracking-wider font-mono block">
              💡 Google Sheet Format Structure: "TEAM" Members Tab
            </span>
            <p className="leading-relaxed">
              In your Business Master Google Sheet, you should have a tab named <strong>"TEAM"</strong> (or Team Members) with the following structure:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-650">
              <li><strong>Mobile No / Mobile:</strong> The mobile phone number of the member, used optionally for secure Logins (e.g. <code className="bg-amber-100 px-1 rounded text-amber-800 font-mono">8982147763</code>)</li>
              <li><strong>Team Member Name:</strong> Fuller display name (e.g. <code className="bg-amber-100 px-1 rounded text-amber-800 font-mono">RAVI KATARA</code>)</li>
              <li><strong>Role / Designation:</strong> Access roles (e.g. <code className="bg-amber-100 px-1 rounded text-amber-800 font-mono">HOD</code>, <code className="bg-amber-100 px-1 rounded text-amber-800 font-mono">SENIOR ACCOUNTANT</code>)</li>
              <li><strong>Status:</strong> Use <code className="bg-amber-100 px-1 rounded text-amber-800 font-mono">Active</code> or <code className="bg-amber-100 px-1 rounded text-amber-800 font-mono">Inactive</code></li>
              <li>
                <strong>totpSecret (Google Authenticator Key):</strong> 16-character Base32 text (e.g. <code className="bg-amber-100 px-1 rounded text-amber-800 font-mono">RECOVERYKEY12345</code>)
                <span className="block mt-0.5 text-slate-500 text-[11px]">
                  <em>Auto-Gen default:</em> If this column is left empty, the secure verification system will generate a stable 16-character secret key based on the name and phone number automatically, with QR code shown during Login verification.
                </span>
              </li>
            </ul>
          </div>

          {/* Add Team Member form full width */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600">
                  <Plus className="h-4 w-4" />
                </div>
                <h3 className="font-extrabold text-xs text-slate-850 uppercase tracking-wider">
                  Add New Team Member
                </h3>
              </div>

              <form onSubmit={handleAddTeamSubmit} className="space-y-3.5">
                {/* Row 1: Member Name and Mobile Number (2 columns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Member Name *
                    </label>
                    <input
                      id="team-name-input-field"
                      type="text"
                      required
                      value={teamNameInput}
                      onChange={(e) => setTeamNameInput(e.target.value)}
                      placeholder="e.g. Kajal Arya"
                      className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-1.5 focus:ring-slate-900 h-9"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Mobile Number *
                    </label>
                    <input
                      id="team-mobile-input-field"
                      type="text"
                      required
                      maxLength={10}
                      value={teamMobile}
                      onChange={(e) => setTeamMobile(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="10-digit mobile"
                      className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-1.5 focus:ring-slate-900 h-9"
                    />
                  </div>
                </div>

                {/* Row 2: Role / Designation, Status AND TOTP Secret (3 columns) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Role / Designation *
                    </label>
                    <select
                      id="team-role-select-field"
                      className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl text-slate-805 font-semibold focus:outline-none focus:ring-1.5 focus:ring-slate-900 h-9"
                      value={teamRole}
                      onChange={(e) => setTeamRole(e.target.value)}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Manager">Manager</option>
                      <option value="Accountant">Accountant</option>
                      <option value="Operator">Operator</option>
                      <option value="HOD">HOD</option>
                      <option value="Assistant">Assistant</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Active Status
                    </label>
                    <select
                      className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-1.5 focus:ring-slate-900 h-9"
                      value={teamStatus}
                      onChange={(e) => setTeamStatus(e.target.value as any)}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Google Authenticator Key (totpSecret)
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={teamTotpSecret}
                      onChange={(e) => setTeamTotpSecret(e.target.value.toUpperCase().replace(/[^A-Z2-7]/g, ""))}
                      placeholder="Optional 16-Char Base32"
                      className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-1.5 focus:ring-slate-900 h-9 uppercase"
                    />
                  </div>
                </div>

                <button
                  id="add-team-member-btn"
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer uppercase"
                >
                  <Plus className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
              </form>
            </div>
          </div>

          {/* Members list & search under the form */}
          <div className="w-full space-y-4">
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
              <div className="relative w-full sm:w-72">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search team member name, mobile or role..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 font-semibold focus:outline-none focus:ring-1.5 focus:ring-slate-900"
                  value={teamSearchQuery}
                  onChange={(e) => {
                    setTeamSearchQuery(e.target.value);
                    setTeamCurrentPage(1);
                  }}
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <select
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-650 font-bold focus:outline-none cursor-pointer"
                  value={teamStatusFilter}
                  onChange={(e) => {
                    setTeamStatusFilter(e.target.value);
                    setTeamCurrentPage(1);
                  }}
                >
                  <option value="all">All States</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            {/* Team Grid Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-650 border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-mono tracking-wider">
                  <tr>
                    <th className="p-3">Team Member Name</th>
                    <th className="p-3 text-center">Mobile No</th>
                    <th className="p-3 text-center">Role / Designation</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">TOTP Secret Key</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedTeam.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-mono text-xs">
                        No team members matching your search query are recorded.
                      </td>
                    </tr>
                  ) : (
                    paginatedTeam.map((team) => {
                      const isEditing = editingTeamId === team.id;
                      return (
                        <tr key={team.id} className="hover:bg-slate-50/50 transition-colors">
                          {isEditing ? (
                            <>
                              <td className="p-2">
                                <input
                                  type="text"
                                  className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-semibold"
                                  value={editTeamNameInput}
                                  onChange={(e) => setEditTeamNameInput(e.target.value)}
                                />
                              </td>
                              <td className="p-2 text-center text-slate-800 font-bold">
                                <input
                                  type="text"
                                  maxLength={10}
                                  className="w-24 bg-white border border-slate-300 rounded text-center py-1 text-xs font-mono font-bold"
                                  value={editTeamMobile}
                                  onChange={(e) => setEditTeamMobile(e.target.value.replace(/[^0-9]/g, ""))}
                                />
                              </td>
                              <td className="p-2">
                                <select
                                  className="w-full bg-white border border-slate-300 rounded py-1 text-xs font-semibold"
                                  value={editTeamRole}
                                  onChange={(e) => setEditTeamRole(e.target.value)}
                                >
                                  <option value="Admin">Admin</option>
                                  <option value="Manager">Manager</option>
                                  <option value="Accountant">Accountant</option>
                                  <option value="Operator">Operator</option>
                                  <option value="HOD">HOD</option>
                                  <option value="Assistant">Assistant</option>
                                </select>
                              </td>
                              <td className="p-2 text-center">
                                <select
                                  className="w-24 bg-white border border-slate-300 rounded py-1 text-xs font-bold"
                                  value={editTeamStatus}
                                  onChange={(e) => setEditTeamStatus(e.target.value as any)}
                                >
                                  <option value="Active">Active</option>
                                  <option value="Inactive">Inactive</option>
                                </select>
                              </td>
                              <td className="p-2 text-center">
                                <input
                                  type="text"
                                  maxLength={16}
                                  placeholder="Auto-Generated"
                                  className="w-28 bg-white border border-slate-300 rounded text-center py-1 text-xs font-mono font-bold uppercase placeholder-slate-400"
                                  value={editTeamTotpSecret}
                                  onChange={(e) => setEditTeamTotpSecret(e.target.value.toUpperCase().replace(/[^A-Z2-7]/g, ""))}
                                />
                              </td>
                              <td className="p-2 text-right">
                                <div className="flex gap-1 justify-end">
                                  <button
                                    onClick={() => handleSaveEditTeam(team.id)}
                                    className="p-1.5 bg-emerald-100 hover:bg-emerald-250 text-emerald-700 rounded transition-colors cursor-pointer"
                                    title="Save changes"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingTeamId(null)}
                                    className="p-1.5 bg-red-100 hover:bg-red-200 text-red-650 rounded transition-colors cursor-pointer"
                                    title="Cancel"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 font-bold text-slate-800">
                                <span className={`inline-block h-2 w-2 rounded-full mr-2 ${team.status === "Active" ? "bg-emerald-500" : "bg-slate-300"}`} />
                                {team.name}
                              </td>
                              <td className="p-3 text-center font-mono font-semibold text-slate-600">{team.mobile || "-"}</td>
                              <td className="p-3 text-center">
                                <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                  {team.role}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                  team.status === "Active" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-500"
                                }`}>
                                  {team.status}
                                </span>
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-slate-600">
                                {team.totpSecret ? (
                                  <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] tracking-wider">
                                    {team.totpSecret}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-normal italic text-[10px]">Auto-Gen</span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex gap-1 justify-end">
                                  {deleteTeamConfirmId === team.id ? (
                                    <div className="flex items-center gap-1 bg-red-50 p-1 rounded border border-red-200 animate-pulse">
                                      <span className="text-[9px] text-red-700 font-bold">Sure?</span>
                                      <button
                                        onClick={() => {
                                          onDeleteTeamMaster(team.id);
                                          setDeleteTeamConfirmId(null);
                                        }}
                                        className="px-1.5 py-0.5 bg-red-600 hover:bg-red-750 text-white rounded text-[9px] font-bold uppercase transition-transform"
                                      >
                                        Delete
                                      </button>
                                      <button
                                        onClick={() => setDeleteTeamConfirmId(null)}
                                        className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] font-bold uppercase transition-transform"
                                      >
                                        No
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleStartEditTeam(team)}
                                        className="text-slate-550 hover:text-indigo-650 hover:bg-indigo-50 p-1.5 rounded transition-all cursor-pointer"
                                        title="Edit Team Member Card"
                                      >
                                        <Edit3 className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setDeleteTeamConfirmId(team.id)}
                                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-all cursor-pointer"
                                        title="Delete Member Account"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalTeamPages > 1 && (
              <div className="flex justify-between items-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-150">
                <span className="text-slate-500 text-xs">
                  Page <strong className="text-slate-755">{teamCurrentPage}</strong> of{" "}
                  <strong className="text-slate-755">{totalTeamPages}</strong>
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={goToPrevTeamPage}
                    disabled={teamCurrentPage === 1}
                    className="bg-white border border-slate-200 hover:border-indigo-400 py-1 px-2.5 text-xs rounded-lg transition-colors cursor-pointer text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    Previous
                  </button>
                  <button
                    onClick={goToNextTeamPage}
                    disabled={teamCurrentPage === totalTeamPages}
                    className="bg-white border border-slate-200 hover:border-indigo-400 py-1 px-2.5 text-xs rounded-lg transition-colors cursor-pointer text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          SUBTAB 4 VIEW: INTERACTIVE ITEM synonym/MAPPINGS (ENABLED)
          ========================================== */}
      {activeSubTab === "mappings" && (
        <div className="space-y-6 animate-fade-in">
          {/* Add Mapping rule form full width */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="bg-amber-50 p-1.5 rounded-lg text-amber-600">
                  <Plus className="h-4 w-4" />
                </div>
                <h3 className="font-extrabold text-xs text-slate-850 uppercase tracking-wider">
                  Create Synonym Mapping
                </h3>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Connect dialect synonyms or regional shorthand terms (A4 Bundles, Cotton T-Shirt L) directly to standardized main ledger items in your master catalogue.
              </p>

              <form onSubmit={handleAddMappingSubmit} className="space-y-4">
                {/* Row 1: Local / Synonym Name and Standardized Master Item (2 columns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Local / Synonym Name *
                    </label>
                    <input
                      id="mapping-local-input-field"
                      type="text"
                      required
                      value={mappingLocalName}
                      onChange={(e) => setMappingLocalName(e.target.value)}
                      placeholder="e.g. A4 Copier Pack"
                      className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-1.5 focus:ring-slate-900 h-9"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Standardized Master Item *
                    </label>
                    <select
                      id="mapping-master-select-field"
                      required
                      className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-1.5 focus:ring-slate-900 h-9"
                      value={mappingMasterName}
                      onChange={(e) => setMappingMasterName(e.target.value)}
                    >
                      <option value="">-- Choose Master Item --</option>
                      {masterItems.map(item => (
                        <option key={item.id} value={item.itemName}>{item.itemName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  id="add-synonym-mapping-btn"
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer uppercase"
                >
                  <Plus className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
              </form>
            </div>
          </div>

          {/* Synonym rules list under form in full width */}
          <div className="w-full space-y-4">
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div className="relative w-full sm:w-80">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Filter local or mapped standard item..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 font-semibold focus:outline-none focus:ring-1.5 focus:ring-slate-900"
                  value={mappingSearchQuery}
                  onChange={(e) => {
                    setMappingSearchQuery(e.target.value);
                    setMappingCurrentPage(1);
                  }}
                />
              </div>

              <span className="text-[10px] font-mono text-slate-400 uppercase">
                Active synonym dictionary rules
              </span>
            </div>

            {/* Tables */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-mono tracking-wider">
                  <tr>
                    <th className="p-3">Local Dialect Synonym</th>
                    <th className="p-3">Standard Master Catalog Item</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedMappings.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-400 font-mono text-xs">
                        No synonym mapping entries are currently compiled.
                      </td>
                    </tr>
                  ) : (
                    paginatedMappings.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-bold text-amber-700 font-mono">{m.localName}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-indigo-650" />
                            <span className="font-semibold text-slate-800">{m.masterName}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              onRemoveMapping(m.id);
                              alert("Mapping rule successfully deleted.");
                            }}
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-all cursor-pointer"
                            title="Delete Synonym Rule"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalMappingPages > 1 && (
              <div className="flex justify-between items-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-150">
                <span className="text-slate-500 text-xs">
                  Page <strong className="text-slate-755">{mappingCurrentPage}</strong> of{" "}
                  <strong className="text-slate-755">{totalMappingPages}</strong>
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={goToPrevMappingPage}
                    disabled={mappingCurrentPage === 1}
                    className="bg-white border border-slate-200 hover:border-indigo-400 py-1 px-2.5 text-xs rounded-lg transition-colors cursor-pointer text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    Previous
                  </button>
                  <button
                    onClick={goToNextMappingPage}
                    disabled={mappingCurrentPage === totalMappingPages}
                    className="bg-white border border-slate-200 hover:border-indigo-400 py-1 px-2.5 text-xs rounded-lg transition-colors cursor-pointer text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          SUBTAB 5 VIEW: LEDGER MASTER (NEW TAB)
          ========================================== */}
      {activeSubTab === "ledger" && (
        <div className="space-y-6 animate-fade-in">
          {/* Real-time Ledger Summary Statistics Panel */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-2xs">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Total Ledgers</span>
              <span className="text-lg font-black text-slate-850 mt-1 block">{ledgerMasters?.length || 0}</span>
            </div>
            <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-2xl shadow-2xs">
              <span className="text-[10px] font-mono font-bold text-indigo-500 uppercase block">Bank Accounts</span>
              <span className="text-lg font-black text-indigo-950 mt-1 block">
                {ledgerMasters?.filter(l => l.accountType === "Bank Account").length || 0}
              </span>
            </div>
            <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-2xl shadow-2xs">
              <span className="text-[10px] font-mono font-bold text-amber-600 uppercase block">Suppliers</span>
              <span className="text-lg font-black text-amber-950 mt-1 block">
                {ledgerMasters?.filter(l => l.accountType === "Supplier Account").length || 0}
              </span>
            </div>
            <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-2xl shadow-2xs">
              <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase block">Recipients</span>
              <span className="text-lg font-black text-emerald-950 mt-1 block">
                {ledgerMasters?.filter(l => l.accountType === "Recipient Account").length || 0}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Add or Edit Ledger Form */}
            <div className="xl:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="bg-emerald-50 p-1.5 rounded-lg text-emerald-600">
                  <Wallet className="h-4 w-4" />
                </div>
                <h3 className="font-extrabold text-xs text-slate-850 uppercase tracking-widest">
                  {editingLedgerId ? "Edit Ledger Account" : "Add Ledger Account"}
                </h3>
              </div>

              <form onSubmit={editingLedgerId ? (e) => {
                e.preventDefault();
                const matched = ledgerMasters.find(l => l.id === editingLedgerId);
                if (matched) {
                  handleSaveEditLedger(editingLedgerId, matched.createdAt);
                }
              } : handleAddLedgerSubmit} className="space-y-3.5">
                
                {/* Account Name */}
                <div>
                  <label className="block text-[10px] font-mono font-extrabold text-slate-500 uppercase mb-1">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    value={editingLedgerId ? editLedgerAccountName : ledgerAccountName}
                    onChange={(e) => editingLedgerId ? setEditLedgerAccountName(e.target.value) : setLedgerAccountName(e.target.value)}
                    placeholder="e.g. STATE BANK OF INDIA or SHREE BALAJI TRADERS"
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold"
                  />
                </div>

                {/* Account Type Option Selection Group */}
                <div>
                  <label className="block text-[10px] font-mono font-extrabold text-slate-500 uppercase mb-1">
                    Account Type *
                  </label>
                  <select
                    value={editingLedgerId ? editLedgerAccountType : ledgerAccountType}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      editingLedgerId ? setEditLedgerAccountType(val) : setLedgerAccountType(val);
                    }}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none font-bold bg-white"
                  >
                    <option value="Bank Account">Bank Account</option>
                    <option value="Supplier Account">Supplier Account</option>
                    <option value="Recipient Account">Recipient Account</option>
                  </select>
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-[10px] font-mono font-extrabold text-slate-500 uppercase mb-1">
                    Account/Card Number
                  </label>
                  <input
                    type="text"
                    value={editingLedgerId ? editLedgerAccountNumber : ledgerAccountNumber}
                    onChange={(e) => editingLedgerId ? setEditLedgerAccountNumber(e.target.value) : setLedgerAccountNumber(e.target.value)}
                    placeholder="e.g. 3394827163 or CREDIT CARD NO."
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-mono"
                  />
                </div>

                {/* Bank Name */}
                <div>
                  <label className="block text-[10px] font-mono font-extrabold text-slate-500 uppercase mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={editingLedgerId ? editLedgerBankName : ledgerBankName}
                    onChange={(e) => editingLedgerId ? setEditLedgerBankName(e.target.value) : setLedgerBankName(e.target.value)}
                    placeholder="e.g. HDFC BANK LTD."
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold"
                  />
                </div>

                {/* IFSC Code */}
                <div>
                  <label className="block text-[10px] font-mono font-extrabold text-slate-500 uppercase mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={editingLedgerId ? editLedgerIfscCode : ledgerIfscCode}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      editingLedgerId ? setEditLedgerIfscCode(val) : setLedgerIfscCode(val);
                    }}
                    placeholder="e.g. SBIN0001234"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-mono uppercase font-bold"
                  />
                </div>

                {/* GSTIN */}
                <div>
                  <label className="block text-[10px] font-mono font-extrabold text-slate-500 uppercase mb-1">
                    GSTIN / Tax ID
                  </label>
                  <input
                    type="text"
                    value={editingLedgerId ? editLedgerGstin : ledgerGstin}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      editingLedgerId ? setEditLedgerGstin(val) : setLedgerGstin(val);
                    }}
                    placeholder="e.g. 23AAAAA1111A1Z1"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-mono uppercase font-bold"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-[10px] font-mono font-extrabold text-slate-500 uppercase mb-1">
                    Contact Mobile
                  </label>
                  <input
                    type="text"
                    value={editingLedgerId ? editLedgerMobile : ledgerMobile}
                    onChange={(e) => editingLedgerId ? setEditLedgerMobile(e.target.value) : setLedgerMobile(e.target.value)}
                    placeholder="e.g. 8982147763"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-mono"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-[10px] font-mono font-extrabold text-slate-500 uppercase mb-1">
                    Business Address
                  </label>
                  <textarea
                    rows={2}
                    value={editingLedgerId ? editLedgerAddress : ledgerAddress}
                    onChange={(e) => editingLedgerId ? setEditLedgerAddress(e.target.value) : setLedgerAddress(e.target.value)}
                    placeholder="e.g. New Market, Bhopal"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-semibold resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  {editingLedgerId ? (
                    <>
                      <button
                        type="submit"
                        className="flex-1 text-xs bg-slate-900 hover:bg-slate-950 text-white font-bold py-2 px-3 rounded-xl transition-all cursor-pointer shadow-sm text-center"
                      >
                        Save Chages
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingLedgerId(null)}
                        className="flex-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-xl transition-all cursor-pointer text-center"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="submit"
                      className="w-full text-xs bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold py-2 px-3 rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      Create Ledger Account
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* RIGHT COLUMN: Ledger Listing & Interactive Search Section */}
            <div className="xl:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              
              {/* Filter controls headers */}
              <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={ledgerSearchQuery}
                    onChange={(e) => {
                      setLedgerSearchQuery(e.target.value);
                      setLedgerCurrentPage(1);
                    }}
                    placeholder="Search ledgers by account name, bank details, GSTIN, mobile..."
                    className="w-full pl-8.5 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase shrink-0">Filter:</span>
                  <select
                    value={ledgerTypeFilter}
                    onChange={(e) => {
                      setLedgerTypeFilter(e.target.value);
                      setLedgerCurrentPage(1);
                    }}
                    className="text-xs font-bold border border-slate-200 px-3 py-2 bg-white rounded-xl outline-none w-full md:w-auto"
                  >
                    <option value="all">All Ledgers</option>
                    <option value="Bank Account">Bank Accounts Only</option>
                    <option value="Supplier Account">Suppliers Only</option>
                    <option value="Recipient Account">Recipients Only</option>
                  </select>
                </div>
              </div>

              {/* Table Wrapper */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-widest">
                        <th className="py-2.5 px-4">Account details & Type</th>
                        <th className="py-2.5 px-4">Account / Bank details</th>
                        <th className="py-2.5 px-4 col-hidden-mobile">GSTIN / Contact</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {paginatedLedgers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-10 text-slate-400 font-medium">
                            <Wallet className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                            No Ledger Accounts found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedLedgers.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                            {/* Name & Type Badge */}
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 border-slate-300 leading-tight">
                                {l.accountName}
                              </div>
                              <div className="mt-1 flex items-center gap-1.5">
                                {l.accountType === "Bank Account" && (
                                  <span className="text-[9px] bg-indigo-100 text-indigo-755 border border-indigo-200 px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wider font-mono">
                                    Bank Account
                                  </span>
                                )}
                                {l.accountType === "Supplier Account" && (
                                  <span className="text-[9px] bg-amber-100 text-amber-755 border border-amber-200 px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wider font-mono">
                                    Supplier
                                  </span>
                                )}
                                {l.accountType === "Recipient Account" && (
                                  <span className="text-[9px] bg-emerald-100 text-emerald-755 border border-emerald-200 px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wider font-mono">
                                    Recipient
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Account No & Bank */}
                            <td className="py-3 px-4 font-mono">
                              {l.accountNumber ? (
                                <div className="text-slate-800 font-bold block bg-slate-100/60 px-1.5 py-0.5 rounded-lg border border-slate-200/50 w-fit">
                                  {l.accountNumber}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[10px]">No Account No.</span>
                              )}
                              {l.bankName && (
                                <div className="text-[10px] text-slate-500 font-sans mt-0.5 font-bold">
                                  {l.bankName} {l.ifscCode ? `(IFSC: ${l.ifscCode})` : ""}
                                </div>
                              )}
                            </td>

                            {/* GST & Phone details */}
                            <td className="py-3 px-4 col-hidden-mobile">
                              {l.gstin ? (
                                <div className="text-amber-755 font-mono font-bold tracking-wider">
                                  {l.gstin}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[10px] block">No GSTIN</span>
                              )}
                              {l.mobile && (
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  Ph: {l.mobile}
                                </div>
                              )}
                            </td>

                            {/* CRUD Control buttons */}
                            <td className="py-3 px-4 text-right">
                              {deleteLedgerConfirmId === l.id ? (
                                <div className="flex gap-1 items-center justify-end">
                                  <button
                                    onClick={() => handleDeleteLedger(l.id)}
                                    className="bg-red-500 hover:bg-red-650 text-white font-extrabold text-[10px] px-2 py-1 rounded-lg cursor-pointer"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setDeleteLedgerConfirmId(null)}
                                    className="bg-slate-100 text-slate-600 font-medium text-[10px] px-2 py-1 rounded-lg cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => handleStartEditLedger(l)}
                                    disabled={editingLedgerId !== null}
                                    className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded transition-colors cursor-pointer disabled:opacity-30"
                                    title="Edit Ledger account details"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteLedgerConfirmId(l.id)}
                                    disabled={editingLedgerId !== null}
                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors cursor-pointer disabled:opacity-30"
                                    title="Delete Ledger Account"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Row */}
              {totalLedgerPages > 1 && (
                <div className="flex justify-between items-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-150">
                  <span className="text-slate-500 text-xs">
                    Page <strong className="text-slate-755">{ledgerCurrentPage}</strong> of{" "}
                    <strong className="text-slate-755">{totalLedgerPages}</strong>
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={goToPrevLedgerPage}
                      disabled={ledgerCurrentPage === 1}
                      className="bg-white border border-slate-200 hover:border-indigo-400 py-1 px-2.5 text-xs rounded-lg transition-colors cursor-pointer text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                    >
                      Previous
                    </button>
                    <button
                      onClick={goToNextLedgerPage}
                      disabled={ledgerCurrentPage === totalLedgerPages}
                      className="bg-white border border-slate-200 hover:border-indigo-400 py-1 px-2.5 text-xs rounded-lg transition-colors cursor-pointer text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Client Deletion Confirmation Modal Overlay */}
      {deleteClientConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-150 max-w-md w-full p-6 space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-red-650">
              <div className="bg-red-50 p-2.5 rounded-full border border-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h4 className="font-bold text-slate-800 text-base">Client Delete Confirm</h4>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              Are you sure you want to delete the registered account for <strong className="text-slate-850">"{clientMasters.find(c => c.id === deleteClientConfirmId)?.name || 'this client'}"</strong>? 
              <br />
              <span className="text-xs text-red-500 font-medium mt-1.5 block">⚠️ This action cannot be revoked and will permanently delete the client.</span>
            </p>
            <div className="flex gap-2.5 justify-end pt-2">
              <button
                onClick={() => setDeleteClientConfirmId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                No, Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteClientMaster(deleteClientConfirmId);
                  setDeleteClientConfirmId(null);
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
