import {getDBEntrees, insertDBEntry, updateDBEntry, deleteDBEntry, createSchema, createTable, createAttributes} from "../db-utilities.js";
import {getTableDataWithText, getTableHeaderRow, getTableDataWithCheckbox, getTableDataWithDeleteButton} from "../table-utilities.js";
import {
    INVENTORY_SCHEMA,
    SUPPLY_LIST_TABLE,
    ISSUE_SCHEMA,
    PARTS_ISSUES_TABLE,
    SUPPLY_ISSUES_TABLE,
    TIME_CLOCK_ISSUES_TABLE,
    OTHER_ISSUES_TABLE,
    LOGS_SCHEMA,
    TIMER_TABLE,
    BUSINESS_SCHEMA,
    EMPLOYEES_TABLE,
    JOBS_TABLE,
    STATIONS_TABLE,
    TABLE_ATTRIBUTES
} from "../directives.js";

const pageTitle = "Admin";

const settings = {
    url: "",
    authorization: ""
}

let station = "";

// const homeBtn = document.querySelector("#home-btn");
// const errorMessage = document.querySelector("#error-message");

const tabHeader = document.querySelector("#tab-header");

const partTabBtn = document.querySelector("#parts-tab-btn");
const supplyLowTabBtn = document.querySelector("#supply-low-tab-btn");
const timeClockTabBtn = document.querySelector("#time-clock-tab-btn");
const otherIssuesTabBtn = document.querySelector("#other-issues-tab-btn");
const timersTabBtn = document.querySelector("#timers-tab-btn");
const jobsTabBtn = document.querySelector("#jobs-tab-btn");
const employeesTabBtn = document.querySelector("#employees-tab-btn");
const supplyListTabBtn = document.querySelector("#supply-list-tab-btn");
const settingsTabBtn = document.querySelector("#settings-tab-btn");

const partsTabContainer = document.querySelector("#part-issue-container");
const partIssuesTable = document.querySelector("#part-issues-table");

const supplyLowTabContainer = document.querySelector("#supply-issues-container");
const supplyIssuesTable = document.querySelector("#supply-issues-table");
const supplyCategoryDataList = document.querySelector("#category-datalist");

const timeClockTabContainer = document.querySelector("#time-clock-container");
const timeClockTabTable = document.querySelector("#time-clock-issues-table");

const otherIssuesTabContainer = document.querySelector("#other-issues-container");
const otherIssuesTable = document.querySelector("#other-issues-table");

const timersTabContainer = document.querySelector("#timers-container");
const timersTable = document.querySelector("#timers-table");

const jobsTabContainer = document.querySelector("#jobs-container");
const jobsTabTable = document.querySelector("#jobs-issues-table");

const employeesTabContainer = document.querySelector("#employees-container");
const employeesTabTable = document.querySelector("#employees-issues-table");

const supplyListTabContainer = document.querySelector("#supply-list-container");
const supplyListCategoryInput = document.querySelector("#supply-list-category-input");
const addSupplyBtn = document.querySelector("#add-supply-btn");
const clearSupplyBtn = document.querySelector("#clear-supply-btn");
const categoryFilterInput = document.querySelector("#category-filter-input");
const supplyListItemInput = document.querySelector("#supply-list-item-input");
const supplyListTable = document.querySelector("#supply-list-table");

const settingsContainer = document.querySelector("#settings-container");
const darkThemeCheckbox = document.querySelector("#dark-theme-checkbox");
const serverURL = document.querySelector("#server-url");
const serverAuthorization = document.querySelector("#server-authorization");
const stationName = document.querySelector("#station-name");
const runDBSetupBtn = document.querySelector("#run-db-setup-btn");
const removePasswordBtn = document.querySelector("#remove-password-btn");

const dbActivityLight = document.querySelector("#db-activity-light");




// ---INITIALIZE---


setTheme();

hideTabContainers();

