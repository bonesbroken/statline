import $ from "jquery";
import equals from 'is-equal-shallow';
import { defaultUserSettings, appVersion } from './utils.js';

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
let streamlabs, streamlabsOBS;
let hasAppSource = false;
let activeAppSourceId = 0;
let userAssets = {};
let oldSettings = {};
let appSettings = {};

async function loadElements() {
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
    loadElements();
    init();
});

async function init() {
    streamlabs = window.Streamlabs;
    streamlabs.init({ receiveEvents: true }).then(async (data) => {
        console.log(`${data.profiles.streamlabs.name} data:`, data);
        appSettings = data;

        // load user settings
        initSLDApi();
        await loadUserSettings();
        $('#app-version').text(`v${appVersion}`);
    });

    streamlabs.onChatMessage(event => {
        console.log('chat message', event);
        //let message = event.body;
        if(toggleChatControl) {
            let message = event.body;


            if (message.toLowerCase() == 'up') { 
                upKeyUp = true; 
                upKey.material = activeUpKeyMaterial;
                setTimeout(() => {
                    upKeyUp = false; 
                    upKey.material = upKeyMaterial;
                }, keyDelay);
            }
            if (message.toLowerCase() == 'left') { 
                leftKeyUp = true; 
                leftKey.material = activeLeftKeyMaterial;
                setTimeout(() => {
                    leftKeyUp = false; 
                    leftKey.material = leftKeyMaterial;
                }, keyDelay);
            }
            if (message.toLowerCase() == 'down') { 
                downKeyUp = true; 
                downKey.material = activeDownKeyMaterial;
                setTimeout(() => {
                    downKeyUp = false; 
                    downKey.material = downKeyMaterial;
                }, keyDelay);
            }
            if (message.toLowerCase() == 'right') { 
                rightKeyUp = true; 
                rightKey.material = activeRightKeyMaterial;
                setTimeout(() => {
                    rightKeyUp = false; 
                    rightKey.material = rightKeyMaterial;
                }, keyDelay);
            }
            if (message.toLowerCase() == 'jump' || message.toLowerCase() == 'space') { 
                spaceKey.material = activeSpaceKeyMaterial;
                spaceKeyUp = true;
                setTimeout(() => {
                    spaceKeyUp = false;
                    spaceKey.material = spaceKeyMaterial;
                }, keyDelay);
            }
            if (message.toLowerCase() == 'shift') { 
                if(shiftKey)
                    shiftKey.material = activeShiftKeyMaterial;
                shiftKeyUp = true;
                setTimeout(() => {
                    shiftKeyUp = false;
                    if(shiftKey)
                        shiftKey.material = shiftKeyMaterial;
                }, keyDelay);
            }
            if (message.toLowerCase() == 'ctrl') { 
                if(ctrlKey)
                    ctrlKey.material = activeCtrlKeyMaterial;
                ctrlKeyUp = true;
                setTimeout(() => {
                    ctrlKeyUp = false;
                    if(ctrlKey)
                        ctrlKey.material = ctrlKeyMaterial;
                }, keyDelay);
            }
        }
    });

    streamlabs.onMessage(event => {
        if(event.type == "updateKeyTrak")
            return;

    });

    streamlabs.onFollow(event => {});

    streamlabs.onSubscription(event => {
    });

    streamlabs.onDonation(event => {
    });

    streamlabs.onBits(event => {
    });

    /*
    streamlabs.onRaid(event => {
        if(appSettings["onRaid"]) {
            lastEventMessage = `${event.message[0].name} raided with ${event.message[0].raiders}!`;
            Keyboard.updateDisplay("event", eventDisplayObj, lastEventMessage, appSettings["Event Display Color"]);
        }
    });

    streamlabs.onMerch(event => {
        if(appSettings["onMerch"]) {
            lastEventMessage = `${event.message[0].from} bought ${event.message[0].product}!`;
            Keyboard.updateDisplay("event", eventDisplayObj, lastEventMessage, appSettings["Event Display Color"]);
        }
    });

    streamlabs.onSuperchat(event => {
        if(appSettings["onSuperchat"]) {
            lastEventMessage = `${event.message[0].name} Super Chat ${event.message[0].displayString}!`;
            Keyboard.updateDisplay("event", eventDisplayObj, lastEventMessage, appSettings["Event Display Color"]);
        }
    });

    */
}

