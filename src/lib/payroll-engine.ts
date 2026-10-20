export interface PayrollCalculationInput {
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  workingDays: number;
  presentDays: number;
  isPfEligible: boolean;
  isEsiEligible: boolean;
  isPtEligible: boolean;
  tdsDeduction?: number;
}

export interface PayrollCalculationResult {
  workingDays: number;
  presentDays: number;
  basicEarned: number;
  hraEarned: number;
  specialAllowanceEarned: number;
  grossEarned: number;
  // Statutory employee deductions
  epfEmployee: number;
  esiEmployee: number;
  professionalTax: number;
  tdsDeducted: number;
  totalDeductions: number;
  netPayable: number;
  // Employer statutory contributions
  epfEmployer: number;
  esiEmployer: number;
}

export function calculateIndianPayroll(input: PayrollCalculationInput): PayrollCalculationResult {
  const {
    basicSalary,
    hra,
    specialAllowance,
    workingDays = 30,
    presentDays = 30,
    isPfEligible = true,
    isEsiEligible = true,
    isPtEligible = true,
    tdsDeduction = 0
  } = input;

  // Pro-rata attendance calculation
  const attendanceRatio = Math.min(1, Math.max(0, presentDays / workingDays));

  const basicEarned = parseFloat((basicSalary * attendanceRatio).toFixed(2));
  const hraEarned = parseFloat((hra * attendanceRatio).toFixed(2));
  const specialAllowanceEarned = parseFloat((specialAllowance * attendanceRatio).toFixed(2));
  const grossEarned = parseFloat((basicEarned + hraEarned + specialAllowanceEarned).toFixed(2));

  // 1. EPF (Employees' Provident Fund Act, 1952)
  // 12% on Basic (statutory ceiling: ₹15,000/month max unless voluntary)
  let epfEmployee = 0;
  let epfEmployer = 0;
  if (isPfEligible) {
    const pfWage = Math.min(basicEarned, 15000);
    epfEmployee = parseFloat((pfWage * 0.12).toFixed(2));
    epfEmployer = parseFloat((pfWage * 0.12).toFixed(2)); // (3.67% to EPF + 8.33% to EPS)
  }

  // 2. ESI (Employee State Insurance Act, 1948)
  // Applicable only if monthly gross wage is <= ₹21,000
  let esiEmployee = 0;
  let esiEmployer = 0;
  if (isEsiEligible && grossEarned <= 21000) {
    esiEmployee = parseFloat((grossEarned * 0.0075).toFixed(2)); // 0.75%
    esiEmployer = parseFloat((grossEarned * 0.0325).toFixed(2)); // 3.25%
  }

  // 3. Professional Tax (State specific, standard Maharashtra/Gujarat: ₹200)
  let professionalTax = 0;
  if (isPtEligible) {
    if (grossEarned > 10000) {
      professionalTax = 200;
    } else if (grossEarned > 7500) {
      professionalTax = 175;
    }
  }

  const tdsDeducted = parseFloat((tdsDeduction || 0).toFixed(2));
  const totalDeductions = parseFloat((epfEmployee + esiEmployee + professionalTax + tdsDeducted).toFixed(2));
  const netPayable = parseFloat((grossEarned - totalDeductions).toFixed(2));

  return {
    workingDays,
    presentDays,
    basicEarned,
    hraEarned,
    specialAllowanceEarned,
    grossEarned,
    epfEmployee,
    esiEmployee,
    professionalTax,
    tdsDeducted,
    totalDeductions,
    netPayable,
    epfEmployer,
    esiEmployer
  };
}
