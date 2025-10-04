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

    /*
    streamlabs.onMessage(event => {
        switch(event.type) {
            case 'updateTheme':
                settings = event.data;
                updateTheme();
                watchDisplayTimer();
                break;
            case 'updateKeyTrak':
                keyPressCounter = event.data["count"];
                Keyboard.updateDisplay("keytrak", keyTrakObj, keyPressCounter, settings["KeyTrak Color"]);
                break;

            case 'toggleChatControl':
                toggleChatControl = event.data["enabled"];
                break;

            case 'dismissChangelog':
                //$('#info-icon').hide();
                break;

            case 'updateCameraAngle':
                cameraControls.setPosition(event.data.x, event.data.y, event.data.z, true);
            break;
                
            default:
                console.log("streamlabs.onMessage()");
        }
    });

    streamlabs.onChatMessage(event => {
        let keyDelay = 750;
        if(toggleChatControl) {
            let message = event.body;

            if (message.toLowerCase() == 'w' || message == 'ArrowUp' || message.toLowerCase() == 'up') { 
                upKeyUp = true; 
                upKey.material = activeUpKeyMaterial;
                setTimeout(() => {
                    upKeyUp = false; 
                    upKey.material = upKeyMaterial;
                }, keyDelay);
            }
            if (message.toLowerCase() == 'a' || message == 'ArrowLeft' || message.toLowerCase() == 'left') { 
                leftKeyUp = true; 
                leftKey.material = activeLeftKeyMaterial;
                setTimeout(() => {
                    leftKeyUp = false; 
                    leftKey.material = leftKeyMaterial;
                }, keyDelay);
            }
            if (message.toLowerCase() == 's' || message == 'ArrowDown' || message.toLowerCase() == 'down') { 
                downKeyUp = true; 
                downKey.material = activeDownKeyMaterial;
                setTimeout(() => {
                    downKeyUp = false; 
                    downKey.material = downKeyMaterial;
                }, keyDelay);
            }
            if (message.toLowerCase() == 'd' || message == 'ArrowRight' || message.toLowerCase() == 'right') { 
                rightKeyUp = true; 
                rightKey.material = activeRightKeyMaterial;
                setTimeout(() => {
                    rightKeyUp = false; 
                    rightKey.material = rightKeyMaterial;
                }, keyDelay);
            }
            if (message.toLowerCase() == 'jump' || message.toLowerCase() == 'space') { 
                spaceKey.material = activeSpaceKeyMaterial;
                keyPressed[' '] = true;
                setTimeout(() => {
                    keyPressed[' '] = false;
                    spaceKey.material = spaceKeyMaterial;
                }, keyDelay);
            }
            if (message.toLowerCase() == 'crouch' || message.toLowerCase() == 'ctrl') { 
                ctrlKey.material = activeCtrlKeyMaterial;
                keyPressed[' '] = true;
                setTimeout(() => {
                    keyPressed[' '] = false;
                    ctrlKey.material = ctrlKeyMaterial;
                }, keyDelay);
            }
            if (message.toLowerCase() == 'sneak' || message.toLowerCase() == 'shift') { 
                shiftKey.material = activeShiftKeyMaterial;
                keyPressed[' '] = true;
                setTimeout(() => {
                    keyPressed[' '] = false;
                    shiftKey.material = shiftKeyMaterial;
                }, keyDelay);
            }
        }

        if (settings["Enable Chat Display"]) {
            lastChatMessage = `${event.from}: ${event.body.slice(0,25)}`;
            Keyboard.updateDisplay("chat", chatDisplayObj, lastChatMessage, settings["Chat Display Color"]);
        }
    });

    streamlabs.onFollow(event => {
        if(settings["onFollow"]) {
            lastEventMessage = `${event.message[0].name} followed!`;
            Keyboard.updateDisplay("event", eventDisplayObj, lastEventMessage, settings["Event Display Color"]);
        }
    });

    streamlabs.onSubscription(event => {
        if(settings["onSubscription"]) {
            lastEventMessage = `${event.message[0].name} subscribed! ${event.message[0].months}x`;
            Keyboard.updateDisplay("event", eventDisplayObj, lastEventMessage, settings["Event Display Color"]);
        }
    });

    streamlabs.onDonation(event => {
        if(settings["onDonation"]) {
            lastEventMessage = `${event.message[0].from} tipped ${event.message[0].formattedAmount}!`;
            Keyboard.updateDisplay("event", eventDisplayObj, lastEventMessage, settings["Event Display Color"]);
        }
    });

    streamlabs.onBits(event => {
        if(settings["onBits"]) {
            lastEventMessage = `${event.message[0].name} cheered! ${event.message[0].amount}x`;
            Keyboard.updateDisplay("event", eventDisplayObj, lastEventMessage, settings["Event Display Color"]);
        }
    });

    streamlabs.onRaid(event => {
        if(settings["onRaid"]) {
            lastEventMessage = `${event.message[0].name} raided with ${event.message[0].raiders}!`;
            Keyboard.updateDisplay("event", eventDisplayObj, lastEventMessage, settings["Event Display Color"]);
        }
    });

    streamlabs.onMerch(event => {
        if(settings["onMerch"]) {
            lastEventMessage = `${event.message[0].from} bought ${event.message[0].product}!`;
            Keyboard.updateDisplay("event", eventDisplayObj, lastEventMessage, settings["Event Display Color"]);
        }
    });

    streamlabs.onSuperchat(event => {
        if(settings["onSuperchat"]) {
            lastEventMessage = `${event.message[0].name} Super Chat ${event.message[0].displayString}!`;
            Keyboard.updateDisplay("event", eventDisplayObj, lastEventMessage, settings["Event Display Color"]);
        }
    });

    streamlabs.onStreamlabels(event => {
        if (settings["Enable Stream Label Display"]) {
            let key = settings["Active Stream Label"];
            lastStreamLabelMessage = event.message.data[key];
            Keyboard.updateDisplay("streamlabel", streamLabelDisplayObj, lastStreamLabelMessage, settings["Stream Label Display Color"]);
        }
    });
    */

    streamlabs.onError(event => { 
        streamlabs.postMessage('error', event.data);
    });
}

async function loadUserSettings() {
    streamlabs.userSettings.get('basic-app-settings').then(data => {
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
