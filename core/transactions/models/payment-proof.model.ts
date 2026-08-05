export enum PaymentProofStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface PaymentProof {
  id: number;
  transactionId: number;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: PaymentProofStatus;
  rejectionReason?: string;
  notes?: string;
  uploadedBy: {
    id: string;
    person: {
      firstName: string;
      lastName: string;
    };
  };
  reviewedBy?: {
    id: string;
    person: {
      firstName: string;
      lastName: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}
