import { Footer } from "./index";
import { render } from "@testing-library/react";

describe("Basic Functionality", () => {
  it("should render without crashing", () => {
    const { getByTestId } = render(<Footer />);

    expect(getByTestId("page-footer")).toBeInTheDocument();
  });

  it("should contain the current year as YYYY", () => {
    vitest.useFakeTimers().setSystemTime(new Date("2023-01-01"));

    const { getByTestId } = render(<Footer />);

    expect(getByTestId("footer-year")).toHaveTextContent("2023");

    vitest.useRealTimers();
  });

  it("should contain the application name", () => {
    process.env.NEXT_PUBLIC_APP_NAME = "A mock app name";

    const { getByTestId } = render(<Footer />);

    expect(getByTestId("footer-link")).toHaveTextContent("A mock app name");
  });
});
