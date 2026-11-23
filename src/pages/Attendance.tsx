
import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Search, CalendarCheck, Plus, X } from "lucide-react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

import {
  getAttendance,
  createAttendance,
  type Attendance as AttendanceRecord,
} from "../services/attendanceService";

import {
  getEmployees,
  type Employee,
} from "../services/employeeService";

import type { RootState } from "../store/store";

type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY";

const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Normalize date so YYYY-MM-DD and ISO date strings compare correctly.
const normalizeDate = (date: string) => {
  return String(date || "").slice(0, 10);
};

function Attendance() {
  const user = useSelector((state: RootState) => state.auth.user);
  const isCommon = user?.role === "COMMON";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    employeeId: "",
    date: getToday(),
    checkIn: "",
    checkOut: "",
    status: "PRESENT" as AttendanceStatus,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch attendance records
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getAttendance();
        setAttendance(response.data || []);
      } catch (error) {
        console.error("Attendance fetch error:", error);
        setError("Failed to load attendance. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  // Fetch employees for the dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await getEmployees();
        setEmployees(response.data || []);
      } catch (error) {
        console.error("Employee fetch error:", error);
        toast.error("Unable to load employees.");
      }
    };

    fetchEmployees();
  }, []);

  // Search and filters
  const filteredAttendance = attendance.filter((record) => {
    const matchesSearch =
      `${record.employeeId} ${record.employeeName}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesDate =
      !dateFilter || normalizeDate(record.date) === dateFilter;

    const matchesStatus =
      statusFilter === "ALL" || record.status === statusFilter;

    return matchesSearch && matchesDate && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(
    filteredAttendance.length / itemsPerPage
  );

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentAttendance = filteredAttendance.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Handle form input changes
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormError("");

    setFormData((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "status" && value === "ABSENT"
        ? { checkIn: "", checkOut: "" }
        : {}),
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      employeeId: "",
      date: getToday(),
      checkIn: "",
      checkOut: "",
      status: "PRESENT",
    });

    setFormError("");
  };

  // Close form
  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    resetForm();
  };

  // Submit attendance
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (saving) return;

    setFormError("");

    // Validate employee selection
    const selectedEmployee = employees.find(
      (employee) =>
        employee.employeeId.trim().toLowerCase() ===
        formData.employeeId.trim().toLowerCase()
    );

    if (!selectedEmployee) {
      const message = "Please select a valid employee.";
      setFormError(message);
      toast.error(message);
      return;
    }

    // Validate date
    if (!formData.date) {
      const message = "Please select an attendance date.";
      setFormError(message);
      toast.error(message);
      return;
    }
    // Validate future date
    if (formData.date > getToday()) {
    const message = "Future attendance date is not allowed.";
    setFormError(message);
    toast.error(message);
    return;
    }

    // Duplicate validation: same employee + same date
    const duplicateAttendance = attendance.some((record) => {
      const existingEmployeeId = String(record.employeeId || "")
        .trim()
        .toLowerCase();

      const selectedEmployeeId = formData.employeeId
        .trim()
        .toLowerCase();

      const existingDate = normalizeDate(record.date);
      const selectedDate = normalizeDate(formData.date);

      return (
        existingEmployeeId === selectedEmployeeId &&
        existingDate === selectedDate
      );
    });

    if (duplicateAttendance) {
      const message =
        "Attendance already exists for this employee on this date.";

      setFormError(message);
      toast.error(message);
      return;
    }

    // Check-in validation
    if (
      formData.status !== "ABSENT" &&
      !formData.checkIn
    ) {
      const message = "Please enter check-in time.";
      setFormError(message);
      toast.error(message);
      return;
    }

    // Check-out validation
    if (
      formData.status !== "ABSENT" &&
      formData.checkIn &&
      formData.checkOut &&
      formData.checkOut <= formData.checkIn
    ) {
      const message = "Check-out must be later than check-in.";
      setFormError(message);
      toast.error(message);
      return;
    }

    try {
      setSaving(true);

      const response = await createAttendance(formData);

      const newAttendance: AttendanceRecord = {
        ...response.data,
        employeeId: selectedEmployee.employeeId,
        employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
      };

      // Update table only after successful API response
      setAttendance((previous) => [
        ...previous,
        newAttendance,
      ]);

      toast.success(
        response.message || "Attendance added successfully."
      );

      setShowForm(false);
      resetForm();
      setCurrentPage(1);
    } catch (error) {
      console.error("Attendance API Error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to add attendance.";

      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="attendance-page">
      <div className="page-heading">
        <div>
          <h1>Attendance</h1>
          <p>View and manage employee attendance.</p>
        </div>

        {isCommon && (
          <button
            type="button"
            className="attendance-add-button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus size={18} />
            Add Attendance
          </button>
        )}
      </div>

      {showForm && (
        <div className="attendance-form-card">
          <div className="attendance-form-heading">
            <h2>Add Attendance</h2>

            <button
              type="button"
              onClick={closeForm}
              aria-label="Close form"
              disabled={saving}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="attendance-form-grid">
              <div className="attendance-form-field">
                <label>Employee *</label>

                <select
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Employee</option>

                  {employees.map((employee) => (
                    <option
                      key={employee.id}
                      value={employee.employeeId}
                    >
                      {employee.employeeId} - {employee.firstName}{" "}
                      {employee.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="attendance-form-field">
                <label>Date *</label>

                <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    max={getToday()}
                    required
                 />
              </div>

              <div className="attendance-form-field">
                <label>Check In</label>

                <input
                  type="time"
                  name="checkIn"
                  value={formData.checkIn}
                  onChange={handleChange}
                  disabled={formData.status === "ABSENT"}
                  required={formData.status !== "ABSENT"}
                />
              </div>

              <div className="attendance-form-field">
                <label>Check Out</label>

                <input
                  type="time"
                  name="checkOut"
                  value={formData.checkOut}
                  onChange={handleChange}
                  disabled={formData.status === "ABSENT"}
                />
              </div>

              <div className="attendance-form-field">
                <label>Status *</label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="HALF_DAY">Half Day</option>
                </select>
              </div>
            </div>

            {formError && (
              <p
                role="alert"
                style={{
                  color: "#dc2626",
                  marginTop: "12px",
                  fontSize: "14px",
                }}
              >
                {formError}
              </p>
            )}

            <div className="attendance-form-actions">
              <button
                type="button"
                className="attendance-cancel-button"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="attendance-save-button"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Attendance"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="attendance-toolbar">
        <div className="attendance-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search employee..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <input
          type="date"
          className="attendance-filter"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setCurrentPage(1);
          }}
        />

        <select
          className="attendance-filter"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="ALL">All Status</option>
          <option value="PRESENT">Present</option>
          <option value="ABSENT">Absent</option>
          <option value="HALF_DAY">Half Day</option>
        </select>

        <div className="attendance-count">
          Total Records: {filteredAttendance.length}
        </div>
      </div>

      {loading ? (
        <div className="data-message">
          Loading attendance...
        </div>
      ) : error ? (
        <div className="data-message error-message">
          {error}
        </div>
      ) : filteredAttendance.length === 0 ? (
        <div className="data-message">
          <CalendarCheck size={30} />
          <p>No attendance records found.</p>
        </div>
      ) : (
        <>
          <div className="attendance-table-wrapper">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Employee Name</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {currentAttendance.map((record) => (
                  <tr key={record.id}>
                    <td>{record.employeeId}</td>
                    <td>{record.employeeName}</td>
                    <td>{normalizeDate(record.date)}</td>
                    <td>{record.checkIn || "-"}</td>
                    <td>{record.checkOut || "-"}</td>
                    <td>
                      <span
                        className={`attendance-status status-${record.status.toLowerCase()}`}
                      >
                        {record.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => page - 1)}
            >
              Previous
            </button>

            <span>
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={
                totalPages === 0 || currentPage >= totalPages
              }
              onClick={() => setCurrentPage((page) => page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Attendance;
