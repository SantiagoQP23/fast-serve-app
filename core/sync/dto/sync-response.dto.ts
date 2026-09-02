import { SyncOperation } from "../enums/sync-operation.enum";
import { SyncResourceType } from "../enums/sync-resource-type.enum";

export interface SyncEventDto {
  sequence: number;
  restaurantId: string;
  resourceType: SyncResourceType;
  resourceId: string;
  operation: SyncOperation;
  data: unknown;
  createdAt: string;
}

export interface IncrementalSyncResponseDto {
  type: "incremental";
  fromSequence: number;
  toSequence: number;
  events: SyncEventDto[];
}

export interface SnapshotSyncResponseDto {
  type: "snapshot";
  sequence: number;
  restaurant: unknown;
  tables: unknown[];
  orders: unknown[];
  bills: unknown[];
  products: unknown[];
  categories: unknown[];
  sections: unknown[];
  productionAreas: unknown[];
  settings: Record<string, string | number | boolean>;
}

export type SyncResponseDto =
  | IncrementalSyncResponseDto
  | SnapshotSyncResponseDto;
