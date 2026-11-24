
import api from "./api";
import { applyApprovedRequestToRecords } from "../utils/requestStorage";

// Designation data structure
export interface Designation {
  id: number;
  designationCode: string;
  designationName: string;
  department: string;
  status: "ACTIVE" | "INACTIVE";
}

// API response structure
export interface DesignationResponse {
  success: boolean;
  message: string;
  data: Designation[];
}

// Fetch designations from API
export const getDesignations = async (): Promise<DesignationResponse> => {
  const response = await api.get<DesignationResponse>("/designations");

  return {
    ...response.data,
    data: applyApprovedRequestToRecords("DESIGNATIONS", response.data.data || []),
  };
};
