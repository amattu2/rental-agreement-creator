import type { FormSchema } from "@/schemas/form";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Page from "./page";

const storedForm: Pick<FormSchema, "workDays" | "employees"> = {
  workDays: {
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: false,
    Sunday: false,
  },
  employees: [{ fullName: "Stored Employee" }],
};

const mockSetPrevForm = vitest.fn();
const mockGenerateTimesheetPDF = vitest.fn<(data: FormSchema) => Blob>(
  () => new Blob(["pdf"], { type: "application/pdf" })
);
const mockIframeWrapper = vitest.fn(({ src }: { src: string | null }) => (
  <div data-testid="iframe-src">{src ?? "null"}</div>
));

vi.mock("@/components/form", () => ({
  TimesheetForm: () => <button type="submit">Generate PDF</button>,
}));

vi.mock("@/components/iframe", () => ({
  IframeWrapper: (props: { src: string | null }) => mockIframeWrapper(props),
}));

vi.mock("@/utils/pdf", () => ({
  generateTimesheetPDF: (data: FormSchema) => mockGenerateTimesheetPDF(data),
}));

vi.mock("@hookform/resolvers/zod", () => ({
  zodResolver: () => async (values: unknown) => ({
    values,
    errors: {},
  }),
}));

vi.mock("usehooks-ts", () => ({
  useLocalStorage: () => [storedForm, mockSetPrevForm] as const,
}));

describe("Page", () => {
  const createObjectURLSpy = vitest.fn<(blob: Blob) => string>();
  const revokeObjectURLSpy = vitest.fn<(url: string) => void>();

  beforeEach(() => {
    mockSetPrevForm.mockClear();
    mockGenerateTimesheetPDF.mockClear();
    mockIframeWrapper.mockClear();
    createObjectURLSpy.mockReset().mockReturnValueOnce("blob:first").mockReturnValue("blob:second");
    revokeObjectURLSpy.mockReset();

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: createObjectURLSpy as typeof URL.createObjectURL,
    });

    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: revokeObjectURLSpy as typeof URL.revokeObjectURL,
    });
  });

  it("should render iframe with a null source by default", () => {
    render(<Page />);

    expect(screen.getByTestId("iframe-src")).toHaveTextContent("null");
  });

  it("should create an object URL and pass it to the iframe on submit", async () => {
    render(<Page />);

    fireEvent.click(screen.getByRole("button", { name: "Generate PDF" }));

    await waitFor(() => {
      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    });

    expect(revokeObjectURLSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("iframe-src")).toHaveTextContent("blob:first");
  });

  it("should revoke the previous object URL on a second submit", async () => {
    render(<Page />);

    fireEvent.click(screen.getByRole("button", { name: "Generate PDF" }));
    await waitFor(() => {
      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole("button", { name: "Generate PDF" }));
    await waitFor(() => {
      expect(createObjectURLSpy).toHaveBeenCalledTimes(2);
    });

    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:first");
    expect(screen.getByTestId("iframe-src")).toHaveTextContent("blob:second");
  });

  it("should persist workDays and employees after submit", async () => {
    render(<Page />);

    fireEvent.click(screen.getByRole("button", { name: "Generate PDF" }));

    await waitFor(() => {
      expect(mockSetPrevForm).toHaveBeenCalledTimes(1);
    });

    expect(mockSetPrevForm).toHaveBeenCalledWith(storedForm);
    expect(mockGenerateTimesheetPDF).toHaveBeenCalledTimes(1);
  });

  it("should revoke the current object URL on unmount", async () => {
    const { unmount } = render(<Page />);

    fireEvent.click(screen.getByRole("button", { name: "Generate PDF" }));
    await waitFor(() => {
      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    });

    unmount();

    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:first");
  });
});
