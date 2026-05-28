import { createClient } from '@supabase/supabase-js'

function normalizeSupabaseUrl(value) {
	const trimmed = value?.trim()
	if (!trimmed) return trimmed

	return trimmed.replace(/\/?rest\/v1\/?$/, '').replace(/\/$/, '')
}

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)