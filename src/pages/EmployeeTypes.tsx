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
  getEmployeeTypes,
  type EmployeeType,
} from "../services/employeeTypeService";
import { submitAndStoreRequest } from "../utils/requestStorage";

import "../App.css";

type Action = "CREATE" | "UPDATE" | "DELETE";
type EmployeeTypeForm = Omit<EmployeeType, "id">;

const emptyForm: EmployeeTypeForm = {
  typeCode: "",
  typeName: "",
  description: "",
  status: "ACTIVE",
};

const ITEMS_PER_PAGE = 5;

function EmployeeTypes() {
  const user = useSelector((state: RootState) => state.auth.user);
  const isMaker = user?.role === "MAKER";

  const [employeeTypes, setEmployeeTypes] = useState<EmployeeType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [action, setAction] = useState<Action>("CREATE");
  const [selectedItem, setSelectedItem] = useState<EmployeeType | null>(null);
  const [form, setForm] = useState<EmployeeTypeForm>(emptyForm);

  // Fetch Employee Types from API
  useEffect(() => {
    const fetchEmployeeTypes = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getEmployeeTypes();
        setEmployeeTypes(response.data || []);
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

  // Pagination
  const totalPages = Math.ceil(filteredTypes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const currentItems = filteredTypes.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Generate Type Code
  const generateTypeCode = () => {
    const highest = employeeTypes.reduce((max, item) => {
      const number = Number(item.typeCode.replace(/^ET[-_]?/i, ""));
      return Number.isNaN(number) ? max : Math.max(max, number);
    }, 0);

    return `ET${String(highest + 1).padStart(3, "0")}`;
  };

  // Add Employee Type
  const handleAdd = () => {
    setAction("CREATE");
    setSelectedItem(null);
    setForm({
      ...emptyForm,
      typeCode: generateTypeCode(),
    });
    setShowForm(true);
  };

  // Edit Employee Type
  const handleEdit = (item: EmployeeType) => {
    setAction("UPDATE");
    setSelectedItem(item);

    setForm({
      typeCode: item.typeCode,
      typeName: item.typeName,
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

  // Handle Input Change
  const handleChange = (
    field: keyof EmployeeTypeForm,
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

    const duplicate = employeeTypes.some(
      (item) =>
        item.typeCode.toLowerCase() === form.typeCode.trim().toLowerCase() &&
        item.id !== selectedItem?.id
    );

    if (duplicate) {
      toast.error("This Employee Type Code already exists.");
      return;
    }

    try {
      setFormLoading(true);

      const payload = {
        module: "EMPLOYEE_TYPES",
        action,
        requestedBy: user.username,
        ...(action === "UPDATE" && selectedItem
          ? {
              recordId: selectedItem.id,
              oldData: {
                typeCode: selectedItem.typeCode,
                typeName: selectedItem.typeName,
                description: selectedItem.description,
                status: selectedItem.status,
              },
            }
          : {}),
        newData: {
          ...form,
          typeCode: form.typeCode.trim(),
          typeName: form.typeName.trim(),
          description: form.description.trim(),
        },
      };

      await submitAndStoreRequest(payload);

      toast.success(
        action === "CREATE"
          ? "Employee Type creation request submitted!"
          : "Employee Type update request submitted!"
      );

      closeForm();
    } catch (err) {
      console.error("Employee Type request error:", err);
      toast.error("Unable to submit request. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  // Submit Delete Request
  const handleDelete = async (item: EmployeeType) => {
    if (!user) return;

    const confirmed = window.confirm(
      `Submit removal request for ${item.typeName}?`
    );

    if (!confirmed) return;

    try {
      const payload = {
        module: "EMPLOYEE_TYPES",
        action: "DELETE" as const,
        recordId: item.id,
        requestedBy: user.username,
        oldData: {
          typeCode: item.typeCode,
          typeName: item.typeName,
          description: item.description,
          status: item.status,
        },
      };

      await submitAndStoreRequest(payload);
      toast.success("Employee Type removal request submitted!");
    } catch (err) {
      console.error("Employee Type deletion error:", err);
      toast.error("Unable to submit removal request.");
    }
  };

  if (!user) return <p>Please login to continue.</p>;

  return (
    <div className="employee-types-page">

      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <h1>Employee Types</h1>
          <p>View and manage employee types</p>
        </div>

        {isMaker && (
          <button
            className="employee-add-btn"
            onClick={handleAdd}
            disabled={loading}
          >
            <Plus size={18} />
            Add Employee Type
          </button>
        )}
      </div>

      {/* Search and Count */}
      <div className="employee-types-toolbar">

        <div className="employee-types-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search employee types..."
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
                {isMaker && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {currentItems.map((item) => (
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

                  {isMaker && (
                    <td>
                      <div className="employee-actions">
                        <button
                          className="employee-edit-btn"
                          title="Edit Employee Type"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="employee-delete-btn"
                          title="Delete Employee Type"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}

                </tr>
              ))}

              {filteredTypes.length === 0 && (
                <tr>
                  <td colSpan={isMaker ? 5 : 4} className="table-message">
                    No employee types found.
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
            Showing {filteredTypes.length === 0 ? 0 : startIndex + 1}
            {" - "}
            {Math.min(startIndex + ITEMS_PER_PAGE, filteredTypes.length)}
            {" of "}
            {filteredTypes.length}
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
              disabled={currentPage >= totalPages || totalPages === 0}
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
                    ? "Add Employee Type"
                    : "Update Employee Type"}
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
                  <label>Type Code</label>
                  <input
                    value={form.typeCode}
                    readOnly
                  />
                  <small>Automatically generated</small>
                </div>

                <div className="employee-form-field">
                  <label>Type Name</label>
                  <input
                    type="text"
                    required
                    value={form.typeName}
                    onChange={(e) =>
                      handleChange("typeName", e.target.value)
                    }
                    placeholder="Enter type name"
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
                      handleChange(
                        "status",
                        e.target.value
                      )
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

export default EmployeeTypes;