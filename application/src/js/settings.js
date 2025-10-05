import $ from "jquery";
import equals from 'is-equal-shallow';
import { defaultUserSettings, appVersion, getGameName, getGameEvents, humanizeEventName, createEvent } from './utils.js';

import '@shoelace-style/shoelace/dist/themes/dark.css';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/rating/rating.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@shoelace-style/shoelace/dist/components/breadcrumb/breadcrumb.js';
import '@shoelace-style/shoelace/dist/components/breadcrumb-item/breadcrumb-item.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/color-picker/color-picker.js';
import '@shoelace-style/shoelace/dist/components/range/range.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/switch/switch.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/details/details.js';
import '@shoelace-style/shoelace/dist/components/radio/radio.js';
import '@shoelace-style/shoelace/dist/components/radio-button/radio-button.js';
import '@shoelace-style/shoelace/dist/components/radio-group/radio-group.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js';
import '@shoelace-style/shoelace/dist/components/tree/tree.js';
import '@shoelace-style/shoelace/dist/components/tree-item/tree-item.js';
import '@shoelace-style/shoelace/dist/components/carousel/carousel.js';
import '@shoelace-style/shoelace/dist/components/carousel-item/carousel-item.js';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
setBasePath('./shoelace');

// streamlabs api variables
let streamlabs, streamlabsOBS, activeGameName;
let hasAppSource = false;
let visionStarted = false;
let activeGame = false;
let activeAppSourceId = 0;
let userAssets = {};
let oldSettings = {};
let appSettings = {};
let activeProcessInterval = null;
const pollingRate = 6000; // ms
let lastEventTime = Date.now();

async function loadShoelaceElements() {
    await Promise.allSettled([
        customElements.whenDefined('sl-range'),
        customElements.whenDefined('sl-icon'),
        customElements.whenDefined('sl-checkbox'),
        customElements.whenDefined('sl-dialog'),
        customElements.whenDefined('sl-select'),
        customElements.whenDefined('sl-divider'),
        customElements.whenDefined('sl-details'),
        customElements.whenDefined('sl-switch'),
        customElements.whenDefined('sl-range'),
        customElements.whenDefined('sl-tab'),
        customElements.whenDefined('sl-carousel')
    ]);
}

$(function() {
    loadShoelaceElements();
    initApp();
});

async function initApp() {
    streamlabs = window.Streamlabs;
    streamlabs.init({ receiveEvents: true }).then(async (data) => {
        console.log(`${data.profiles.streamlabs.name} data:`, data);

        await loadUserSettings();
        updateUI();
        
        initDesktopAPI();
    });
}

function updateUI() {
    $('#app-version').text(`v${appVersion}`);
    $('#maxEvents')[0].value = appSettings["maxEvents"];
    $('#showEventCount').prop("checked", appSettings["showEventCount"]);
    $('#showEventTime').prop("checked", appSettings["showEventTime"]);
    $('#color1').val(appSettings["color1"]);
    $('#color2').val(appSettings["color2"]);

    const map = defaultUserSettings && defaultUserSettings.GAME_EVENTS_MAP;
    const games = map ? Object.keys(map) : [];
    if (games.length) {
        const $select = $('#gameSelect');
        games.forEach(game => {
            $select.append(`<sl-option value="${game}">${getGameName(game)}</sl-option>`);
        });
        if(appSettings['lastActiveGame']) {
            $select.val(appSettings['lastActiveGame']);
            loadGameEvents(appSettings['lastActiveGame']);
        }
    }
}

