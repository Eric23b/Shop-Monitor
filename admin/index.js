import {getDBEntrees, insertDBEntry, updateDBEntry, deleteDBEntry} from "../db-utilities.js";

const settings = {
    url: "",
    authorization: ""
}

// const homeBtn = document.querySelector("#home-btn");
// const errorMessage = document.querySelector("#error-message");

const tabHeader = document.querySelector("#tab-header");

const partTabBtn = document.querySelector("#parts-tab-btn");
const supplyLowTabBtn = document.querySelector("#supply-low-tab-btn");
const timeClockTabBtn = document.querySelector("#time-clock-tab-btn");
const otherIssuesTabBtn = document.querySelector("#other-issues-tab-btn");
const supplyListTabBtn = document.querySelector("#supply-list-tab-btn");
const settingsTabBtn = document.querySelector("#settings-tab-btn");

const partsTabContainer = document.querySelector("#part-issue-container");
const partIssuesTable = document.querySelector("#part-issues-table");
const partIssuesNote = document.querySelector("#part-issues-note");

const supplyLowTabContainer = document.querySelector("#supply-issues-container");
const supplyIssuesTableData = document.querySelector("#supply-issues-table");
const supplyIssuesNote = document.querySelector("#supply-issues-note");

const timeClockTabContainer = document.querySelector("#time-clock-container");
const timeClockTabTableData = document.querySelector("#time-clock-issues-table");
const timeClockTabNote = document.querySelector("#time-clock-issues-note");

const otherIssuesTabContainer = document.querySelector("#other-issues-container");

const supplyListTabContainer = document.querySelector("#supply-list-container");

const settingsContainer = document.querySelector("#settings-container");
// const userName = document.querySelector("#user-name");
const serverURL = document.querySelector("#server-url");
const serverAuthorization = document.querySelector("#server-authorization");

const dbActivityLight = document.querySelector("#db-activity-light");




// ---INITIALIZE---

settings.url = serverURL.value = getLocalStorageValue('serverURL') || "";
settings.authorization = serverAuthorization.value = getLocalStorageValue('serverAuthorization') || "";


// showSettings();
if (serverURL.value && serverAuthorization.value) {
    try {
        loadPartIssues();
        loadSuppliesIssues();
        loadTimeClockIssues();
    } catch (error) {
        console.log(error);
    }
    showTab("part-issue");
}
else {
    showTab("settings");
}


// ---EVENT LISTENERS---

// Tab click (add style and refresh data)
tabHeader.addEventListener('click', (event) => {
    const buttons = document.querySelectorAll("#tab-header .tab-btn");
    buttons.forEach((button) => {
        button.classList.remove("active-tab");
    });
    
    if (!event.target.attributes.tabContainer) return;
    event.target.classList.add("active-tab");

    const containerID = event.target.attributes.tabContainer.value;
    showTab(containerID);
});

// Save serverURL on blur
serverURL.addEventListener('blur', () => {
    setLocalStorageValue('serverURL', serverURL.value);
    settings.url = serverURL.value;
});
// Save serverAuthorization on blur
serverAuthorization.addEventListener('blur', function () {
    setLocalStorageValue('serverAuthorization', serverAuthorization.value);
    settings.authorization = serverAuthorization.value;
});




// ---FUNCTIONS---

function showTab(tab) {
    hideTabContainers();

    const buttons = document.querySelectorAll("#tab-header .tab-btn");
    buttons.forEach((button) => {
        button.classList.remove("active-tab");
    });

    switch (tab) {
        case "part-issue":
            partsTabContainer.style.display = "flex";
            partTabBtn.classList.add("active-tab");
            loadPartIssues();
            break;
        case "supply-issues":
            supplyLowTabContainer.style.display = "flex";
            supplyLowTabBtn.classList.add("active-tab");
            loadSuppliesIssues();
            break;
        case "time-clock":
            timeClockTabContainer.style.display = "flex";
            timeClockTabBtn.classList.add("active-tab");
            loadTimeClockIssues();
            break;
        case "other-issues":
            otherIssuesTabContainer.style.display = "flex";
            otherIssuesTabBtn.classList.add("active-tab");
            
            break;
        case "supply-list":
            supplyListTabContainer.style.display = "flex";
            supplyListTabBtn.classList.add("active-tab");
            
            break;
        case "settings":
            settingsContainer.style.display = "flex";
            settingsTabBtn.classList.add("active-tab");
            
            break;
    
        default:
            break;
    }
}

function hideTabContainers() {
    const tabContainers = document.querySelectorAll(".tab-container");
    tabContainers.forEach((element) => {
        element.style.display = "none";
    });
}

async function getItemCategories() {
    const categories = [];
    const response = await getDBEntrees("issue_schema", "supplies_list", "category", "*", settings, dbActive);
    response.forEach((item) => {
        if (categories.indexOf(item.category) === -1) {
            categories.push(item.category);
        }
    });
    return categories;
}


