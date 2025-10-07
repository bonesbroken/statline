import $ from "jquery";
import { Rive } from "@rive-app/webgl2";
import RiveAsset from "../rive/event.riv";
export const appVersion = "0.15";

export const defaultUserSettings = {
    "maxEvents": 4,
    "showEventCount": true,
    "showEventTime": true,
    "color1": "#ff5e54",
    "color2": "#1609b4",
    "hideTime": 0,
    "lastActiveGame": null,
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

// Convert hex like '#RRGGBB' or 'RRGGBB' or short 'RGB' to 0xAARRGGBB (alpha default 0xFF)
function hexToArgbInt(hex, alpha = 0xFF) {
    const h = String(hex || '').replace(/^#/, '').trim();
    let r = 255, g = 255, b = 255, a = alpha & 0xFF;
    if (h.length === 3) {
        r = parseInt(h[0] + h[0], 16);
        g = parseInt(h[1] + h[1], 16);
        b = parseInt(h[2] + h[2], 16);
    } else if (h.length === 6) {
        r = parseInt(h.slice(0, 2), 16);
        g = parseInt(h.slice(2, 4), 16);
        b = parseInt(h.slice(4, 6), 16);
    } else if (h.length === 8) {
        // If 8 chars, treat as RRGGBBAA
        r = parseInt(h.slice(0, 2), 16);
        g = parseInt(h.slice(2, 4), 16);
        b = parseInt(h.slice(4, 6), 16);
        a = parseInt(h.slice(6, 8), 16) & 0xFF;
    }
    return ((a & 0xFF) << 24) | ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
}

function rgbToArgbInt(r, g, b, a = 0xFF) {
    return ((a & 0xFF) << 24) | ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
}


export function createEvent(eventData) {
    const $eventCanvas = $('<canvas>').addClass('riveCanvas');

    let riveInstance = new Rive({
        src: RiveAsset,
        stateMachines: "State Machine 1",
        canvas: $eventCanvas[0],
        // layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
        autoplay: true,
        // useOffscreenRenderer: true,
        autoBind: true,
        onLoad: () => {
            riveInstance.resizeDrawingSurfaceToCanvas();
            const vmi = riveInstance.viewModelInstance;
            vmi.string('eventName').value = humanizeEventName(eventData.event);
            if(eventData.showEventTime) {
                vmi.string('eventTime').value = `${eventData.time}s`;
            } else {
                vmi.string('eventTime').value = ``;
            }
            const color1Int = hexToArgbInt(eventData.color1 || 'FFFFFF');
            vmi.color('color1').value = color1Int;
            const color2Int = hexToArgbInt(eventData.color2 || 'FFFFFF');
            vmi.color('color2').value = color2Int;
            var imageProperty = vmi.image("pfp");

            fetch(eventData.pfp).then(async (res) => {
                // Decode the image from the response. This object is used to set the image property.
                const image = await decodeImage(
                    new Uint8Array(await res.arrayBuffer())
                );
                imageProperty.value = image;
                // Rive will automatically clean this up. But it's good practice to dispose this manually
                // after you have already set the decoded image. Don't call `unref` if you intend
                // to use the decoded asset again.
                image.unref();
            });
        }
    });
    
    return [riveInstance, $eventCanvas[0]];
}

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