function initDesktopAPI() {
    streamlabsOBS = window.streamlabsOBS;
    streamlabsOBS.apiReady.then(() => {
        
        streamlabsOBS.v1.Vision.initiateSubscription(); // Vision Module
        if (typeof startActiveProcessPolling === 'function') {
            startActiveProcessPolling(pollingRate);
        }

        streamlabsOBS.v1.Vision.userStateTree(userStateTree => {
            console.log('user state tree', userStateTree);
        });

        streamlabsOBS.v1.Vision.userState(userState => {
            console.log('user state', userState);
        });

        streamlabsOBS.v1.Vision.visionEvent(visionEventsPayload => {
            console.log('vision event', visionEventsPayload);
            /*
            {
                "vision_event_id": "81bb9aa8-af91-444b-aec6-7a001e54c7a2",
                "game": "battlefield_6",
                "events": [
                    {
                        "name": "elimination",
                        "data": []
                    }
                ],
                "timestamp": 1759564250112,
                "event_meta": {
                    "isTest": false,
                    "isPreview": false,
                    "isRollback": false
                }
            }
            */
            if (visionEventsPayload && visionEventsPayload.game && Array.isArray(visionEventsPayload.events) && visionEventsPayload.events.length > 0) {
                const gameKey = visionEventsPayload.game;
                const $eventList = $('#eventList');
                
                visionEventsPayload.events.forEach(event => {
                    //console.log('vision event', event);
                    const eventName = (event && event.name) ? event.name : String(event);

                    const userMap = appSettings && appSettings.GAME_EVENTS_MAP && appSettings.GAME_EVENTS_MAP[gameKey];
                    const enabled = (userMap && userMap[eventName] === true);
                    //console.log(`event ${eventName} enabled: ${enabled}`);
                    if (enabled) {
                        fireGameEvent(gameKey, eventName, visionEventsPayload.timestamp);
                        streamlabs.postMessage('fireGameEvent', {gameKey: gameKey, eventName: eventName, time: visionEventsPayload.timestamp});
                    }

                });
            }
        });

        streamlabsOBS.v1.Sources.getSources().then(sources => { // check if app source exists in scene collection
            sources.forEach(source => {
                if (source.type == "browser_source" && source.appSourceId == "statline_source") {
                    hasAppSource = true;
                    activeAppSourceId = source.id;
                    console.log(`App source found: ${hasAppSource}, ${activeAppSourceId}`);
                    updateAddAppSourceButton(hasAppSource);
                }
            });
    
            if(!hasAppSource) {
                updateAddAppSourceButton(hasAppSource);
            }
        });
    
        streamlabsOBS.v1.Sources.sourceAdded(source => {
            if(hasAppSource)  {// existing source in scene
                console.log('existing app source found, returning');
                return;
            }

            if(!hasAppSource && source.appSourceId == "statline_source") {
                hasAppSource = true;
                activeAppSourceId = source.id;
                console.log("new app source added", hasAppSource, activeAppSourceId);
                updateAddAppSourceButton(hasAppSource);
            }
        });
    
        streamlabsOBS.v1.Sources.sourceRemoved(id => {
            if(activeAppSourceId == id) {
                console.log('source removed', id)
                hasAppSource = false;
                updateAddAppSourceButton(hasAppSource);

            }
        });

    });
}

$('#randomEvent').on('click', () => {
    const $gameSelect = $('#gameSelect');
    const chosenGame = $gameSelect.length ? $gameSelect.val() : getRandomGame();
    const chosenEvent = getRandomEvent(chosenGame);

    if (chosenGame && chosenEvent) {
        console.log(`firing random event: ${chosenGame} - ${chosenEvent}`);
        fireGameEvent(chosenGame, chosenEvent, Date.now());
        //streamlabs.postMessage('fireGameEvent', {gameKey: chosenGame, eventName: chosenEvent, time: Date.now()});
    } else {
        console.warn('No game or event available for randomEvent');
    }

});

// helper: pick a random game key from defaultUserSettings.GAME_EVENTS_MAP
function getRandomGame() {
    const map = defaultUserSettings && defaultUserSettings.GAME_EVENTS_MAP;
    if (!map || typeof map !== 'object') return null;
    const keys = Object.keys(map);
    if (!keys.length) return null;
    return keys[Math.floor(Math.random() * keys.length)];
}

// helper: pick a random event key for a given gameName using defaultUserSettings.GAME_EVENTS_MAP
function getRandomEvent(gameName) {
    if (!gameName) return null;
    const defaultMap = defaultUserSettings && defaultUserSettings.GAME_EVENTS_MAP && defaultUserSettings.GAME_EVENTS_MAP[gameName];
    let keys = [];
    if (defaultMap && typeof defaultMap === 'object') {
        keys = Object.keys(defaultMap);
    }
    // fallback to getGameEvents list if no default map present
    if (!keys.length) {
        const list = getGameEvents(gameName) || [];
        keys = list;
    }
    if (!keys.length) return null;
    return keys[Math.floor(Math.random() * keys.length)];
}

