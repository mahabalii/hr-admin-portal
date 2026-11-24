
import { useEffect, useState, type FormEvent } from "react";
import { useSelector } from "react-redux";
import {
  Search,
  Building2,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import type { RootState } from "../store/store";
import {
  getDepartments,
  type Department,
} from "../services/departmentService";
import {
  getLocalRequestNotice,
  submitAndStoreRequest,
} from "../utils/requestStorage";

import "../App.css";

type Action = "CREATE" | "UPDATE" | "DELETE";
type DepartmentForm = Omit<Department, "id">;

const emptyForm: DepartmentForm = {
  departmentCode: "",
  departmentName: "",
  description: "",
  status: "ACTIVE",
};

const ITEMS_PER_PAGE = 5;

function Departments() {
  const user = useSelector((state: RootState) => state.auth.user);
  const isMaker = user?.role === "MAKER";

  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [action, setAction] = useState<Action>("CREATE");
  const [selectedItem, setSelectedItem] = useState<Department | null>(null);
  const [form, setForm] = useState<DepartmentForm>(emptyForm);

  // Fetch Departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getDepartments();
        setDepartments(response.data || []);
      } catch (err) {
        console.error("Departments API Error:", err);
        setError("Unable to load departments. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  // Search
  const filteredDepartments = departments.filter((item) => {
    const search = searchTerm.toLowerCase();

    return (
      item.departmentCode.toLowerCase().includes(search) ||
      item.departmentName.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search) ||
      item.status.toLowerCase().includes(search)
    );
  });

  // Pagination
  const totalPages = Math.ceil(
    filteredDepartments.length / ITEMS_PER_PAGE
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const currentItems = filteredDepartments.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Generate Department Code
  const generateDepartmentCode = () => {
    const highest = departments.reduce((max, item) => {
      const number = Number(
        item.departmentCode.replace(/^DEPT[-_]?/i, "")
      );

      return Number.isNaN(number) ? max : Math.max(max, number);
    }, 0);

    return `DEPT${String(highest + 1).padStart(3, "0")}`;
  };

  // Add Department
  const handleAdd = () => {
    setAction("CREATE");
    setSelectedItem(null);

    setForm({
      ...emptyForm,
      departmentCode: generateDepartmentCode(),
    });

    setShowForm(true);
  };

  // Edit Department
  const handleEdit = (item: Department) => {
    setAction("UPDATE");
    setSelectedItem(item);

    setForm({
      departmentCode: item.departmentCode,
      departmentName: item.departmentName,
      description: item.description,
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
    field: keyof DepartmentForm,
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

    const duplicate = departments.some(
      (item) =>
        item.departmentCode.toLowerCase() ===
          form.departmentCode.trim().toLowerCase() &&
        item.id !== selectedItem?.id
    );

    if (duplicate) {
      toast.error("This Department Code already exists.");
      return;
    }

    try {
      setFormLoading(true);

      const payload = {
        module: "DEPARTMENTS",
        action,
        requestedBy: user.username,
        ...(action === "UPDATE" && selectedItem
          ? {
              recordId: selectedItem.id,
              oldData: {
                departmentCode: selectedItem.departmentCode,
                departmentName: selectedItem.departmentName,
                description: selectedItem.description,
                status: selectedItem.status,
              },
            }
          : {}),
        newData: {
          ...form,
          departmentCode: form.departmentCode.trim(),
          departmentName: form.departmentName.trim(),
          description: form.description.trim(),
        },
      };

      const result = await submitAndStoreRequest(payload);
      toast.success(
        result.apiSynced
          ? action === "CREATE"
            ? "Department creation request submitted!"
            : "Department update request submitted!"
          : getLocalRequestNotice(result.apiAvailable)
      );

      closeForm();
    } catch (err) {
      console.error("Department request error:", err);
      toast.error("Unable to submit request. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Request
  const handleDelete = async (item: Department) => {
    if (!user) return;

    const confirmed = window.confirm(
      `Submit removal request for ${item.departmentName}?`
    );

    if (!confirmed) return;

    try {
      const payload = {
        module: "DEPARTMENTS",
        action: "DELETE" as const,
        recordId: item.id,
        requestedBy: user.username,
        oldData: {
          departmentCode: item.departmentCode,
          departmentName: item.departmentName,
          description: item.description,
          status: item.status,
        },
      };

      const result = await submitAndStoreRequest(payload);
      toast.success(
        result.apiSynced
          ? "Department removal request submitted!"
          : getLocalRequestNotice(result.apiAvailable)
      );
    } catch (err) {
      console.error("Department deletion error:", err);
      toast.error("Unable to submit removal request.");
    }
  };

  if (!user) return <p>Please login to continue.</p>;

  return (
    <div className="employee-types-page">

      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <h1>Departments</h1>
          <p>View and manage departments</p>
        </div>

        {isMaker && (
          <button
            className="employee-add-btn"
            onClick={handleAdd}
            disabled={loading}
          >
            <Plus size={18} />
            Add Department
          </button>
        )}
      </div>

      {/* Search and Count */}
      <div className="employee-types-toolbar">

        <div className="employee-types-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="employee-types-count">
          <Building2 size={18} />

          <span>
            Total Departments: <strong>{filteredDepartments.length}</strong>
          </span>
        </div>

      </div>

      {/* Loading */}
      {loading && (
        <div className="table-message">
          Loading departments...
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
                <th>Department Code</th>
                <th>Department Name</th>
                <th>Description</th>
                <th>Status</th>
                {isMaker && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {currentItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.departmentCode}</td>
                  <td>{item.departmentName}</td>
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

                  {isMaker && (
                    <td>
                      <div className="employee-actions">
                        <button
                          className="employee-edit-btn"
                          title="Edit Department"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="employee-delete-btn"
                          title="Delete Department"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {filteredDepartments.length === 0 && (
                <tr>
                  <td
                    colSpan={isMaker ? 5 : 4}
                    className="table-message"
                  >
                    No departments found.
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
            Showing {filteredDepartments.length === 0 ? 0 : startIndex + 1}
            {" - "}
            {Math.min(
              startIndex + ITEMS_PER_PAGE,
              filteredDepartments.length
            )}
            {" of "}
            {filteredDepartments.length}
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
                    ? "Add Department"
                    : "Update Department"}
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
                  <label>Department Code</label>
                  <input
                    value={form.departmentCode}
                    readOnly
                  />
                  <small>Automatically generated</small>
                </div>

                <div className="employee-form-field">
                  <label>Department Name</label>
                  <input
                    type="text"
                    required
                    value={form.departmentName}
                    onChange={(e) =>
                      handleChange("departmentName", e.target.value)
                    }
                    placeholder="Enter department name"
                  />
                </div>

                <div className="employee-form-field">
                  <label>Description</label>
                  <input
                    type="text"
                    required
                    value={form.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    placeholder="Enter description"
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

export default Departments;
