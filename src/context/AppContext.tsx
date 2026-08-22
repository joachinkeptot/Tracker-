import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import {
  AppState,
  Person,
  Activity,
  Family,
  SelectedItem,
  ViewMode,
  Position,
  SavedQuery,
} from "../types";
import { generateId, saveToLocalStorage, loadFromLocalStorage } from "../utils";
import { usePeopleState } from "./usePeopleState";
import { useActivitiesState } from "./useActivitiesState";
import { useFamiliesState } from "./useFamiliesState";

interface AppContextType extends AppState {
  addPerson: (person: Omit<Person, "id">) => void;
  updatePerson: (id: string, person: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  addActivity: (activity: Omit<Activity, "id">) => string;
  updateActivity: (id: string, activity: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  addFamily: (family: Omit<Family, "id">) => void;
  updateFamily: (id: string, family: Partial<Family>) => void;
  deleteFamily: (id: string) => void;
  addSavedQuery: (query: Omit<SavedQuery, "id">) => void;
  deleteSavedQuery: (id: string) => void;
  setSelected: (selected: SelectedItem) => void;
  setViewMode: (mode: ViewMode) => void;
  setShowConnections: (show: boolean) => void;
  updatePersonPosition: (id: string, position: Position) => void;
  updateActivityPosition: (id: string, position: Position) => void;
  updateAreaNickname: (area: string, nickname: string) => void;
  importData: (data: {
    people?: Person[];
    activities?: Activity[];
    families?: Family[];
  }) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const peopleState = usePeopleState();
  const activitiesState = useActivitiesState();
  const familiesState = useFamiliesState();
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [selected, setSelectedState] = useState<SelectedItem>({
    type: "people",
    id: null,
  });
  const [groupPositions, setGroupPositions] = useState<Map<string, Position>>(
    new Map(),
  );
  const [viewMode, setViewModeState] = useState<ViewMode>("people");
  const [showConnections, setShowConnectionsState] = useState<boolean>(false);
  const [areaNicknames, setAreaNicknames] = useState<Record<string, string>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { people, setPeople } = peopleState;
  const { activities, setActivities } = activitiesState;
  const { families, setFamilies } = familiesState;

  // Load initial data
  useEffect(() => {
    const savedData = loadFromLocalStorage();
    if (savedData) {
      setPeople(savedData.people);
      setActivities(savedData.activities);
      setFamilies(savedData.families);
      setSavedQueries(savedData.savedQueries || []);
      setSelectedState(savedData.selected);
      setGroupPositions(new Map(Object.entries(savedData.groupPositions)));
      setViewModeState(savedData.viewMode || "people");
      setShowConnectionsState(savedData.showConnections ?? false);
      setAreaNicknames(savedData.areaNicknames || {});
    }
    setIsLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save data on changes (only after initial load) — debounced to avoid thrashing
  useEffect(() => {
    if (!isLoaded) return;

    // Always clear existing timer to prevent stale saves
    const prevTimer = saveTimer.current;
    if (prevTimer) {
      clearTimeout(prevTimer);
    }

    // Set new timer with current state
    const timerId = setTimeout(() => {
      try {
        const state = {
          people,
          activities,
          families,
          savedQueries,
          selected,
          groupPositions: Object.fromEntries(groupPositions),
          viewMode,
          showConnections,
          areaNicknames,
        };
        saveToLocalStorage(state);
      } catch (error) {
        console.error("Failed to auto-save state:", error);
      }
    }, 300);

    saveTimer.current = timerId;

    // Cleanup: always clear timer on unmount or dependency change
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, [
    isLoaded,
    people,
    activities,
    families,
    savedQueries,
    selected,
    groupPositions,
    viewMode,
    showConnections,
    areaNicknames,
  ]);

  const deletePerson = (id: string) => {
    peopleState.deletePerson(id);
    // Unlink this person from other people's connections and from activities
    setPeople((prev) =>
      prev.map((p) =>
        p.connections?.some((c) => c.personId === id)
          ? { ...p, connections: p.connections.filter((c) => c.personId !== id) }
          : p,
      ),
    );
    setActivities((prev) =>
      prev.map((a) =>
        a.participantIds.includes(id)
          ? { ...a, participantIds: a.participantIds.filter((pid) => pid !== id) }
          : a,
      ),
    );
    if (selected.type === "people" && selected.id === id) {
      setSelectedState({ type: "people", id: null });
    }
  };

  const deleteActivity = (id: string) => {
    activitiesState.deleteActivity(id);
    // Unlink this activity from any people connected to it
    setPeople((prev) =>
      prev.map((p) =>
        p.connectedActivities?.includes(id)
          ? {
              ...p,
              connectedActivities: p.connectedActivities.filter(
                (actId) => actId !== id,
              ),
            }
          : p,
      ),
    );
    if (selected.type === "activities" && selected.id === id) {
      setSelectedState({ type: "activities", id: null });
    }
  };

  const deleteFamily = (id: string) => {
    // Unlink people from this family
    setPeople((prev) =>
      prev.map((p) => (p.familyId === id ? { ...p, familyId: undefined } : p)),
    );
    familiesState.deleteFamily(id);
  };

  const addSavedQuery = (query: Omit<SavedQuery, "id">) => {
    const newQuery: SavedQuery = {
      ...query,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setSavedQueries((prev) => [...prev, newQuery]);
  };

  const deleteSavedQuery = (id: string) => {
    setSavedQueries((prev) => prev.filter((q) => q.id !== id));
  };

  const setSelected = (newSelected: SelectedItem) => {
    setSelectedState(newSelected);
  };

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
  };

  const setShowConnections = (show: boolean) => {
    setShowConnectionsState(show);
  };

  const updateAreaNickname = (area: string, nickname: string) => {
    setAreaNicknames((prev) => {
      if (!nickname.trim()) {
        const next = { ...prev };
        delete next[area];
        return next;
      }
      return { ...prev, [area]: nickname.trim() };
    });
  };

  const importData = (data: {
    people?: Person[];
    activities?: Activity[];
    families?: Family[];
  }) => {
    if (data.people) setPeople(data.people);
    if (data.activities) setActivities(data.activities);
    if (data.families) setFamilies(data.families);
  };

  const value: AppContextType = {
    people,
    activities,
    families,
    savedQueries,
    selected,
    groupPositions,
    viewMode,
    showConnections,
    areaNicknames,
    updateAreaNickname,
    addPerson: peopleState.addPerson,
    updatePerson: peopleState.updatePerson,
    deletePerson,
    addActivity: activitiesState.addActivity,
    updateActivity: activitiesState.updateActivity,
    deleteActivity,
    addFamily: familiesState.addFamily,
    updateFamily: familiesState.updateFamily,
    deleteFamily,
    addSavedQuery,
    deleteSavedQuery,
    setSelected,
    setViewMode,
    setShowConnections,
    updatePersonPosition: peopleState.updatePersonPosition,
    updateActivityPosition: activitiesState.updateActivityPosition,
    importData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
