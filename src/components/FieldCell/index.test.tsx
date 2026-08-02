import { render, screen } from "@testing-library/react";

import { FieldCell } from "./index";

describe("FieldCell", () => {
  it("renders children", () => {
    render(
      <FieldCell>
        <span>child content</span>
      </FieldCell>
    );

    expect(screen.getByText("child content")).toBeInTheDocument();
  });
});
