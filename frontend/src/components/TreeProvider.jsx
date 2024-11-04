import { createContext, useState } from "react";

export const TreeContext = createContext({
  selected: "",
  setSelected: () => {},
});

export default function TreeProvider({ children }) {
  const [selected, setSelected] = useState("");

  return (
    <TreeContext.Provider value={{ selected, setSelected }}>
      {children}
    </TreeContext.Provider>
  );
}
