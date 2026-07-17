import * as XLSX from "xlsx";
import { WorkLog, CarLog } from "../types";

// Get the cycle month for a given date according to the rule:
// 1st to 25th belongs to current month, 26th to end belongs to next month.
export function getCycleMonth(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr.substring(0, 7); // Fallback
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  if (day <= 25) {
    const mStr = month < 10 ? `0${month}` : `${month}`;
    return `${year}-${mStr}`;
  } else {
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    const mStr = nextMonth < 10 ? `0${nextMonth}` : `${nextMonth}`;
    return `${nextYear}-${mStr}`;
  }
}

// Format month string (e.g., '2026-07' -> 'ก.ค. 2026')
export function formatMonthThai(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const thMonths = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];
  const monthIndex = parseInt(month, 10) - 1;
  const thaiYear = parseInt(year, 10) + 543; // Thai Buddhist calendar year
  return `${thMonths[monthIndex]} ${thaiYear}`;
}

export function exportToExcel(
  workLogs: WorkLog[],
  carLogs: CarLog[],
  selectedMonth: string | "all"
) {
  const wb = XLSX.utils.book_new();

  // Helper to filter logs by custom cycle month
  const filterByMonth = (dateStr: string, targetMonth: string) => {
    return getCycleMonth(dateStr) === targetMonth;
  };

  const monthsToExport =
    selectedMonth === "all"
      ? Array.from(
          new Set([
            ...workLogs.map((log) => getCycleMonth(log.date)),
            ...carLogs.map((log) => getCycleMonth(log.date)),
          ])
        ).sort((a, b) => b.localeCompare(a)) // Latest first
      : [selectedMonth];

  if (monthsToExport.length === 0) {
    // If no logs, export empty sheets
    monthsToExport.push(new Date().toISOString().substring(0, 7));
  }

  // Iterate over each month and add sheets
  monthsToExport.forEach((mStr) => {
    const thaiMonthLabel = formatMonthThai(mStr);
    const mWorkLogs = workLogs
      .filter((log) => filterByMonth(log.date, mStr))
      .sort((a, b) => {
        const timeA = a.createdAt || a.date || "";
        const timeB = b.createdAt || b.date || "";
        return timeB.localeCompare(timeA);
      });
    const mCarLogs = carLogs
      .filter((log) => filterByMonth(log.date, mStr))
      .sort((a, b) => {
        const timeA = a.createdAt || a.date || "";
        const timeB = b.createdAt || b.date || "";
        return timeB.localeCompare(timeA);
      });

    // 1. Prepare Work Logs Sheet Data
    const workData = mWorkLogs.map((log, index) => ({
      "ลำดับ": index + 1,
      "วันเดือนปี": log.date,
      "ประเภทงาน": log.jobType === "อื่นๆ" ? `อื่นๆ (${log.jobTypeOther || ""})` : log.jobType,
      "User ลูกค้า": log.customerUser,
      "ทะเบียนรถลูกค้า": log.customerLicensePlate,
      "จังหวัดหน้างาน": log.province,
      "ค่าคอมมิชชั่น (บาท)": log.commission,
      "เบี้ยเลี้ยง (บาท)": log.allowance,
      "รวม (บาท)": log.commission + log.allowance,
    }));

    // Calculate totals for work log
    const totalCommission = mWorkLogs.reduce((sum, item) => sum + item.commission, 0);
    const totalAllowance = mWorkLogs.reduce((sum, item) => sum + item.allowance, 0);
    if (workData.length > 0) {
      workData.push({
        "ลำดับ": "" as any,
        "วันเดือนปี": "รวมทั้งหมด" as any,
        "ประเภทงาน": "" as any,
        "User ลูกค้า": "" as any,
        "ทะเบียนรถลูกค้า": "" as any,
        "จังหวัดหน้างาน": "" as any,
        "ค่าคอมมิชชั่น (บาท)": totalCommission as any,
        "เบี้ยเลี้ยง (บาท)": totalAllowance as any,
        "รวม (บาท)": (totalCommission + totalAllowance) as any,
      });
    }

    const wsWork = XLSX.utils.json_to_sheet(workData);
    // Set column widths
    wsWork["!cols"] = [
      { wch: 8 }, // ลำดับ
      { wch: 15 }, // วันเดือนปี
      { wch: 25 }, // ประเภทงาน
      { wch: 20 }, // User ลูกค้า
      { wch: 18 }, // ทะเบียนรถลูกค้า
      { wch: 18 }, // จังหวัดหน้างาน
      { wch: 20 }, // ค่าคอมมิชชั่น
      { wch: 18 }, // เบี้ยเลี้ยง
      { wch: 15 }, // รวม
    ];

    // Limit worksheet title to 31 chars max (Excel limitation)
    const workSheetName = `งาน-${thaiMonthLabel}`.substring(0, 31);
    XLSX.utils.book_append_sheet(wb, wsWork, workSheetName);

    // 2. Prepare Car Logs Sheet Data
    const carData = mCarLogs.map((log, index) => {
      const distance = log.endOdometer - log.startOdometer;
      const fuelCost = log.fuelLiters * log.fuelPricePerLiter;
      return {
        "ลำดับ": index + 1,
        "วันเดือนปี": log.date,
        "จุดเริ่มต้น": log.startPoint,
        "ปลายทาง (สถานที่/รายละเอียด)": log.destination,
        "ประเภทงาน": log.jobType === "อื่นๆ" ? `อื่นๆ (${log.jobTypeOther || ""})` : log.jobType,
        "ชื่อลูกค้า": log.customerName,
        "User ลูกค้า": log.customerUser,
        "จังหวัดปลายทาง": log.destinationProvince,
        "จำนวนเงินในใบเสร็จ": log.fuelReceiptCost || 0,
        "เลขไมล์เริ่ม": log.startOdometer,
        "เลขไมล์สิ้นสุด": log.endOdometer,
        "น้ำมัน (ลิตร)": log.fuelLiters,
        "ราคาน้ำมันต่อลิตร (บาท)": log.fuelPricePerLiter,
        "ใบเสร็จน้ำมัน (เลขใบเสร็จ / ถ้ามี)": log.fuelReceiptNo || "-",
        "ระยะทาง (กม.)": distance,
        "ค่าน้ำมันรวม (บาท)": parseFloat(fuelCost.toFixed(2)),
      };
    });

    const totalDistance = mCarLogs.reduce((sum, item) => sum + (item.endOdometer - item.startOdometer), 0);
    const totalLiters = mCarLogs.reduce((sum, item) => sum + item.fuelLiters, 0);
    const totalFuelCost = mCarLogs.reduce((sum, item) => sum + (item.fuelLiters * item.fuelPricePerLiter), 0);
    const totalReceiptCost = mCarLogs.reduce((sum, item) => sum + (item.fuelReceiptCost || 0), 0);

    if (carData.length > 0) {
      carData.push({
        "ลำดับ": "" as any,
        "วันเดือนปี": "รวมทั้งหมด" as any,
        "จุดเริ่มต้น": "" as any,
        "ปลายทาง (สถานที่/รายละเอียด)": "" as any,
        "ประเภทงาน": "" as any,
        "ชื่อลูกค้า": "" as any,
        "User ลูกค้า": "" as any,
        "จังหวัดปลายทาง": "" as any,
        "จำนวนเงินในใบเสร็จ": totalReceiptCost as any,
        "เลขไมล์เริ่ม": "" as any,
        "เลขไมล์สิ้นสุด": "" as any,
        "น้ำมัน (ลิตร)": totalLiters as any,
        "ราคาน้ำมันต่อลิตร (บาท)": "" as any,
        "ใบเสร็จน้ำมัน (เลขใบเสร็จ / ถ้ามี)": "" as any,
        "ระยะทาง (กม.)": totalDistance as any,
        "ค่าน้ำมันรวม (บาท)": parseFloat(totalFuelCost.toFixed(2)) as any,
      });
    }

    const wsCar = XLSX.utils.json_to_sheet(carData);
    wsCar["!cols"] = [
      { wch: 8 },  // ลำดับ
      { wch: 15 }, // วันเดือนปี
      { wch: 18 }, // จุดเริ่มต้น
      { wch: 25 }, // ปลายทาง (สถานที่/รายละเอียด)
      { wch: 20 }, // ประเภทงาน
      { wch: 20 }, // ชื่อลูกค้า
      { wch: 18 }, // User ลูกค้า
      { wch: 18 }, // จังหวัดปลายทาง
      { wch: 22 }, // จำนวนเงินในใบเสร็จ
      { wch: 15 }, // เลขไมล์เริ่ม
      { wch: 15 }, // เลขไมล์สิ้นสุด
      { wch: 15 }, // น้ำมัน (ลิตร)
      { wch: 22 }, // ราคาน้ำมันต่อลิตร (บาท)
      { wch: 30 }, // ใบเสร็จน้ำมัน (เลขใบเสร็จ / ถ้ามี)
      { wch: 15 }, // ระยะทาง
      { wch: 20 }, // ค่าน้ำมันรวม
    ];

    const carSheetName = `รถ-${thaiMonthLabel}`.substring(0, 31);
    XLSX.utils.book_append_sheet(wb, wsCar, carSheetName);
  });

  // Export File Name
  const fileName =
    selectedMonth === "all"
      ? `รายงานการทำงานและการใช้รถ_ทั้งหมด.xlsx`
      : `รายงานการทำงานและการใช้รถ_${formatMonthThai(selectedMonth).replace(" ", "_")}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
