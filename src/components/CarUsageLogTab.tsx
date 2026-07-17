import React, { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { THAI_PROVINCES } from "../data/provinces";
import { CarLog } from "../types";
import {
  Calendar,
  Tag,
  MapPin,
  Compass,
  User,
  Truck,
  Gauge,
  Droplet,
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  Receipt
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getCycleMonth } from "../utils/excel";

interface CarUsageLogTabProps {
  selectedMonth: string;
}

export const CarUsageLogTab: React.FC<CarUsageLogTabProps> = ({ selectedMonth }) => {
  const { carLogs, addCarLog, updateCarLog, deleteCarLog } = useData();

  // State for form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [jobType, setJobType] = useState("ติดตั้งใหม่");
  const [jobTypeOther, setJobTypeOther] = useState("");
  const [startPoint, setStartPoint] = useState("ออฟฟิศขอนแก่น");
  const [destination, setDestination] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerUser, setCustomerUser] = useState("");
  const [destinationProvince, setDestinationProvince] = useState("ขอนแก่น");
  
  // Fuel fields
  const [fuelReceiptNo, setFuelReceiptNo] = useState("");
  const [fuelReceiptCost, setFuelReceiptCost] = useState<number | "">("");
  
  // Odometer & Fuel math
  const [startOdometer, setStartOdometer] = useState<number | "">("");
  const [endOdometer, setEndOdometer] = useState<number | "">("");
  const [fuelLiters, setFuelLiters] = useState<number | "">("");
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState<number | "">("");

  // Filter logs for selected month
  const filteredLogs = carLogs.filter((log) => getCycleMonth(log.date) === selectedMonth);

  // Totals
  const totalDistance = filteredLogs.reduce(
    (sum, log) => sum + (log.endOdometer - log.startOdometer),
    0
  );
  const totalLiters = filteredLogs.reduce((sum, log) => sum + log.fuelLiters, 0);
  const totalFuelCost = filteredLogs.reduce(
    (sum, log) => sum + log.fuelLiters * log.fuelPricePerLiter,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !destination.trim() ||
      !customerName.trim() ||
      !customerUser.trim() ||
      startOdometer === "" ||
      endOdometer === "" ||
      fuelLiters === "" ||
      fuelPricePerLiter === ""
    ) {
      setFormError("กรุณากรอกข้อมูลหลักให้ครบถ้วน");
      return;
    }

    if (Number(endOdometer) < Number(startOdometer)) {
      setFormError("เลขไมล์สิ้นสุด ต้องมากกว่าหรือเท่ากับ เลขไมล์เริ่มต้น");
      return;
    }

    setFormError(null);

    const payload = {
      date,
      jobType,
      jobTypeOther: jobType === "อื่นๆ" ? jobTypeOther : "",
      startPoint,
      destination: destination.trim(),
      customerName: customerName.trim(),
      customerUser: customerUser.trim(),
      destinationProvince,
      fuelReceiptNo: fuelReceiptNo.trim() || "",
      fuelReceiptCost: fuelReceiptCost ? Number(fuelReceiptCost) : 0,
      startOdometer: Number(startOdometer),
      endOdometer: Number(endOdometer),
      fuelLiters: Number(fuelLiters),
      fuelPricePerLiter: Number(fuelPricePerLiter),
    };

    try {
      if (editingId) {
        await updateCarLog(editingId, payload);
        setEditingId(null);
      } else {
        await addCarLog(payload);
      }
    } catch (err: any) {
      setFormError("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
      return;
    }

    // Reset fields for fast consecutive entries
    setDestination("");
    setCustomerName("");
    setCustomerUser("");
    setFuelReceiptNo("");
    setFuelReceiptCost("");
    setStartOdometer("");
    setEndOdometer("");
    setFuelLiters("");
    setFuelPricePerLiter("");
    setIsFormOpen(false);
  };

  const startEdit = (log: CarLog) => {
    setFormError(null);
    setEditingId(log.id);
    setDate(log.date);
    setJobType(log.jobType);
    setJobTypeOther(log.jobTypeOther || "");
    setStartPoint(log.startPoint);
    setDestination(log.destination);
    setCustomerName(log.customerName);
    setCustomerUser(log.customerUser);
    setDestinationProvince(log.destinationProvince);
    setFuelReceiptNo(log.fuelReceiptNo || "");
    setFuelReceiptCost(log.fuelReceiptCost || "");
    setStartOdometer(log.startOdometer);
    setEndOdometer(log.endOdometer);
    setFuelLiters(log.fuelLiters);
    setFuelPricePerLiter(log.fuelPricePerLiter);
    setIsFormOpen(true);
  };

  const cancelEdit = () => {
    setFormError(null);
    setEditingId(null);
    setDestination("");
    setCustomerName("");
    setCustomerUser("");
    setFuelReceiptNo("");
    setFuelReceiptCost("");
    setStartOdometer("");
    setEndOdometer("");
    setFuelLiters("");
    setFuelPricePerLiter("");
    setIsFormOpen(false);
  };

  return (
    <div id="car-usage-section" className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center space-x-4 shadow-lg backdrop-blur-md">
          <div className="p-3 bg-amber-500/15 text-amber-300 rounded-xl">
            <Gauge size={24} />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block font-sans">ระยะทางสะสม</span>
            <span className="text-2xl font-bold text-amber-400 font-mono">{totalDistance.toLocaleString()} กม.</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center space-x-4 shadow-lg backdrop-blur-md">
          <div className="p-3 bg-sky-500/15 text-sky-300 rounded-xl">
            <Droplet size={24} />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block font-sans">ปริมาณน้ำมันรวม</span>
            <span className="text-2xl font-bold text-sky-400 font-mono">{totalLiters.toLocaleString()} ลิตร</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center space-x-4 shadow-lg backdrop-blur-md">
          <div className="p-3 bg-rose-500/15 text-rose-300 rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block font-sans">ค่าน้ำมันรวม</span>
            <span className="text-2xl font-bold text-rose-400 font-mono">฿{parseFloat(totalFuelCost.toFixed(2)).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md">
        <div>
          <h3 className="text-lg font-semibold text-white">รายการบันทึกการใช้รถ</h3>
          <p className="text-xs text-slate-400">พบ {filteredLogs.length} รายการในเดือนนี้</p>
        </div>
        <button
          id="btn-add-car-log"
          onClick={() => {
            setIsFormOpen(true);
          }}
          className="flex items-center space-x-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
        >
          <Plus size={16} />
          <span>เพิ่มบันทึกใช้รถ</span>
        </button>
      </div>

      {/* Form Popup Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/80 backdrop-blur-sm overflow-y-auto">
            {/* Modal Backdrop click to close */}
            <div className="absolute inset-0 cursor-default" onClick={cancelEdit}></div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0f172a] border border-white/10 rounded-3xl p-6 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-white/10 relative z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button in corner */}
              <button
                type="button"
                onClick={cancelEdit}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                title="ปิด"
              >
                <X size={20} />
              </button>

              <h4 className="font-semibold text-lg text-white border-b border-white/10 pb-4 flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-full inline-block animate-pulse"></span>
                <span>{editingId ? "แก้ไขข้อมูลการใช้รถ" : "เพิ่มข้อมูลการใช้รถใหม่"}</span>
              </h4>

              {formError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-xs font-medium font-sans">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. วันเดือนปี */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">วันเดือนปี</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 text-teal-400" size={18} />
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 bg-[#0f172a]/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 text-white font-mono"
                    />
                  </div>
                </div>

                {/* 2. จุดเริ่มต้น */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">จุดเริ่มต้น</label>
                  <div className="relative">
                    <Compass className="absolute left-3 top-3.5 text-teal-400" size={18} />
                    <input
                      type="text"
                      required
                      value={startPoint}
                      onChange={(e) => setStartPoint(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 bg-[#0f172a]/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 text-white"
                    />
                  </div>
                </div>

                {/* 3. ปลายทาง (สถานที่/รายละเอียด) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">ปลายทาง (สถานที่/รายละเอียด)</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 text-teal-400" size={18} />
                    <input
                      type="text"
                      required
                      placeholder="เช่น นิคมอุตสาหกรรมขอนแก่น"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 bg-[#0f172a]/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 text-white placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* 4. ประเภทงาน */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">ประเภทงาน</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-3.5 text-teal-400" size={18} />
                    <select
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 bg-[#0f172a]/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 text-white appearance-none"
                    >
                      <option value="ติดตั้งใหม่" className="bg-[#0f172a] text-white">ติดตั้งใหม่</option>
                      <option value="Service" className="bg-[#0f172a] text-white">Service</option>
                      <option value="ถอดเครื่อง" className="bg-[#0f172a] text-white">ถอดเครื่อง</option>
                      <option value="เปลี่ยนซิม" className="bg-[#0f172a] text-white">เปลี่ยนซิม</option>
                      <option value="อื่นๆ" className="bg-[#0f172a] text-white">อื่นๆ (ระบุด้านล่าง)</option>
                    </select>
                  </div>
                </div>

                {/* Detail column if job type is "อื่นๆ" */}
                {jobType === "อื่นๆ" && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">รายละเอียดงานอื่นๆ (ระบุ)</label>
                    <input
                      type="text"
                      required
                      placeholder="ระบุรายละเอียดงาน..."
                      value={jobTypeOther}
                      onChange={(e) => setJobTypeOther(e.target.value)}
                      className="w-full px-3 py-3 bg-[#0f172a]/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 text-white"
                    />
                  </div>
                )}

                {/* 5. ชื่อลูกค้า */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">ชื่อลูกค้า</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 text-teal-400" size={18} />
                    <input
                      type="text"
                      required
                      placeholder="เช่น สมชาย ใจดี"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 bg-[#0f172a]/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 text-white placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* 6. User ลูกค้า */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">User ลูกค้า</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 text-teal-400" size={18} />
                    <input
                      type="text"
                      required
                      placeholder="เช่น CUST-9921"
                      value={customerUser}
                      onChange={(e) => setCustomerUser(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 bg-[#0f172a]/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 text-white placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* 7. จังหวัดปลายทาง */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">จังหวัดปลายทาง</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 text-teal-400" size={18} />
                    <select
                      value={destinationProvince}
                      onChange={(e) => setDestinationProvince(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 bg-[#0f172a]/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 text-white appearance-none"
                    >
                      {THAI_PROVINCES.map((region) => (
                        <optgroup key={region.region} label={region.region} className="bg-[#0f172a] text-slate-400">
                          {region.provinces.map((p) => (
                            <option key={p} value={p} className="bg-[#0f172a] text-white">
                              {p}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 8. จำนวนเงินในใบเสร็จ */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">จำนวนเงินในใบเสร็จ (บาท / ถ้ามี)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3.5 text-teal-400" size={18} />
                    <input
                      type="number"
                      placeholder="เช่น 1500"
                      value={fuelReceiptCost}
                      onChange={(e) => setFuelReceiptCost(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full pl-10 pr-3 py-3 bg-[#0f172a]/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 text-white font-mono placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* 9. เลขไมล์เริ่ม */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">เลขไมล์เริ่ม</label>
                  <div className="relative">
                    <Gauge className="absolute left-3 top-3.5 text-teal-400" size={18} />
                    <input
                      type="number"
                      required
                      placeholder="เช่น 152340"
                      value={startOdometer}
                      onChange={(e) => setStartOdometer(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full pl-10 pr-3 py-3 bg-[#0f172a]/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 text-white font-mono placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* 10. เลขไมล์สิ้นสุด */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">เลขไมล์สิ้นสุด</label>
                  <div className="relative">
                    <Gauge className="absolute left-3 top-3.5 text-teal-400" size={18} />
                    <input
                      type="number"
                      required
                      placeholder="เช่น 152560"
                      value={endOdometer}
                      onChange={(e) => setEndOdometer(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full pl-10 pr-3 py-3 bg-[#0f172a]/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 text-white font-mono placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* 11. น้ำมัน (ลิตร) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">น้ำมัน (ลิตร)</label>
                  <div className="relative">
                    <Droplet className="absolute left-3 top-3.5 text-teal-400" size={18} />
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="เช่น 45.2"
                      value={fuelLiters}
                      onChange={(e) => setFuelLiters(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full pl-10 pr-3 py-3 bg-[#0f172a]/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 text-white font-mono placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* 12. ราคาน้ำมันต่อลิตร (บาท) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">ราคาน้ำมันต่อลิตร (บาท)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3.5 text-teal-400" size={18} />
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="เช่น 38.50"
                      value={fuelPricePerLiter}
                      onChange={(e) => setFuelPricePerLiter(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full pl-10 pr-3 py-3 bg-[#0f172a]/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 text-white font-mono placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* 13. ใบเสร็จน้ำมัน (เลขใบเสร็จ / ถ้ามี) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">ใบเสร็จน้ำมัน (เลขใบเสร็จ / ถ้ามี)</label>
                  <div className="relative">
                    <Receipt className="absolute left-3 top-3.5 text-teal-400" size={18} />
                    <input
                      type="text"
                      placeholder="เช่น INV-2026-081"
                      value={fuelReceiptNo}
                      onChange={(e) => setFuelReceiptNo(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 bg-[#0f172a]/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 text-white font-mono placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* Math preview */}
                <div className="md:col-span-3 bg-[#0f172a]/40 border border-white/10 rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block font-sans">ระยะทางสะสม</span>
                    <span className="font-bold text-teal-400 font-mono">
                      {startOdometer !== "" && endOdometer !== ""
                        ? `${Number(endOdometer) - Number(startOdometer)} กม.`
                        : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block font-sans">ค่าน้ำมันคำนวณได้</span>
                    <span className="font-bold text-indigo-400 font-mono">
                      {fuelLiters !== "" && fuelPricePerLiter !== ""
                        ? `฿${(Number(fuelLiters) * Number(fuelPricePerLiter)).toFixed(2)}`
                        : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block font-sans">อัตรากินน้ำมัน</span>
                    <span className="font-bold text-sky-400 font-mono">
                      {startOdometer !== "" && endOdometer !== "" && fuelLiters !== "" && Number(fuelLiters) > 0
                        ? `${((Number(endOdometer) - Number(startOdometer)) / Number(fuelLiters)).toFixed(1)} กม./ลิตร`
                        : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block font-sans">ยอดเงินในใบเสร็จ</span>
                    <span className="font-bold text-purple-400 font-mono">
                      {fuelReceiptCost ? `฿${Number(fuelReceiptCost).toLocaleString()}` : "-"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="md:col-span-3 flex justify-end space-x-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer flex items-center space-x-2 shadow-lg shadow-indigo-500/20"
                  >
                    <Check size={16} />
                    <span>{editingId ? "บันทึกการแก้ไข" : "บันทึกข้อมูลใช้รถ"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/80 backdrop-blur-sm">
            <div className="absolute inset-0 cursor-default" onClick={() => setDeletingId(null)}></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 shadow-2xl w-full max-w-md relative z-10 text-center space-y-4"
            >
              <div className="mx-auto w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center border border-red-500/20">
                <Trash2 size={24} />
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-lg text-white font-sans">ยืนยันการลบข้อมูล</h4>
                <p className="text-sm text-slate-400 font-sans">คุณแน่ใจหรือไม่ว่าต้องการลบบันทึกรายการใช้รถนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (deletingId) {
                      await deleteCarLog(deletingId);
                      setDeletingId(null);
                    }
                  }}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer shadow-lg shadow-red-500/20"
                >
                  ยืนยันการลบ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Car Logs List Table / Cards */}
      <div className="bg-white/5 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Desktop View (Visible on medium screens and up) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="py-4 px-5 text-xs font-semibold text-slate-400 font-sans w-[10%]">วันเดือนปี</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-400 font-sans w-[22%]">เส้นทาง (ต้นทาง ➔ ปลายทาง)</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-400 font-sans w-[12%]">ประเภทงาน</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-400 font-sans w-[15%]">ลูกค้า / User</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-400 font-sans w-[15%]">เลขไมล์ & ระยะทาง</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-400 font-sans w-[18%]">ใบเสร็จ & ข้อมูลน้ำมัน</th>
                <th className="py-4 px-5 text-xs font-semibold text-slate-400 font-sans text-center w-[8%]">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                    ไม่มีข้อมูลบันทึกการใช้รถในเดือนนี้
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const distance = log.endOdometer - log.startOdometer;
                  return (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      {/* 1. วันเดือนปี */}
                      <td className="py-4 px-5 font-medium text-slate-200 font-mono whitespace-nowrap">{log.date}</td>
                      
                      {/* 2 & 3 & 7. เส้นทาง (ต้นทาง ➔ ปลายทาง + จังหวัดปลายทาง) */}
                      <td className="py-4 px-4">
                        <div className="flex items-center flex-wrap gap-1">
                          <span className="text-slate-300 font-medium">{log.startPoint}</span>
                          <span className="text-teal-400 font-sans font-bold">➔</span>
                          <span className="text-white font-semibold">{log.destination}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                          <MapPin size={11} className="text-teal-400 flex-shrink-0" />
                          <span>จังหวัด: {log.destinationProvince}</span>
                        </div>
                      </td>
                      
                      {/* 4. ประเภทงาน */}
                      <td className="py-4 px-4">
                        {log.jobType === "อื่นๆ" ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium">
                            อื่นๆ ({log.jobTypeOther || "-"})
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                              log.jobType === "ติดตั้งใหม่"
                                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                                : log.jobType === "Service"
                                ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                                : log.jobType === "ถอดเครื่อง"
                                ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                                : "bg-sky-500/10 text-sky-300 border border-sky-500/20"
                            }`}
                          >
                            {log.jobType}
                          </span>
                        )}
                      </td>
                      
                      {/* 5 & 6. ลูกค้า / User */}
                      <td className="py-4 px-4">
                        <div className="text-slate-200 font-medium truncate max-w-[150px]" title={log.customerName}>
                          {log.customerName}
                        </div>
                        <div className="text-xs font-mono text-slate-400 mt-0.5 truncate max-w-[150px]" title={log.customerUser}>
                          User: {log.customerUser}
                        </div>
                      </td>
                      
                      {/* 9 & 10. เลขไมล์ & ระยะทาง */}
                      <td className="py-4 px-4 text-xs space-y-0.5">
                        <div className="text-slate-400">
                          เริ่ม: <span className="font-mono text-slate-200 font-medium">{log.startOdometer.toLocaleString()}</span>
                        </div>
                        <div className="text-slate-400">
                          สิ้นสุด: <span className="font-mono text-slate-200 font-medium">{log.endOdometer.toLocaleString()}</span>
                        </div>
                        <div className="text-teal-400 font-medium">
                          ระยะทาง: <span className="font-mono font-bold">{distance.toLocaleString()} กม.</span>
                        </div>
                      </td>
                      
                      {/* 8 & 11 & 12 & 13. ข้อมูลน้ำมัน & ใบเสร็จ */}
                      <td className="py-4 px-4 text-xs space-y-0.5">
                        <div className="text-slate-400 flex items-center gap-1">
                          เงินใบเสร็จ: 
                          <span className="font-bold text-purple-300 font-mono">
                            {log.fuelReceiptCost ? `฿${log.fuelReceiptCost.toLocaleString()}` : "-"}
                          </span>
                        </div>
                        <div className="text-slate-400">
                          น้ำมัน: <span className="font-mono text-slate-300">{log.fuelLiters} ล.</span> (@ ฿{log.fuelPricePerLiter})
                        </div>
                        <div className="text-slate-400 truncate max-w-[170px]" title={log.fuelReceiptNo}>
                          เลขที่: <span className="font-mono text-indigo-300">{log.fuelReceiptNo || "-"}</span>
                        </div>
                      </td>
                      
                      {/* จัดการ */}
                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => startEdit(log)}
                            className="p-1.5 hover:bg-white/10 text-indigo-300 rounded-lg transition-colors cursor-pointer"
                            title="แก้ไข"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setDeletingId(log.id)}
                            className="p-1.5 hover:bg-red-500/20 text-red-300 rounded-lg transition-colors cursor-pointer"
                            title="ลบ"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View (Visible on small screens) */}
        <div className="block md:hidden divide-y divide-white/5">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-sans">
              ไม่มีข้อมูลบันทึกการใช้รถในเดือนนี้
            </div>
          ) : (
            filteredLogs.map((log) => {
              const distance = log.endOdometer - log.startOdometer;
              return (
                <div key={log.id} className="p-4 space-y-3 hover:bg-white/5 transition-colors">
                  {/* Top Header Row of card: Date and Job Type Badge */}
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-sm text-slate-200 font-semibold bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                      {log.date}
                    </span>
                    <div>
                      {log.jobType === "อื่นๆ" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium">
                          อื่นๆ ({log.jobTypeOther || "-"})
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                            log.jobType === "ติดตั้งใหม่"
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                              : log.jobType === "Service"
                              ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                              : log.jobType === "ถอดเครื่อง"
                              ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                              : "bg-sky-500/10 text-sky-300 border border-sky-500/20"
                          }`}
                        >
                          {log.jobType}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Route & Destination */}
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-400 text-xs font-sans">เส้นทาง:</span>
                      <span className="text-slate-200 font-semibold text-sm">{log.startPoint}</span>
                      <span className="text-teal-400 font-sans font-bold">➔</span>
                      <span className="text-white font-bold text-sm">{log.destination}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <MapPin size={12} className="text-teal-400 flex-shrink-0" />
                      <span>จังหวัดปลายทาง: <span className="text-slate-200 font-medium">{log.destinationProvince}</span></span>
                    </div>
                  </div>

                  {/* Customer and Mileage layout */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-slate-400 text-[10px] block font-sans uppercase font-semibold">ลูกค้า / User</span>
                      <span className="text-slate-200 font-semibold text-xs block truncate" title={log.customerName}>
                        {log.customerName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 block truncate" title={log.customerUser}>
                        User: {log.customerUser}
                      </span>
                    </div>

                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-slate-400 text-[10px] block font-sans uppercase font-semibold">เลขไมล์ & ระยะทาง</span>
                      <div className="text-[11px] text-slate-300">เริ่ม: <span className="font-mono text-white font-medium">{log.startOdometer.toLocaleString()}</span></div>
                      <div className="text-[11px] text-slate-300">สิ้นสุด: <span className="font-mono text-white font-medium">{log.endOdometer.toLocaleString()}</span></div>
                      <div className="text-teal-400 font-semibold text-[11px] mt-0.5">
                        ระยะทาง: <span className="font-mono font-bold text-xs">{distance.toLocaleString()} กม.</span>
                      </div>
                    </div>
                  </div>

                  {/* Fuel Receipt Area */}
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-xs space-y-1.5">
                    <span className="text-slate-400 text-[10px] block font-sans uppercase font-semibold">ข้อมูลน้ำมัน & ใบเสร็จ</span>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 text-xs">เงินใบเสร็จ:</span>
                      <span className="font-bold text-purple-300 font-mono text-xs">
                        {log.fuelReceiptCost ? `฿${log.fuelReceiptCost.toLocaleString()}` : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 text-xs">ปริมาณน้ำมัน:</span>
                      <span className="font-mono text-slate-200 text-xs">
                        {log.fuelLiters} ล. (@ ฿{log.fuelPricePerLiter.toFixed(2)})
                      </span>
                    </div>
                    {log.fuelReceiptNo && (
                      <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1.5 border-t border-white/5">
                        <span>เลขที่ใบเสร็จ:</span>
                        <span className="font-mono text-indigo-300">{log.fuelReceiptNo}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Area */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => {
                        startEdit(log);
                        // Auto-scroll to form top or focus
                        const element = document.getElementById("car-usage-section");
                        if (element) {
                          element.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-xl text-xs font-semibold border border-indigo-500/20 transition-all cursor-pointer"
                    >
                      <Edit2 size={13} />
                      <span>แก้ไข</span>
                    </button>
                    <button
                      onClick={() => setDeletingId(log.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold border border-rose-500/20 transition-all cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>ลบ</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
