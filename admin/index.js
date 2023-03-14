
import  {
    showAllMessages,
} from "../messaging.js";

import {
    getDBEntrees,
    insertDBEntry,
    updateDBEntry,
    deleteDBEntry,
    createSchema,
    createTable,
    dropTable,
    createAttributes,
    describeDatabase,
    getUniqueColumnValues,
    isSuperUser,
    getUserInfo,
    getUserList,
    addUser,
    addRole,
    deleteRole,
    changeUserRole,
    changeUserPassword,
    changePermission,
    deleteUser,
    getRolesList,
} from "../db-utilities.js";

import {
    getTableDataWithText,
    getTableDataRow,
    getTableDataWithEditText,
    getTableHeaderRow,
    getTableDataWithCheckbox,
    getTableDataWithDeleteButton,
    getTableDropdown,
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
    TASKS_TABLE,
    CALENDAR_TABLE,
    TABLE_ATTRIBUTES,
    SYSTEM_SCHEMA,
    MESSAGES_TABLE,
} from "../directives.js";

import {
    showYesNoDialog,
    showAlertDialog,
    showLoadingDialog,
    showInputDialog,
    showJobDialog,
} from "../dialogs.js";

import {
    getDeleteButton,
} from "../element-utilities.js";

const pageTitle = "Admin";

const settings = {
    url: "",
    authorization: ""
}

let timerLogCSV = "";

// let station = "";

// const homeBtn = document.querySelector("#home-btn");
// const errorMessage = document.querySelector("#error-message");

const sendMessageButton = document.querySelector("#send-message");
const showMessagesButton = document.querySelector("#show-messages");

const tabHeader = document.querySelector("#tab-header");

// Tab Buttons
const partTabBtn = document.querySelector("#parts-tab-btn");
const supplyLowTabBtn = document.querySelector("#supply-low-tab-btn");
const timeClockTabBtn = document.querySelector("#time-clock-tab-btn");
const otherIssuesTabBtn = document.querySelector("#other-issues-tab-btn");
const timersTabBtn = document.querySelector("#timers-tab-btn");
const jobsTabBtn = document.querySelector("#jobs-tab-btn");
const employeesTabBtn = document.querySelector("#employees-tab-btn");
const workStationsTabBtn = document.querySelector("#work-stations-tab-btn");
const usersTabBtn = document.querySelector("#users-tab-btn");
const tasksTabBtn = document.querySelector("#tasks-tab-btn");
const supplyListTabBtn = document.querySelector("#supply-list-tab-btn");
const settingsTabBtn = document.querySelector("#settings-tab-btn");

// Parts Issues
const partsTabContainer = document.querySelector("#part-issue-container");
const partIssuesTable = document.querySelector("#part-issues-table");

// Supplies Issues
const supplyLowTabContainer = document.querySelector("#supply-issues-container");
const supplyIssuesTable = document.querySelector("#supply-issues-table");
const supplyCategoryDataList = document.querySelector("#category-datalist");

// Time Clock Issues
const timeClockTabContainer = document.querySelector("#time-clock-container");
const timeClockTabTable = document.querySelector("#time-clock-issues-table");

// Other Issues
const otherIssuesTabContainer = document.querySelector("#other-issues-container");
const otherIssuesTable = document.querySelector("#other-issues-table");

// Timers
const timersTabContainer = document.querySelector("#timers-container");
const timerLastNumberOfDays = document.querySelector("#last-number-of-days-timer-input");
const saveTimerLogsBtn = document.querySelector("#save-timer-log-btn");
const timersTable = document.querySelector("#timers-table");
const deleteOldTimerLogsBtn = document.querySelector("#delete-old-timer-logs-btn");
const deleteTimerLogsBtn = document.querySelector("#delete-timer-logs-btn");

// Jobs
const jobsTabContainer = document.querySelector("#jobs-container");
// const newJobNameInput = document.querySelector("#job-input");
// const newJobShipDateInput = document.querySelector("#job-ship-date-input");
// const newJobNoteInput = document.querySelector("#job-note-input");
const addJobButton = document.querySelector("#add-job-btn");
const sort = document.querySelector("#sort");
const employeeTable = document.querySelector("#jobs-table");

// Employees
const employeesTabContainer = document.querySelector("#employee-container");
const employeeNameInput = document.querySelector("#employee-input");
const employeeWorkStationsContainer = document.querySelector("#employee-work-station-checkbox-container");
// const employeeWorkStationsInput = document.querySelector("#employee-work-stations-input");
const employeeShiftStart = document.querySelector("#employee-shift-start-input");
const employeeShiftEnd = document.querySelector("#employee-shift-end-input");
const addEmployeeButton = document.querySelector("#add-employee-btn");
const employeesTable = document.querySelector("#employee-table");

// Work Stations
const workStationsTabContainer = document.querySelector("#work-stations-container");
const workStationNameInput = document.querySelector("#work-station-input");
const workStationTasksContainer = document.querySelector("#work-station-tasks-checkbox-container");
// const workStationTasksInput = document.querySelector("#work-station-tasks-input");
const addWorkStationButton = document.querySelector("#add-work-stations-btn");
const workStationsTable = document.querySelector("#work-stations-table");

// Users and Roles
const usersTabContainer = document.querySelector("#users-container");
const addUserBtn = document.querySelector("#add-user-btn");
const usersTable = document.querySelector("#users-table");
const addRoleBtn = document.querySelector("#add-role-btn");
const rolesContainer = document.querySelector("#roles-container");

// Tasks
const taskTabContainer = document.querySelector("#tasks-container");
const taskNameInput = document.querySelector("#task-name-input");
const tasksHoursInput = document.querySelector("#tasks-hours-input");
const tasksMinutesInput = document.querySelector("#tasks-minutes-input");
const addTaskButton = document.querySelector("#add-task-btn");
const tasksTable = document.querySelector("#tasks-table");

// Supplies
const supplyListTabContainer = document.querySelector("#supply-list-container");
const supplyListCategoryInput = document.querySelector("#supply-list-category-input");
const addSupplyBtn = document.querySelector("#add-supply-btn");
const clearSupplyBtn = document.querySelector("#clear-supply-btn");
const categoryFilterInput = document.querySelector("#category-filter-input");
const supplyListItemInput = document.querySelector("#supply-list-item-input");
const supplyListTable = document.querySelector("#supply-list-table");

// Settings
const settingsContainer = document.querySelector("#settings-container");
const darkThemeCheckbox = document.querySelector("#dark-theme-checkbox");
const serverURL = document.querySelector("#server-url");
const serverAuthorization = document.querySelector("#server-authorization");
const stationName = document.querySelector("#station-name");
const stationNamesDatalist = document.querySelector("#station-names-data-list");
// const lateJobsDays = document.querySelector("#late-job-days");
const saveDataBaseButton = document.querySelector("#save-db-backup-btn");
const restoreDataBaseButton = document.querySelector("#restore-db-backup-btn");
const runDBSetupBtn = document.querySelector("#run-db-setup-btn");
const removePasswordBtn = document.querySelector("#remove-password-btn");

// Messages
const messageBackground = document.querySelector("#send-message-background");
const messageLabel = document.querySelector("#send-message-label");
const messageStationsSelect = document.querySelector("#send-message-stations");
const messageInput = document.querySelector("#send-message-textarea");
const messageCancelBtn = document.querySelector("#send-message-cancel-btn");
const messageOKBtn = document.querySelector("#send-message-ok-btn");

// Checklist Prompt
const checklistPromptBackground = document.querySelector("#checklist-prompt");
const checklistPromptLabel = document.querySelector("#checklist-prompt-label");
const checklistPromptCheckContainer = document.querySelector("#checklist-prompt-checkbox-container");
const checklistPromptCancelBtn = document.querySelector("#checklist-prompt-cancel-btn");
const checklistPromptOKBtn = document.querySelector("#checklist-prompt-ok-btn");

