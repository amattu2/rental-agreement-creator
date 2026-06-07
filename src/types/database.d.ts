type AgreementData = import("@/schemas/form").FormSchema;
type VehicleData = import("@/schemas/form").VehicleSchema;

type AgreementRecord = {
  uuid: string;
  agreement: AgreementData;
  createdAt: string;
  updatedAt: string;
};

type VehicleRecord = {
  uuid: string;
  vehicle: VehicleData;
  createdAt: string;
  updatedAt: string;
};

type DatabaseApi = {
  createAgreement(input: AgreementData): Promise<AgreementRecord>;
  updateAgreement(uuid: string, input: AgreementData): Promise<AgreementRecord>;
  createVehicle(input: VehicleData): Promise<VehicleRecord>;
  updateVehicle(uuid: string, input: VehicleData): Promise<VehicleRecord>;
};
