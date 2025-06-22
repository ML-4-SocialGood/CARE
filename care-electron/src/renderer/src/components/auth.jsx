import { createContext, useState } from "react";

export const AuthContext = createContext({
    isAuthenticated: false,
    setAuthenticated: () => { }
})

export default function AuthProvider({ children }) {
    const [isAuthenticated, setAuthenticated] = useState(() => {
        return sessionStorage.getItem('authenticated') === 'true';
    });
    return <AuthContext.Provider
        value={{
            isAuthenticated,
            setAuthenticated
        }}>
        {children}
    </AuthContext.Provider>
}