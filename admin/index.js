import {getDBEntrees, insertDBEntry, updateDBEntry, deleteDBEntry, createSchema, createTable, createAttributes} from "../db-utilities.js";
import {getTableDataWithText, getTableHeaderRow, getTableDataWithCheckbox, getTableDataWithDeleteButton} from "../table-utilities.js";

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

const supplyLowTabContainer = document.querySelector("#supply-issues-container");
const supplyIssuesTable = document.querySelector("#supply-issues-table");
const supplyCategoryDataList = document.querySelector("#category-datalist");

const timeClockTabContainer = document.querySelector("#time-clock-container");
const timeClockTabTable = document.querySelector("#time-clock-issues-table");

const otherIssuesTabContainer = document.querySelector("#other-issues-container");
const otherIssuesTable = document.querySelector("#other-issues-table");

const supplyListTabContainer = document.querySelector("#supply-list-container");
const supplyListCategoryInput = document.querySelector("#supply-list-category-input");
const addSupplyBtn = document.querySelector("#add-supply-btn");
const categoryFilterInput = document.querySelector("#category-filter-input");
const supplyListItemInput = document.querySelector("#supply-list-item-input");
const supplyListTable = document.querySelector("#supply-list-table");

const settingsContainer = document.querySelector("#settings-container");
const darkThemeCheckbox = document.querySelector("#dark-theme-checkbox");
const serverURL = document.querySelector("#server-url");
const serverAuthorization = document.querySelector("#server-authorization");
const runDBSetupBtn = document.querySelector("#run-db-setup-btn");
const removePasswordBtn = document.querySelector("#remove-password-btn");

const dbActivityLight = document.querySelector("#db-activity-light");




// ---INITIALIZE---


function setTheme() {
    const theme = getLocalStorageValue('theme') || "light";
    document.documentElement.setAttribute('data-color-theme', theme);
    darkThemeCheckbox.checked = theme == "dark" ? true : false;
}

darkThemeCheckbox.addEventListener('change', () => {
    setLocalStorageValue('theme', darkThemeCheckbox.checked ? "dark" : "light");
    setTheme()
});

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
        dbActive();
        await checkForUnresolvedIssues();
        // const activeTab = document.querySelector('.active-tab');
        // const activeTabID = activeTab.attributes.tabContainer.value;
        // showTab(activeTabID);
    }, 10000); // 60000 * 5
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
    await insertDBEntry("inventory_schema", "supply_list", data, settings, dbActive);
    await loadSupplyListTable();
});

categoryFilterInput.addEventListener('keypress', async (event) => {
    if (event.key === 'Enter') loadSupplyListTable();
});
categoryFilterInput.addEventListener('blur', async () => {
    loadSupplyListTable();
});

const tableAttributes = {
    supplyList: ["category", "item"],
    partsIssues: ["cabinetNumber", "date", "jobName", "note", "part", "sent", "show", "time"],
    supplyIssues: ["category", "item", "currently", "date", "note", "ordered", "show", "time"],
    timeClockIssues: ["firstName", "date", "acknowledged", "missedTime", "note", "time"],
    otherIssues: ["date", "acknowledged", "note", "time"],

}
runDBSetupBtn.addEventListener('click', async () => {
    let message = "";
    message += await createSchema("inventory_schema", settings, dbActive) + "\n";
    message += await createTable("supply_list", "inventory_schema", settings, dbActive) + "\n";
    message += await createAttributes(tableAttributes.supplyList, "supply_list", "inventory_schema", settings, dbActive) + "\n";

    message += await createSchema("issues_schema", settings, dbActive) + "\n";
    message += await createTable("parts_issues", "issues_schema", settings, dbActive) + "\n";
    message += await createAttributes(tableAttributes.partsIssues, "parts_issues", "issues_schema", settings, dbActive) + "\n";
    message += await createTable("supply_issues", "issues_schema", settings, dbActive) + "\n";
    message += await createAttributes(tableAttributes.supplyIssues, "supply_issues", "issues_schema", settings, dbActive) + "\n";
    message += await createTable("time_clock_issues", "issues_schema", settings, dbActive) + "\n";
    message += await createAttributes(tableAttributes.timeClockIssues, "time_clock_issues", "issues_schema", settings, dbActive) + "\n";
    message += await createTable("other_issues", "issues_schema", settings, dbActive) + "\n";
    message += await createAttributes(tableAttributes.otherIssues, "other_issues", "issues_schema", settings, dbActive) + "\n";
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
serverAuthorization.addEventListener('blur', function () {
    setLocalStorageValue('serverAuthorization', serverAuthorization.value);
    settings.authorization = serverAuthorization.value;
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
    const partsOperation = await getEntryCountWithValue("issues_schema", "parts_issues", "sent", false) ? "add" : "remove";
    partTabBtn.classList[partsOperation]("after-visible");

    const supplyLowOperation = await getEntryCountWithValue("issues_schema", "supply_issues", "ordered", false) ? "add" : "remove";
    supplyLowTabBtn.classList[supplyLowOperation]("after-visible");

    const timeClockOperation = await getEntryCountWithValue("issues_schema", "time_clock_issues", "acknowledged", false) ? "add" : "remove";
    timeClockTabBtn.classList[timeClockOperation]("after-visible");

    const otherOperation = await getEntryCountWithValue("issues_schema", "other_issues", "acknowledged", false) ? "add" : "remove";
    otherIssuesTabBtn.classList[otherOperation]("after-visible");
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
    const response = await getDBEntrees("issues_schema", "parts_issues", "__createdtime__", "*", settings, dbActive);
    
    if ((!response) || (response.error)) return;
    
    response.sort((a, b) => {return b.__createdtime__ - a.__createdtime__});

    partIssuesTable.innerHTML = getTableHeaderRow(["Job", "Cabinet", "Part", "Note", "Date", "Time", "Sent", "Show", "Delete"]);

    for (const entry of response) {
        const row = document.createElement('tr');

        const job = getTableDataWithText(entry.jobName);

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
                await checkForUnresolvedIssues();
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
                await checkForUnresolvedIssues();
            }
        );

        appendChildren(row, [job, cabinetNumber, part, note, date, time, sent, show, deleteTD]);
        partIssuesTable.appendChild(row);
    };
}

// Load Supply Issues Table
async function loadSuppliesIssues() {
    const response = await getDBEntrees("issues_schema", "supply_issues", "__createdtime__", "*", settings, dbActive);
    
    if ((!response) || (response.error)) return;

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
                await checkForUnresolvedIssues();
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
                await checkForUnresolvedIssues();
            }
        );

        appendChildren(row, [category, item, currently, note, date, time, ordered, show, deleteTD]);
        supplyIssuesTable.appendChild(row);
    };
}

