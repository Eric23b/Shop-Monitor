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
    JOBS_TABLE,
} from "../directives.js";

const serverSettings = {}
let station = "";

const message = document.querySelector("#message");

const employeesSelect = document.querySelector("#employees");
const jobsSelect = document.querySelector("#jobs");
const taskSelect = document.querySelector("#tasks");
const startBtn = document.querySelector("#start-btn");

const runningTimersContainer = document.querySelector("#running-timers-container");

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

startBtn.addEventListener('click', async () => {
    if (allFieldsSelected()) {
        try {
            await addRunningTimerToDB();
            await loadFromDB();
            await updateStartBtn();
            // showMessage("Started");
        } catch (error) {
            console.error(error);
        }
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




// ---Functions---

async function loadRunningTimers() {
    const runningTimersResponse = await getDBEntrees(LOGS_SCHEMA, RUNNING_TIMER_TABLE, "__createdtime__", "*", serverSettings);
    if ((!runningTimersResponse) || (runningTimersResponse.error)) return true;

    runningTimersContainer.innerHTML = "";

    const title = document.createElement("h2");
    title.classList.add('running-timers-title');
    title.textContent = "Running timers";
    runningTimersContainer.appendChild(title);

    runningTimersResponse.forEach((runningTimer) => {
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
            const runningTimersResponse = await getDBEntrees(LOGS_SCHEMA, RUNNING_TIMER_TABLE, "id", runningTimer.id, serverSettings);
            if ((!runningTimersResponse) || (runningTimersResponse.error)) return true;
            
            insertDBEntry(
                LOGS_SCHEMA,
                COMPLETED_TIMER_TABLE,
                {
                    employeeName: runningTimer.employeeName,
                    employeeID: runningTimer.employeeID,
                    jobName: runningTimer.jobName,
                    jobID: runningTimer.jobID,
                    station: station,
                    task: runningTimer.task,
                    date: (new Date()).toLocaleDateString(),
                    timeStart: runningTimer.time,
                    timeEnd: (new Date()).toLocaleTimeString(),
                    durationMS: Date.now() - runningTimersResponse[0].__createdtime__,
                    durationTime: msToTime(Date.now() - runningTimersResponse[0].__createdtime__),
                }, 
                serverSettings
            );
            // showMessage("Stopped");
            await deleteDBEntry(LOGS_SCHEMA, RUNNING_TIMER_TABLE, runningTimer.id, serverSettings);
            await loadRunningTimers();
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.classList.add('cancel-btn');
        cancelBtn.textContent = "Cancel";
        cancelBtn.addEventListener('click', async () => {
            await showYesNoModal(async () => {
                await deleteDBEntry(LOGS_SCHEMA, RUNNING_TIMER_TABLE, runningTimer.id, serverSettings);
                await loadRunningTimers();
            });
        });

        card.appendChild(cardLabel);
        card.appendChild(stopBtn);
        card.appendChild(cancelBtn);
        runningTimersContainer.appendChild(card);
    });
}

function msToTime(s) {
    const ms = s % 1000;
    s = (s - ms) / 1000;
    const secs = s % 60;
    s = (s - secs) / 60;
    const mins = s % 60;
    const hrs = (s - mins) / 60;
  
    return hrs + ':' + mins + ':' + secs;
    // return hrs + ':' + mins + ':' + secs + '.' + ms;
  }

async function updateStartBtn() {
    const employeeID = employeesSelect[Number(employeesSelect.value) + 1].getAttribute('db_id');
    if (await employeeHasRunningTimer(employeeID)) {
        startBtn.setAttribute('disabled', true);
    }
    else {
        startBtn.removeAttribute('disabled');
    }
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
    }
}

async function loadTasks() {
    const tasksResponse = await getDBEntrees(BUSINESS_SCHEMA, STATIONS_TABLE, "name", station, serverSettings);
    if ((!tasksResponse) || (tasksResponse.error)) {
        showMessage("Error loading tasks", true);
    }
    else {
        if (tasksResponse.length > 0) {
            const tasks = tasksResponse[0].tasks.split(',');
            tasks.forEach(task => {
                task = task.trim();
            });
            loadSelectFromArray(taskSelect, "", false, tasks);
        }
        else {
            showMessage(`Error: No tasks for ${station}`, true);
        }
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
            date: (new Date()).toLocaleDateString(),
            time: (new Date()).toLocaleTimeString(),
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