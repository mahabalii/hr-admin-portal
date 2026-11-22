
import { useEffect, useState } from "react";
import { Search, Users } from "lucide-react";

import {
  getEmployees,
  type Employee,
} from "../services/employeeService";

function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const itemsPerPage = 5;

  // Fetch employees from Mockoon API
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getEmployees();

        setEmployees(response.data);
      } catch (err) {
        console.error("Employee API Error:", err);
        setError("Unable to load employees. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Search employees
  const filteredEmployees = employees.filter((employee) =>
    `${employee.employeeId} ${employee.firstName} ${employee.lastName} ${employee.email} ${employee.department}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(
    filteredEmployees.length / itemsPerPage
  );

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentEmployees = filteredEmployees.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="employees-page">

      {/* Page Heading */}
      <div className="employees-heading">
        <div>
          <h1>Employees</h1>
          <p>Manage and view employee records</p>
        </div>
      </div>

      {/* Search and Employee Count */}
      <div className="employees-toolbar">
        <div className="employee-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="employee-count">
          <Users size={18} />
          <span>{filteredEmployees.length} Employees</span>
        </div>
      </div>

      {/* Employee Table */}
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
              </tr>
            </thead>

            <tbody>
              {currentEmployees.length > 0 ? (
                currentEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.employeeId}</td>

                    <td>
                      {employee.firstName} {employee.lastName}
                    </td>

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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="no-employees">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && (
        <div className="employees-pagination">
          <span>
            Showing{" "}
            {filteredEmployees.length === 0 ? 0 : startIndex + 1}
            {" - "}
            {Math.min(
              startIndex + itemsPerPage,
              filteredEmployees.length
            )}
            {" of "}
            {filteredEmployees.length}
          </span>

          <div>
            <button
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage((page) => page - 1)
              }
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
              onClick={() =>
                setCurrentPage((page) => page + 1)
              }
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Employees;
