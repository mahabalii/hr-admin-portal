
import { useEffect, useState } from "react";
import { Search, Building2 } from "lucide-react";

import {
  getDepartments,
  type Department,
} from "../services/departmentService";

function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch departments from API
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getDepartments();

        setDepartments(response.data);
      } catch {
        setError("Failed to load departments. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  // Search filter
  const filteredDepartments = departments.filter((department) =>
    `${department.departmentCode} ${department.departmentName} ${department.description} ${department.status}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(
    filteredDepartments.length / itemsPerPage
  );

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentDepartments = filteredDepartments.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset page when searching
  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  return (
    <div className="departments-page">
      <div className="page-heading">
        <div>
          <h1>Departments</h1>
          <p>Manage and view all departments.</p>
        </div>
      </div>

      <div className="departments-toolbar">
        <div className="departments-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search departments..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="departments-count">
          Total Departments: {filteredDepartments.length}
        </div>
      </div>

      {loading ? (
        <div className="data-message">Loading departments...</div>
      ) : error ? (
        <div className="data-message error-message">{error}</div>
      ) : filteredDepartments.length === 0 ? (
        <div className="data-message">
          <Building2 size={30} />
          <p>No departments found.</p>
        </div>
      ) : (
        <>
          <div className="departments-table-wrapper">
            <table className="departments-table">
              <thead>
                <tr>
                  <th>Department Code</th>
                  <th>Department Name</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {currentDepartments.map((department) => (
                  <tr key={department.id}>
                    <td>{department.departmentCode}</td>
                    <td>{department.departmentName}</td>
                    <td>{department.description}</td>
                    <td>
                      <span
                        className={
                          department.status === "ACTIVE"
                            ? "status-active"
                            : "status-inactive"
                        }
                      >
                        {department.status}
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
              disabled={currentPage === totalPages}
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

export default Departments;
