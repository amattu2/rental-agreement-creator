import type { FormSchema } from "@/schemas/form";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Page from "./page";

const mockGenerateRentalPDF = vitest.fn<(data: FormSchema) => Blob>(
  () => new Blob(["pdf"], { type: "application/pdf" })
);
const mockCreateAgreement = vitest.fn<(uuid: string, data: FormSchema) => Promise<unknown>>();
const mockIframeWrapper = vitest.fn(({ src }: { src: string | null }) => (
  <div data-testid="iframe-src">{src ?? "null"}</div>
));

vi.mock("@/components/form/index", () => ({
  RentalAgreementForm: () => (
    <>
      <button type="submit">Generate Agreement</button>
      <button type="button">Reset</button>
    </>
  ),
}));

vi.mock("@/components/iframe", () => ({
  IframeWrapper: (props: { src: string | null }) => mockIframeWrapper(props),
}));

vi.mock("@/database", () => ({
  createIndexedDbDatabaseApi: () => ({
    createAgreement: mockCreateAgreement,
  }),
}));

vi.mock("@/utils/pdf", () => ({
  generateRentalPDF: (data: FormSchema) => mockGenerateRentalPDF(data),
}));

vi.mock("@hookform/resolvers/zod", () => ({
  zodResolver: () => async (values: unknown) => ({
    values,
    errors: {},
  }),
}));

describe("Page", () => {
  const createObjectURLSpy = vitest.fn<(blob: Blob) => string>();
  const revokeObjectURLSpy = vitest.fn<(url: string) => void>();
  const consoleErrorSpy = vitest.spyOn(console, "error").mockImplementation(() => undefined);

  beforeEach(() => {
    mockGenerateRentalPDF.mockClear();
    mockCreateAgreement.mockReset().mockResolvedValue({});
    mockIframeWrapper.mockClear();
    createObjectURLSpy.mockReset().mockReturnValueOnce("blob:first").mockReturnValue("blob:second");
    revokeObjectURLSpy.mockReset();
    consoleErrorSpy.mockClear();
    process.env.NEXT_PUBLIC_APP_NAME = "Rental Agreement Creator";
    process.env.NEXT_PUBLIC_APP_DESCRIPTION = "Create rental agreements";
    process.env.NEXT_PUBLIC_COMPANY_NAME = "Acme Rentals";
    process.env.NEXT_PUBLIC_ADDRESS_LINE1 = "123 Main St";
    process.env.NEXT_PUBLIC_ADDRESS_LINE2 = "Suite 100";

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

    fireEvent.click(screen.getByRole("button", { name: "Generate Agreement" }));

    await waitFor(() => {
      expect(mockCreateAgreement).toHaveBeenCalledTimes(1);
      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    });

    expect(revokeObjectURLSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("iframe-src")).toHaveTextContent("blob:first");
  });

  it("should still create the PDF when saving the agreement fails", async () => {
    const databaseError = new Error("db unavailable");
    mockCreateAgreement.mockRejectedValueOnce(databaseError);

    render(<Page />);

    fireEvent.click(screen.getByRole("button", { name: "Generate Agreement" }));

    await waitFor(() => {
      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to add agreement to database",
      databaseError
    );
  });

  it("should revoke the previous object URL on a second submit", async () => {
    render(<Page />);

    fireEvent.click(screen.getByRole("button", { name: "Generate Agreement" }));
    await waitFor(() => {
      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole("button", { name: "Generate Agreement" }));
    await waitFor(() => {
      expect(createObjectURLSpy).toHaveBeenCalledTimes(2);
    });

    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:first");
    expect(screen.getByTestId("iframe-src")).toHaveTextContent("blob:second");
  });

  it("should revoke the current object URL on unmount", async () => {
    const { unmount } = render(<Page />);

    fireEvent.click(screen.getByRole("button", { name: "Generate Agreement" }));
    await waitFor(() => {
      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    });

    unmount();

    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:first");
  });
});