// Alert
const alertBackground = document.querySelector("#alert");
const alertLabel = document.querySelector("#alert-label");
const alertMessage = document.querySelector("#alert-message");
const alertOKBtn = document.querySelector("#alert-ok-btn");

// Table modal
const tableModalBackground = document.querySelector("#tableModal");
const tableModalLabel = document.querySelector("#table-modal-label");
const tableModalTable = document.querySelector("#table-modal-table");
const tableModalOKBtn = document.querySelector("#table-modal-ok-btn");

const dbActivityLight = document.querySelector("#db-activity-light");


// ---INITIALIZE---


setTheme();

hideTabContainers();

const password = getLocalStorageValue('password');
if (password !== "pw558") {
    showInputDialog("Enter password", "", (enteredPassword) => {
        if (enteredPassword !== "pw558") {
            const a = document.createElement('a');
            a.href = "/";
            a.click();
        }
        else {
            setLocalStorageValue('password', enteredPassword);
        }
    }, () => {
        const a = document.createElement('a');
        a.href = "/";
        a.click();
    }, 'text', "", null);
}

// Retrieve settings values
settings.url = serverURL.value = getLocalStorageValue('serverURL') || "";
settings.authorization = serverAuthorization.value = getLocalStorageValue('serverAuthorization') || "";
stationName.value = getLocalStorageValue('stationName') || "";
const superUser = await isSuperUser(settings);


// showSettings();
if (serverURL.value && serverAuthorization.value) {
    try {
        await loadPartIssues();
    } catch (error) {
        console.log(error);
    }
    showTabContent("part-issue");
    await checkForUnresolvedIssues();
    
    setInterval(async () => {
        dbActive(true);  // TODO: Should only light up green if it was successful
        await checkForUnresolvedIssues();
    }, 10000);
}
else {
    showTabContent("settings");
}



// ---EVENT LISTENERS---

// Got to home page
window.onkeydown = (event) => {
    if (event.key === "8" && event.ctrlKey) window.location = "/";
}

sendMessageButton.addEventListener("click", () => {
    showSendMessagePrompt(
        async () => {
            const data = {
                station: messageStationsSelect.value,
                text: messageInput.value,
                date: (new Date()).toLocaleDateString('en-CA'),
                time: (new Date()).toLocaleTimeString('en-CA'),
                sender: getLocalStorageValue('stationName') || "",
                displayed: false,
            };
            await insertDBEntry(SYSTEM_SCHEMA, MESSAGES_TABLE, data, settings, dbActive);
        },
        null,
        false
    );
});

showMessagesButton.onclick = showAllMessages;

sort.addEventListener('change', loadJobsTable);

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
    await showTabContent(containerID);

    await checkForUnresolvedIssues();
});

// Timer number of days ago Enter key
timerLastNumberOfDays.addEventListener('keydown', (event) => {
    if (event.key === "Enter") {
        showLoadingDialog(async () => {
            await loadTimersTable();
        });
    }
});
// Save timer logs
saveTimerLogsBtn.addEventListener('click', () => {
    saveTextFile(timerLogCSV, `Timer Logs ${(new Date()).toLocaleDateString()}`, "csv");
});
// Delete Older Timer Logs
timerLastNumberOfDays.addEventListener('keyup', updateDeleteOldTimerLogsBtn);
timerLastNumberOfDays.addEventListener('change', updateDeleteOldTimerLogsBtn);
function updateDeleteOldTimerLogsBtn() {
    deleteOldTimerLogsBtn.textContent = `Delete timers ${timerLastNumberOfDays.value} days and older`;
}
deleteOldTimerLogsBtn.addEventListener('click', async () => {
    const numberOfDaysAgo = timerLastNumberOfDays.value;
    let completedTasks = [];
    await showLoadingDialog(async () => {
        completedTasks = await getDBEntrees(LOGS_SCHEMA, COMPLETED_TIMER_TABLE, "__createdtime__", "*", settings);
        if ((!completedTasks) || (completedTasks.error)) return;

        const numberOfDaysAgo = timerLastNumberOfDays.value;
        for (let index = completedTasks.length - 1; index >= 0; index--) {
            const element = completedTasks[index];
            if (element.__createdtime__ > ((new Date).getTime() - (86400000 * Number(numberOfDaysAgo)))) {
                completedTasks.splice(index, 1);
            }
        }
    });
    const numberOfDeletedLogs = completedTasks.length;
    showYesNoDialog(`Are you sure you want to delete \njobs that are older than ${numberOfDaysAgo} days?\n${numberOfDeletedLogs} logs will be deleted.`, async () => {
        await showLoadingDialog(async () => {
            completedTasks.forEach((task) => {
                deleteDBEntry(LOGS_SCHEMA, COMPLETED_TIMER_TABLE, task.id, settings);
            });
            await loadTimersTable();
        });
        showAlertDialog(`${numberOfDeletedLogs} logs were deleted.`);
    });
})
// Delete Timer Logs
deleteTimerLogsBtn.addEventListener('click', async () => {
    showYesNoDialog("Are you sure you want to delete all timer logs?", async () => {
        let message = await dropTable(COMPLETED_TIMER_TABLE, LOGS_SCHEMA, settings, dbActive) + "\n";
        message += await createTable(COMPLETED_TIMER_TABLE, LOGS_SCHEMA, settings, dbActive) + "\n";
        message += await createAttributes(TABLE_ATTRIBUTES.completed_timers, COMPLETED_TIMER_TABLE, LOGS_SCHEMA, settings, dbActive) + "\n";
        showAlertDialog(message);
        showLoadingDialog(async () => {
            await loadTimersTable();
        });
    });
});

// Add job button
addJobButton.addEventListener('click', async () => {
    const jobsResponse = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "id", "*", settings);
    if ((!jobsResponse) || (jobsResponse.error)) return;

    const tasksResponse = await getDBEntrees(BUSINESS_SCHEMA, TASKS_TABLE, "id", "*", settings);
    if ((!tasksResponse) || (tasksResponse.error)) return;

    showJobDialog(null, jobsResponse, tasksResponse, 
        async (newJob) => {
            await insertDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, newJob, settings);
            await loadJobsTable();
        },
        null,
        null
    );
});

// Add employee button
addEmployeeButton.addEventListener('click', async () => {
    const employeeName = employeeNameInput.value.trim();
    // const workStations = employeeWorkStationsInput.value.trim();
    const shiftStart = employeeShiftStart.value;
    const shiftEnd = employeeShiftEnd.value;

    if (!employeeName) return;

    const checkboxes = employeeWorkStationsContainer.querySelectorAll('input');
    const stations = [];
    checkboxes.forEach((checkbox) => {
        if (checkbox.checked) stations.push(checkbox.id);
    });

    const data = {
        name: employeeName,
        stations: stations,
        shiftStart: shiftStart,
        shiftEnd: shiftEnd,
        active: true,
    };

    await insertDBEntry(BUSINESS_SCHEMA, EMPLOYEES_TABLE, data, settings, dbActive);
    await loadEmployeeTable();

    employeeNameInput.value = "";
});

// Add work station button
addWorkStationButton.addEventListener('click', async () => {
    const stationName = workStationNameInput.value.trim();
    
    if (!stationName) return;

    const checkboxes = workStationTasksContainer.querySelectorAll('input');

    const tasks = [];
    checkboxes.forEach((checkbox) => {
        if (checkbox.checked) tasks.push(checkbox.id);
    });

    const data = {name: stationName, tasks: tasks, active: true};

    await insertDBEntry(BUSINESS_SCHEMA, STATIONS_TABLE, data, settings, dbActive);
    await loadWorkStationTable();

    workStationNameInput.value = "";
    loadTasksCheckboxList();
});

