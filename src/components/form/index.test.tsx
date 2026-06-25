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
