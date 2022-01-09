import {getDBEntrees, insertDBEntry} from "../db-utilities.js";
import {
    LOGS_SCHEMA,
    TIMER_TABLE,
    BUSINESS_SCHEMA,
    EMPLOYEES_TABLE,
    STATIONS_TABLE,
    JOBS_TABLE
} from "../directives.js";

const serverSettings = {}
let station = "";

// const resetButton = document.querySelector("#reset");
const message = document.querySelector("#message");

const employeesSelect = document.querySelector("#employees");
const jobsSelect = document.querySelector("#jobs");
const taskSelect = document.querySelector("#tasks");
const startBtn = document.querySelector("#start-btn");
const stopBtn = document.querySelector("#stop-btn");


// ---Event Listeners---

startBtn.addEventListener('click', () => {
    if (allFieldsSelected()) {
        try {
            addEventToDB("start");
            showMessage("Started")
        } catch (error) {
            console.error(error);
        }
    }
    else {
        showMessage("Missing info.", true);
    }
});

stopBtn.addEventListener('click', () => {
    if (allFieldsSelected()) {
        try {
            addEventToDB("stop");
            showMessage("Stopped")
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

async function loadFromDB() {
    // Employees
    const employeeResponse = await getDBEntrees(BUSINESS_SCHEMA, EMPLOYEES_TABLE, "stations", `*${station}*`, serverSettings);
    if ((!employeeResponse) || (employeeResponse.error)) {
        showMessage("Error loading employees", true);
    }
    else {
        loadSelectFromArray(employeesSelect, "name", true, employeeResponse);
    }

    // Jobs
    const jobsResponse = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "active", true, serverSettings);
    if ((!jobsResponse) || (jobsResponse.error)) {
        showMessage("Error loading jobs", true);
    }
    else {
        loadSelectFromArray(jobsSelect, "name", true, jobsResponse);
    }
    
    // Tasks
    const tasksResponse = await getDBEntrees(BUSINESS_SCHEMA, STATIONS_TABLE, "name", station, serverSettings);
    if ((!tasksResponse) || (tasksResponse.error)) {
        showMessage("Error loading tasks", true);
    }
    else {
        if (tasksResponse.length > 0) {
            const tasks = tasksResponse[0].tasks.split(',');
            loadSelectFromArray(taskSelect, "", false, tasks);
        }
        else {
            showMessage(`Error: No tasks for ${station}`, true);
        }
    }
}

function loadSelectFromArray(selectElement, textAttribute, setID, array) {
    selectElement.innerHTML = "";
    array.forEach((element, index) => {
        const option = document.createElement("option");
        option.textContent = element[textAttribute] || element;
        if (setID) option.setAttribute('db_id', element.id);
        option.value = index;
        selectElement.appendChild(option);
    });
}

function addEventToDB(event) {
    insertDBEntry(
        LOGS_SCHEMA, 
        TIMER_TABLE,
        {
            employeeName: employeesSelect[employeesSelect.value].textContent,
            employeeID: employeesSelect[employeesSelect.value].getAttribute('db_id'),
            jobName: jobsSelect[jobsSelect.value].textContent,
            jobID: jobsSelect[jobsSelect.value].getAttribute('db_id'),
            station: station,
            task: taskSelect[taskSelect.value].textContent,
            eventType: event,
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