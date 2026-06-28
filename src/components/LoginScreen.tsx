import React, { useState, useEffect } from "react";
import { User, ShieldCheck, Key, Phone, CheckCircle2, AlertCircle, Users, QrCode, ClipboardCheck, ArrowRight, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";
import { UserSession, TeamMaster } from "../types";
import * as OTPAuth from "otpauth";

function generateStableSecret(name: string, mobile: string): string {
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let clean = (name + mobile).toUpperCase().replace(/[^A-Z2-7]/g, '');
  if (clean.length < 16) {
    clean = (clean + 'RADHARECOVERYKEYS').substring(0, 16);
  } else {
    clean = clean.substring(0, 16);
  }
  let finalSecret = '';
  for (let i = 0; i < 16; i++) {
    const char = clean[i];
    if (base32Chars.includes(char)) {
      finalSecret += char;
    } else {
      finalSecret += base32Chars[i % 32];
    }
  }
  return finalSecret;
}

interface LoginScreenProps {
  onLoginSuccess: (session: UserSession) => void;
  teamMasters: TeamMaster[];
}

export default function LoginScreen({ onLoginSuccess, teamMasters = [] }: LoginScreenProps) {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showQrConfig, setShowQrConfig] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Live TOTP Generation & Timer states
  const [liveOtp, setLiveOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(30);

  // Resolve the current team member based on entered mobile
  const matchedMember = teamMasters.find((t) => t.mobile.trim() === mobile.trim());

  // Detect and update live OTP simulator when mobile changes or time updates
  useEffect(() => {
    if (!matchedMember) {
      setLiveOtp("");
      return;
    }

    const updateLiveTotp = () => {
      try {
        const secretKey = matchedMember.totpSecret || generateStableSecret(matchedMember.name, matchedMember.mobile);
        const totp = new OTPAuth.TOTP({
          issuer: "YashvikaSystems",
          label: `${matchedMember.name} (Radha)`,
          algorithm: "SHA1",
          digits: 6,
          period: 30,
          secret: OTPAuth.Secret.fromBase32(secretKey),
        });
        setLiveOtp(totp.generate());
        setSecondsLeft(30 - Math.floor((Date.now() / 1000) % 30));
      } catch (err) {
        console.error("Failed to generate live simulator OTP", err);
        setLiveOtp("");
      }
    };

    updateLiveTotp();
    const timer = setInterval(updateLiveTotp, 1000);
    return () => clearInterval(timer);
  }, [mobile, matchedMember, teamMasters]);

  const handlePresetClick = (targetMobile: string) => {
    setMobile(targetMobile);
    setError(null);
    setOtp("");
  };

  const handleAutofillSimulatorOtp = () => {
    if (liveOtp) {
      setOtp(liveOtp);
      setError(null);
    }
  };

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanMobile = mobile.trim();
    const cleanOtp = otp.trim();

    if (!cleanMobile) {
      setError("Please write the registered Login ID (Mobile Number).");
      return;
    }

    if (!/^[0-9]{10}$/.test(cleanMobile)) {
      setError("Please enter a valid 10-digit registered mobile number.");
      return;
    }

    if (!cleanOtp) {
      setError("Please write the 6-digit Google Authenticator OTP.");
      return;
    }

    if (cleanOtp.length !== 6 || /[^0-9]/.test(cleanOtp)) {
      setError("Google Authenticator OTP must be exactly 6 numeric digits.");
      return;
    }

    // Look up member
    const member = teamMasters.find((t) => t.mobile.trim() === cleanMobile);
    if (!member) {
      setError("This mobile number is not registered in Yashvika Systems Team/Admin database. Go to 'Master Directory' as Admin to register.");
      return;
    }

    if (member.status === "Inactive") {
      setError("Your profile status is marked 'Inactive'. Please contact Yashvika HOD to activate.");
      return;
    }

    // Standard RFC-6238 TOTP Validation
    try {
      const secretKey = member.totpSecret || generateStableSecret(member.name, member.mobile);
      const totp = new OTPAuth.TOTP({
        issuer: "YashvikaSystems",
        label: `${member.name} (Radha)`,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secretKey),
      });

      // Verify token with a window of 2 (allows 1 minute clock skew on local clients)
      const delta = totp.validate({
        token: cleanOtp,
        window: 2,
      });

      if (delta === null) {
        setError("Invalid Code! The entered 6-digit Google Authenticator OTP did not match our security key. Check your device clock.");
        return;
      }

      // Successful verified TOTP authentication
      const session: UserSession = {
        name: member.name,
        mobile: member.mobile,
        role: member.role as any,
      };

      onLoginSuccess(session);
    } catch (err) {
      setError("Authenticator key validation failed. Please check the integrity of your TOTP base32 key.");
    }
  };

  // Compute QR URI for scanning
  let totpUri = "";
  if (matchedMember) {
    try {
      const secretKey = matchedMember.totpSecret || generateStableSecret(matchedMember.name, matchedMember.mobile);
      const inst = new OTPAuth.TOTP({
        issuer: "YashvikaSystems",
        label: `${matchedMember.name} (Radha)`,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secretKey),
      });
      totpUri = inst.toString();
    } catch (_) {}
  }

  // Filter presets from the live teamMasters database
  const activeStaff = teamMasters.filter(t => t.status === "Active");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Decorative ambient elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        {/* Logo Icon */}
        <div className="inline-flex bg-gradient-to-r from-amber-500 to-amber-600 p-3.5 rounded-2xl shadow-lg border border-amber-400 mb-4 hover:scale-105 transition-all">
          <ShieldCheck className="h-8 w-8 text-white" />
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          YASHVIKA Ecosystem
        </h2>
        <p className="mt-1.5 text-xs text-amber-750 font-bold tracking-wide uppercase font-mono">
          🔏 Two-Factor Authenticator Secure Login Gateway
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white border border-slate-200 py-8 px-4 shadow-xl rounded-3xl sm:px-10">
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Mobile / ID field */}
            <div>
              <label htmlFor="login-mobile-input" className="block text-[10px] font-mono tracking-wider text-slate-500 uppercase font-black mb-2">
                User Login ID (Registered Cell No)*
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  id="login-mobile-input"
                  name="mobile"
                  type="tel"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value.replace(/[^0-9]/g, ""));
                    setError(null);
                  }}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full bg-slate-50 border border-slate-200 text-sm pl-10 pr-3.5 py-3 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono tracking-widest transition-all placeholder-slate-400"
                />
              </div>
            </div>

            {/* Password / Google Authenticator OTP field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="login-otp-input" className="block text-[10px] font-mono tracking-wider text-slate-500 uppercase font-black">
                  Google Authenticator OTP Code*
                </label>
                {matchedMember && (
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold font-mono">
                    Secured by TOTP
                  </span>
                )}
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Key className="h-4 w-4" />
                </div>
                <input
                  id="login-otp-input"
                  name="otp"
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/[^0-9]/g, ""));
                    setError(null);
                  }}
                  placeholder="e.g. 6 Digit Code"
                  className="w-full bg-slate-50 border border-slate-200 text-sm pl-10 pr-3.5 py-3 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono tracking-[0.5em] text-center focus:placeholder-transparent transition-all placeholder-slate-400 font-bold"
                />
              </div>
            </div>

            {/* Resolved user info & QR Setup Panel */}
            {matchedMember ? (
              <div className="bg-slate-55 border border-slate-200 rounded-2xl p-4 space-y-3.5 transition-all">
                <div className="flex items-center justify-between border-b border-slate-205 pb-2.5">
                  <div>
                    <h4 className="text-[11px] text-slate-500 font-mono font-bold tracking-wider uppercase">RESOLVED SECURITY CARD</h4>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{matchedMember.name}</p>
                  </div>
                  <span className={`text-[10px] uppercase font-bold font-mono px-2 py-0.8 rounded-lg border ${
                    matchedMember.role === "Admin"
                      ? "bg-red-50 text-red-600 border-red-200"
                      : "bg-indigo-50 text-indigo-600 border-indigo-200"
                  }`}>
                    {matchedMember.role} Badge
                  </span>
                </div>

                {/* Expandable Google Authenticator instructions & QR */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => setShowQrConfig(!showQrConfig)}
                    className="w-full py-2.5 flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900 transition-all text-xs font-semibold hover:bg-slate-100 rounded-lg cursor-pointer border border-slate-250 bg-slate-50"
                  >
                    <QrCode className="h-4 w-4 text-slate-500" />
                    <span>{showQrConfig ? "Hide Manual QR Setup" : "Setup Google Authenticator App"}</span>
                  </button>

                  {showQrConfig && (
                    <div className="mt-3.5 bg-white p-4 rounded-xl border border-slate-200 space-y-3.5 text-xs text-slate-600 text-center animate-fade-in shadow-inner">
                      <p className="font-bold text-[11px] leading-relaxed text-slate-800 border-b border-slate-100 pb-2 uppercase tracking-wide">
                        Google Authenticator Setup Instructions & QR Code
                      </p>
                      
                      {totpUri && (
                        <div className="flex flex-col items-center justify-center p-3.5 bg-slate-50 rounded-2xl w-fit mx-auto border border-slate-200">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(totpUri)}`}
                            alt="Google Authenticator QR Code"
                            referrerPolicy="no-referrer"
                            className="h-36 w-36 select-none bg-white p-1 rounded-lg border border-slate-200"
                          />
                          <span className="text-[10px] text-slate-500 font-bold font-mono mt-2 tracking-wider">SCAN ACCOUNT KEY</span>
                        </div>
                      )}

                      <div className="text-left bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px] leading-relaxed text-slate-700 space-y-2">
                        <strong className="block text-slate-900 border-b border-slate-200 pb-1 uppercase font-mono text-[10px]">
                          📱 Step-by-Step setup Process
                        </strong>
                        <ol className="list-decimal pl-4.5 space-y-1.5 font-sans">
                          <li>
                            Open <strong>Google Authenticator</strong> app on your mobile phone.
                          </li>
                          <li>
                            Tap the <strong>"+" (Plus) Button</strong> in the bottom right corner of the screen.
                          </li>
                          <li>
                            You will see two options: <strong>Scan a QR code</strong> or <strong>Enter a setup key</strong>.
                          </li>
                          <li>
                            <strong>Method A (Easiest - QR Scan):</strong> Choose "Scan a QR code" and point your phone camera at the QR code displayed above.
                          </li>
                          <li>
                            <strong>Method B (Manual Key entry fallback):</strong> If scanning fails, choose "Enter a setup key" and fill these fields:
                            <ul className="list-disc pl-4 mt-1 text-slate-600 font-sans space-y-0.5 font-bold">
                              <li>Account name: <span className="text-slate-900">Project Radha ({matchedMember.name})</span></li>
                              <li>Your key: <span className="text-amber-700 select-all font-mono tracking-wider">{matchedMember.totpSecret || generateStableSecret(matchedMember.name, matchedMember.mobile)}</span></li>
                              <li>Type of key: <span className="text-slate-900">Time-based</span></li>
                            </ul>
                          </li>
                        </ol>
                      </div>

                      <div className="space-y-1.5 text-left border-t border-slate-100 pt-2.5">
                        <span className="block text-[9px] font-mono font-bold tracking-wider text-slate-500 uppercase">
                          MANUAL SECRET STRING:
                        </span>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg justify-between">
                          <code className="text-amber-600 font-mono font-bold tracking-wider text-[11px] select-all">
                            {matchedMember.totpSecret || generateStableSecret(matchedMember.name, matchedMember.mobile)}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopySecret(matchedMember.totpSecret || generateStableSecret(matchedMember.name, matchedMember.mobile))}
                            className="text-slate-500 hover:text-slate-800 p-1 rounded transition-colors cursor-pointer"
                            title="Copy security key secret"
                          >
                            {copiedSecret ? <ClipboardCheck className="h-4 w-4 text-emerald-600" /> : <ClipboardCheck className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : mobile.length === 10 ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-3">
                <ShieldAlert className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] text-red-800 block font-bold font-mono tracking-wide uppercase">ACCESS DENIED</span>
                  <span className="text-[10px] text-red-650 leading-normal block">
                    Mobile number is not registered in Radha database. Please check number or contact Admin.
                  </span>
                </div>
              </div>
            ) : null}

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-3 animate-pulse">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="text-[10px] text-rose-850 leading-normal font-semibold font-mono">{error}</span>
              </div>
            )}

            <div>
              <button
                type="submit"
                id="login-submit-btn"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs py-3.5 rounded-xl shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-amber-500/10"
              >
                <ShieldCheck className="h-4.5 w-4.5" />
                <span>AUTHENTICATE & LOG IN</span>
              </button>
            </div>
          </form>
        </div>

        <div className="mt-5 text-center">
          <span className="text-[10px] text-slate-400 select-none font-mono tracking-wide">
            🔒 Radha Identity Protection. Secure 2FA Protocol Active.
          </span>
        </div>
      </div>
    </div>
  );
}