const password = getLocalStorageValue('password') || prompt("Enter your password");
if (password !== "pw558") {
    const a = document.createElement('a');
    a.href = "/";
    a.click();
} 
else {
    setLocalStorageValue('password', password);
}

settings.url = serverURL.value = getLocalStorageValue('serverURL') || "";
settings.authorization = serverAuthorization.value = getLocalStorageValue('serverAuthorization') || "";
station = stationName.value = getLocalStorageValue('stationName') || "";


// showSettings();
if (serverURL.value && serverAuthorization.value) {
    try {
        await loadPartIssues();
    } catch (error) {
        console.log(error);
    }
    showTab("part-issue");
    await checkForUnresolvedIssues();
    
    setInterval(async () => {
        dbActive(true);  // TODO: Should only light up green if it was successful
        await checkForUnresolvedIssues();
    }, 10000);
}
else {
    showTab("settings");
}



// ---EVENT LISTENERS---

darkThemeCheckbox.addEventListener('change', () => {
    setLocalStorageValue('theme', darkThemeCheckbox.checked ? "dark" : "light");
    setTheme()
});

// Tab click (add style and refresh data)
tabHeader.addEventListener('click', async (event) => {
    const buttons = document.querySelectorAll("#tab-header .tab-btn");
    buttons.forEach((button) => {
        button.classList.remove("active-tab");
    });
    
    if (!event.target.attributes.tabContainer) return;
    event.target.classList.add("active-tab");

    const containerID = event.target.attributes.tabContainer.value;
    await showTab(containerID);

    await checkForUnresolvedIssues();
});

// Add Button
addSupplyBtn.addEventListener('click', async () => {
    const category = supplyListCategoryInput.value.trim();
    const itemText = supplyListItemInput.value.trim();
    const items = itemText.split('\n');
    
    if ((!category) || (!itemText)) return;

    for (const item of items) {
        const data = {
            category: category,
            item: item,
        }
        await insertDBEntry(INVENTORY_SCHEMA, "supply_list", data, settings, dbActive);
    }
    await loadSupplyListTable();        
});

// Clear Button
clearSupplyBtn.addEventListener('click', async () => {
    supplyListCategoryInput.value = '';
    supplyListItemInput.value = '';
});

categoryFilterInput.addEventListener('keypress', async (event) => {
    if (event.key === 'Enter') loadSupplyListTable();
});
categoryFilterInput.addEventListener('blur', async () => {
    loadSupplyListTable();
});

