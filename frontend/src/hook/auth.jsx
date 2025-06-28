import { createContext, useState } from "react";

export const AuthContext = createContext({
  isAuthenticated: true,
  setAuthenticated: () => {},
});

export default function AuthProvider({ children }) {
  const [isAuthenticated, setAuthenticated] = useState(() => {
    return true;
  });
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        setAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
