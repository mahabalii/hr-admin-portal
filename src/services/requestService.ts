
import api from "./api";

// Request ke possible actions
export type RequestAction = "CREATE" | "UPDATE" | "DELETE";

// Request status
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

// Single maker-checker request ka structure
export interface MakerRequest {
  id: string;
  module: string;
  action: RequestAction;
  recordId?: string | number;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  requestedBy: string;
  requestedAt: string;
  status: RequestStatus;
  remarks?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

// GET API response
export interface RequestsResponse {
  success: boolean;
  message: string;
  data: MakerRequest[];
}

// POST API response
export interface SingleRequestResponse {
  success: boolean;
  message: string;
  data: MakerRequest;
}

// Request submit karne ka payload
export interface SubmitRequestPayload {
  module: string;
  action: RequestAction;
  recordId?: string | number;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  requestedBy: string;
}

// Checker ke remarks
export interface ReviewRequestPayload {
  remarks: string;
}

// Saari requests fetch karna
export const getRequests = async (): Promise<RequestsResponse> => {
  const response = await api.get<RequestsResponse>("/requests");
  return response.data;
};

// New request submit karna
export const submitRequest = async (
  payload: SubmitRequestPayload
): Promise<SingleRequestResponse> => {
  const response = await api.post<SingleRequestResponse>(
    "/requests",
    payload
  );
  return response.data;
};

// Request approve karna
export const approveRequest = async (
  id: string
): Promise<SingleRequestResponse> => {
  const response = await api.patch<SingleRequestResponse>(
    `/requests/${id}/approve`
  );
  return response.data;
};

// Request reject karna
export const rejectRequest = async (
  id: string,
  payload: ReviewRequestPayload
): Promise<SingleRequestResponse> => {
  const response = await api.patch<SingleRequestResponse>(
    `/requests/${id}/reject`,
    payload
  );
  return response.data;
};
