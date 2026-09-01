import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  Eye,
  Printer,
  Plus,
  Search,
  Download,
  Trash2,
  Edit2,
  MessageCircle,
  TrendingUp,
  Wallet,
  CalendarCheck,
  UserCheck,
  BarChart3,
  PieChart as PieChartIcon,
  Building2,
  Layers,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  Employee,
  PayrollRun,
  Payslip,
  LeaveRequest,
  AttendanceRecord,
  Currency,
  CostCenter,
  Branch,
  CompanyProfile,
} from '../types/accounting';
import { formatCurrency } from '../utils/formatters';

interface HRPayrollViewProps {
  employees?: Employee[];
  payrollRuns?: PayrollRun[];
  leaveRequests?: LeaveRequest[];
  attendanceRecords?: AttendanceRecord[];
  costCenters?: CostCenter[];
  branches?: Branch[];
  currency?: Currency;
  rates?: Record<Currency, number>;
  companyProfile?: CompanyProfile;
  onAddEmployee?: (emp: Employee) => void;
  onUpdateEmployee?: (emp: Employee) => void;
  onDeleteEmployee?: (empId: string) => void;
  onAddPayrollRun?: (run: PayrollRun) => void;
  onPostPayrollToGL?: (runId: string) => void;
  onApproveLeave?: (leaveId: string) => void;
  onRejectLeave?: (leaveId: string) => void;
  onAddLeaveRequest?: (req: LeaveRequest) => void;
  onAddAttendanceRecord?: (att: AttendanceRecord) => void;
}

