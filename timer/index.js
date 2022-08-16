import {getDBEntrees,
    insertDBEntry,
    deleteDBEntry,
} from "../db-utilities.js";

import {
    LOGS_SCHEMA,
    // TIMER_TABLE,
    RUNNING_TIMER_TABLE,
    COMPLETED_TIMER_TABLE,
    BUSINESS_SCHEMA,
    EMPLOYEES_TABLE,
    STATIONS_TABLE,
    TASKS_TABLE,
    JOBS_TABLE,
} from "../directives.js";

import {
    stopRunningTimer,
    startOverTimeTimer,
    timeToDecimal,
} from "../timer-utilities.js";


const serverSettings = {}
let station = "";

const message = document.querySelector("#message");

const employeesSelect = document.querySelector("#employees");
const jobsSelect = document.querySelector("#jobs");
const taskSelect = document.querySelector("#tasks");
const startBtn = document.querySelector("#start-btn");

const runningTimersContainer = document.querySelector("#running-timers-container");

const addTimeEmployeesSelect = document.querySelector("#add-time-employees");
const addTimeJobsSelect = document.querySelector("#add-time-jobs");
const addTimeTaskSelect = document.querySelector("#add-time-tasks");
const addTimeHoursInput = document.querySelector("#hours-input");
const addTimeMinutesInput = document.querySelector("#minutes-input");
const addTimeBtn = document.querySelector("#add-time-btn");

const yesNoModal = document.querySelector("#yes-no-item-modal");
const yesNoModalYesBtn = document.querySelector("#yes-btn");
const yesNoModalNoBtn = document.querySelector("#no-btn");

// ---Event Listeners---

// Admin Link
window.onkeydown = (event) => {
    if (event.key === "8" && event.ctrlKey) {
        const adminLink = document.createElement('a');
        adminLink.href = "/";
        adminLink.click();
    }
}

employeesSelect.addEventListener('change', updateStartBtn);
addTimeEmployeesSelect.addEventListener('change', updateAddTimeBtn);

startBtn.addEventListener('click', async () => {
    if (allFieldsSelected()) {
        try {
            await addRunningTimerToDB();
            await loadFromDB();
            await updateStartBtn();
        } catch (error) {
            console.error(error);
        }
    }
    else {
        showMessage("Missing info.", true);
    }
});

addTimeBtn.addEventListener('click', async () => {
    if (allAddTimeFieldsSelected()) {
        manuallyAddTimeToDB();
        clearAddTimeFields();
    }
    else {
        showMessage("Missing info.", true);
    }
});



// ---Main Execution---

setTheme();

serverSettings.url = getLocalStorageValue('serverURL') || "";
serverSettings.authorization = getLocalStorageValue('serverAuthorization') || "";
station = getLocalStorageValue('stationName') || "";

if (serverSettings.url && serverSettings.authorization && station) {
    await loadFromDB();
}
else {
    if (!serverSettings.url) showMessage("Missing server URL");
    if (!serverSettings.authorization) showMessage("Missing server Authorization");
    if (!station) showMessage("Missing station name");
}
startOverTimeTimer(station, serverSettings, stopRunningTimer, loadRunningTimers);

