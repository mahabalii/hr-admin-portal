
import { useEffect, useMemo, useState } from "react";
import {
  History,
  Search,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Layers,
  Activity,
} from "lucide-react";

import {
  getRequests,
  type MakerRequest,
} from "../services/requestService";

import "../App.css";

const STORAGE_KEY = "hr_maker_checker_requests";

function getLocalRequests(): MakerRequest[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = saved ? JSON.parse(saved) : [];

    return Array.isArray(parsed) ? (parsed as MakerRequest[]) : [];
  } catch (error) {
    console.error("Unable to read audit history:", error);
    return [];
  }
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function DataComparison({
  oldData,
  newData,
  action,
}: {
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  action: string;
}) {
  const oldValues = oldData ?? {};
  const newValues = newData ?? {};

  const fields = Array.from(
    new Set([...Object.keys(oldValues), ...Object.keys(newValues)])
  );

  if (fields.length === 0) {
    return (
      <div className="audit-no-data">
        No record details available for this request.
      </div>
    );
  }

  return (
    <div className="audit-comparison">
      <div className="audit-comparison-heading">
        <h3>Data Comparison</h3>
        <span>Review requested changes</span>
      </div>

      <div className="audit-comparison-grid">
        <section className="audit-comparison-column old-column">
          <div className="audit-comparison-title">
            <span>Old Data</span>
            <small>BEFORE</small>
          </div>

          {fields.map((field) => (
            <div className="audit-field" key={field}>
              <span>{formatLabel(field)}</span>
              <strong>{formatValue(oldValues[field])}</strong>
            </div>
          ))}
        </section>

        <section className="audit-comparison-column new-column">
          <div className="audit-comparison-title">
            <span>New Data</span>
            <small>AFTER</small>
          </div>

          {fields.map((field) => {
            const changed =
              formatValue(oldValues[field]) !==
              formatValue(newValues[field]);

            return (
              <div
                className={`audit-field ${
                  changed ? "audit-field-changed" : ""
                }`}
                key={field}
              >
                <span>{formatLabel(field)}</span>

                <strong>
                  {formatValue(newValues[field])}

                  {changed && (
                    <span className="audit-changed-label">
                      Changed
                    </span>
                  )}
                </strong>
              </div>
            );
          })}
        </section>
      </div>

      {action === "DELETE" && (
        <p className="audit-action-note">
          <Activity size={15} />
          This request is for deleting the existing record.
        </p>
      )}

      {action === "CREATE" && (
        <p className="audit-action-note">
          <Activity size={15} />
          This request is for creating a new record.
        </p>
      )}
    </div>
  );
}

