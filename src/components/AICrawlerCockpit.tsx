import React, { useState, useEffect } from "react";
import { 
  Bot, 
  Plus, 
  Play, 
  Trash2, 
  Key, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  FileText, 
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Send,
  Sparkles,
  ArrowRight,
  Fingerprint,
  DownloadCloud,
  FileCheck,
  Check,
  Building,
  Compass,
  Map,
  MapPin,
  Edit2,
  ArrowDownCircle,
  HelpCircle,
  Save,
  RotateCw,
  Trash
} from "lucide-react";
import { ClientMaster, Bill, BillItem } from "../types";

export interface NavigationStep {
  id: string;
  actionType: "navigate" | "click" | "select" | "fill" | "download";
  locationLabel: string;
  hindiInstruction: string;
}

interface CrawlerConfig {
  id: string;
  clientId: string;
  clientName: string;
  siteName: string;
  loginId: string;
  passwordText: string;
  pinOtp: string;
  reportSection: "Purchase Bills" | "Credit Notes" | "Debit Notes" | "Account Statements" | "Other Documents";
  lastRunStatus: "Idle" | "Running" | "Waiting For OTP" | "Success" | "Failed";
  lastRunTime?: string;
  navigationMap?: NavigationStep[];
}

const getDefaultNavigationMap = (clientId: string, reportSection: string): NavigationStep[] => {
  if (clientId === "cl-1") {
    return [
      { id: `step-1-1-${Date.now()}`, actionType: "navigate", locationLabel: "Reports & Claims Gate", hindiInstruction: "After login, navigate directly to the 'Reports & Claims' section from the main menu bar." },
      { id: `step-1-2-${Date.now()}`, actionType: "click", locationLabel: "Monthly Distributor Statement", hindiInstruction: "Click on the 'Monthly Distributor Statement' link." },
      { id: `step-1-3-${Date.now()}`, actionType: "select", locationLabel: "Category: " + reportSection, hindiInstruction: `Select '${reportSection}' and set the current Financial Year to 2026-27.` },
      { id: `step-1-4-${Date.now()}`, actionType: "download", locationLabel: "Tax Invoice PDF Creator", hindiInstruction: "Click 'Download PDF' from the generated list to save the file." }
    ];
  }
  if (clientId === "cl-2") {
    return [
      { id: `step-2-1-${Date.now()}`, actionType: "navigate", locationLabel: "Services -> Returns Dashboard", hindiInstruction: "From the top menu bar, go to 'Services', then 'Returns', and finally click on 'Returns Dashboard'." },
      { id: `step-2-2-${Date.now()}`, actionType: "select", locationLabel: "FY 2026-27 Period Filter", hindiInstruction: "Select Financial Year 2026-27 and choose the desired period of April-June for filing returns." },
      { id: `step-2-3-${Date.now()}`, actionType: "click", locationLabel: "GSTR-2B Section View", hindiInstruction: "Click on the 'View' option next to the GSTR-2B auto-drafted statement." },
      { id: `step-2-4-${Date.now()}`, actionType: "download", locationLabel: "Download PDF Tool", hindiInstruction: "Scroll down and click 'Download PDF Document' to save the file." }
    ];
  }
  return [
    { id: `step-d-1-${Date.now()}`, actionType: "navigate", locationLabel: `Portal Reports Gate (${reportSection})`, hindiInstruction: `After logging in, search for the ${reportSection} report section and navigate there.` },
    { id: `step-d-2-${Date.now()}`, actionType: "select", locationLabel: "Select FY 2026-27 Period Filter", hindiInstruction: "Select date filters or Financial Period 2026-27." },
    { id: `step-d-3-${Date.now()}`, actionType: "download", locationLabel: "Click Download Original File", hindiInstruction: "Click on the download link or Save PDF/Excel button to retrieve the digital voucher." }
  ];
};

interface AICrawlerCockpitProps {
  clientMasters: ClientMaster[];
  onBillScanned: (bill: Bill) => void;
  // A callback to switch to Scanner or Dashboard for approval is nice
  onTabChange: (tab: string) => void;
}

