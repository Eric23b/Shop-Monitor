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

// let station = "";

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
const timersJobFilter = document.querySelector("#timers-job-filter-input");
const timersTable = document.querySelector("#timers-table");

const jobsTabContainer = document.querySelector("#jobs-container");
const newJobNameInput = document.querySelector("#job-input");
const addJobButton = document.querySelector("#add-job-btn");
const employeeTable = document.querySelector("#jobs-table");

const employeesTabContainer = document.querySelector("#employee-container");
const employeeNameInput = document.querySelector("#employee-input");
const addEmployeeButton = document.querySelector("#add-employee-btn");
const employeesTable = document.querySelector("#employee-table");

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
const saveDataBaseButton = document.querySelector("#save-db-backup-btn");
const runDBSetupBtn = document.querySelector("#run-db-setup-btn");
const removePasswordBtn = document.querySelector("#remove-password-btn");

const promptBackground = document.querySelector("#prompt");
const promptLabel = document.querySelector("#prompt-label");
const promptInput = document.querySelector("#prompt-input");
const promptCancelBtn = document.querySelector("#prompt-cancel-btn");
const promptOKBtn = document.querySelector("#prompt-ok-btn");

const alertBackground = document.querySelector("#alert");
const alertLabel = document.querySelector("#alert-label");
const alertMessage = document.querySelector("#alert-message");
const alertOKBtn = document.querySelector("#alert-ok-btn");

const dbActivityLight = document.querySelector("#db-activity-light");


// ---INITIALIZE---


setTheme();

hideTabContainers();

const password = getLocalStorageValue('password');
if (password !== "pw558") {
    showPrompt("Enter password",
        "",
        (enteredPassword) => {
            if (enteredPassword !== "pw558") {
                const a = document.createElement('a');
                a.href = "/";
                a.click();
            }
            else {
                setLocalStorageValue('password', enteredPassword);
            }
        },
        () => {
            const a = document.createElement('a');
            a.href = "/";
            a.click();
        }
    );
}

settings.url = serverURL.value = getLocalStorageValue('serverURL') || "";
settings.authorization = serverAuthorization.value = getLocalStorageValue('serverAuthorization') || "";
// station = stationName.value = getLocalStorageValue('stationName') || "";


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
    if (!event.target.attributes.tabContainer) return;

    const buttons = document.querySelectorAll("#tab-header .tab-btn");
    buttons.forEach((button) => {
        button.classList.remove("active-tab");
    });
    event.target.classList.add("active-tab");

    const containerID = event.target.attributes.tabContainer.value;
    await showTab(containerID);

    await checkForUnresolvedIssues();
});

// Add job button
addJobButton.addEventListener('click', async () => {
    const jobName = newJobNameInput.value.trim();

    if (!jobName) return;

    const data = {name: jobName, active: true};

    await insertDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, data, settings, dbActive);
    await loadJobsTable();
});