runDBSetupBtn.addEventListener('click', async () => {
    let message = "";
    // Inventory
    message += await createSchema(INVENTORY_SCHEMA, settings, dbActive) + "\n";
    message += await createTable(SUPPLY_LIST_TABLE, INVENTORY_SCHEMA, settings, dbActive) + "\n";
    message += await createAttributes(TABLE_ATTRIBUTES.supplyList, SUPPLY_LIST_TABLE, INVENTORY_SCHEMA, settings, dbActive) + "\n";

    // Issues
    message += await createSchema(ISSUE_SCHEMA, settings, dbActive) + "\n";
    message += await createTable(PARTS_ISSUES_TABLE, ISSUE_SCHEMA, settings, dbActive) + "\n";
    message += await createAttributes(TABLE_ATTRIBUTES.partsIssues, PARTS_ISSUES_TABLE, ISSUE_SCHEMA, settings, dbActive) + "\n";
    message += await createTable(SUPPLY_ISSUES_TABLE, ISSUE_SCHEMA, settings, dbActive) + "\n";
    message += await createAttributes(TABLE_ATTRIBUTES.supplyIssues, SUPPLY_ISSUES_TABLE, ISSUE_SCHEMA, settings, dbActive) + "\n";
    message += await createTable(TIME_CLOCK_ISSUES_TABLE, ISSUE_SCHEMA, settings, dbActive) + "\n";
    message += await createAttributes(TABLE_ATTRIBUTES.timeClockIssues, TIME_CLOCK_ISSUES_TABLE, ISSUE_SCHEMA, settings, dbActive) + "\n";
    message += await createTable(OTHER_ISSUES_TABLE, ISSUE_SCHEMA, settings, dbActive) + "\n";
    message += await createAttributes(TABLE_ATTRIBUTES.otherIssues, OTHER_ISSUES_TABLE, ISSUE_SCHEMA, settings, dbActive) + "\n";

    // Logs
    message += await createSchema(LOGS_SCHEMA, settings, dbActive) + "\n";
    message += await createTable(TIMER_TABLE, LOGS_SCHEMA, settings, dbActive) + "\n";
    message += await createAttributes(TABLE_ATTRIBUTES.timer_logs, TIMER_TABLE, LOGS_SCHEMA, settings, dbActive) + "\n";

    // Business
    message += await createSchema(BUSINESS_SCHEMA, settings, dbActive) + "\n";
    message += await createTable(EMPLOYEES_TABLE, BUSINESS_SCHEMA, settings, dbActive) + "\n";
    message += await createAttributes(TABLE_ATTRIBUTES.employees, EMPLOYEES_TABLE, BUSINESS_SCHEMA, settings, dbActive) + "\n";
    message += await createTable(JOBS_TABLE, BUSINESS_SCHEMA, settings, dbActive) + "\n";
    message += await createAttributes(TABLE_ATTRIBUTES.jobs, JOBS_TABLE, BUSINESS_SCHEMA, settings, dbActive) + "\n";
    message += await createTable(STATIONS_TABLE, BUSINESS_SCHEMA, settings, dbActive) + "\n";
    message += await createAttributes(TABLE_ATTRIBUTES.stations, STATIONS_TABLE, BUSINESS_SCHEMA, settings, dbActive) + "\n";
    alert(message);
});

removePasswordBtn.addEventListener('click', () => {
    setLocalStorageValue('password', "");
});

// Save serverURL on blur
serverURL.addEventListener('blur', () => {
    setLocalStorageValue('serverURL', serverURL.value);
    settings.url = serverURL.value;
});

// Save serverAuthorization on blur
serverAuthorization.addEventListener('blur', () => {
    setLocalStorageValue('serverAuthorization', serverAuthorization.value);
    settings.authorization = serverAuthorization.value;
});

// Save station name on blur
stationName.addEventListener('blur', () => {
    setLocalStorageValue('stationName', stationName.value);
    station = stationName.value;
});




// ---FUNCTIONS---

async function showTab(tab) {
    hideTabContainers();

    const buttons = document.querySelectorAll("#tab-header .tab-btn");
    buttons.forEach((button) => {
        button.classList.remove("active-tab");
    });

    switch (tab) {
        case "part-issue":
            partsTabContainer.style.display = "flex";
            partTabBtn.classList.add("active-tab");
            await loadPartIssues();
            break;
        case "supply-issues":
            supplyLowTabContainer.style.display = "flex";
            supplyLowTabBtn.classList.add("active-tab");
            await loadSuppliesIssues();
            break;
        case "time-clock":
            timeClockTabContainer.style.display = "flex";
            timeClockTabBtn.classList.add("active-tab");
            await loadTimeClockIssues();
            break;
        case "other-issues":
            otherIssuesTabContainer.style.display = "flex";
            otherIssuesTabBtn.classList.add("active-tab");
            await loadOtherIssues();
            break;
        case "timers":
            timersTabContainer.style.display = "flex";
            timersTabBtn.classList.add("active-tab");
            await loadTimersTable();
            break;
        case "jobs":
            jobsTabContainer.style.display = "flex";
            jobsTabBtn.classList.add("active-tab");
            // await loadTimersTable();
            break;
        case "employees":
            employeesTabContainer.style.display = "flex";
            employeesTabBtn.classList.add("active-tab");
            // await loadTimersTable();
            break;
        case "supply-list":
            supplyListTabContainer.style.display = "flex";
            supplyListTabBtn.classList.add("active-tab");
            await loadSupplyListTable();
            break;
        case "settings":
            settingsContainer.style.display = "flex";
            settingsTabBtn.classList.add("active-tab");
            break;
    
        default:
            break;
    }
}

