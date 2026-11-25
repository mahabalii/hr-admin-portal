
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  GitPullRequest,
  ClipboardList,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  X,
  History,
  User,
  Layers,
  Activity,
} from "lucide-react";
import { toast } from "react-toastify";

import type { RootState } from "../store/store";
import {
  getRequests,
  approveRequest,
  rejectRequest,
  type MakerRequest,
} from "../services/requestService";

import "../App.css";

const STORAGE_KEY = "hr_maker_checker_requests";

type ConfirmAction = "APPROVE" | "REJECT" | null;

// Get local requests
const getLocalRequests = (): MakerRequest[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = saved ? JSON.parse(saved) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Local request error:", err);
    return [];
  }
};

// Update local storage after review
const updateLocalRequest = (updatedRequest: MakerRequest) => {
  const localRequests = getLocalRequests();

  const updatedRequests = localRequests.map((request) =>
    request.id === updatedRequest.id ? updatedRequest : request
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedRequests)
  );
};

// Format field labels
function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// Format field values
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

// Compare Old Data and New Data
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

function MakerChecker() {
  const user = useSelector(
    (state: RootState) => state.auth.user
  );

  const [requests, setRequests] = useState<MakerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedRequest, setSelectedRequest] =
    useState<MakerRequest | null>(null);

  const [remarks, setRemarks] = useState("");
  const [processing, setProcessing] = useState(false);

  const [confirmAction, setConfirmAction] =
    useState<ConfirmAction>(null);

  const isChecker = user?.role === "CHECKER";

  // Fetch all requests
  useEffect(() => {
    let ignore = false;

    const fetchRequests = async () => {
      try {
        const response = await getRequests();

        const localRequests = getLocalRequests();
        const apiRequests = response.data || [];

        const combinedRequests = [
          ...localRequests,
          ...apiRequests.filter(
            (apiRequest) =>
              !localRequests.some(
                (localRequest) =>
                  localRequest.id === apiRequest.id
              )
          ),
        ];

        if (!ignore) {
          setRequests(combinedRequests);
          setError("");
        }
      } catch (err) {
        console.error("Request API Error:", err);

        const localRequests = getLocalRequests();

        if (!ignore) {
          setRequests(localRequests);

          if (localRequests.length === 0) {
            setError(
              "Unable to load requests. Please try again."
            );
          }
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void fetchRequests();

    return () => {
      ignore = true;
    };
  }, []);

  // Only pending requests are displayed
  const pendingRequests = requests.filter(
    (request) => request.status === "PENDING"
  );

  // Open request details
  const handleView = (request: MakerRequest) => {
    setSelectedRequest(request);
    setRemarks("");
    setConfirmAction(null);
  };

  // Close details modal
  const closeDetails = () => {
    if (processing) return;

    setSelectedRequest(null);
    setRemarks("");
    setConfirmAction(null);
  };

  // Approve request
  const handleApprove = async () => {
    if (!selectedRequest || !isChecker || processing) return;

    try {
      setProcessing(true);

      const response = await approveRequest(selectedRequest.id);

      const updatedRequest: MakerRequest = {
        ...selectedRequest,
        ...(response.data || {}),
        status: "APPROVED",
      };

      updateLocalRequest(updatedRequest);

      setRequests((previous) =>
        previous.map((request) =>
          request.id === selectedRequest.id
            ? updatedRequest
            : request
        )
      );

      toast.success("Request approved successfully!");

      setSelectedRequest(null);
      setRemarks("");
    } catch (err) {
      console.error("Approve Request Error:", err);
      toast.error("Unable to approve request.");
    } finally {
      setProcessing(false);
    }
  };

  // Reject request
  const handleReject = async () => {
    if (!selectedRequest || !isChecker || processing) return;

    if (!remarks.trim()) {
      toast.error("Please enter rejection remarks.");
      return;
    }

    try {
      setProcessing(true);

      const response = await rejectRequest(selectedRequest.id, {
        remarks: remarks.trim(),
      });

      const updatedRequest: MakerRequest = {
        ...selectedRequest,
        ...(response.data || {}),
        status: "REJECTED",
        remarks: remarks.trim(),
      };

      updateLocalRequest(updatedRequest);

      setRequests((previous) =>
        previous.map((request) =>
          request.id === selectedRequest.id
            ? updatedRequest
            : request
        )
      );

      toast.success("Request rejected successfully!");

      setSelectedRequest(null);
      setRemarks("");
    } catch (err) {
      console.error("Reject Request Error:", err);
      toast.error("Unable to reject request.");
    } finally {
      setProcessing(false);
    }
  };

  // Confirm selected action
  const handleConfirmAction = async () => {
    if (!confirmAction || processing) return;

    const action = confirmAction;

    setConfirmAction(null);

    if (action === "APPROVE") {
      await handleApprove();
    } else {
      await handleReject();
    }
  };

  if (!user) {
    return <p>Please login to continue.</p>;
  }

  return (
    <div className="maker-checker-page">

      {/* Page Header */}
      <div className="maker-checker-header">
        <div>
          <h1>Maker–Checker</h1>
          <p>View and manage all pending requests.</p>
        </div>

        <span className="role-badge">{user.role}</span>
      </div>

      {/* Pending Count */}
      <div className="request-summary">
        <div className="request-summary-card">
          <div className="summary-icon pending-icon">
            <Clock size={22} />
          </div>

          <div>
            <h3>Pending Requests</h3>
            <p>Waiting for review</p>
            <strong>{pendingRequests.length}</strong>
          </div>
        </div>
      </div>

      {/* Requests Section */}
      <section className="request-section">
        <div className="request-section-heading">
          <ClipboardList size={22} />

          <div>
            <h2>All Pending Requests</h2>
            <p>
              Requests submitted by all users are displayed here.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="request-message">
            Loading requests...
          </p>
        ) : error ? (
          <p className="request-error">
            {error}
          </p>
        ) : pendingRequests.length === 0 ? (
          <div className="request-empty-state">
            <GitPullRequest size={38} />
            <h3>No Pending Requests</h3>
            <p>
              There are no pending requests right now.
            </p>
          </div>
        ) : (
          <div className="request-table-wrapper">
            <table className="request-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Module</th>
                  <th>Action</th>
                  <th>Requested By</th>
                  <th>Requested At</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {pendingRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.id}</td>
                    <td>{request.module}</td>
                    <td>{request.action}</td>
                    <td>{request.requestedBy}</td>

                    <td>
                      {request.requestedAt
                        ? new Date(
                            request.requestedAt
                          ).toLocaleString()
                        : "-"}
                    </td>

                    <td>
                      <span className="request-status status-pending">
                        PENDING
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="employee-edit-btn"
                        title="View Request"
                        onClick={() => handleView(request)}
                      >
                        <Eye size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Role Information */}
      <div className="role-information">
        {isChecker ? (
          <>
            <ClipboardList size={17} />
            Review requests and approve or reject them.
          </>
        ) : (
          <>
            <GitPullRequest size={17} />
            You can view all pending requests. Only Checker can approve or reject.
          </>
        )}
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div
          className="audit-modal-overlay"
          onClick={closeDetails}
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
                  <h2>Request Details</h2>
                  <p>Request ID: {selectedRequest.id}</p>
                </div>
              </div>

              <button
                type="button"
                className="audit-modal-close"
                onClick={closeDetails}
                disabled={processing}
                aria-label="Close details"
              >
                <X size={21} />
              </button>
            </div>

            <div className="audit-modal-body">

              {/* Request Status */}
              <div className="audit-detail-status-row">
                <span className="audit-detail-label">
                  Request Status
                </span>

                <span className="audit-detail-status audit-detail-pending">
                  {selectedRequest.status}
                </span>
              </div>

              {/* Request Information */}
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
                    <strong>{selectedRequest.requestedBy || "-"}</strong>
                  </div>
                </div>

                <div className="audit-detail-card">
                  <Clock size={18} />
                  <div>
                    <span>Requested At</span>
                    <strong>
                      {selectedRequest.requestedAt
                        ? new Date(
                            selectedRequest.requestedAt
                          ).toLocaleString()
                        : "-"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Old Data and New Data */}
              <DataComparison
                oldData={selectedRequest.oldData}
                newData={selectedRequest.newData}
                action={selectedRequest.action}
              />

              {/* Checker Remarks */}
              {isChecker && (
                <div className="employee-form-field">
                  <label>Rejection Remarks</label>

                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(event) =>
                      setRemarks(event.target.value)
                    }
                    placeholder="Enter reason if rejecting this request..."
                    disabled={processing}
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="audit-modal-footer">
              <button
                type="button"
                className="employee-cancel-btn"
                onClick={closeDetails}
                disabled={processing}
              >
                Close
              </button>

              {isChecker && (
                <>
                  <button
                    type="button"
                    className="employee-delete-btn"
                    onClick={() => setConfirmAction("REJECT")}
                    disabled={processing}
                  >
                    <XCircle size={16} />
                    {processing ? "Processing..." : "Reject"}
                  </button>

                  <button
                    type="button"
                    className="employee-submit-btn"
                    onClick={() => setConfirmAction("APPROVE")}
                    disabled={processing}
                  >
                    <CheckCircle size={16} />
                    {processing ? "Processing..." : "Approve"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Simple Confirmation Modal */}
      {confirmAction && selectedRequest && (
        <div className="employee-modal-overlay">
          <div className="confirm-modal">
            <h3>
              Confirm{" "}
              {confirmAction === "APPROVE"
                ? "Approval"
                : "Rejection"}
            </h3>

            <p>
              Are you sure you want to{" "}
              {confirmAction === "APPROVE"
                ? "approve"
                : "reject"}{" "}
              this request?
            </p>

            <div className="employee-modal-actions">
              <button
                type="button"
                className="employee-cancel-btn"
                onClick={() => setConfirmAction(null)}
                disabled={processing}
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  confirmAction === "APPROVE"
                    ? "employee-submit-btn"
                    : "employee-delete-btn"
                }
                onClick={() => {
                  void handleConfirmAction();
                }}
                disabled={processing}
              >
                Confirm{" "}
                {confirmAction === "APPROVE"
                  ? "Approve"
                  : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MakerChecker;