function initSLDApi() {
    streamlabsOBS = window.streamlabsOBS;
    streamlabsOBS.apiReady.then(() => {
        // Vision Module
        console.log(streamlabsOBS);
        console.log(streamlabsOBS.v1.Vision);
        streamlabsOBS.v1.Vision.initiateSubscription();

        streamlabsOBS.v1.Vision.userStateTree(userStateTree => {
            console.log('user state tree', userStateTree);
        });

        streamlabsOBS.v1.Vision.userState(userState => {
            console.log('user state', userState);
        });

        streamlabsOBS.v1.Vision.visionEvent(visionEventsPayload => {
            console.log('vision event', visionEventsPayload);
        });

        streamlabsOBS.v1.Sources.getSources().then(sources => { // check if app source exists in scene collection
            sources.forEach(source => { 
                if(source.type == "browser_source" && source.appSourceId == "basic_app_source") {
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

            if(!hasAppSource && source.appSourceId == "basic_app_source") {
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

async function loadUserSettings() {
    streamlabs.userSettings.get('basic-app-settings').then(data => {

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

function updateAddAppSourceButton(hasSource) {
    if(hasSource) {
        $('#addAppSource').prop("disabled", hasSource);
        $('#addAppSource').text("Basic App Source added.");
        $('#addAppSource').parent().attr('content', 'Basic App Source is in your scene.');
    } else {
        $('#addAppSource').prop("disabled", false);
        $('#addAppSource').text("Add Basic App Source");
        $('#addAppSource').parent().attr('content', 'Click to add the Basic App Source in your scene.');
    }
}

// event handlers
$("#app-link").on('click', () => { streamlabsOBS.v1.External.openExternalLink('https://bonesbroken.com/keyboard-overlay-app/'); });
$(".button-unsaved").on('click', () => { saveChanges(); });

$("#addAppSource").on('click', () => { 
    streamlabsOBS.v1.Scenes.getActiveScene().then(scene => {
        streamlabsOBS.v1.Sources.createAppSource('Basic App Source', 'basic_app_source').then(source => {
            streamlabsOBS.v1.Scenes.createSceneItem(scene.id, source.id);
        });
    });
});





$("#getActiveProcess").on('click', () => { 
    streamlabsOBS.v1.Vision.requestActiveProcess().then(response => {
        console.log('active process', response); 
    });
});













function showUnsavedChanges() {
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
        streamlabs.userSettings.set('basic-app-settings', appSettings).then(() => {
            showAlert('#userSettingsUpdated', `Your changes have been saved`, 'Your settings have been updated.');
            $(".button-saved").show();
            $(".button-unsaved").hide();

            streamlabs.userSettings.getAssets().then(response => { 
                userAssets = response;
                streamlabs.postMessage('updateTheme', appSettings);
            });
        });
        oldSettings = structuredClone(appSettings);
    }
}

function showAlert(element, title, content) {
    $(element)[0].show();
    $(element).find('.alert-title').text(title);
    $(element).find('.alert-content').text(content);
}

$('#onSubscription').on('sl-change', event => {
    settings["onSubscription"] = event.target.checked;
    showUnsavedChanges();
});

$('#onDonation').on('sl-change', event => {
    settings["onDonation"] = event.target.checked;
    showUnsavedChanges();
});

$('#onBits').on('sl-change', event => {
    settings["onBits"] = event.target.checked;
    showUnsavedChanges();
});

$('#onRaid').on('sl-change', event => {
    settings["onRaid"] = event.target.checked;
    showUnsavedChanges();
});

$('#onMerch').on('sl-change', event => {
    settings["onMerch"] = event.target.checked;
    showUnsavedChanges();
});

$('#onSuperchat').on('sl-change', event => {
    settings["onSuperchat"] = event.target.checked;
    showUnsavedChanges();
});

function startFakeChat(minDuration, maxDuration) {
    let fakeChatMessages = ["got it!!", "HEy!", "YOOO", "oof", "ehh", "cool!", "ok!", "huh?", "dude why", "sup?", "HAHA", "jump!", "up?", "left!1!", "down.", "down", "DOWN!", "UP!!", "right?", "RIGHT!", "real", "REAL", "LOL", "meh", "ha", "heh.", "wut", "why", "k dude", "watev", "k", "xDD", "n1 :)", "gg <3", "gg wp" ];
    let fakeChatUsernames = ["sly", "geo", "orgo", "Luna", "FLUX", "fury", "fox", "pulsE", "corn", "josh", "jane", "hails"];
    
    chatTimer = setInterval(() => {
        const rChat = fakeChatMessages[Math.floor(Math.random() * fakeChatMessages.length)];
        const rUser = fakeChatUsernames[Math.floor(Math.random() * fakeChatUsernames.length)];

        lastChatMessage = `${rUser}: ${rChat}`;
        Keyboard.updateDisplay("chat", chatDisplayObj, lastChatMessage, settings["Chat Display Color"]);

    }, Math.random() * ((maxDuration * 1000) - (minDuration * 1000)) + (minDuration * 1000));
}

function stopFakeChat() {
    clearInterval(chatTimer);
}