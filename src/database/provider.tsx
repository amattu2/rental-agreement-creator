"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";

import { createIndexedDbDatabaseApi } from "@/database";

type DatabaseApiProviderProps = {
  children: ReactNode;
};

export const DatabaseApiContext = createContext<DatabaseApi | null>(null);

export const DatabaseApiProvider = ({ children }: DatabaseApiProviderProps) => {
  const value = useMemo<DatabaseApi>(() => createIndexedDbDatabaseApi(), []);

  return <DatabaseApiContext.Provider value={value}>{children}</DatabaseApiContext.Provider>;
};

export const useDatabaseApi = (): DatabaseApi => {
  const context = useContext(DatabaseApiContext);

  if (!context) {
    throw new Error("useDatabaseApi must be used within a DatabaseApiProvider");
  }

  return context;
};
