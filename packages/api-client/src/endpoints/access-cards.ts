import { apiClient } from "../client";
import {
  CardBatch,
  AccessCard,
  AccessCardLog,
  CreateCardBatchDto,
  IssueCardDto,
  ReturnCardDto,
  UpdateCardStatusDto,
  CardStatus,
} from "@domas/ts-types";

export const accessCards = {
  // --- Batches ---
  createBatch: async (data: CreateCardBatchDto): Promise<CardBatch> => {
    const response = await apiClient.post<CardBatch>(
      "/access-cards/batches",
      data,
    );
    return response.data;
  },

  findAllBatches: async (): Promise<CardBatch[]> => {
    const response = await apiClient.get<CardBatch[]>("/access-cards/batches");
    return response.data;
  },

  // --- Cards ---
  findAllCards: async (params?: {
    batchId?: number;
    status?: CardStatus;
  }): Promise<AccessCard[]> => {
    const response = await apiClient.get<AccessCard[]>("/access-cards/cards", {
      params,
    });
    return response.data;
  },

  issueCard: async (data: IssueCardDto): Promise<AccessCard> => {
    const response = await apiClient.post<AccessCard>(
      "/access-cards/issue",
      data,
    );
    return response.data;
  },

  returnCard: async (id: number, data: ReturnCardDto): Promise<AccessCard> => {
    const response = await apiClient.post<AccessCard>(
      `/access-cards/cards/${id}/return`,
      data,
    );
    return response.data;
  },

  updateStatus: async (
    id: number,
    data: UpdateCardStatusDto,
  ): Promise<AccessCard> => {
    const response = await apiClient.patch<AccessCard>(
      `/access-cards/cards/${id}/status`,
      data,
    );
    return response.data;
  },

  getLogs: async (id: number): Promise<AccessCardLog[]> => {
    const response = await apiClient.get<AccessCardLog[]>(
      `/access-cards/cards/${id}/logs`,
    );
    return response.data;
  },
};
