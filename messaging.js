import {
    getDBEntrees,
    updateDBEntry,
    deleteDBEntry,
} from "../db-utilities.js";

import {
    SYSTEM_SCHEMA,
    MESSAGES_TABLE,
} from "../directives.js";


const serverSettings = {
    url: "",
    authorization: ""
}

let stationName = "";

// Retrieve settings values
serverSettings.url = getLocalStorageValue('serverURL') || "";
serverSettings.authorization = getLocalStorageValue('serverAuthorization') || "";
stationName = getLocalStorageValue('stationName') || "";

getMessages();
setInterval(getMessages, 10000);
async function getMessages() {
    const messageResponse = await getDBEntrees(SYSTEM_SCHEMA, MESSAGES_TABLE, "station", stationName, serverSettings);
    if ((!messageResponse) || (messageResponse.error) || (messageResponse.length < 1)) return true;
  
    messageResponse.forEach(async (message) => {
        if (message.displayed) return;

        const body = document.querySelector('body');
        const messageBackground = document.createElement("div");
        const messageWindow = document.createElement("div");
        const messageLabel = document.createElement("label");
        const messageText = document.createElement("p");
        const buttonGroup = document.createElement("div");
        const OKButton = document.createElement("button");

        messageBackground.classList.add("message-modal-background");
        messageWindow.classList.add("message-modal-window");
        messageLabel.classList.add("message-modal-alert-label");
        messageText.classList.add("message-alert-message");
        buttonGroup.classList.add("message-modal-button-group");
        OKButton.classList.add("message-modal-button");

        messageLabel.textContent = "Message";
        messageText.textContent = message.text;
        OKButton.textContent = "OK";

        OKButton.addEventListener("click", async (event) => {
            body.removeChild(messageBackground);
        });
        
        messageBackground.appendChild(messageWindow);
        messageWindow.appendChild(messageLabel);
        messageWindow.appendChild(messageText);
        messageWindow.appendChild(buttonGroup);
        buttonGroup.appendChild(OKButton);
        body.appendChild(messageBackground);
        
        OKButton.focus();
 
        message.displayed = true;
        await updateDBEntry(SYSTEM_SCHEMA, MESSAGES_TABLE, message, serverSettings);
    });
    
}

function getLocalStorageValue(key) {
    if (window.localStorage[key])
        return JSON.parse(window.localStorage.getItem(key));
}