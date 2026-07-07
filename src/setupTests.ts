import "@testing-library/jest-dom/vitest";

class ResizeObserverMock implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (typeof window !== "undefined") {
  window.ResizeObserver = window.ResizeObserver ?? ResizeObserverMock;
  window.HTMLElement.prototype.scrollIntoView = () => {};
}

vi.mock("@mui/x-data-grid", async () => {
  const { DataGridTestDouble, GridActionsCellItemTestDouble } =
    await import("@/test-utils/DataGridTestDouble");

  return {
    DataGrid: DataGridTestDouble,
    GridActionsCellItem: GridActionsCellItemTestDouble,
  };
});
