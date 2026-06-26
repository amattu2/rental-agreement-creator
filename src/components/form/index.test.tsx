import { FormProvider, useForm } from "react-hook-form";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RentalAgreementForm } from "./index";
import type { FormSchema } from "@/schemas/form";
import { DEFAULT_FORM } from "@/config/constants";
import { DatabaseApiContext } from "@/database/provider";
import { BillingStateCtx } from "../BillingContext";

vi.mock("@mui/x-date-pickers/DatePicker", () => ({
  DatePicker: ({ label }: { label: string }) => (
    <div data-testid={`date-picker-${label}`}>{label}</div>
  ),
}));

vi.mock("@mui/x-date-pickers/DateTimePicker", () => ({
  DateTimePicker: ({ label }: { label: string }) => (
    <div data-testid={`date-time-picker-${label}`}>{label}</div>
  ),
}));

const renderForm = () => {
  const databaseApi: DatabaseApi = {
    createAgreement: vi.fn(),
    updateAgreement: vi.fn(),
    getAgreement: vi.fn(),
    getAllAgreements: vi.fn(),
    upsertVehicle: vi.fn(),
    getVehicle: vi.fn(),
    getAllVehicles: vi.fn().mockResolvedValue([]),
  };

  const Wrapper = () => {
    const methods = useForm<FormSchema>({ defaultValues: DEFAULT_FORM });

    return (
      <DatabaseApiContext.Provider value={databaseApi}>
        <FormProvider {...methods}>
          <BillingStateCtx.Provider value={{ status: "confirmed", description: "" }}>
            <form>
              <RentalAgreementForm />
            </form>
          </BillingStateCtx.Provider>
        </FormProvider>
      </DatabaseApiContext.Provider>
    );
  };

  return render(<Wrapper />);
};

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

describe("RentalAgreementForm", () => {
  it("renders the grouped sections", () => {
    renderForm();

    expect(screen.getByRole("heading", { name: "Agreement Information" })).toBeInTheDocument();
    expect(screen.getByText("Rentee details")).toBeInTheDocument();
    expect(screen.getByText("Additional drivers")).toBeInTheDocument();
    expect(screen.getByText("Vehicle Damage Waiver")).toBeInTheDocument();
    expect(screen.getByText("Personal Accident Insurance")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Rental Vehicle" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Agreement number" })).toBeInTheDocument();
  });

  it("lets the user add an additional driver row", () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Add driver" }));

    expect(screen.getByText("Additional driver 1")).toBeInTheDocument();
  });

  it("keeps vehicle damage waiver fields hidden until added", () => {
    renderForm();

    expect(screen.queryByLabelText("Rate per day")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add Vehicle Damage Waiver" }));

    expect(screen.getByLabelText("Rate per day")).toBeInTheDocument();
    expect(screen.getByLabelText("Rate per week")).toBeInTheDocument();
    expect(screen.getByLabelText("Damage liability limit")).toBeInTheDocument();
  });

  it("keeps personal accident insurance fields hidden until added", () => {
    renderForm();

    expect(screen.queryByRole("spinbutton", { name: "Rate per day" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add Personal Accident Insurance" }));

    expect(screen.getByRole("spinbutton", { name: "Rate per day" })).toBeInTheDocument();
  });

  it("renders the submit and reset actions", () => {
    renderForm();

    expect(screen.getByRole("button", { name: "Generate Agreement" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
  });

  it("renders the updated rental rates after selecting an existing vehicle", async () => {
    const databaseApi: DatabaseApi = {
      createAgreement: vi.fn(),
      updateAgreement: vi.fn(),
      getAgreement: vi.fn(),
      getAllAgreements: vi.fn(),
      upsertVehicle: vi.fn(),
      getVehicle: vi.fn(),
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
            rental_rates: [
              { rate_unit: "hours", rate_cost: 2.2, rate_note: "PER HOUR" },
              { rate_unit: "days", rate_cost: 25, rate_note: "PER DAY" },
            ],
          },
        }),
      ]),
    };

    const Wrapper = () => {
      const methods = useForm<FormSchema>({ defaultValues: DEFAULT_FORM });

      return (
        <DatabaseApiContext.Provider value={databaseApi}>
          <FormProvider {...methods}>
            <BillingStateCtx.Provider value={{ status: "confirmed", description: "" }}>
              <form>
                <RentalAgreementForm />
              </form>
            </BillingStateCtx.Provider>
          </FormProvider>
        </DatabaseApiContext.Provider>
      );
    };

    render(<Wrapper />);

    fireEvent.click(screen.getByRole("button", { name: /select an existing vehicle/i }));
    fireEvent.click(await screen.findByRole("button", { name: "Select" }));

    await waitFor(() => {
      expect(screen.getByText("Rate #1")).toBeInTheDocument();
    });

    const costInputs = screen.getAllByRole("spinbutton", { name: /cost per unit/i });
    expect(costInputs).toHaveLength(2);
    expect(costInputs[0]).toHaveValue(2.2);
    expect(costInputs[1]).toHaveValue(25);
    expect(screen.getByText("Rate #2")).toBeInTheDocument();
  });

  it("removes existing rental rates when the selected vehicle has none", async () => {
    const databaseApi: DatabaseApi = {
      createAgreement: vi.fn(),
      updateAgreement: vi.fn(),
      getAgreement: vi.fn(),
      getAllAgreements: vi.fn(),
      upsertVehicle: vi.fn(),
      getVehicle: vi.fn(),
      getAllVehicles: vi.fn().mockResolvedValue([createVehicleRecord()]),
    };

    const Wrapper = () => {
      const methods = useForm<FormSchema>({
        defaultValues: {
          ...DEFAULT_FORM,
          rental_vehicle: {
            ...DEFAULT_FORM.rental_vehicle,
            rental_rates: [
              { rate_unit: "days", rate_cost: 50, rate_note: "PER DAY" },
            ],
          },
        },
      });

      return (
        <DatabaseApiContext.Provider value={databaseApi}>
          <FormProvider {...methods}>
            <BillingStateCtx.Provider value={{ status: "confirmed", description: "" }}>
              <form>
                <RentalAgreementForm />
              </form>
            </BillingStateCtx.Provider>
          </FormProvider>
        </DatabaseApiContext.Provider>
      );
    };

    render(<Wrapper />);

    expect(screen.getByText("Rate #1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /select an existing vehicle/i }));
    fireEvent.click(await screen.findByRole("button", { name: "Select" }));

    await waitFor(() => {
      expect(screen.queryByText("Rate #1")).not.toBeInTheDocument();
    });
    expect(screen.queryAllByRole("spinbutton", { name: /cost per unit/i })).toHaveLength(0);
  });

  it.skip("resets immediately when the form is clean", () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.queryByText("Discard Changes?")).not.toBeInTheDocument();
  });

  it("asks for confirmation before resetting when the form is dirty", async () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Add Vehicle Damage Waiver" }));

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByText("Discard Changes?")).toBeInTheDocument();

    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByText("Discard Changes?")).not.toBeInTheDocument();
    });
    expect(screen.getByLabelText("Rate per day")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Reset" }));

    await waitFor(() => {
      expect(screen.queryByText("Discard Changes?")).not.toBeInTheDocument();
    });
    expect(screen.queryByLabelText("Rate per day")).not.toBeInTheDocument();
  });
});