function fireGameEvent(gameKey, eventName, time) {
    const eventTime = ((time - lastEventTime) / 1000).toFixed(1);
    lastEventTime = time;

    const $canvasList = $('#canvasList');
    if (!$canvasList.length) return; // nothing to do if container missing

    // count only element children (jQuery .children() does this)
    let childCount = $canvasList.children().length;

    // If we're already at or above the max, remove the oldest before appending
    const max = Number(appSettings && appSettings["maxEvents"]) || 0;
    if (max > 0 && childCount >= max) {
        // remove as many as needed to make room for one new item (usually 1)
        const removeCount = childCount - (max - 1);
        for (let i = 0; i < removeCount; i++) {
            $canvasList.children().first().remove();
        }
        // refresh count
        childCount = $canvasList.children().length;
    }

    createEvent({
        parent: $canvasList[0],
        game: gameKey,
        event: eventName,
        time: eventTime,
        showEventTime: appSettings["showEventTime"],
        color1: appSettings["color1"],
        color2: appSettings["color2"]
    });
}

async function loadUserSettings() {
    streamlabs.userSettings.get('statline-settings').then(data => {

        if (!data) {
            data = defaultUserSettings;
            console.log("Loaded default settings.", data)
        }
        if (typeof data == "object") {

            // check for missing values
            for (const [key, value] of Object.entries(defaultUserSettings)) {
                if(!data.hasOwnProperty(key)) {
                    console.log(`setting '${key}' missing! set to ${value}`);
                    data[key] = defaultUserSettings[key];
                }
            }
            oldSettings = structuredClone(data);
            appSettings = structuredClone(data);
            streamlabs.postMessage('updateSettings', appSettings);
        }
        
    });

    streamlabs.userSettings.getAssets().then(response => { 
        userAssets = response;
        if (response && Object.keys(response).length > 0) {
            console.log('User assets loaded:', response);
        }
        
    });

    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('User settings loaded:', appSettings);
            resolve();
        }, 1000);
    });
}

function updateAddAppSourceButton(hasSource) {
    if(hasSource) {
        $('#addAppSource').prop("disabled", hasSource);
        $('#addAppSource').text("StatLine Source added.");
        $('#addAppSource').parent().attr('content', 'StatLine Source is in your scene.');
    } else {
        $('#addAppSource').prop("disabled", false);
        $('#addAppSource').text("Add StatLine Source");
        $('#addAppSource').parent().attr('content', 'Click to add the StatLine Source in your scene.');
    }
}

// event handlers
$("#app-link").on('click', () => { streamlabsOBS.v1.External.openExternalLink('https://bonesbroken.com/'); });
$("#x-link").on('click', () => { streamlabsOBS.v1.External.openExternalLink('https://x.com/bonesbrokencom'); });
$("#discord-link").on('click', () => { streamlabsOBS.v1.External.openExternalLink('https://discord.gg/XgZKP9nYU7'); });
$("#tutorial-link").on('click', () => { streamlabsOBS.v1.External.openExternalLink('https://youtu.be/945x5hozkq8'); });

$(".button-unsaved").on('click', () => { saveChanges(); });

$("#addAppSource").on('click', () => { 
    streamlabsOBS.v1.Scenes.getActiveScene().then(scene => {
        streamlabsOBS.v1.Sources.createAppSource('StatLine Source', 'statline_source').then(source => {
            streamlabsOBS.v1.Scenes.createSceneItem(scene.id, source.id);
        });
    });
});

$('.sliderInput').off('sl-change');
$('.sliderInput').on('sl-change', event => {
    const val = event.target && event.target.value;
    if (val === undefined) return;
    appSettings[$(event.target).attr('id')] = Number(val);

    streamlabs.userSettings.set('statline-settings', appSettings).then(() => {
        oldSettings = structuredClone(appSettings);
        streamlabs.postMessage('updateSettings', appSettings);

    }).catch(saveErr => {
        console.error('Failed to save setting', saveErr);
        showAlert('#generalAlert', 'Save Error', `Failed to save settings: ${saveErr && saveErr.message ? saveErr.message : String(saveErr)}`);
    });
});

$('.checkboxInput').off('sl-change');
$('.checkboxInput').on('sl-change', event => {
    const checked = event.target && event.target.checked;
    if (checked === undefined) return;

    appSettings[$(event.target).attr('id')] = !!checked;

    streamlabs.userSettings.set('statline-settings', appSettings).then(() => {
        oldSettings = structuredClone(appSettings);
        streamlabs.postMessage('updateSettings', appSettings);
    }).catch(saveErr => {
        console.error('Failed to save setting', saveErr);
        showAlert('#generalAlert', 'Save Error', `Failed to save settings: ${saveErr && saveErr.message ? saveErr.message : String(saveErr)}`);
    });
});

