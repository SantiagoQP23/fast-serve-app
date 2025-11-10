import { Table } from "@/core/tables/models/table.model";

export const useTables = () => {
  const getTables = () => {
    const tables: Table[] = [
      { id: "t1", name: "Table 1", isAvailable: true },
      { id: "t2", name: "Table 2", isAvailable: false },
      { id: "t3", name: "Table 3", isAvailable: false },
      { id: "t4", name: "Table 4", isAvailable: false },
      { id: "t5", name: "Table 5", isAvailable: true },
      { id: "t6", name: "Table 6", isAvailable: true },
      { id: "t7", name: "Table 7", isAvailable: false },
      { id: "t8", name: "Table 8", isAvailable: true },
      { id: "t9", name: "Table 9", isAvailable: true },
      { id: "t10", name: "Table 10", isAvailable: false },
      { id: "t11", name: "Table 11", isAvailable: true },
      { id: "t12", name: "Table 12", isAvailable: false },
      { id: "t13", name: "Table 13", isAvailable: true },
      { id: "t14", name: "Table 14", isAvailable: true },
      { id: "t15", name: "Table 15", isAvailable: false },
    ];

    return tables;
  };

  return {
    getTables,
  };
};
