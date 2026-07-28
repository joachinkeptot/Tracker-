import { useState } from "react";
import { Person, Position } from "../types";
import { generateId } from "../utils";

export function usePeopleState(initialPeople: Person[] = []) {
  const [people, setPeople] = useState<Person[]>(initialPeople);

  const addPerson = (person: Omit<Person, "id">) => {
    setPeople((prev) => [...prev, { ...person, id: generateId() }]);
  };

  const updatePerson = (id: string, updates: Partial<Person>) => {
    setPeople((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );
  };

  const deletePerson = (id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePersonPosition = (id: string, position: Position) => {
    setPeople((prev) =>
      prev.map((p) => (p.id === id ? { ...p, position } : p)),
    );
  };

  return {
    people,
    setPeople,
    addPerson,
    updatePerson,
    deletePerson,
    updatePersonPosition,
  };
}
