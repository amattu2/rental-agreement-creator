type AgreementData = import("@/schemas/form").FormSchema;
type VehicleData = import("@/schemas/form").VehicleSchema;
type FinalizationData = import("@/schemas/finalization").FinalizationSchema;

type AgreementStatus = "active" | "archived";

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

type DatabaseApi = {
  createAgreement(input: AgreementData): Promise<AgreementRecord>;
  updateAgreement(uuid: string, input: AgreementData): Promise<AgreementRecord>;
  getAgreement(uuid: string): Promise<AgreementRecord | undefined>;
  getAllAgreements(): Promise<AgreementRecord[]>;
  finalizeAgreement(uuid: string, finalizationDetails: FinalizationData): Promise<AgreementRecord>;
  upsertVehicle(input: VehicleData): Promise<VehicleRecord>;
  getVehicle(identifier: string): Promise<VehicleRecord | undefined>;
  getAllVehicles(): Promise<VehicleRecord[]>;
};
