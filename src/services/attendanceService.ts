import api from "./api";
import { applyApprovedRequestToRecords } from "../utils/requestStorage";

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

// Attendance records change only when an approved request is applied.
export const getAttendance = async (): Promise<AttendanceResponse> => {
  const response = await api.get<AttendanceResponse>("/attendance");
  return {
    ...response.data,
    data: applyApprovedRequestToRecords(
      "ATTENDANCE",
      response.data.data || []
    ),
  };
};
