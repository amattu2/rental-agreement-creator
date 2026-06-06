import dayjs from "dayjs";
import { FormProvider, useForm } from "react-hook-form";
import { fireEvent, render, screen } from "@testing-library/react";
import { RentalAgreementForm } from "./index";
import type { FormSchema } from "@/schemas/form";

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

const defaultValues: FormSchema = {
  agreement_number: "",
  rentee: {
    full_name: "",
    address_street1: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    verified: false,
    driver_license_number: "",
    driver_license_state: "",
    driver_license_expiration: dayjs(null),
    date_of_birth: dayjs(null),
    cell_phone: "",
    alternate_phone: "",
    email: "",
  },
  rentee_employer: {
    company: "",
    position: "",
    address_street1: "",
    address_city: "",
    address_state: "",
    address_zip: "",
  },
  rentee_insurance: {
    company: "",
    policy_number: "",
  },
  additional_drivers: [],
  vehicle_damage_waiver: undefined,
  personal_accident_insurance: undefined,
  rental_vehicle: {
    identifier: "",
    VIN: "",
    license_plate: "",
    year: 2026,
    make: "",
    model: "",
    color: "",
  },
  rental_agreement_info: {
    odometer_in: 0,
    date_in: dayjs(null),
    odometer_out: 0,
    date_out: dayjs(null),
    max_distance: 0,
    max_distance_measurement: "MI",
    max_payload: 0,
    max_payload_measurement: "LB",
    fuel_level_out: "E",
    fuel_level_in: "E",
  },
};

const renderForm = () => {
  const Wrapper = () => {
    const methods = useForm<FormSchema>({ defaultValues });

    return (
      <FormProvider {...methods}>
        <form>
          <RentalAgreementForm />
        </form>
      </FormProvider>
    );
  };

  return render(<Wrapper />);
};

describe("RentalAgreementForm", () => {
  it("renders the grouped sections", () => {
    renderForm();

    expect(screen.getByRole("heading", { name: "Agreement number" })).toBeInTheDocument();
    expect(screen.getByText("Rentee details")).toBeInTheDocument();
    expect(screen.getByText("Additional drivers")).toBeInTheDocument();
    expect(screen.getByText("Vehicle Damage Waiver")).toBeInTheDocument();
    expect(screen.getByText("Personal Accident Insurance")).toBeInTheDocument();
    expect(screen.getByText("Rental vehicle")).toBeInTheDocument();
    expect(screen.getByText("Agreement info")).toBeInTheDocument();
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
});
