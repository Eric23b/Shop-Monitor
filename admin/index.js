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
        // loadIssuesSelect();
    } catch (error) {
        console.log(error);
        // showMessage(error);
    }
    showTab("part-issue");
}
else {
    showTab("settings");
}

// partTabBtn.addEventListener('click', () => {showTab("part-issue")});


// ---EVENT LISTENERS---

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



serverURL.addEventListener('blur', () => {
    setLocalStorageValue('serverURL', serverURL.value);
    settings.url = serverURL.value;
});

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
    const response = await getDBEntrees("supplies_list", "category", "*", settings, dbActive);
    response.forEach((item) => {
        if (categories.indexOf(item.category) === -1) {
            categories.push(item.category);
        }
    });
    return categories;
}


// Load Parts Issues Table
async function loadPartIssues() {
    const response = await getDBEntrees("parts_issues", "active", "*", settings, dbActive);
    
    response.sort((a, b) => {return b.__createdtime__ - a.__createdtime__});

    partIssuesTable.innerHTML = getTableHeaderRow(["Job", "Cabinet", "Part", "Date", "Sent", "Active", "Delete"]);

    for (const element of response) {
        // Table row
        const row = document.createElement('tr');
        row.onmouseover = () => {showNoteOnMouseOver(element.note, partIssuesNote)}

        // Job table data
        const job = document.createElement('td');
        job.textContent = element.jobName;

        // Cabinet number table data
        const cabinetNumber = document.createElement('td');
        cabinetNumber.textContent = element.cabinetNumber;

        // Part table data
        const part = document.createElement('td');
        part.textContent = element.part;

        // Date table data
        const date = document.createElement('td');
        date.textContent = element.date;

        // Sent table data and checkbox
        const sent = getTableDataWithCheckbox(
            element.sent,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry("parts_issues", {id: element.id, sent: isChecked}, settings, dbActive);
            }
        );

        // Active table data and checkbox
        const active = getTableDataWithCheckbox(
            element.active,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry("parts_issues", {id: element.id, active: isChecked}, settings, dbActive);
            }
        );

        // Delete table data and button
        const deleteTD = getTableDataWithDeleteButton(
            async () => {
                await deleteDBEntry("parts_issues", element.id, settings, dbActive);
                await loadPartIssues();
            }
        );

        appendChildren(row, [job, cabinetNumber, part, date, sent, active, deleteTD]);
        partIssuesTable.appendChild(row);
    };
}

// Load Supply Issues Table
async function loadSuppliesIssues() {
    const response = await getDBEntrees("supply_issues", "active", "*", settings, dbActive);
    
    response.sort((a, b) => {return b.__createdtime__ - a.__createdtime__});

    supplyIssuesTableData.innerHTML = 
        getTableHeaderRow(["Category", "Item", "Currently", "Date", "Ordered", "Active", "Delete"]);

    for (const element of response) {
        // Table row
        const row = document.createElement('tr');
        row.onmouseover = () => {showNoteOnMouseOver(element.note, partIssuesNote)}
        
        const category = document.createElement('td');
        const item = document.createElement('td');
        const currently = document.createElement('td');
        const date = document.createElement('td');
        const ordered = document.createElement('td');
        const orderedCheckbox = document.createElement('input');
        const active = document.createElement('td');
        const activeCheckbox = document.createElement('input');
        const deleteTD = document.createElement('td');
        const deleteButton = document.createElement('button');

        row.setAttribute('db_id', element.id);
        row.onmouseover = () => {
            supplyIssuesNote.textContent = element.note || "Note:";
            supplyIssuesNote.style.color = element.note ? "var(--active)" : "var(--inactive)";
        };

        category.textContent = element.category;
        item.textContent = element.item;
        currently.textContent = element.currently;
        date.textContent = element.date;

        orderedCheckbox.type = "checkbox";
        orderedCheckbox.checked = element.ordered;
        orderedCheckbox.setAttribute('db_id', element.id);
        orderedCheckbox.onchange = async (event) => {
            const isChecked = event.target.checked;
            const db_id = event.target.attributes.db_id.value;
            await updateDBEntry("supply_issues", {id: db_id, ordered: isChecked}, settings, dbActive);
        }
        ordered.appendChild(orderedCheckbox);

        activeCheckbox.type = "checkbox"
        activeCheckbox.checked = element.active;
        activeCheckbox.setAttribute('db_id', element.id);
        activeCheckbox.onchange = async (event) => {
            const isChecked = event.target.checked;
            const db_id = event.target.attributes.db_id.value;
            await updateDBEntry("supply_issues", {id: db_id, active: isChecked}, settings, dbActive);
        }
        active.appendChild(activeCheckbox);

        deleteButton.textContent = "✖";
        deleteButton.classList.add("delete-btn");
        deleteButton.setAttribute('db_id', element.id);
        deleteButton.onclick = async (event) => {
            const db_id = event.target.attributes.db_id.value;
            await deleteDBEntry("supply_issues", db_id, settings, dbActive);
            await loadSuppliesIssues();
        }
        deleteTD.appendChild(deleteButton);

        row.appendChild(category);
        row.appendChild(item);
        row.appendChild(currently);
        row.appendChild(date);
        row.appendChild(ordered);
        row.appendChild(active);
        row.appendChild(deleteTD);
        
        supplyIssuesTableData.appendChild(row);
    };
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