import { useEffect, useState, type FormEvent } from "react";
import { useSelector } from "react-redux";
import {
  Search,
  BriefcaseBusiness,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import type { RootState } from "../store/store";
import {
  getDesignations,
  type Designation,
} from "../services/designationService";
import { getDepartments, type Department } from "../services/departmentService";
import { submitAndStoreRequest } from "../utils/requestStorage";

import "../App.css";

type Action = "CREATE" | "UPDATE" | "DELETE";
type DesignationForm = Omit<Designation, "id">;

const emptyForm: DesignationForm = {
  designationCode: "",
  designationName: "",
  department: "",
  status: "ACTIVE",
};

const ITEMS_PER_PAGE = 5;

function Designations() {
  const user = useSelector((state: RootState) => state.auth.user);
  const isMaker = user?.role === "MAKER";

  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [action, setAction] = useState<Action>("CREATE");
  const [selectedItem, setSelectedItem] = useState<Designation | null>(null);
  const [form, setForm] = useState<DesignationForm>(emptyForm);

  // Fetch Designations and Departments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [designationResponse, departmentResponse] = await Promise.all([
          getDesignations(),
          getDepartments(),
        ]);

        setDesignations(designationResponse.data || []);
        setDepartments(departmentResponse.data || []);
      } catch (err) {
        console.error("Designations API Error:", err);
        setError("Unable to load designations. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Search
  const filteredDesignations = designations.filter((item) => {
    const search = searchTerm.toLowerCase();

    return (
      item.designationCode.toLowerCase().includes(search) ||
      item.designationName.toLowerCase().includes(search) ||
      item.department.toLowerCase().includes(search) ||
      item.status.toLowerCase().includes(search)
    );
  });

  // Pagination
  const totalPages = Math.ceil(
    filteredDesignations.length / ITEMS_PER_PAGE
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const currentItems = filteredDesignations.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Generate Designation Code
  const generateDesignationCode = () => {
    const highest = designations.reduce((max, item) => {
      const number = Number(
        item.designationCode.replace(/^DES[-_]?/i, "")
      );

      return Number.isNaN(number) ? max : Math.max(max, number);
    }, 0);

    return `DES${String(highest + 1).padStart(3, "0")}`;
  };

  // Add Designation
  const handleAdd = () => {
    setAction("CREATE");
    setSelectedItem(null);

    setForm({
      ...emptyForm,
      designationCode: generateDesignationCode(),
    });

    setShowForm(true);
  };

  // Edit Designation
  const handleEdit = (item: Designation) => {
    setAction("UPDATE");
    setSelectedItem(item);

    setForm({
      designationCode: item.designationCode,
      designationName: item.designationName,
      department: item.department,
      status: item.status,
    });

    setShowForm(true);
  };

  // Close Modal
  const closeForm = () => {
    setShowForm(false);
    setSelectedItem(null);
    setForm(emptyForm);
    setAction("CREATE");
  };

  // Input Change
  const handleChange = (
    field: keyof DesignationForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // Submit Create / Update Request
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) return;

    const duplicate = designations.some(
      (item) =>
        item.designationCode.toLowerCase() ===
          form.designationCode.trim().toLowerCase() &&
        item.id !== selectedItem?.id
    );

    if (duplicate) {
      toast.error("This Designation Code already exists.");
      return;
    }

    try {
      setFormLoading(true);

      const payload = {
        module: "DESIGNATIONS",
        action,
        requestedBy: user.username,
        ...(action === "UPDATE" && selectedItem
          ? {
              recordId: selectedItem.id,
              oldData: {
                designationCode: selectedItem.designationCode,
                designationName: selectedItem.designationName,
                department: selectedItem.department,
                status: selectedItem.status,
              },
            }
          : {}),
        newData: {
          ...form,
          designationCode: form.designationCode.trim(),
          designationName: form.designationName.trim(),
          department: form.department.trim(),
        },
      };

      await submitAndStoreRequest(payload);

      toast.success(
        action === "CREATE"
          ? "Designation creation request submitted!"
          : "Designation update request submitted!"
      );

      closeForm();
    } catch (err) {
      console.error("Designation request error:", err);
      toast.error("Unable to submit request. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Request
  const handleDelete = async (item: Designation) => {
    if (!user) return;

    const confirmed = window.confirm(
      `Submit removal request for ${item.designationName}?`
    );

    if (!confirmed) return;

    try {
      const payload = {
        module: "DESIGNATIONS",
        action: "DELETE" as const,
        recordId: item.id,
        requestedBy: user.username,
        oldData: {
          designationCode: item.designationCode,
          designationName: item.designationName,
          department: item.department,
          status: item.status,
        },
      };

      await submitAndStoreRequest(payload);
      toast.success("Designation removal request submitted!");
    } catch (err) {
      console.error("Designation deletion error:", err);
      toast.error("Unable to submit removal request.");
    }
  };

  if (!user) return <p>Please login to continue.</p>;

  const activeDepartments = departments.filter(
    (item) => item.status === "ACTIVE"
  );

  return (
    <div className="employee-types-page">

      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <h1>Designations</h1>
          <p>View and manage designations</p>
        </div>

        {isMaker && (
          <button
            className="employee-add-btn"
            onClick={handleAdd}
            disabled={loading}
          >
            <Plus size={18} />
            Add Designation
          </button>
        )}
      </div>

      {/* Search and Count */}
      <div className="employee-types-toolbar">

        <div className="employee-types-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search designations..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="employee-types-count">
          <BriefcaseBusiness size={18} />

          <span>
            Total Designations: <strong>{filteredDesignations.length}</strong>
          </span>
        </div>

      </div>

      {/* Loading */}
      {loading && (
        <div className="table-message">
          Loading designations...
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
                <th>Designation Code</th>
                <th>Designation Name</th>
                <th>Department</th>
                <th>Status</th>
                {isMaker && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {currentItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.designationCode}</td>
                  <td>{item.designationName}</td>
                  <td>{item.department}</td>

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

                  {isMaker && (
                    <td>
                      <div className="employee-actions">
                        <button
                          className="employee-edit-btn"
                          title="Edit Designation"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="employee-delete-btn"
                          title="Delete Designation"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {filteredDesignations.length === 0 && (
                <tr>
                  <td
                    colSpan={isMaker ? 5 : 4}
                    className="table-message"
                  >
                    No designations found.
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
            Showing {filteredDesignations.length === 0 ? 0 : startIndex + 1}
            {" - "}
            {Math.min(
              startIndex + ITEMS_PER_PAGE,
              filteredDesignations.length
            )}
            {" of "}
            {filteredDesignations.length}
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

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="employee-modal-overlay">
          <div className="employee-modal">

            <div className="employee-modal-header">
              <div>
                <h2>
                  {action === "CREATE"
                    ? "Add Designation"
                    : "Update Designation"}
                </h2>

                <p>
                  This request will be sent to Checker for approval.
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
                  <label>Designation Code</label>
                  <input
                    value={form.designationCode}
                    readOnly
                  />
                  <small>Automatically generated</small>
                </div>

                <div className="employee-form-field">
                  <label>Designation Name</label>
                  <input
                    type="text"
                    required
                    value={form.designationName}
                    onChange={(e) =>
                      handleChange("designationName", e.target.value)
                    }
                    placeholder="Enter designation name"
                  />
                </div>

                <div className="employee-form-field">
                  <label>Department</label>
                  <select
                    required
                    value={form.department}
                    onChange={(e) =>
                      handleChange("department", e.target.value)
                    }
                  >
                    <option value="">Select Department</option>

                    {activeDepartments.map((item) => (
                      <option
                        key={item.id}
                        value={item.departmentName}
                      >
                        {item.departmentName}
                      </option>
                    ))}

                    {form.department &&
                      !activeDepartments.some(
                        (item) => item.departmentName === form.department
                      ) && (
                        <option value={form.department}>
                          {form.department}
                        </option>
                      )}
                  </select>
                </div>

                <div className="employee-form-field">
                  <label>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      handleChange("status", e.target.value)
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

export default Designations;