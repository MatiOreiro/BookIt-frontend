import { createContext, useEffect, useState, type ReactNode } from 'react';

export interface PropuestaDraftItem {
  id: string;
  nombre: string;
  tipoServicio: string;
  precioMinimo: number;
}

export interface PropuestaDraft {
  salon: PropuestaDraftItem | null;
  servicios: PropuestaDraftItem[];
}

interface PropuestaDraftContextValue {
  draft: PropuestaDraft;
  addSalon: (item: PropuestaDraftItem) => void;
  removeSalon: () => void;
  addServicio: (item: PropuestaDraftItem) => void;
  removeServicio: (id: string) => void;
  clear: () => void;
  itemCount: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const STORAGE_KEY = 'bookit_propuesta_draft';
const EMPTY_DRAFT: PropuestaDraft = { salon: null, servicios: [] };

const PropuestaDraftContext = createContext<PropuestaDraftContextValue | null>(null);

const readStoredDraft = (): PropuestaDraft => {
  try {
    if (globalThis.window === undefined) return EMPTY_DRAFT;
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DRAFT;
    const parsed = JSON.parse(raw) as Partial<PropuestaDraft>;
    return {
      salon: parsed.salon ?? null,
      servicios: Array.isArray(parsed.servicios) ? parsed.servicios : [],
    };
  } catch {
    return EMPTY_DRAFT;
  }
};

const writeStoredDraft = (draft: PropuestaDraft): void => {
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // localStorage no disponible (navegación privada, etc.) — el draft queda solo en memoria
  }
};

interface PropuestaDraftProviderProps {
  children: ReactNode;
}

export const PropuestaDraftProvider = ({ children }: PropuestaDraftProviderProps) => {
  const [draft, setDraft] = useState<PropuestaDraft>(readStoredDraft);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    writeStoredDraft(draft);
  }, [draft]);

  const addSalon = (item: PropuestaDraftItem) => {
    setDraft((prev) => ({ ...prev, salon: item }));
  };

  const removeSalon = () => {
    setDraft((prev) => ({ ...prev, salon: null }));
  };

  const addServicio = (item: PropuestaDraftItem) => {
    setDraft((prev) =>
      prev.servicios.some((s) => s.id === item.id) ? prev : { ...prev, servicios: [...prev.servicios, item] },
    );
  };

  const removeServicio = (id: string) => {
    setDraft((prev) => ({ ...prev, servicios: prev.servicios.filter((s) => s.id !== id) }));
  };

  const clear = () => {
    setDraft(EMPTY_DRAFT);
  };

  const itemCount = (draft.salon ? 1 : 0) + draft.servicios.length;

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <PropuestaDraftContext.Provider
      value={{
        draft,
        addSalon,
        removeSalon,
        addServicio,
        removeServicio,
        clear,
        itemCount,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
      }}
    >
      {children}
    </PropuestaDraftContext.Provider>
  );
};

export default PropuestaDraftContext;
