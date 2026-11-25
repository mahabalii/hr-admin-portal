
import { useEffect, useState, type FormEvent } from "react";
import { useSelector } from "react-redux";
import {
  Search,
  CalendarCheck,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import type { RootState } from "../store/store";
import {
  getAttendance,
  type Attendance,
} from "../services/attendanceService";
import {
  getEmployees,
  type Employee,
} from "../services/employeeService";
import { submitAndStoreRequest } from "../utils/requestStorage";

import "../App.css";

type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY";
type AttendanceAction = "CREATE" | "UPDATE";

interface AttendanceForm {
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
}

const emptyForm: AttendanceForm = {
  employeeId: "",
  date: "",
  checkIn: "",
  checkOut: "",
  status: "PRESENT",
};

const ITEMS_PER_PAGE = 5;

const getTodayDate = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};

function AttendancePage() {
  const user = useSelector((state: RootState) => state.auth.user);

  const isMaker = user?.role === "MAKER";
  const canAddAttendance = isMaker || user?.role === "COMMON";

  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [action, setAction] = useState<AttendanceAction>("CREATE");
  const [selectedAttendance, setSelectedAttendance] =
    useState<Attendance | null>(null);
  const [form, setForm] = useState<AttendanceForm>(emptyForm);

  // Fetch Attendance and Employees
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [attendanceResponse, employeeResponse] =
          await Promise.all([
            getAttendance(),
            getEmployees(),
          ]);

        setAttendance(attendanceResponse.data || []);
        setEmployees(employeeResponse.data || []);
      } catch (err) {
        console.error("Attendance API Error:", err);
        setError("Unable to load attendance records. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Search
  const filteredAttendance = attendance.filter((item) => {
    const search = searchTerm.toLowerCase();

    return (
      item.employeeId.toLowerCase().includes(search) ||
      item.employeeName.toLowerCase().includes(search) ||
      item.date.toLowerCase().includes(search) ||
      item.status.toLowerCase().includes(search)
    );
  });

  // Pagination
  const totalPages = Math.ceil(
    filteredAttendance.length / ITEMS_PER_PAGE
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const currentItems = filteredAttendance.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Open Add Form
  const handleAdd = () => {
    setAction("CREATE");
    setSelectedAttendance(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleEdit = (record: Attendance) => {
    setAction("UPDATE");
    setSelectedAttendance(record);
    setForm({
      employeeId: record.employeeId,
      date: record.date,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      status: record.status,
    });
    setShowForm(true);
  };

  // Close Form
  const closeForm = () => {
    setShowForm(false);
    setSelectedAttendance(null);
    setAction("CREATE");
    setForm(emptyForm);
  };

  // Input Change
  const handleChange = (
    field: keyof AttendanceForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleDelete = async (record: Attendance) => {
    if (!user || !isMaker) return;

    const confirmed = window.confirm(
      `Submit a removal request for ${record.employeeName}'s attendance on ${record.date}?`
    );
    if (!confirmed) return;

    try {
      await submitAndStoreRequest({
        module: "ATTENDANCE",
        action: "DELETE",
        recordId: record.id,
        requestedBy: user.username,
        oldData: {
          employeeId: record.employeeId,
          employeeName: record.employeeName,
          date: record.date,
          checkIn: record.checkIn,
          checkOut: record.checkOut,
          status: record.status,
        },
      });

      toast.success("Delete request submitted");
    } catch (error) {
      console.error("Attendance removal request error:", error);
      toast.error("Unable to submit attendance removal request.");
    }
  };

  // COMMON adds directly; MAKER submits create/update for checker approval.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) return;

    if (form.date > getTodayDate()) {
      toast.error("Future date attendance is not allowed.");
      return;
    }

    const selectedEmployee = employees.find(
      (employee) => employee.employeeId === form.employeeId
    );

    if (!selectedEmployee) {
      toast.error("Please select a valid employee.");
      return;
    }

    const duplicate = attendance.some(
      (item) =>
        item.employeeId === form.employeeId &&
        item.date === form.date &&
        item.id !== selectedAttendance?.id
    );

    if (duplicate) {
      toast.error("Attendance already exists for this employee and date.");
      return;
    }

    if (
      form.status !== "ABSENT" &&
      form.checkIn &&
      form.checkOut &&
      form.checkOut <= form.checkIn
    ) {
      toast.error("Check-out time must be after check-in time.");
      return;
    }

    try {
      setFormLoading(true);

      const newData = {
        employeeId: form.employeeId,
        date: form.date,
        checkIn: form.status === "ABSENT" ? "" : form.checkIn,
        checkOut: form.status === "ABSENT" ? "" : form.checkOut,
        status: form.status,
        employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
      };

      if (!canAddAttendance || (action === "UPDATE" && !isMaker)) return;

      await submitAndStoreRequest({
        module: "ATTENDANCE",
        action,
        requestedBy: user.username,
        ...(action === "UPDATE" && selectedAttendance
          ? {
              recordId: selectedAttendance.id,
              oldData: {
                employeeId: selectedAttendance.employeeId,
                employeeName: selectedAttendance.employeeName,
                date: selectedAttendance.date,
                checkIn: selectedAttendance.checkIn,
                checkOut: selectedAttendance.checkOut,
                status: selectedAttendance.status,
              },
            }
          : {}),
        newData,
      });

      toast.success(
        action === "CREATE"
          ? "Attendance submitted"
          : "Update request submitted"
      );

      closeForm();
    } catch (err) {
      console.error("Attendance request error:", err);
      toast.error("Unable to submit attendance request.");
    } finally {
      setFormLoading(false);
    }
  };

  if (!user) return <p>Please login to continue.</p>;

  return (
    <div className="employee-types-page">

      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <h1>Attendance</h1>
          <p>View and manage employee attendance records</p>
        </div>

        {canAddAttendance && (
          <button
            className="employee-add-btn"
            onClick={handleAdd}
            disabled={loading}
          >
            <Plus size={18} />
            Add Attendance
          </button>
        )}
      </div>

      {/* Search and Count */}
      <div className="employee-types-toolbar">

        <div className="employee-types-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search attendance..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="employee-types-count">
          <CalendarCheck size={18} />

          <span>
            Total Records: <strong>{filteredAttendance.length}</strong>
          </span>
        </div>

      </div>

      {/* Loading */}
      {loading && (
        <div className="table-message">
          Loading attendance...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="table-error">
          {error}
        </div>
      )}

      {/* Attendance Table */}
      {!loading && !error && (
        <div className="employee-types-table-wrapper">

          <table className="employee-types-table">

            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
                {isMaker && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {currentItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.employeeId}</td>
                  <td>{item.employeeName}</td>
                  <td>{item.date}</td>
                  <td>{item.checkIn || "-"}</td>
                  <td>{item.checkOut || "-"}</td>

                  <td>
                    <span
                      className={
                        item.status === "PRESENT"
                          ? "status-active"
                          : "status-inactive"
                      }
                    >
                      {item.status.replace("_", " ")}
                    </span>
                  </td>

                  {isMaker && (
                    <td>
                      <div className="employee-actions">
                        <button
                          type="button"
                          className="employee-edit-btn"
                          title="Submit attendance update for approval"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="employee-delete-btn"
                          title="Submit attendance removal for approval"
                          onClick={() => void handleDelete(item)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {filteredAttendance.length === 0 && (
                <tr>
                  <td colSpan={isMaker ? 7 : 6} className="table-message">
                    No attendance records found.
                  </td>
                </tr>
              )}
            </tbody>

          </table>

        </div>
      )}

      {/* Pagination */}
      {!loading && !error && (
        <div className="employees-pagination">
          <span>
            Showing {filteredAttendance.length === 0 ? 0 : startIndex + 1}
            {" - "}
            {Math.min(
              startIndex + ITEMS_PER_PAGE,
              filteredAttendance.length
            )}
            {" of "}
            {filteredAttendance.length}
          </span>

          <div>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => page - 1)}
            >
              Previous
            </button>

            <span>
              {currentPage} / {Math.max(totalPages, 1)}
            </span>

            <button
              disabled={
                currentPage >= totalPages || totalPages === 0
              }
              onClick={() => setCurrentPage((page) => page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add / Update Attendance Modal */}
      {showForm && (
        <div className="employee-modal-overlay">
          <div className="employee-modal">

            <div className="employee-modal-header">
              <div>
                <h2>
                  {action === "CREATE" ? "Add Attendance" : "Update Attendance"}
                </h2>
                <p>
                  This attendance change will be sent to Checker for approval.
                </p>
              </div>

              <button
                className="employee-modal-close"
                onClick={closeForm}
                type="button"
              >
                <X size={21} />
              </button>
            </div>

            <form
              className="employee-modal-form"
              onSubmit={handleSubmit}
            >
              <div className="employee-modal-grid">

                <div className="employee-form-field">
                  <label>Employee</label>

                  <select
                    required
                    value={form.employeeId}
                    onChange={(e) =>
                      handleChange("employeeId", e.target.value)
                    }
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

                <div className="employee-form-field">
                  <label>Date</label>

                  <input
                    type="date"
                    required
                    max={getTodayDate()}
                    value={form.date}
                    onChange={(e) =>
                      handleChange("date", e.target.value)
                    }
                  />
                </div>

                <div className="employee-form-field">
                  <label>Check In</label>

                  <input
                    type="time"
                    disabled={form.status === "ABSENT"}
                    required={form.status !== "ABSENT"}
                    value={form.checkIn}
                    onChange={(e) =>
                      handleChange("checkIn", e.target.value)
                    }
                  />
                </div>

                <div className="employee-form-field">
                  <label>Check Out</label>

                  <input
                    type="time"
                    disabled={form.status === "ABSENT"}
                    required={form.status !== "ABSENT"}
                    value={form.checkOut}
                    onChange={(e) =>
                      handleChange("checkOut", e.target.value)
                    }
                  />
                </div>

                <div className="employee-form-field">
                  <label>Status</label>

                  <select
                    value={form.status}
                    onChange={(e) =>
                      handleChange("status", e.target.value)
                    }
                  >
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="HALF_DAY">Half Day</option>
                  </select>
                </div>

              </div>

              <div className="employee-modal-actions">
                <button
                  type="button"
                  className="employee-cancel-btn"
                  onClick={closeForm}
                  disabled={formLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="employee-submit-btn"
                  disabled={formLoading}
                >
                  {formLoading
                    ? "Submitting..."
                    : "Submit for Approval"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default AttendancePage;
