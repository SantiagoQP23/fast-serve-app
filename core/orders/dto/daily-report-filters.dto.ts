export enum ReportMode {
  SUMMARY = 'summary',
  FULL = 'full',
}

export interface FilterDailyReportDto {
  startDate?: string;
  endDate?: string;
  userId?: string;
  mode?: ReportMode;
  includeOrderDetails?: boolean;
}
