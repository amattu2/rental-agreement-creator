import { render, screen } from "@testing-library/react";

import { Section } from "./index";

describe("Section", () => {
  it("renders title, description, and children", () => {
    render(
      <Section title="Title" description="Description">
        <span>content</span>
      </Section>
    );

    expect(screen.getByRole("heading", { name: "Title" })).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
  });
});
