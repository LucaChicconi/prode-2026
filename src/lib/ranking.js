const defaultTopTenTeams = new Set([
  'francia',
  'españa',
  'argentina',
  'inglaterra',
  'portugal',
  'brasil',
  'paises bajos',
  'marruecos',
  'belgica',
  'alemania',
].map(normalizeTeamName))

const defaultLowerFifaTeams = new Set([
  'nueva zelanda',
  'haiti',
  'curazao',
  'ghana',
  'cabo verde',
  'bosnia y herzegovina',
  'jordania',
  'arabia saudita',
  'sudafrica',
  'irak',
  'qatar',
  'uzbekistan',
  'rd congo',
  'tunez',
  'escocia',
].map(normalizeTeamName))

function normalizeKey(value) {
  if (value === null || value === undefined) {
    return ''
  }

  return value.toString().trim()
}

function normalizeTeamName(team) {
  return (team ?? '')
    .toString()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getMatchKey(match) {
  return normalizeKey(match?.match_id ?? match?.id)
}

function getPredictionKey(prediction) {
  return normalizeKey(prediction?.match_id ?? prediction?.matches?.id ?? prediction?.matches?.match_id)
}

function getProfileKey(profile) {
  return profile?.id ?? profile?.user_id ?? profile?.username
}

function normalizeIdentityKey(value) {
  if (value === null || value === undefined) {
    return ''
  }

  return value.toString().trim().toLowerCase()
}

function getIdentityKeys(entity) {
  return [
    entity?.user_id,
    entity?.profiles?.id,
    entity?.profiles?.user_id,
    entity?.profiles?.username,
    entity?.id,
    entity?.username,
  ]
    .filter(Boolean)
    .map(normalizeIdentityKey)
}

function getMatchOutcome(homeScore, awayScore) {
  if (homeScore > awayScore) {
    return 'home'
  }

  if (awayScore > homeScore) {
    return 'away'
  }

  return 'draw'
}

function getSimulationMatchKey(match) {
  return normalizeKey(match?.match_id ?? match?.id)
}

function defaultGetPointsForPrediction({ prediction, match }) {
  if (!prediction || !match) {
    return 0
  }

  const predictionHome = Number(prediction.home_score_pred)
  const predictionAway = Number(prediction.away_score_pred)
  const matchHome = Number(match.home_score)
  const matchAway = Number(match.away_score)

  if (
    Number.isNaN(predictionHome) ||
    Number.isNaN(predictionAway) ||
    Number.isNaN(matchHome) ||
    Number.isNaN(matchAway)
  ) {
    return 0
  }

  if (predictionHome === matchHome && predictionAway === matchAway) {
    return 3
  }

  const predictedOutcome = getMatchOutcome(predictionHome, predictionAway)
  const actualOutcome = getMatchOutcome(matchHome, matchAway)

  return predictedOutcome === actualOutcome ? 1 : 0
}

function isPossibleBatacazo(match, topTenTeams, lowerFifaTeams) {
  const homeTeam = normalizeTeamName(match.home_team)
  const awayTeam = normalizeTeamName(match.away_team)

  const homeIsLow = lowerFifaTeams.has(homeTeam)
  const awayIsLow = lowerFifaTeams.has(awayTeam)
  const homeIsTop = topTenTeams.has(homeTeam)
  const awayIsTop = topTenTeams.has(awayTeam)

  if (!((homeIsLow && awayIsTop) || (awayIsLow && homeIsTop))) {
    return false
  }

  const homeScore = Number(match.home_score)
  const awayScore = Number(match.away_score)

  if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
    return false
  }

  const lowTeamScore = homeIsLow ? homeScore : awayScore
  const topTeamScore = homeIsLow ? awayScore : homeScore

  return lowTeamScore >= topTeamScore
}

