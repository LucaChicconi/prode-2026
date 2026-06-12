import { createContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        supabase.auth.getSession().then(({ data }) => {
            if (!isMounted) return
            setUser(data.session?.user ?? null)
            setLoading(false)
        })

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })

        return () => {
            isMounted = false
            authListener.subscription.unsubscribe()
        }
    }, [])

    async function logout() {
        setLoading(true)
        const { error } = await supabase.auth.signOut()
        if (!error) {
            setUser(null)
        }
        setLoading(false)
        return { error }
    }

    const value = {
        user,
        loading,
        logout,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}