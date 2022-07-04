import {
    getDBEntrees,
    insertDBEntry,
    updateDBEntry,
    deleteDBEntry,
    createSchema,
    createTable,
    createAttributes,
    describeDatabase,
    getUniqueColumnValues
} from "../db-utilities.js";

import {
    getTableDataWithText,
    getTableDataRow,
    getTableDataWithEditText,
    getTableHeaderRow,
    getTableDataWithCheckbox,
    getTableDataWithDeleteButton
} from "../table-utilities.js";

import {
    INVENTORY_SCHEMA,
    SUPPLY_LIST_TABLE,
    ISSUE_SCHEMA,
    PARTS_ISSUES_TABLE,
    SUPPLY_ISSUES_TABLE,
    TIME_CLOCK_ISSUES_TABLE,
    OTHER_ISSUES_TABLE,
    LOGS_SCHEMA,
    RUNNING_TIMER_TABLE,
    COMPLETED_TIMER_TABLE,
    TIMER_TABLE,
    BUSINESS_SCHEMA,
    EMPLOYEES_TABLE,
    JOBS_TABLE,
    STATIONS_TABLE,
    TABLE_ATTRIBUTES,
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

setInterval(async () => {
    const messageResponse = await getDBEntrees(SYSTEM_SCHEMA, MESSAGES_TABLE, "station", stationName, serverSettings);
    if ((!messageResponse) || (messageResponse.error) || (messageResponse.length < 1)) return true;
    console.log(messageResponse);
    messageResponse.forEach(async (message) => {
        const body = document.querySelector('body');
        const messageBackground = document.createElement("div");
        const messageWindow = document.createElement("div");
        const messageLabel = document.createElement("label");
        const messageText = document.createElement("p");
        const buttonGroup = document.createElement("div");
        const OKButton = document.createElement("button");

        messageBackground.classList.add("modal-background");
        messageWindow.classList.add("modal-window");
        messageLabel.classList.add("modal-alert-label");
        messageText.classList.add("alert-message");
        buttonGroup.classList.add("modal-button-group");
        OKButton.classList.add("modal-button");

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

        await deleteDBEntry(SYSTEM_SCHEMA, MESSAGES_TABLE, message.id, serverSettings);
    });
    
}, 10000);

function getLocalStorageValue(key) {
    if (window.localStorage[key])
        return JSON.parse(window.localStorage.getItem(key));
}