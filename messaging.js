import {
    getDBEntrees,
    updateDBEntry,
    deleteDBEntry,
    isSuperUser,
    // listAll,
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
setInterval(getMessages, 30000);
async function getMessages() {
    const messageResponse = await getDBEntrees(SYSTEM_SCHEMA, MESSAGES_TABLE, "station", stationName, serverSettings);
    if ((!messageResponse) || (messageResponse.error) || (messageResponse.length < 1)) return true;
  
    messageResponse.forEach(async (message) => {
        if (message.displayed) return;

        addMessageToBody(message.text, message.sender);
 
        message.displayed = true;
        await updateDBEntry(SYSTEM_SCHEMA, MESSAGES_TABLE, message, serverSettings);
    });
}

// showAllMessages();
export async function showAllMessages() {
    // const response = await listAll(serverSettings)
    // console.log(response);

    // return
    const superUser = await isSuperUser(serverSettings);

    const tableSearchParameter = superUser ? "*" : stationName;

    const messageResponse = await getDBEntrees(SYSTEM_SCHEMA, MESSAGES_TABLE, "station", tableSearchParameter, serverSettings);
    if ((!messageResponse) || (messageResponse.error) || (messageResponse.length < 1)) return true;


    messageResponse.sort((a, b) => {
        const nameA = String(a.date).toUpperCase();
        const nameB = String(b.date).toUpperCase();
        if (nameA < nameB) return 1;
        if (nameA > nameB) return -1;
        return 0;
    });

    const body = document.querySelector('body');
    const messageBackground = document.createElement("div");
    const messageWindow = document.createElement("div");
    const messageLabel = document.createElement("label");
    const messageTable = document.createElement("table");
    const messageHeaderRow = document.createElement("tr");
    const messageHeaderDate = document.createElement("th");
    const messageHeaderFromTo = document.createElement("th");
    const messageHeaderMessage = document.createElement("th");
    const closeButton = document.createElement("button");

    messageBackground.classList.add("message-modal-background");
    messageWindow.classList.add("message-modal-window");
    messageLabel.classList.add("message-modal-alert-label");
    messageTable.classList.add("message-table");
    messageHeaderRow.classList.add("message-table-row");
    messageHeaderDate.classList.add("message-table-header");
    messageHeaderFromTo.classList.add("message-table-header");
    messageHeaderMessage.classList.add("message-table-header");
    closeButton.classList.add("message-modal-button");

    messageLabel.textContent = "Messages";
    messageHeaderDate.textContent = "Date";
    messageHeaderFromTo.textContent = superUser ? "From/To" : "From";
    messageHeaderMessage.textContent = "Message";
    closeButton.textContent = "Close";

    closeButton.addEventListener("click", async () => {
        body.removeChild(messageBackground);
    });
    
    messageHeaderRow.appendChild(messageHeaderDate);
    messageHeaderRow.appendChild(messageHeaderFromTo);
    messageHeaderRow.appendChild(messageHeaderMessage);
    messageTable.appendChild(messageHeaderRow);

    messageResponse.forEach((message) => {
        const messageRow = document.createElement("tr");
        const messageDate = document.createElement("td");
        const fromTo = document.createElement("td");
        const messageText = document.createElement("td");
        const deleteMessage = document.createElement("td");

        messageRow.classList.add("message-table-row");
        messageDate.classList.add("message-table-data");
        fromTo.classList.add("message-table-data");
        messageText.classList.add("message-table-data");
        deleteMessage.classList.add("message-table-data");
        deleteMessage.classList.add("message-table-delete");

        messageDate.textContent = message.date;
        fromTo.textContent = superUser ? `${message.sender} ➛ ${message.station}` : message.sender;
        messageText.textContent = message.text;
        deleteMessage.textContent = "x";

        messageRow.appendChild(messageDate);
        messageRow.appendChild(fromTo);
        messageRow.appendChild(messageText);
        if (superUser) messageRow.appendChild(deleteMessage);

        messageRow.onclick = () => {addMessageToBody(message.text, message.sender)}

        deleteMessage.onclick = async (event) => {
            event.stopPropagation();
            await deleteDBEntry(SYSTEM_SCHEMA, MESSAGES_TABLE, message.id, serverSettings);
            messageTable.removeChild(messageRow);
        }

        messageTable.appendChild(messageRow);
    });
    
    messageBackground.appendChild(messageWindow);
    messageWindow.appendChild(messageLabel);
    messageWindow.appendChild(messageTable);
    messageWindow.appendChild(closeButton);
    body.appendChild(messageBackground);
}

function addMessageToBody(text, sender) {
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

    messageLabel.textContent = `Message from ${sender}`;
    messageText.textContent = text;
    OKButton.textContent = "OK";

    OKButton.addEventListener("click", async () => {
        body.removeChild(messageBackground);
    });
    
    messageBackground.appendChild(messageWindow);
    messageWindow.appendChild(messageLabel);
    messageWindow.appendChild(messageText);
    messageWindow.appendChild(buttonGroup);
    buttonGroup.appendChild(OKButton);
    body.appendChild(messageBackground);
    
    OKButton.focus();
}

function getLocalStorageValue(key) {
    if (window.localStorage[key])
        return JSON.parse(window.localStorage.getItem(key));
}