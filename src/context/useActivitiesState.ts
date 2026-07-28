import { useState } from "react";
import { Activity, Position } from "../types";
import { generateId } from "../utils";

export function useActivitiesState(initialActivities: Activity[] = []) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);

  const addActivity = (activity: Omit<Activity, "id">) => {
    const newActivity: Activity = { ...activity, id: generateId() };
    setActivities((prev) => [...prev, newActivity]);
    return newActivity.id;
  };

  const updateActivity = (id: string, updates: Partial<Activity>) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    );
  };

  const deleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  const updateActivityPosition = (id: string, position: Position) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, position } : a)),
    );
  };

  return {
    activities,
    setActivities,
    addActivity,
    updateActivity,
    deleteActivity,
    updateActivityPosition,
  };
}
