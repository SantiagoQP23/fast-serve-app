import { restaurantApi } from "@/core/api/restaurantApi";
import { PaymentProof } from "../models/payment-proof.model";

export class PaymentProofsService {
  static async uploadProof(
    transactionId: number,
    fileUri: string,
    fileName: string,
    mimeType: string,
  ): Promise<PaymentProof> {
    const formData = new FormData();
    formData.append("transactionId", String(transactionId));
    formData.append("file", {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as any);

    const { data } = await restaurantApi.post<PaymentProof>(
      "/payment-proofs",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return data;
  }

  static async getProofsByTransaction(
    transactionId: number,
  ): Promise<PaymentProof[]> {
    const { data } = await restaurantApi.get<PaymentProof[]>(
      `/payment-proofs/transaction/${transactionId}`,
    );
    return data;
  }

  static async getPendingProofs(): Promise<PaymentProof[]> {
    const { data } = await restaurantApi.get<PaymentProof[]>(
      "/payment-proofs/pending",
    );
    return data;
  }

  static async approveProof(
    id: number,
    notes?: string,
  ): Promise<PaymentProof> {
    const { data } = await restaurantApi.patch<PaymentProof>(
      `/payment-proofs/${id}/approve`,
      { notes },
    );
    return data;
  }

  static async rejectProof(
    id: number,
    reason: string,
  ): Promise<PaymentProof> {
    const { data } = await restaurantApi.patch<PaymentProof>(
      `/payment-proofs/${id}/reject`,
      { reason },
    );
    return data;
  }
}