// Add User 
addUserBtn.addEventListener('click', async () => {
    // TODO: check if user already exists
    const rolesResponse = await getRolesList(settings);
    if ((!rolesResponse) || (rolesResponse.error)) return;
    const rolesList = [];
    rolesResponse.forEach((role) => {
        if (role.role == 'cluster_user') return;
        rolesList.push(role.role);
    });

    showInputDialog("New User Name", "",
        async (userName) => {
            showInputDialog("Role", "",
                async (role) => {
                    showInputDialog("Password", "",
                        async (password) => {
                            const returnMessage = await addUser(userName, role, password, settings);
                            if (returnMessage.error) {
                                showAlertDialog(returnMessage.error);
                            } 
                            else {
                                showAlertDialog(`${returnMessage.message}.\n${userName}'s database authorization is: ${btoa(userName + ":" + password)}`);
                            }
                            await loadUsersTable();
                        }, null, "text", "password");
                }, null, "select", "name", rolesList);
        }, null, "text", "name");
});

addRoleBtn.addEventListener("click", async () => {
    showInputDialog("New Role Name", "",
        async (roleName) => {
            showInputDialog("Set default permissions level?", "true",
                async (permissionsLevel) => {
                    const permissions = await getUniversalPermissions(permissionsLevel);
                    const returnMessage = await addRole(roleName, permissions, settings);
                    if (returnMessage.error) {
                        showAlertDialog(returnMessage.error);
                    } 
                    else {
                        showAlertDialog(`"${returnMessage.role}" role added successfully.`);
                    }
                    await loadRolesList();
                }, null, "select", "true", ["true", "false"]);
        }, null, "text", "name");

        async function getUniversalPermissions(permissionsLevel) {
            permissionsLevel = (permissionsLevel === "true") ? true : false;
            let permissions = {super_user: false};
            const database = await describeDatabase(settings);
            for (const schemaName in database) {
                if (Object.hasOwnProperty.call(database, schemaName)) {
                    const schemaObj = database[schemaName];
                    permissions[schemaName] = {};
                    
                    for (const tableName in schemaObj) {
                        if (Object.hasOwnProperty.call(schemaObj, tableName)) {
                            // let tableObj = schemaObj[tableName];
                            if (!permissions[schemaName]['tables']) {
                                permissions[schemaName]['tables'] = {}
                            };

                            permissions[schemaName]['tables'][tableName] = 
                                {
                                    "read": permissionsLevel,
                                    "insert": permissionsLevel,
                                    "update": permissionsLevel,
                                    "delete": permissionsLevel,
                                    "attribute_permissions": [],
                                }
                        }
                    }
                }
            }
            return permissions;
        }
});

// Add tasks button
addTaskButton.addEventListener('click', async () => {
    const taskName = taskNameInput.value.trim();
    const hours = tasksHoursInput.value.trim() || 0;
    const minutes = tasksMinutesInput.value.trim() || 0;

    if (!taskName) return;

    const data = {name: taskName, hours: hours, minutes: minutes, active: true};

    await insertDBEntry(BUSINESS_SCHEMA, TASKS_TABLE, data, settings, dbActive);
    await loadTasksTable();

    taskNameInput.value = "";
    tasksHoursInput.value = "";
    tasksMinutesInput.value = "";
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

restoreDataBaseButton.addEventListener('change', async (event) => {
    const reader = new FileReader();
    reader.onload = onReaderLoad;
    reader.readAsText(event.target.files[0]);

    async function onReaderLoad(event){
        await showLoadingDialog(async () => {
            await restoreDataBase(JSON.parse(event.target.result));
        }, "Working to restore database...");
    }
});
async function restoreDataBase(jsonFileDate) {
    let message = 'Setting up Schemas, Tables, and Attributes:\n';
    message += await runBDSetup(false) + "\n";
    message += "\nRestoring Data:\n";

    for (const schemaName in jsonFileDate) {
        if (!Object.hasOwnProperty.call(jsonFileDate, schemaName)) return;
        const schemaObj = jsonFileDate[schemaName];
        for (const tableName in schemaObj) {
            if (!Object.hasOwnProperty.call(schemaObj, tableName)) return;
            const tableObj = schemaObj[tableName];
            for (const row in tableObj) {
                if (!Object.hasOwnProperty.call(tableObj, row)) return;
                const data = tableObj[row];
                message += await insertDBEntry(schemaName, tableName, data, settings, dbActive) + "\n";
            }
        }
    }
    showAlert("Database message", message, null, ["successfully", "inserted", "already exists"]);
}

runDBSetupBtn.addEventListener('click', () => {runBDSetup(true)});
async function runBDSetup(showAlertMessage) {
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
    
    message += await createTable(RUNNING_TIMER_TABLE, LOGS_SCHEMA, settings, dbActive) + "\n";
    message += await createAttributes(TABLE_ATTRIBUTES.running_timers, RUNNING_TIMER_TABLE, LOGS_SCHEMA, settings, dbActive) + "\n";

    message += await createTable(COMPLETED_TIMER_TABLE, LOGS_SCHEMA, settings, dbActive) + "\n";
    message += await createAttributes(TABLE_ATTRIBUTES.completed_timers, COMPLETED_TIMER_TABLE, LOGS_SCHEMA, settings, dbActive) + "\n";

    // Business
    message += await createSchema(BUSINESS_SCHEMA, settings, dbActive) + "\n";
    message += await createTable(EMPLOYEES_TABLE, BUSINESS_SCHEMA, settings, dbActive) + "\n";
    message += await createAttributes(TABLE_ATTRIBUTES.employees, EMPLOYEES_TABLE, BUSINESS_SCHEMA, settings, dbActive) + "\n";
    message += await createTable(JOBS_TABLE, BUSINESS_SCHEMA, settings, dbActive) + "\n";
    message += await createAttributes(TABLE_ATTRIBUTES.jobs, JOBS_TABLE, BUSINESS_SCHEMA, settings, dbActive) + "\n";
    message += await createTable(STATIONS_TABLE, BUSINESS_SCHEMA, settings, dbActive) + "\n";
    message += await createAttributes(TABLE_ATTRIBUTES.stations, STATIONS_TABLE, BUSINESS_SCHEMA, settings, dbActive) + "\n";
    message += await createTable(TASKS_TABLE, BUSINESS_SCHEMA, settings, dbActive) + "\n";
    message += await createAttributes(TABLE_ATTRIBUTES.tasks, TASKS_TABLE, BUSINESS_SCHEMA, settings, dbActive) + "\n";

    // Calendar
    message += await createTable(CALENDAR_TABLE, BUSINESS_SCHEMA, settings, dbActive) + "\n";
    message += await createAttributes(TABLE_ATTRIBUTES.calendar, CALENDAR_TABLE, BUSINESS_SCHEMA, settings, dbActive) + "\n";
    
    // System
    message += await createSchema(SYSTEM_SCHEMA, settings, dbActive) + "\n";
    message += await createTable(MESSAGES_TABLE, SYSTEM_SCHEMA, settings, dbActive) + "\n";

    if (showAlertMessage) showAlert("Database message", message, null, ["successfully"]);

    return message;
}

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
});

// Save late days on blur
// lateJobsDays.addEventListener('change', () => {
//     setLocalStorageValue('lateJobsDays', lateJobsDays.value);
// });




// ---FUNCTIONS---