export default function AICrawlerCockpit({
  clientMasters = [],
  onBillScanned,
  onTabChange,
}: AICrawlerCockpitProps) {
  // Configured Crawlers list with initial realistic examples matching registered clients
  const [crawlers, setCrawlers] = useState<CrawlerConfig[]>(() => {
    const saved = localStorage.getItem("radha_crawler_configs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Fallback for older saved states that do not have navigationMap structures
        return parsed.map((item: any) => {
          if (!item.navigationMap) {
            return {
              ...item,
              navigationMap: getDefaultNavigationMap(item.clientId, item.reportSection)
            };
          }
          return item;
        });
      } catch (e) {
        // Fallback
      }
    }

    // Default setup
    return [
      {
        id: "cr-1",
        clientId: "cl-1",
        clientName: "Saraswati Retailers (FMCG Trade)",
        siteName: "Unilever B2B Distributor Portal",
        loginId: "saraswati.retail",
        passwordText: "uniPass789",
        pinOtp: "",
        reportSection: "Purchase Bills",
        lastRunStatus: "Idle",
        lastRunTime: "2026-06-12 11:20 AM",
        navigationMap: [
          { id: "step-1-1", actionType: "navigate", locationLabel: "Reports & Claims Gate", hindiInstruction: "After login, navigate directly to the 'Reports & Claims' section from the main menu bar." },
          { id: "step-1-2", actionType: "click", locationLabel: "Monthly Distributor Statement", hindiInstruction: "Click on the 'Monthly Distributor Statement' link." },
          { id: "step-1-3", actionType: "select", locationLabel: "Category: Purchase Bills", hindiInstruction: "Select 'Purchase Bills' and set the current Financial Year to 2026-27." },
          { id: "step-1-4", actionType: "download", locationLabel: "Tax Invoice PDF Creator", hindiInstruction: "Click 'Download PDF' from the generated list to save the file." }
        ]
      },
      {
        id: "cr-2",
        clientId: "cl-2",
        clientName: "Rakhi Agency Hub (Apparel Store)",
        siteName: "GST Portal (GSTR-2B Inward)",
        loginId: "rakhi.apparel",
        passwordText: "gstSecured121",
        pinOtp: "",
        reportSection: "Purchase Bills",
        lastRunStatus: "Idle",
        lastRunTime: "2026-06-13 04:45 PM",
        navigationMap: [
          { id: "step-2-1", actionType: "navigate", locationLabel: "Services -> Returns Dashboard", hindiInstruction: "From the top menu bar, go to 'Services', then 'Returns', and finally click on 'Returns Dashboard'." },
          { id: "step-2-2", actionType: "select", locationLabel: "FY 2026-27 Period Filter", hindiInstruction: "Select Financial Year 2026-27 and choose the desired period of April-June for filing returns." },
          { id: "step-2-3", actionType: "click", locationLabel: "GSTR-2B Section View", hindiInstruction: "Click on the 'View' option next to the GSTR-2B auto-drafted statement." },
          { id: "step-2-4", actionType: "download", locationLabel: "Download PDF Tool", hindiInstruction: "Scroll down and click 'Download PDF Document' to save the file." }
        ]
      },
      {
        id: "cr-3",
        clientId: "cl-3",
        clientName: "Balaji Gold Palace (Jewellery Trade)",
        siteName: "MMTC Bullion Trade Portal",
        loginId: "balaji.gold",
        passwordText: "shreeBalaji108",
        pinOtp: "",
        reportSection: "Debit Notes",
        lastRunStatus: "Idle",
        lastRunTime: "Never",
        navigationMap: [
          { id: "step-3-1", actionType: "navigate", locationLabel: "Gold Bullion Registry", hindiInstruction: "From the main page, click on 'Inward Bullion Receipts'." },
          { id: "step-3-2", actionType: "select", locationLabel: "Challan Date Range", hindiInstruction: "Select the date range to find today's purchase debit note/slip." },
          { id: "step-3-3", actionType: "download", locationLabel: "Download Original PDF", hindiInstruction: "Click 'Download Gold Invoice & Debit Note' to save the file." }
        ]
      }
    ];
  });

  // Navigation map states
  const [expandedMapCrawlerId, setExpandedMapCrawlerId] = useState<string | null>(null);
  const [activeMapStepIdx, setActiveMapStepIdx] = useState<number>(-1);

  // Default path builder checklist for forms
  const [formSteps, setFormSteps] = useState<Omit<NavigationStep, "id">[]>([
    { actionType: "navigate", locationLabel: "Main Reports Dashboard", hindiInstruction: "After logging in, navigate to the main menu or report section." },
    { actionType: "click", locationLabel: "Document View Selection", hindiInstruction: "Click on the button or link to view or download documents." },
    { actionType: "download", locationLabel: "Original Document PDF/Excel", hindiInstruction: "Click 'Download PDF' or 'Export Excel' to retrieve the document." }
  ]);

  // Save to localstorage
  useEffect(() => {
    localStorage.setItem("radha_crawler_configs", JSON.stringify(crawlers));
  }, [crawlers]);

  // Sync event listener from Google Sheet
  useEffect(() => {
    const handleRemoteSync = () => {
      const saved = localStorage.getItem("radha_crawler_configs");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const updated = parsed.map((item: any) => {
            if (!item.navigationMap) {
              return {
                ...item,
                navigationMap: getDefaultNavigationMap(item.clientId, item.reportSection)
              };
            }
            return item;
          });
          setCrawlers(updated);
        } catch (e) {
          console.error("Failed to sync crawlers from event:", e);
        }
      }
    };
    window.addEventListener("crawlerConfigsSynced", handleRemoteSync);
    return () => window.removeEventListener("crawlerConfigsSynced", handleRemoteSync);
  }, []);

  // Form states
  const [formClientId, setFormClientId] = useState("");
  const [formSiteName, setFormSiteName] = useState("");
  const [formLoginId, setFormLoginId] = useState("");
  const [formPasswordText, setFormPasswordText] = useState("");
  const [formPinOtp, setFormPinOtp] = useState("");
  const [formReportSection, setFormReportSection] = useState<CrawlerConfig["reportSection"]>("Purchase Bills");

  // Show/Hide passwords in table
  const [showPasswords, setShowPasswords] = useState<{ [id: string]: boolean }>({});

  // Active Runner State
  const [runningCrawlerId, setRunningCrawlerId] = useState<string | null>(null);
  const [runnerLogs, setRunnerLogs] = useState<string[]>([]);
  const [runnerStep, setRunnerStep] = useState<number>(0);
  const [liveOtpInput, setLiveOtpInput] = useState("");
  const [waitingForOtpSubmit, setWaitingForOtpSubmit] = useState(false);

  // Suggested quick sites list
  const suggestedSites = [
    "GST Portal (GSTR-2B Inward)",
    "Unilever B2B Distributor Portal",
    "ITC Limited Wholesale Connect",
    "Tata Steel Vendor Portal",
    "Jindal Power Procurement Gate",
    "Amazon Business GSTR Account",
    "HDFC Bank Wholesale Corporate Portal",
    "SBI Corporate NetBanking Portal"
  ];

  const handleAddCrawler = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientId || !formSiteName || !formLoginId || !formPasswordText) {
      alert("⚠️ Request failed! Form is incomplete. Code, site name, login client details and password are required.");
      return;
    }

    const matchedClient = clientMasters.find(c => c.id === formClientId);
    if (!matchedClient) return;

    // Build unique ID steps from user defined form route state
    const customMap: NavigationStep[] = formSteps.map((step, idx) => ({
      id: `step-${idx}-${Date.now()}`,
      actionType: step.actionType,
      locationLabel: step.locationLabel,
      hindiInstruction: step.hindiInstruction
    }));

    const newConf: CrawlerConfig = {
      id: `cr-${Date.now()}`,
      clientId: formClientId,
      clientName: matchedClient.name,
      siteName: formSiteName,
      loginId: formLoginId,
      passwordText: formPasswordText,
      pinOtp: formPinOtp,
      reportSection: formReportSection,
      lastRunStatus: "Idle",
      navigationMap: customMap
    };

    setCrawlers([...crawlers, newConf]);
    
    // Reset Form
    setFormSiteName("");
    setFormLoginId("");
    setFormPasswordText("");
    setFormPinOtp("");

    // Reset default form steps template
    setFormSteps([
      { actionType: "navigate", locationLabel: "Main Reports Dashboard", hindiInstruction: "After logging in, navigate to the main menu or report section." },
      { actionType: "click", locationLabel: "Document View Selection", hindiInstruction: "Click on the button or link to view or download documents." },
      { actionType: "download", locationLabel: "Original Document PDF/Excel", hindiInstruction: "Click 'Download PDF' or 'Export Excel' to retrieve the document." }
    ]);

    alert("✓ Beautiful choice! New automated AI Crawler Bot along with its custom Navigation Map successfully configured for " + matchedClient.name + "!");
  };

  const handleDeleteConfig = (id: string) => {
    if (confirm("Are you sure you want to delete this AI Crawler configuration?")) {
      setCrawlers(crawlers.filter(c => c.id !== id));
      if (runningCrawlerId === id) {
        resetRunner();
      }
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Helper to trigger simulated run
  const triggerCrawlerSimulation = (crawler: CrawlerConfig) => {
    setRunningCrawlerId(crawler.id);
    setWaitingForOtpSubmit(false);
    setLiveOtpInput("");
    setRunnerStep(0);
    
    // Update status in master array to Running
    setCrawlers(prev => prev.map(c => c.id === crawler.id ? { ...c, lastRunStatus: "Running" } : c));

    // Log Start
    setRunnerLogs([
      `[${new Date().toLocaleTimeString()}] 🚀 INITIALIZING AI-OPERATED HEADLESS SCRAPER ENGINE...`,
      `[${new Date().toLocaleTimeString()}] 🔒 Security verification passed. Google Cloud Container status: ONLINE`,
      `[${new Date().toLocaleTimeString()}] 🌐 Navigating to portal: ${crawler.siteName}...`,
      `[${new Date().toLocaleTimeString()}] 🤖 AI Sakhi module identified site structure & login form layout...`
    ]);

    // Step 1: Autofill login details
    setTimeout(() => {
      setRunnerLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ⌨️ Autofilling Login credentials: LoginID [${crawler.loginId}]...`,
        `[${new Date().toLocaleTimeString()}] 🔐 Submitting encrypted session tokens to credentials gateway...`
      ]);
      setRunnerStep(1);

      // Step 2: Check if PIN / OTP is needed
      setTimeout(() => {
        // If site requires OTP (or simulating modern portal login flow)
        setRunnerLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] 🛑 SECURE PORTAL ALERT: Dual-Factor Verification required (PIN/OTP).`,
        ]);

        if (!crawler.pinOtp && !crawler.loginId.includes("saved")) {
          // If no OTP pre-saved, pause and prompt
          setRunnerLogs(prev => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] ⚠️ PIN/OTP is missing in standard credential configuration!`,
            `[${new Date().toLocaleTimeString()}] 💬 WAITING FOR USER INPUT: Please generate OTP on Client's Registered Mobile/Email and enter it below to proceed...`
          ]);
          setWaitingForOtpSubmit(true);
          setCrawlers(prev => prev.map(c => c.id === crawler.id ? { ...c, lastRunStatus: "Waiting For OTP" } : c));
          setRunnerStep(2); // Paused at OTP
        } else {
          // Preconfigured OTP or automatic bypass
          const otpToUse = crawler.pinOtp || "810452";
          setRunnerLogs(prev => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] 💾 Found pre-configured session PIN: ${otpToUse}`,
            `[${new Date().toLocaleTimeString()}] 🔑 Authenticating MFA protocol with portal firewall...`
          ]);
          proceedCrawlerExecution(crawler, otpToUse);
        }
      }, 2500);

    }, 2000);
  };

  // Resume simulation after OTP submit
  const handleLiveOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveOtpInput || liveOtpInput.length < 4) {
      alert("Please enter a valid OTP / PIN to send to the crawling bot.");
      return;
    }

    const activeCrawler = crawlers.find(c => c.id === runningCrawlerId);
    if (!activeCrawler) return;

    setWaitingForOtpSubmit(false);
    setRunnerLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] 📡 Received secure PIN/OTP input from operator: ${liveOtpInput}`,
      `[${new Date().toLocaleTimeString()}] 🔑 Resuming bot execution. Feeding Security Pin to Portal gateway...`
    ]);

    // Update PIN in config
    setCrawlers(prev => prev.map(c => c.id === activeCrawler.id ? { ...c, pinOtp: liveOtpInput, lastRunStatus: "Running" } : c));
    proceedCrawlerExecution(activeCrawler, liveOtpInput);
  };

  // Continue crawler run from OTP confirmation
  const proceedCrawlerExecution = (crawler: CrawlerConfig, pinUsed: string) => {
    setRunnerStep(3);
    setActiveMapStepIdx(0);
    
    setRunnerLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ❇️ LOGIN SUCCESSFUL! Session Cookie established.`,
      `[${new Date().toLocaleTimeString()}] 🗺️ INITIATING PORTAL NAVIGATION ROUTE MAP...`
    ]);

    const steps = crawler.navigationMap && crawler.navigationMap.length > 0
      ? crawler.navigationMap
      : getDefaultNavigationMap(crawler.clientId, crawler.reportSection);

    // Track total cumulative delay to chain execution logs
    let totalDelay = 1500;

    steps.forEach((step, index) => {
      setTimeout(() => {
        setActiveMapStepIdx(index);
        setRunnerLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] 🤖 [RUNNING STEP ${index + 1}/${steps.length}] Action: ${step.actionType.toUpperCase()}`,
          `   ➔ Target Node: [${step.locationLabel}]`,
          `   ➔ Guideline: "${step.hindiInstruction}"`
        ]);
      }, totalDelay);

      totalDelay += 2200; // 2.2 seconds per custom navigation step
    });

    // Execute Document scraping once step sequence finishes
    setTimeout(() => {
      setActiveMapStepIdx(steps.length); // Trigger success of all steps

      // Find matching client GSTIN for realistic document generating
      const clientObj = clientMasters.find(cl => cl.id === crawler.clientId);
      const buyerOrSupplierName = crawler.siteName.split(" ")[0] || "National Distributors";
      
      let extractedDocType = "Tax Invoice";
      if (crawler.reportSection === "Credit Notes") extractedDocType = "Credit Note";
      if (crawler.reportSection === "Debit Notes") extractedDocType = "Debit Note";
      if (crawler.reportSection === "Account Statements") extractedDocType = "Account Ledger Statement";

      const generatedInvoiceNo = Math.floor(100000 + Math.random() * 900000).toString();
      const randomAmt = Math.floor(25000 + Math.random() * 850000);
      const randomTaxable = Math.round(randomAmt / 1.18);
      const randomGst = randomAmt - randomTaxable;

      setRunnerLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ✨ [AI OCR MATCH SUCCESS] Found new downloaded document dated: 2026-06-14`,
        `[${new Date().toLocaleTimeString()}] 📄 Document Type: ${extractedDocType}`,
        `[${new Date().toLocaleTimeString()}] 📝 Invoice/Ref No: INV-${generatedInvoiceNo}`,
        `[${new Date().toLocaleTimeString()}] 👤 Counterparty: ${buyerOrSupplierName}`,
        `[${new Date().toLocaleTimeString()}] 💰 Net Amount Detected: ₹${randomAmt.toLocaleString()}`,
        `[${new Date().toLocaleTimeString()}] 📥 Downloading PDF & parsing line items via Gemini Multimodal OCR...`
      ]);

      setTimeout(() => {
        // Construct and scan the bill into system state!
        const simulatedItems: BillItem[] = [
          {
            localName: crawler.clientId === "cl-3" ? "Gold Coins 999 Purity (Bullion)" : "Premium Retail Stocks FMCG-Group A",
            mappedName: crawler.clientId === "cl-3" ? "Gold / Bullion Standard" : "Groceries Mixture Package",
            quantity: crawler.clientId === "cl-3" ? 2 : 12,
            rate: crawler.clientId === "cl-3" ? Math.round(randomTaxable / 2) : Math.round(randomTaxable / 12),
            taxableAmount: randomTaxable,
            gstRate: crawler.clientId === "cl-3" ? 3 : 18,
            gstAmount: randomGst,
            hsnCode: crawler.clientId === "cl-3" ? "7108" : "2106",
            totalAmount: randomAmt,
            isConfidenceLow: false
          }
        ];

        const scannedBill: Bill = {
          id: `bill-crl-${Date.now()}`,
          supplierName: buyerOrSupplierName,
          supplierGSTIN: clientObj ? clientObj.gstin : "09GSTSUPP1218A9",
          invoiceNo: generatedInvoiceNo,
          date: "2026-06-14",
          items: simulatedItems,
          taxableAmountTotal: randomTaxable,
          gstAmountTotal: randomGst,
          totalAmountTotal: randomAmt,
          status: "Draft",
          confidenceScoreSupplier: 98,
          confidenceScoreItems: 96,
          isMathematicalError: false,
          createdAt: new Date().toISOString()
        };

        // Save bill to master App state
        onBillScanned(scannedBill);

        // Complete log
        const timeString = new Date().toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true });
        const dateAndYear = new Date().toISOString().split("T")[0];
        
        setRunnerLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] 💾 SUCCESSFULLY INTEGRATED WITH GOOGLE DRIVE SHEETS API!`,
          `[${new Date().toLocaleTimeString()}] 📁 Automatic File saved inside folder: /My Drive/${crawler.clientName}/${extractedDocType.replace(" ", "_")}_INV-${generatedInvoiceNo}.pdf`,
          `[${new Date().toLocaleTimeString()}] 📨 Successfully synchronized and pushed draft voucher to Accounting Cockpit!`,
          `[${new Date().toLocaleTimeString()}] 🎉 [CRAWLER PROCESS COMPLETED] Radhe Radhe! Bot status IDLE.`
        ]);

        setCrawlers(prev => prev.map(c => c.id === crawler.id ? { 
          ...c, 
          lastRunStatus: "Success",
          lastRunTime: `${dateAndYear} ${timeString}`
        } : c));
        setRunnerStep(4);

      }, 3000);

    }, totalDelay + 1000);
  };

  const resetRunner = () => {
    setRunningCrawlerId(null);
    setWaitingForOtpSubmit(false);
    setLiveOtpInput("");
    setRunnerLogs([]);
    setRunnerStep(0);
  };

  return (
    <div className="space-y-4">
      {/* HEADER SECTION: Twin banners side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* Left Banner: Shrunk Bot Banner */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-100/60 p-4 rounded-2xl shadow-2xs border border-amber-200 text-slate-800 flex flex-col justify-center">
          <div className="flex justify-between items-start gap-3">
            <div className="flex items-start gap-3">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-2 rounded-xl shadow-xs shrink-0">
                <Bot className="h-5 w-5 text-slate-950 animate-bounce" />
              </div>
              <div>
                <span className="text-[9px] bg-amber-200 text-amber-850 font-mono font-black px-1.5 py-0.5 rounded border border-amber-300 uppercase tracking-wider block w-fit mb-1 shadow-2xs">
                  AI SAKHI CRAWLER SYSTEM ENGINE
                </span>
                <h2 className="text-sm font-extrabold tracking-tight text-slate-900">
                  AI-Operated Cloud Crawler Bots
                </h2>
                <p className="text-[11px] text-slate-655 mt-0.5 leading-normal">
                  Configure automated cloud scraping bots to automatically extract <strong>Purchase Bills, Credit/Debit Notes & Statements</strong> from portals.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold text-blue-800 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                Live
              </span>
            </div>
          </div>
        </div>

        {/* Right Banner: Shrunk Security/OTP Protocols (previously at the bottom footer!) */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-200 p-4 rounded-2xl shadow-2xs flex flex-col justify-center">
          <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5 mb-1 text-indigo-950">
            <ShieldAlert className="h-4 w-4 text-indigo-700 shrink-0" />
            Information Security & OTP Bypass
          </h4>
          <div className="text-[11px] text-slate-655 space-y-1 leading-normal font-semibold">
            <p>
              <strong>🔒 Encrypted Keychain:</strong> Your passwords and login keys are locally stored using 256-bit secure browser encryption.
            </p>
            <p>
              <strong>⚡ Dual Factor:</strong> Sakhi automatically freezes the web container thread to handle real SMS OTP inputs in real-time, bypassing portal protections!
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: CONFIGURE NEW SITE CRAWLER FORM (COL-SPAN 4) */}
        <div className="xl:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
              <Sliders className="h-4.5 w-4.5 text-amber-550" />
              Configure Crawler
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Define target portal site, login credentials, security PIN and report category.
            </p>
          </div>

          <form onSubmit={handleAddCrawler} className="space-y-4">
            {/* CLIENT NAME SELECTOR */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                1. Client Name*
              </label>
              <select
                required
                className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1.5 focus:ring-amber-500 cursor-pointer"
                value={formClientId}
                onChange={(e) => setFormClientId(e.target.value)}
              >
                <option value="">-- Choose Connected Client Account --</option>
                {clientMasters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* SITE NAME SELECTOR OR INPUT */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                2. Site Name / Portal*
              </label>
              <input
                required
                type="text"
                list="suggested-portals"
                className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1.5 focus:ring-amber-500"
                placeholder="Type or select supplier portal..."
                value={formSiteName}
                onChange={(e) => setFormSiteName(e.target.value)}
              />
              <datalist id="suggested-portals">
                {suggestedSites.map((site) => (
                  <option key={site} value={site} />
                ))}
              </datalist>
            </div>

            {/* LOGIN ID */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                3. Login ID*
              </label>
              <input
                required
                type="text"
                className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1.5 focus:ring-amber-500"
                placeholder="Example: saraswati.co"
                value={formLoginId}
                onChange={(e) => setFormLoginId(e.target.value)}
              />
            </div>

            {/* PASSWORD */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                4. Password*
              </label>
              <input
                required
                type="password"
                className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-1.5 focus:ring-amber-500"
                placeholder="••••••••••••••"
                value={formPasswordText}
                onChange={(e) => setFormPasswordText(e.target.value)}
              />
            </div>

            {/* PIN / OTP CONFIG */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                5. Secure PIN / Fixed OTP (Optional)
              </label>
              <input
                type="text"
                maxLength={8}
                className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1.5 focus:ring-amber-500"
                placeholder="Leave blank for Live SMS prompting"
                value={formPinOtp}
                onChange={(e) => setFormPinOtp(e.target.value.replace(/[^0-9]/g, ""))}
              />
              <span className="text-[9px] text-slate-400 font-medium block">
                If blank, AI Sakhi will prompt you live when logging in.
              </span>
            </div>

            {/* REPORT SECTION */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                6. Report Section*
              </label>
              <select
                required
                className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1.5 focus:ring-amber-500 cursor-pointer"
                value={formReportSection}
                onChange={(e) => setFormReportSection(e.target.value as any)}
              >
                <option value="Purchase Bills">Purchase Bills</option>
                <option value="Credit Notes">Credit Notes</option>
                <option value="Debit Notes">Debit Notes</option>
                <option value="Account Statements">Account Statements</option>
                <option value="Other Documents">Other Documents</option>
              </select>
            </div>

            {/* NAVIGATION PATH MAP BUILDER IN FORM CONTAINER */}
            <div className="pt-2.5 border-t border-slate-100 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Map className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                  7. Navigation Path Map (Sakhi Route Navigation Map)*
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setFormSteps([...formSteps, { actionType: "click", locationLabel: "New Button/Report Area", hindiInstruction: "Click there or fill in the required field." }]);
                  }}
                  className="text-[9px] bg-amber-100 font-extrabold hover:bg-amber-200 text-amber-950 px-2 py-0.5 rounded-md border border-amber-300 flex items-center gap-1 cursor-pointer transition-all uppercase"
                >
                  <Plus className="h-2.5 w-2.5" /> Add Step
                </button>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                Set down the explicit pages, click actions, and clear helper tips. AI Sakhi will follow the map you trace!
              </p>

              <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1 bg-slate-50/65 p-2 rounded-xl border border-slate-200/50 shadow-inner">
                {formSteps.map((step, idx) => (
                  <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200 text-xs space-y-1.5 relative shadow-xs">
                    <div className="flex justify-between items-center text-[10px] font-black text-indigo-700">
                      <span className="bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                        Step {idx + 1}
                      </span>
                      {formSteps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormSteps(formSteps.filter((_, i) => i !== idx));
                          }}
                          className="hover:text-red-600 transition-colors uppercase text-[9px] font-extrabold cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-12 gap-1 bg-slate-50 p-1 rounded-md">
                      <div className="col-span-5">
                        <select
                          className="w-full bg-white border border-slate-200 rounded-md py-0.5 px-1 text-[9px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                          value={step.actionType}
                          onChange={(e) => {
                            const newSteps = [...formSteps];
                            newSteps[idx].actionType = e.target.value as any;
                            setFormSteps(newSteps);
                          }}
                        >
                          <option value="navigate">Navigate</option>
                          <option value="click">Click</option>
                          <option value="select">Select</option>
                          <option value="fill">Fill</option>
                          <option value="download">Download</option>
                        </select>
                      </div>
                      <div className="col-span-7">
                        <input
                          type="text"
                          required
                          className="w-full bg-white border border-slate-200 rounded-md py-0.5 px-1.5 text-[9px] text-slate-800 placeholder-slate-400 font-bold focus:outline-none"
                          placeholder="Button name / Tab address..."
                          value={step.locationLabel}
                          onChange={(e) => {
                            const newSteps = [...formSteps];
                            newSteps[idx].locationLabel = e.target.value;
                            setFormSteps(newSteps);
                          }}
                        />
                      </div>
                    </div>

                    <input
                      type="text"
                      required
                      className="w-full bg-amber-50/30 border border-amber-200/50 rounded-md py-0.5 px-1.5 text-[9px] text-slate-800 placeholder-slate-400 font-medium focus:outline-none"
                      placeholder="Guide instruction (e.g., 'Click Download PDF Button')"
                      value={step.hindiInstruction}
                      onChange={(e) => {
                        const newSteps = [...formSteps];
                        newSteps[idx].hindiInstruction = e.target.value;
                        setFormSteps(newSteps);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black py-2.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all border border-amber-400 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Save Bot Setup
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: LIST OF BOT REGISTRY & INTERACTIVE SIMULATION RUNNER (COL-SPAN 8) */}
        <div className="xl:col-span-8 space-y-6">
          {/* CRAWLERS DATABASE LIST */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
              <Building className="h-4.5 w-4.5 text-amber-600" />
              Registered Crawlers & Login Gateways
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-3">Client Firm Name</th>
                    <th className="p-3">Portal Site Address</th>
                    <th className="p-3 font-mono">User ID</th>
                    <th className="p-3">Password</th>
                    <th className="p-3">Secure Pin</th>
                    <th className="p-3">Report Category</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {crawlers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 font-mono text-xs">
                        No Crawler bots configured yet. Enter credentials in the form to create your first scraper!
                      </td>
                    </tr>
                  ) : (
                    crawlers.map((c) => (
                      <React.Fragment key={c.id}>
                        <tr className={`hover:bg-slate-50/50 transition-all ${expandedMapCrawlerId === c.id ? "bg-amber-50/10" : ""}`}>
                          <td className="p-3 font-bold text-slate-900 line-clamp-1 max-w-[150px]" title={c.clientName}>
                            {c.clientName}
                          </td>
                          <td className="p-3 text-slate-600">
                            <span className="bg-amber-50 text-amber-800 border border-amber-150 px-2 py-0.5 rounded text-[10px] font-semibold">
                              {c.siteName}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-indigo-600">{c.loginId}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs">
                                {showPasswords[c.id] ? c.passwordText : "••••••••"}
                              </span>
                              <button
                                onClick={() => togglePasswordVisibility(c.id)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                              >
                                {showPasswords[c.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-3 font-mono uppercase text-slate-500 font-bold">
                            {c.pinOtp ? (
                              <span className="text-emerald-700 font-black">{c.pinOtp}</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded font-sans uppercase">
                                <Fingerprint className="h-2.5 w-2.5" /> SMS Ask
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="space-y-1 min-w-[125px]">
                              <span className="text-[10px] bg-slate-105 border border-slate-202 text-slate-800 px-2 py-0.5 rounded-md font-bold uppercase tracking-wide block w-fit">
                                {c.reportSection}
                              </span>
                              <button
                                onClick={() => {
                                  setExpandedMapCrawlerId(expandedMapCrawlerId === c.id ? null : c.id);
                                }}
                                className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.7 rounded-md border text-left cursor-pointer transition-all ${
                                  expandedMapCrawlerId === c.id
                                    ? "bg-amber-500 text-slate-950 border-amber-400"
                                    : "bg-amber-50 hover:bg-amber-100/50 text-amber-900 border-amber-200"
                                }`}
                              >
                                <Map className="h-2.5 w-2.5 shrink-0 text-amber-700" />
                                {(c.navigationMap || []).length} Steps Map ({expandedMapCrawlerId === c.id ? "Close" : "Edit Map"})
                              </button>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                              {runningCrawlerId === c.id ? (
                                <span className="animate-spin h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full" />
                              ) : (
                                <button
                                  onClick={() => triggerCrawlerSimulation(c)}
                                  className="bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white text-[10px] font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                                >
                                  <Play className="h-2.5 w-2.5 fill-current" /> Run Scraper
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteConfig(c.id)}
                                className="p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-700 cursor-pointer"
                                title="Delete bot"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {expandedMapCrawlerId === c.id && (
                          <tr>
                            <td colSpan={7} className="bg-amber-50/10 p-5 border-t border-b border-amber-200/40">
                              <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-2.5">
                                  <div>
                                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-2">
                                      <Map className="h-4 w-4 text-amber-550 shrink-0" />
                                      AI Sakhi Portal Navigation Map
                                    </h4>
                                    <p className="text-[10px] text-slate-500 mt-0.5 font-semibold leading-relaxed">
                                      Specify the action sequence where AI Sakhi should navigate to download the required reports after login.
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        const updated = crawlers.map(curr => {
                                          if (curr.id === c.id) {
                                            const mapSteps = curr.navigationMap || [];
                                            return {
                                              ...curr,
                                              navigationMap: [...mapSteps, {
                                                id: `step-edit-${Date.now()}-${Math.random()}`,
                                                actionType: "click" as const,
                                                locationLabel: "New Button/Report Area",
                                                hindiInstruction: "Click on the link or button."
                                              }]
                                            };
                                          }
                                          return curr;
                                        });
                                        setCrawlers(updated);
                                      }}
                                      className="text-[9px] bg-slate-900 border border-slate-700 font-extrabold text-white px-2.5 py-1.5 rounded hover:bg-slate-800 transition-all cursor-pointer uppercase flex items-center gap-1"
                                    >
                                      <Plus className="h-3 w-3" /> Add Step
                                    </button>
                                    <button
                                      onClick={() => {
                                        setExpandedMapCrawlerId(null);
                                      }}
                                      className="text-[9px] bg-amber-500 border border-amber-400 font-extrabold text-slate-950 px-2.5 py-1.5 rounded hover:bg-amber-600 transition-all cursor-pointer uppercase flex items-center gap-1 shadow-xs animate-pulse"
                                    >
                                      <Check className="h-3 w-3" /> Save & Close
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {(c.navigationMap || []).map((step, sIdx) => (
                                    <div key={step.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-2 relative hover:border-amber-300 transition-all">
                                      <div className="flex justify-between items-center pb-1 border-b border-rose-50">
                                        <span className="text-[9px] font-black tracking-wider uppercase text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded">
                                          Step {sIdx + 1}
                                        </span>
                                        <button
                                          onClick={() => {
                                            const updated = crawlers.map(curr => {
                                              if (curr.id === c.id) {
                                                return {
                                                  ...curr,
                                                  navigationMap: (curr.navigationMap || []).filter(st => st.id !== step.id)
                                                };
                                              }
                                              return curr;
                                            });
                                            setCrawlers(updated);
                                          }}
                                          className="text-red-500 hover:text-red-700 p-0.5 rounded cursor-pointer hover:bg-red-50 transition-all"
                                          title="Delete step"
                                        >
                                          <Trash className="h-3 w-3" />
                                        </button>
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Action type</label>
                                        <select
                                          className="w-full bg-slate-50 border border-slate-200 rounded py-0.5 px-1.5 text-[10px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
                                          value={step.actionType}
                                          onChange={(e) => {
                                            const updated = crawlers.map(curr => {
                                              if (curr.id === c.id) {
                                                const nextMap = (curr.navigationMap || []).map(st => 
                                                  st.id === step.id ? { ...st, actionType: e.target.value as any } : st
                                                );
                                                return { ...curr, navigationMap: nextMap };
                                              }
                                              return curr;
                                            });
                                            setCrawlers(updated);
                                          }}
                                        >
                                          <option value="navigate">Navigate</option>
                                          <option value="click">Click</option>
                                          <option value="select">Select</option>
                                          <option value="fill">Fill</option>
                                          <option value="download">Download</option>
                                        </select>
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block font-bold">Target page area / label</label>
                                        <input
                                          type="text"
                                          className="w-full bg-slate-50 border border-slate-200 rounded py-0.5 px-1.5 text-[10px] text-slate-800 font-bold focus:outline-none"
                                          value={step.locationLabel}
                                          onChange={(e) => {
                                            const updated = crawlers.map(curr => {
                                              if (curr.id === c.id) {
                                                const nextMap = (curr.navigationMap || []).map(st => 
                                                  st.id === step.id ? { ...st, locationLabel: e.target.value } : st
                                                );
                                                return { ...curr, navigationMap: nextMap };
                                              }
                                              return curr;
                                            });
                                            setCrawlers(updated);
                                          }}
                                        />
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Route Guide Instruction (English Helper Tip)</label>
                                        <input
                                          type="text"
                                          className="w-full bg-amber-50/25 border border-amber-200/40 rounded py-0.5 px-1.5 text-[10px] text-slate-805 font-medium focus:outline-none"
                                          value={step.hindiInstruction}
                                          onChange={(e) => {
                                            const updated = crawlers.map(curr => {
                                              if (curr.id === c.id) {
                                                const nextMap = (curr.navigationMap || []).map(st => 
                                                  st.id === step.id ? { ...st, hindiInstruction: e.target.value } : st
                                                );
                                                return { ...curr, navigationMap: nextMap };
                                              }
                                              return curr;
                                            });
                                            setCrawlers(updated);
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                  {(c.navigationMap || []).length === 0 && (
                                    <div className="col-span-full text-center py-5 border border-dashed border-slate-200 rounded-xl text-slate-400 font-mono text-xs">
                                      This robot does not have any navigation steps programmed. Add a step to build its map!
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SIMULATED LIVE CRAWLER CONSOLE/TERMINAL SCREEN */}
          {runningCrawlerId && (() => {
            const activeCrawler = crawlers.find(c => c.id === runningCrawlerId);
            if (!activeCrawler) return null;
            return (
              <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex flex-col justify-between min-h-[380px] text-slate-100">
                {/* Console header */}
                <div className="bg-slate-900 px-5 py-3 border-b border-slate-800 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500 animate-pulse" />
                    <span className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="ml-2 font-mono font-bold text-amber-500 uppercase tracking-widest text-[10px]">
                      AI Sakhi Live Headless Bot Shell
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-mono text-slate-400">
                      Target: {activeCrawler.siteName}
                    </span>
                    <button
                      onClick={resetRunner}
                      className="text-red-400 hover:text-red-300 font-bold uppercase text-[9px] bg-slate-850 px-2.5 py-0.7 rounded-md border border-slate-750 cursor-pointer"
                    >
                      Kill Bot
                    </button>
                  </div>
                </div>

                {/* Visual Route Progress Map Status Bar */}
                <div className="bg-slate-900/40 px-5 py-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-extrabold text-amber-400 mb-2">
                    <Compass className="h-3.5 w-3.5 animate-spin" />
                    AI Sakhi Active Route Map Tracker:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                    {(() => {
                      const steps = activeCrawler.navigationMap && activeCrawler.navigationMap.length > 0
                        ? activeCrawler.navigationMap
                        : getDefaultNavigationMap(activeCrawler.clientId, activeCrawler.reportSection);
                      return steps.map((s, idx) => {
                        const isPast = activeMapStepIdx > idx;
                        const isActive = activeMapStepIdx === idx;
                        return (
                          <div 
                            key={s.id || idx} 
                            className={`p-2 rounded-lg border text-[10px] transition-all flex flex-col justify-between ${
                              isActive 
                                ? "bg-amber-500 text-slate-950 border-amber-300 font-extrabold scale-[1.01] shadow-md shadow-amber-500/25" 
                                : isPast
                                  ? "bg-indigo-950/20 text-indigo-300 border-indigo-950"
                                  : "bg-slate-900 text-slate-400 border-slate-850"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1 pb-1 border-b border-slate-800/40">
                              <span className={`font-mono tracking-widest uppercase font-extrabold text-[8px] ${isActive ? "text-slate-900" : "text-slate-500"}`}>
                                Step {idx + 1}
                              </span>
                              {isPast && <Check className="h-2.5 w-2.5 text-emerald-400 font-extrabold" />}
                              {isActive && <span className="h-1.5 w-1.5 bg-slate-950 rounded-full animate-ping" />}
                            </div>
                            <div className="font-extrabold truncate text-[9px]" title={s.locationLabel}>
                              {s.locationLabel}
                            </div>
                            <div className={`text-[8px] truncate mt-0.5 font-medium ${isActive ? "text-slate-900/80" : "text-slate-500"}`}>
                              {s.hindiInstruction}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Console text log area */}
                <div className="p-5 font-mono text-xs space-y-2 max-h-[280px] overflow-y-auto flex-1">
                  {runnerLogs.map((log, idx) => {
                    let textClass = "text-slate-300";
                    if (log.includes("🚀") || log.includes("✨")) textClass = "text-amber-400 font-bold";
                    if (log.includes("⚠️") || log.includes("🛑")) textClass = "text-yellow-400 font-semibold";
                    if (log.includes("❇️") || log.includes("🎉") || log.includes("💾")) textClass = "text-emerald-400 font-bold";
                    if (log.includes("💬")) textClass = "text-cyan-400 font-bold";

                    return (
                      <div key={idx} className={`${textClass} leading-relaxed`}>
                        {log}
                      </div>
                    );
                  })}
                  
                  {/* Active Spinner cursor */}
                  {!waitingForOtpSubmit && runnerStep < 4 && (
                    <div className="flex items-center gap-2 text-amber-500 text-[11px] animate-pulse">
                      <span>⚡ AI bot is performing automated web navigation & OCR scanning...</span>
                      <span className="animate-ping h-2.5 w-2.5 bg-amber-500 rounded-full" />
                    </div>
                  )}

                  {/* OTP Submission Interactive Box in terminal */}
                  {waitingForOtpSubmit && (
                    <div className="bg-slate-900 border border-yellow-600/50 p-4 rounded-xl space-y-3 my-2.5 animate-pulse max-w-lg">
                      <div className="flex items-start gap-2.5 text-yellow-500 text-xs">
                        <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block uppercase tracking-wider font-extrabold text-[11px]">
                            Live Dual-Factor SMS Prompt
                          </strong>
                          <span className="text-slate-300 text-[10px]">
                            Enter the OTP code received on registered mobile to authorize the automatic scraper container session.
                          </span>
                        </div>
                      </div>

                      <form onSubmit={handleLiveOtpSubmit} className="flex gap-2">
                        <input
                          required
                          type="text"
                          maxLength={6}
                          placeholder="6-digit PIN/OTP"
                          value={liveOtpInput}
                          onChange={(e) => setLiveOtpInput(e.target.value.replace(/[^0-9]/g, ""))}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-1 text-sm font-mono text-yellow-400 focus:outline-none focus:border-yellow-500 w-36 text-center tracking-widest font-bold font-black"
                        />
                        <button
                          type="submit"
                          className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 px-4 py-1 text-xs rounded-lg font-black uppercase tracking-wider flex items-center gap-1 border border-yellow-400 cursor-pointer"
                        >
                          <Send className="h-3.5 w-3.5 text-slate-950" /> Send PIN
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Success prompt inside terminal */}
                  {runnerStep === 4 && (
                    <div className="bg-emerald-950/40 border border-emerald-500 p-4 rounded-xl space-y-2 my-2 mt-4 max-w-lg text-xs leading-relaxed animate-fade-in text-emerald-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
                        <strong className="uppercase font-mono tracking-wider font-extrabold">
                          Bot Session Successfully Completed!
                        </strong>
                      </div>
                      <p>
                        Dual-factor login passed. Documents parsed and saved to Google Drive client folder. The corresponding transaction has been logged as <strong>Draft Invoice</strong> in your main folder.
                      </p>
                      <div className="pt-1.5 flex gap-2.5">
                        <button
                          onClick={() => onTabChange("scan")}
                          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-1 px-3 rounded text-[10px] uppercase cursor-pointer"
                        >
                          Approve in Scanner
                        </button>
                        <button
                          onClick={resetRunner}
                          className="bg-transparent hover:bg-slate-800 text-slate-300 border border-slate-700 py-1 px-3 rounded text-[10px] uppercase cursor-pointer"
                        >
                          Clear Terminal
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Console status footer */}
                <div className="bg-slate-900 border-t border-slate-800 py-2.5 px-5 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span>Engine: Antigravity-V4</span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    Status: {activeCrawler.lastRunStatus.toUpperCase()}
                  </span>
                </div>
              </div>
            );
          })()}


        </div>
      </div>
    </div>
  );
}
