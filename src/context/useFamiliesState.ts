import { useState } from "react";
import { Family } from "../types";
import { generateId } from "../utils";

export function useFamiliesState(initialFamilies: Family[] = []) {
  const [families, setFamilies] = useState<Family[]>(initialFamilies);

  const addFamily = (family: Omit<Family, "id">) => {
    setFamilies((prev) => [...prev, { ...family, id: generateId() }]);
  };

  const updateFamily = (id: string, updates: Partial<Family>) => {
    setFamilies((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    );
  };

  const deleteFamily = (id: string) => {
    setFamilies((prev) => prev.filter((f) => f.id !== id));
  };

  return { families, setFamilies, addFamily, updateFamily, deleteFamily };
}
