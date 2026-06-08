import { IframeWrapper } from "./index";
import { render } from "@testing-library/react";

describe("Basic Functionality", () => {
  it("should render placeholder when no src is provided", () => {
    const { getByTestId } = render(<IframeWrapper src={null} />);

    expect(getByTestId("iframe-placeholder")).toBeInTheDocument();
  });

  it("should render iframe when src is provided", () => {
    const { getByTestId } = render(<IframeWrapper src="https://example.com" />);

    expect(getByTestId("iframe")).toBeInTheDocument();
  });

  it("should pass additional props to iframe", () => {
    const { getByTestId } = render(
      <IframeWrapper src="https://example.com" title="Test Iframe" width="600" height="400" />
    );

    const iframe = getByTestId("iframe");
    expect(iframe).toHaveAttribute("title", "Test Iframe");
    expect(iframe).toHaveAttribute("width", "600");
    expect(iframe).toHaveAttribute("height", "400");
  });
});