$('.colorInput').off('sl-change');
$('.colorInput').on('sl-change', event => {
    const val = event.target && event.target.value;
    if (val === undefined) return;
    appSettings[$(event.target).attr('id')] = val;

    streamlabs.userSettings.set('statline-settings', appSettings).then(() => {
        oldSettings = structuredClone(appSettings);
        streamlabs.postMessage('updateSettings', appSettings);
    }).catch(saveErr => {
        console.error('Failed to save setting', saveErr);
        showAlert('#generalAlert', 'Save Error', `Failed to save settings: ${saveErr && saveErr.message ? saveErr.message : String(saveErr)}`);
    });
});

$("#streamlabsAI").on('click', () => {
    streamlabsOBS.v1.Vision.requestActiveProcess().then(response => {
        //console.log('active process', response);

        if (response && response.game) {
            activeGame = true;
            $('#streamlabsAI > sl-icon').attr('name', 'check-circle');
            $('#streamlabsAI').attr('variant', 'success');
            //showAlert('#generalAlert', 'Active Vision Process', `Current active Vision process: ${response.name}`);
        }

    }).catch(err => {
        //console.error('requestActiveProcess error', err);
        if(err == 'Failed to fetch') { // streamlabs ai is not running
            streamlabsOBS.v1.Vision.startVision();
            activeGame = false;
            visionStarted = true;
            $('#streamlabsAI').prop("disabled", true);
            $('#streamlabsAI').attr('variant', 'warning');
            $('#streamlabsAI > span.label').text("Streamlabs AI running");
            $('#streamlabsAI').parent().attr('content', 'No game detected.');
            $('#streamlabsAI > sl-icon').attr('name', 'exclamation-circle');
        } else if (err && err.result && err.result.detail == 'No active process found') { 
        }
    });
});

function showAlert(element, title, content) {
    $(element)[0].show();
    $(element).find('.alert-title').text(title);
    $(element).find('.alert-content').text(content);
}


// Polling helpers for Vision active process
function startActiveProcessPolling(intervalMs = 5000) {
    if (activeProcessInterval) return; // already polling
    // run immediately then every intervalMs
    checkActiveProcess();
    activeProcessInterval = setInterval(checkActiveProcess, intervalMs);
}

function stopActiveProcessPolling() {
    if (activeProcessInterval) {
        clearInterval(activeProcessInterval);
        activeProcessInterval = null;
    }
}

// run loadGameEvents whenever $('#gameSelect') changes
$('#gameSelect').off('sl-change');
$('#gameSelect').on('sl-change', event => {
    const val = event.target && event.target.value;
    if (!val) return;
    loadGameEvents(val);
});

function loadGameEvents(gameName) {
    // if gameName is provided, select that game in the dropdown
    if (gameName) {
        const $select = $('#gameSelect');
        $select.val(gameName);
    }

    $('sl-details[summary="Enable Game Events"] > span.help-text').text(`Show ${getGameName(gameName)} game events.`);

    const $details = $('sl-details[summary="Enable Game Events"]');
    if (!$details.length) return;

    // ensure appSettings has a GAME_EVENTS_MAP object
    if (!appSettings.GAME_EVENTS_MAP) {
        appSettings.GAME_EVENTS_MAP = structuredClone(defaultUserSettings.GAME_EVENTS_MAP || {});
    }

    // remove any previously generated checkboxes for this game
    $details.find(`sl-checkbox`).remove();

    // prefer the defaults from defaultUserSettings.GAME_EVENTS_MAP, fallback to getGameEvents list
    const defaultMap = (defaultUserSettings && defaultUserSettings.GAME_EVENTS_MAP && defaultUserSettings.GAME_EVENTS_MAP[gameName]) || null;
    const eventKeys = defaultMap ? Object.keys(defaultMap) : getGameEvents(gameName) || [];

    eventKeys.forEach(key => {
        const userChecked = appSettings.GAME_EVENTS_MAP && appSettings.GAME_EVENTS_MAP[gameName] && (appSettings.GAME_EVENTS_MAP[gameName][key] === true);
        const defaultChecked = defaultMap ? !!defaultMap[key] : false;
        const checked = userChecked || defaultChecked;

        const $cb = $(`<sl-checkbox name="gameEvent" id="${gameName}__${key}" data-game="${gameName}" data-event="${key}">${humanizeEventName(key)}</sl-checkbox>`);
        $details.append($cb);
        // set the DOM property for the web component
        const el = $cb.get(0);
        if (el) el.checked = !!checked;
    });

    // delegated handler to persist per-game event checkbox changes
    $details.off('sl-change', 'sl-checkbox[data-game]');
    $details.on('sl-change', 'sl-checkbox[data-game]', event => {
        const tgt = event.target;
        const game = tgt.dataset.game;
        const ev = tgt.dataset.event;
        if (!game || !ev) return;
        if (!appSettings.GAME_EVENTS_MAP) appSettings.GAME_EVENTS_MAP = {};
        if (!appSettings.GAME_EVENTS_MAP[game]) appSettings.GAME_EVENTS_MAP[game] = {};
        appSettings.GAME_EVENTS_MAP[game][ev] = !!tgt.checked;

        // immediately persist the updated settings
        streamlabs.userSettings.set('statline-settings', appSettings).then(() => {
            oldSettings = structuredClone(appSettings);
            streamlabs.postMessage('updateSettings', appSettings);
        }).catch(saveErr => {
            console.error('Failed to save user settings', saveErr);
            showAlert('#generalAlert', 'Save Error', `Failed to save settings: ${saveErr && saveErr.message ? saveErr.message : String(saveErr)}`);
        });
    });
}