async function loadRunningTimers() {
    const runningTimersResponse = await getDBEntrees(LOGS_SCHEMA, RUNNING_TIMER_TABLE, "__createdtime__", "*", serverSettings);
    if ((!runningTimersResponse) || (runningTimersResponse.error)) return true;

    runningTimersContainer.innerHTML = "";

    const title = document.createElement("h2");
    title.classList.add('section-title');
    title.textContent = "Running Timers";
    runningTimersContainer.appendChild(title);

    runningTimersResponse.forEach((runningTimer) => {
        console.log(runningTimer)
        if (runningTimer.station != getLocalStorageValue("stationName")) return;

        const card = document.createElement('card');
        card.classList.add('card');

        const cardLabel = document.createElement('label');
        cardLabel.classList.add('card-label');
        cardLabel.textContent = `${runningTimer.employeeName} - ${runningTimer.task} - ${runningTimer.jobName}`;

        const stopBtn = document.createElement('button');
        stopBtn.classList.add('stop-btn');
        stopBtn.textContent = "Stop";
        stopBtn.addEventListener('click', async () => {
            stopRunningTimer(runningTimer, station, serverSettings, loadRunningTimers);
            await updateStartBtn();
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.classList.add('cancel-btn');
        cancelBtn.textContent = "Cancel";
        cancelBtn.addEventListener('click', async () => {
            await showYesNoModal(async () => {
                await deleteDBEntry(LOGS_SCHEMA, RUNNING_TIMER_TABLE, runningTimer.id, serverSettings);
                await loadRunningTimers();
                await updateStartBtn();
            });
        });

        card.appendChild(cardLabel);
        card.appendChild(stopBtn);
        card.appendChild(cancelBtn);
        runningTimersContainer.appendChild(card);
    });
}

async function updateStartBtn() {
    const employeeID = employeesSelect[Number(employeesSelect.value) + 1].getAttribute('db_id');
    
    if (await employeeHasRunningTimer(employeeID) || (employeesSelect.value === "")) {
        startBtn.setAttribute('disabled', true);
    }
    else {
        startBtn.removeAttribute('disabled');
    }
}
async function updateAddTimeBtn() {
    addTimeBtn.removeAttribute('disabled');
}

async function employeeHasRunningTimer(selectedEmployeeID) {
    const employeeResponse = await getDBEntrees(LOGS_SCHEMA, RUNNING_TIMER_TABLE, "__createdtime__", "*", serverSettings);
    if ((!employeeResponse) || (employeeResponse.error)) return true;

    const employeeIds = [];
    employeeResponse.forEach((employee) => {
        employeeIds.push(employee.employeeID);
    });
    
    return (employeeIds.indexOf(selectedEmployeeID) !== -1);
}

async function loadFromDB() {
    loadEmployees();
    loadJobs();
    loadTasks();
    loadRunningTimers();
}

async function loadEmployees() {
    const employeeResponse = await getDBEntrees(BUSINESS_SCHEMA, EMPLOYEES_TABLE, "stations", `*${station}*`, serverSettings);
    if ((!employeeResponse) || (employeeResponse.error)) {
        showMessage("Error loading employees", true);
    }
    else {
        employeeResponse.sort((a, b) => {
            const nameA = String(a.name).toUpperCase();
            const nameB = String(b.name).toUpperCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });
        loadSelectFromArray(employeesSelect, "name", true, employeeResponse, true);
        loadSelectFromArray(addTimeEmployeesSelect, "name", true, employeeResponse, true);
    }
}

async function loadJobs() {
    const jobsResponse = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "active", true, serverSettings);
    if ((!jobsResponse) || (jobsResponse.error)) {
        showMessage("Error loading jobs", true);
    }
    else {
        jobsResponse.sort((a, b) => {
            const nameA = String(a.name).toUpperCase();
            const nameB = String(b.name).toUpperCase();
            if (nameA < nameB) return 1;
            if (nameA > nameB) return -1;
            return 0;
        });
        loadSelectFromArray(jobsSelect, "name", true, jobsResponse);
        loadSelectFromArray(addTimeJobsSelect, "name", true, jobsResponse);
    }
}

async function loadTasks() {
    const stationResponse = await getDBEntrees(BUSINESS_SCHEMA, STATIONS_TABLE, "name", station, serverSettings);
    if ((!stationResponse) || (stationResponse.error)) {
        showMessage("Error loading tasks", true);
        return;
    }

    if (stationResponse.length == 0) {
        showMessage(`Error: No tasks for ${station}`, true);
        return;
    }

    // Old system
    if (typeof stationResponse[0].tasks === "string") {
        const tasks = stationResponse[0].tasks.split(',');
        tasks.forEach(task => {
            task = task.trim();
        });
        loadSelectFromArray(taskSelect, "", false, tasks);
        loadSelectFromArray(addTimeTaskSelect, "", false, tasks);
    } // New system
    else if (Array.isArray(stationResponse[0].tasks)) {
        const tasksResponse = await getDBEntrees(BUSINESS_SCHEMA, TASKS_TABLE, "id", "*", serverSettings);
        if ((!tasksResponse) || (tasksResponse.error)) return;

        taskSelect.innerHTML = "";
        let index = 0;
        tasksResponse.forEach(task => {
            stationResponse[0].tasks.forEach(taskID => {
                if (task.id !== taskID) return;
                
                const timerOption = document.createElement("option");
                timerOption.textContent = task.name;
                timerOption.id = task.id;
                timerOption.value = index++;
                taskSelect.appendChild(timerOption);
                
                const manualTimeOption = document.createElement("option");
                manualTimeOption.textContent = task.name;
                manualTimeOption.id = task.id;
                manualTimeOption.value = index++;
                addTimeTaskSelect.appendChild(manualTimeOption);
                
            });
        });
    }
}

function loadSelectFromArray(selectElement, textAttribute, setID, array, addBlank) {
    selectElement.innerHTML = "";

    if (addBlank) {
        const option = document.createElement("option");
        option.setAttribute("disabled", true);
        option.setAttribute("selected", true);
        option.textContent = "";
        option.value = "";
        selectElement.appendChild(option);
    }

    array.forEach((element, index) => {
        const option = document.createElement("option");
        option.textContent = element[textAttribute] || element;
        if (setID) option.setAttribute('db_id', element.id);
        option.value = index;
        selectElement.appendChild(option);
    });
}

async function addRunningTimerToDB() {
    await insertDBEntry(
        LOGS_SCHEMA,
        RUNNING_TIMER_TABLE,
        {
            employeeName: employeesSelect[Number(employeesSelect.value) + 1].textContent.trim(),
            employeeID: employeesSelect[Number(employeesSelect.value) + 1].getAttribute('db_id'),
            jobName: jobsSelect[jobsSelect.value].textContent.trim(),
            jobID: jobsSelect[jobsSelect.value].getAttribute('db_id'),
            station: station.trim(),
            task: taskSelect[taskSelect.value].textContent.trim(),
            taskID: taskSelect[taskSelect.value].id,
            date: (new Date()).toLocaleDateString(),
            time: (new Date()).toLocaleTimeString(),
        }, 
        serverSettings
    );
}

async function manuallyAddTimeToDB() {
    const hours = Number(addTimeHoursInput.value);
    const minutes = Number(addTimeMinutesInput.value);

    const milliseconds = (hours * 60 * 60000) + (minutes * 60000);

    if (hours + minutes < 1) {
        showMessage("Please add time", true);
        return;
    }
    else {
        showMessage(`${addTimeHoursInput.value || "0"}:${addTimeMinutesInput.value || "0"} added to ${addTimeJobsSelect[addTimeJobsSelect.value].textContent}`);
    }
   
    await insertDBEntry(
        LOGS_SCHEMA,
        COMPLETED_TIMER_TABLE,
        {
            employeeName: addTimeEmployeesSelect[Number(addTimeEmployeesSelect.value) + 1].textContent.trim(),
            employeeID: addTimeEmployeesSelect[Number(addTimeEmployeesSelect.value) + 1].getAttribute('db_id'),
            jobName: addTimeJobsSelect[addTimeJobsSelect.value].textContent.trim(),
            jobID: addTimeJobsSelect[addTimeJobsSelect.value].getAttribute('db_id'),
            station: station.trim(),
            task: addTimeTaskSelect[addTimeTaskSelect.value].textContent.trim(),
            taskID: addTimeTaskSelect[addTimeTaskSelect.value].id,
            date: (new Date()).toLocaleDateString('en-CA'),
            timeStart: (new Date()).toLocaleTimeString(),
            timeEnd: (new Date()).toLocaleTimeString(),
            durationMS: milliseconds,
            durationTime: `${hours}:${minutes}:0`,
            submitType: "manual",
        }, 
        serverSettings
    );
}

function getLocalStorageValue(key) {
    if (window.localStorage[key])
        return JSON.parse(window.localStorage.getItem(key));
}

function setTheme() {
    const theme = getLocalStorageValue('theme') || "light";
    document.documentElement.setAttribute('data-color-theme', theme);
}

function showMessage(messageText, isError) {
    message.style.color = isError ? "red" : "var(--color)";
    message.textContent = messageText;
    setTimeout(() => {
        message.textContent = "";
    }, 4000);
}

function allFieldsSelected() {
    return employeesSelect.value && jobsSelect.value && taskSelect.value;
}

function allAddTimeFieldsSelected() {
    return addTimeEmployeesSelect.value && 
           addTimeJobsSelect.value && 
           addTimeTaskSelect.value &&
           (addTimeHoursInput.value || addTimeMinutesInput.value);
}

function clearAddTimeFields() {
    addTimeHoursInput.value = '';
    addTimeMinutesInput.value = '';
}

async function showYesNoModal(yesCallback) {
    yesNoModal.style.display = 'flex';
    yesNoModalYesBtn.onclick = () => {
        yesCallback();
        yesNoModal.style.display = 'none';
    };
    yesNoModalNoBtn.onclick = () => {
        yesNoModal.style.display = 'none';
    };
}