import { render } from "@testing-library/react";
import IframeWrapper from "./index";

describe("Basic Functionality", () => {
  it("should render placeholder when no src is provided", () => {
    const { getByTestId } = render(<IframeWrapper src={null} isDirty={false} />);

    expect(getByTestId("iframe-placeholder")).toBeInTheDocument();
  });

  it("should render iframe when src is provided", () => {
    const { getByTestId } = render(<IframeWrapper src="https://example.com" isDirty={false} />);

    expect(getByTestId("iframe")).toBeInTheDocument();
  });

  it("should render stale overlay when isDirty is true", () => {
    const { getByTestId } = render(<IframeWrapper src="https://example.com" isDirty={true} />);

    expect(getByTestId("iframe")).toBeInTheDocument();
    expect(getByTestId("stale-overlay")).toBeInTheDocument();
  });

  it("should not render stale overlay when isDirty is false", () => {
    const { getByTestId, queryByTestId } = render(
      <IframeWrapper src="https://example.com" isDirty={false} />
    );

    expect(getByTestId("iframe")).toBeInTheDocument();
    expect(queryByTestId("stale-overlay")).toBeNull();
  });

  it("should pass additional props to iframe", () => {
    const { getByTestId } = render(
      <IframeWrapper
        src="https://example.com"
        isDirty={false}
        title="Test Iframe"
        width="600"
        height="400"
      />
    );

    const iframe = getByTestId("iframe");
    expect(iframe).toHaveAttribute("title", "Test Iframe");
    expect(iframe).toHaveAttribute("width", "600");
    expect(iframe).toHaveAttribute("height", "400");
  });
});