// Load Parts Issues Table
async function loadPartIssues() {
    const response = await getDBEntrees("issue_schema", "parts_issues", "active", "*", settings, dbActive);
    
    response.sort((a, b) => {return b.__createdtime__ - a.__createdtime__});

    partIssuesTable.innerHTML = getTableHeaderRow(["Job", "Cabinet", "Part", "Date", "Time", "Sent", "Active", "Delete"]);

    for (const entry of response) {
        const row = document.createElement('tr');
        row.onmouseover = () => {showNoteOnMouseOver(entry.note, partIssuesNote)}

        const job = getTableDataWithText(entry.job);

        const cabinetNumber = getTableDataWithText(entry.cabinetNumber);

        const part = getTableDataWithText(entry.part);

        const date = getTableDataWithText(entry.date);

        const time = getTableDataWithText(entry.time);

        const sent = getTableDataWithCheckbox(
            entry.sent,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry("issue_schema", "parts_issues", {id: entry.id, sent: isChecked}, settings, dbActive);
            }
        );

        const active = getTableDataWithCheckbox(
            entry.active,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry("issue_schema", "parts_issues", {id: entry.id, active: isChecked}, settings, dbActive);
            }
        );

        const deleteTD = getTableDataWithDeleteButton(
            async () => {
                await deleteDBEntry("issue_schema", "parts_issues", entry.id, settings, dbActive);
                await loadPartIssues();
            }
        );

        appendChildren(row, [job, cabinetNumber, part, date, time, sent, active, deleteTD]);
        partIssuesTable.appendChild(row);
    };
}

// Load Supply Issues Table
async function loadSuppliesIssues() {
    const response = await getDBEntrees("issue_schema", "supply_issues", "active", "*", settings, dbActive);
    
    response.sort((a, b) => {return b.__createdtime__ - a.__createdtime__});

    supplyIssuesTableData.innerHTML = 
        getTableHeaderRow(["Category", "Item", "Currently", "Date", "Time", "Ordered", "Active", "Delete"]);

    for (const entry of response) {
        const row = document.createElement('tr');
        row.onmouseover = () => {showNoteOnMouseOver(entry.note, supplyIssuesNote)}

        const category = getTableDataWithText(entry.category);

        const item = getTableDataWithText(entry.item);

        const currently = getTableDataWithText(entry.currently);

        const date = getTableDataWithText(entry.date);

        const time = getTableDataWithText(entry.time);

        const ordered = getTableDataWithCheckbox(
            entry.ordered,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry("issue_schema", "supply_issues", {id: entry.id, ordered: isChecked}, settings, dbActive);
            }
        );

        const active = getTableDataWithCheckbox(
            entry.active,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry("issue_schema", "supply_issues", {id: entry.id, active: isChecked}, settings, dbActive);
            }
        );

        const deleteTD = getTableDataWithDeleteButton(
            async () => {
                await deleteDBEntry("issue_schema", "supply_issues", entry.id, settings, dbActive);
                await loadSuppliesIssues();
            }
        );

        appendChildren(row, [category, item, currently, date, time, ordered, active, deleteTD]);
        supplyIssuesTableData.appendChild(row);
    };
}

// Load Time Clock Issues Table
async function loadTimeClockIssues() {
    const response = await getDBEntrees("issue_schema", "time_clock_issues", "active", "*", settings, dbActive);
    // console.log('Loading..');
    response.sort((a, b) => {return b.__createdtime__ - a.__createdtime__});

    timeClockTabTableData.innerHTML = 
        getTableHeaderRow(["Name", "Missed Time", "Date", "Time", "Acknowledged", "Active", "Delete"]);

    for (const entry of response) {
        const row = document.createElement('tr');
        row.onmouseover = () => {showNoteOnMouseOver(entry.note, timeClockTabNote)}

        const name = getTableDataWithText(entry.firstName);

        const missedTime = getTableDataWithText(entry.missedTime);

        const date = getTableDataWithText(entry.date);

        const time = getTableDataWithText(entry.time);

        const acknowledged = getTableDataWithCheckbox(
            entry.acknowledged,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry("issue_schema", "time_clock_issues", {id: entry.id, acknowledged: isChecked}, settings, dbActive);
            }
        );

        const active = getTableDataWithCheckbox(
            entry.active,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry("issue_schema", "time_clock_issues", {id: entry.id, active: isChecked}, settings, dbActive);
            }
        );

        const deleteTD = getTableDataWithDeleteButton(
            async () => {
                await deleteDBEntry("issue_schema", "time_clock_issues", entry.id, settings, dbActive);
                await loadTimeClockIssues();
            }
        );

        appendChildren(row, [name, missedTime, date, time, acknowledged, active, deleteTD]);
        timeClockTabTableData.appendChild(row);
    };
}

function getTableDataWithText(text) {
    const td = document.createElement('td');
    td.textContent = text;
    return td;
}

function getTableDataWithDeleteButton(asyncCallback) {
    const tableData = document.createElement('td');
    const button = document.createElement('button');
    button.textContent = "✖";
    button.classList.add("delete-btn");
    button.onclick = asyncCallback;
    tableData.appendChild(button);
    return tableData;
}

function getTableDataWithCheckbox(checked, asyncCallback) {
    const tableData = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.checked = checked;
    checkbox.onchange = asyncCallback;
    tableData.appendChild(checkbox);
    return tableData;
}

function showNoteOnMouseOver(noteText, NoteTextArea) {
    NoteTextArea.textContent = noteText || "Note:";
    NoteTextArea.style.color = noteText ? "var(--active)" : "var(--inactive)";
}

function appendChildren(parent, childList) {
    childList.forEach((childElement) => {
        parent.appendChild(childElement);
    });
}

function getTableHeaderRow(headers) {
    let htmlText = "<tr>";
    headers.forEach((header) => {
        htmlText += `<th>${header}</th>`;
    });
    htmlText += "</tr>";
    return htmlText;
}

function getLocalStorageValue(key) {
    if (window.localStorage[key])
        return JSON.parse(window.localStorage.getItem(key));
}

function setLocalStorageValue(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
}

function dbActive() {
    dbActivityLight.style.color = "var(--yes)";
    setTimeout(() => {
        dbActivityLight.style.color = "var(--no)";
    }, 200);
}

// function showMessage(messageText) {
//     errorMessage.textContent = messageText;
//     setTimeout(() => {
//         errorMessage.textContent = "";
//     }, 4000);
// }