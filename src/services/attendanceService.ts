
import api from "./api";

// Attendance data structure
export interface Attendance {
  id: number;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: "PRESENT" | "ABSENT" | "HALF_DAY";
}

// API response structure
export interface AttendanceResponse {
  success: boolean;
  message: string;
  data: Attendance[];
}

// New attendance input structure
export interface CreateAttendancePayload {
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: "PRESENT" | "ABSENT" | "HALF_DAY";
}

// Single attendance API response
export interface SingleAttendanceResponse {
  success: boolean;
  message: string;
  data: Attendance;
}

// Fetch attendance records
export const getAttendance = async (): Promise<AttendanceResponse> => {
  const response = await api.get<AttendanceResponse>("/attendance");
  return response.data;
};

// Add new attendance record
export const createAttendance = async (
  payload: CreateAttendancePayload
): Promise<SingleAttendanceResponse> => {
  const response = await api.post<SingleAttendanceResponse>(
    "/attendance",
    payload
  );

  return response.data;
};