async function showTabContent(tab) {
    hideTabContainers();

    const buttons = document.querySelectorAll("#tab-header .tab-btn");
    buttons.forEach((button) => {
        button.classList.remove("active-tab");
    });

    switch (tab) {
        case "part-issue":
            partsTabContainer.style.display = "flex";
            partTabBtn.classList.add("active-tab");
            showLoadingDialog(async () => {
                await loadPartIssues();
            });
            break;
        case "supply-issues":
            supplyLowTabContainer.style.display = "flex";
            supplyLowTabBtn.classList.add("active-tab");
            showLoadingDialog(async () => {
                await loadSuppliesIssues();
            });
            break;
        case "time-clock":
            timeClockTabContainer.style.display = "flex";
            timeClockTabBtn.classList.add("active-tab");
            showLoadingDialog(async () => {
                await loadTimeClockIssues();
            });
            break;
        case "other-issues":
            otherIssuesTabContainer.style.display = "flex";
            otherIssuesTabBtn.classList.add("active-tab");
            showLoadingDialog(async () => {
                await loadOtherIssues();
            });
            break;
        case "timers":
            timersTabContainer.style.display = "flex";
            timersTabBtn.classList.add("active-tab");
            showLoadingDialog(async() => {
                await loadTimersTable();
            });
            break;
        case "jobs":
            jobsTabContainer.style.display = "flex";
            jobsTabBtn.classList.add("active-tab");
            showLoadingDialog(async () => {
                await loadJobsTable();
            });
            break;
        case "employees":
            employeesTabContainer.style.display = "flex";
            employeesTabBtn.classList.add("active-tab");
            showLoadingDialog(async () => {
                await loadWorkStationsCheckboxList();
                await loadEmployeeTable();
            });
            break;
        case "work-stations":
            workStationsTabContainer.style.display = "flex";
            workStationsTabBtn.classList.add("active-tab");
            await loadTasksCheckboxList();
            showLoadingDialog(async () => {
                await loadWorkStationTable();
            });
            break;
        case "users":
            usersTabContainer.style.display = "flex";
            usersTabBtn.classList.add("active-tab");
            showLoadingDialog(async () => {
                await loadUsersTable();
                await loadRolesList();
            });
            break;
        case "tasks":
            taskTabContainer.style.display = "flex";
            tasksTabBtn.classList.add("active-tab");
            await loadTasksTable();
                showLoadingDialog(async () => {
            });
            break;
        case "supply-list":
            supplyListTabContainer.style.display = "flex";
            supplyListTabBtn.classList.add("active-tab");
            showLoadingDialog(async () => {
                await loadSupplyListTable();
            });
            break;
        case "settings":
            settingsContainer.style.display = "flex";
            settingsTabBtn.classList.add("active-tab");
            showLoadingDialog(async () => {
                await loadDataListWithItemOptions(stationNamesDatalist, BUSINESS_SCHEMA, STATIONS_TABLE, "__createdtime__", "*");
                stationName.value = getLocalStorageValue('stationName') || "";
            });
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
    if ((!response) || (response.error)) return 0;
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

    partIssuesTable.innerHTML = "";
    partIssuesTable.appendChild(getTableHeaderRow(["Job", "Cabinet", "Part", "Note", "Date", "Time", "Sent*", "Show", "Delete"]));

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

    supplyIssuesTable.innerHTML = "";
    supplyIssuesTable.appendChild(getTableHeaderRow(["Category", "Item", "Currently", "Note", "Date", "Time", "Ordered*", "Show", "Delete"]))
        // getTableHeaderRow(["Category", "Item", "Currently", "Note", "Date", "Time", "Ordered*", "Show", "Delete"]);

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

    timeClockTabTable.innerHTML = "";
    timeClockTabTable.appendChild(getTableHeaderRow(["Name", "Missed Time", "Note", "Date", "Time", "Acknowledged*", "Delete"]));

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

    otherIssuesTable.innerHTML = "";
    otherIssuesTable.appendChild(getTableHeaderRow(["Note", "Date", "Time", "Acknowledged*", "Delete"]));

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

// Timer
async function loadTimersTable() {
    // Get all completed tasks
    const completedTasks = await getDBEntrees(LOGS_SCHEMA, COMPLETED_TIMER_TABLE, "__createdtime__", "*", settings);
    if ((!completedTasks) || (completedTasks.error)) return;

    // Remove older completed tasks
    const numberOfDaysAgo = timerLastNumberOfDays.value;
    for (let index = completedTasks.length - 1; index >= 0; index--) {
        const element = completedTasks[index];
        if (element.__createdtime__ < ((new Date).getTime() - (86400000 * Number(numberOfDaysAgo)))) {
            completedTasks.splice(index, 1);
        }
    }

    completedTasks.sort((a, b) => {return a.__createdtime__ - b.__createdtime__});

    // Get all jobs
    const jobs = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "__createdtime__", "*", settings, dbActive);
    if ((!jobs) || (jobs.error)) return;
    jobs.sort((a, b) => {
        const nameA = String(a.name).toUpperCase();
        const nameB = String(b.name).toUpperCase();
        if (nameA < nameB) return 1;
        if (nameA > nameB) return -1;
        return 0;
    });

    // Find all unique tasks
    const taskArray = [];
    completedTasks.forEach((task) => {
        if (taskArray.indexOf(task.task) === -1) {
            taskArray.push(task.task);
        }
    });
    
    // Setup header
    const tableData = [["Job", ...taskArray, "Total"]];

    // Add jobs IDs to tableData
    const usedJobIDs = [];
    completedTasks.forEach((task) => {
        if (usedJobIDs.indexOf(task.jobID) == -1) {
            tableData.push([String(task.jobID)]);
            usedJobIDs.push(task.jobID);
        }
    });

    for (const task of completedTasks) {
        for (const row of tableData) {
            // Find jobID in tableData
            if (task.jobID == row[0]) {
                for (let taskIndex = 0; taskIndex < taskArray.length; taskIndex++) {
                    const taskName = taskArray[taskIndex];
                    const column = taskIndex + 1;
                    
                    if (task.task == taskName) {
                        if (!row[column]) row[column] = 0;
                        row[column] += task.durationMS;
                    }
                }
            }
        }
    }

    // Replace jobIDs with their names
    tableData.forEach((row) => {
        let jobNameFound = false;
        jobs.forEach((job) => {
            if (job.id === row[0]) {
                row[0] = String(job.name);
                jobNameFound = true;
            }
        });
        // Find job names for deleted jobs
        if (!jobNameFound) {
            completedTasks.forEach((task) => {
                if (task.jobID === row[0]) {
                    row[0] = String(task.jobName);
                }
            });
        }
    });

    // Find the number of columns in the table
    let maxNumberOfColumns = 1;
    for (const row of tableData) {
        maxNumberOfColumns = Math.max(maxNumberOfColumns, row.length);
    }

    // Total rows
    for (let rowIndex = 1; rowIndex < tableData.length; rowIndex++) {
        const row = tableData[rowIndex];
        row.length = maxNumberOfColumns;
        let rowTotal = 0;
        for (let colIndex = 1; colIndex < row.length; colIndex++) {
            const cell = row[colIndex];
            rowTotal += cell || 0;
        }
        row[maxNumberOfColumns - 1] = rowTotal;
    }

    // Total rows
    for (let rowIndex = 1; rowIndex < tableData.length; rowIndex++) {
        const row = tableData[rowIndex];
        for (let colIndex = 1; colIndex < row.length; colIndex++) {
            if (row[colIndex]) {
                row[colIndex] = msToTime(row[colIndex]);
            }
            else {
                row[colIndex] = "";
            }
        }
    }

    buildTimersTable(tableData);
    loadGlobalCSV(tableData);
}

function buildTimersTable(array) {
    timersTable.innerHTML = "";
    timersTable.appendChild(getTableHeaderRow(array[0]));
    for (let rowIndex = 1; rowIndex < array.length; rowIndex++) {
        const row = array[rowIndex];
        timersTable.appendChild(getTableDataRow(row));
    }
}

function loadGlobalCSV(array) {
    timerLogCSV = "";
    array.forEach((row) => {
        timerLogCSV += row.join(",") + "\n";
    });
}

// Jobs Table
async function loadJobsTable() {
    const response = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "__createdtime__", "*", settings, dbActive);
    
    if ((!response) || (response.error)) return;

    switch (sort.value) {
        case "job-name-low-to-high":
            response.sort((a, b) => {
                const nameA = String(a.name).toUpperCase();
                const nameB = String(b.name).toUpperCase();
                if (nameA < nameB) return 1;
                if (nameA > nameB) return -1;
                return 0;
            });
            break;
        case "job-name-high-to-low":
            response.sort((a, b) => {
                const nameA = String(a.name).toUpperCase();
                const nameB = String(b.name).toUpperCase();
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            });
            break;
        case "latest-ship-date":
            response.sort((a, b) => {
                const shipDateA = a.shipDate;
                const shipDateB = b.shipDate;
                if (shipDateA < shipDateB) return 1;
                if (shipDateA > shipDateB) return -1;
                return 0;
            });
            break;
        case "earliest-ship-date":
            response.sort((a, b) => {
                const shipDateA = a.shipDate;
                const shipDateB = b.shipDate;
                if (shipDateA < shipDateB) return -1;
                if (shipDateA > shipDateB) return 1;
                return 0;
            });
            break;
    
        default:
            break;
    }
    // response.sort((a, b) => {
    //     const nameA = String(a.name).toUpperCase();
    //     const nameB = String(b.name).toUpperCase();
    //     if (nameA < nameB) return 1;
    //     if (nameA > nameB) return -1;
    //     return 0;
    // });

    employeeTable.innerHTML = "";
    employeeTable.appendChild(getTableHeaderRow(["Name", "Ship Date", "Additional Supplies", "Note", "Active", "Delete"]));

    for (const entry of response) {
        // Job name
        const name = getTableDataWithText(entry.name);
        name.onclick = () => {
            showInputDialog("Job name", entry.name, async (newName) => {
                await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: entry.id, name: newName}, settings, dbActive);
                await loadJobsTable();
            }, null, 'text', "");
        }
        name.style.cursor = "pointer";

        // Ship date
        const shipDate = getTableDataWithText(entry.shipDate);
        shipDate.onclick = () => {
            showInputDialog("Ship Date", entry.shipDate, async (newShipDate) => {
                await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: entry.id, shipDate: newShipDate}, settings, dbActive);
                await loadJobsTable();
            }, null, 'date')};
        shipDate.style.cursor = "pointer";

        // Additional Supplies
        let additionalSupplies = getTableDataWithText("");
        if (entry.additionalSupplies && entry.additionalSupplies.length > 0) {
            let additionalSuppliesText = "";
            for (const suppliesText of entry.additionalSupplies) {
                additionalSuppliesText += suppliesText.supplies + " : " + suppliesText.note + "\n";
            }
            additionalSupplies.onclick = () => {
                tableModalTable.innerHTML = "";
                tableModalTable.appendChild(getTableHeaderRow(["Supplies", "Note", "Delete"]));
                
                for (let supplyIndex = 0; supplyIndex < entry.additionalSupplies.length; supplyIndex++) {
                    const additionalSuppliesLine = entry.additionalSupplies[supplyIndex];
                    additionalSuppliesText += additionalSuppliesLine.supplies + ":" + additionalSuppliesLine.note + "\n";
                    
                    const supplyName = getTableDataWithText(additionalSuppliesLine.supplies);
                    supplyName.style.cursor = "pointer";
                    supplyName.onclick = () => {
                        tableModalBackground.style.display = "none";
                        showInputDialog("Additional Supplies Name",
                                        additionalSuppliesLine.supplies,
                                        async (newSupplyName) => {
                                            entry.additionalSupplies[supplyIndex].supplies = newSupplyName;
                                            supplyName.innerText = newSupplyName;
                                            await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, entry, settings, dbActive);
                                            await loadJobsTable();
                                            tableModalBackground.style.display = "flex";
                                        }, null, 'text', "");
                    }

                    const supplyNote = getTableDataWithText(additionalSuppliesLine.note);
                    supplyNote.style.cursor = "pointer";
                    supplyNote.onclick = () => {
                        tableModalBackground.style.display = "none";
                        showInputDialog("Additional Supplies Name",
                                        additionalSuppliesLine.note, async (newSupplyNote) => {
                                            entry.additionalSupplies[supplyIndex].note = newSupplyNote;
                                            supplyNote.innerText = newSupplyNote;
                                            await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, entry, settings, dbActive);
                                            await loadJobsTable();
            
                                            tableModalBackground.style.display = "flex";
                                        }, async () => {
                                            tableModalBackground.style.display = "flex";
                                        }, 'text', "");
                    }

                    // Delete supply button
                    const deleteSupplyTD = getTableDataWithDeleteButton(
                        async () => {
                            entry.additionalSupplies.splice(supplyIndex, 1);
                            tableModalTable.removeChild(supplyRow);
                            await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, entry, settings, dbActive);
                            await loadJobsTable();
                        }
                    );

                    const supplyRow = document.createElement('tr');
                    appendChildren(supplyRow, [supplyName, supplyNote, deleteSupplyTD]);
                    tableModalTable.appendChild(supplyRow);
                }
                showTableModal("Additional Supplies");
            }
            additionalSupplies.textContent = additionalSuppliesText;
            additionalSupplies.style.cursor = "pointer";
        }

        // Notes
        const note = getTableDataWithText(entry.note);
        note.onclick = () => {
            showInputDialog("Additional Supplies Name",
                            entry.note, async (newNote) => {
                                await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: entry.id, note: newNote}, settings, dbActive);
                                await loadJobsTable();
                            }, null, 'text');
        }
        note.style.cursor = "pointer";

        // Active jobs
        const active = getTableDataWithCheckbox(
            entry.active,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: entry.id, active: isChecked}, settings, dbActive);
            }
        );

        // Delete button
        const deleteTD = getTableDataWithDeleteButton(() => {
             showYesNoDialog(`Delete job ${entry.name}?`, async () => {
                await deleteDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, entry.id, settings, dbActive);
                await loadJobsTable();
            })}
        );

        const row = document.createElement('tr');
        appendChildren(row, [name, shipDate, additionalSupplies, note, active, deleteTD]);
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

    employeesTable.innerHTML = "";
    employeesTable.appendChild(getTableHeaderRow(["Name", "Stations", "Shift Start", "Shift End", "Active", "Delete"]));

    for (const entry of response) {
        const row = document.createElement('tr');

        const name = getTableDataWithText(entry.name);
        name.onclick = () => {
            showInputDialog("Employee name",
                            entry.name,
                            async (newName) => {
                                await updateDBEntry(BUSINESS_SCHEMA, EMPLOYEES_TABLE, {id: entry.id, name: newName}, settings, dbActive);
                                await loadEmployeeTable();
                            }, null, 'text');
        }
        name.style.cursor = "pointer";

        // Work Stations
        let stations = document.createElement('td');
        // Old system
        if (typeof entry.stations === "string") {
            stations = getTableDataWithText(entry.stations);
            stations.onclick = () => {
                showInputDialog("Stations name",
                                entry.stations,
                                async (newStations) => {
                                    console.log('p');
                                    await updateDBEntry(BUSINESS_SCHEMA, EMPLOYEES_TABLE, {id: entry.id, stations: newStations}, settings, dbActive);
                                    await loadEmployeeTable();
                                }
                                , null, 'text');
            }
            stations.style.cursor = "pointer";
        } // New system
        else if (Array.isArray(entry.stations)) {
            const stationsResponse = await getDBEntrees(BUSINESS_SCHEMA, STATIONS_TABLE, "__createdtime__", "*", settings, dbActive);
            if ((!stationsResponse) || (stationsResponse.error)) return;
            
            // Add checked true if has station
            const allStations = [...stationsResponse];
            allStations.forEach(stations => stations.checked = false);
            for (const station of allStations) {
                for (const ownStation of entry.stations) {
                    if (ownStation === station.id) station.checked = true;
                }
            }

            let ownStationsName = "";
            for (const station of allStations) {
                for (const ownStation of entry.stations) {
                    if (ownStation === station.id) ownStationsName += station.name + ',';
                }
            }

            stations = getTableDataWithText(ownStationsName);
            stations.onclick = async () => {
                showChecklistPrompt("Stations", allStations, async (newStations) => {
                    await updateDBEntry(BUSINESS_SCHEMA, EMPLOYEES_TABLE, {id: entry.id, stations: newStations}, settings, dbActive);
                    await loadEmployeeTable();
                });
            }
            stations.style.cursor = "pointer";
        }

        const shiftStartTime = hours24To12(entry.shiftStart);
        const shiftStart = getTableDataWithText(shiftStartTime);
        shiftStart.onclick = () => {
            console.log(entry.shiftStart);
            showInputDialog("Shift Start",
                            entry.shiftStart, 
                            async (newsShiftStart) => {
                                await updateDBEntry(BUSINESS_SCHEMA, EMPLOYEES_TABLE, {id: entry.id, shiftStart: newsShiftStart}, settings, dbActive);
                                await loadEmployeeTable();
                            },
                            null, 'time')};
        shiftStart.style.cursor = "pointer";

        const shiftEndTime = hours24To12(entry.shiftEnd);
        const shiftEnd = getTableDataWithText(shiftEndTime);
        shiftEnd.onclick = () => {
            showInputDialog("Shift End",
                            entry.shiftEnd, 
                            async (newsShiftEnd) => {
                                await updateDBEntry(BUSINESS_SCHEMA, EMPLOYEES_TABLE, {id: entry.id, shiftEnd: newsShiftEnd}, settings, dbActive);
                                await loadEmployeeTable();
                            },
                            null, 'time');
        }
        shiftEnd.style.cursor = "pointer";

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

        appendChildren(row, [name, stations, shiftStart, shiftEnd, active, deleteTD]);
        employeesTable.appendChild(row);
    };
}