async function checkForUnresolvedIssues() {
    const partsOperation = await getEntryCountWithValue(ISSUE_SCHEMA, PARTS_ISSUES_TABLE, "sent", false) ? "add" : "remove";
    partTabBtn.classList[partsOperation]("after-visible");

    const supplyLowOperation = await getEntryCountWithValue(ISSUE_SCHEMA, SUPPLY_ISSUES_TABLE, "ordered", false) ? "add" : "remove";
    supplyLowTabBtn.classList[supplyLowOperation]("after-visible");

    const timeClockOperation = await getEntryCountWithValue(ISSUE_SCHEMA, TIME_CLOCK_ISSUES_TABLE, "acknowledged", false) ? "add" : "remove";
    timeClockTabBtn.classList[timeClockOperation]("after-visible");

    const otherOperation = await getEntryCountWithValue(ISSUE_SCHEMA, OTHER_ISSUES_TABLE, "acknowledged", false) ? "add" : "remove";
    otherIssuesTabBtn.classList[otherOperation]("after-visible");

    // Page title
    const addRemoveText = partsOperation + supplyLowOperation + timeClockOperation + otherOperation;
    document.title = pageTitle + (addRemoveText.includes('add') ? " - New Issue" : "");
}

async function getEntryCountWithValue(schema, table, column, value) {
    const response = await getDBEntrees(schema, table, column, value, settings);
    if (!response) return 0;
    return response.length;
}

function hideTabContainers() {
    const tabContainers = document.querySelectorAll(".tab-container");
    tabContainers.forEach((element) => {
        element.style.display = "none";
    });
}

async function getItemCategories(schema, table) {
    const categories = [];
    const response = await getDBEntrees(schema, table, "category", "*", settings, dbActive);
    response.forEach((item) => {
        if (categories.indexOf(item.category) === -1) {
            categories.push(item.category);
        }
    });
    return categories;
}


// Load Parts Issues Table
async function loadPartIssues() {
    const response = await getDBEntrees(ISSUE_SCHEMA, PARTS_ISSUES_TABLE, "__createdtime__", "*", settings, dbActive);
    
    if ((!response) || (response.error)) return;
    
    response.sort((a, b) => {return b.__createdtime__ - a.__createdtime__});

    partIssuesTable.innerHTML = getTableHeaderRow(["Job", "Cabinet", "Part", "Note", "Date", "Time", "Sent*", "Show", "Delete"]);

    for (const entry of response) {
        const row = document.createElement('tr');

        const job = getTableDataWithText(entry.jobName);

        const cabinetNumber = getTableDataWithText(entry.cabinetNumber);

        const part = getTableDataWithText(entry.part);

        const note = getTableDataWithText(entry.note, true);

        const date = getTableDataWithText(getRelativeDate(entry.date));

        const time = getTableDataWithText(entry.time);

        const sent = getTableDataWithCheckbox(
            entry.sent,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry(ISSUE_SCHEMA, PARTS_ISSUES_TABLE, {id: entry.id, sent: isChecked}, settings, dbActive);
                await checkForUnresolvedIssues();
            }
        );

        const show = getTableDataWithCheckbox(
            entry.show,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry(ISSUE_SCHEMA, PARTS_ISSUES_TABLE, {id: entry.id, show: isChecked}, settings, dbActive);
            }
        );

        const deleteTD = getTableDataWithDeleteButton(
            async () => {
                await deleteDBEntry(ISSUE_SCHEMA, PARTS_ISSUES_TABLE, entry.id, settings, dbActive);
                await loadPartIssues();
                await checkForUnresolvedIssues();
            }
        );

        appendChildren(row, [job, cabinetNumber, part, note, date, time, sent, show, deleteTD]);
        partIssuesTable.appendChild(row);
    };
}

