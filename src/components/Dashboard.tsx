import React, { useState } from "react";
import {
  CheckCircle,
  Trash2,
  AlertTriangle,
  Coins,
  TrendingUp,
  CheckSquare,
  Clock,
  Calendar,
  FileText,
  Search,
  PlusCircle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  FolderLock,
  Check
} from "lucide-react";
import { Bill, BillItem } from "../types";

interface DashboardProps {
  bills: Bill[];
  onApproveBill: (id: string) => void;
  onDeleteBill: (id: string) => void;
  onTabChange: (tab: string) => void;
  masterItems?: any[];
  onAddMapping?: (local: string, master: string) => void;
  onAddMasterItem?: (newItemData: any) => void;
}

export default function Dashboard({ 
  bills, 
  onApproveBill, 
  onDeleteBill, 
  onTabChange,
  masterItems = [],
  onAddMapping,
  onAddMasterItem
}: DashboardProps) {
  // Compute analytics
  const draftBills = bills.filter((b) => b.status === "Draft");
  const approvedBills = bills.filter((b) => b.status === "Approved");

  const totalScannedCount = bills.length;
  const totalTaxable = bills.reduce((sum, b) => sum + b.taxableAmountTotal, 0);
  const totalGST = bills.reduce((sum, b) => sum + b.gstAmountTotal, 0);
  const totalGrand = bills.reduce((sum, b) => sum + b.totalAmountTotal, 0);

  // States
  const [currentTab, setCurrentTab] = useState<"today" | "tomorrow" | "weekly" | "draft">("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});

  // Synonym mapping resolver states for unmapped items
  const [mappingResolveBill, setMappingResolveBill] = useState<Bill | null>(null);
  const [resolveMappings, setResolveMappings] = useState<Record<string, string>>({});
  const [newMasterItemsFields, setNewMasterItemsFields] = useState<Record<string, { group: string; unit: string; gstRate: string; hsn: string }>>({});

  // Form custom task insertion for interactive simulation
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskClient, setNewTaskClient] = useState("");
  const [newTaskWork, setNewTaskWork] = useState("");
  const [newTaskAmount, setNewTaskAmount] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM");

  // Local state databases to handle dynamic additions empty by default (no demo data)
  const [localCompletedToday, setLocalCompletedToday] = useState<any[]>([]);

  const [localTomorrowPending, setLocalTomorrowPending] = useState<any[]>([]);

  const [localWeeklyPending, setLocalWeeklyPending] = useState<any[]>([]);

  // Combined real-time dynamic approved state data
  const dynamicCompletedToday = [
    ...localCompletedToday,
    ...approvedBills.map((ab) => ({
      id: `INV-APP-${ab.id.split("-")[1] || ab.id}`,
      clientName: ab.supplierName,
      workType: `Invoice ${ab.invoiceNo} Approved Reconciliation`,
      value: `₹${ab.totalAmountTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      time: "Just Now",
      category: "Automated OCR Sync",
      approvedBy: ab.approvedBy || "Ajay Ji"
    }))
  ];

  // Toggle tasks checkbox
  const toggleTaskCheck = (taskId: string) => {
    setCheckedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  // Add standard task helper
  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskClient || !newTaskWork) return;

    const formattedAmount = newTaskAmount 
      ? (newTaskAmount.startsWith("₹") ? newTaskAmount : `₹${Number(newTaskAmount).toLocaleString("en-IN")}`)
      : "₹0";

    const newTaskObj = {
      id: `TSK-SIM-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: newTaskClient,
      workType: newTaskWork,
      dueDate: currentTab === "tomorrow" ? "Tomorrow, 04:00 PM" : "June 26, 2026",
      priority: newTaskPriority,
      estHours: "1 Hr",
      amount: formattedAmount,
      category: "Custom Task",
      status: "Scheduled"
    };

    if (currentTab === "tomorrow") {
      setLocalTomorrowPending([newTaskObj, ...localTomorrowPending]);
    } else if (currentTab === "weekly") {
      setLocalWeeklyPending([newTaskObj, ...localWeeklyPending]);
    } else {
      setLocalCompletedToday([
        {
          id: newTaskObj.id,
          clientName: newTaskObj.clientName,
          workType: newTaskObj.workType,
          value: newTaskObj.amount,
          time: "Just Now",
          category: "Compliance Log",
          approvedBy: "Ajay Ji"
        },
        ...localCompletedToday
      ]);
    }

    // Reset fields
    setNewTaskClient("");
    setNewTaskWork("");
    setNewTaskAmount("");
    setNewTaskPriority("MEDIUM");
    setShowAddTask(false);
  };

  // Filter tasks based on Search Query
  const getFilteredToday = () => {
    return dynamicCompletedToday.filter(
      (t) =>
        t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.workType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredTomorrow = () => {
    return localTomorrowPending.filter(
      (t) =>
        t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.workType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredWeekly = () => {
    return localWeeklyPending.filter(
      (t) =>
        t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.workType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredDrafts = () => {
    return draftBills.filter(
      (b) =>
        b.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Total lengths to show in cards
  const todayCount = dynamicCompletedToday.length;
  const tomorrowCount = localTomorrowPending.length;
  const weeklyCount = localWeeklyPending.length;
  const draftsCount = draftBills.length;

  return (
    <div className="space-y-6">
      
      {/* 4 Interactive Tab Cards Deck (Replaces static metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Tab 1: Today's Complete Work */}
        <button
          type="button"
          onClick={() => {
            setCurrentTab("today");
            setSearchQuery("");
            setSelectedTaskId(null);
          }}
          className={`text-left p-4 rounded-2xl flex flex-col justify-between shadow-xs border transition-all cursor-pointer relative overflow-hidden group ${
            currentTab === "today"
              ? "bg-gradient-to-br from-emerald-50/90 to-emerald-100/40 border-emerald-300 ring-2 ring-emerald-500/20"
              : "bg-white border-slate-200 hover:shadow-md hover:border-emerald-200"
          }`}
        >
          <div className="flex justify-between items-start text-slate-500 mb-2.5 w-full">
            <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase text-slate-400 group-hover:text-emerald-600 transition-colors">
              TODAY'S COMPLETED WORK
            </span>
            <div className={`p-1.5 rounded-lg transition-colors ${currentTab === "today" ? "bg-emerald-500 text-white" : "bg-emerald-50 text-emerald-600"}`}>
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black font-mono text-slate-900 mb-1 flex items-baseline gap-1">
              <span>{todayCount}</span>
              <span className="text-xs font-semibold text-slate-400 font-sans">Compliances Done</span>
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-medium font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{approvedBills.length} Invoices live reconciled</span>
            </div>
          </div>
          <div className={`absolute bottom-0 right-0 h-1 w-full bg-emerald-500 transition-transform duration-300 ${currentTab === "today" ? "scale-x-100" : "scale-x-0"}`} />
        </button>

        {/* Tab 2: Tomorrow's Pending Work */}
        <button
          type="button"
          onClick={() => {
            setCurrentTab("tomorrow");
            setSearchQuery("");
            setSelectedTaskId(null);
          }}
          className={`text-left p-4 rounded-2xl flex flex-col justify-between shadow-xs border transition-all cursor-pointer relative overflow-hidden group ${
            currentTab === "tomorrow"
              ? "bg-gradient-to-br from-blue-50/90 to-blue-100/40 border-blue-300 ring-2 ring-blue-500/20"
              : "bg-white border-slate-200 hover:shadow-md hover:border-blue-200"
          }`}
        >
          <div className="flex justify-between items-start text-slate-500 mb-2.5 w-full">
            <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase text-slate-400 group-hover:text-blue-600 transition-colors">
              TOMORROW'S PENDING WORK
            </span>
            <div className={`p-1.5 rounded-lg transition-colors ${currentTab === "tomorrow" ? "bg-blue-500 text-white" : "bg-blue-50 text-blue-600"}`}>
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black font-mono text-slate-900 mb-1 flex items-baseline gap-1">
              <span>{tomorrowCount}</span>
              <span className="text-xs font-semibold text-slate-400 font-sans">Tasks Pending</span>
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] text-blue-700 font-medium font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span>Advance checks & GSTR-2B</span>
            </div>
          </div>
          <div className={`absolute bottom-0 right-0 h-1 w-full bg-blue-500 transition-transform duration-300 ${currentTab === "tomorrow" ? "scale-x-100" : "scale-x-0"}`} />
        </button>

        {/* Tab 3: Weekly Pending Work */}
        <button
          type="button"
          onClick={() => {
            setCurrentTab("weekly");
            setSearchQuery("");
            setSelectedTaskId(null);
          }}
          className={`text-left p-4 rounded-2xl flex flex-col justify-between shadow-xs border transition-all cursor-pointer relative overflow-hidden group ${
            currentTab === "weekly"
              ? "bg-gradient-to-br from-indigo-50/90 to-indigo-100/40 border-indigo-300 ring-2 ring-indigo-500/20"
              : "bg-white border-slate-200 hover:shadow-md hover:border-indigo-200"
          }`}
        >
          <div className="flex justify-between items-start text-slate-500 mb-2.5 w-full">
            <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase text-slate-400 group-hover:text-indigo-600 transition-colors">
              WEEKLY PENDING WORK
            </span>
            <div className={`p-1.5 rounded-lg transition-colors ${currentTab === "weekly" ? "bg-indigo-500 text-white" : "bg-indigo-50 text-indigo-600"}`}>
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black font-mono text-slate-900 mb-1 flex items-baseline gap-1">
              <span>{weeklyCount}</span>
              <span className="text-xs font-semibold text-slate-400 font-sans">Filings Queue</span>
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] text-indigo-700 font-medium font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              <span>GSTR-9 & Advance estimate</span>
            </div>
          </div>
          <div className={`absolute bottom-0 right-0 h-1 w-full bg-indigo-500 transition-transform duration-300 ${currentTab === "weekly" ? "scale-x-100" : "scale-x-0"}`} />
        </button>

        {/* Tab 4: Drafted Data */}
        <button
          type="button"
          onClick={() => {
            setCurrentTab("draft");
            setSearchQuery("");
            setSelectedTaskId(null);
          }}
          className={`text-left p-4 rounded-2xl flex flex-col justify-between shadow-xs border transition-all cursor-pointer relative overflow-hidden group ${
            currentTab === "draft"
              ? "bg-gradient-to-br from-amber-50/90 to-amber-100/40 border-amber-300 ring-2 ring-amber-500/20"
              : "bg-white border-slate-200 hover:shadow-md hover:border-amber-200"
          }`}
        >
          <div className="flex justify-between items-start text-slate-500 mb-2.5 w-full">
            <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase text-slate-400 group-hover:text-amber-600 transition-colors">
              DRAFT COMPLIANCE DATA
            </span>
            <div className={`p-1.5 rounded-lg transition-colors ${currentTab === "draft" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-600"}`}>
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black font-mono text-slate-900 mb-1 flex items-baseline gap-1">
              <span>{draftsCount}</span>
              <span className="text-xs font-semibold text-slate-400 font-sans">Draft Bills</span>
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] text-amber-700 font-medium font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
              <span>Requires mapping or validation</span>
            </div>
          </div>
          <div className={`absolute bottom-0 right-0 h-1 w-full bg-amber-500 transition-transform duration-300 ${currentTab === "draft" ? "scale-x-100" : "scale-x-0"}`} />
        </button>

      </div>

      {/* SEARCH BAR & GENERAL ACTIONS ROW */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={`Search from ${
              currentTab === "today"
                ? "Today's Work Log..."
                : currentTab === "tomorrow"
                ? "Tomorrow's Schedule..."
                : currentTab === "weekly"
                ? "Weekly Compliance..."
                : "Draft Invoices..."
            }`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
          />
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {currentTab !== "draft" && (
            <button
              onClick={() => setShowAddTask(!showAddTask)}
              className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Simulate Add Task</span>
            </button>
          )}
          <button
            onClick={() => onTabChange("scan")}
            className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>OCR Scanner Gateway</span>
          </button>
        </div>
      </div>

      {/* TASK SIMULATION CREATOR COLLAPSIBLE */}
      {showAddTask && (
        <form onSubmit={handleAddNewTask} className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl shadow-inner animate-fadeIn">
          <h4 className="text-xs font-extrabold text-slate-700 flex items-center gap-1 uppercase tracking-wider mb-3">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Add Simulated Task for {currentTab.toUpperCase()}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] text-slate-455 font-bold uppercase tracking-wider mb-1">Client/Supplier Name</label>
              <input
                type="text"
                required
                value={newTaskClient}
                onChange={(e) => setNewTaskClient(e.target.value)}
                placeholder="e.g. Radhey Trading Co."
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-455 font-bold uppercase tracking-wider mb-1">Work Description</label>
              <input
                type="text"
                required
                value={newTaskWork}
                onChange={(e) => setNewTaskWork(e.target.value)}
                placeholder="e.g. Complete e-Way verification"
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-455 font-bold uppercase tracking-wider mb-1">Amount / Liability Value</label>
              <input
                type="text"
                value={newTaskAmount}
                onChange={(e) => setNewTaskAmount(e.target.value)}
                placeholder="e.g. 248000 (No symbol)"
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-455 font-bold uppercase tracking-wider mb-1">Priority</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-amber-400 focus:outline-none"
              >
                <option value="CRITICAL">Critical (🔴)</option>
                <option value="HIGH">High (🟠)</option>
                <option value="MEDIUM">Medium (🟡)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200/60">
            <button
              type="button"
              onClick={() => setShowAddTask(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs hover:bg-slate-50 cursor-pointer font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs cursor-pointer"
            >
              ✓ Ingest to Queue
            </button>
          </div>
        </form>
      )}

      {/* DYNAMIC COMPREHENSIVE WORK CHART / TABLE DISPLAY */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Work Chart Header with Active Status indicator */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-amber-500 animate-pulse" />
            <h3 className="font-extrabold text-xs tracking-wider text-slate-800 uppercase">
              WORK COMPLIANCE LEDGER: {
                currentTab === "today"
                  ? "Today's Completed Chart"
                  : currentTab === "tomorrow"
                  ? "Tomorrow's Pending Chart"
                  : currentTab === "weekly"
                  ? "Weekly Planned Chart"
                  : "Draft Storage Table"
              }
            </h3>
          </div>
          <span className="text-[10px] bg-slate-100 border border-slate-250 font-mono text-slate-500 px-2 py-0.5 rounded-lg font-bold">
            Total Displaying: {
              currentTab === "today"
                ? getFilteredToday().length
                : currentTab === "tomorrow"
                ? getFilteredTomorrow().length
                : currentTab === "weekly"
                ? getFilteredWeekly().length
                : getFilteredDrafts().length
            } Rows
          </span>
        </div>

        {/* WORK CHART SHEETS */}
        <div className="overflow-x-auto">
          {(() => {
            if (currentTab === "today") {
              const rows = getFilteredToday();
              if (rows.length === 0) {
                return (
                  <div className="py-20 text-center bg-slate-50 border-t border-slate-100">
                    <CheckCircle className="h-9 w-9 text-emerald-600 mx-auto mb-2 animate-bounce" />
                    <h4 className="text-xs font-black text-slate-600 uppercase">No completed tasks logged!</h4>
                    <p className="text-[11px] text-slate-455 mt-1">Approve scanned invoices or push task data logs to record completion entries today.</p>
                  </div>
                );
              }
              return (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 font-mono text-[10px] text-slate-455 uppercase font-extrabold">
                      <th className="py-3 px-4 w-12 text-center">Tick</th>
                      <th className="py-3 px-4">Task / Entry ID</th>
                      <th className="py-3 px-4">Client / Supplier Name</th>
                      <th className="py-3 px-4">Compliance / Work Action</th>
                      <th className="py-3 px-4">Valuation Value</th>
                      <th className="py-3 px-4">Log Time</th>
                      <th className="py-3 px-4">Officer/Bot</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {rows.map((r) => {
                      const isChecked = !!checkedTasks[r.id];
                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedTaskId(selectedTaskId === r.id ? null : r.id)}
                          className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                            selectedTaskId === r.id ? "bg-amber-50/20" : ""
                          }`}
                        >
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleTaskCheck(r.id)}
                              className="h-4 w-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              {r.id}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-800 font-bold block">{r.clientName}</span>
                          </td>
                          <td className="py-3 px-4 font-normal text-slate-600">{r.workType}</td>
                          <td className="py-3 px-4 font-mono text-emerald-700 font-bold">{r.value}</td>
                          <td className="py-3 px-4 text-slate-455 font-mono">{r.time}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-655 px-2 py-0.5 rounded-md text-[10px] font-mono">
                              👤 {r.approvedBy}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full text-[9px] tracking-wide uppercase">
                              ✓✓ Success
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            }

            if (currentTab === "tomorrow") {
              const rows = getFilteredTomorrow();
              if (rows.length === 0) {
                return (
                  <div className="py-20 text-center bg-slate-50 border-t border-slate-100">
                    <CheckCircle className="h-9 w-9 text-blue-500 mx-auto mb-2" />
                    <h4 className="text-xs font-black text-slate-600 uppercase">Tomorrow is looking perfectly clean!</h4>
                    <p className="text-[11px] text-slate-455 mt-1">No scheduled tasks are booked. Breathe easy, audit loops are idle.</p>
                  </div>
                );
              }
              return (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 font-mono text-[10px] text-slate-455 uppercase font-extrabold">
                      <th className="py-3 px-4 w-12 text-center">Tick</th>
                      <th className="py-3 px-4">Task ID</th>
                      <th className="py-3 px-4">Client Name</th>
                      <th className="py-3 px-4">Pending Check Action</th>
                      <th className="py-3 px-4">Budget Impact</th>
                      <th className="py-3 px-4">Target Deadline</th>
                      <th className="py-3 px-4">Hours Est</th>
                      <th className="py-3 px-4 text-center">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {rows.map((r) => {
                      const isChecked = !!checkedTasks[r.id];
                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedTaskId(selectedTaskId === r.id ? null : r.id)}
                          className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                            selectedTaskId === r.id ? "bg-amber-50/20" : ""
                          }`}
                        >
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleTaskCheck(r.id)}
                              className="h-4 w-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono bg-blue-50 border border-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              {r.id}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-800 font-bold block">{r.clientName}</span>
                          </td>
                          <td className="py-3 px-4 font-normal text-slate-600">
                            <span className="text-indigo-600 text-[10px] bg-indigo-50 px-1.5 py-0.5 rounded font-mono font-bold mr-1">{r.category}</span>
                            {r.workType}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-800 font-bold">{r.amount}</td>
                          <td className="py-3 px-4 text-amber-700 font-semibold font-mono">{r.dueDate}</td>
                          <td className="py-3 px-4 text-slate-455 font-mono">{r.estHours}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide inline-block ${
                              r.priority === "CRITICAL"
                                ? "bg-red-150 text-red-800 bg-red-100"
                                : r.priority === "HIGH"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}>
                              {r.priority}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            }

            if (currentTab === "weekly") {
              const rows = getFilteredWeekly();
              if (rows.length === 0) {
                return (
                  <div className="py-20 text-center bg-slate-50 border-t border-slate-100">
                    <CheckCircle className="h-9 w-9 text-indigo-500 mx-auto mb-2" />
                    <h4 className="text-xs font-black text-slate-600 uppercase">Weekly list is empty.</h4>
                    <p className="text-[11px] text-slate-455 mt-1">Excellent job! All periodic audits are locked and synchronized.</p>
                  </div>
                );
              }
              return (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 font-mono text-[10px] text-slate-455 uppercase font-extrabold">
                      <th className="py-3 px-4 w-12 text-center">Tick</th>
                      <th className="py-3 px-4">Task ID</th>
                      <th className="py-3 px-4">Client / Business Name</th>
                      <th className="py-3 px-4">Filing Action Schedule</th>
                      <th className="py-3 px-4">Estimated Liability</th>
                      <th className="py-3 px-4">Target Date</th>
                      <th className="py-3 px-4">Effort</th>
                      <th className="py-3 px-4 text-center">Status Badge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {rows.map((r) => {
                      const isChecked = !!checkedTasks[r.id];
                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedTaskId(selectedTaskId === r.id ? null : r.id)}
                          className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                            selectedTaskId === r.id ? "bg-amber-50/20" : ""
                          }`}
                        >
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleTaskCheck(r.id)}
                              className="h-4 w-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono bg-purple-50 border border-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              {r.id}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-800 font-bold block">{r.clientName}</span>
                          </td>
                          <td className="py-3 px-4 font-normal text-slate-600">
                            <span className="text-teal-600 text-[10px] bg-teal-50 px-1.5 py-0.5 rounded font-mono font-bold mr-1">{r.category}</span>
                            {r.workType}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-800 font-bold">{r.amount}</td>
                          <td className="py-3 px-4 text-slate-700 font-mono">{r.dueDate}</td>
                          <td className="py-3 px-4 text-slate-455 font-mono">{r.estHours}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 text-blue-800 uppercase border border-blue-200">
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            }

            if (currentTab === "draft") {
              const rows = getFilteredDrafts();
              if (rows.length === 0) {
                return (
                  <div className="py-20 text-center bg-slate-50 border-t border-slate-100 border-b border-slate-100">
                    <CheckCircle className="h-9 w-9 text-emerald-600 mx-auto mb-2 animate-bounce" />
                    <h4 className="text-xs font-black text-slate-600 uppercase">Draft queue fully reconciled!</h4>
                    <p className="text-[11px] text-slate-455 mt-1">Excellent! No invoices are held in current draft queue. Scan new bills instantly.</p>
                  </div>
                );
              }
              return (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 font-mono text-[10px] text-slate-455 uppercase font-extrabold">
                      <th className="py-3 px-4 w-12 text-center">Tick</th>
                      <th className="py-3 px-4">OCR ID</th>
                      <th className="py-3 px-4">Vendor Supplier</th>
                      <th className="py-3 px-4">Invoice No / Date</th>
                      <th className="py-3 px-4">Item Elements summary</th>
                      <th className="py-3 px-4 text-right">Taxable Total</th>
                      <th className="py-3 px-4 text-right">GST Sum</th>
                      <th className="py-3 px-4 text-right">Invoice Sum</th>
                      <th className="py-3 px-4 text-center">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {rows.map((b) => {
                      const isChecked = !!checkedTasks[b.id];
                      const mainItem = b.items[0];
                      const totalItemsCount = b.items.length;
                      const hasLowScore = b.confidenceScoreItems < 90 || b.confidenceScoreSupplier < 90;

                      return (
                        <tr
                          key={b.id}
                          onClick={() => setSelectedTaskId(selectedTaskId === b.id ? null : b.id)}
                          className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                            b.isMathematicalError
                              ? "bg-red-50/20 hover:bg-red-50/40"
                              : selectedTaskId === b.id
                              ? "bg-amber-50/20"
                              : ""
                          }`}
                        >
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleTaskCheck(b.id)}
                              className="h-4 w-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono bg-amber-50 border border-amber-150 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              {b.id}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-800 font-bold block">{b.supplierName}</span>
                            <span className="text-[10px] text-slate-455 font-mono">GSTIN: {b.supplierGSTIN}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-normal">
                            <div className="font-mono text-slate-900 font-semibold">{b.invoiceNo}</div>
                            <div className="text-[10px] text-slate-455">{b.date}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="max-w-xs space-y-1">
                              {b.items.map((it, idx) => (
                                <div key={idx} className="text-[10px] font-mono text-slate-600 truncate flex items-center gap-1.5 bg-slate-50 px-1.5 py-0.5 border border-slate-150 rounded">
                                  <span className="font-semibold text-slate-800">{it.localName}</span>
                                  <span>➡</span>
                                  <span className={it.mappedName.includes("Requires") ? "text-amber-600 font-bold" : "text-teal-700 font-bold"}>{it.mappedName}</span>
                                </div>
                              ))}
                              {b.isMathematicalError && (
                                <span className="text-[9px] font-bold font-mono text-red-600 block bg-red-100 px-1.5 rounded w-max">
                                  ⚠️ Math Mismatch detected
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-700 font-medium">
                            ₹{b.taxableAmountTotal.toLocaleString("en-IN", { minimumFractionDigits: 1 })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-indigo-700 font-semibold">
                            ₹{b.gstAmountTotal.toLocaleString("en-IN", { minimumFractionDigits: 1 })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-900 font-black">
                            ₹{b.totalAmountTotal.toLocaleString("en-IN", { minimumFractionDigits: 1 })}
                          </td>
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => onDeleteBill(b.id)}
                                className="p-1 text-slate-400 hover:text-red-500 bg-white border border-slate-200 rounded hover:bg-slate-50 cursor-pointer shadow-3xs"
                                title="Discard draft"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  const hasUnmapped = b.items.some(it => it.mappedName.includes("Requires"));
                                  if (hasUnmapped) {
                                    setMappingResolveBill(b);
                                    const init: Record<string, string> = {};
                                    b.items.forEach(it => {
                                      if (it.mappedName.includes("Requires")) {
                                        const match = masterItems?.find(mi => mi.itemName.toLowerCase() === it.localName.toLowerCase() || mi.printName.toLowerCase() === it.localName.toLowerCase());
                                        if (match) {
                                          init[it.localName] = match.itemName;
                                        } else {
                                          init[it.localName] = `CREATE_NEW:${it.localName}`;
                                        }
                                      }
                                    });
                                    setResolveMappings(init);
                                    
                                    const fieldsInit: Record<string, { group: string; unit: string; gstRate: string; hsn: string }> = {};
                                    b.items.forEach(it => {
                                      if (it.mappedName.includes("Requires")) {
                                        fieldsInit[it.localName] = {
                                          group: "General Goods",
                                          unit: "Pcs.",
                                          gstRate: `${it.gstRate || 18}%`,
                                          hsn: it.hsnCode || "69101000"
                                        };
                                      }
                                    });
                                    setNewMasterItemsFields(fieldsInit);
                                  } else {
                                    onApproveBill(b.id);
                                  }
                                }}
                                className={`px-2 py-1 text-[10px] font-bold rounded shadow-3xs cursor-pointer flex items-center gap-1 leading-none ${
                                  b.items.some(it => it.mappedName.includes("Requires"))
                                    ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
                                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                                }`}
                              >
                                {b.items.some(it => it.mappedName.includes("Requires")) ? (
                                  <>
                                    <Sparkles className="h-3 w-3 text-amber-100 inline shrink-0" />
                                    <span>Map Item & Approve</span>
                                  </>
                                ) : (
                                  <span>✓ Approve</span>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            }
          })()}
        </div>

        {/* WORK CHART CARD OVERVIEW ACTIONS PANEL (TRIGGERS WHEN ANY ROW IS CLICKED OR CHECKED) */}
        {selectedTaskId && (
          <div className="bg-slate-50 border-t border-slate-250 p-5 animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <span className="text-[10px] bg-slate-100 border border-slate-250 text-slate-600 px-2 py-0.5 rounded font-mono font-bold uppercase">
                  Details View for Row ID {selectedTaskId}
                </span>
                <h4 className="text-sm font-extrabold text-slate-950">
                  {(() => {
                    const rowToday = dynamicCompletedToday.find((t) => t.id === selectedTaskId);
                    const rowTom = localTomorrowPending.find((t) => t.id === selectedTaskId);
                    const rowWeb = localWeeklyPending.find((t) => t.id === selectedTaskId);
                    const rowDft = draftBills.find((b) => b.id === selectedTaskId);
                    return rowToday?.clientName || rowTom?.clientName || rowWeb?.clientName || rowDft?.supplierName || "Multiple selected";
                  })()}
                </h4>
                <p className="text-xs text-slate-500 font-normal">
                  {(() => {
                    const rowToday = dynamicCompletedToday.find((t) => t.id === selectedTaskId);
                    const rowTom = localTomorrowPending.find((t) => t.id === selectedTaskId);
                    const rowWeb = localWeeklyPending.find((t) => t.id === selectedTaskId);
                    const rowDft = draftBills.find((b) => b.id === selectedTaskId);
                    
                    if (rowToday) {
                      return `Completed today: ${rowToday.workType} under category ${rowToday.category}. Safe certified by Officer ${rowToday.approvedBy}.`;
                    }
                    if (rowTom) {
                      return `Tomorrow's pending priority compliance: ${rowTom.workType}. Estimated effort needed: ${rowTom.estHours}. Priority is ${rowTom.priority}.`;
                    }
                    if (rowWeb) {
                      return `Weekly plan item: ${rowWeb.workType}. Due date is ${rowWeb.dueDate}. Current operational status is ${rowWeb.status}.`;
                    }
                    if (rowDft) {
                      return `Draft OCR scanned transaction of ${rowDft.supplierName} with Invoice ${rowDft.invoiceNo}. Value of ${rowDft.totalAmountTotal.toLocaleString("en-IN")} INR with GST liabilities ₹${rowDft.gstAmountTotal}.`;
                    }
                    return "Select any single task row to outline compliance logs, audit comments, values & checklist details.";
                  })()}
                </p>
              </div>

              {/* Action buttons in Detail card */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    // Quick mark as verified/processed toggle
                    toggleTaskCheck(selectedTaskId);
                  }}
                  className={`px-3.5 py-2 border rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 bg-white ${
                    checkedTasks[selectedTaskId] ? "border-amber-300 text-amber-800 bg-amber-50" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <CheckSquare className="h-4 w-4" />
                  <span>{checkedTasks[selectedTaskId] ? "Toggled (Selected)" : "Tick/Mark Action"}</span>
                </button>
                
                {draftBills.some(b => b.id === selectedTaskId) && (
                  <button
                    type="button"
                    onClick={() => {
                      const dbill = draftBills.find(b => b.id === selectedTaskId);
                      if (dbill) {
                        const hasUnmapped = dbill.items.some(it => it.mappedName.includes("Requires"));
                        if (hasUnmapped) {
                          setMappingResolveBill(dbill);
                          const init: Record<string, string> = {};
                          dbill.items.forEach(it => {
                            if (it.mappedName.includes("Requires")) {
                              const match = masterItems?.find(mi => mi.itemName.toLowerCase() === it.localName.toLowerCase() || mi.printName.toLowerCase() === it.localName.toLowerCase());
                              if (match) {
                                init[it.localName] = match.itemName;
                              } else {
                                init[it.localName] = `CREATE_NEW:${it.localName}`;
                              }
                            }
                          });
                          setResolveMappings(init);
                          
                          const fieldsInit: Record<string, { group: string; unit: string; gstRate: string; hsn: string }> = {};
                          dbill.items.forEach(it => {
                            if (it.mappedName.includes("Requires")) {
                              fieldsInit[it.localName] = {
                                group: "General Goods",
                                unit: "Pcs.",
                                gstRate: `${it.gstRate || 18}%`,
                                hsn: it.hsnCode || "69101000"
                              };
                            }
                          });
                          setNewMasterItemsFields(fieldsInit);
                        } else {
                          onApproveBill(selectedTaskId);
                          setSelectedTaskId(null);
                        }
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                      draftBills.find(b => b.id === selectedTaskId)?.items.some(it => it.mappedName.includes("Requires"))
                        ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white"
                    }`}
                  >
                    {draftBills.find(b => b.id === selectedTaskId)?.items.some(it => it.mappedName.includes("Requires")) ? (
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-100" />
                        Map & Approve
                      </span>
                    ) : (
                      "✓ Quick Approve"
                    )}
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => setSelectedTaskId(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-205 border border-slate-200 text-slate-800 hover:bg-slate-100 text-xs font-bold font-mono transition-all cursor-pointer"
                >
                  Close Panel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SYNONYM MAPPINGS RESOLUTION MODAL */}
        {mappingResolveBill && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-scaleIn">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-5 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-lg bg-white/20 border border-white/20">
                    <Sparkles className="h-5 w-5 text-amber-200 animate-spin-slow" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wide">Sync & Approve Resolver</h3>
                    <p className="text-[11px] text-amber-100 font-medium">Configure item mappings for {mappingResolveBill.supplierName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMappingResolveBill(null)}
                  className="text-white/80 hover:text-white font-extrabold text-sm font-mono cursor-pointer bg-black/20 hover:bg-black/35 w-6 h-6 rounded-full flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div className="bg-amber-50 rounded-xl border border-amber-200 p-3.5 flex gap-3 text-xs leading-relaxed text-amber-900">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Unmapped items detected!</span> To ensure perfect compliance with your Master Accounting Registry, please associate or register these scanned items before final ledger sync.
                  </div>
                </div>

                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {mappingResolveBill.items.filter(it => it.mappedName.includes("Requires")).map((it, idx) => {
                    const chosen = resolveMappings[it.localName] || "";
                    const isNew = chosen.startsWith("CREATE_NEW:");
                    
                    return (
                      <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-slate-400 font-mono block uppercase">Scanned Local Name</span>
                            <span className="text-xs font-extrabold text-slate-900">{it.localName}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-755 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-bold">
                              GST {it.gstRate}%
                            </span>
                            <span className="text-[9px] bg-slate-200 border border-slate-300 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold ml-1">
                              HSN {it.hsnCode || "General"}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                            Associate with Master Synonym:
                          </label>
                          <select
                            value={chosen}
                            onChange={(e) => {
                              const val = e.target.value;
                              setResolveMappings(prev => ({ ...prev, [it.localName]: val }));
                            }}
                            className="w-full text-xs p-2.5 bg-white border border-slate-250 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-600 cursor-pointer"
                          >
                            <option value={`CREATE_NEW:${it.localName}`}>
                              🆕 + Create & Register as NEW Master Item
                            </option>
                            {masterItems && masterItems.length > 0 && (
                              <optgroup label="Select Existing Master Items">
                                {masterItems.map(mi => (
                                  <option key={mi.id} value={mi.itemName}>
                                    📦 {mi.itemName} ({mi.group} - HSN {mi.hsn})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        </div>

                        {/* If user opts to create a new Master Item, let them review the fields */}
                        {isNew && (
                          <div className="grid grid-cols-2 gap-2.5 p-3 bg-amber-50/50 border border-amber-105 border-amber-200 rounded-lg text-xs">
                            <div className="col-span-2 text-[10px] text-amber-800 font-bold uppercase tracking-wider">
                              🛠️ New Master Registry Specifications:
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 block font-bold">Group Segment</span>
                              <input 
                                type="text"
                                value={newMasterItemsFields[it.localName]?.group || "General"}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setNewMasterItemsFields(prev => ({
                                    ...prev,
                                    [it.localName]: { ...prev[it.localName], group: val }
                                  }));
                                }}
                                className="w-full p-1 border border-slate-200 rounded font-mono text-[11px] bg-white text-slate-800 focus:outline-none focus:border-amber-500"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 block font-bold">UOM Unit</span>
                              <input 
                                type="text"
                                value={newMasterItemsFields[it.localName]?.unit || "Pcs."}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setNewMasterItemsFields(prev => ({
                                    ...prev,
                                    [it.localName]: { ...prev[it.localName], unit: val }
                                  }));
                                }}
                                className="w-full p-1 border border-slate-200 rounded font-mono text-[11px] bg-white text-slate-800 focus:outline-none focus:border-amber-500"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 block font-bold">GST Standard Rate</span>
                              <input 
                                type="text"
                                value={newMasterItemsFields[it.localName]?.gstRate || `${it.gstRate || 18}%`}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setNewMasterItemsFields(prev => ({
                                    ...prev,
                                    [it.localName]: { ...prev[it.localName], gstRate: val }
                                  }));
                                }}
                                className="w-full p-1 border border-slate-200 rounded font-mono text-[11px] bg-white text-slate-800 focus:outline-none focus:border-amber-500"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 block font-bold">HSN Code</span>
                              <input 
                                type="text"
                                value={newMasterItemsFields[it.localName]?.hsn || it.hsnCode || "69101000"}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setNewMasterItemsFields(prev => ({
                                    ...prev,
                                    [it.localName]: { ...prev[it.localName], hsn: val }
                                  }));
                                }}
                                className="w-full p-1 border border-slate-200 rounded font-mono text-[11px] bg-white text-slate-800 focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>
                        )}
                        
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setMappingResolveBill(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 border border-slate-200 bg-white rounded-lg transition-all cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const unmappedItems = mappingResolveBill.items.filter(it => it.mappedName.includes("Requires"));
                    
                    unmappedItems.forEach(it => {
                      const selection = resolveMappings[it.localName];
                      if (!selection) return;

                      if (selection.startsWith("CREATE_NEW:")) {
                        const fields = newMasterItemsFields[it.localName] || {
                          group: "General Goods",
                          unit: "Pcs.",
                          gstRate: `${it.gstRate || 18}%`,
                          hsn: it.hsnCode || "69101000"
                        };

                        if (onAddMasterItem) {
                          onAddMasterItem({
                            itemName: it.localName,
                            printName: it.localName,
                            group: fields.group,
                            unit: fields.unit,
                            gstRate: fields.gstRate,
                            hsn: fields.hsn
                          });
                        }
                        
                        if (onAddMapping) {
                          onAddMapping(it.localName, it.localName);
                        }
                      } else {
                        if (onAddMapping) {
                          onAddMapping(it.localName, selection);
                        }
                      }
                    });

                    onApproveBill(mappingResolveBill.id);
                    setMappingResolveBill(null);
                    setSelectedTaskId(null);
                    
                    alert(`Radhe Govind! Synonyms verified, registered successfully, and invoice synced to Google Sheets active rows history!`);
                  }}
                  className="px-5 py-2 text-xs bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer font-bold"
                >
                  <Check className="h-4 w-4" /> Save Mappings & Approve
                </button>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