// Work Station Table
async function loadWorkStationTable() {
    const response = await getDBEntrees(BUSINESS_SCHEMA, STATIONS_TABLE, "__createdtime__", "*", settings, dbActive);
    
    if ((!response) || (response.error)) return;

    response.sort((a, b) => {
        const nameA = String(a.name).toUpperCase();
        const nameB = String(b.name).toUpperCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });

    let rowElementArray = [];

    for (const entry of response) {
        const row = document.createElement('tr');

        const name = getTableDataWithText(entry.name);
        name.onclick = () => {
            showInputDialog("Station name",
            entry.name,
                async (newName) => {
                    await updateDBEntry(BUSINESS_SCHEMA, STATIONS_TABLE, {id: entry.id, name: newName}, settings, dbActive);
                    await loadWorkStationTable();
                }, null, 'text');
        }
        name.style.cursor = "pointer";

        let tasksTD = document.createElement('td');
        // Old system
        if (typeof entry.tasks === "string") {
            tasksTD = getTableDataWithText(entry.tasks);
            tasksTD.onclick = () => {
                showInputDialog("Tasks",
                    entry.tasks,
                    async (newTask) => {
                        await updateDBEntry(BUSINESS_SCHEMA, STATIONS_TABLE, {id: entry.id, tasks: newTask}, settings, dbActive);
                        await loadWorkStationTable();
                    }, null, 'text');
            }
            tasksTD.style.cursor = "pointer";
        } // New system
        else if (Array.isArray(entry.tasks)) {
            const tasksResponse = await getDBEntrees(BUSINESS_SCHEMA, TASKS_TABLE, "__createdtime__", "*", settings, dbActive);
            if ((!tasksResponse) || (tasksResponse.error)) return;
            
            // Add checked true if has task
            const allTasks = [...tasksResponse];
            allTasks.forEach(task => task.checked = false);
            for (const task of allTasks) {
                for (const ownTask of entry.tasks) {
                    if (ownTask === task.id) task.checked = true;
                }
            }

            let ownTaskName = "";
            for (const task of allTasks) {
                for (const ownTask of entry.tasks) {
                    if (ownTask === task.id) ownTaskName += task.name + ',';
                }
            }

            tasksTD = getTableDataWithText(ownTaskName);
            tasksTD.onclick = async () => {
                showChecklistPrompt("Tasks", allTasks, async (newTasks) => {
                    await updateDBEntry(BUSINESS_SCHEMA, STATIONS_TABLE, {id: entry.id, tasks: newTasks}, settings, dbActive);
                    await loadWorkStationTable();
                });
            }
            tasksTD.style.cursor = "pointer";
        }

        const active = getTableDataWithCheckbox(
            entry.active,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry(BUSINESS_SCHEMA, STATIONS_TABLE, {id: entry.id, active: isChecked}, settings, dbActive);
            }
        );

        const deleteTD = getTableDataWithDeleteButton(
            async () => {
                await deleteDBEntry(BUSINESS_SCHEMA, STATIONS_TABLE, entry.id, settings, dbActive);
                await loadWorkStationTable();
            }
        );

        appendChildren(row, [name, tasksTD, active, deleteTD]);
            rowElementArray.push(row);
    };
    workStationsTable.innerHTML = "";
    workStationsTable.appendChild(getTableHeaderRow(["Station", "Tasks", "Active", "Delete"]));
    rowElementArray.forEach((row) => {
        workStationsTable.appendChild(row);
    });
}

