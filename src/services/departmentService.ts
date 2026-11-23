
import api from "./api";

// Department ka data structure
export interface Department {
  id: number;
  departmentCode: string;
  departmentName: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
}

// API response ka structure
export interface DepartmentResponse {
  success: boolean;
  message: string;
  data: Department[];
}

// Departments fetch karne ki API
export const getDepartments = async (): Promise<DepartmentResponse> => {
  const response = await api.get<DepartmentResponse>("/departments");

  return response.data;
};