export const HRPayrollView: React.FC<HRPayrollViewProps> = ({
  employees = [],
  payrollRuns = [],
  leaveRequests = [],
  attendanceRecords = [],
  costCenters = [],
  branches = [],
  currency = 'YER',
  rates = { YER: 1, SAR: 142.5, USD: 535 },
  companyProfile = {
    nameAr: 'مجموعة المروج الدولية للاستثمار والتجارة',
    nameEn: 'Al-Murooj Group',
    taxNumber: 'YER-TAX-98421034',
    commercialRegister: 'CR-104928/SANAA',
    baseCurrency: 'YER',
    exchangeRates: { YER: 1, USD: 535, SAR: 142.5 },
    currentFiscalYear: 2026,
    phone: '+967 1 445566',
    email: 'hr@almurooj-group.ye',
    address: 'شارع حدة، برج الأعمال الدولي',
    city: 'صنعاء',
    country: 'الجمهورية اليمنية',
  },
  onAddEmployee = (_emp: Employee) => {},
  onUpdateEmployee = (_emp: Employee) => {},
  onDeleteEmployee = (_empId: string) => {},
  onAddPayrollRun = (_run: PayrollRun) => {},
  onPostPayrollToGL = (_runId: string) => {},
  onApproveLeave = (_leaveId: string) => {},
  onRejectLeave = (_leaveId: string) => {},
  onAddLeaveRequest = (_req: LeaveRequest) => {},
  onAddAttendanceRecord = (_att: AttendanceRecord) => {},
}) => {
  // Navigation Tabs: 'employees' | 'analytics' | 'payroll' | 'leaves' | 'attendance' | 'eos'
  const [activeTab, setActiveTab] = useState<'employees' | 'analytics' | 'payroll' | 'leaves' | 'attendance' | 'eos'>('employees');

  // Live Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Employee Filter & Search
  const [empSearch, setEmpSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Employee Add/Edit Modal
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Auto-fill Sample Employee Helper
  const handleFillSampleEmployee = () => {
    const samples = [
      { first: 'حمزة', last: 'الماوري', job: 'كبير مهندسي البرمجيات والنظم', dept: 'إدارة تكنولوجيا المعلومات', sal: 650000, house: 120000, trans: 50000, food: 30000, bank: 'بنك التضامن الإسلامي الدولي', iban: 'YE45TDBY0019283746' },
      { first: 'وفاء', last: 'الشامي', job: 'أخصائية أولى موارد بشرية', dept: 'إدارة الموارد البشرية والرواتب', sal: 480000, house: 90000, trans: 40000, food: 25000, bank: 'بنك الكريمي للتمويل الأصغر', iban: 'YE92KMBY0098472615' },
      { first: 'طارق', last: 'الزبيدي', job: 'مدير المبيعات والتوزيع الإقليمي', dept: 'إدارة المبيعات والتسويق', sal: 550000, house: 110000, trans: 60000, food: 35000, bank: 'البنك الأهلي اليمني', iban: 'YE11NBYE0048291047' },
      { first: 'سعاد', last: 'القدسي', job: 'محاسبة تكاليف ومخزون أولى', dept: 'الإدارة المالية والمحاسبة', sal: 490000, house: 95000, trans: 45000, food: 30000, bank: 'بنك اليمن والكويت', iban: 'YE77YKBY0039281745' },
    ];
    const pick = samples[Math.floor(Math.random() * samples.length)];
    setEmpForm({
      firstNameAr: pick.first,
      lastNameAr: pick.last,
      fullNameEn: `${pick.first} ${pick.last}`,
      nationalIdOrIqama: `10${Math.floor(10000000 + Math.random() * 90000000)}`,
      jobTitle: pick.job,
      department: pick.dept,
      gender: pick.first === 'وفاء' || pick.first === 'سعاد' ? 'FEMALE' : 'MALE',
      nationality: 'يمني',
      costCenterId: costCenters[0]?.id || 'CC-FIN-01',
      branchId: branches[0]?.id || 'BR-01',
      joinDate: new Date().toISOString().split('T')[0],
      phone: `+967 77${Math.floor(1000000 + Math.random() * 9000000)}`,
      email: `emp.${Date.now().toString().slice(-4)}@almurooj-group.ye`,
      contractType: 'FULL_TIME',
      status: 'ACTIVE',
      basicSalary: pick.sal,
      housingAllowance: pick.house,
      transportAllowance: pick.trans,
      foodAllowance: pick.food,
      otherAllowances: 15000,
      gosiDeductionPct: 9,
      gosiCompanyContributionPct: 11,
      taxDeductionPct: 5,
      bankName: pick.bank,
      ibanOrAccountNumber: pick.iban,
      annualLeaveBalance: 21,
      sickLeaveBalance: 15,
      emergencyLeaveBalance: 5,
    });
  };

  // New Employee Form State
  const [empForm, setEmpForm] = useState<Partial<Employee>>({
    firstNameAr: '',
    lastNameAr: '',
    fullNameEn: '',
    nationalIdOrIqama: '',
    jobTitle: '',
    department: 'الإدارة المالية والمحاسبة',
    gender: 'MALE',
    nationality: 'يمني',
    costCenterId: costCenters[0]?.id || 'CC-FIN-01',
    branchId: branches[0]?.id || 'BR-01',
    joinDate: new Date().toISOString().split('T')[0],
    phone: '',
    email: '',
    contractType: 'FULL_TIME',
    status: 'ACTIVE',
    basicSalary: 450000,
    housingAllowance: 100000,
    transportAllowance: 50000,
    foodAllowance: 25000,
    otherAllowances: 0,
    gosiDeductionPct: 9,
    gosiCompanyContributionPct: 11,
    taxDeductionPct: 5,
    bankName: 'بنك التضامن الإسلامي الدولي',
    ibanOrAccountNumber: '',
    annualLeaveBalance: 21,
    sickLeaveBalance: 15,
    emergencyLeaveBalance: 5,
  });

  // Payroll Processing States
  const [selectedPayrollMonth, setSelectedPayrollMonth] = useState<number>(4);
  const [selectedPayrollYear, setSelectedPayrollYear] = useState<number>(2026);
  const [activePayslip, setActivePayslip] = useState<Payslip | null>(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);

  // Leave Modal State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState<{
    employeeId: string;
    type: 'ANNUAL' | 'SICK' | 'UNPAID' | 'EMERGENCY' | 'MATERNITY' | 'HAJJ';
    startDate: string;
    endDate: string;
    reason: string;
  }>({
    employeeId: employees[0]?.id || '',
    type: 'ANNUAL',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reason: '',
  });

  // Attendance Modal State
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState<{
    employeeId: string;
    date: string;
    checkIn: string;
    checkOut: string;
    workHours: number;
    overtimeHours: number;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'ON_LEAVE';
    notes: string;
  }>({
    employeeId: employees[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:00',
    checkOut: '16:00',
    workHours: 8,
    overtimeHours: 0,
    status: 'PRESENT',
    notes: '',
  });

  // End of Service Calculator State
  const [eosBasicSalary, setEosBasicSalary] = useState<number>(500000);
  const [eosYears, setEosYears] = useState<number>(5);
  const [eosMonths, setEosMonths] = useState<number>(0);
  const [eosReason, setEosReason] = useState<'TERMINATION' | 'RESIGNATION'>('TERMINATION');

  // Departments List
  const departments = useMemo(() => {
    const set = new Set<string>();
    (employees || []).forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return ['ALL', ...Array.from(set)];
  }, [employees]);

  // Filtered Employees
  const filteredEmployees = useMemo(() => {
    return (employees || []).filter((emp) => {
      const matchDept = deptFilter === 'ALL' || emp.department === deptFilter;
      const search = empSearch.toLowerCase().trim();
      if (!search) return matchDept;
      const matchSearch =
        emp.firstNameAr?.toLowerCase().includes(search) ||
        emp.lastNameAr?.toLowerCase().includes(search) ||
        emp.fullNameEn?.toLowerCase().includes(search) ||
        emp.employeeCode?.toLowerCase().includes(search) ||
        emp.jobTitle?.toLowerCase().includes(search);
      return matchDept && matchSearch;
    });
  }, [employees, deptFilter, empSearch]);

  // KPI Metrics
  const activeEmployeesCount = useMemo(() => {
    return (employees || []).filter((e) => e.status === 'ACTIVE').length;
  }, [employees]);

  const totalMonthlySalariesBudget = useMemo(() => {
    return (employees || []).reduce((sum, e) => {
      const allowances =
        (e.housingAllowance || 0) +
        (e.transportAllowance || 0) +
        (e.foodAllowance || 0) +
        (e.otherAllowances || 0);
      return sum + (e.basicSalary || 0) + allowances;
    }, 0);
  }, [employees]);

  const pendingLeavesCount = useMemo(() => {
    return (leaveRequests || []).filter((l) => l.status === 'PENDING').length;
  }, [leaveRequests]);

  const todayPresentAttendanceCount = useMemo(() => {
    return (attendanceRecords || []).filter((a) => a.status === 'PRESENT').length;
  }, [attendanceRecords]);

  // Handler: Open Employee Modal
  const handleOpenEmpModal = (emp?: Employee) => {
    if (emp) {
      setEditingEmp(emp);
      setEmpForm({ ...emp });
    } else {
      setEditingEmp(null);
      setEmpForm({
        firstNameAr: '',
        lastNameAr: '',
        fullNameEn: '',
        nationalIdOrIqama: '',
        jobTitle: '',
        department: 'الإدارة المالية والمحاسبة',
        gender: 'MALE',
        nationality: 'يمني',
        costCenterId: costCenters[0]?.id || 'CC-FIN-01',
        branchId: branches[0]?.id || 'BR-01',
        joinDate: new Date().toISOString().split('T')[0],
        phone: '',
        email: '',
        contractType: 'FULL_TIME',
        status: 'ACTIVE',
        basicSalary: 450000,
        housingAllowance: 100000,
        transportAllowance: 50000,
        foodAllowance: 25000,
        otherAllowances: 0,
        gosiDeductionPct: 9,
        gosiCompanyContributionPct: 11,
        taxDeductionPct: 5,
        bankName: 'بنك التضامن الإسلامي الدولي',
        ibanOrAccountNumber: '',
        annualLeaveBalance: 21,
        sickLeaveBalance: 15,
        emergencyLeaveBalance: 5,
      });
    }
    setIsEmpModalOpen(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empForm.firstNameAr || !empForm.lastNameAr || !empForm.jobTitle) {
      alert('يرجى تعبئة الاسم الأول واللقب والمسمى الوظيفي!');
      return;
    }

    if (editingEmp) {
      const updated: Employee = {
        ...editingEmp,
        ...(empForm as Employee),
      };
      onUpdateEmployee(updated);
      showToast(`✅ تم بنجاح تحديث بيانات الموظف (${updated.firstNameAr} ${updated.lastNameAr}) وحفظ التعديلات في النظام!`);
    } else {
      const newEmp: Employee = {
        id: `EMP-${Date.now()}`,
        employeeCode: `HR-${String(100 + employees.length + 1).padStart(5, '0')}`,
        ...(empForm as Employee),
      } as Employee;
      onAddEmployee(newEmp);
      showToast(`✅ تم بنجاح حفظ وتثبيت الموظف الجديد (${newEmp.firstNameAr} ${newEmp.lastNameAr} - ${newEmp.jobTitle}) في الذاكرة الدائمة للنظام!`);
    }
    setIsEmpModalOpen(false);
  };

  // Handler: Generate Monthly Payroll
  const handleGeneratePayroll = () => {
    const existing = (payrollRuns || []).find(
      (r) => r.month === selectedPayrollMonth && r.year === selectedPayrollYear
    );
    if (existing) {
      alert(`تم إعداد مسير رواتب هذا الشهر (${selectedPayrollMonth}/${selectedPayrollYear}) مسبقاً!`);
      return;
    }

    const activeEmployees = (employees || []).filter((e) => e.status === 'ACTIVE');
    if (activeEmployees.length === 0) {
      alert('لا يوجد موظفون نشطون لإعداد مسير الرواتب!');
      return;
    }

    const payslips: Payslip[] = activeEmployees.map((emp) => {
      const basic = emp.basicSalary || 0;
      const housing = emp.housingAllowance || 0;
      const transport = emp.transportAllowance || 0;
      const food = emp.foodAllowance || 0;
      const other = emp.otherAllowances || 0;
      const gross = basic + housing + transport + food + other;

      const gosiEmp = Math.round((basic + housing) * ((emp.gosiDeductionPct || 9) / 100));
      const tax = Math.round(gross * ((emp.taxDeductionPct || 5) / 100));
      const totalDed = gosiEmp + tax;
      const net = gross - totalDed;
      const gosiComp = Math.round((basic + housing) * ((emp.gosiCompanyContributionPct || 11) / 100));

      return {
        id: `PS-${selectedPayrollYear}-${selectedPayrollMonth}-${emp.employeeCode}`,
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: `${emp.firstNameAr} ${emp.lastNameAr}`,
        jobTitle: emp.jobTitle,
        department: emp.department,
        costCenterId: emp.costCenterId || 'CC-01',
        bankName: emp.bankName || 'بنك التضامن الإسلامي',
        iban: emp.ibanOrAccountNumber || '',
        month: selectedPayrollMonth,
        year: selectedPayrollYear,
        basicSalary: basic,
        housingAllowance: housing,
        transportAllowance: transport,
        foodAllowance: food,
        overtimeAmount: 0,
        bonuses: 0,
        grossSalary: gross,
        gosiEmployeeDeduction: gosiEmp,
        incomeTaxDeduction: tax,
        advancesAndLoansDeduction: 0,
        absenceAndPenaltiesDeduction: 0,
        totalDeductions: totalDed,
        netSalary: net,
        gosiCompanyContribution: gosiComp,
        status: 'DRAFT',
      };
    });

    const totalGross = payslips.reduce((a, b) => a + b.grossSalary, 0);
    const totalDed = payslips.reduce((a, b) => a + b.totalDeductions, 0);
    const totalNet = payslips.reduce((a, b) => a + b.netSalary, 0);
    const totalComp = payslips.reduce((a, b) => a + b.gosiCompanyContribution, 0);

    const newRun: PayrollRun = {
      id: `PAY-${selectedPayrollYear}-${String(selectedPayrollMonth).padStart(2, '0')}`,
      payrollNumber: `PAY-${selectedPayrollYear}-${String(selectedPayrollMonth).padStart(2, '0')}`,
      month: selectedPayrollMonth,
      year: selectedPayrollYear,
      periodName: `مسير رواتب شهر ${selectedPayrollMonth} لسنة ${selectedPayrollYear}`,
      dateProcessed: new Date().toISOString().split('T')[0],
      totalEmployees: payslips.length,
      totalGrossAmount: totalGross,
      totalDeductionsAmount: totalDed,
      totalNetAmount: totalNet,
      totalCompanyContributions: totalComp,
      currency: (currency as Currency) || 'YER',
      status: 'DRAFT',
      payslips,
    };

    onAddPayrollRun(newRun);
    alert(`تم بنجاح توليد مسير رواتب لشهر ${selectedPayrollMonth}/${selectedPayrollYear} بإجمالي ${payslips.length} موظف بمبلغ صافي ${formatCurrency(totalNet, (currency as Currency) || 'YER', rates)}!`);
  };

  // Handler: Submit Leave Request
  const handleSaveLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = (employees || []).find((em) => em.id === leaveForm.employeeId) || employees[0];
    if (!emp) {
      alert('يرجى اختيار موظف للطلب!');
      return;
    }

    const start = new Date(leaveForm.startDate);
    const end = new Date(leaveForm.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const newReq: LeaveRequest = {
      id: `LV-${Date.now().toString().slice(-4)}`,
      employeeId: emp.id,
      employeeName: `${emp.firstNameAr} ${emp.lastNameAr}`,
      employeeCode: emp.employeeCode,
      type: leaveForm.type,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      daysCount,
      reason: leaveForm.reason || 'إجازة اعتيادية معتمدة',
      status: 'PENDING',
      appliedDate: new Date().toISOString().split('T')[0],
    };

    onAddLeaveRequest(newReq);
    setIsLeaveModalOpen(false);
    setLeaveForm({
      employeeId: employees[0]?.id || '',
      type: 'ANNUAL',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reason: '',
    });
  };

  // Handler: Submit Attendance Record
  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = (employees || []).find((em) => em.id === attendanceForm.employeeId) || employees[0];
    if (!emp) {
      alert('يرجى اختيار موظف!');
      return;
    }

    const newAtt: AttendanceRecord = {
      id: `ATT-${Date.now().toString().slice(-4)}`,
      employeeId: emp.id,
      employeeName: `${emp.firstNameAr} ${emp.lastNameAr}`,
      date: attendanceForm.date,
      checkIn: attendanceForm.checkIn,
      checkOut: attendanceForm.checkOut,
      workHours: Number(attendanceForm.workHours),
      overtimeHours: Number(attendanceForm.overtimeHours),
      status: attendanceForm.status,
      notes: attendanceForm.notes,
    };

    onAddAttendanceRecord(newAtt);
    setIsAttendanceModalOpen(false);
    setAttendanceForm({
      employeeId: employees[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      checkIn: '08:00',
      checkOut: '16:00',
      workHours: 8,
      overtimeHours: 0,
      status: 'PRESENT',
      notes: '',
    });
  };

  // Handler: Share Payslip on WhatsApp
  const handleSharePayslipWhatsApp = (ps: Payslip) => {
    const emp = (employees || []).find((e) => e.id === ps.employeeId);
    const phone = emp?.phone ? emp.phone.replace(/[^0-9]/g, '') : '';
    const msg = `🏢 *${companyProfile.nameAr}*\n📄 *إشعار قسيمة الراتب لشهر (${ps.month}/${ps.year})*\n━━━━━━━━━━━━━━━━━━━━\n👤 *الموظف:* ${ps.employeeName} (${ps.employeeCode})\n💼 *المسمى:* ${ps.jobTitle}\n🏢 *القسم:* ${ps.department}\n━━━━━━━━━━━━━━━━━━━━\n💵 *الراتب الأساسي:* ${ps.basicSalary.toLocaleString()} ${currency}\n➕ *إجمالي البدلات:* ${(ps.housingAllowance + ps.transportAllowance + ps.foodAllowance).toLocaleString()} ${currency}\n📊 *إجمالي الراتب:* ${ps.grossSalary.toLocaleString()} ${currency}\n➖ *الاستقطاعات (تأمينات وضريبة):* ${ps.totalDeductions.toLocaleString()} ${currency}\n━━━━━━━━━━━━━━━━━━━━\n💰 *صافي الراتب المحول:* *${ps.netSalary.toLocaleString()} ${currency}*\n🏦 *البنك المودع فيه:* ${ps.bankName} (${ps.iban || 'الحساب المعتمد'})\n━━━━━━━━━━━━━━━━━━━━\nشكراً لجهودكم المتميزة! 🌟`;

    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Handler: Export to CSV
  const handleExportEmployeesCSV = () => {
    const headers = ['الكود', 'الاسم', 'المسمى الوظيفي', 'القسم', 'مركز التكلفة', 'الراتب الأساسي', 'بدل السكن', 'بدل المواصلات', 'بدل التغذية', 'الهاتف', 'الحالة'];
    const rows = (employees || []).map((e) => [
      e.employeeCode,
      `"${e.firstNameAr} ${e.lastNameAr}"`,
      `"${e.jobTitle}"`,
      `"${e.department}"`,
      `"${e.costCenterId}"`,
      e.basicSalary,
      e.housingAllowance,
      e.transportAllowance,
      e.foodAllowance,
      `"${e.phone || ''}"`,
      e.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `employees_roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // EOS Calculation formula (وفق قانون العمل)
  const calculateEOS = useMemo(() => {
    const totalYears = eosYears + eosMonths / 12;
    let amount = 0;
    if (totalYears <= 5) {
      amount = totalYears * (eosBasicSalary * 0.5);
    } else {
      amount = 5 * (eosBasicSalary * 0.5) + (totalYears - 5) * eosBasicSalary;
    }

    if (eosReason === 'RESIGNATION') {
      if (totalYears < 2) amount = 0;
      else if (totalYears < 5) amount *= 1 / 3;
      else if (totalYears < 10) amount *= 2 / 3;
    }

    return Math.round(amount);
  }, [eosBasicSalary, eosYears, eosMonths, eosReason]);

  // --- Recharts Dataset Calculations ---
  const CHART_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b'];

  // 1. Department Breakdown Dataset
  const departmentSalaryData = useMemo(() => {
    const map: Record<string, { department: string; basic: number; allowances: number; gross: number; count: number }> = {};
    
    (employees || []).forEach((e) => {
      const dept = e.department || 'غير محدد';
      if (!map[dept]) {
        map[dept] = { department: dept, basic: 0, allowances: 0, gross: 0, count: 0 };
      }
      const allowances = (e.housingAllowance || 0) + (e.transportAllowance || 0) + (e.foodAllowance || 0) + (e.otherAllowances || 0);
      const gross = (e.basicSalary || 0) + allowances;
      
      map[dept].basic += (e.basicSalary || 0);
      map[dept].allowances += allowances;
      map[dept].gross += gross;
      map[dept].count += 1;
    });

    return Object.values(map).map(item => ({
      ...item,
      avgSalary: item.count > 0 ? Math.round(item.gross / item.count) : 0
    }));
  }, [employees]);

  // 2. Cost Center Breakdown Dataset
  const costCenterSalaryData = useMemo(() => {
    const map: Record<string, { costCenter: string; name: string; gross: number; basic: number; allowances: number; count: number }> = {};

    (employees || []).forEach((e) => {
      const ccId = e.costCenterId || 'عام';
      const ccObj = (costCenters || []).find(c => c.id === ccId);
      const ccName = ccObj ? `${ccObj.code} - ${ccObj.nameAr}` : ccId;

      if (!map[ccId]) {
        map[ccId] = { costCenter: ccId, name: ccName, gross: 0, basic: 0, allowances: 0, count: 0 };
      }
      const allowances = (e.housingAllowance || 0) + (e.transportAllowance || 0) + (e.foodAllowance || 0) + (e.otherAllowances || 0);
      const gross = (e.basicSalary || 0) + allowances;

      map[ccId].gross += gross;
      map[ccId].basic += (e.basicSalary || 0);
      map[ccId].allowances += allowances;
      map[ccId].count += 1;
    });

    return Object.values(map);
  }, [employees, costCenters]);

  // 3. Compensation Structure Breakdown Dataset
  const compensationStructureData = useMemo(() => {
    let basicSum = 0;
    let housingSum = 0;
    let transportSum = 0;
    let foodSum = 0;
    let otherSum = 0;

    (employees || []).forEach((e) => {
      basicSum += (e.basicSalary || 0);
      housingSum += (e.housingAllowance || 0);
      transportSum += (e.transportAllowance || 0);
      foodSum += (e.foodAllowance || 0);
      otherSum += (e.otherAllowances || 0);
    });

    return [
      { name: 'الراتب الأساسي', value: basicSum, color: '#2563eb' },
      { name: 'بدل السكن', value: housingSum, color: '#10b981' },
      { name: 'بدل المواصلات', value: transportSum, color: '#f59e0b' },
      { name: 'بدل التغذية', value: foodSum, color: '#8b5cf6' },
      { name: 'بدلات أخرى', value: otherSum, color: '#ec4899' },
    ].filter(item => item.value > 0);
  }, [employees]);

  // 4. Payroll Runs History Trend Dataset
  const payrollRunTrendsData = useMemo(() => {
    if (!payrollRuns || payrollRuns.length === 0) {
      return [
        { period: 'يناير 2026', gross: totalMonthlySalariesBudget * 0.90, net: totalMonthlySalariesBudget * 0.80, deductions: totalMonthlySalariesBudget * 0.10 },
        { period: 'فبراير 2026', gross: totalMonthlySalariesBudget * 0.94, net: totalMonthlySalariesBudget * 0.83, deductions: totalMonthlySalariesBudget * 0.11 },
        { period: 'مارس 2026', gross: totalMonthlySalariesBudget * 0.97, net: totalMonthlySalariesBudget * 0.85, deductions: totalMonthlySalariesBudget * 0.12 },
        { period: 'أبريل 2026', gross: totalMonthlySalariesBudget, net: totalMonthlySalariesBudget * 0.88, deductions: totalMonthlySalariesBudget * 0.12 },
      ];
    }

    const monthNames = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    return [...payrollRuns]
      .sort((a, b) => a.year - b.year || a.month - b.month)
      .map((run) => ({
        period: `${monthNames[run.month] || run.month} ${run.year}`,
        gross: run.totalGrossSalary,
        net: run.totalNetSalary,
        deductions: run.totalDeductions,
      }));
  }, [payrollRuns, totalMonthlySalariesBudget]);

  // Custom Chart Tooltip for Arabic values
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 z-50 border border-slate-700">
          <p className="font-bold text-slate-200 pb-1 border-b border-slate-800">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: entry.color || entry.fill }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color || entry.fill }} />
                {entry.name}:
              </span>
              <span className="font-mono font-bold">
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value} {currency}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6" id="hr-root-container">
      {/* Live Toast Notification Banner */}
      {toast && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold shadow-md transition-all animate-fadeIn ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : toast.type === 'info'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{toast.message}</span>
          </div>
          <span className="text-[10px] opacity-75 font-mono">حفظ دائم (LocalStorage)</span>
        </div>
      )}

      {/* Header & Tab navigation */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">الموارد البشرية ومسير الرواتب (HR & Payroll)</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                ERP HCM Standard
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              إدارة شؤون الموظفين، مسير الرواتب والأجور، الإجازات، الحضور والانصراف، والترحيل للأستاذ العام
            </p>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'employees', label: `دليل الموظفين (${employees.length})`, icon: Users },
            { id: 'analytics', label: 'الرسوم البيانية والتحليلات', icon: BarChart3 },
            { id: 'payroll', label: `مسير الرواتب (${payrollRuns.length})`, icon: DollarSign },
            { id: 'leaves', label: `الإجازات (${leaveRequests.length})`, icon: Calendar },
            { id: 'attendance', label: `الحضور والانصراف (${attendanceRecords.length})`, icon: Clock },
            { id: 'eos', label: 'مكافأة نهاية الخدمة', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top HR KPI Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-right">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">الموظفون على رأس العمل</span>
            <div className="text-xl font-black text-slate-900 mt-1">
              {activeEmployeesCount} <span className="text-xs font-normal text-slate-400">/ {employees.length} موظف</span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">موازنة الرواتب والبدلات الشهرية</span>
            <div className="text-lg font-black text-emerald-700 mt-1">
              {formatCurrency(totalMonthlySalariesBudget, (currency as Currency) || 'YER', rates)}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">طلبات إجازة قيد الموافقة</span>
            <div className="text-xl font-black text-amber-700 mt-1">
              {pendingLeavesCount} <span className="text-xs font-normal text-slate-400">طلبات معلقة</span>
            </div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">سجلات الحضور لليوم</span>
            <div className="text-xl font-black text-indigo-700 mt-1">
              {todayPresentAttendanceCount} <span className="text-xs font-normal text-slate-400">حضور مسجل</span>
            </div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tab 1: Employees Directory */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  placeholder="بحث باسم الموظف أو الكود..."
                  className="w-full pl-3 pr-9 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-700"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d === 'ALL' ? 'جميع الأقسام الإدارية' : d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleExportEmployeesCSV}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                title="تصدير كشف الموظفين Excel / CSV"
              >
                <Download className="w-4 h-4" />
                تصدير CSV
              </button>

              <button
                onClick={() => handleOpenEmpModal()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs flex-1 sm:flex-none"
              >
                <UserPlus className="w-4 h-4" />
                إضافة موظف جديد
              </button>
            </div>
          </div>

          {/* Employees Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">الكود والاسم</th>
                  <th className="p-3.5">المسمى الوظيفي</th>
                  <th className="p-3.5">القسم ومركز التكلفة</th>
                  <th className="p-3.5">الراتب الأساسي</th>
                  <th className="p-3.5">إجمالي البدلات</th>
                  <th className="p-3.5">إجمالي الراتب</th>
                  <th className="p-3.5">البنك والحساب</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => {
                  const allowances =
                    (emp.housingAllowance || 0) +
                    (emp.transportAllowance || 0) +
                    (emp.foodAllowance || 0) +
                    (emp.otherAllowances || 0);
                  const gross = (emp.basicSalary || 0) + allowances;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">
                          {emp.firstNameAr} {emp.lastNameAr}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{emp.employeeCode}</span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-700">
                        {emp.jobTitle}
                        <div className="text-[10px] text-slate-400">{emp.contractType === 'FULL_TIME' ? 'دوام كامل' : 'عقد جزئي'}</div>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <div>{emp.department}</div>
                        <span className="text-[10px] text-blue-600 font-semibold">{emp.costCenterId}</span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {formatCurrency(emp.basicSalary, (currency as Currency) || 'YER', rates)}
                      </td>
                      <td className="p-3.5 text-emerald-700 font-semibold">
                        +{formatCurrency(allowances, (currency as Currency) || 'YER', rates)}
                      </td>
                      <td className="p-3.5 font-extrabold text-blue-700">
                        {formatCurrency(gross, (currency as Currency) || 'YER', rates)}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <div>{emp.bankName || '-'}</div>
                        <span className="text-[10px] font-mono text-slate-400">{emp.ibanOrAccountNumber || '-'}</span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            emp.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {emp.status === 'ACTIVE' ? 'على رأس العمل' : 'إجازة / موقوف'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEmpModal(emp)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                            title="تعديل بيانات الموظف"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف الموظف ${emp.firstNameAr} ${emp.lastNameAr}؟`)) {
                                onDeleteEmployee(emp.id);
                              }
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded transition"
                            title="حذف الموظف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Payroll & HR Analytics Charts */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Top Analytics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-right">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">أعلى قسم كلفة رواتب</span>
                <div className="text-base font-black text-slate-900 mt-1">
                  {departmentSalaryData.length > 0 
                    ? [...departmentSalaryData].sort((a,b) => b.gross - a.gross)[0]?.department 
                    : 'لا يوجد'}
                </div>
                <span className="text-[11px] font-mono text-blue-600 font-bold mt-0.5 block">
                  {departmentSalaryData.length > 0 
                    ? formatCurrency([...departmentSalaryData].sort((a,b) => b.gross - a.gross)[0]?.gross || 0, currency as Currency, rates)
                    : '-'}
                </span>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">متوسط الراتب والمستحقات للموظف</span>
                <div className="text-base font-black text-emerald-700 mt-1">
                  {employees.length > 0
                    ? formatCurrency(Math.round(totalMonthlySalariesBudget / employees.length), currency as Currency, rates)
                    : '-'}
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">إجمالي الكتلة النقدية / الكادر</span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">نسبة البدلات من إجمالي الرواتب</span>
                <div className="text-base font-black text-purple-700 mt-1">
                  {totalMonthlySalariesBudget > 0
                    ? `${Math.round(((totalMonthlySalariesBudget - (employees.reduce((s, e) => s + (e.basicSalary || 0), 0))) / totalMonthlySalariesBudget) * 100)}%`
                    : '0%'}
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">بدلات سكن ومواصلات وتغذية</span>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <PieChartIcon className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">عدد مراكز التكلفة النشطة</span>
                <div className="text-base font-black text-amber-700 mt-1">
                  {costCenterSalaryData.length} <span className="text-xs font-normal text-slate-400">مراكز كلفة</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">المصنفة في شؤون الموظفين</span>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Grid 1: Department Distribution Bar Chart & Cost Center Pie Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Salary Distribution by Department */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">توزيع الرواتب والأجور حسب القسم الإداري</h3>
                    <p className="text-[11px] text-slate-500">مقارنة بين الراتب الأساسي والبدلات لكل قسم</p>
                  </div>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentSalaryData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="department" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-10} textAnchor="end" />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="basic" name="الراتب الأساسي" fill="#2563eb" radius={[4, 4, 0, 0]} stackId="a" />
                    <Bar dataKey="allowances" name="إجمالي البدلات" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Cost Center Distribution Donut Chart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <PieChartIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">توزيع الرواتب والأجور حسب مركز التكلفة</h3>
                    <p className="text-[11px] text-slate-500">حصة كل مركز تكلفة من الموازنة النقدية للرواتب</p>
                  </div>
                </div>
              </div>

              <div className="h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={costCenterSalaryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="gross"
                      nameKey="name"
                      label={({ name, percent }) => `${name.split('-')[0]} (${((percent || 0) * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {costCenterSalaryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Grid 2: Compensation Structure & Monthly Trend Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 3: Compensation Structure Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">هيكل التعويضات والمنافع الشهرية</h3>
                    <p className="text-[11px] text-slate-500">تفصيل الأجور الأساسية والبدلات المختلفة</p>
                  </div>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={compensationStructureData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#334155' }} width={90} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Bar dataKey="value" name="القيمة النقدية" radius={[0, 6, 6, 0]}>
                      {compensationStructureData.map((entry, index) => (
                        <Cell key={`cell-struct-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Monthly Payroll Run Trend */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">اتجاهات مسير الرواتب الشهري</h3>
                    <p className="text-[11px] text-slate-500">الرواتب الإجمالية والصافية والاستقطاعات عبر الأشهر</p>
                  </div>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={payrollRunTrendsData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <defs>
                      <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="gross" name="إجمالي الرواتب" stroke="#2563eb" fillOpacity={1} fill="url(#colorGross)" />
                    <Area type="monotone" dataKey="net" name="صافي الرواتب المحولة" stroke="#10b981" fillOpacity={1} fill="url(#colorNet)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Monthly Payroll Runs */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          {/* Payroll Generator & Filter Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">مسير الرواتب والأجور الشهرية</h3>
                <p className="text-xs text-slate-500">احتساب الرواتب والبدلات والاستقطاعات وترحيلها محاسبياً للأستاذ العام</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={selectedPayrollMonth}
                onChange={(e) => setSelectedPayrollMonth(Number(e.target.value))}
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    شهر {m} (
                    {m === 1
                      ? 'يناير'
                      : m === 2
                      ? 'فبراير'
                      : m === 3
                      ? 'مارس'
                      : m === 4
                      ? 'أبريل'
                      : m === 5
                      ? 'مايو'
                      : m === 6
                      ? 'يونيو'
                      : m === 7
                      ? 'يوليو'
                      : m === 8
                      ? 'أغسطس'
                      : m === 9
                      ? 'سبتمبر'
                      : m === 10
                      ? 'أكتوبر'
                      : m === 11
                      ? 'نوفمبر'
                      : 'ديسمبر'}
                    )
                  </option>
                ))}
              </select>

              <select
                value={selectedPayrollYear}
                onChange={(e) => setSelectedPayrollYear(Number(e.target.value))}
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>

              <button
                onClick={handleGeneratePayroll}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                توليد واحتساب مسير جديد
              </button>
            </div>
          </div>

          {/* Payroll Runs List */}
          {(payrollRuns || []).map((run) => {
            const runCurr = (run.currency as Currency) || (currency as Currency) || 'YER';
            return (
              <div key={run.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900">{run.periodName}</h4>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        run.status === 'POSTED_TO_GL'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {run.status === 'POSTED_TO_GL' ? 'مرحّل محاسبياً للأستاذ العام' : 'مسودة قيد المراجعة'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {run.status !== 'POSTED_TO_GL' && (
                      <button
                        onClick={() => onPostPayrollToGL(run.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        اعتماد وترحيل القيد للأستاذ العام
                      </button>
                    )}
                    {run.journalEntryId && (
                      <span className="text-xs text-slate-500 font-mono">قيد اليومية: {run.journalEntryId}</span>
                    )}
                  </div>
                </div>

                {/* KPI Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-right">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium">إجمالي الرواتب الإجمالية</span>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {formatCurrency(run.totalGrossAmount, runCurr, rates)}
                    </div>
                  </div>
                  <div className="bg-rose-50 p-3 rounded-lg border border-rose-100">
                    <span className="text-[11px] text-rose-700 font-medium">إجمالي الاستقطاعات (تأمينات وضريبة)</span>
                    <div className="text-sm font-bold text-rose-800 mt-0.5">
                      -{formatCurrency(run.totalDeductionsAmount, runCurr, rates)}
                    </div>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <span className="text-[11px] text-emerald-700 font-medium">صافي الرواتب المستحقة للصرف</span>
                    <div className="text-sm font-extrabold text-emerald-900 mt-0.5">
                      {formatCurrency(run.totalNetAmount, runCurr, rates)}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <span className="text-[11px] text-blue-700 font-medium">مساهمة المنشأة في التأمينات</span>
                    <div className="text-sm font-bold text-blue-900 mt-0.5">
                      {formatCurrency(run.totalCompanyContributions, runCurr, rates)}
                    </div>
                  </div>
                </div>

                {/* Payslips Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">الموظف</th>
                        <th className="p-2.5">الراتب الأساسي</th>
                        <th className="p-2.5">البدلات</th>
                        <th className="p-2.5">الإجمالي</th>
                        <th className="p-2.5">التأمينات (9%)</th>
                        <th className="p-2.5">الضريبة</th>
                        <th className="p-2.5">صافي الراتب</th>
                        <th className="p-2.5">البنك والحساب</th>
                        <th className="p-2.5 text-center">قسيمة الراتب</th>
                        <th className="p-2.5 text-center">إشعار واتساب</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(run.payslips || []).map((ps) => (
                        <tr key={ps.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">
                            {ps.employeeName}
                            <div className="text-[10px] font-normal text-slate-400">{ps.jobTitle}</div>
                          </td>
                          <td className="p-2.5 font-medium text-slate-700">
                            {formatCurrency(ps.basicSalary, runCurr, rates)}
                          </td>
                          <td className="p-2.5 text-emerald-700">
                            +{formatCurrency(
                              ps.housingAllowance + ps.transportAllowance + ps.foodAllowance,
                              runCurr,
                              rates
                            )}
                          </td>
                          <td className="p-2.5 font-bold text-slate-900">
                            {formatCurrency(ps.grossSalary, runCurr, rates)}
                          </td>
                          <td className="p-2.5 text-rose-600">
                            -{formatCurrency(ps.gosiEmployeeDeduction, runCurr, rates)}
                          </td>
                          <td className="p-2.5 text-rose-600">
                            -{formatCurrency(ps.incomeTaxDeduction, runCurr, rates)}
                          </td>
                          <td className="p-2.5 font-extrabold text-blue-700">
                            {formatCurrency(ps.netSalary, runCurr, rates)}
                          </td>
                          <td className="p-2.5 text-[11px] text-slate-500">
                            <div>{ps.bankName}</div>
                            <span className="font-mono text-[10px]">{ps.iban || '-'}</span>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => {
                                setActivePayslip(ps);
                                setIsPayslipModalOpen(true);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              عرض القسيمة
                            </button>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => handleSharePayslipWhatsApp(ps)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[11px] font-bold inline-flex items-center gap-1 transition"
                              title="إرسال إشعار الراتب للموظف عبر واتساب"
                            >
                              <MessageCircle className="w-3 h-3" />
                              واتساب
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Leaves & Vacations */}
      {activeTab === 'leaves' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">سجل طلبات الإجازات والأذونات الرسمية</h3>
              <span className="text-xs text-slate-500 font-medium">عدد الطلبات: {leaveRequests.length}</span>
            </div>

            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              تقديم طلب إجازة جديد
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">رقم الطلب</th>
                  <th className="p-3">الموظف</th>
                  <th className="p-3">نوع الإجازة</th>
                  <th className="p-3">من تاريخ</th>
                  <th className="p-3">إلى تاريخ</th>
                  <th className="p-3 text-center">الأيام</th>
                  <th className="p-3">السبب</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(leaveRequests || []).map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-blue-600">{req.id}</td>
                    <td className="p-3 font-bold text-slate-900">{req.employeeName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {req.type === 'ANNUAL'
                          ? 'إجازة سنوية'
                          : req.type === 'SICK'
                          ? 'إجازة مرضية'
                          : req.type === 'EMERGENCY'
                          ? 'إجازة اضطرارية'
                          : 'إجازة بدون راتب'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">{req.startDate}</td>
                    <td className="p-3 text-slate-700">{req.endDate}</td>
                    <td className="p-3 text-center font-bold text-slate-900">{req.daysCount}</td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">{req.reason}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {req.status === 'APPROVED' ? 'معتمدة' : req.status === 'PENDING' ? 'قيد الموافقة' : 'مرفوضة'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onApproveLeave(req.id)}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold hover:bg-emerald-700"
                          >
                            موافقة
                          </button>
                          <button
                            onClick={() => onRejectLeave(req.id)}
                            className="px-2.5 py-1 bg-rose-600 text-white rounded text-[11px] font-bold hover:bg-rose-700"
                          >
                            رفض
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">مكتمل</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Attendance */}
      {activeTab === 'attendance' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">سجل الحضور والانصراف وساعات العمل الإضافي</h3>
              <span className="text-xs text-slate-500 font-medium">سجلات الحضور المسجلة: {attendanceRecords.length}</span>
            </div>

            <button
              onClick={() => setIsAttendanceModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Clock className="w-4 h-4" />
              تسجيل حضور / انصراف
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">الموظف</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">وقت الحضور</th>
                  <th className="p-3">وقت الانصراف</th>
                  <th className="p-3 text-center">ساعات العمل</th>
                  <th className="p-3 text-center">إضافي (Overtime)</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(attendanceRecords || []).map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{att.employeeName}</td>
                    <td className="p-3 text-slate-600">{att.date}</td>
                    <td className="p-3 font-mono text-emerald-700 font-bold">{att.checkIn}</td>
                    <td className="p-3 font-mono text-rose-700 font-bold">{att.checkOut}</td>
                    <td className="p-3 text-center font-bold text-slate-900">{att.workHours} س</td>
                    <td className="p-3 text-center font-bold text-blue-700">
                      {att.overtimeHours > 0 ? `+${att.overtimeHours} س` : '-'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          att.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : att.status === 'LATE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {att.status === 'PRESENT' ? 'حاضر' : att.status === 'LATE' ? 'متأخر' : 'غائب'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{att.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: End of Service Calculator */}
      {activeTab === 'eos' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 max-w-3xl mx-auto text-right">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-900">حاسبة مستحقات مكافأة نهاية الخدمة (EOS Calculator)</h3>
            <p className="text-xs text-slate-500">
              حساب المستحقات القانونية للموظف وفق نظام العمل (نصف شهر عن أول 5 سنوات، وشهر كامل عما زاد)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الراتب الأساسي الأخير ({currency}):</label>
              <input
                type="number"
                value={eosBasicSalary}
                onChange={(e) => setEosBasicSalary(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">سبب إنهاء العلاقة التعاقدية:</label>
              <select
                value={eosReason}
                onChange={(e) => setEosReason(e.target.value as any)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="TERMINATION">إنهاء العقد من قبل الشركة / انتهاء المدة (استحقاق 100%)</option>
                <option value="RESIGNATION">استقالة من قبل الموظف (نسبة متدرجة)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">سنوات الخدمة الفعلية:</label>
              <input
                type="number"
                value={eosYears}
                onChange={(e) => setEosYears(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الأشهر الإضافية:</label>
              <input
                type="number"
                value={eosMonths}
                max={11}
                min={0}
                onChange={(e) => setEosMonths(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-blue-700 font-bold block">مكافأة نهاية الخدمة المستحقة نظاماً:</span>
              <span className="text-xs text-slate-500">
                إجمالي مدة الخدمة: {eosYears} سنوات و {eosMonths} أشهر
              </span>
            </div>
            <div className="text-2xl font-black text-blue-900">
              {formatCurrency(calculateEOS, (currency as Currency) || 'YER', rates)}
            </div>
          </div>
        </div>
      )}

      {/* Leave Request Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 text-right shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">تقديم طلب إجازة رسمي جديد</h3>
              <button onClick={() => setIsLeaveModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLeaveRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اختيار الموظف:</label>
                <select
                  value={leaveForm.employeeId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium"
                >
                  {(employees || []).map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstNameAr} {e.lastNameAr} - {e.jobTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع الإجازة:</label>
                <select
                  value={leaveForm.type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value as any })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium"
                >
                  <option value="ANNUAL">إجازة سنوية اعتيادية</option>
                  <option value="SICK">إجازة مرضية</option>
                  <option value="EMERGENCY">إجازة اضطرارية طارئة</option>
                  <option value="UNPAID">إجازة بدون راتب</option>
                  <option value="HAJJ">إجازة حج وزيارة</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ البدء:</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الانتهاء:</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سبب ومبرر الإجازة:</label>
                <textarea
                  rows={2}
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="اكتب سبب طلب الإجازة..."
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                >
                  إرسال الطلب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Punch-in Modal */}
      {isAttendanceModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 text-right shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">تسجيل حركة حضور / انصراف</h3>
              <button onClick={() => setIsAttendanceModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الموظف:</label>
                <select
                  value={attendanceForm.employeeId}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, employeeId: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium"
                >
                  {(employees || []).map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstNameAr} {e.lastNameAr} - {e.jobTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ:</label>
                <input
                  type="date"
                  required
                  value={attendanceForm.date}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وقت الحضور:</label>
                  <input
                    type="time"
                    required
                    value={attendanceForm.checkIn}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, checkIn: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وقت الانصراف:</label>
                  <input
                    type="time"
                    required
                    value={attendanceForm.checkOut}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOut: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ساعات العمل:</label>
                  <input
                    type="number"
                    step="0.5"
                    value={attendanceForm.workHours}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, workHours: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">إضافي (ساعات):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={attendanceForm.overtimeHours}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, overtimeHours: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">حالة الحضور:</label>
                <select
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value as any })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium"
                >
                  <option value="PRESENT">حاضر في الموعد</option>
                  <option value="LATE">متأخر بعذر / بدون عذر</option>
                  <option value="ABSENT">غائب</option>
                  <option value="ON_LEAVE">في إجازة رسمية</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات:</label>
                <input
                  type="text"
                  value={attendanceForm.notes}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value })}
                  placeholder="ملاحظات الحضور أو العمل الإضافي..."
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAttendanceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                >
                  حفظ الحركة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Add/Edit Modal */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 text-right shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-lg text-slate-900">
                  {editingEmp ? 'تعديل بيانات الموظف' : 'تسجيل موظف جديد في النظام'}
                </h3>
                {!editingEmp && (
                  <button
                    type="button"
                    onClick={handleFillSampleEmployee}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    title="تعبئة بيانات موظف تجريبي يمني بنقرة واحدة لتسريع الفحص"
                  >
                    ⚡ تعبئة بيانات تجريبية للاختبار
                  </button>
                )}
              </div>
              <button onClick={() => setIsEmpModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الأول:</label>
                  <input
                    type="text"
                    required
                    value={empForm.firstNameAr || ''}
                    onChange={(e) => setEmpForm({ ...empForm, firstNameAr: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اللقب / اسم العائلة:</label>
                  <input
                    type="text"
                    required
                    value={empForm.lastNameAr || ''}
                    onChange={(e) => setEmpForm({ ...empForm, lastNameAr: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المسمى الوظيفي:</label>
                  <input
                    type="text"
                    required
                    value={empForm.jobTitle || ''}
                    onChange={(e) => setEmpForm({ ...empForm, jobTitle: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">القسم الإداري:</label>
                  <input
                    type="text"
                    value={empForm.department || ''}
                    onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مركز التكلفة (Cost Center):</label>
                  <select
                    value={empForm.costCenterId || ''}
                    onChange={(e) => setEmpForm({ ...empForm, costCenterId: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium"
                  >
                    {(costCenters || []).map((cc) => (
                      <option key={cc.id} value={cc.code || cc.id}>
                        {cc.nameAr} ({cc.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الالتحاق بالعمل:</label>
                  <input
                    type="date"
                    value={empForm.joinDate || ''}
                    onChange={(e) => setEmpForm({ ...empForm, joinDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف (للواتساب):</label>
                  <input
                    type="text"
                    value={empForm.phone || ''}
                    onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                    placeholder="771234567"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني:</label>
                  <input
                    type="email"
                    value={empForm.email || ''}
                    onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Salary Details */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="font-bold text-xs text-slate-900 mb-2">هيكل الراتب والبدلات ({currency})</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">الراتب الأساسي:</label>
                    <input
                      type="number"
                      required
                      value={empForm.basicSalary || ''}
                      onChange={(e) => setEmpForm({ ...empForm, basicSalary: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">بدل السكن:</label>
                    <input
                      type="number"
                      value={empForm.housingAllowance || ''}
                      onChange={(e) => setEmpForm({ ...empForm, housingAllowance: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">بدل المواصلات:</label>
                    <input
                      type="number"
                      value={empForm.transportAllowance || ''}
                      onChange={(e) => setEmpForm({ ...empForm, transportAllowance: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">بدل التغذية:</label>
                    <input
                      type="number"
                      value={empForm.foodAllowance || ''}
                      onChange={(e) => setEmpForm({ ...empForm, foodAllowance: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم البنك المعتمد:</label>
                  <input
                    type="text"
                    value={empForm.bankName || ''}
                    onChange={(e) => setEmpForm({ ...empForm, bankName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الحساب / الآيبان IBAN:</label>
                  <input
                    type="text"
                    value={empForm.ibanOrAccountNumber || ''}
                    onChange={(e) => setEmpForm({ ...empForm, ibanOrAccountNumber: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEmpModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip Modal View */}
      {isPayslipModalOpen && activePayslip && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-right shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">قسيمة الراتب الشهري (Payslip)</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSharePayslipWhatsApp(activePayslip)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  مشاركة واتساب
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  طباعة
                </button>
                <button onClick={() => setIsPayslipModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <div>
                  <span className="text-slate-500">اسم الموظف:</span>
                  <div className="font-bold text-slate-900 text-sm">{activePayslip.employeeName}</div>
                  <div className="text-[11px] text-slate-500">{activePayslip.jobTitle} - {activePayslip.department}</div>
                </div>
                <div className="text-left">
                  <span className="text-slate-500">الشهر / السنة:</span>
                  <div className="font-bold text-slate-900">{activePayslip.month} / {activePayslip.year}</div>
                  <div className="text-[11px] font-mono text-slate-500">{activePayslip.employeeCode}</div>
                </div>
              </div>

              {/* Earnings vs Deductions Table */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <h5 className="font-bold text-emerald-800 border-b border-emerald-200 pb-1">المستحقات (Earnings)</h5>
                  <div className="flex justify-between">
                    <span>الراتب الأساسي:</span>
                    <span className="font-semibold">{formatCurrency(activePayslip.basicSalary, (currency as Currency) || 'YER', rates)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>بدل السكن:</span>
                    <span className="font-semibold">{formatCurrency(activePayslip.housingAllowance, (currency as Currency) || 'YER', rates)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>بدل المواصلات:</span>
                    <span className="font-semibold">{formatCurrency(activePayslip.transportAllowance, (currency as Currency) || 'YER', rates)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>بدل التغذية:</span>
                    <span className="font-semibold">{formatCurrency(activePayslip.foodAllowance, (currency as Currency) || 'YER', rates)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-slate-200 pt-1 text-emerald-700">
                    <span>إجمالي الراتب:</span>
                    <span>{formatCurrency(activePayslip.grossSalary, (currency as Currency) || 'YER', rates)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h5 className="font-bold text-rose-800 border-b border-rose-200 pb-1">الاستقطاعات (Deductions)</h5>
                  <div className="flex justify-between">
                    <span>التأمينات الاجتماعية (9%):</span>
                    <span className="font-semibold">-{formatCurrency(activePayslip.gosiEmployeeDeduction, (currency as Currency) || 'YER', rates)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ضريبة كسب العمل:</span>
                    <span className="font-semibold">-{formatCurrency(activePayslip.incomeTaxDeduction, (currency as Currency) || 'YER', rates)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-slate-200 pt-1 text-rose-700">
                    <span>إجمالي الاستقطاع:</span>
                    <span>-{formatCurrency(activePayslip.totalDeductions, (currency as Currency) || 'YER', rates)}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay Highlight */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center justify-between font-extrabold text-sm pt-2">
                <div>
                  <span className="text-slate-700 block text-xs font-bold">صافي الراتب المستحق للصرف:</span>
                  <span className="text-[11px] text-slate-500 font-normal">{activePayslip.bankName} - {activePayslip.iban || 'الحساب المعتمد'}</span>
                </div>
                <span className="text-blue-900 text-base font-black">{formatCurrency(activePayslip.netSalary, (currency as Currency) || 'YER', rates)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