// Add employee button
addEmployeeButton.addEventListener('click', async () => {
    const employeeName = employeeNameInput.value.trim();

    if (!employeeName) return;

    const data = {name: employeeName, active: true};

    await insertDBEntry(BUSINESS_SCHEMA, EMPLOYEES_TABLE, data, settings, dbActive);
    await loadEmployeeTable();
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
        await insertDBEntry(INVENTORY_SCHEMA, SUPPLY_LIST_TABLE, data, settings, dbActive);
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

saveDataBaseButton.addEventListener('click', async () => {
    // Catalog database schemas and tables
    let schemasAndTables = {};
    const response = await describeDatabase(settings, dbActive);
    for (const schema in response) {
        if (Object.hasOwnProperty.call(response, schema)) {
            schemasAndTables[schema] = [];
            const element = response[schema];
            for (const el in element) {
                if (Object.hasOwnProperty.call(element, el)) {
                    const elem = element[el];
                    schemasAndTables[schema].push(elem.name);
                }
            }
        }
    }

    // Get each table
    let jsonData = {};
    for (const schema in schemasAndTables) {
        if (Object.hasOwnProperty.call(schemasAndTables, schema)) {
            const tableArray = schemasAndTables[schema];
            jsonData[schema] = {};
            for (const table of tableArray) {
                const response = await getDBEntrees(schema, table, "__createdtime__", "*", settings, dbActive);
                jsonData[schema][table] = {...jsonData[schema][table], ...response};
            }
        }
    }

    const date = (new Date()).toLocaleDateString();
    saveTextFile(JSON.stringify(jsonData, null, 1), `Database Backup ${date}`, "json");
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

    showAlert("Database message", message);
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
    // station = stationName.value;
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
            await loadJobsTable();
            break;
        case "employees":
            employeesTabContainer.style.display = "flex";
            employeesTabBtn.classList.add("active-tab");
            await loadEmployeeTable();
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

        const note = getTableDataWithText(entry.note);
        addAlertClickToElement(note, "Note", entry.note);

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

        const item = getTableDataWithText(entry.item);
        addAlertClickToElement(item, "Item", entry.item);

        const currently = getTableDataWithText(entry.currently);

        const note = getTableDataWithText(entry.note);
        addAlertClickToElement(note, "Note", entry.note);

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

        const note = getTableDataWithText(entry.note);
        addAlertClickToElement(note, "Note", entry.note);

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

        const note = getTableDataWithText(entry.note);
        addAlertClickToElement(note, "Note", entry.note);

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
    const events = await getDBEntrees(LOGS_SCHEMA, TIMER_TABLE, "id", "*", settings, dbActive);
    
    if ((!events) || (events.error)) return;

    events.sort((a, b) => {return a.__createdtime__ - b.__createdtime__});

    for (let index = 0; index < events.length; index++) {
        const currentJobEmployeeTask = 
            events[index].jobID + 
            events[index].employeeID + 
            events[index].task;
            
        if (events[index].eventType == "start") {
            events[index].wasCompleted = false;

            for (let startIndex = index + 1; startIndex < events.length; startIndex++) {
                const nextJobEmployeeTask = 
                    events[startIndex].jobID + 
                    events[startIndex].employeeID + 
                    events[startIndex].task;

                if (nextJobEmployeeTask != currentJobEmployeeTask) continue;

                if (events[startIndex].eventType == "start") {
                    // Error
                    break;
                }
                else if (events[startIndex].eventType == "stop") {
                    const taskMS = events[startIndex].__createdtime__ - events[index].__createdtime__;
                    events[index].taskTime = msToTime(taskMS);
                    events[index].taskMS = taskMS;
                    events[index].wasCompleted = true;
                    break;
                }
            }
        }
    }

    console.log(events);
    function msToTime(s) {
        var ms = s % 1000;
        s = (s - ms) / 1000;
        var secs = s % 60;
        s = (s - secs) / 60;
        var mins = s % 60;
        var hrs = (s - mins) / 60;
      
        return hrs + ':' + mins + ':' + secs + '.' + ms;
      }

    return;
    // const tasksList = await getUniqueColumnValues(LOGS_SCHEMA, TIMER_TABLE, "task", settings, dbActive);
    // const jobsList = await getUniqueColumnValues(LOGS_SCHEMA, TIMER_TABLE, "jobName", settings, dbActive);
    
    // let totals = [];
    // // Loop through job names
    // for (const jobName of jobsList) {
    //     const eventArray = await getDBEntrees(LOGS_SCHEMA, TIMER_TABLE, "jobName", jobName, settings, dbActive);
    //     if ((!eventArray) || (eventArray.error)) continue;
    //     eventArray.sort((a, b) => {return a.__createdtime__ - b.__createdtime__});



    //     // Loop through events for each job
    //     for (let eventIndex = 0; eventIndex < eventArray.length; eventIndex++) {
    //         const element = eventArray[eventIndex];
    //         console.log(jobName, element);

    //         for (const task of tasksList) {
                
    //         }
    //     }
    // }

    // const filter = timersJobFilter.value || "*";

    // const response = await getDBEntrees(LOGS_SCHEMA, TIMER_TABLE, "jobName", filter, settings, dbActive);
    
    // if ((!response) || (response.error)) return;

    // response.sort((a, b) => {
    //     const jobNameA = String(a.jobName).toUpperCase();
    //     const jobNameB = String(b.jobName).toUpperCase();
    //     if (jobNameA < jobNameB) return -1;
    //     if (jobNameA > jobNameB) return 1;
    //     return 0;
    // });

    // let jobsListObject = {};

    // for (const job of response) {
    //     if (jobsListObject[job.jobID]) {
    //         jobsListObject[job.jobID].push(job);
    //     }
    //     else {
    //         jobsListObject[job.jobID] = [];
    //         jobsListObject[job.jobID].push(job);
    //     }
    // }

    // for (const jobID in jobsListObject) {
    //     if (Object.hasOwnProperty.call(jobsListObject, jobID)) {
    //         const jobTimerArray = jobsListObject[jobID];
    //         // console.log(jobTimerArray);
    //     }
    // }

    // console.log(jobs);

    timersTable.innerHTML = getTableHeaderRow(["Job", ...tasksList]);

    // for (const entry of response) {
    //     const row = document.createElement('tr');
    //     row.addEventListener('click', async () => {
    //         console.log(entry.jobID);
    //     });

    //     const jobName = getTableDataWithText(entry.jobName);

    //     const employeeName = getTableDataWithText(entry.employeeName);

    //     const task = getTableDataWithText(entry.task);

    //     const eventType = getTableDataWithText(entry.eventType);

    //     appendChildren(row, [jobName, employeeName, task, eventType]);
    //     timersTable.appendChild(row);
    // };
}

// Jobs Table
async function loadJobsTable() {
    const response = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "__createdtime__", "*", settings, dbActive);
    
    if ((!response) || (response.error)) return;

    response.sort((a, b) => {return b.__createdtime__ - a.__createdtime__});

    employeeTable.innerHTML = getTableHeaderRow(["Name", "Active", "Delete"]);

    for (const entry of response) {
        const row = document.createElement('tr');

        const name = getTableDataWithText(entry.name);
        name.onclick = () => {
            showPrompt("Job name", entry.name, async (newName) => {
                await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: entry.id, name: newName}, settings, dbActive);
                await loadJobsTable();
            });
        }
        name.style.cursor = "pointer";

        const active = getTableDataWithCheckbox(
            entry.active,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: entry.id, active: isChecked}, settings, dbActive);
            }
        );

        const deleteTD = getTableDataWithDeleteButton(
            async () => {
                await deleteDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, entry.id, settings, dbActive);
                await loadJobsTable();
            }
        );

        appendChildren(row, [name, active, deleteTD]);
        employeeTable.appendChild(row);
    };
}

