import JSZip from "jszip";

import {
  DEFAULT_CUSTOMER,
  DEFAULT_FORM,
  DEFAULT_VEHICLE,
  INDEXED_DB_VERSION,
} from "@/config/constants";

import { createDataBackup } from "./dataTransfer";

const timestamp = "2026-10-18T14:00:00.000Z";

const snapshot: DatabaseSnapshot = {
  agreements: (["active", "archived", "canceled"] as const).map((status) => ({
    uuid: `agreement-${status}`,
    agreement: DEFAULT_FORM,
    status,
    ...(status === "archived"
      ? {
          finalization: {
            vehicle_returned_at: new Date(timestamp),
            actual_odometer_in: 12000,
            actual_fuel_level_in: "F",
            finalized_at: new Date(timestamp),
          },
        }
      : {}),
    createdAt: timestamp,
    updatedAt: timestamp,
  })),
  customers: [
    {
      uuid: "customer-1",
      customer: { ...DEFAULT_CUSTOMER, full_name: "Test Customer" },
      status: "inactive",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ],
  vehicles: [
    {
      uuid: "vehicle-1",
      vehicle: DEFAULT_VEHICLE,
      status: "inactive",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ],
};

describe("createDataBackup", () => {
  it.each([snapshot, { agreements: [], customers: [], vehicles: [] }])(
    "should create a complete compact archive with matching manifest counts",
    async (data) => {
      const { blob, filename } = await createDataBackup(data);
      const archive = await JSZip.loadAsync(blob);

      expect(blob.type).toBe("application/zip");
      expect(filename).toMatch(/^rental-backup-[\dT-]+Z\.zip$/);
      expect(Object.keys(archive.files).sort()).toEqual([
        "agreements.json",
        "customers.json",
        "manifest.json",
        "vehicles.json",
      ]);

      for (const table of ["agreements", "customers", "vehicles"] as const) {
        expect(await archive.file(`${table}.json`)!.async("string")).toBe(
          JSON.stringify(data[table])
        );
      }
      const manifest = JSON.parse(await archive.file("manifest.json")!.async("string"));
      expect(manifest).toEqual({
        formatVersion: 1,
        databaseVersion: INDEXED_DB_VERSION,
        exportedAt: expect.any(String),
        tables: [
          { file: "agreements.json", count: data.agreements.length },
          { file: "customers.json", count: data.customers.length },
          { file: "vehicles.json", count: data.vehicles.length },
        ],
      });
      expect(new Date(manifest.exportedAt).toISOString()).toBe(manifest.exportedAt);
    }
  );
});
