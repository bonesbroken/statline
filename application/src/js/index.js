import $ from "jquery";
import equals from 'is-equal-shallow';

import '@shoelace-style/shoelace/dist/themes/dark.css';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
setBasePath('./shoelace');

// streamlabs api variables
let username, streamlabs;
let settings = {};
let appSettings = {};

$(function() {
    init();
});

async function init() {
    // streamlabs api initialization
    streamlabs = window.Streamlabs;
    streamlabs.init({ receiveEvents: true }).then(async (data) => {
        appSettings = data;
        username = appSettings.profiles.streamlabs.name;

        await loadUserSettings();
    });

    streamlabs.onMessage(event => {
        switch(event.type) {
            case 'updateTheme':
                settings = event.data;
                updateTheme();
                break;
                
            default:
                console.log("streamlabs.onMessage()");
        }
    });

    streamlabs.onError(event => { 
        streamlabs.postMessage('error', event.data);
    });
}

async function loadUserSettings() {
    streamlabs.userSettings.get('statline-settings').then(data => {
        console.log('loading user settings...', data);

        if (!data) {
            console.log("no settings found, reverting to default")
            data = Keyboard.defaultSettings;
        }
        if (typeof data == "object") {

            // check for missing values
            for (const [key, value] of Object.entries(Keyboard.defaultSettings)) {
                if(!data.hasOwnProperty(key)) {
                    console.log(`setting '${key}' missing! set to ${value}`);
                    data[key] = Keyboard.defaultSettings[key];
                }
            }
            settings = structuredClone(data);
            settings['keyboard-logo'] = "";
        }
    });

    streamlabs.userSettings.getAssets().then(response => { 
        customAssets = response;
        saveCustomTextures();
        console.log('=== LOADED CUSTOM ASSETS ===');
    });

    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('loadUserSettings()');
            resolve();
        }, 1000);
    });
}
