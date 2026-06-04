import { render, screen } from "@testing-library/react";
import { FieldRow } from "./index";

describe("FieldRow", () => {
  it("renders children", () => {
    render(
      <FieldRow>
        <span>left</span>
        <span>right</span>
      </FieldRow>
    );

    expect(screen.getByText("left")).toBeInTheDocument();
    expect(screen.getByText("right")).toBeInTheDocument();
  });
});
