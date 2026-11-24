
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
} from "lucide-react";
import { toast } from "react-toastify";

import type { RootState } from "../store/store";
import {
  approveRequest,
  rejectRequest,
  type MakerRequest,
} from "../services/requestService";
import {
  getLocalRequestNotice,
  loadAllRequests,
  updateStoredRequest,
} from "../utils/requestStorage";

import "../App.css";

type ConfirmAction = "APPROVE" | "REJECT" | null;

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

  useEffect(() => {
    let ignore = false;

    const fetchRequests = async () => {
      try {
        const allRequests = await loadAllRequests();

        if (!ignore) {
          setRequests(allRequests);
          setError("");
        }
      } catch (error) {
        console.error("Request API Error:", error);

        if (!ignore) {
          setError("Unable to load requests. Please try again.");
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

  const pendingRequests = requests.filter(
    (request) => request.status === "PENDING"
  );

  const handleView = (request: MakerRequest) => {
    setSelectedRequest(request);
    setRemarks("");
    setConfirmAction(null);
  };

  const closeDetails = () => {
    if (processing) return;

    setSelectedRequest(null);
    setRemarks("");
    setConfirmAction(null);
  };

  // Checker approval
  const handleApprove = async () => {
    if (!selectedRequest || !user || !isChecker || processing) return;

    const originalId = selectedRequest.id;

    try {
      setProcessing(true);

      const updatedRequest = updateStoredRequest(originalId, {
        status: "APPROVED",
        remarks: "",
        reviewedAt: new Date().toISOString(),
        reviewedBy: user.username,
      }, selectedRequest);

      if (!updatedRequest) {
        throw new Error("Request could not be saved locally.");
      }

      let apiSynced = true;
      let apiAvailable = true;
      try {
        // The request ID from this record stays canonical even if Mockoon
        // responds with its static REQ001 fixture.
        const response = await approveRequest(originalId);
        apiSynced =
          response.data.id === originalId &&
          response.data.status === "APPROVED";
      } catch (apiError) {
        apiSynced = false;
        apiAvailable = false;
        console.warn("Approval saved locally; API was unavailable:", apiError);
      }

      setRequests((previous) =>
        previous.map((request) =>
          request.id === originalId ? updatedRequest : request
        )
      );

      if (apiSynced) {
        toast.success("Request approved successfully!");
      } else {
        toast.info(getLocalRequestNotice(apiAvailable));
      }

      setSelectedRequest(null);
      setRemarks("");
    } catch (error) {
      console.error("Approve Request Error:", error);
      toast.error("Unable to approve request.");
    } finally {
      setProcessing(false);
    }
  };

  // Checker rejection
  const handleReject = async () => {
    if (!selectedRequest || !user || !isChecker || processing) return;

    if (!remarks.trim()) {
      toast.error("Please enter rejection remarks.");
      return;
    }

    const originalId = selectedRequest.id;
    const rejectionRemarks = remarks.trim();

    try {
      setProcessing(true);

      const updatedRequest = updateStoredRequest(originalId, {
        status: "REJECTED",
        remarks: rejectionRemarks,
        reviewedAt: new Date().toISOString(),
        reviewedBy: user.username,
      }, selectedRequest);

      if (!updatedRequest) {
        throw new Error("Request could not be saved locally.");
      }

      let apiSynced = true;
      let apiAvailable = true;
      try {
        const response = await rejectRequest(originalId, {
          remarks: rejectionRemarks,
        });
        apiSynced =
          response.data.id === originalId &&
          response.data.status === "REJECTED";
      } catch (apiError) {
        apiSynced = false;
        apiAvailable = false;
        console.warn("Rejection saved locally; API was unavailable:", apiError);
      }

      setRequests((previous) =>
        previous.map((request) =>
          request.id === originalId ? updatedRequest : request
        )
      );

      if (apiSynced) {
        toast.success("Request rejected successfully!");
      } else {
        toast.info(getLocalRequestNotice(apiAvailable));
      }

      setSelectedRequest(null);
      setRemarks("");
    } catch (error) {
      console.error("Reject Request Error:", error);
      toast.error("Unable to reject request.");
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || processing) return;

    const action = confirmAction;

    if (action === "REJECT" && !remarks.trim()) {
      setConfirmAction(null);
      toast.error("Please enter rejection remarks.");
      return;
    }

    setConfirmAction(null);

    if (action === "APPROVE") {
      await handleApprove();
    } else {
      await handleReject();
    }
  };

  const formatData = (
    data?: Record<string, unknown> | null
  ) => {
    if (!data || Object.keys(data).length === 0) {
      return "No data available";
    }

    return JSON.stringify(data, null, 2);
  };

  if (!user) {
    return <p>Please login to continue.</p>;
  }

  return (
    <div className="maker-checker-page">
      <div className="maker-checker-header">
        <div>
          <h1>Maker–Checker</h1>
          <p>View and manage all pending requests.</p>
        </div>

        <span className="role-badge">{user.role}</span>
      </div>

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
          <p className="request-message">Loading requests...</p>
        ) : error ? (
          <p className="request-error">{error}</p>
        ) : pendingRequests.length === 0 ? (
          <div className="request-empty-state">
            <GitPullRequest size={38} />
            <h3>No Pending Requests</h3>
            <p>There are no pending requests right now.</p>
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

      <div className="role-information">
        {isChecker ? (
          <>
            <ClipboardList size={17} />
            Review requests and approve or reject them.
          </>
        ) : (
          <>
            <GitPullRequest size={17} />
            You can view all pending requests. Only Checker can
            approve or reject.
          </>
        )}
      </div>

      {selectedRequest && (
        <div className="employee-modal-overlay">
          <div className="employee-modal">
            <div className="employee-modal-header">
              <div>
                <h2>Request Details</h2>
                <p>Request ID: {selectedRequest.id}</p>
              </div>

              <button
                type="button"
                className="employee-modal-close"
                onClick={closeDetails}
                disabled={processing}
              >
                <X size={21} />
              </button>
            </div>

            <div className="request-detail-info">
              <p>
                <strong>Module:</strong> {selectedRequest.module}
              </p>

              <p>
                <strong>Action:</strong> {selectedRequest.action}
              </p>

              <p>
                <strong>Requested By:</strong>{" "}
                {selectedRequest.requestedBy}
              </p>

              <p>
                <strong>Requested At:</strong>{" "}
                {selectedRequest.requestedAt
                  ? new Date(
                      selectedRequest.requestedAt
                    ).toLocaleString()
                  : "-"}
              </p>
            </div>

            <div className="request-data-section">
              <h3>Old Data</h3>
              <pre>{formatData(selectedRequest.oldData)}</pre>
            </div>

            <div className="request-data-section">
              <h3>New Data</h3>
              <pre>{formatData(selectedRequest.newData)}</pre>
            </div>

            {isChecker && (
              <>
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

                <div className="employee-modal-actions">
                  <button
                    type="button"
                    className="employee-cancel-btn"
                    onClick={closeDetails}
                    disabled={processing}
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    className="employee-delete-btn"
                    onClick={() => setConfirmAction("REJECT")}
                    disabled={processing}
                  >
                    <XCircle size={16} />
                    Reject
                  </button>

                  <button
                    type="button"
                    className="employee-submit-btn"
                    onClick={() => setConfirmAction("APPROVE")}
                    disabled={processing}
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>
                </div>
              </>
            )}

            {!isChecker && (
              <div className="employee-modal-actions">
                <button
                  type="button"
                  className="employee-cancel-btn"
                  onClick={closeDetails}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