async function loadWorkStationsCheckboxList() {
    const workStationsResponse = await getDBEntrees(BUSINESS_SCHEMA, STATIONS_TABLE, "active", true, settings, dbActive);
    if ((!workStationsResponse) || (workStationsResponse.error)) return;

    employeeWorkStationsContainer.innerHTML = "";

    workStationsResponse.forEach((station) => {
        const checkLabel = document.createElement('label');
        checkLabel.classList.add('checklist-prompt-check-label');

        const checkbox = document.createElement('input');
        checkbox.setAttribute('type', 'checkbox');

        checkLabel.innerText = station.name;
        checkbox.id = station.id;

        checkLabel.appendChild(checkbox);
        employeeWorkStationsContainer.appendChild(checkLabel);
    });
}

async function loadTasksCheckboxList() {
    const tasksResponse = await getDBEntrees(BUSINESS_SCHEMA, TASKS_TABLE, "active", true, settings, dbActive);
    if ((!tasksResponse) || (tasksResponse.error)) return;

    workStationTasksContainer.innerHTML = "";

    tasksResponse.forEach((task) => {
        const checkLabel = document.createElement('label');
        checkLabel.classList.add('checklist-prompt-check-label');

        const checkbox = document.createElement('input');
        checkbox.setAttribute('type', 'checkbox');

        checkLabel.innerText = task.name;
        checkbox.id = task.id;

        checkLabel.appendChild(checkbox);
        workStationTasksContainer.appendChild(checkLabel);
    });
}