// Load Supply Issues Table
async function loadSuppliesIssues() {
    const response = await getDBEntrees(ISSUE_SCHEMA, SUPPLY_ISSUES_TABLE, "__createdtime__", "*", settings, dbActive);
    
    if ((!response) || (response.error)) return;

    response.sort((a, b) => {return b.__createdtime__ - a.__createdtime__});

    supplyIssuesTable.innerHTML = 
        getTableHeaderRow(["Category", "Item", "Currently", "Note", "Date", "Time", "Ordered*", "Show", "Delete"]);

    for (const entry of response) {
        const row = document.createElement('tr');

        const category = getTableDataWithText(entry.category);

        const item = getTableDataWithText(entry.item, true);

        const currently = getTableDataWithText(entry.currently);

        const note = getTableDataWithText(entry.note, true);

        const date = getTableDataWithText(getRelativeDate(entry.date));

        const time = getTableDataWithText(entry.time);

        const ordered = getTableDataWithCheckbox(
            entry.ordered,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry(ISSUE_SCHEMA, SUPPLY_ISSUES_TABLE, {id: entry.id, ordered: isChecked}, settings, dbActive);
                await checkForUnresolvedIssues();
            }
        );

        const show = getTableDataWithCheckbox(
            entry.show,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry(ISSUE_SCHEMA, SUPPLY_ISSUES_TABLE, {id: entry.id, show: isChecked}, settings, dbActive);
            }
        );

        const deleteTD = getTableDataWithDeleteButton(
            async () => {
                await deleteDBEntry(ISSUE_SCHEMA, SUPPLY_ISSUES_TABLE, entry.id, settings, dbActive);
                await loadSuppliesIssues();
                await checkForUnresolvedIssues();
            }
        );

        appendChildren(row, [category, item, currently, note, date, time, ordered, show, deleteTD]);
        supplyIssuesTable.appendChild(row);
    };
}

// Load Time Clock Issues Table
async function loadTimeClockIssues() {
    const response = await getDBEntrees(ISSUE_SCHEMA, TIME_CLOCK_ISSUES_TABLE, "__createdtime__", "*", settings, dbActive);
    
    if ((!response) || (response.error)) return;

    response.sort((a, b) => {return b.__createdtime__ - a.__createdtime__});

    timeClockTabTable.innerHTML = 
        getTableHeaderRow(["Name", "Missed Time", "Note", "Date", "Time", "Acknowledged*", "Delete"]);

    for (const entry of response) {
        const row = document.createElement('tr');

        const name = getTableDataWithText(entry.firstName);

        const missedTime = getTableDataWithText(entry.missedTime);

        const note = getTableDataWithText(entry.note, true);

        const date = getTableDataWithText(getRelativeDate(entry.date));

        const time = getTableDataWithText(entry.time);

        const acknowledged = getTableDataWithCheckbox(
            entry.acknowledged,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry(ISSUE_SCHEMA, TIME_CLOCK_ISSUES_TABLE, {id: entry.id, acknowledged: isChecked}, settings, dbActive);
                await checkForUnresolvedIssues();
            }
        );

        const deleteTD = getTableDataWithDeleteButton(
            async () => {
                await deleteDBEntry(ISSUE_SCHEMA, TIME_CLOCK_ISSUES_TABLE, entry.id, settings, dbActive);
                await loadTimeClockIssues();
                await checkForUnresolvedIssues();
            }
        );

        appendChildren(row, [name, missedTime, note, date, time, acknowledged, deleteTD]);
        timeClockTabTable.appendChild(row);
    };
}