// Employees Table
async function loadEmployeeTable() {
    const response = await getDBEntrees(BUSINESS_SCHEMA, EMPLOYEES_TABLE, "__createdtime__", "*", settings, dbActive);
    
    if ((!response) || (response.error)) return;

    response.sort((a, b) => {
        const nameA = String(a.name).toUpperCase();
        const nameB = String(b.name).toUpperCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });

    employeesTable.innerHTML = getTableHeaderRow(["Name", "Stations", "Active", "Delete"]);

    for (const entry of response) {
        const row = document.createElement('tr');

        const name = getTableDataWithText(entry.name);
        name.onclick = () => {
            showPrompt("Employee name", entry.name, async (newName) => {
                await updateDBEntry(BUSINESS_SCHEMA, EMPLOYEES_TABLE, {id: entry.id, name: newName}, settings, dbActive);
                await loadEmployeeTable();
            });
        }
        name.style.cursor = "pointer";

        const stations = getTableDataWithText(entry.stations);
        stations.onclick = () => {
            showPrompt("Work stations", entry.stations, async (newStations) => {
                await updateDBEntry(BUSINESS_SCHEMA, EMPLOYEES_TABLE, {id: entry.id, stations: newStations}, settings, dbActive);
                await loadEmployeeTable();
            });
        }
        stations.style.cursor = "pointer";

        const active = getTableDataWithCheckbox(
            entry.active,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry(BUSINESS_SCHEMA, EMPLOYEES_TABLE, {id: entry.id, active: isChecked}, settings, dbActive);
            }
        );

        const deleteTD = getTableDataWithDeleteButton(
            async () => {
                await deleteDBEntry(BUSINESS_SCHEMA, EMPLOYEES_TABLE, entry.id, settings, dbActive);
                await loadEmployeeTable();
            }
        );

        appendChildren(row, [name, stations,active, deleteTD]);
        employeesTable.appendChild(row);
    };
}

