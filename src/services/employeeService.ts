
import api from "./api";

// Employee data structure
export interface Employee {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  employeeType: string;
  joiningDate: string;
  status: "ACTIVE" | "INACTIVE";
}

// API response structure
export interface EmployeeResponse {
  success: boolean;
  message: string;
  data: Employee[];
}

// Single employee response
export interface SingleEmployeeResponse {
  success: boolean;
  message: string;
  data: Employee;
}

// Get all employees
export const getEmployees = async (): Promise<EmployeeResponse> => {
  const response = await api.get<EmployeeResponse>("/employees");
  return response.data;
};

// Get employee by ID
export const getEmployeeById = async (
  id: number
): Promise<SingleEmployeeResponse> => {
  const response = await api.get<SingleEmployeeResponse>(
    `/employees/${id}`
  );

  return response.data;
};

// Submit create employee request
export const createEmployee = async (
  employeeData: Omit<Employee, "id">
) => {
  const response = await api.post("/activities", {
    module: "EMPLOYEES",
    action: "CREATE",
    newData: employeeData,
  });

  return response.data;
};

// Submit update employee request
export const updateEmployee = async (
  id: number,
  employeeData: Partial<Omit<Employee, "id">>
) => {
  const response = await api.post("/activities", {
    module: "EMPLOYEES",
    action: "UPDATE",
    recordId: id,
    newData: employeeData,
  });

  return response.data;
};

// Submit delete employee request
export const deleteEmployee = async (id: number) => {
  const response = await api.post("/activities", {
    module: "EMPLOYEES",
    action: "DELETE",
    recordId: id,
  });

  return response.data;
};