// Load Time Clock Issues Table
async function loadTimeClockIssues() {
    const response = await getDBEntrees("issues_schema", "time_clock_issues", "__createdtime__", "*", settings, dbActive);
    
    if ((!response) || (response.error)) return;

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
                await checkForUnresolvedIssues();
            }
        );

        const deleteTD = getTableDataWithDeleteButton(
            async () => {
                await deleteDBEntry("issues_schema", "time_clock_issues", entry.id, settings, dbActive);
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
    const response = await getDBEntrees("issues_schema", "other_issues", "__createdtime__", "*", settings, dbActive);
    
    if ((!response) || (response.error)) return;

    response.sort((a, b) => {return b.__createdtime__ - a.__createdtime__});

    otherIssuesTable.innerHTML = 
        getTableHeaderRow(["Note", "Date", "Time", "Acknowledged", "Delete"]);

    for (const entry of response) {
        const row = document.createElement('tr');

        const note = getTableDataWithText(entry.note, true);

        const date = getTableDataWithText(entry.date);

        const time = getTableDataWithText(entry.time);

        const acknowledged = getTableDataWithCheckbox(
            entry.acknowledged,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry("issues_schema", "other_issues", {id: entry.id, acknowledged: isChecked}, settings, dbActive);
                await checkForUnresolvedIssues();
            }
        );

        const deleteTD = getTableDataWithDeleteButton(
            async () => {
                await deleteDBEntry("issues_schema", "other_issues", entry.id, settings, dbActive);
                await loadOtherIssues();
                await checkForUnresolvedIssues();
            }
        );

        appendChildren(row, [note, date, time, acknowledged, deleteTD]);
        otherIssuesTable.appendChild(row);
    };
}

// Supply List Table
async function loadSupplyListTable() {
    const filter = categoryFilterInput.value || "*";

    const response = await getDBEntrees("inventory_schema", "supply_list", "category", filter, settings, dbActive);
    
    if ((!response) || (response.error)) return;

    response.sort((a, b) => {
        const categoryA = a.category.toUpperCase();
        const categoryB = b.category.toUpperCase();
        if (categoryA < categoryB) return -1;
        if (categoryA > categoryB) return 1;
        return 0;
      });

    supplyListTable.innerHTML = 
        getTableHeaderRow(["Category", "Item", "Delete"]);

    for (const entry of response) {
        const row = document.createElement('tr');

        const category = getTableDataWithText(entry.category);

        const item = getTableDataWithText(entry.item, true);

        const deleteTD = getTableDataWithDeleteButton(
            async () => {
                await deleteDBEntry("inventory_schema", "supply_list", entry.id, settings, dbActive);
                await loadSupplyListTable();
            }
        );

        appendChildren(row, [category, item, deleteTD]);
        supplyListTable.appendChild(row);
    };

    supplyCategoryDataList.innerHTML = "";
    const categories = await getItemCategories("inventory_schema", "supply_list");
    categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        supplyCategoryDataList.appendChild(option);
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