// Other Issues Table
async function loadOtherIssues() {
    const response = await getDBEntrees(ISSUE_SCHEMA, OTHER_ISSUES_TABLE, "__createdtime__", "*", settings, dbActive);
    
    if ((!response) || (response.error)) return;

    response.sort((a, b) => {return b.__createdtime__ - a.__createdtime__});

    otherIssuesTable.innerHTML = 
        getTableHeaderRow(["Note", "Date", "Time", "Acknowledged*", "Delete"]);

    for (const entry of response) {
        const row = document.createElement('tr');

        const note = getTableDataWithText(entry.note, true);

        const date = getTableDataWithText(getRelativeDate(entry.date));

        const time = getTableDataWithText(entry.time);

        const acknowledged = getTableDataWithCheckbox(
            entry.acknowledged,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry(ISSUE_SCHEMA, OTHER_ISSUES_TABLE, {id: entry.id, acknowledged: isChecked}, settings, dbActive);
                await checkForUnresolvedIssues();
            }
        );

        const deleteTD = getTableDataWithDeleteButton(
            async () => {
                await deleteDBEntry(ISSUE_SCHEMA, OTHER_ISSUES_TABLE, entry.id, settings, dbActive);
                await loadOtherIssues();
                await checkForUnresolvedIssues();
            }
        );

        appendChildren(row, [note, date, time, acknowledged, deleteTD]);
        otherIssuesTable.appendChild(row);
    };
}


async function loadTimersTable() {
    timersTable.innerHTML = getTableHeaderRow(["Job", "Sanding"]);
}

// Supply List Table
async function loadSupplyListTable() {
    const filter = categoryFilterInput.value || "*";

    const response = await getDBEntrees(INVENTORY_SCHEMA, SUPPLY_LIST_TABLE, "category", filter, settings, dbActive);
    
    if ((!response) || (response.error)) return;

    response.sort(alphabetSort);

    supplyListTable.innerHTML = getTableHeaderRow(["Category", "Item", "Delete"]);

    for (const entry of response) {
        const row = document.createElement('tr');

        const category = getTableDataWithText(entry.category);

        const item = getTableDataWithText(entry.item, true);

        const deleteTD = getTableDataWithDeleteButton(
            async () => {
                await deleteDBEntry(INVENTORY_SCHEMA, SUPPLY_LIST_TABLE, entry.id, settings, dbActive);
                await loadSupplyListTable();
            }
        );

        appendChildren(row, [category, item, deleteTD]);
        supplyListTable.appendChild(row);
    };

    loadDataListWithCategories(supplyCategoryDataList);
}

function alphabetSort(a, b) {
    const categoryA = a.category.toUpperCase();
    const categoryB = b.category.toUpperCase();
    if (categoryA < categoryB) return -1;
    if (categoryA > categoryB) return 1;
    return 0;
}

function getRelativeDate(date) {
    if (date === today()) return "Today"
    else if (date == yesterday()) return "Yesterday"
    else return date;
}

function today() {
    const today = new Date();
    return today.toLocaleDateString();
}

function yesterday() {
    const today = new Date();
    today.setDate(today.getDate() - 1);
    return today.toLocaleDateString();
}

async function loadDataListWithCategories(dataList) {
    dataList.innerHTML = "";
    const categories = await getItemCategories(INVENTORY_SCHEMA, SUPPLY_LIST_TABLE);
    categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        dataList.appendChild(option);
    });
}

function appendChildren(parent, childList) {
    childList.forEach((childElement) => {
        parent.appendChild(childElement);
    });
}

function getLocalStorageValue(key) {
    if (window.localStorage[key])
        return JSON.parse(window.localStorage.getItem(key));
}

function setLocalStorageValue(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
}

function dbActive(success) {
    dbActivityLight.style.color = success ? "var(--yes)" : "var(--no)";
    setTimeout(() => {
        dbActivityLight.style.color = "var(--inactive)";
    }, 200);
}

function setTheme() {
    const theme = getLocalStorageValue('theme') || "light";
    document.documentElement.setAttribute('data-color-theme', theme);
    darkThemeCheckbox.checked = theme == "dark" ? true : false;
}