import { v4 as uuidv4 } from "uuid";
import {
  INDEXED_DB_AGREEMENT_STORE,
  INDEXED_DB_CUSTOMER_STORE,
  INDEXED_DB_NAME,
  INDEXED_DB_VEHICLE_STORE,
  INDEXED_DB_VERSION,
} from "@/config/constants";
import { FinalizationSchema } from "@/schemas/finalization";
import { agreementMatchesQuery, customerMatchesQuery, vehicleMatchesQuery } from "@/utils/search";

let dbPromise: Promise<IDBDatabase> | null = null;

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });

const transactionDone = (transaction: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });

const openDatabase = (): Promise<IDBDatabase> => {
  if (dbPromise) {
    return dbPromise;
  }

  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available in this execution environment"));
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(INDEXED_DB_NAME, INDEXED_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(INDEXED_DB_AGREEMENT_STORE)) {
        db.createObjectStore(INDEXED_DB_AGREEMENT_STORE, { keyPath: "uuid" });
      }

      if (!db.objectStoreNames.contains(INDEXED_DB_VEHICLE_STORE)) {
        db.createObjectStore(INDEXED_DB_VEHICLE_STORE, { keyPath: "uuid" });
      }

      if (!db.objectStoreNames.contains(INDEXED_DB_CUSTOMER_STORE)) {
        db.createObjectStore(INDEXED_DB_CUSTOMER_STORE, { keyPath: "uuid" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
  });

  return dbPromise;
};

const createAgreement = async (input: AgreementData): Promise<AgreementRecord> => {
  const db = await openDatabase();
  const transaction = db.transaction(INDEXED_DB_AGREEMENT_STORE, "readwrite");
  const store = transaction.objectStore(INDEXED_DB_AGREEMENT_STORE);

  const identifier = uuidv4();
  const existing = await requestToPromise(store.get(identifier));
  if (existing) {
    throw new Error(`Agreement with identifier '${identifier}' already exists`);
  }

  const now = new Date().toISOString();
  const record: AgreementRecord = {
    uuid: identifier,
    agreement: input,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  await requestToPromise(store.put(record));
  await transactionDone(transaction);

  return record;
};

const updateAgreement = async (uuid: string, input: AgreementData): Promise<AgreementRecord> => {
  const db = await openDatabase();
  const transaction = db.transaction(INDEXED_DB_AGREEMENT_STORE, "readwrite");
  const store = transaction.objectStore(INDEXED_DB_AGREEMENT_STORE);

  const existing = await requestToPromise<AgreementRecord | undefined>(store.get(uuid));
  if (!existing) {
    throw new Error(`Agreement with identifier '${uuid}' was not found`);
  }

  if (existing.status !== "active") {
    throw new Error(`Agreement with identifier '${uuid}' cannot be modified`);
  }

  const record: AgreementRecord = {
    ...existing,
    agreement: input,
    updatedAt: new Date().toISOString(),
  };

  await requestToPromise(store.put(record));
  await transactionDone(transaction);

  return record;
};

const upsertVehicle = async (
  uuid: string | undefined,
  input: VehicleData
): Promise<VehicleRecord> => {
  const db = await openDatabase();
  const transaction = db.transaction(INDEXED_DB_VEHICLE_STORE, "readwrite");
  const store = transaction.objectStore(INDEXED_DB_VEHICLE_STORE);

  const normalizedUuid = uuid ?? uuidv4();
  const now = new Date().toISOString();
  let existing: VehicleRecord | undefined;
  if (uuid) {
    existing = await requestToPromise<VehicleRecord | undefined>(store.get(normalizedUuid));
  }

  const record: VehicleRecord = existing
    ? { ...existing, vehicle: input, updatedAt: now }
    : { uuid: normalizedUuid, status: "active", vehicle: input, createdAt: now, updatedAt: now };

  await requestToPromise(store.put(record));
  await transactionDone(transaction);

  return record;
};

const getCustomer = async (uuid: string): Promise<CustomerRecord | undefined> => {
  const db = await openDatabase();
  const transaction = db.transaction(INDEXED_DB_CUSTOMER_STORE, "readonly");
  const store = transaction.objectStore(INDEXED_DB_CUSTOMER_STORE);

  const result = await requestToPromise<CustomerRecord | undefined>(store.get(uuid));
  await transactionDone(transaction);

  return result;
};

const getAllCustomers = async (): Promise<CustomerRecord[]> => {
  const db = await openDatabase();
  const transaction = db.transaction(INDEXED_DB_CUSTOMER_STORE, "readonly");
  const store = transaction.objectStore(INDEXED_DB_CUSTOMER_STORE);

  const result = await requestToPromise<CustomerRecord[]>(store.getAll());
  await transactionDone(transaction);

  return result;
};

const upsertCustomer = async (
  uuid: string | undefined,
  input: RenteeData
): Promise<CustomerRecord> => {
  const db = await openDatabase();
  const transaction = db.transaction(INDEXED_DB_CUSTOMER_STORE, "readwrite");
  const store = transaction.objectStore(INDEXED_DB_CUSTOMER_STORE);

  const normalizedUuid = uuid ?? uuidv4();
  const now = new Date().toISOString();
  let existing: CustomerRecord | undefined;
  if (uuid) {
    existing = await requestToPromise<CustomerRecord | undefined>(store.get(normalizedUuid));
  }

  const record: CustomerRecord = existing
    ? { ...existing, customer: input, updatedAt: now }
    : { uuid: normalizedUuid, status: "active", customer: input, createdAt: now, updatedAt: now };

  await requestToPromise(store.put(record));
  await transactionDone(transaction);

  return record;
};

const searchCustomers = async (query: string): Promise<CustomerRecord[]> => {
  const customers = await getAllCustomers();
  return customers
    .filter((record) => customerMatchesQuery(record, query))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

const getAgreement = async (uuid: string): Promise<AgreementRecord | undefined> => {
  const db = await openDatabase();
  const transaction = db.transaction(INDEXED_DB_AGREEMENT_STORE, "readonly");
  const store = transaction.objectStore(INDEXED_DB_AGREEMENT_STORE);

  const result = await requestToPromise<AgreementRecord | undefined>(store.get(uuid));
  await transactionDone(transaction);

  return result;
};

const getAllAgreements = async (): Promise<AgreementRecord[]> => {
  const db = await openDatabase();
  const transaction = db.transaction(INDEXED_DB_AGREEMENT_STORE, "readonly");
  const store = transaction.objectStore(INDEXED_DB_AGREEMENT_STORE);

  const result = await requestToPromise<AgreementRecord[]>(store.getAll());
  await transactionDone(transaction);

  return result;
};

const searchAgreements = async (
  query: string,
  status: AgreementStatus | "all"
): Promise<AgreementRecord[]> => {
  const agreements = await getAllAgreements();

  return agreements
    .filter((record) => (status === "all" ? true : record.status === status))
    .filter((record) => agreementMatchesQuery(record, query))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

const searchVehicles = async (query: string): Promise<VehicleRecord[]> => {
  const vehicles = await getAllVehicles();

  return vehicles.filter((record) => vehicleMatchesQuery(record, query));
};

const setVehicleStatus = async (uuid: string, status: BaseStatus): Promise<VehicleRecord> => {
  const db = await openDatabase();
  const transaction = db.transaction(INDEXED_DB_VEHICLE_STORE, "readwrite");
  const store = transaction.objectStore(INDEXED_DB_VEHICLE_STORE);

  const existing = await requestToPromise<VehicleRecord | undefined>(store.get(uuid));
  if (!existing) {
    throw new Error(`Vehicle with identifier '${uuid}' was not found`);
  }

  const record: VehicleRecord = {
    ...existing,
    status,
    updatedAt: new Date().toISOString(),
  };

  await requestToPromise(store.put(record));
  await transactionDone(transaction);

  return record;
};

const getVehicle = async (uuid: string): Promise<VehicleRecord | undefined> => {
  const db = await openDatabase();
  const transaction = db.transaction(INDEXED_DB_VEHICLE_STORE, "readonly");
  const store = transaction.objectStore(INDEXED_DB_VEHICLE_STORE);

  const result = await requestToPromise<VehicleRecord | undefined>(store.get(uuid));
  await transactionDone(transaction);

  return result;
};

const getAllVehicles = async (): Promise<VehicleRecord[]> => {
  const db = await openDatabase();
  const transaction = db.transaction(INDEXED_DB_VEHICLE_STORE, "readonly");
  const store = transaction.objectStore(INDEXED_DB_VEHICLE_STORE);

  const result = await requestToPromise<VehicleRecord[]>(store.getAll());
  await transactionDone(transaction);

  return result;
};

const finalizeAgreement = async (
  uuid: string,
  finalizationDetails: FinalizationSchema
): Promise<AgreementRecord> => {
  const db = await openDatabase();
  const transaction = db.transaction(INDEXED_DB_AGREEMENT_STORE, "readwrite");
  const store = transaction.objectStore(INDEXED_DB_AGREEMENT_STORE);

  const existing = await requestToPromise<AgreementRecord | undefined>(store.get(uuid));
  if (!existing) {
    throw new Error(`Agreement with identifier '${uuid}' was not found`);
  }

  if (existing.status !== "active") {
    throw new Error(`Agreement with identifier '${uuid}' cannot be finalized`);
  }

  const record: AgreementRecord = {
    ...existing,
    status: "archived",
    finalization: finalizationDetails,
    updatedAt: new Date().toISOString(),
  };

  await requestToPromise(store.put(record));
  await transactionDone(transaction);

  return record;
};

const cancelAgreement = async (uuid: string): Promise<AgreementRecord> => {
  const db = await openDatabase();
  const transaction = db.transaction(INDEXED_DB_AGREEMENT_STORE, "readwrite");
  const store = transaction.objectStore(INDEXED_DB_AGREEMENT_STORE);

  const existing = await requestToPromise<AgreementRecord | undefined>(store.get(uuid));
  if (!existing) {
    throw new Error(`Agreement with identifier '${uuid}' was not found`);
  }

  if (existing.status !== "active") {
    throw new Error(`Agreement with identifier '${uuid}' cannot be canceled`);
  }

  const record: AgreementRecord = {
    ...existing,
    status: "canceled",
    updatedAt: new Date().toISOString(),
  };

  await requestToPromise(store.put(record));
  await transactionDone(transaction);

  return record;
};

export class IndexedDbDatabaseApi implements DatabaseApi {
  createAgreement(input: AgreementData): Promise<AgreementRecord> {
    return createAgreement(input);
  }

  updateAgreement(uuid: string, input: AgreementData): Promise<AgreementRecord> {
    return updateAgreement(uuid, input);
  }

  getAgreement(uuid: string): Promise<AgreementRecord | undefined> {
    return getAgreement(uuid);
  }

  getAllAgreements(): Promise<AgreementRecord[]> {
    return getAllAgreements();
  }

  searchAgreements(query: string, status: AgreementStatus | "all"): Promise<AgreementRecord[]> {
    return searchAgreements(query, status);
  }

  finalizeAgreement(
    uuid: string,
    finalizationDetails: FinalizationSchema
  ): Promise<AgreementRecord> {
    return finalizeAgreement(uuid, finalizationDetails);
  }

  cancelAgreement(uuid: string): Promise<AgreementRecord> {
    return cancelAgreement(uuid);
  }

  upsertVehicle(uuid: string | undefined, input: VehicleData): Promise<VehicleRecord> {
    return upsertVehicle(uuid, input);
  }

  getVehicle(uuid: string): Promise<VehicleRecord | undefined> {
    return getVehicle(uuid);
  }

  getAllVehicles(): Promise<VehicleRecord[]> {
    return getAllVehicles();
  }

  searchVehicles(query: string): Promise<VehicleRecord[]> {
    return searchVehicles(query);
  }

  setVehicleStatus(uuid: string, status: BaseStatus): Promise<VehicleRecord> {
    return setVehicleStatus(uuid, status);
  }

  upsertCustomer(uuid: string | undefined, input: RenteeData): Promise<CustomerRecord> {
    return upsertCustomer(uuid, input);
  }

  getCustomer(uuid: string): Promise<CustomerRecord | undefined> {
    return getCustomer(uuid);
  }

  getAllCustomers(): Promise<CustomerRecord[]> {
    return getAllCustomers();
  }

  searchCustomers(query: string): Promise<CustomerRecord[]> {
    return searchCustomers(query);
  }
}

export const createIndexedDbDatabaseApi = (): DatabaseApi => {
  return new IndexedDbDatabaseApi();
};
