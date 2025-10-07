import $ from "jquery";
import { defaultUserSettings, createEvent } from './utils.js';

// streamlabs api variables
let streamlabs;
let userAssets = {};
let appSettings = {};
let riveInstances = [];
let lastEventTime = Date.now();
let _hideTimeoutId = null;

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

    let childCount = $canvasList.children().length;

    // If we're already at or above the max, remove the oldest before appending
    const max = Number(appSettings && appSettings["maxEvents"]) || 0;
    if (max > 0 && childCount >= max) {
        // remove as many as needed to make room for one new item (usually 1)
        const removeCount = childCount - (max - 1);
        for (let i = 0; i < removeCount; i++) {
            // remove oldest DOM canvas
            const $old = $canvasList.children().first();
            if ($old.length) $old.remove();

            // remove corresponding Rive instance from the queue and clean up
            const oldInst = riveInstances.shift();
            if (oldInst && typeof oldInst.cleanup === 'function') {
                oldInst.cleanup();
            }
        }
        // refresh count
        childCount = $canvasList.children().length;
    }

    // If canvas list is currently hidden (opacity 0 or has fade-out), bring it back in
    const currentOpacity = parseFloat($canvasList.css('opacity') || '1');
    if (currentOpacity === 0 || $canvasList.hasClass('fade-out')) {
        fadeInCanvasList();
    }

    let eventItem = createEvent({
        game: gameKey,
        event: eventName,
        time: eventTime,
        showEventTime: appSettings["showEventTime"],
        color1: appSettings["color1"],
        color2: appSettings["color2"]
    });

    // keep track of the created Rive instance so we can clean it up later
    if (eventItem) {
        riveInstances.push(eventItem[0]);
        $canvasList[0].append(eventItem[1]);
    }

    // reset/have the hide timer start counting again after this event
    resetCanvasListHideTimer();
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

/**
 * Fade helpers for #canvasList
 */
function fadeInCanvasList() {
    const $el = $('#canvasList');
    if (!$el.length) return;
    $el.off('animationend.fade');
    $el.removeClass('fade-out');
    $el.addClass('fade-in');
    // ensure final state stays visible
    $el.on('animationend.fade', () => {
        $el.css('opacity', '1');
        $el.removeClass('fade-in');
        $el.off('animationend.fade');
    });
}

function fadeOutCanvasList() {
    const $el = $('#canvasList');
    if (!$el.length) return;
    $el.off('animationend.fade');
    $el.removeClass('fade-in');
    $el.addClass('fade-out');
    $el.on('animationend.fade', () => {
        // keep hidden after animation
        $el.css('opacity', '0');
        $el.removeClass('fade-out');
        $el.off('animationend.fade');

        // cleanup all rive instances
        try {
            while (riveInstances.length) {
                const inst = riveInstances.shift();
                if (!inst) continue;
                if (typeof inst.cleanup === 'function') {
                    inst.cleanup();
                }
            }
        } catch (err) {
            console.error('Error cleaning up riveInstances', err);
        }

        // remove all child elements from the canvas list
        $el.empty();
    });
}

/**
 * Start/reset hide timer based on appSettings.hideTime.
 * If hideTime === 0 the canvas list is always visible.
 */
function resetCanvasListHideTimer() {
    const $el = $('#canvasList');
    if (!$el.length) return;

    // read authoritative value from appSettings
    const ht = Number(appSettings && appSettings["hideTime"]) || 0;
    // clear existing timer
    if (_hideTimeoutId) {
        clearTimeout(_hideTimeoutId);
        _hideTimeoutId = null;
    }

    if (ht === 0) {
        // always visible
        $el.css('opacity', '1');
        $el.removeClass('fade-out fade-in');
        return;
    }

    // ensure visible now (in case we just fired an event)
    $el.css('opacity', '1');

    // schedule fade out after ht seconds
    _hideTimeoutId = setTimeout(() => {
        fadeOutCanvasList();
        _hideTimeoutId = null;
    }, ht * 1000);
}