import { createContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        async function loadSession() {
            const { data } = await supabase.auth.getSession()

            if (!isMounted) return

            setUser(data.session?.user ?? null)
            setLoading(false)
        }

        loadSession()

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })

        return () => {
            isMounted = false
            authListener.subscription.unsubscribe()
        }
    }, [])

    const value = {
        user,
        loading,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}