import { supabase } from './supabaseClient'

// --- AUTH ---
export async function signUp(email, password, username) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { username } }
  })
}

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

// --- PARTIDOS ---
export async function getMatches() {
  return supabase
    .from('matches')
    .select('*')
    .order('match_time', { ascending: true })
}

// --- PREDICCIONES ---
export async function savePrediction(userId, matchId, homeScore, awayScore) {
  return supabase
    .from('predictions')
    .upsert({
      user_id: userId,
      match_id: matchId,
      home_score_pred: homeScore,
      away_score_pred: awayScore,
    }, { onConflict: 'user_id,match_id' })
    .select('user_id, match_id, home_score_pred, away_score_pred')
}

export async function getMyPredictions(userId) {
  return supabase
    .from('predictions')
    .select('*, matches(*)')
    .eq('user_id', userId)
}

export async function getPredictions() {
  return supabase
    .from('predictions')
    .select('user_id, match_id, home_score_pred, away_score_pred, profiles(username), matches(id, match_id)')
}

// --- RANKING ---
export async function getRanking() {
  return supabase
    .from('profiles')
    .select('username, total_points')
    .order('total_points', { ascending: false })
    .limit(50)
}