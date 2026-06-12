import { PropsWithChildren } from "react";
import { SQLiteProvider } from "expo-sqlite";
import { initDatabase } from "@/db/schema";

export function DatabaseProvider({ children }: PropsWithChildren) {
  return (
    <SQLiteProvider databaseName="maa.db" onInit={initDatabase}>
      {children}
    </SQLiteProvider>
  );
}