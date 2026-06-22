import React, { useState } from "react";
import { FileDown, CheckCircle, Clock, Database, Cloud, RefreshCw, Layers, Users, Cpu } from "lucide-react";
import { SheetRow } from "../types";

interface GoogleSheetSyncProps {
  syncedRows: SheetRow[];
  onForceSync: () => void;
  syncing: boolean;
  onResetApp: () => void;
  onSyncGoogleSheetData: (url: string) => Promise<void>;
  googleSheetUrl: string;
}

export default function GoogleSheetSync({
  syncedRows,
  onForceSync,
  syncing,
  onResetApp,
  onSyncGoogleSheetData,
  googleSheetUrl,
}: GoogleSheetSyncProps) {
  const [sheetUrl, setSheetUrl] = useState(googleSheetUrl);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  React.useEffect(() => {
    setSheetUrl(googleSheetUrl);
  }, [googleSheetUrl]);

  const triggerDirectSync = async () => {
    setSyncStatus("syncing");
    try {
      await onSyncGoogleSheetData(sheetUrl);
      setSyncStatus("success");
      setTimeout(() => setSyncStatus("idle"), 5000);
    } catch (err) {
      setSyncStatus("error");
      setTimeout(() => setSyncStatus("idle"), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* DIRECT GOOGLE SHEET SYNC CARD */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-4 rounded-xl shadow-sm text-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 text-white p-2 rounded-lg shadow-sm">
            <Cloud className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[9px] bg-indigo-200/50 text-indigo-800 font-mono font-bold px-1.5 py-0.2 rounded border border-indigo-300 uppercase tracking-wider block w-fit">
              Secure Drive Integration
            </span>
            <h3 className="font-extrabold text-xs text-slate-900 uppercase mt-0.5">
              Business Master Direct Google Sheet Sync Panel
            </h3>
          </div>
        </div>

        <p className="text-[11px] text-slate-650 leading-relaxed max-w-3xl">
          Your Gmail account (<code>arya.aisakhi@gmail.com</code>) holds the <strong>Business Master Google Sheet</strong> on Google Drive. 
          The synchronizer automatically parses data from the Google Sheet across four specific tabs:
        </p>

        {/* COMPACT CHIPS INSTEAD OF BIG CARDS */}
        <div className="flex flex-wrap gap-2 pt-1">
          <div className="bg-white/80 border border-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-2xs">
            <div className="bg-indigo-100/70 p-1 rounded-md text-indigo-700">
              <Users className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[8px] font-mono font-bold text-slate-400 uppercase">Tab 1</p>
              <h4 className="text-[11px] font-bold text-slate-800">Client Master Details</h4>
            </div>
          </div>
          <div className="bg-white/80 border border-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-2xs">
            <div className="bg-indigo-100/70 p-1 rounded-md text-indigo-700">
              <Users className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[8px] font-mono font-bold text-slate-400 uppercase">Tab 2</p>
              <h4 className="text-[11px] font-bold text-slate-800">Team Master Members</h4>
            </div>
          </div>
          <div className="bg-white/80 border border-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-2xs">
            <div className="bg-indigo-100/70 p-1 rounded-md text-indigo-700">
              <Layers className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[8px] font-mono font-bold text-slate-400 uppercase">Tab 3</p>
              <h4 className="text-[11px] font-bold text-slate-800">Item Synonym Mapping</h4>
            </div>
          </div>
          <div className="bg-white/80 border border-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-2xs">
            <div className="bg-indigo-100/70 p-1 rounded-md text-indigo-700">
              <Cpu className="h-3.5 w-3.5 animate-pulse" />
            </div>
            <div>
              <p className="text-[8px] font-mono font-bold text-slate-400 uppercase">Tab 4</p>
              <h4 className="text-[11px] font-bold text-slate-800">Crawler Boat Configs</h4>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-indigo-100/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1">
            <label className="text-[9px] font-mono font-bold text-indigo-700 block mb-0.5 uppercase tracking-wide">
              Target Spreadsheet Live URL:
            </label>
            <input
              id="google-sheet-fixed-url-input"
              type="text"
              required
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="Google Spreadsheet URL"
              className="w-full bg-white border border-indigo-200 text-xs px-2.5 py-1 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-1.5 focus:ring-indigo-500 h-8.5 shadow-2xs"
            />
          </div>

          <button
            id="sync-google-sheet-action-button"
            type="button"
            onClick={triggerDirectSync}
            disabled={syncing || syncStatus === "syncing"}
            className="bg-indigo-600 hover:bg-indigo-750 disabled:opacity-50 text-white font-extrabold text-[10px] px-4 py-1.5 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 self-end h-8.5 cursor-pointer uppercase shrink-0"
          >
            {syncStatus === "syncing" ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Synchronizing...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Direct Sync Google Sheet</span>
              </>
            )}
          </button>
        </div>

        {syncStatus === "success" && (
          <p className="text-[10px] font-semibold text-emerald-700 font-mono animate-pulse bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
            ✓ Radhe Radhe! Direct synchronization completed! Clients, team members, and synonyms were fetched and loaded successfully.
          </p>
        )}
        {syncStatus === "error" && (
          <p className="text-[10px] font-semibold text-red-700 font-mono animate-pulse bg-red-50 px-2 py-1 rounded-md border border-red-200">
            ⚠ Note: Loaded safe pre-populated data records since the private Google Sheet is locked. Link sharing must be set as: 'Anyone with the link can view'.
          </p>
        )}
      </div>

      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-slate-800 space-y-5">
        {/* Header and Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="h-6 w-6 text-indigo-600" />
              <h3 className="font-bold text-sm tracking-widest text-slate-850 uppercase">
                Invoice Master Ledger Sync Panel
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mt-1">
              As soon as you approve a draft bill, it is automatically written directly to that client's respective individual master ledger spreadsheet (e.g., <code>Master_Accounting_Sheet - [Client Name]</code>) on Google Drive.
            </p>
          </div>

          <button
            id="sync-sheets-force-btn"
            onClick={onForceSync}
            disabled={syncing || syncedRows.length === 0}
            className="bg-indigo-600 hover:bg-indigo-750 disabled:opacity-40 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-center cursor-pointer"
          >
            {syncing ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" /> Force Sync Master Ledger
              </>
            )}
          </button>
        </div>

      {/* Sheets Table Grid */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <span className="text-slate-500 font-mono text-[10px] uppercase font-bold">
              Spreadsheets Ledger: Multi-Client Active Master_Accounting_Sheets
            </span>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold">
              Auto Sync Status: Active
            </span>
          </div>
        </div>

        {/* Outer Scroll Area */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] tracking-wider text-slate-500 uppercase font-mono">
                <th className="p-3 text-center">S.No</th>
                <th className="p-3">Vendor Name (Client / Seller)</th>
                <th className="p-3">GSTIN</th>
                <th className="p-3">Invoice No</th>
                <th className="p-3">Date</th>
                <th className="p-3">Items Summary (Mapped Names)</th>
                <th className="p-3 text-right">Taxable Amt (₹)</th>
                <th className="p-3 text-right">GST Rate</th>
                <th className="p-3 text-right">GST (₹)</th>
                <th className="p-3 text-right">Total Amount (₹)</th>
                <th className="p-3 text-center">Approved By</th>
                <th className="p-3 text-center">Sync Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {syncedRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-slate-400 font-mono text-xs">
                    No rows synced to Google Sheet yet. Approve scanned invoices or tax bills to populate this ledger!
                  </td>
                </tr>
              ) : (
                syncedRows.map((row) => (
                  <tr
                    key={row.sNo}
                    className="hover:bg-slate-50/50 transition-all text-slate-705"
                  >
                    <td className="p-3 text-center font-mono text-slate-400">{row.sNo}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{row.vendorName}</div>
                      <div className="text-[9.5px] text-indigo-600 font-mono font-bold mt-1 bg-indigo-50/50 border border-indigo-100 px-1.5 py-0.5 rounded w-fit">
                        📂 Master_Accounting_Sheet - {row.vendorName.split("(")[0].replace(/[^a-zA-Z0-9\s]/g, "").trim()}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-500 text-[10px]">{row.gstin || "N/A (CASH RECORD)"}</td>
                    <td className="p-3 font-mono text-slate-600">{row.invoiceNo}</td>
                    <td className="p-3 font-mono">{row.date}</td>
                    <td className="p-3">
                      <span className="text-[11px] text-teal-800 font-mono font-bold bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                        {row.itemSummary}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-slate-850">
                      {row.taxableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono text-purple-700 font-bold">{row.gstRateSummary}</td>
                    <td className="p-3 text-right font-mono text-slate-600">
                      {row.gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-amber-700">
                      {row.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full font-mono">
                        👤 {row.approvedBy}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {row.syncStatus === "Success" ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-mono font-bold">
                          <CheckCircle className="h-3 w-3" /> synced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-mono font-bold animate-pulse">
                          <Clock className="h-3 w-3" /> pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-4 border border-slate-200 rounded-xl text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-indigo-600 shrink-0" />
          <span>
            Total Ledger Rows Postings: <strong className="text-slate-800 font-mono">{syncedRows.length} rows synced</strong>
          </span>
        </div>
        <p className="text-[10px] font-mono leading-relaxed italic text-left sm:text-right sm:max-w-md text-slate-500">
          *Security Note: Google Account authentication credentials and service accounts are securely stored on our backend secrets server.
        </p>
      </div>

      {/* Database Settings, Dynamic Sync Map, and Full Reset block */}
      <div className="border border-slate-200 rounded-2xl bg-slate-50/50 p-6 space-y-6">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            ⚙️ Database Settings & Dynamic Sync Map
          </h4>
          <p className="text-xs text-slate-600 mt-1">
            Configure automated daily sync triggers, webhook paths, or clear system cache for Project Radha.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold text-amber-700 tracking-wide uppercase font-mono block">Dynamic Sync Trigger</span>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Daily Scheduled Sync</span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-250 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                Enabled
              </span>
            </div>
            <p className="text-[10px] text-slate-450 leading-normal">
              Server automatically fires headless crawler cron sequence daily at 02:00 AM IST to fetch new corporate partner bills.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold text-indigo-700 tracking-wide uppercase font-mono block">Synchronization Map</span>
            <div className="space-y-1 text-[10px] text-slate-600 font-mono">
              <div className="flex justify-between">
                <span>Local DB Status:</span>
                <span className="text-slate-800 font-bold">In-Sync</span>
              </div>
              <div className="flex justify-between">
                <span>Endpoint Node:</span>
                <span className="text-slate-800 font-bold">DYNAMIC_CLIENT_ROUTING</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-450 leading-normal">
              Direct live mapping channels verified under authenticated security rules.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] font-bold text-red-600 tracking-wide uppercase font-mono block">Danger Zone Control</span>
              <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                Erase scanned drafts, mappings rules, and synced records to reset the system state back to default defaults.
              </p>
            </div>
            {!showResetConfirm ? (
              <button
                id="full-app-reset-btn"
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[10px] py-2 rounded-lg border border-red-200 transition-all cursor-pointer uppercase text-center font-mono"
              >
                ☢️ Full App Reset
              </button>
            ) : (
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-[10px] text-red-600 font-extrabold text-center font-mono uppercase animate-pulse">Are you absolutely sure?</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetApp();
                      setShowResetConfirm(false);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] py-2 rounded-lg cursor-pointer text-center font-mono uppercase transition-all"
                  >
                    Yes, Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold text-[10px] py-2 rounded-lg border border-slate-300 cursor-pointer text-center font-mono uppercase transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
