import { useEffect, useState, type FormEvent } from "react";
import { useSelector } from "react-redux";
import { Search, Users, Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";

import type { RootState } from "../store/store";
import { getEmployees, type Employee } from "../services/employeeService";
import { getDepartments, type Department } from "../services/departmentService";
import { getDesignations, type Designation } from "../services/designationService";
import { getEmployeeTypes, type EmployeeType } from "../services/employeeTypeService";
import {
  getLocalRequestNotice,
  submitAndStoreRequest,
} from "../utils/requestStorage";

type EmployeeAction = "CREATE" | "UPDATE" | "DELETE";
type EmployeeForm = Omit<Employee, "id">;

const ITEMS_PER_PAGE = 5;

const emptyForm: EmployeeForm = {
  employeeId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  employeeType: "",
  joiningDate: "",
  status: "ACTIVE",
};

function generateEmployeeId(employees: Employee[]) {
  const highestId = employees.reduce((max, employee) => {
    const number = Number(employee.employeeId.replace(/^EMP[-_]?/i, ""));
    return Number.isNaN(number) ? max : Math.max(max, number);
  }, 0);

  return `EMP${String(highestId + 1).padStart(3, "0")}`;
}

function Employees() {
  const user = useSelector((state: RootState) => state.auth.user);
  const isMaker = user?.role === "MAKER";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [employeeTypes, setEmployeeTypes] = useState<EmployeeType[]>([]);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dropdownLoading, setDropdownLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [requestAction, setRequestAction] = useState<EmployeeAction>("CREATE");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeForm, setEmployeeForm] = useState<EmployeeForm>(emptyForm);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getEmployees();
        setEmployees(response.data || []);
      } catch (err) {
        console.error("Employee API Error:", err);
        setError("Unable to load employees. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    const fetchDropdownData = async () => {
      try {
        setDropdownLoading(true);

        const [departmentRes, designationRes, employeeTypeRes] =
          await Promise.all([
            getDepartments(),
            getDesignations(),
            getEmployeeTypes(),
          ]);

        setDepartments(departmentRes.data || []);
        setDesignations(designationRes.data || []);
        setEmployeeTypes(employeeTypeRes.data || []);
      } catch (err) {
        console.error("Dropdown API Error:", err);
        toast.error("Unable to load form dropdown data.");
      } finally {
        setDropdownLoading(false);
      }
    };

    fetchEmployees();
    fetchDropdownData();
  }, []);

  const filteredEmployees = employees.filter((employee) =>
    `${employee.employeeId} ${employee.firstName} ${employee.lastName} ${employee.email} ${employee.department}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentEmployees = filteredEmployees.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handleAdd = () => {
    setRequestAction("CREATE");
    setSelectedEmployee(null);
    setEmployeeForm({
      ...emptyForm,
      employeeId: generateEmployeeId(employees),
    });
    setShowForm(true);
  };

  const handleEdit = (employee: Employee) => {
  const employeeData: EmployeeForm = {
    employeeId: employee.employeeId,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone,
    department: employee.department,
    designation: employee.designation,
    employeeType: employee.employeeType,
    joiningDate: employee.joiningDate,
    status: employee.status,
  };

  setRequestAction("UPDATE");
  setSelectedEmployee(employee);
  setEmployeeForm(employeeData);
  setShowForm(true);
};

  const closeForm = () => {
    setShowForm(false);
    setSelectedEmployee(null);
    setEmployeeForm(emptyForm);
    setRequestAction("CREATE");
  };

  const handleInputChange = (field: keyof EmployeeForm, value: string) => {
    setEmployeeForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const duplicateId = employees.some(
      (employee) =>
        employee.employeeId.toLowerCase() ===
          employeeForm.employeeId.trim().toLowerCase() &&
        employee.id !== selectedEmployee?.id
    );

    if (duplicateId) {
      toast.error("This Employee ID already exists.");
      return;
    }

    try {
      setFormLoading(true);

      const payload = {
        module: "EMPLOYEES",
        action: requestAction,
        requestedBy: user.username,
        ...(requestAction === "UPDATE" && selectedEmployee
          ? {
              recordId: selectedEmployee.id,
              oldData: {
                employeeId: selectedEmployee.employeeId,
                firstName: selectedEmployee.firstName,
                lastName: selectedEmployee.lastName,
                email: selectedEmployee.email,
                phone: selectedEmployee.phone,
                department: selectedEmployee.department,
                designation: selectedEmployee.designation,
                employeeType: selectedEmployee.employeeType,
                joiningDate: selectedEmployee.joiningDate,
                status: selectedEmployee.status,
              },
            }
          : {}),
        newData: { ...employeeForm },
      };

      const result = await submitAndStoreRequest(payload);
      toast.success(
        result.apiSynced
          ? requestAction === "CREATE"
            ? "Employee creation request submitted!"
            : "Employee update request submitted!"
          : getLocalRequestNotice(result.apiAvailable)
      );

      closeForm();
    } catch (err) {
      console.error("Employee request error:", err);
      toast.error("Unable to submit request. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (employee: Employee) => {
    if (!user) return;

    const confirmed = window.confirm(
      `Submit a removal request for ${employee.firstName} ${employee.lastName}?`
    );
    if (!confirmed) return;

    try {
      const payload = {
        module: "EMPLOYEES",
        action: "DELETE" as const,
        recordId: employee.id,
        requestedBy: user.username,
        oldData: {
          employeeId: employee.employeeId,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          department: employee.department,
          designation: employee.designation,
          employeeType: employee.employeeType,
          joiningDate: employee.joiningDate,
          status: employee.status,
        },
      };

      const result = await submitAndStoreRequest(payload);
      toast.success(
        result.apiSynced
          ? "Employee removal request submitted!"
          : getLocalRequestNotice(result.apiAvailable)
      );
    } catch (err) {
      console.error("Employee removal error:", err);
      toast.error("Unable to submit removal request.");
    }
  };

  if (!user) return <p>Please login to continue.</p>;

  const activeDepartments = departments.filter(
    (item) => item.status === "ACTIVE"
  );
  const activeDesignations = designations.filter(
    (item) =>
      item.status === "ACTIVE" &&
      item.department === employeeForm.department
  );
  const activeEmployeeTypes = employeeTypes.filter(
    (item) => item.status === "ACTIVE"
  );

  const availableDepartments = [
    ...activeDepartments,
    ...departments.filter(
      (item) =>
        item.departmentName === employeeForm.department &&
        item.status !== "ACTIVE"
    ),
  ];

  const availableDesignations = [
    ...activeDesignations,
    ...designations.filter(
      (item) =>
        item.designationName === employeeForm.designation &&
        item.department === employeeForm.department &&
        item.status !== "ACTIVE"
    ),
  ];

  const availableEmployeeTypes = [
    ...activeEmployeeTypes,
    ...employeeTypes.filter(
      (item) =>
        item.typeName === employeeForm.employeeType &&
        item.status !== "ACTIVE"
    ),
  ];

  return (
    <div className="employees-page">
      <div className="employees-heading">
        <div>
          <h1>Employees</h1>
          <p>Manage and view employee records</p>
        </div>

        {isMaker && (
          <button
            className="employee-add-btn"
            onClick={handleAdd}
            disabled={loading || dropdownLoading}
          >
            <Plus size={18} />
            Add Employee
          </button>
        )}
      </div>

      <div className="employees-toolbar">
        <div className="employee-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="employee-count">
          <Users size={18} />
          <span>{filteredEmployees.length} Employees</span>
        </div>
      </div>

      <div className="employees-table-wrapper">
        {loading ? (
          <p className="table-message">Loading employees...</p>
        ) : error ? (
          <p className="table-error">{error}</p>
        ) : (
          <table className="employees-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Employee Type</th>
                <th>Status</th>
                {isMaker && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {currentEmployees.length > 0 ? (
                currentEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.employeeId}</td>
                    <td>{employee.firstName} {employee.lastName}</td>
                    <td>{employee.email}</td>
                    <td>{employee.phone}</td>
                    <td>{employee.department}</td>
                    <td>{employee.designation}</td>
                    <td>{employee.employeeType}</td>
                    <td>
                      <span
                        className={`employee-status ${
                          employee.status === "ACTIVE"
                            ? "status-active"
                            : "status-inactive"
                        }`}
                      >
                        {employee.status}
                      </span>
                    </td>
                    {isMaker && (
                      <td>
                        <div className="employee-actions">
                          <button
                            className="employee-edit-btn"
                            title="Edit employee"
                            onClick={() => handleEdit(employee)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="employee-delete-btn"
                            title="Remove employee"
                            onClick={() => handleDelete(employee)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isMaker ? 9 : 8} className="no-employees">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

            {!loading && !error && (
        <div className="employees-pagination">
          <span>
            Showing {filteredEmployees.length === 0 ? 0 : startIndex + 1}
            {" - "}
            {Math.min(startIndex + ITEMS_PER_PAGE, filteredEmployees.length)}
            {" of "}
            {filteredEmployees.length}
          </span>

          <div>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => page - 1)}
            >
              Previous
            </button>
            <span>{currentPage} / {Math.max(totalPages, 1)}</span>
            <button
              disabled={currentPage >= totalPages || totalPages === 0}
              onClick={() => setCurrentPage((page) => page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="employee-modal-overlay">
          <div className="employee-modal">
            <div className="employee-modal-header">
              <div>
                <h2>
                  {requestAction === "CREATE" ? "Add Employee" : "Update Employee"}
                </h2>
                <p>This request will be sent to Checker for approval.</p>
              </div>

              <button
                className="employee-modal-close"
                onClick={closeForm}
                type="button"
              >
                <X size={21} />
              </button>
            </div>

            <form className="employee-modal-form" onSubmit={handleSubmitRequest}>
              <div className="employee-modal-grid">
                <div className="employee-form-field">
                  <label>Employee ID</label>
                  <input value={employeeForm.employeeId} readOnly />
                  <small>Automatically generated</small>
                </div>

                <div className="employee-form-field">
                  <label>First Name</label>
                  <input
                    required
                    value={employeeForm.firstName}
                    onChange={(event) =>
                      handleInputChange("firstName", event.target.value)
                    }
                    placeholder="First name"
                  />
                </div>

                <div className="employee-form-field">
                  <label>Last Name</label>
                  <input
                    required
                    value={employeeForm.lastName}
                    onChange={(event) =>
                      handleInputChange("lastName", event.target.value)
                    }
                    placeholder="Last name"
                  />
                </div>

                <div className="employee-form-field">
                  <label>Email</label>
                  <input
                    type="email"
                    required
                    value={employeeForm.email}
                    onChange={(event) =>
                      handleInputChange("email", event.target.value)
                    }
                    placeholder="employee@example.com"
                  />
                </div>

                <div className="employee-form-field">
                  <label>Phone</label>
                  <input
                    type="tel"
                    required
                    value={employeeForm.phone}
                    onChange={(event) =>
                      handleInputChange("phone", event.target.value)
                    }
                    placeholder="Phone number"
                  />
                </div>

                <div className="employee-form-field">
                  <label>Department</label>
                  <select
                    required
                    value={employeeForm.department}
                    disabled={dropdownLoading}
                    onChange={(event) => {
                      setEmployeeForm((previous) => ({
                        ...previous,
                        department: event.target.value,
                        designation: "",
                      }));
                    }}
                  >
                    <option value="">Select Department</option>
                    {availableDepartments.map((item) => (
                      <option key={item.id} value={item.departmentName}>
                        {item.departmentName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="employee-form-field">
                  <label>Designation</label>
                  <select
                    required
                    value={employeeForm.designation}
                    disabled={dropdownLoading || !employeeForm.department}
                    onChange={(event) =>
                      handleInputChange("designation", event.target.value)
                    }
                  >
                    <option value="">Select Designation</option>
                    {availableDesignations.map((item) => (
                      <option key={item.id} value={item.designationName}>
                        {item.designationName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="employee-form-field">
                  <label>Employee Type</label>
                  <select
                    required
                    value={employeeForm.employeeType}
                    disabled={dropdownLoading}
                    onChange={(event) =>
                      handleInputChange("employeeType", event.target.value)
                    }
                  >
                    <option value="">Select Employee Type</option>
                    {availableEmployeeTypes.map((item) => (
                      <option key={item.id} value={item.typeName}>
                        {item.typeName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="employee-form-field">
                  <label>Joining Date</label>
                  <input
                    type="date"
                    required
                    value={employeeForm.joiningDate}
                    onChange={(event) =>
                      handleInputChange("joiningDate", event.target.value)
                    }
                  />
                </div>

                <div className="employee-form-field">
                  <label>Status</label>
                  <select
                    value={employeeForm.status}
                    onChange={(event) =>
                      handleInputChange("status", event.target.value)
                    }
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
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
                  disabled={formLoading || dropdownLoading}
                >
                  {formLoading ? "Submitting..." : "Submit for Approval"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Employees;