// Users Table
async function loadUsersTable() {
    const usersResponse = await getUserList(settings);
    if ((!usersResponse) || (usersResponse.error)) return;

    const rolesResponse = await getRolesList(settings);
    if ((!rolesResponse) || (rolesResponse.error)) return;
    const rolesList = [];
    rolesResponse.forEach((role) => {
        if (role.role == 'cluster_user') return;
        rolesList.push(role.role);
    });

    const dataBaseResponse = await describeDatabase(settings);
    const schemas = [];
    for (const schemaName in dataBaseResponse) {
        const tablesObj = dataBaseResponse[schemaName];
        if (Object.hasOwnProperty.call(dataBaseResponse, schemaName)) {
            const tables = [];
            for (const table in tablesObj) {
                if (Object.hasOwnProperty.call(tablesObj, table)) {
                    const element = tablesObj[table];
                    tables.push({name: table, id: element.id, value: element});
                }
            }
            schemas.push({name: schemaName, tables: tables})
        }
    }

    // Users table
    usersTable.innerHTML = "";
    usersTable.appendChild(getTableHeaderRow(["Name", "Role", "Password", "Delete"]));
    for (const user of usersResponse) {
        const row = document.createElement('tr');

        // User name
        const userName = getTableDataWithText(user.username);
        userName.onclick = () => {
            showAlertDialog("The user name can not be changed.");
        }
        userName.style.cursor = "pointer";

        // Role
        let role;
        if (superUser && (user.role.role === 'super_user')) {
            role = getTableDataWithText(user.role.role);
        }
        else {
            const roleListWithoutSuperUser = rolesList.filter((value, index, arr) => { 
                return !(value === 'super_user');
            });
            role = getTableDropdown(user.role.role, roleListWithoutSuperUser, async (newRole) => {
               const message = await changeUserRole(user.username, newRole, settings);
               showAlertDialog(message.message);
            });
           role.style.cursor = "pointer";
        }

        // Password
        let password;
        if (superUser && (user.role.role === 'super_user')) {
            password = getTableDataWithText("****");
        }
        else {
            password = getTableDataWithText("****");
            password.onclick = async () => {
                showInputDialog("New Password", "",
                    async (newPassword) => {
                        const message = await changeUserPassword(user.username, newPassword, settings);
                        showAlertDialog(message.message);
                    }, null, "text", ""
                );
            }
            password.style.cursor = "pointer";
        }

        // Delete user
        let deleteTD; 
        if (superUser && (user.role.role === 'super_user')) {
            deleteTD = getTableDataWithText("-");
        }
        else {
            deleteTD = getTableDataWithDeleteButton(
                async () => {
                    showYesNoDialog(`Are you sure you want to delete user "${user.username}"?`, 
                        async () => {
                            const deleteResponse = await deleteUser(user.username, settings);
                            showAlertDialog(`User ${deleteResponse.message}`);
                            await loadUsersTable();
                        }
                    );
                }
            );
        }

        appendChildren(row, [userName, role, password, deleteTD]);
        usersTable.appendChild(row);
    };
}

// Roles List
async function loadRolesList() {
    const rolesResponse = await getRolesList(settings);
    if ((!rolesResponse) || (rolesResponse.error)) return;
    
    // Remove super user and cluster user
    const roles = [];
    rolesResponse.forEach((role) => {
        if (role.role === "cluster_user") return;
        if (role.role === "super_user") return;
        roles.push(role);
    });

    // Roles table
    rolesContainer.innerHTML = "";
    // rolesContainer.onclick = (event) => {
    //     rolesContainer.lastElementChild.scrollIntoView();
    //     rolesContainer.firstElementChild.scrollIntoView();
    //     console.log(rolesContainer.lastElementChild);
    // }
    

    // Roles
    for (const role of roles) {
        role.permission.super_user = false;
        
        const roleDetails = document.createElement('details');
        roleDetails.classList.add('roles-details');
        const roleSummary = document.createElement('summary');
        roleSummary.textContent = role.role;
        roleSummary.setAttribute('title', "Role");
        const deleteBtn = getDeleteButton(async () => {
            showYesNoDialog(`Are you sure you want to delete role "${role.role}"?`,
                async () => {
                    const deleteMessage = (await deleteRole(role.id, settings));
                    showAlertDialog(deleteMessage);
                    loadRolesList();
                });
            });
        roleSummary.appendChild(deleteBtn);
        roleDetails.appendChild(roleSummary);
        rolesContainer.appendChild(roleDetails);

        // Schemas
        for (const schemaName in role.permission) {
            if (!Object.hasOwnProperty.call(role.permission, schemaName)) continue;
            if (schemaName === "super_user") continue;

            const schemaObj = role.permission[schemaName];

            const schemaDetails = document.createElement('details');
            schemaDetails.classList.add('schemas-details');
            const schemaSummary = document.createElement('summary');
            schemaSummary.textContent = schemaName;
            schemaDetails.appendChild(schemaSummary);
            roleDetails.appendChild(schemaDetails);
            
            for (const tableName in schemaObj.tables) {
                if (!Object.hasOwnProperty.call(schemaObj.tables, tableName)) continue;
                const tableObj = schemaObj.tables[tableName];
                
            const tableDetails = document.createElement('details');
            tableDetails.classList.add('tables-details');
                const tableSummary = document.createElement('summary');
                tableSummary.textContent = tableName;
                tableDetails.appendChild(tableSummary);
                const readCheckbox = createCheckbox("Read", tableObj, 'read');
                readCheckbox.style.display = 'flex';
                tableDetails.appendChild(readCheckbox);
                const insertCheckbox = createCheckbox("Insert", tableObj, 'insert');
                insertCheckbox.style.display = 'flex';
                tableDetails.appendChild(insertCheckbox);
                const updateCheckbox = createCheckbox("Update", tableObj, 'update');
                updateCheckbox.style.display = 'flex';
                tableDetails.appendChild(updateCheckbox);
                const deleteCheckbox = createCheckbox("Delete", tableObj, 'delete');
                deleteCheckbox.style.display = 'flex';
                tableDetails.appendChild(deleteCheckbox);

                tableDetails.onchange = async () => {
                    role.permission[schemaName].tables[tableName] = tableObj;
                    await updatePermission(role, settings);
                }
                schemaDetails.appendChild(tableDetails);
            }
        }
    }
    // Open all details
    // const allDetails = rolesContainer.querySelectorAll('details');

    async function updatePermission(role, settings) {
        const body =  {
            operation: "alter_role",
            id: role.id,
            role: role.role,
            permission: role.permission
        }
        return await changePermission(body, settings);
    }

    function createCheckbox(name, checkObj, key) {
        const checkbox = document.createElement('input');
        checkbox.setAttribute('type', 'checkbox');
        checkbox.style.height = '1em';
        if (checkObj[key]) checkbox.setAttribute('checked', 'checked');
        checkbox.onchange = (event) => {
            checkObj[key] = event.target.checked;
            checkboxLabel.setAttribute('checked', event.target.checked);
        }
        const checkboxLabel = document.createElement('label');
        checkboxLabel.textContent = name;
        checkboxLabel.style.display = 'block';
        checkboxLabel.checked = checkObj[key];
        if (checkObj[key]) checkboxLabel.setAttribute('checked', true);
        checkboxLabel.appendChild(checkbox);
        return checkboxLabel;
    }
}

