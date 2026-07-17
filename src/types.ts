export interface WorkLog {
  id: string;
  date: string; // YYYY-MM-DD
  jobType: string; // ติดตั้งใหม่, Service, ถอดเครื่อง, เปลี่ยนซิม, อื่นๆ
  jobTypeOther?: string;
  commission: number; // 50 or 20
  customerUser: string;
  customerLicensePlate: string;
  province: string;
  allowance: number; // 100 or 0
  createdAt: string;
}

export interface CarLog {
  id: string;
  date: string; // YYYY-MM-DD
  jobType: string;
  jobTypeOther?: string;
  startPoint: string; // Default 'ออฟฟิศขอนแก่น'
  destination: string;
  customerName: string;
  customerUser: string;
  destinationProvince: string;
  fuelReceiptNo?: string;
  fuelReceiptCost?: number; // Optional fuel receipt cost (THB)
  startOdometer: number;
  endOdometer: number;
  fuelLiters: number;
  fuelPricePerLiter: number;
  createdAt: string;
}

export interface ProvinceRegion {
  region: string;
  provinces: string[];
}
