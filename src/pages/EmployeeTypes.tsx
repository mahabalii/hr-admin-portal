
import { useEffect, useState } from "react";
import { Search, BriefcaseBusiness } from "lucide-react";

import {
  getEmployeeTypes,
  type EmployeeType,
} from "../services/employeeTypeService";

import "../App.css";

function EmployeeTypes() {
  const [employeeTypes, setEmployeeTypes] = useState<EmployeeType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch Employee Types from API
  useEffect(() => {
    const fetchEmployeeTypes = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getEmployeeTypes();
        setEmployeeTypes(response.data);
      } catch (err) {
        console.error("Employee Types API Error:", err);
        setError("Unable to load employee types. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeTypes();
  }, []);

  // Search functionality
  const filteredTypes = employeeTypes.filter((item) => {
    const search = searchTerm.toLowerCase();

    return (
      item.typeCode.toLowerCase().includes(search) ||
      item.typeName.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search) ||
      item.status.toLowerCase().includes(search)
    );
  });

  return (
    <div className="employee-types-page">

      {/* Page Heading */}
      <div className="page-heading">
        <h1>Employee Types</h1>
        <p>View and manage employee types</p>
      </div>

      {/* Search and Count */}
      <div className="employee-types-toolbar">

        <div className="employee-types-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search employee types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="employee-types-count">
          <BriefcaseBusiness size={18} />
          <span>
            Total Types: <strong>{filteredTypes.length}</strong>
          </span>
        </div>

      </div>

      {/* Loading */}
      {loading && (
        <div className="table-message">
          Loading employee types...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="table-error">
          {error}
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="employee-types-table-wrapper">

          <table className="employee-types-table">

            <thead>
              <tr>
                <th>Type Code</th>
                <th>Type Name</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredTypes.map((item) => (
                <tr key={item.id}>

                  <td>{item.typeCode}</td>

                  <td>{item.typeName}</td>

                  <td>{item.description}</td>

                  <td>
                    <span
                      className={
                        item.status === "ACTIVE"
                          ? "status-active"
                          : "status-inactive"
                      }
                    >
                      {item.status}
                    </span>
                  </td>

                </tr>
              ))}

              {filteredTypes.length === 0 && (
                <tr>
                  <td colSpan={4} className="table-message">
                    No employee types found.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}

export default EmployeeTypes;
