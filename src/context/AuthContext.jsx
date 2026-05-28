import { createContext, useState } from 'react'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)

    const value = {
        user,
        setUser,
        loading: false,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}