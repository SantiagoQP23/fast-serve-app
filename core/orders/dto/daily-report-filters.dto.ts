export enum ReportMode {
  SUMMARY = 'summary',
  FULL = 'full',
}

export interface FilterDailyReportDto {
  date?: string;
  userId?: string;
  mode?: ReportMode;
  includeOrderDetails?: boolean;
}
