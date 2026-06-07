import { v4 as uuidv4 } from "uuid";
import {
  INDEXED_DB_AGREEMENT_STORE,
  INDEXED_DB_NAME,
  INDEXED_DB_VEHICLE_STORE,
  INDEXED_DB_VERSION,
} from "@/config/constants";

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

  const record: AgreementRecord = {
    ...existing,
    agreement: input,
    updatedAt: new Date().toISOString(),
  };

  await requestToPromise(store.put(record));
  await transactionDone(transaction);

  return record;
};

const createVehicle = async (input: VehicleData): Promise<VehicleRecord> => {
  const db = await openDatabase();
  const transaction = db.transaction(INDEXED_DB_VEHICLE_STORE, "readwrite");
  const store = transaction.objectStore(INDEXED_DB_VEHICLE_STORE);

  const identifier = uuidv4();
  const existing = await requestToPromise(store.get(identifier));
  if (existing) {
    throw new Error(`Vehicle with identifier '${identifier}' already exists`);
  }

  const now = new Date().toISOString();
  const record: VehicleRecord = {
    uuid: identifier,
    vehicle: input,
    createdAt: now,
    updatedAt: now,
  };

  await requestToPromise(store.put(record));
  await transactionDone(transaction);

  return record;
};

const updateVehicle = async (uuid: string, input: VehicleData): Promise<VehicleRecord> => {
  const db = await openDatabase();
  const transaction = db.transaction(INDEXED_DB_VEHICLE_STORE, "readwrite");
  const store = transaction.objectStore(INDEXED_DB_VEHICLE_STORE);

  const existing = await requestToPromise<VehicleRecord | undefined>(store.get(uuid));
  if (!existing) {
    throw new Error(`Vehicle with identifier '${uuid}' was not found`);
  }

  const record: VehicleRecord = {
    ...existing,
    vehicle: input,
    updatedAt: new Date().toISOString(),
  };

  await requestToPromise(store.put(record));
  await transactionDone(transaction);

  return record;
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

  createVehicle(input: VehicleData): Promise<VehicleRecord> {
    return createVehicle(input);
  }

  updateVehicle(uuid: string, input: VehicleData): Promise<VehicleRecord> {
    return updateVehicle(uuid, input);
  }
}

export const createIndexedDbDatabaseApi = (): DatabaseApi => {
  return new IndexedDbDatabaseApi();
};
