import {getDBEntrees, insertDBEntry, updateDBEntry, deleteDBEntry, createSchema, createTable} from "../db-utilities.js";

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
// const partIssuesNote = document.querySelector("#part-issues-note");

const supplyLowTabContainer = document.querySelector("#supply-issues-container");
const supplyIssuesTable = document.querySelector("#supply-issues-table");
// const supplyIssuesNote = document.querySelector("#supply-issues-note");

const timeClockTabContainer = document.querySelector("#time-clock-container");
const timeClockTabTable = document.querySelector("#time-clock-issues-table");
// const timeClockTabNote = document.querySelector("#time-clock-issues-note");

const otherIssuesTabContainer = document.querySelector("#other-issues-container");
const otherIssuesTable = document.querySelector("#other-issues-table");

const supplyListTabContainer = document.querySelector("#supply-list-container");
const supplyListCategoryInput = document.querySelector("#supply-list-category-input");
const supplyListItemInput = document.querySelector("#supply-list-item-input");
const supplyListTable = document.querySelector("#supply-list-table");
const addSupplyBtn = document.querySelector("#add-supply-btn");

const settingsContainer = document.querySelector("#settings-container");
// const userName = document.querySelector("#user-name");
const serverURL = document.querySelector("#server-url");
const serverAuthorization = document.querySelector("#server-authorization");
const runDBSetupBtn = document.querySelector("#run-db-setup-btn");

const dbActivityLight = document.querySelector("#db-activity-light");




// ---INITIALIZE---

settings.url = serverURL.value = getLocalStorageValue('serverURL') || "";
settings.authorization = serverAuthorization.value = getLocalStorageValue('serverAuthorization') || "";


// showSettings();
if (serverURL.value && serverAuthorization.value) {
    try {
        loadPartIssues();
        // loadSuppliesIssues();
        // loadTimeClockIssues();
        // loadOtherIssues();
        // loadSupplyListTable();
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

addSupplyBtn.addEventListener('click', async () => {
    const category = supplyListCategoryInput.value.trim();
    const item = supplyListItemInput.value.trim();

    if ((!category) || (!item)) return;

    const data = {
        category: category,
        item: item,
    }
    await insertDBEntry("issues_schema","supply_list", data, settings, dbActive);
    loadSupplyListTable();
});

runDBSetupBtn.addEventListener('click', async () => {
    let message = "";
    message += await createSchema("issues_schema", settings, dbActive) + "\n";
    message += await createTable("parts_issues", "issues_schema", settings, dbActive) + "\n";
    message += await createTable("supply_issues", "issues_schema", settings, dbActive) + "\n";
    message += await createTable("time_clock_issues", "issues_schema", settings, dbActive) + "\n";
    message += await createTable("other_issues", "issues_schema", settings, dbActive) + "\n";
    message += await createTable("supply_list", "issues_schema", settings, dbActive) + "\n";
    alert(message);
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
            loadOtherIssues();
            break;
        case "supply-list":
            supplyListTabContainer.style.display = "flex";
            supplyListTabBtn.classList.add("active-tab");
            loadSupplyListTable();
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
    const response = await getDBEntrees("issues_schema", "supply_list", "category", "*", settings, dbActive);
    response.forEach((item) => {
        if (categories.indexOf(item.category) === -1) {
            categories.push(item.category);
        }
    });
    return categories;
}


// Load Parts Issues Table
async function loadPartIssues() {
    const response = await getDBEntrees("issues_schema", "parts_issues", "__createdtime__", "*", settings, dbActive);
    
    response.sort((a, b) => {return b.__createdtime__ - a.__createdtime__});

    partIssuesTable.innerHTML = getTableHeaderRow(["Job", "Cabinet", "Part", "Note", "Date", "Time", "Sent", "Show", "Delete"]);

    for (const entry of response) {
        const row = document.createElement('tr');

        const job = getTableDataWithText(entry.job);

        const cabinetNumber = getTableDataWithText(entry.cabinetNumber);

        const part = getTableDataWithText(entry.part);

        const note = getTableDataWithText(entry.note, true);

        const date = getTableDataWithText(entry.date);

        const time = getTableDataWithText(entry.time);

        const sent = getTableDataWithCheckbox(
            entry.sent,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry("issues_schema", "parts_issues", {id: entry.id, sent: isChecked}, settings, dbActive);
            }
        );

        const show = getTableDataWithCheckbox(
            entry.show,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry("issues_schema", "parts_issues", {id: entry.id, show: isChecked}, settings, dbActive);
            }
        );

        const deleteTD = getTableDataWithDeleteButton(
            async () => {
                await deleteDBEntry("issues_schema", "parts_issues", entry.id, settings, dbActive);
                await loadPartIssues();
            }
        );

        appendChildren(row, [job, cabinetNumber, part, note, date, time, sent, show, deleteTD]);
        partIssuesTable.appendChild(row);
    };
}

// Load Supply Issues Table
async function loadSuppliesIssues() {
    const response = await getDBEntrees("issues_schema", "supply_issues", "__createdtime__", "*", settings, dbActive);
    
    response.sort((a, b) => {return b.__createdtime__ - a.__createdtime__});

    supplyIssuesTable.innerHTML = 
        getTableHeaderRow(["Category", "Item", "Currently", "Note", "Date", "Time", "Ordered", "Show", "Delete"]);

    for (const entry of response) {
        const row = document.createElement('tr');

        const category = getTableDataWithText(entry.category);

        const item = getTableDataWithText(entry.item, true);

        const currently = getTableDataWithText(entry.currently);

        const note = getTableDataWithText(entry.note, true);

        const date = getTableDataWithText(entry.date);

        const time = getTableDataWithText(entry.time);

        const ordered = getTableDataWithCheckbox(
            entry.ordered,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry("issues_schema", "supply_issues", {id: entry.id, ordered: isChecked}, settings, dbActive);
            }
        );

        const show = getTableDataWithCheckbox(
            entry.show,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry("issues_schema", "supply_issues", {id: entry.id, show: isChecked}, settings, dbActive);
            }
        );

        const deleteTD = getTableDataWithDeleteButton(
            async () => {
                await deleteDBEntry("issues_schema", "supply_issues", entry.id, settings, dbActive);
                await loadSuppliesIssues();
            }
        );

        appendChildren(row, [category, item, currently, note, date, time, ordered, show, deleteTD]);
        supplyIssuesTable.appendChild(row);
    };
}

