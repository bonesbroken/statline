import $ from "jquery";
import { defaultUserSettings, appVersion, getGameName, getGameEvents, humanizeEventName, createEvent } from './utils.js';

// streamlabs api variables
let streamlabs;
let userAssets = {};
let oldSettings = {};
let appSettings = {};
let lastEventTime = Date.now();

$(function() {
    initApp();
});

async function initApp() {
    // streamlabs api initialization
    streamlabs = window.Streamlabs;
    streamlabs.init({ receiveEvents: true }).then(async (data) => {
        await loadUserSettings();
    });

    streamlabs.onMessage(event => {
        switch(event.type) {
            case 'updateSettings':
                appSettings = event.data;
                break;
            case 'fireGameEvent':
                console.log(event.data);
                fireGameEvent(event.data['gameKey'], event.data['eventName'], event.data['time']);
                break;
                
            default:
                console.log("streamlabs.onMessage()");
        }
    });

    streamlabs.onError(event => { 
        streamlabs.postMessage('error', event.data);
    });
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