// Supply List Table
async function loadSupplyListTable() {
    const filter = categoryFilterInput.value || "*";

    const response = await getDBEntrees(INVENTORY_SCHEMA, SUPPLY_LIST_TABLE, "category", filter, settings, dbActive);
    
    if ((!response) || (response.error)) return;

    response.sort((a, b) => {
        const categoryA = a.category.toUpperCase();
        const categoryB = b.category.toUpperCase();
        if (categoryA < categoryB) return -1;
        if (categoryA > categoryB) return 1;
        return 0;
    });

    supplyListTable.innerHTML = getTableHeaderRow(["Category", "Item", "Delete"]);

    for (const entry of response) {
        const row = document.createElement('tr');

        const category = getTableDataWithText(entry.category);

        const item = getTableDataWithText(entry.item);
        addAlertClickToElement(item, "Item", entry.item);

        const deleteTD = getTableDataWithDeleteButton(
            async () => {
                await deleteDBEntry(INVENTORY_SCHEMA, SUPPLY_LIST_TABLE, entry.id, settings, dbActive);
                await loadSupplyListTable();
            }
        );

        appendChildren(row, [category, item, deleteTD]);
        supplyListTable.appendChild(row);
    };

    loadDataListWithItemCategories(supplyCategoryDataList);
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

async function loadDataListWithItemCategories(dataList) {
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

function showPrompt(labelText, defaultText, OKCallback, cancelCallback) {
    promptBackground.style.display = "flex";
    // promptBackground.onclick = cancelClick;

    promptLabel.textContent = labelText;

    promptInput.value = defaultText;
    promptInput.select();
    promptInput.onkeypress = (event) => {
        if (event.key === "Enter") okClick();
    }

    promptOKBtn.onclick = okClick;

    promptCancelBtn.onclick = cancelClick;

    function cancelClick() {
        if (cancelCallback) cancelCallback(promptInput.value);
        promptBackground.style.display = "none";
    }

    function okClick() {
        OKCallback(promptInput.value);
        promptBackground.style.display = "none";
    }
}

function addAlertClickToElement(element, title, message) {
    if (!message) return;
    element.onclick = () => {showAlert(title, message);}
    element.style.cursor = "pointer";
}

function showAlert(labelText, messageText, OKCallback) {
    alertBackground.style.display = "flex";
    // alertBackground.onclick = okClick;

    alertLabel.textContent = labelText;

    alertMessage.textContent = messageText;

    alertOKBtn.onclick = okClick;

    function okClick() {
        if (OKCallback) OKCallback();
        alertBackground.style.display = "none";
    }
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

function saveTextFile(data, fileName, fileType) {
    let jsonData = new Blob([data], {type: `text/${fileType}`});  
    let jsonURL = URL.createObjectURL(jsonData);

    let hiddenElement = document.createElement('a');
    hiddenElement.href = jsonURL;
    hiddenElement.target = '_blank';
    hiddenElement.download = `${fileName}.${fileType}`;
    hiddenElement.click();
}