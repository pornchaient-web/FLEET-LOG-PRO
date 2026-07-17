import React, { useState, useEffect } from "react";
import { DataProvider, useData } from "./context/DataContext";
import { WorkLogTab } from "./components/WorkLogTab";
import { CarUsageLogTab } from "./components/CarUsageLogTab";
import { MonthlySummaryTab } from "./components/MonthlySummaryTab";
import { exportToExcel, formatMonthThai, getCycleMonth } from "./utils/excel";
import {
  Calendar,
  Car,
  ClipboardList,
  FileSpreadsheet,
  LogIn,
  LogOut,
  BarChart3,
  CloudLightning,
  AlertCircle,
  RefreshCw,
  X,
  ExternalLink,
  Download,
  Smartphone
} from "lucide-react";

function MainAppContent() {
  const {
    user,
    authLoading,
    dataLoading,
    workLogs,
    carLogs,
    loginWithGoogle,
    logout,
    syncLocalToFirebase,
    hasLocalData,
    authError,
    clearAuthError
  } = useData();

  // Selected tab
  const [activeTab, setActiveTab] = useState<"work" | "car" | "summary">("work");

  // Determine available months in logs or use current month as default
  const [selectedMonth, setSelectedMonth] = useState("");

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
      console.log("PWA: beforeinstallprompt event fired and captured");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      console.log("PWA: Installed successfully");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA: User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const currentMonthStr = getCycleMonth(todayStr);
    setSelectedMonth(currentMonthStr);
  }, []);

  // Compute list of all unique months present in logs, plus the current month
  const availableMonths = React.useMemo(() => {
    const months = new Set<string>();
    const todayStr = new Date().toISOString().split("T")[0];
    const current = getCycleMonth(todayStr);
    months.add(current);

    workLogs.forEach((log) => months.add(getCycleMonth(log.date)));
    carLogs.forEach((log) => months.add(getCycleMonth(log.date)));

    return Array.from(months).sort((a, b) => b.localeCompare(a)); // Latest first
  }, [workLogs, carLogs]);

  // Handle Export Excel
  const handleExportCurrentMonth = () => {
    exportToExcel(workLogs, carLogs, selectedMonth);
  };

  const handleExportAll = () => {
    exportToExcel(workLogs, carLogs, "all");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center space-y-4 relative overflow-hidden">
        {/* Background Mesh Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-500/15 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="w-12 h-12 border-4 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-300 font-medium text-sm font-sans z-10">กำลังเปิดระบบ FLEET LOG PRO...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-4 font-sans antialiased relative overflow-hidden">
        {/* Configuration-not-found / Auth Error Instruction Modal */}
        {authError && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <div className="bg-slate-900/90 border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-6 text-left">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 text-amber-400">
                  <AlertCircle size={24} />
                  <h3 className="text-lg font-bold text-white">คำแนะนำการตั้งค่า Firebase</h3>
                </div>
                <button
                  onClick={clearAuthError}
                  className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Error Body */}
              <div className="space-y-4 text-sm leading-relaxed">
                {(authError === "auth/configuration-not-found" || authError === "auth/operation-not-allowed") ? (
                  <>
                    <p className="text-slate-300">
                      ระบบตรวจพบว่าโปรเจกต์ Firebase ของคุณ <code className="bg-slate-800 text-teal-300 px-1.5 py-0.5 rounded font-mono text-xs">tech-job-tracker-96fe4</code> ยังไม่ได้เปิดใช้งานระบบลงชื่อเข้าใช้ด้วย Google (Google Sign-In)
                    </p>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-200 text-xs font-mono">
                      Error Code: {authError}
                    </div>

                    <div className="space-y-2.5">
                      <h4 className="font-semibold text-slate-200">🛠️ วิธีแก้ไข (ทำตามขั้นตอนดังนี้):</h4>
                      <ol className="list-decimal pl-5 space-y-2 text-slate-300 text-xs">
                        <li>
                          ไปที่หน้าเว็บ{" "}
                          <a
                            href="https://console.firebase.google.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-400 hover:underline inline-flex items-center gap-0.5 font-semibold"
                          >
                            Firebase Console <ExternalLink size={12} />
                          </a>
                        </li>
                        <li>เลือกโปรเจกต์ <span className="text-white font-semibold font-mono">tech-job-tracker-96fe4</span> ของคุณ</li>
                        <li>ในแถบเมนูด้านซ้าย ไปที่เมนู <span className="text-white font-semibold">Build &gt; Authentication</span></li>
                        <li>คลิกแท็บ <span className="text-white font-semibold">Sign-in method</span> แล้วกดปุ่ม <span className="text-teal-300 font-semibold">Add new provider</span></li>
                        <li>เลือก <span className="text-white font-semibold">Google</span></li>
                        <li>กดปุ่มสวิตช์ <span className="text-teal-300 font-semibold">Enable</span>, เลือกอีเมลของคุณในช่อง <span className="text-white font-semibold">Project support email</span> แล้วกด <span className="text-emerald-400 font-semibold font-bold">Save</span></li>
                      </ol>
                    </div>
                  </>
                ) : authError === "auth/unauthorized-domain" ? (
                  <>
                    <p className="text-slate-300">
                      โดเมนของแอปพลิเคชันนี้ยังไม่ได้ถูกเพิ่มเข้าไปใน <b>Authorized Domains</b> (โดเมนที่ได้รับอนุญาต) ของระบบ Firebase Authentication
                    </p>

                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-300 text-xs font-mono">
                      Error Code: auth/unauthorized-domain
                    </div>

                    <div className="space-y-2 bg-slate-950/40 border border-white/5 p-3 rounded-xl">
                      <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">โดเมนที่ต้องเพิ่ม (คัดลอกตัวนี้):</span>
                      <div className="flex items-center justify-between gap-2 font-mono text-xs text-teal-300 bg-slate-900 px-3 py-2 rounded-lg border border-white/10">
                        <span>{window.location.hostname}</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.hostname);
                            alert("คัดลอกโดเมนเรียบร้อยแล้ว!");
                          }}
                          className="text-[10px] text-slate-400 hover:text-white px-2 py-1 bg-white/5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          คัดลอก
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <h4 className="font-semibold text-slate-200">🛠️ วิธีแก้ไข (ทำตามขั้นตอนดังนี้):</h4>
                      <ol className="list-decimal pl-5 space-y-2 text-slate-300 text-xs">
                        <li>
                          ไปที่หน้าเว็บ{" "}
                          <a
                            href="https://console.firebase.google.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-400 hover:underline inline-flex items-center gap-0.5 font-semibold"
                          >
                            Firebase Console <ExternalLink size={12} />
                          </a>
                        </li>
                        <li>เลือกโปรเจกต์ <span className="text-white font-semibold font-mono">tech-job-tracker-96fe4</span> ของคุณ</li>
                        <li>ในแถบเมนูด้านซ้าย ไปที่เมนู <span className="text-white font-semibold">Build &gt; Authentication</span></li>
                        <li>คลิกแท็บ <span className="text-white font-semibold">Settings</span> (อยู่ถัดจาก Sign-in method และ Templates)</li>
                        <li>ในแถบเมนูย่อยด้านซ้าย เลือก <span className="text-white font-semibold">Authorized domains</span></li>
                        <li>คลิกปุ่ม <span className="text-teal-300 font-semibold">Add domain</span></li>
                        <li>วางโดเมน <span className="text-teal-300 font-semibold font-mono">{window.location.hostname}</span> ที่คัดลอกไว้ลงไป แล้วกดปุ่ม <span className="text-emerald-400 font-semibold font-bold">Add</span></li>
                      </ol>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-slate-300">
                      เกิดข้อผิดพลาดในการเชื่อมต่อกับ Firebase:
                    </p>
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-300 text-xs font-mono whitespace-pre-wrap break-all">
                      {authError}
                    </div>
                  </>
                )}

                <p className="text-slate-400 text-xs font-sans mt-2">
                  * กรุณาเปิดใช้งานคุณสมบัติดังกล่าวในระบบ Firebase เพื่อรักษาความปลอดภัยให้กับสิทธิ์และข้อมูลบัญชีของคุณ
                </p>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={clearAuthError}
                  className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center"
                >
                  ตกลง / ลองเข้าสู่ระบบอีกครั้ง
                </button>
                <a
                  href="https://console.firebase.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={clearAuthError}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                >
                  <span>เปิด Firebase Console</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Background Mesh Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Elegant Login Card */}
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-indigo-500 to-teal-400 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Car size={32} />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-teal-300 to-indigo-400 bg-clip-text text-transparent italic font-sans">
              FLEET LOG PRO
            </h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-sans font-medium">
              ระบบบันทึกงานและการใช้รถ • Cloud Synchronized
            </p>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            ระบบบันทึกประวัติงานประจำวัน รายการค่ารอบการติดตั้ง และการใช้รถยนต์ เลขไมล์สะสม และปริมาณการใช้น้ำมัน พร้อมจัดทำสรุปรายงานและดาวน์โหลดไฟล์ Excel ได้ทันทีบนระบบ Cloud ปลอดภัยสูง
          </p>

          <div className="pt-4 border-t border-white/10 space-y-3 text-left">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">คุณสมบัติการซิงค์ข้อมูล Cloud:</h4>
            <ul className="space-y-2.5 text-xs text-slate-300 font-sans">
              <li className="flex items-start gap-2">
                <span className="text-teal-400">☁️</span>
                <span><b>ข้อมูลปลอดภัย:</b> ข้อมูลของคุณถูกเก็บไว้บน Cloud ส่วนตัวอย่างถาวร ป้องกันข้อมูลสูญหาย</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400">📊</span>
                <span><b>สถิติแม่นยำ:</b> คำนวณอัตราการใช้น้ำมันสะสมและระยะทางทั้งหมดแยกตามเดือนได้ทันที</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400">📥</span>
                <span><b>ส่งออกง่ายดาย:</b> ดาวน์โหลดรายงานสรุปแยกตามเดือนในรูปแบบไฟล์ Excel ได้ทุกเมื่อ</span>
              </li>
            </ul>
          </div>

          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-indigo-500 hover:bg-indigo-600 text-white py-3.5 px-5 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/25 cursor-pointer mt-6"
          >
            <LogIn size={18} />
            <span>เข้าสู่ระบบด้วย Google</span>
          </button>

          {showInstallBanner && (
            <button
              onClick={handleInstallPWA}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-teal-500/20 to-indigo-500/20 hover:from-teal-500/30 hover:to-indigo-500/30 text-teal-300 border border-teal-500/30 py-3 px-5 rounded-2xl text-xs font-bold transition-all cursor-pointer mt-3"
            >
              <Smartphone size={16} />
              <span>ติดตั้งเป็นแอปมือถือ (PWA) 📱</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col font-sans antialiased relative overflow-hidden">
      {/* Background Mesh Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[40%] left-[50%] w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Top Header Navigation bar */}
      <header className="bg-white/5 border-b border-white/10 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & title */}
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-tr from-indigo-500 to-teal-400 text-white rounded-2xl shadow-lg shadow-indigo-500/10 flex items-center justify-center">
              <Car size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-teal-300 to-indigo-400 bg-clip-text text-transparent italic font-sans">
                FLEET LOG PRO
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-sans">
                ระบบบันทึกงานและใช้รถ • Connected to Cloud
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Month dropdown selector */}
            <div className="flex items-center bg-white/5 border border-white/10 backdrop-blur-md rounded-xl px-2.5 py-1.5 shadow-inner">
              <Calendar size={15} className="text-teal-400 mr-2" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none text-slate-200 text-sm font-semibold focus:outline-none focus:ring-0 cursor-pointer pr-4 font-mono"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m} className="bg-[#0f172a] text-white">
                    {formatMonthThai(m)}
                  </option>
                ))}
              </select>
            </div>

            {/* Export Dropdown options */}
            <div className="flex items-center bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl shadow-lg shadow-emerald-500/5 transition-all overflow-hidden font-medium text-sm backdrop-blur-md">
              <button
                onClick={handleExportCurrentMonth}
                className="flex items-center space-x-2 px-4 py-2 border-r border-emerald-500/20 hover:bg-emerald-500/30 transition-colors cursor-pointer h-full"
                title="ส่งออกรายงานของเดือนที่เลือกเป็นไฟล์ Excel"
              >
                <FileSpreadsheet size={16} />
                <span>ส่งออก Excel</span>
              </button>
              <button
                onClick={handleExportAll}
                className="px-3 py-2 hover:bg-emerald-500/30 transition-colors text-xs font-bold font-sans cursor-pointer h-full"
                title="ส่งออกรายงานทั้งหมดแยกชีทตามเดือน"
              >
                ทั้งหมด
              </button>
            </div>

            {/* User Auth Info */}
            <div className="flex items-center space-x-2 pl-2 border-l border-white/10">
              {user ? (
                <div className="flex items-center space-x-3">
                  <img
                    src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || "Tech"}`}
                    alt={user.displayName || "User Avatar"}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full border border-white/20 shadow-sm object-cover"
                  />
                  <div className="hidden lg:block text-left">
                    <span className="text-xs font-semibold text-slate-200 block leading-tight truncate max-w-[120px]">
                      {user.displayName}
                    </span>
                    <span className="text-[10px] text-teal-400 font-semibold flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 bg-teal-400 rounded-full inline-block"></span> Cloud Synced
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                    title="ออกจากระบบ"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={loginWithGoogle}
                  className="flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/5 cursor-pointer"
                >
                  <LogIn size={15} />
                  <span>เข้าสู่ระบบ Google</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Workspace layout */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-6 py-6 space-y-6 relative z-10">
        
        {/* Tab Selection Navigation bar */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab("work")}
            className={`flex items-center space-x-2 pb-3.5 px-4 font-semibold text-sm transition-all border-b-2 relative cursor-pointer ${
              activeTab === "work"
                ? "border-teal-400 text-teal-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ClipboardList size={16} />
            <span>บันทึกการทำงาน</span>
          </button>
          <button
            onClick={() => setActiveTab("car")}
            className={`flex items-center space-x-2 pb-3.5 px-4 font-semibold text-sm transition-all border-b-2 relative cursor-pointer ${
              activeTab === "car"
                ? "border-teal-400 text-teal-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Car size={16} />
            <span>การใช้รถ</span>
          </button>
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex items-center space-x-2 pb-3.5 px-4 font-semibold text-sm transition-all border-b-2 relative cursor-pointer ${
              activeTab === "summary"
                ? "border-teal-400 text-teal-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 size={16} />
            <span>สรุปผลรายเดือน</span>
          </button>
        </div>

        {/* Dynamic loading indicators for background syncing */}
        {dataLoading && (
          <div className="flex items-center justify-center space-x-2 py-4 bg-white/5 rounded-2xl border border-white/10 text-teal-400 text-xs font-semibold backdrop-blur-md relative z-10 shadow-lg">
            <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
            <span>กำลังอัปเดตข้อมูลจากระบบ Cloud...</span>
          </div>
        )}

        {/* Workspace Active screen router */}
        <div className="min-h-[400px]">
          {activeTab === "work" && <WorkLogTab selectedMonth={selectedMonth} />}
          {activeTab === "car" && <CarUsageLogTab selectedMonth={selectedMonth} />}
          {activeTab === "summary" && <MonthlySummaryTab selectedMonth={selectedMonth} />}
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white/5 border-t border-white/10 py-6 mt-12 text-center text-xs text-slate-400 font-sans backdrop-blur-md relative z-10">
        <p>© {new Date().getFullYear()} FLEET LOG PRO • พัฒนาด้วยความพิถีพิถันด้วยธีม Frosted Glass</p>
      </footer>

      {/* Floating PWA Install Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 z-50 bg-slate-900/95 border border-teal-500/30 p-5 rounded-3xl shadow-2xl backdrop-blur-xl text-white flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-teal-500 to-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
              <Smartphone size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">ติดตั้งแอปพลิเคชันมือถือ 📱</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                ติดตั้ง <b>FLEET LOG PRO</b> บนหน้าจอมือถือหรือคอมพิวเตอร์เพื่อเปิดหน้าต่างแยกต่างหาก รันได้รวดเร็ว และใช้งานได้ทันทีแม้ไม่ได้เชื่อมต่อเน็ต
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 justify-end">
            <button
              onClick={() => setShowInstallBanner(false)}
              className="px-4 py-2 hover:bg-white/5 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              ภายหลัง
            </button>
            <button
              onClick={handleInstallPWA}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-600 hover:to-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-teal-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={13} />
              <span>ติดตั้งทันที</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <MainAppContent />
    </DataProvider>
  );
}
