export enum DateRangeFilter {
  TODAY = "today",
  WEEK_TO_DATE = "week_to_date",
  MONTH_TO_DATE = "month_to_date",
  YEAR_TO_DATE = "year_to_date",
  CUSTOM = "custom",
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export function getDateRangeFor(
  filter: DateRangeFilter,
  custom?: { startDate: Date; endDate: Date },
): DateRange {
  const now = new Date();
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );

  switch (filter) {
    case DateRangeFilter.TODAY: {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { startDate: start.toISOString(), endDate: endOfToday.toISOString() };
    }
    case DateRangeFilter.WEEK_TO_DATE: {
      const dayOfWeek = now.getDay();
      const daysSinceMonday = (dayOfWeek + 6) % 7;
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday);
      return { startDate: start.toISOString(), endDate: endOfToday.toISOString() };
    }
    case DateRangeFilter.MONTH_TO_DATE: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start.toISOString(), endDate: endOfToday.toISOString() };
    }
    case DateRangeFilter.YEAR_TO_DATE: {
      const start = new Date(now.getFullYear(), 0, 1);
      return { startDate: start.toISOString(), endDate: endOfToday.toISOString() };
    }
    case DateRangeFilter.CUSTOM: {
      if (!custom) {
        throw new Error("Custom date range requires startDate and endDate");
      }
      const start = new Date(
        custom.startDate.getFullYear(),
        custom.startDate.getMonth(),
        custom.startDate.getDate(),
      );
      const end = new Date(
        custom.endDate.getFullYear(),
        custom.endDate.getMonth(),
        custom.endDate.getDate(),
        23,
        59,
        59,
        999,
      );
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
  }
}
