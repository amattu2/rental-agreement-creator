type RenteeData = import("@/schemas/form").RenteeSchema;
type VehicleData = import("@/schemas/form").VehicleSchema;
type AgreementData = import("@/schemas/form").FormSchema;
type FinalizationData = import("@/schemas/finalization").FinalizationSchema;

type AgreementStatus = "active" | "archived" | "canceled";

type BaseStatus = "active" | "inactive";

type AgreementRecord = {
  uuid: string;
  agreement: AgreementData;
  status: AgreementStatus;
  finalization?: FinalizationData;
  createdAt: string;
  updatedAt: string;
};

type VehicleRecord = {
  uuid: string;
  status: BaseStatus;
  vehicle: VehicleData;
  createdAt: string;
  updatedAt: string;
};

type CustomerRecord = {
  uuid: string;
  customer: RenteeData;
  status: BaseStatus;
  createdAt: string;
  updatedAt: string;
};

type DatabaseApi = {
  createAgreement(input: AgreementData): Promise<AgreementRecord>;
  updateAgreement(uuid: string, input: AgreementData): Promise<AgreementRecord>;
  getAgreement(uuid: string): Promise<AgreementRecord | undefined>;
  getAllAgreements(): Promise<AgreementRecord[]>;
  searchAgreements(query: string, status: AgreementStatus | "all"): Promise<AgreementRecord[]>;
  finalizeAgreement(uuid: string, finalizationDetails: FinalizationData): Promise<AgreementRecord>;
  cancelAgreement(uuid: string): Promise<AgreementRecord>;

  upsertVehicle(uuid: string | undefined, input: VehicleData): Promise<VehicleRecord>;
  getVehicle(uuid: string): Promise<VehicleRecord | undefined>;
  getAllVehicles(): Promise<VehicleRecord[]>;
  searchVehicles(query: string): Promise<VehicleRecord[]>;
  setVehicleStatus(uuid: string, status: BaseStatus): Promise<VehicleRecord>;

  upsertCustomer(uuid?: string, input: RenteeData): Promise<CustomerRecord>;
  getCustomer(uuid: string): Promise<CustomerRecord | undefined>;
  getAllCustomers(): Promise<CustomerRecord[]>;
  searchCustomers(query: string): Promise<CustomerRecord[]>;
};
