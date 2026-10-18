import JSZip from "jszip";

import { INDEXED_DB_VERSION } from "@/config/constants";

/**
 * Packages a database snapshot as compact JSON tables and a versioned manifest in a ZIP.
 */
export const createDataBackup = async (snapshot: DatabaseSnapshot) => {
  const exportedAt = new Date().toISOString();
  const zip = new JSZip();
  const tables = [
    { file: "agreements.json", records: snapshot.agreements },
    { file: "customers.json", records: snapshot.customers },
    { file: "vehicles.json", records: snapshot.vehicles },
  ];

  for (const { file, records } of tables) {
    zip.file(file, JSON.stringify(records));
  }

  zip.file(
    "manifest.json",
    JSON.stringify({
      formatVersion: 1,
      databaseVersion: INDEXED_DB_VERSION,
      exportedAt,
      tables: tables.map(({ file, records }) => ({ file, count: records.length })),
    })
  );

  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  const filename = `rental-backup-${exportedAt.replace(/[:.]/g, "-")}.zip`;

  return { blob, filename };
};
