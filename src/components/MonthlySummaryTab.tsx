import React from "react";
import { useData } from "../context/DataContext";
import { formatMonthThai, getCycleMonth } from "../utils/excel";
import { Award, MapPin, Gauge, Droplet, CheckSquare, Sparkles, TrendingUp, Compass } from "lucide-react";

interface MonthlySummaryTabProps {
  selectedMonth: string;
}

export const MonthlySummaryTab: React.FC<MonthlySummaryTabProps> = ({ selectedMonth }) => {
  const { workLogs, carLogs } = useData();

  // Filter logs for selected month
  const mWorkLogs = workLogs.filter((log) => getCycleMonth(log.date) === selectedMonth);
  const mCarLogs = carLogs.filter((log) => getCycleMonth(log.date) === selectedMonth);

  // 1. Work Stats
  const totalCommission = mWorkLogs.reduce((sum, log) => sum + log.commission, 0);
  const totalAllowance = mWorkLogs.reduce((sum, log) => sum + log.allowance, 0);
  const totalEarnings = totalCommission + totalAllowance;

  // Job Type distribution for Work Logs
  const workJobDist: { [key: string]: number } = {};
  mWorkLogs.forEach((log) => {
    const key = log.jobType === "อื่นๆ" ? `อื่นๆ (${log.jobTypeOther || ""})` : log.jobType;
    workJobDist[key] = (workJobDist[key] || 0) + 1;
  });

  // Province distribution for Work Logs
  const workProvDist: { [key: string]: number } = {};
  mWorkLogs.forEach((log) => {
    workProvDist[log.province] = (workProvDist[log.province] || 0) + 1;
  });

  // 2. Car Stats
  const totalDistance = mCarLogs.reduce((sum, log) => sum + (log.endOdometer - log.startOdometer), 0);
  const totalFuelLiters = mCarLogs.reduce((sum, log) => sum + log.fuelLiters, 0);
  const totalFuelCost = mCarLogs.reduce((sum, log) => sum + log.fuelLiters * log.fuelPricePerLiter, 0);
  const totalReceiptCost = mCarLogs.reduce((sum, log) => sum + (log.fuelReceiptCost || 0), 0);

  // Job Type distribution for Car Logs
  const carJobDist: { [key: string]: number } = {};
  mCarLogs.forEach((log) => {
    const key = log.jobType === "อื่นๆ" ? `อื่นๆ (${log.jobTypeOther || ""})` : log.jobType;
    carJobDist[key] = (carJobDist[key] || 0) + 1;
  });

  // Efficiency
  const kmPerLiter = totalFuelLiters > 0 ? totalDistance / totalFuelLiters : 0;
  const costPerKm = totalDistance > 0 ? totalFuelCost / totalDistance : 0;

  return (
    <div id="monthly-summary-section" className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute left-1/3 bottom-0 translate-y-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="bg-indigo-500/20 text-indigo-300 text-xs px-3 py-1 rounded-full font-medium border border-indigo-400/20 font-sans">
              ภาพรวมสรุปผลงานรายเดือน
            </span>
            <h3 className="text-2xl font-bold mt-2 font-sans">ประจำเดือน {formatMonthThai(selectedMonth)}</h3>
            <p className="text-slate-400 text-sm mt-1">ข้อมูลเชิงสถิติและการเงินจากการทำงานและการใช้ยานพาหนะ</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-right min-w-[200px]">
            <span className="text-xs text-indigo-200 block">ยอดรวมรายรับช่าง</span>
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">฿{totalEarnings.toLocaleString()}</span>
            <span className="text-[10px] text-slate-300 block mt-1">
              (ค่าคอม ฿{totalCommission.toLocaleString()} + เบี้ยเลี้ยง ฿{totalAllowance.toLocaleString()})
            </span>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: งานและการเดินทาง */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-800">ประสิทธิภาพการทำงาน</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <CheckSquare size={18} />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500 text-sm">จำนวนงานที่สำเร็จ</span>
                <span className="font-bold text-slate-900 text-lg font-mono">{mWorkLogs.length} งาน</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500 text-sm">การใช้รถยนต์บันทึก</span>
                <span className="font-bold text-slate-900 text-lg font-mono">{mCarLogs.length} ครั้ง</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">ระยะทางเดินทางรวม</span>
                <span className="font-bold text-slate-900 text-lg font-mono">{totalDistance.toLocaleString()} กม.</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-slate-50 rounded-2xl p-3 text-xs text-slate-500 flex items-center space-x-2">
            <TrendingUp size={14} className="text-indigo-500" />
            <span>สัดส่วนงานต่อการใช้รถ: <b>{mCarLogs.length > 0 ? (mWorkLogs.length / mCarLogs.length).toFixed(1) : 0} งาน/รอบใช้รถ</b></span>
          </div>
        </div>

        {/* Card 2: ประสิทธิภาพการใช้เชื้อเพลิง */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-800">ประสิทธิภาพเชื้อเพลิง</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Droplet size={18} />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500 text-sm">ปริมาณน้ำมันที่ใช้</span>
                <span className="font-bold text-slate-900 text-lg font-mono">{totalFuelLiters.toLocaleString()} ลิตร</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500 text-sm">อัตราสิ้นเปลืองเฉลี่ย</span>
                <span className="font-bold text-slate-900 text-lg font-mono">
                  {kmPerLiter > 0 ? `${kmPerLiter.toFixed(1)} กม./ลิตร` : "0 กม./ลิตร"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">ค่าน้ำมันเฉลี่ย</span>
                <span className="font-bold text-slate-900 text-lg font-mono">
                  {costPerKm > 0 ? `฿${costPerKm.toFixed(2)} / กม.` : "฿0 / กม."}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-slate-50 rounded-2xl p-3 text-xs text-slate-500 flex items-center space-x-2">
            <Sparkles size={14} className="text-amber-500" />
            <span>ยอดเบิกค่าน้ำมันตามใบเสร็จจริงรวม: <b>฿{totalReceiptCost.toLocaleString()}</b></span>
          </div>
        </div>

        {/* Card 3: สรุปค่าใช้จ่ายน้ำมัน */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-800">ต้นทุนค่าพลังงานรวม</span>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <Gauge size={18} />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500 text-sm">ค่าน้ำมันรวม (คำนวณ)</span>
                <span className="font-bold text-rose-600 text-lg font-mono">฿{totalFuelCost.toLocaleString("th-TH", { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500 text-sm">ค่าน้ำมันจริง (ตามใบเสร็จ)</span>
                <span className="font-bold text-indigo-600 text-lg font-mono">฿{totalReceiptCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">ส่วนต่างค่าน้ำมัน</span>
                <span className={`font-bold text-lg font-mono ${totalReceiptCost - totalFuelCost >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                  ฿{Math.abs(totalReceiptCost - totalFuelCost).toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-slate-50 rounded-2xl p-3 text-xs text-slate-500 flex items-center space-x-2">
            <Compass size={14} className="text-rose-500" />
            <span>จุดเริ่มต้นเริ่มต้นที่ออฟฟิศขอนแก่นเป็นหลัก</span>
          </div>
        </div>

      </div>

      {/* Distributions Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Job Type Distribution */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Award size={18} className="text-indigo-500" />
            <span>สัดส่วนประเภทงานทำสำเร็จ ({mWorkLogs.length} งาน)</span>
          </h4>
          <div className="space-y-3">
            {Object.keys(workJobDist).length === 0 ? (
              <p className="text-slate-400 text-sm py-4 text-center">ไม่มีข้อมูลงานในเดือนนี้</p>
            ) : (
              Object.entries(workJobDist).map(([job, count]) => {
                const percentage = ((count / mWorkLogs.length) * 100).toFixed(0);
                return (
                  <div key={job} className="space-y-1">
                    <div className="flex justify-between text-sm text-slate-700 font-medium">
                      <span>{job}</span>
                      <span>{count} งาน ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Province Distribution */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-emerald-500" />
            <span>จังหวัดหน้างานหลักที่ไปปฏิบัติภารกิจ</span>
          </h4>
          <div className="space-y-3">
            {Object.keys(workProvDist).length === 0 ? (
              <p className="text-slate-400 text-sm py-4 text-center">ไม่มีข้อมูลจังหวัดในเดือนนี้</p>
            ) : (
              Object.entries(workProvDist)
                .sort((a, b) => b[1] - a[1]) // highest first
                .map(([prov, count]) => {
                  const percentage = ((count / mWorkLogs.length) * 100).toFixed(0);
                  return (
                    <div key={prov} className="space-y-1">
                      <div className="flex justify-between text-sm text-slate-700 font-medium">
                        <span>{prov} {prov === "ขอนแก่น" ? "(งดเบี้ยเลี้ยง)" : "(เบี้ยเลี้ยง 100฿)"}</span>
                        <span>{count} ครั้ง ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-600 h-full rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