export function calculateRankingWithBonus(
  rankingData = [],
  matchesData = [],
  predictionsData = [],
  config = {}
) {
  const topTenTeams = config.topTenTeams ?? defaultTopTenTeams
  const lowerFifaTeams = config.lowerFifaTeams ?? defaultLowerFifaTeams

  const matchesByKey = new Map(
    matchesData.map(match => [getMatchKey(match), match])
  )

  const usernameByIdentityKey = new Map()
  rankingData.forEach(profile => {
    const profileKeys = getIdentityKeys(profile)

    profileKeys.forEach(key => {
      if (!usernameByIdentityKey.has(key) && profile.username) {
        usernameByIdentityKey.set(key, profile.username)
      }
    })
  })

  const pointsByUsername = new Map()
  const bonusByUsername = new Map()
  const hoyLaVieronUsernames = new Set()

  predictionsData.forEach(prediction => {
    const matchKey = getPredictionKey(prediction)
    const match = matchesByKey.get(matchKey)

    if (!match) {
      return
    }

    const predictionHome = Number(prediction.home_score_pred)
    const predictionAway = Number(prediction.away_score_pred)
    const matchHome = Number(match.home_score)
    const matchAway = Number(match.away_score)

    if (
      Number.isNaN(predictionHome) ||
      Number.isNaN(predictionAway) ||
      Number.isNaN(matchHome) ||
      Number.isNaN(matchAway)
    ) {
      return
    }

    const points = defaultGetPointsForPrediction({ prediction, match })
    const userKeys = getIdentityKeys(prediction)

    if (userKeys.length === 0) return

    userKeys.forEach(userKey => {
      pointsByUsername.set(userKey, (pointsByUsername.get(userKey) || 0) + points)
    })

    if (predictionHome === matchHome && predictionAway === matchAway && isPossibleBatacazo(match, topTenTeams, lowerFifaTeams)) {
      userKeys.forEach(userKey => {
        bonusByUsername.set(userKey, (bonusByUsername.get(userKey) || 0) + 5)
      })

      userKeys.forEach(userKey => {
        const username = usernameByIdentityKey.get(userKey)
        if (username) {
          hoyLaVieronUsernames.add(username)
        }
      })
    }
  })

  const rankingWithBonus = rankingData
    .map(profile => {
      const profileKeys = getIdentityKeys(profile)
      const storedPoints = Number(profile.total_points)
      const calculatedPoints = profileKeys.reduce((value, key) => value || pointsByUsername.get(key) || 0, 0)
      const batacazoBonus = profileKeys.reduce((value, key) => value || bonusByUsername.get(key) || 0, 0)
      const displayPoints = Number.isNaN(storedPoints) ? calculatedPoints + batacazoBonus : storedPoints

      return {
        ...profile,
        storedPoints: displayPoints,
        batacazoBonus,
        calculatedPoints,
        displayPoints,
      }
    })
    .sort((a, b) => {
      if (b.displayPoints !== a.displayPoints) {
        return b.displayPoints - a.displayPoints
      }

      if (b.storedPoints !== a.storedPoints) {
        return b.storedPoints - a.storedPoints
      }

      return a.username.localeCompare(b.username)
    })

  const hoyLaVieron = [...hoyLaVieronUsernames].sort((a, b) => a.localeCompare(b))

  return { rankingWithBonus, hoyLaVieron }
}

export function calculateSimulatedRanking(
  rankingData = [],
  predictionsData = [],
  simulatedMatchesData = [],
  config = {}
) {
  const getPointsForPrediction = config.getPointsForPrediction ?? defaultGetPointsForPrediction

  const simulatedMatchesByKey = new Map(
    simulatedMatchesData.map(match => [getSimulationMatchKey(match), match])
  )

  const pointsByUsername = new Map()

  predictionsData.forEach(prediction => {
    const matchKey = getPredictionKey(prediction)
    const match = simulatedMatchesByKey.get(matchKey)

    if (!match) {
      return
    }

    const points = Number(getPointsForPrediction({ prediction, match }))

    if (Number.isNaN(points) || points === 0) {
      return
    }

    const userKeys = getIdentityKeys(prediction)
    if (userKeys.length === 0) {
      return
    }

    userKeys.forEach(userKey => {
      pointsByUsername.set(userKey, (pointsByUsername.get(userKey) || 0) + points)
    })
  })

  const rankingWithSimulation = rankingData
    .map(profile => {
      const simulatedPoints = getIdentityKeys(profile).reduce((value, key) => value || pointsByUsername.get(key) || 0, 0)

      return {
        ...profile,
        simulatedPoints,
        displayPoints: simulatedPoints,
      }
    })
    .sort((a, b) => {
      if (b.displayPoints !== a.displayPoints) {
        return b.displayPoints - a.displayPoints
      }

      return a.username.localeCompare(b.username)
    })

  return {
    rankingWithSimulation,
    pointsByUsername,
  }
}