// Load Time Clock Issues Table
async function loadTimeClockIssues() {
    const response = await getDBEntrees("issues_schema", "time_clock_issues", "__createdtime__", "*", settings, dbActive);
    
    response.sort((a, b) => {return b.__createdtime__ - a.__createdtime__});

    timeClockTabTable.innerHTML = 
        getTableHeaderRow(["Name", "Missed Time", "Note", "Date", "Time", "Acknowledged", "Delete"]);

    for (const entry of response) {
        const row = document.createElement('tr');

        const name = getTableDataWithText(entry.firstName);

        const missedTime = getTableDataWithText(entry.missedTime);

        const note = getTableDataWithText(entry.note, true);

        const date = getTableDataWithText(entry.date);

        const time = getTableDataWithText(entry.time);

        const acknowledged = getTableDataWithCheckbox(
            entry.acknowledged,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry("issues_schema", "time_clock_issues", {id: entry.id, acknowledged: isChecked}, settings, dbActive);
            }
        );

        const deleteTD = getTableDataWithDeleteButton(
            async () => {
                await deleteDBEntry("issues_schema", "time_clock_issues", entry.id, settings, dbActive);
                await loadTimeClockIssues();
            }
        );

        appendChildren(row, [name, missedTime, note, date, time, acknowledged, deleteTD]);
        timeClockTabTable.appendChild(row);
    };
}

// Other Issues Table
async function loadOtherIssues() {
    const response = await getDBEntrees("issues_schema", "other_issues", "__createdtime__", "*", settings, dbActive);
    
    response.sort((a, b) => {return b.__createdtime__ - a.__createdtime__});

    otherIssuesTable.innerHTML = 
        getTableHeaderRow(["Name", "Note", "Date", "Time", "Acknowledged", "Delete"]);

    for (const entry of response) {
        const row = document.createElement('tr');

        const name = getTableDataWithText(entry.firstName);

        const note = getTableDataWithText(entry.note, true);

        const date = getTableDataWithText(entry.date);

        const time = getTableDataWithText(entry.time);

        const acknowledged = getTableDataWithCheckbox(
            entry.acknowledged,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry("issues_schema", "other_issues", {id: entry.id, acknowledged: isChecked}, settings, dbActive);
            }
        );

        const deleteTD = getTableDataWithDeleteButton(
            async () => {
                await deleteDBEntry("issues_schema", "other_issues", entry.id, settings, dbActive);
                await loadOtherIssues();
            }
        );

        appendChildren(row, [name, note, date, time, acknowledged, deleteTD]);
        otherIssuesTable.appendChild(row);
    };
}

// Supply List Table
async function loadSupplyListTable() {
    const response = await getDBEntrees("issues_schema", "supply_list", "__createdtime__", "*", settings, dbActive);
    
    response.sort((a, b) => {return b.__createdtime__ - a.__createdtime__});

    supplyListTable.innerHTML = 
        getTableHeaderRow(["Category", "Item", "Delete"]);

    for (const entry of response) {
        const row = document.createElement('tr');

        const category = getTableDataWithText(entry.category);

        const item = getTableDataWithText(entry.item, true);

        const deleteTD = getTableDataWithDeleteButton(
            async () => {
                await deleteDBEntry("issues_schema", "supply_list", entry.id, settings, dbActive);
                await loadSupplyListTable();
            }
        );

        appendChildren(row, [category, item, deleteTD]);
        supplyListTable.appendChild(row);
    };
}

function getTableDataWithText(text, AddAlertText) {
    const td = document.createElement('td');
    td.textContent = text;
    if (AddAlertText) {
        td.onclick = () => {alert(text)}
        td.style.cursor = "pointer";
    }
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