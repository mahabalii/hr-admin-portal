
import { useEffect, useState } from "react";
import { Search, BriefcaseBusiness } from "lucide-react";

import {
  getDesignations,
  type Designation,
} from "../services/designationService";

function Designations() {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch designations from API
  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getDesignations();

        setDesignations(response.data);
      } catch {
        setError("Failed to load designations. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDesignations();
  }, []);

  // Search filter
  const filteredDesignations = designations.filter((designation) =>
    `${designation.designationCode} ${designation.designationName} ${designation.department} ${designation.status}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(
    filteredDesignations.length / itemsPerPage
  );

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentDesignations = filteredDesignations.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset page when searching
  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  return (
    <div className="designations-page">
      <div className="page-heading">
        <div>
          <h1>Designations</h1>
          <p>Manage and view all designations.</p>
        </div>
      </div>

      <div className="designations-toolbar">
        <div className="designations-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search designations..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="designations-count">
          Total Designations: {filteredDesignations.length}
        </div>
      </div>

      {loading ? (
        <div className="data-message">Loading designations...</div>
      ) : error ? (
        <div className="data-message error-message">{error}</div>
      ) : filteredDesignations.length === 0 ? (
        <div className="data-message">
          <BriefcaseBusiness size={30} />
          <p>No designations found.</p>
        </div>
      ) : (
        <>
          <div className="designations-table-wrapper">
            <table className="designations-table">
              <thead>
                <tr>
                  <th>Designation Code</th>
                  <th>Designation Name</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {currentDesignations.map((designation) => (
                  <tr key={designation.id}>
                    <td>{designation.designationCode}</td>
                    <td>{designation.designationName}</td>
                    <td>{designation.department}</td>
                    <td>
                      <span
                        className={
                          designation.status === "ACTIVE"
                            ? "status-active"
                            : "status-inactive"
                        }
                      >
                        {designation.status}
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

export default Designations;
