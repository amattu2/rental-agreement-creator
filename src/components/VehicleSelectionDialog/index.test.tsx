import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";

import { DEFAULT_FORM } from "@/config/constants";
import { DatabaseApiContext } from "@/database/provider";
import type { FormSchema } from "@/schemas/form";

import { VehicleSelectionDialog } from "./index";

const createVehicleRecord = (overrides?: Partial<VehicleRecord>): VehicleRecord => ({
  uuid: "vehicle-1",
  status: "active",
  createdAt: "2026-06-08T10:00:00.000Z",
  updatedAt: "2026-06-08T10:00:00.000Z",
  vehicle: {
    stock_number: "STK-1",
    VIN: "1FTBW2CM5MKA00001",
    license_plate: "ABC-123",
    year: 2024,
    make: "Ford",
    model: "Transit",
    color: "White",
    rental_rates: [],
    usage_rates: [],
  },
  ...overrides,
});

const createDatabaseApi = (overrides?: Partial<DatabaseApi>): DatabaseApi => ({
  createAgreement: vi.fn(),
  updateAgreement: vi.fn(),
  getAgreement: vi.fn(),
  getAllAgreements: vi.fn(),
  cancelAgreement: vi.fn(),
  upsertVehicle: vi.fn(),
  getVehicle: vi.fn(),
  searchVehicles: vi.fn().mockResolvedValue([]),
  setVehicleStatus: vi.fn(),
  finalizeAgreement: vi.fn(),
  getAllVehicles: vi.fn().mockResolvedValue([]),
  upsertCustomer: vi.fn(),
  getCustomer: vi.fn(),
  getAllCustomers: vi.fn().mockResolvedValue([]),
  searchCustomers: vi.fn().mockResolvedValue([]),
  searchAgreements: vi.fn().mockResolvedValue([]),
  ...overrides,
});

const SelectedVehicleSnapshot = () => {
  const { control } = useFormContext<FormSchema>();
  const rentalVehicle = useWatch({ control, name: "rental_vehicle" });
  const vehicleIdentifier = useWatch({ control, name: "rental_vehicle.stock_number" });
  const vehicleUuid = useWatch({ control, name: "vehicle_uuid" });

  return (
    <div>
      <div data-testid="selected-uuid">{vehicleUuid ?? ""}</div>
      <div data-testid="selected-identifier">{vehicleIdentifier ?? ""}</div>
      <div data-testid="selected-make">{rentalVehicle.make}</div>
      <div data-testid="selected-model">{rentalVehicle.model}</div>
      <div data-testid="selected-vin">{rentalVehicle.VIN}</div>
      <div data-testid="selected-usage-rates">
        {JSON.stringify(rentalVehicle.usage_rates ?? [])}
      </div>
    </div>
  );
};

const renderDialog = ({ databaseApi }: { databaseApi: DatabaseApi }) => {
  const Wrapper = () => {
    const methods = useForm<FormSchema>({ defaultValues: DEFAULT_FORM });

    return (
      <DatabaseApiContext.Provider value={databaseApi}>
        <FormProvider {...methods}>
          <VehicleSelectionDialog onClose={vi.fn()} />
          <SelectedVehicleSnapshot />
        </FormProvider>
      </DatabaseApiContext.Provider>
    );
  };

  return render(<Wrapper />);
};

describe("VehicleSelectionDialog", () => {
  it("loads and renders saved vehicles", async () => {
    const databaseApi = createDatabaseApi({
      searchVehicles: vi.fn().mockResolvedValue([
        createVehicleRecord({
          uuid: "vehicle-2",
          vehicle: {
            stock_number: "STK-2",
            VIN: "1FTBW2CM5MKA00002",
            license_plate: "XYZ-789",
            year: 2026,
            make: "Mercedes",
            model: "Sprinter",
            color: "Blue",
            rental_rates: [],
            usage_rates: [],
          },
        }),
        createVehicleRecord(),
      ]),
    });

    renderDialog({ databaseApi });

    expect(await screen.findByText("Transit")).toBeInTheDocument();
    expect(databaseApi.searchVehicles).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("button", { name: "Select" })).toHaveLength(2);
    expect(screen.getByText("Sprinter")).toBeInTheDocument();
  });

  it("updates form values when a vehicle is selected", async () => {
    const databaseApi = createDatabaseApi({
      searchVehicles: vi.fn().mockResolvedValue([
        createVehicleRecord({
          vehicle: {
            stock_number: "STK-1",
            VIN: "1FTBW2CM5MKA00002",
            license_plate: "XYZ-789",
            year: 2025,
            make: "Mercedes",
            model: "Sprinter",
            color: "Blue",
            rental_rates: [],
            usage_rates: [
              {
                usage_type: "gasoline",
                usage_cost: 3.99,
                usage_note: "PER GAL",
              },
            ],
          },
        }),
      ]),
    });

    renderDialog({ databaseApi });

    fireEvent.click(await screen.findByRole("button", { name: "Select" }));

    await waitFor(() => {
      expect(screen.getByTestId("selected-uuid")).toHaveTextContent("vehicle-1");
      expect(screen.getByTestId("selected-identifier")).toHaveTextContent("STK-1");
      expect(screen.getByTestId("selected-make")).toHaveTextContent("Mercedes");
      expect(screen.getByTestId("selected-model")).toHaveTextContent("Sprinter");
      expect(screen.getByTestId("selected-vin")).toHaveTextContent("1FTBW2CM5MKA00002");
      expect(screen.getByTestId("selected-usage-rates")).toHaveTextContent(
        '"usage_type":"gasoline"'
      );
    });
  });

  it("shows an error message when loading vehicles fails", async () => {
    const databaseApi = createDatabaseApi({
      searchVehicles: vi.fn().mockRejectedValue(new Error("mock error")),
    });

    renderDialog({ databaseApi });

    expect(await screen.findByText("Unable to load vehicle list.")).toBeInTheDocument();
  });
});
