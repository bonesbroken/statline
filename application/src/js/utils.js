export const defaultUserSettings = {
    "theme": "defaultTheme",
    "maxEvents": 5,
    "eventCount": true,
    // per-game event defaults (each event defaulted to false)
    "GAME_EVENTS_MAP": {
        'battlefield_6': {
            'elimination': false, 'victory': false, 'death': false, 'defeat': false, 'revive': false, 'assist': false, 'capturing_objective': false, 'captured_objective': false
        },
        'apex_legends': {
            'elimination': false, 'victory': false, 'death': false, 'defeat': false, 'knockout': false, 'player_knocked': false, 'player_revived': false
        },
        'black_ops_6': {
            'elimination': false, 'victory': false, 'defeat': false
        },
        'counter_strike_2': {
            'elimination': false, 'victory': false, 'defeat': false, 'death': false, 'round_won': false, 'round_lost': false
        },
        'fortnite': {
            'elimination': false, 'victory': false, 'defeat': false, 'death': false, 'knockout': false, 'player_knocked': false
        },
        'league_of_legends': {
            'enemy_turret_destroyed': false, 'ally_turret_destroyed': false, 'enemy_inhibitor_destroyed': false, 'ally_inhibitor_destroyed': false, 'victory': false, 'defeat': false, 'elimination': false, 'death': false, 'assist': false
        },
        'marvel_rivals': {
            'elimination': false, 'victory': false, 'defeat': false, 'death': false, 'double_kill': false, 'triple_kill': false, 'quad_kill': false, 'penta_kill': false, 'hexa_kill': false, 'unstoppable_kill': false
        },
        'overwatch_2': {
            'elimination': false, 'victory': false, 'defeat': false, 'death': false
        },
        'pubg': {
            'elimination': false, 'victory': false, 'defeat': false, 'death': false, 'knockout': false, 'player_knocked': false
        },
        'rainbow_six_siege': {
            'elimination': false, 'victory': false, 'defeat': false, 'death': false, 'knockout': false, 'player_knocked': false
        },
        'valorant': {
            'elimination': false, 'victory': false, 'defeat': false, 'death': false
        },
        'war_thunder': {
            'elimination': false
        },
        'warzone': {
            'elimination': false, 'victory': false, 'defeat': false, 'death': false, 'knockout': false, 'player_knocked': false, 'gulag_start': false, 'gulag_end': false, 'redeploying': false
        }
    }
};

export const appVersion = "0.1";


export function getGameName(game) {
    if (!game) return 'Unknown Game';

    const GAME_NAME_MAP = {
        'battlefield_6': 'Battlefield 6',
        'apex_legends': 'Apex Legends',
        'black_ops_6': 'Black Ops 6',
        'counter_strike_2': 'Counter Strike 2',
        'fortnite': 'Fortnite',
        'league_of_legends': 'League of Legends',
        'marvel_rivals': 'Marvel Rivals',
        'overwatch_2': 'Overwatch 2',
        'pubg': 'PUBG',
        'rainbow_six_siege': 'Rainbow Six Siege',
        'valorant': 'Valorant',
        'war_thunder': 'War Thunder',
        'warzone': 'Warzone',
        // add other mappings here as needed
    };

    return GAME_NAME_MAP[game] || 'Unknown Game';
}

export function getGameEvents(game) {
    if (!game) return [];

    const GAME_EVENTS_MAP = {
        'battlefield_6': ['elimination','victory','death', 'defeat', 'revive', 'assist', 'capturing_objective', 'captured_objective'],
        'apex_legends': ['elimination','victory','death', 'defeat', 'knockout', 'player_knocked', 'player_revived'],
        'black_ops_6': ['elimination','victory','defeat'],
        'counter_strike_2': ['elimination','victory','defeat', 'death', 'round_won', 'round_lost'],
        'fortnite': ['elimination','victory','defeat', 'death', 'knockout', 'player_knocked'],
        'league_of_legends': ['enemy_turret_destroyed','ally_turret_destroyed','enemy_inhibitor_destroyed', 'ally_inhibitor_destroyed', 'victory', 'defeat', 'elimination', 'death', 'assist'],
        'marvel_rivals': ['elimination','victory','defeat', 'death', 'double_kill', 'triple_kill', 'quad_kill', 'penta_kill', 'hexa_kill', 'unstoppable_kill'],
        'overwatch_2': ['elimination','victory','defeat', 'death'],
        'pubg': ['elimination','victory','defeat', 'death', 'knockout', 'player_knocked'],
        'rainbow_six_siege': ['elimination','victory','defeat', 'death', 'knockout', 'player_knocked'],
        'valorant': ['elimination','victory','defeat', 'death'],
        'war_thunder': ['elimination'],
        'warzone': ['elimination','victory','defeat', 'death', 'knockout', 'player_knocked', 'gulag_start', 'gulag_end', 'redeploying'],
    }

    return GAME_NAME_MAP[game] || [];
}

export const humanizeEventName = s =>
  (s || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());