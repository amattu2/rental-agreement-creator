import { FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { DEFAULT_FORM } from "@/config/constants";
import type { FormSchema } from "@/schemas/form";
import { VehicleSelectionDialog } from "./index";
import { DatabaseApiContext } from "@/database/provider";

const createVehicleRecord = (overrides?: Partial<VehicleRecord>): VehicleRecord => ({
  identifier: "STK-1",
  createdAt: "2026-06-08T10:00:00.000Z",
  updatedAt: "2026-06-08T10:00:00.000Z",
  vehicle: {
    identifier: "STK-1",
    VIN: "1FTBW2CM5MKA00001",
    license_plate: "ABC-123",
    year: 2024,
    make: "Ford",
    model: "Transit",
    color: "White",
    rental_rates: [],
  },
  ...overrides,
});

const createDatabaseApi = (overrides?: Partial<DatabaseApi>): DatabaseApi => ({
  createAgreement: vi.fn(),
  updateAgreement: vi.fn(),
  getAgreement: vi.fn(),
  getAllAgreements: vi.fn(),
  upsertVehicle: vi.fn(),
  getVehicle: vi.fn(),
  finalizeAgreement: vi.fn(),
  getAllVehicles: vi.fn().mockResolvedValue([]),
  ...overrides,
});

const SelectedVehicleSnapshot = () => {
  const { control } = useFormContext<FormSchema>();
  const rentalVehicle = useWatch({ control, name: "rental_vehicle" });

  return (
    <div>
      <div data-testid="selected-make">{rentalVehicle.make}</div>
      <div data-testid="selected-model">{rentalVehicle.model}</div>
      <div data-testid="selected-vin">{rentalVehicle.VIN}</div>
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
      getAllVehicles: vi.fn().mockResolvedValue([
        createVehicleRecord({
          identifier: "STK-2",
          vehicle: {
            identifier: "STK-2",
            VIN: "1FTBW2CM5MKA00002",
            license_plate: "XYZ-789",
            year: 2026,
            make: "Mercedes",
            model: "Sprinter",
            color: "Blue",
            rental_rates: [],
          },
        }),
        createVehicleRecord(),
      ]),
    });

    renderDialog({ databaseApi });

    expect(await screen.findByText("2024 Ford Transit")).toBeInTheDocument();
    expect(databaseApi.getAllVehicles).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("button", { name: "Select" })).toHaveLength(2);

    const tableRows = screen.getAllByRole("row");
    expect(within(tableRows[1]).getByText("2026 Mercedes Sprinter")).toBeInTheDocument();
    expect(within(tableRows[2]).getByText("2024 Ford Transit")).toBeInTheDocument();
  });

  it("updates form values when a vehicle is selected", async () => {
    const databaseApi = createDatabaseApi({
      getAllVehicles: vi.fn().mockResolvedValue([
        createVehicleRecord({
          vehicle: {
            identifier: "STK-2",
            VIN: "1FTBW2CM5MKA00002",
            license_plate: "XYZ-789",
            year: 2025,
            make: "Mercedes",
            model: "Sprinter",
            color: "Blue",
            rental_rates: [],
          },
        }),
      ]),
    });

    renderDialog({ databaseApi });

    fireEvent.click(await screen.findByRole("button", { name: "Select" }));

    await waitFor(() => {
      expect(screen.getByTestId("selected-make")).toHaveTextContent("Mercedes");
      expect(screen.getByTestId("selected-model")).toHaveTextContent("Sprinter");
      expect(screen.getByTestId("selected-vin")).toHaveTextContent("1FTBW2CM5MKA00002");
    });
  });

  it("shows an empty state when there are no saved vehicles", async () => {
    const databaseApi = createDatabaseApi({
      getAllVehicles: vi.fn().mockResolvedValue([]),
    });

    renderDialog({ databaseApi });

    expect(await screen.findByText("No saved vehicles found.")).toBeInTheDocument();
  });

  it("shows an error message when loading vehicles fails", async () => {
    const databaseApi = createDatabaseApi({
      getAllVehicles: vi.fn().mockRejectedValue(new Error("boom")),
    });

    renderDialog({ databaseApi });

    expect(await screen.findByText("Unable to load vehicle list.")).toBeInTheDocument();
  });
});
