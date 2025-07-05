import React, { createContext, useContext, useState, ReactNode } from "react";

interface SelectorData {
  selectedHeight?: number;
  heightUnit?: string;
  selectedWeight?: number;
  weightUnit?: string;
  selectedDate?: string;
}

interface SelectorContextType {
  selectorData: SelectorData;
  setSelectorData: (data: Partial<SelectorData>) => void;
  clearSelectorData: () => void;
}

const SelectorContext = createContext<SelectorContextType | undefined>(
  undefined
);

export const SelectorProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectorData, setSelectorDataState] = useState<SelectorData>({});

  const setSelectorData = (data: Partial<SelectorData>) => {
    setSelectorDataState((prev) => ({ ...prev, ...data }));
  };

  const clearSelectorData = () => {
    setSelectorDataState({});
  };

  return (
    <SelectorContext.Provider
      value={{ selectorData, setSelectorData, clearSelectorData }}
    >
      {children}
    </SelectorContext.Provider>
  );
};

export const useSelectorContext = () => {
  const context = useContext(SelectorContext);
  if (context === undefined) {
    throw new Error(
      "useSelectorContext must be used within a SelectorProvider"
    );
  }
  return context;
};
