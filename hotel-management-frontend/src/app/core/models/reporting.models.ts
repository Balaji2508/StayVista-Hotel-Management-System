export interface DailyOccupancy {
  date: string;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
}

export interface OccupancyReportResponse {
  startDate: string;
  endDate: string;
  averageOccupancyRate: number;
  totalRooms: number;
  dailyBreakdown: DailyOccupancy[];
}

export interface RevenueStream {
  category: string;
  amount: number;
  percentage: number;
}

export interface RevenueReportResponse {
  startDate: string;
  endDate: string;
  totalRevenue: number;
  revPAR: number;
  averageDailyRate: number;
  revenueStreams: RevenueStream[];
}

export interface ExpenseReportResponse {
  startDate: string;
  endDate: string;
  totalExpenses: number;
  expensesByCategory: Record<string, number>;
}

export interface StaffMetric {
  staffId: number;
  staffName: string;
  completedTasks: number;
  attendanceRate: number;
}

export interface StaffPerformanceReportResponse {
  startDate: string;
  endDate: string;
  totalStaff: number;
  totalCompletedTasks: number;
  staffMetrics: StaffMetric[];
}

export interface DailySummaryResponse {
  date: string;
  occupancyRate: number;
  occupiedRooms: number;
  availableRooms: number;
  arrivalsToday: number;
  departuresToday: number;
  totalDailyRevenue: number;
  totalDailyExpenses: number;
  pendingComplaints: number;
  generatedAt: string;
}