// Tasks Table
async function loadTasksTable() {
    const response = await getDBEntrees(BUSINESS_SCHEMA, TASKS_TABLE, "__createdtime__", "*", settings, dbActive);
    
    if ((!response) || (response.error)) return;

    response.sort((a, b) => {
        const nameA = String(a.name).toUpperCase();
        const nameB = String(b.name).toUpperCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });

    tasksTable.innerHTML = "";
    tasksTable.appendChild(getTableHeaderRow(["Name", "Hours", "Minutes", "Active", "Delete"]));

    for (const entry of response) {
        const row = document.createElement('tr');

        const name = getTableDataWithText(entry.name);
        name.onclick = async () => {
            console.log('pl');
            showInputDialog("Task name", entry.name, async (newName) => {
                            await updateDBEntry(BUSINESS_SCHEMA, TASKS_TABLE, {id: entry.id, name: newName}, settings, dbActive);
                            await loadTasksTable();
                        }, null, 'text');
        }
        name.style.cursor = "pointer";

        const hours = getTableDataWithText(entry.hours);
        hours.onclick = () => {
            showInputDialog("Hours",
                            entry.hours,
                            async (newHours) => {
                                await updateDBEntry(BUSINESS_SCHEMA, TASKS_TABLE, {id: entry.id, hours: newHours}, settings, dbActive);
                                await loadTasksTable();
                            },
                            null, 'number');
        }
        hours.style.cursor = "pointer";

        const minutes = getTableDataWithText(entry.minutes);
        minutes.onclick = () => {
            showInputDialog("Minutes",
                            entry.minutes,
                            async (newMinutes) => {
                                await updateDBEntry(BUSINESS_SCHEMA, TASKS_TABLE, {id: entry.id, minutes: newMinutes}, settings, dbActive);
                                await loadTasksTable();
                            },
                            null, 'number');
        }
        minutes.style.cursor = "pointer";

        const active = getTableDataWithCheckbox(
            entry.active,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry(BUSINESS_SCHEMA, TASKS_TABLE, {id: entry.id, active: isChecked}, settings, dbActive);
            }
        );

        const deleteTD = getTableDataWithDeleteButton(
            async () => {
                showYesNoDialog(`Are you sure you want to delete "${entry.name}"?`,
                                async () => {
                                    await deleteDBEntry(BUSINESS_SCHEMA, TASKS_TABLE, entry.id, settings, dbActive);
                                    await loadTasksTable();
                                });
            }
        );

        appendChildren(row, [name, hours, minutes, active, deleteTD]);
        tasksTable.appendChild(row);
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

    supplyListTable.innerHTML = "";
    supplyListTable.appendChild(getTableHeaderRow(["Category", "Item", "Delete"]));

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

function msToTime(s) {
    const ms = s % 1000;
    s = (s - ms) / 1000;
    const secs = s % 60;
    s = (s - secs) / 60;
    let mins = s % 60;
    const hrs = (s - mins) / 60;
    mins = (mins <= 9) ? `0${mins}` : mins;
    // Pad minutes
    return hrs + ':' + mins;
    // return hrs + ':' + mins + ':' + secs;
    // return hrs + ':' + mins + ':' + secs + '.' + ms;
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

async function loadDataListWithItemOptions(dataList, schema, table, column, filter) {
    const optionsResponse = await getDBEntrees(schema, table, column, filter, settings, dbActive);
    if ((!optionsResponse) || (optionsResponse.error)) return;
    
    dataList.innerHTML = "";
    optionsResponse.forEach((option) => {
        const optionElement = document.createElement("option");
        optionElement.value = option.name;
        optionElement.textContent = option.name;
        dataList.appendChild(optionElement);
    });
}

async function loadSelectWithOptions(select, schema, table, column, filter) {
    const categories = [];
    const stationResponse = await getDBEntrees(schema, table, column, filter, settings, dbActive);

    if ((!stationResponse) || (stationResponse.error)) return;

    if ((stationResponse)) {
        stationResponse.forEach((item) => {
            if (categories.indexOf(item.name) === -1) {
                categories.push(item.name);
            }
        });
        select.innerHTML = "";
        categories.forEach((category) => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
        return categories;
    }
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

async function showSendMessagePrompt(OKCallback, cancelCallback, hideBackground) {
    messageBackground.style.display = "flex";
    messageBackground.style.backgroundColor = hideBackground ? "var(--background_color)" : "var(--background_transparent_color)";

    await loadSelectWithOptions(messageStationsSelect, BUSINESS_SCHEMA, STATIONS_TABLE, "__createdtime__", "*");

    messageInput.value = "";
    messageInput.select();
    // messageInput.onkeypress = (event) => {
    //     if (event.key === "Enter") okClick();
    // }
    
    messageOKBtn.onclick = okClick;

    messageCancelBtn.onclick = cancelClick;

    function cancelClick() {
        if (cancelCallback) cancelCallback(messageInput.value);
        messageBackground.style.display = "none";
    }

    function okClick() {
        if (messageInput.value) {
            OKCallback(messageInput.value);
            messageBackground.style.display = "none";
        }
        else {
            showAlertDialog("Add a message.");
        }
    }
}

function showChecklistPrompt(labelText, checkArray, OKCallback, cancelCallback) {
    checklistPromptBackground.style.display = "flex";
    checklistPromptBackground.style.backgroundColor = "var(--background_transparent_color)";

    checklistPromptLabel.textContent = labelText;

    checklistPromptCheckContainer.innerHTML = "";

    checkArray.forEach((checkItem) => {
        const checkLabel = document.createElement('label');
        checkLabel.classList.add('checklist-prompt-check-label');

        const checkbox = document.createElement('input');
        checkbox.setAttribute('type', 'checkbox');
        if (checkItem.checked) checkbox.setAttribute('checked', 'true');

        checkLabel.innerText = checkItem.name;
        checkbox.id = checkItem.id;

        checkLabel.appendChild(checkbox);
        checklistPromptCheckContainer.appendChild(checkLabel);
    });

    // OK click
    checklistPromptOKBtn.onclick = () => {
        const newTaskIDArray = [];
        const checkbox = checklistPromptCheckContainer.querySelectorAll('input');
        checkbox.forEach((checkItem) => {
            if (checkItem.checked) {
                newTaskIDArray.push(checkItem.id);
            }
        });
        OKCallback(newTaskIDArray);
        checklistPromptBackground.style.display = "none";
    };

    checklistPromptCancelBtn.onclick = cancelClick;
    function cancelClick() {
        checklistPromptBackground.style.display = "none";
    }
}

function addAlertClickToElement(element, title, message) {
    if (!message) return;
    element.onclick = () => {showAlert(title, message);}
    element.style.cursor = "pointer";
}

function showAlert(labelText, messageText, OKCallback, highlightArray) {
    alertBackground.style.display = "flex";
    // alertBackground.onclick = okClick;

    alertLabel.textContent = labelText;

    let message = messageText;
    if (highlightArray) {
        highlightArray.forEach((highText) => {
            // const regex = (new RegExp(`{"${highText}"}`, "g"));
            message = message.replaceAll(highText, `<span>${highText}</span>`);
        });
    }
    alertMessage.innerHTML = message;

    alertOKBtn.onclick = okClick;

    function okClick() {
        if (OKCallback) OKCallback();
        alertBackground.style.display = "none";
    }
}

function showTableModal(labelText) {
    tableModalBackground.style.display = "flex";
    // alertBackground.onclick = okClick;

    tableModalLabel.textContent = labelText;

    // tableModalMessage.textContent = messageText;

    tableModalOKBtn.onclick = okClick;

    function okClick() {
        // if (OKCallback) OKCallback();
        tableModalBackground.style.display = "none";
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

function hours24To12(time) {
    if (time) {
        let hours = time.split(':')[0];
        const mins = time.split(':')[1];

        //it is pm if hours from 12 onwards
        const suffix = (hours >= 12) ? 'p.m.' : 'a.m.';

        //only -12 from hours if it is greater than 12 (if not back at mid night)
        hours = (hours > 12)? hours -12 : hours;

        //if 00 then it is 12 am
        hours = (hours == '00')? 12 : hours;

        return hours + ":" + mins + " " + suffix;
    }
    else {
        return "";
    }
}

// function saveTextFile(data, fileName, fileType) {
//     let jsonData = new Blob([data], {type: `text/${fileType}`});  
//     let jsonURL = URL.createObjectURL(jsonData);

//     let hiddenElement = document.createElement('a');
//     hiddenElement.href = jsonURL;
//     hiddenElement.target = '_blank';
//     hiddenElement.download = `${fileName}.${fileType}`;
//     hiddenElement.click();
// }