function Audit() {
  const [requests, setRequests] = useState<MakerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<
    "ALL" | "APPROVED" | "REJECTED"
  >("ALL");

  const [selectedRequest, setSelectedRequest] =
    useState<MakerRequest | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Fetch Audit Requests
  useEffect(() => {
    let cancelled = false;

    const fetchAuditRequests = async () => {
      try {
        const localRequests = getLocalRequests();
        const response = await getRequests();
        const apiRequests = response.data || [];

        const combined = [
          ...localRequests,
          ...apiRequests.filter(
            (apiItem) =>
              !localRequests.some(
                (localItem) =>
                  String(localItem.id) === String(apiItem.id)
              )
          ),
        ];

        if (!cancelled) {
          setRequests(combined);
        }
      } catch (error) {
        console.error("Audit API Error:", error);

        if (!cancelled) {
          setRequests(getLocalRequests());
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchAuditRequests();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setRequests(getLocalRequests());
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      cancelled = true;
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Only Approved and Rejected requests will be displayed
  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();

    return requests
      .filter((request) => {
        const isCompleted =
          request.status === "APPROVED" ||
          request.status === "REJECTED";

        const matchesStatus =
          status === "ALL" || request.status === status;

        const values = [
          request.id,
          request.module,
          request.action,
          request.requestedBy,
          request.remarks,
        ];

        const matchesSearch =
          !term ||
          values.some((value) =>
            String(value ?? "").toLowerCase().includes(term)
          );

        return isCompleted && matchesStatus && matchesSearch;
      })
      .sort(
        (a, b) =>
          new Date(b.requestedAt || 0).getTime() -
          new Date(a.requestedAt || 0).getTime()
      );
  }, [requests, search, status]);

  // Pagination
  const totalRecords = filteredRequests.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalRecords / pageSize)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;

  const endIndex = Math.min(
    startIndex + pageSize,
    totalRecords
  );

  const paginatedRequests = filteredRequests.slice(
    startIndex,
    startIndex + pageSize
  );

  // Approved and Rejected Counts
  const approvedCount = requests.filter(
    (item) => item.status === "APPROVED"
  ).length;

  const rejectedCount = requests.filter(
    (item) => item.status === "REJECTED"
  ).length;

  const getPageNumbers = () =>
    Array.from(
      { length: totalPages },
      (_, index) => index + 1
    );

  // Format Date
  const formatDate = (date?: string) => {
    if (!date) return "-";

    const parsed = new Date(date);

    return Number.isNaN(parsed.getTime())
      ? date
      : parsed.toLocaleString();
  };

  const statusClass = (value: string) =>
    `audit-detail-status audit-detail-${value.toLowerCase()}`;

  return (
    <div className="employee-types-page">

      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <h1>Audit History</h1>
          <p>
            Track all approved and rejected HR requests.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="request-summary">

        <div className="request-summary-card">
          <div className="summary-icon">
            <History size={22} />
          </div>

          <div>
            <h3>Approved</h3>
            <strong>{approvedCount}</strong>
          </div>
        </div>

        <div className="request-summary-card">
          <div className="summary-icon">
            <History size={22} />
          </div>

          <div>
            <h3>Rejected</h3>
            <strong>{rejectedCount}</strong>
          </div>
        </div>

      </div>

      {/* Search and Status Filter */}
      <div className="employee-types-toolbar audit-toolbar">

        <div className="employee-types-search audit-search">
          <Search size={18} />

          <input
            type="text"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search request, module, user..."
          />
        </div>

        <div className="audit-filter-wrapper">
          <select
            className="audit-status-select"
            value={status}
            onChange={(event) => {
              setStatus(
                event.target.value as
                  | "ALL"
                  | "APPROVED"
                  | "REJECTED"
              );

              setCurrentPage(1);
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <span className="employee-types-count">
          {totalRecords} Records
        </span>

      </div>

      {/* Loading, Empty State and Table */}
      {loading ? (
        <p className="request-message">
          Loading audit history...
        </p>
      ) : totalRecords === 0 ? (
        <div className="request-empty-state">
          <History size={38} />
          <h3>No Audit Records Found</h3>
          <p>
            Approved and rejected requests will appear here.
          </p>
        </div>
      ) : (
        <>

          {/* Audit Table */}
          <div className="employee-types-table-wrapper">
            <table className="employee-types-table">

              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Module</th>
                  <th>Action</th>
                  <th>Requested By</th>
                  <th>Requested At</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {paginatedRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.id}</td>

                    <td>{request.module}</td>

                    <td>{request.action}</td>

                    <td>{request.requestedBy || "-"}</td>

                    <td>
                      {formatDate(request.requestedAt)}
                    </td>

                    <td>
                      <span
                        className={`request-status status-${request.status.toLowerCase()}`}
                      >
                        {request.status}
                      </span>
                    </td>

                    <td>{request.remarks || "-"}</td>

                    <td>
                      <button
                        type="button"
                        className="employee-edit-btn"
                        title="View Details"
                        onClick={() =>
                          setSelectedRequest(request)
                        }
                      >
                        <Eye size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>

          {/* Pagination */}
          <div className="audit-pagination">

            <div className="audit-pagination-info">
              <span>Rows per page</span>

              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
                className="audit-page-size"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>

              <span>
                {startIndex + 1}–{endIndex} of {totalRecords}
              </span>
            </div>

            <div className="audit-pagination-buttons">

              <button
                type="button"
                className="audit-page-button"
                disabled={safeCurrentPage === 1}
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.max(1, page - 1)
                  )
                }
              >
                <ChevronLeft size={18} />
              </button>

              {getPageNumbers().map((page) => (
                <button
                  type="button"
                  key={page}
                  className={`audit-page-button ${
                    safeCurrentPage === page ? "active" : ""
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className="audit-page-button"
                disabled={safeCurrentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(totalPages, page + 1)
                  )
                }
              >
                <ChevronRight size={18} />
              </button>

            </div>
          </div>

        </>
      )}

      {/* Audit Details Modal */}
      {selectedRequest && (
        <div
          className="audit-modal-overlay"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="audit-modal"
            onClick={(event) => event.stopPropagation()}
          >

            {/* Modal Header */}
            <div className="audit-modal-header">

              <div className="audit-modal-title">
                <div className="audit-modal-title-icon">
                  <History size={21} />
                </div>

                <div>
                  <h2>Audit Details</h2>
                  <p>
                    Request ID: {selectedRequest.id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="audit-modal-close"
                onClick={() => setSelectedRequest(null)}
                aria-label="Close details"
              >
                <X size={21} />
              </button>

            </div>

            {/* Modal Body */}
            <div className="audit-modal-body">

              <div className="audit-detail-status-row">
                <span className="audit-detail-label">
                  Request Status
                </span>

                <span className={statusClass(selectedRequest.status)}>
                  {selectedRequest.status}
                </span>
              </div>

              <div className="audit-detail-grid">

                <div className="audit-detail-card">
                  <Layers size={18} />

                  <div>
                    <span>Module</span>
                    <strong>{selectedRequest.module}</strong>
                  </div>
                </div>

                <div className="audit-detail-card">
                  <Activity size={18} />

                  <div>
                    <span>Action</span>
                    <strong>{selectedRequest.action}</strong>
                  </div>
                </div>

                <div className="audit-detail-card">
                  <User size={18} />

                  <div>
                    <span>Requested By</span>
                    <strong>
                      {selectedRequest.requestedBy || "-"}
                    </strong>
                  </div>
                </div>

                <div className="audit-detail-card">
                  <Clock size={18} />

                  <div>
                    <span>Requested At</span>
                    <strong>
                      {formatDate(selectedRequest.requestedAt)}
                    </strong>
                  </div>
                </div>

              </div>

              {/* Old and New Data Comparison */}
              <DataComparison
                oldData={selectedRequest.oldData}
                newData={selectedRequest.newData}
                action={selectedRequest.action}
              />

              {/* Checker Remarks */}
              <div className="audit-remarks-panel">
                <strong>Checker Remarks</strong>

                <p>
                  {selectedRequest.remarks ||
                    "No remarks provided."}
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="audit-modal-footer">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Audit;
