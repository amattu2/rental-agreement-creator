type RenteeData = import("@/schemas/form").RenteeSchema;
type VehicleData = import("@/schemas/form").VehicleSchema;
type AgreementData = import("@/schemas/form").FormSchema;
type FinalizationData = import("@/schemas/finalization").FinalizationSchema;

type AgreementStatus = "active" | "archived" | "canceled";

type AgreementRecord = {
  uuid: string;
  agreement: AgreementData;
  status: AgreementStatus;
  finalization?: FinalizationData;
  createdAt: string;
  updatedAt: string;
};

type VehicleRecord = {
  identifier: string;
  vehicle: VehicleData;
  createdAt: string;
  updatedAt: string;
};

type CustomerStatus = "active" | "inactive";

type CustomerRecord = {
  uuid: string;
  customer: RenteeData;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
};

type DatabaseApi = {
  createAgreement(input: AgreementData): Promise<AgreementRecord>;
  updateAgreement(uuid: string, input: AgreementData): Promise<AgreementRecord>;
  getAgreement(uuid: string): Promise<AgreementRecord | undefined>;
  getAllAgreements(): Promise<AgreementRecord[]>;
  finalizeAgreement(uuid: string, finalizationDetails: FinalizationData): Promise<AgreementRecord>;
  cancelAgreement(uuid: string): Promise<AgreementRecord>;

  upsertVehicle(identifier: string, input: VehicleData): Promise<VehicleRecord>;
  getVehicle(identifier: string): Promise<VehicleRecord | undefined>;
  getAllVehicles(): Promise<VehicleRecord[]>;

  upsertCustomer(uuid?: string, input: RenteeData): Promise<CustomerRecord>;
  getCustomer(uuid: string): Promise<CustomerRecord | undefined>;
  getAllCustomers(): Promise<CustomerRecord[]>;
  searchCustomers(query: string): Promise<CustomerRecord[]>;
};
