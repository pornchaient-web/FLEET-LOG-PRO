import React, { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { THAI_PROVINCES } from "../data/provinces";
import { WorkLog } from "../types";
import { Calendar, Tag, User, MapPin, Truck, Award, Plus, Trash2, Edit2, X, Check, Eye } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getCycleMonth } from "../utils/excel";

interface WorkLogTabProps {
  selectedMonth: string;
}

export const WorkLogTab: React.FC<WorkLogTabProps> = ({ selectedMonth }) => {
  const { workLogs, addWorkLog, updateWorkLog, deleteWorkLog } = useData();

  // State for form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [jobType, setJobType] = useState("ติดตั้งใหม่");
  const [jobTypeOther, setJobTypeOther] = useState("");
  const [customerUser, setCustomerUser] = useState("");
  const [customerLicensePlate, setCustomerLicensePlate] = useState("");
  const [province, setProvince] = useState("ขอนแก่น");

  // Calculated values for preview
  const [commission, setCommission] = useState(50);
  const [allowance, setAllowance] = useState(0);
  const [hasExistingAllowanceToday, setHasExistingAllowanceToday] = useState(false);

  // Update commission when job type changes
  useEffect(() => {
    if (jobType === "เปลี่ยนซิม") {
      setCommission(20);
    } else {
      setCommission(50);
    }
  }, [jobType]);

  // Update allowance based on province and date
  useEffect(() => {
    if (province === "ขอนแก่น") {
      setAllowance(0);
      setHasExistingAllowanceToday(false);
      return;
    }

    // Check if there is already an allowance counted on this date
    // Ignore the current editing record if we are editing
    const otherLogsThisDay = workLogs.filter(
      (log) => log.date === date && log.id !== editingId
    );
    
    // In Thailand, Khon Kaen is 0, any other is 100.
    // If there's already ANY work log on this date with an allowance, then this new/modified one gets 0.
    const hasAllowanceAlready = otherLogsThisDay.some((log) => log.allowance > 0);

    if (hasAllowanceAlready) {
      setAllowance(0);
      setHasExistingAllowanceToday(true);
    } else {
      setAllowance(100);
      setHasExistingAllowanceToday(false);
    }
  }, [province, date, workLogs, editingId]);

  // Filter logs for the selected month
  const filteredLogs = workLogs.filter((log) => getCycleMonth(log.date) === selectedMonth);

  // Totals
  const totalCommission = filteredLogs.reduce((sum, log) => sum + log.commission, 0);
  const totalAllowance = filteredLogs.reduce((sum, log) => sum + log.allowance, 0);
  const totalAmount = totalCommission + totalAllowance;

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerUser.trim() || !customerLicensePlate.trim()) {
      setFormError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setFormError(null);

    const payload = {
      date,
      jobType,
      jobTypeOther: jobType === "อื่นๆ" ? jobTypeOther : "",
      commission,
      customerUser: customerUser.trim(),
      customerLicensePlate: customerLicensePlate.trim(),
      province,
      allowance,
    };

    try {
      if (editingId) {
        await updateWorkLog(editingId, payload);
        setEditingId(null);
      } else {
        await addWorkLog(payload);
      }
    } catch (err: any) {
      setFormError("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
      return;
    }

    // Reset form except date and province for fast consecutive entry
    setCustomerUser("");
    setCustomerLicensePlate("");
    setJobType("ติดตั้งใหม่");
    setJobTypeOther("");
    setIsFormOpen(false);
  };

  const startEdit = (log: WorkLog) => {
    setFormError(null);
    setEditingId(log.id);
    setDate(log.date);
    setJobType(log.jobType);
    setJobTypeOther(log.jobTypeOther || "");
    setCustomerUser(log.customerUser);
    setCustomerLicensePlate(log.customerLicensePlate);
    setProvince(log.province);
    setIsFormOpen(true);
  };

  const cancelEdit = () => {
    setFormError(null);
    setEditingId(null);
    setCustomerUser("");
    setCustomerLicensePlate("");
    setJobType("ติดตั้งใหม่");
    setJobTypeOther("");
    setIsFormOpen(false);
  };

  return (
    <div id="work-log-section" className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center space-x-4 shadow-lg backdrop-blur-md">
          <div className="p-3 bg-teal-500/15 text-teal-300 rounded-xl">
            <Award size={24} />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block font-sans">ค่าคอมมิชชั่นสะสม</span>
            <span className="text-2xl font-bold text-teal-400 font-mono">฿{totalCommission.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center space-x-4 shadow-lg backdrop-blur-md">
          <div className="p-3 bg-indigo-500/15 text-indigo-300 rounded-xl">
            <MapPin size={24} />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block font-sans">เบี้ยเลี้ยงสะสม</span>
            <span className="text-2xl font-bold text-indigo-400 font-mono">฿{totalAllowance.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center space-x-4 shadow-lg backdrop-blur-md">
          <div className="p-3 bg-purple-500/15 text-purple-300 rounded-xl">
            <Truck size={24} />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block font-sans">รวมรายรับทั้งสิ้น</span>
            <span className="text-2xl font-bold text-purple-400 font-mono">฿{totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Trigger & Header */}
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md">
        <div>
          <h3 className="text-lg font-semibold text-white">รายการบันทึกการทำงาน</h3>
          <p className="text-xs text-slate-400">พบ {filteredLogs.length} รายการในเดือนนี้</p>
        </div>
        <button
          id="btn-add-work-log"
          onClick={() => {
            setIsFormOpen(true);
          }}
          className="flex items-center space-x-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
        >
          <Plus size={16} />
          <span>เพิ่มบันทึกงาน</span>
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
              className="bg-[#0f172a] border border-white/10 rounded-3xl p-6 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-white/10 relative z-10"
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
                <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full inline-block animate-pulse"></span>
                <span>{editingId ? "แก้ไขข้อมูลการทำงาน" : "เพิ่มข้อมูลการทำงานใหม่"}</span>
              </h4>

              {formError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-xs font-medium font-sans">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Date selection */}
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

                {/* Job type selection */}
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

                {/* Custom Job Type Other */}
                {jobType === "อื่นๆ" && (
                  <div className="md:col-span-2 space-y-1.5">
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

                {/* Customer User */}
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

                {/* Customer License Plate */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">ทะเบียนรถลูกค้า</label>
                  <div className="relative">
                    <Truck className="absolute left-3 top-3.5 text-teal-400" size={18} />
                    <input
                      type="text"
                      required
                      placeholder="เช่น กข 1234 ขอนแก่น"
                      value={customerLicensePlate}
                      onChange={(e) => setCustomerLicensePlate(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 bg-[#0f172a]/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 text-white placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* Province */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">จังหวัดหน้างาน</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 text-teal-400" size={18} />
                    <select
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
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

                {/* Live calculations view */}
                <div className="bg-[#0f172a]/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-center space-y-2">
                  <span className="text-xs font-semibold text-slate-400">ผลการคำนวณเบื้องต้น:</span>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-300 font-sans">ค่าคอมมิชชั่น:</span>
                    <span className="font-bold text-teal-400 font-mono">฿{commission}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-300 font-sans">เบี้ยเลี้ยง:</span>
                    <div className="text-right">
                      <span className="font-bold text-indigo-400 font-mono">฿{allowance}</span>
                      {hasExistingAllowanceToday && (
                        <span className="block text-[10px] text-amber-400 font-sans">
                          (มีบันทึกเบี้ยเลี้ยงจังหวัดอื่นแล้วในวันนี้)
                        </span>
                      )}
                      {province === "ขอนแก่น" && (
                        <span className="block text-[10px] text-slate-400 font-sans">
                          (งดเบี้ยเลี้ยงในพื้นที่ขอนแก่น)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="md:col-span-2 flex justify-end space-x-3 pt-4 border-t border-white/10">
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
                    <span>{editingId ? "บันทึกการแก้ไข" : "บันทึกงาน"}</span>
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
                <p className="text-sm text-slate-400 font-sans">คุณแน่ใจหรือไม่ว่าต้องการลบบันทึกรายการทำงานนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
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
                      await deleteWorkLog(deletingId);
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

      {/* Work Logs List Table / Cards */}
      <div className="bg-white/5 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Desktop View (Visible on medium screens and up) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="py-4 px-5 text-xs font-semibold text-slate-400 font-sans">วันเดือนปี</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-400 font-sans">ประเภทงาน</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-400 font-sans">User ลูกค้า</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-400 font-sans">ทะเบียนรถลูกค้า</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-400 font-sans">จังหวัดหน้างาน</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-400 font-sans text-right">ค่าคอม (฿)</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-400 font-sans text-right">เบี้ยเลี้ยง (฿)</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-400 font-sans text-right">รวม (฿)</th>
                <th className="py-4 px-5 text-xs font-semibold text-slate-400 font-sans text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-sans">
                    ไม่มีข้อมูลบันทึกการทำงานในเดือนนี้
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-5 font-medium text-slate-200 font-mono">{log.date}</td>
                    <td className="py-4 px-4 text-slate-300">
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
                    <td className="py-4 px-4 font-mono text-slate-300">{log.customerUser}</td>
                    <td className="py-4 px-4 text-slate-300">{log.customerLicensePlate}</td>
                    <td className="py-4 px-4 text-slate-300">
                      <span className="flex items-center gap-1 text-slate-300">
                        <MapPin size={14} className="text-teal-400" />
                        {log.province}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-teal-400 font-mono">฿{log.commission}</td>
                    <td className="py-4 px-4 text-right font-semibold text-indigo-400 font-mono">
                      <span className={log.allowance > 0 ? "text-indigo-400" : "text-slate-500"}>
                        ฿{log.allowance}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-teal-300 font-mono">
                      ฿{log.commission + log.allowance}
                    </td>
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View (Visible on small screens) */}
        <div className="block md:hidden divide-y divide-white/5">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-sans">
              ไม่มีข้อมูลบันทึกการทำงานในเดือนนี้
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-4 space-y-3 hover:bg-white/5 transition-colors">
                {/* Top header row: Date and Job Type Badge */}
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

                {/* Job Location & customer data */}
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1 text-slate-200 font-medium">
                    <MapPin size={12} className="text-teal-400 flex-shrink-0" />
                    <span>จังหวัดหน้างาน: <span className="text-white font-semibold">{log.province}</span></span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-[11px] text-slate-400">
                    <div>User ลูกค้า: <span className="font-mono text-slate-200 font-medium">{log.customerUser}</span></div>
                    <div>ทะเบียนรถ: <span className="text-slate-200 font-medium">{log.customerLicensePlate || "-"}</span></div>
                  </div>
                </div>

                {/* Earnings breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <span className="text-slate-400 text-[9px] block uppercase font-sans">ค่าคอม</span>
                    <span className="text-teal-400 font-bold font-mono text-xs">฿{log.commission}</span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <span className="text-slate-400 text-[9px] block uppercase font-sans">เบี้ยเลี้ยง</span>
                    <span className="text-indigo-400 font-bold font-mono text-xs">฿{log.allowance}</span>
                  </div>
                  <div className="bg-teal-500/10 p-2.5 rounded-xl border border-teal-500/10">
                    <span className="text-teal-400 text-[9px] block uppercase font-sans font-semibold">รวมรายรับ</span>
                    <span className="text-teal-300 font-extrabold font-mono text-xs">฿{log.commission + log.allowance}</span>
                  </div>
                </div>

                {/* Actions Area */}
                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => {
                      startEdit(log);
                      const element = document.getElementById("work-log-section");
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};
