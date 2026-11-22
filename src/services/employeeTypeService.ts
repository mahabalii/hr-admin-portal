
import api from "./api";

// Employee Type ka data structure
export interface EmployeeType {
  id: number;
  typeCode: string;
  typeName: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
}

// API response ka structure
export interface EmployeeTypeResponse {
  success: boolean;
  message: string;
  data: EmployeeType[];
}

// Mockoon se Employee Types fetch karna
export const getEmployeeTypes = async (): Promise<EmployeeTypeResponse> => {
  const response = await api.get<EmployeeTypeResponse>("/employee-types");

  return response.data;
};
