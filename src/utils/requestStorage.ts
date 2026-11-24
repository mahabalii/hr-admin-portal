import {
  getRequests,
  submitRequest,
  type MakerRequest,
  type SubmitRequestPayload,
} from "../services/requestService";

const STORAGE_KEY = "hr_maker_checker_requests";

const isMakerRequest = (value: unknown): value is MakerRequest => {
  if (!value || typeof value !== "object") return false;

  const request = value as Partial<MakerRequest>;

  return (
    typeof request.id === "string" &&
    typeof request.module === "string" &&
    (request.action === "CREATE" ||
      request.action === "UPDATE" ||
      request.action === "DELETE") &&
    typeof request.requestedBy === "string" &&
    typeof request.requestedAt === "string" &&
    (request.status === "PENDING" ||
      request.status === "APPROVED" ||
      request.status === "REJECTED")
  );
};

export const getStoredRequests = (): MakerRequest[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed.filter(isMakerRequest) : [];
  } catch (error) {
    console.error("Unable to read requests:", error);
    return [];
  }
};

export const saveStoredRequest = (request: MakerRequest): void => {
  const requests = getStoredRequests();
  const updated = [
    request,
    ...requests.filter((item) => item.id !== request.id),
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

const createLocalRequestId = (existingIds: Set<string>): string => {
  let id: string;

  do {
    const uniquePart =
      typeof globalThis.crypto?.randomUUID === "function"
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    id = `REQ-${uniquePart}`;
  } while (existingIds.has(id));

  return id;
};

export interface SubmitStoredRequestResult {
  request: MakerRequest;
  apiSynced: boolean;
  apiAvailable: boolean;
}

export const getLocalRequestNotice = (apiAvailable: boolean): string =>
  apiAvailable
    ? "Mockoon returned a static response, so this change is saved in this browser only."
    : "API unavailable, so this change is saved in this browser only.";

export const submitAndStoreRequest = async (
  payload: SubmitRequestPayload
): Promise<SubmitStoredRequestResult> => {
  const existingRequests = getStoredRequests();
  const existingIds = new Set(existingRequests.map((item) => item.id));
  let apiData: Partial<MakerRequest> | undefined;
  let apiSynced = true;
  let apiAvailable = true;

  try {
    const response = await submitRequest(payload);
    apiData = response.data;
  } catch (error) {
    // Mockoon or a remote API may be unavailable. Keep the assignment flow
    // usable in this browser, while exposing that it was not server-synced.
    apiSynced = false;
    apiAvailable = false;
    console.warn("Request API unavailable; saving request locally:", error);
  }

  const returnedRequestIsComplete =
    apiData &&
    typeof apiData.id === "string" &&
    typeof apiData.module === "string" &&
    typeof apiData.action === "string" &&
    typeof apiData.requestedBy === "string" &&
    typeof apiData.requestedAt === "string";
  apiSynced = apiSynced && Boolean(returnedRequestIsComplete);
  const apiId =
    returnedRequestIsComplete && apiData ? apiData.id : undefined;
  const id =
    apiId && !existingIds.has(apiId)
      ? apiId
      : createLocalRequestId(existingIds);

  const request: MakerRequest = {
    ...payload,
    ...(apiData || {}),
    id,
    module: payload.module,
    action: payload.action,
    recordId: payload.recordId,
    oldData: payload.oldData,
    newData: payload.newData,
    requestedBy: payload.requestedBy,
    requestedAt:
      typeof apiData?.requestedAt === "string"
        ? apiData.requestedAt
        : new Date().toISOString(),
    status: "PENDING",
  };

  saveStoredRequest(request);
  return { request, apiSynced, apiAvailable };
};

export const loadAllRequests = async (): Promise<MakerRequest[]> => {
  const localRequests = getStoredRequests();

  try {
    const response = await getRequests();
    const apiRequests = Array.isArray(response.data)
      ? response.data.filter(isMakerRequest)
      : [];
    const requestsById = new Map(
      localRequests.map((request) => [request.id, request])
    );

    for (const request of apiRequests) {
      if (!requestsById.has(request.id)) {
        requestsById.set(request.id, request);
      }
    }

    return [...requestsById.values()];
  } catch (error) {
    if (localRequests.length > 0) return localRequests;
    throw error;
  }
};

export const updateStoredRequest = (
  id: string,
  changes: Partial<MakerRequest>,
  fallbackRequest?: MakerRequest
): MakerRequest | null => {
  const requests = getStoredRequests();
  const currentRequest = requests.find((request) => request.id === id);

  if (!currentRequest && !fallbackRequest) return null;

  const updatedRequest: MakerRequest = {
    ...(currentRequest || fallbackRequest!),
    ...changes,
    id,
  };

  saveStoredRequest(updatedRequest);
  return updatedRequest;
};

export const applyApprovedRequestToRecords = <T extends { id: number }>(
  module: string,
  records: T[]
): T[] => {
  const createIdentityKeys: Record<string, string[]> = {
    EMPLOYEES: ["employeeId"],
    EMPLOYEE_TYPES: ["typeCode"],
    DEPARTMENTS: ["departmentCode"],
    DESIGNATIONS: ["designationCode"],
    ATTENDANCE: ["employeeId", "date"],
  };
  const approvedRequests = getStoredRequests()
    .map((request, index) => ({ request, index }))
    .filter(
      ({ request }) =>
        request.module === module && request.status === "APPROVED"
    )
    .sort((a, b) => {
      const timeDifference =
        new Date(a.request.requestedAt).getTime() -
        new Date(b.request.requestedAt).getTime();

      // Stored requests are newest-first, so reverse insertion order for
      // requests created in the same millisecond.
      return timeDifference || b.index - a.index;
    })
    .map(({ request }) => request);

  let updatedRecords = [...records];

  for (const request of approvedRequests) {
    const recordId = Number(request.recordId);

    if (request.action === "CREATE" && request.newData) {
      const identityKeys = createIdentityKeys[module] || [];
      const alreadyPresentByBusinessKey =
        identityKeys.length > 0 &&
        identityKeys.every((key) => {
          const value = request.newData?.[key];
          return value !== undefined && value !== null && value !== "";
        }) &&
        updatedRecords.some((record) =>
          identityKeys.every(
            (key) => {
              const recordValue = Object.entries(record).find(
                ([recordKey]) => recordKey === key
              )?.[1];

              return String(recordValue) === String(request.newData?.[key]);
            }
          )
        );

      const requestedId = Number(request.newData.id);
      const nextId =
        Number.isSafeInteger(requestedId) && requestedId > 0
          ? requestedId
          : Math.max(0, ...updatedRecords.map((item) => item.id)) + 1;

      if (
        !alreadyPresentByBusinessKey &&
        !updatedRecords.some((item) => item.id === nextId)
      ) {
        updatedRecords.push({ ...request.newData, id: nextId } as T);
      }
    }

    if (
      request.action === "UPDATE" &&
      request.newData &&
      Number.isSafeInteger(recordId)
    ) {
      updatedRecords = updatedRecords.map((record) =>
        record.id === recordId
          ? ({ ...record, ...request.newData } as T)
          : record
      );
    }

    if (request.action === "DELETE" && Number.isSafeInteger(recordId)) {
      updatedRecords = updatedRecords.filter(
        (record) => record.id !== recordId
      );
    }
  }

  return updatedRecords;
};
