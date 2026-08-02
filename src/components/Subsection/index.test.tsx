import { render, screen } from "@testing-library/react";

import { Subsection } from "./index";

describe("Subsection", () => {
  it("renders title and children", () => {
    render(
      <Subsection title="Subsection title">
        <span>sub content</span>
      </Subsection>
    );

    expect(screen.getByText("Subsection title")).toBeInTheDocument();
    expect(screen.getByText("sub content")).toBeInTheDocument();
  });
});