async function checkActiveProcess() {
    if (!streamlabsOBS || !streamlabsOBS.v1 || !streamlabsOBS.v1.Vision) return;
    try {
        const response = await streamlabsOBS.v1.Vision.requestActiveProcess();
        console.log('poll active process', response);

        if (response && response.game) {
            if (!activeGame) {
                activeGame = true;
                //
                // keep the UI in sync
                $('#streamlabsAI').prop('disabled', true);
                $('#streamlabsAI > span.label').text('Streamlabs AI running');
                $('#streamlabsAI').parent().attr('content', `${getGameName(response.game)} detected.`);
                $('#streamlabsAI > sl-icon').attr('name', 'check-circle');
                $('#streamlabsAI').attr('variant', 'success');
                //loadGameEvents(response.game);
            } else if(activeGame) {
                if (activeGameName !== response.game) {
                    //activeGameName = response.game;
                    $('#streamlabsAI').parent().attr('content', `${getGameName(response.game)} detected.`);
                    //loadGameEvents(response.game);
                }
            }
            activeGameName = response.game;
            loadGameEvents(activeGameName);
            appSettings['lastActiveGame'] = activeGameName;
            streamlabs.userSettings.set('statline-settings', appSettings).then(() => {
                oldSettings = structuredClone(appSettings);
                streamlabs.postMessage('updateSettings', appSettings);
            });
        }
    } catch (err) {
        //console.error('checkActiveProcess error', err);
        const msg = (err && (err.message || err.toString())) || '';

        if (msg.includes('Failed to fetch')) {
            // Streamlabs AI / Vision service likely not running or not reachable
            if (activeGame) activeGame = false;
            if (visionStarted) visionStarted = false;
            $('#streamlabsAI').prop('disabled', false);
            $('#streamlabsAI > span.label').text('Start Streamlabs AI');
            $('#streamlabsAI').parent().attr('content', 'Streamlabs AI is not running.');
            $('#streamlabsAI > sl-icon').attr('name', 'play-circle');
            $('#streamlabsAI').attr('variant', 'neutral');
        } else if (err && err.result && err.result.detail == 'No active process found') {
            if (activeGame) activeGame = false;
            $('#streamlabsAI').prop('disabled', true);
            $('#streamlabsAI > span.label').text('Streamlabs AI running');
            $('#streamlabsAI').parent().attr('content', 'No game detected.');
            $('#streamlabsAI > sl-icon').attr('name', 'exclamation-circle');
            $('#streamlabsAI').attr('variant', 'warning');
        }
        // swallow other errors to avoid uncaught promise rejections; they are logged above
    }
}

function checkSavedChanges() {
    if (equals(oldSettings, appSettings) == false) {
        $(".button-unsaved").show();
        $("nav").addClass("save-nav");
        $(".button-saved").hide();
    } else {
        $(".button-unsaved").hide();
        $("nav").removeClass("save-nav");
    }
}

function saveChanges() {
    if (equals(oldSettings, appSettings) == false) {
        streamlabs.userSettings.set('statline-settings', appSettings).then(() => {
            
            showAlert('#userSettingsUpdated', `StatLine updated!`, 'Your settings have been saved.');
            $(".button-saved").show();
            $(".button-unsaved").hide();

            streamlabs.userSettings.getAssets().then(response => { 
                userAssets = response;
                streamlabs.postMessage('updateSettings', appSettings);
            });
        });
        oldSettings = structuredClone(appSettings);
    }
}