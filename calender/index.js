
import {
    getDBEntrees,
    insertDBEntry,
    updateDBEntry,
    deleteDBEntry,
    createSchema,
    createTable,
    createAttributes,
    describeDatabase,
    getUniqueColumnValues,
    isSuperUser,
} from "../db-utilities.js";

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
    TABLE_ATTRIBUTES,
    SYSTEM_SCHEMA,
    MESSAGES_TABLE,
} from "../directives.js";

import {
    getTableDataWithText,
    getTableDataWithProgressBar,
    getTableDataRow,
    getTableDataWithEditText,
    getTableDataWithGrabber,
    getTableHeaderRow,
    getTableDataWithCheckbox,
    getTableDataWithDeleteButton
} from "../table-utilities.js";

const log = console.log;

const daysOfTheWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const settings = {
    url: "",
    authorization: ""
}

let draggingJobID = 0;

const calenderContainer = document.querySelector('#calender');

// Job modal
const addModal= document.querySelector('#add-job-modal');
const addJobNameInput = document.querySelector('#add-job-name-input');
const addJobShipDateInput = document.querySelector('#add-job-ship-date');
const addJobNotesInput = document.querySelector('#add-job-job-notes-textarea');
const addJobSequenceContainer = document.querySelector('#add-job-modal-sequence-container');
const addJobAddTaskBtn= document.querySelector('#add-task-btn');
const addJobAddTasksFromTextBtn= document.querySelector('#add-tasks-from-text-btn');
const addJobOKBtn = document.querySelector('#add-job-ok');
const addJobCancelBtn = document.querySelector('#add-job-cancel');

// Add/Update Task Modal
const taskModalBackground = document.querySelector('#task-modal-background');
const taskModalSequenceName = document.querySelector('#task-modal-sequence-input');
const taskModalTaskSelect = document.querySelector('#task-modal-task-select');
const taskModalHours = document.querySelector('#task-modal-hours-input');
const taskModalMinutes = document.querySelector('#task-modal-minutes-input');
const taskModalCancelBtn = document.querySelector('#task-modal-cancel-btn');
const taskModalOKBtn = document.querySelector('#task-modal-ok-btn');

// Add Tasks From Text
const addTaskFromTextModalBackground = document.querySelector('#add-task-from-text-modal-background');
const addTaskFromTextModalSequenceName = document.querySelector('#tasks-from-text-sequence-name');
const addTasksFromTextTextArea = document.querySelector('#add-tasks-from-text-textarea');
const addTasksFromTextOKBtn = document.querySelector('#tasks-from-text-ok-btn');
const addTasksFromTextCancelBtn = document.querySelector('#tasks-from-text-cancel-btn');


settings.url = getLocalStorageValue('serverURL') || "";
settings.authorization = getLocalStorageValue('serverAuthorization') || "";
const stationName = getLocalStorageValue('stationName') || "";

const theme = getLocalStorageValue('theme') || "light";



// INITIALIZE CODE


const superUser = await isSuperUser(settings);
if (superUser) {
    const superUserElements = document.querySelectorAll('.super-user');
    superUserElements.forEach((element) => {
        element.classList.remove('super-user');
    });
}

document.documentElement.setAttribute('data-color-theme', theme);

buildCalender();


// Add Task Button Click
addJobAddTaskBtn.addEventListener('click', async () => {
    showAddUpdateTaskModal(
        "",
        {},
        async (sequenceName, task) => {
            const data = {
                name: task.name,
                id: task.id,
                hours: task.hours,
                minutes: task.minutes,
                completed: false,
            }
            addTask(sequenceName, data);
        }
    );
});

// FUNCTIONS
async function buildCalender() {
    const jobs = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "active", true, settings);
    if ((!jobs) || (jobs.error) || jobs.length === 0) return;

    // Sort by ship date
    jobs.sort((a, b) => {
        const nameA = a.shipDate;
        const nameB = b.shipDate;
        if (nameA < nameB) return 1;
        if (nameA > nameB) return -1;
        return 0;
    });

    calenderContainer.innerHTML = "";

    const dates = getDates(jobs);

    const dateIndex = new Date(dates.firstSunday);

    const lastDatePlusOneMonth = new Date(dates.lastSaturday);

    lastDatePlusOneMonth.setDate(lastDatePlusOneMonth.getDate() + 28);

    let endCalender = false;
    while (!endCalender) {
        const weekContainer = document.createElement('div');
        weekContainer.classList.add('week');
    
        for (let index = 0; index < 7; index++) {
            const date = dateIndex.toLocaleDateString('en-CA');
            const dayContainer = document.createElement('div');
            dayContainer.classList.add('day');
            dayContainer.addEventListener('dragenter', () => {dayContainer.classList.add('drag-over')});
            dayContainer.addEventListener('dragleave', () => {dayContainer.classList.remove('drag-over')});
            dayContainer.addEventListener('dragover', (event) => {event.preventDefault()});
            dayContainer.addEventListener('drop', async () => {
                dayContainer.classList.remove('drag-over');
                await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: draggingJobID, shipDate: date}, settings);
                await buildCalender();
            });

            const dayHeader = document.createElement('div');
            dayHeader.classList.add('day-header-container');
    
            const dayNameElement = document.createElement('p');
            dayNameElement.classList.add('day-week-name');
            if (dateIndex.getDate() == 1) {
                const options = { month: "short" };
                dayNameElement.textContent = (new Intl.DateTimeFormat("en-CA", options).format(dateIndex));
                dayNameElement.classList.add('day-title-first-of-the-month');
            }
            else {
                dayNameElement.textContent = dateIndex.toLocaleString('default', {weekday: 'short'});
            }
    
            const dayNumberElement = document.createElement('p');
            dayNumberElement.classList.add('day-number');
            if (dates.today.toDateString('en-CA') === dateIndex.toDateString('en-CA')) {
                dayNumberElement.classList.add('today');
            }
            dayNumberElement.textContent = dateIndex.toLocaleString('default', {day: 'numeric'});

            const jobsContainer = document.createElement('div');
            jobsContainer.classList.add('jobs-container');
            jobs.forEach((job) => {
                if (job.shipDate === dateIndex.toLocaleDateString('en-CA')) {
                    const jobTitle = document.createElement('p');
                    jobTitle.setAttribute('draggable', 'true');
                    jobTitle.addEventListener('dragstart', () => {draggingJobID = job.id});
                    jobTitle.textContent = job.name;
                    jobTitle.style.cursor = 'pointer';
                    jobTitle.onclick = () => {
                        showAddJobModal();
                    };
                    jobsContainer.appendChild(jobTitle);
                }
            });

            dayHeader.appendChild(dayNameElement);
            dayHeader.appendChild(dayNumberElement);
    
            dayContainer.appendChild(dayHeader);
            dayContainer.appendChild(jobsContainer);
    
            weekContainer.appendChild(dayContainer);

            // Increment day
            dateIndex.setDate(dateIndex.getDate() + 1);

            if (dateIndex.toDateString('en-CA') === lastDatePlusOneMonth.toDateString('en-CA')) endCalender = true;
            // if (dateIndex.toDateString('en-CA') === dates.lastSaturday.toDateString('en-CA')) endCalender = true;
        };
    
        calenderContainer.appendChild(weekContainer);
    }
}

function getDates(jobs) {
    const earliestDate = jobs[jobs.length - 1].shipDate;
    const latestDate = jobs[0].shipDate;

    const firstSunday = new Date(earliestDate);

    while (firstSunday.toLocaleString('default', {weekday: 'short'}) !== "Sun") {
        firstSunday.setDate(firstSunday.getDate() - 1);
    }

    const lastSaturday = new Date(latestDate);

    while (lastSaturday.toLocaleString('default', {weekday: 'short'}) !== "Sat") {
        lastSaturday.setDate(lastSaturday.getDate() + 1);
    }

    const today = new Date();

    return {earliestDate, latestDate, firstSunday, lastSaturday, today}
}

async function showAddUpdateTaskModal(sequenceName, task, OKCallback, cancelCallback) {
    await loadTasksSelect();
    taskModalBackground.style.display = "flex";
    taskModalSequenceName.value = sequenceName || "";
    // taskModalTaskSelect.textContent = task ? task.name : "";
    taskModalTaskSelect.value = 1;
    taskModalHours.value = task ? task.hours : "";
    taskModalMinutes.value = task ? task.minutes : "";

    taskModalOKBtn.onclick = async () => {
        if (taskModalSequenceName.value) {
            OKCallback(taskModalSequenceName.value, {
                name: taskModalTaskSelect[taskModalTaskSelect.value].textContent,
                id: taskModalTaskSelect[taskModalTaskSelect.value].id,
                hours: Number(taskModalHours.value),
                minutes: Number(taskModalMinutes.value),
            });
            hideAddTaskModal();
        }
        else {
            showAlert("Missing sequence name", "Add a sequence name");
        }
    };

    taskModalCancelBtn.onclick = async () => {
        if (cancelCallback) cancelCallback();
        hideAddTaskModal();
    };
}

function getLocalStorageValue(key) {
    if (window.localStorage[key])
        return JSON.parse(window.localStorage.getItem(key));
}
async function showAddJobModal(){
    addModal.style.display = 'flex';
    await loadTasksSelect();
}

function hideAddJobModal(){
    addModal.style.display = 'none';
}

function loadJobModal() {
    addJobNameInput.value = currentJob.name;
    addJobShipDateInput.value = currentJob.shipDate;
    addJobNotesInput.value = currentJob.note;

    loadSequences(currentJob.sequences);
}

function loadSequences(sequences) {
    addJobSequenceContainer.innerHTML = "";

    if (!sequences) return;

    sequences.forEach((sequence, sequenceIndex) => {
        const sequenceTitle = document.createElement('h3');
        sequenceTitle.textContent = sequence.name;
        sequenceTitle.onclick = async () => {
            showYesNoModal(`Delete "${sequence.name}" and it's tasks?`,
                () => {
                    sequences.splice(sequenceIndex, 1);
                    loadSequences(currentJob.sequences);
                }
            );
        }
        addJobSequenceContainer.appendChild(sequenceTitle);

        const sequenceBlock = document.createElement('div');
        sequenceBlock.classList.add('add-job-modal-sequence');
        sequence.tasks.forEach((task, index) => {
            const taskElement = document.createElement('p');
            taskElement.setAttribute('draggable', 'true');
            taskElement.setAttribute('sequence-name', sequence.name);

            taskElement.classList.add('add-job-modal-sequence-task');
            taskElement.textContent = `${task.name} ${task.hours}:${task.minutes}`;

            taskElement.addEventListener('click', () => {
                // addJobSequenceName.value = sequence.name;
                showAddUpdateTaskModal(
                    sequence.name,
                    task,
                    async (sequenceName, newTask) => {
                        task.name = newTask.name;
                        task.id = newTask.id;
                        task.hours = newTask.hours;
                        task.minutes = newTask.minutes;
                        // task.completed = false;
                            
                        loadSequences(currentJob.sequences);
                    });
            });
            taskElement.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                showYesNoModal(`Delete "${task.name}" from ${sequence.name}?`,
                    () => {
                        sequence.tasks.splice(index, 1);
                        loadSequences(currentJob.sequences);
                    }
                );
            });
            
            taskElement.addEventListener('dragstart', () => {
                draggingTask.sequenceName = sequence.name;
                draggingTask.taskIndex = index;
            });
            taskElement.addEventListener('dragover', (event) => {
                event.preventDefault();
            });

            taskElement.addEventListener('dragenter', (event) => {
                event.preventDefault();
                const draggersSequence = event.target.attributes['sequence-name'].value;
                if (draggingTask.sequenceName === draggersSequence) {
                    taskElement.classList.add('add-job-task-drag-over');
                }
            });

            taskElement.addEventListener('dragleave', () => {
                taskElement.classList.remove('add-job-task-drag-over');
            });

            taskElement.addEventListener('drop', (event) => {
                const draggersSequence = event.target.attributes['sequence-name'].value;
                if (draggingTask.sequenceName === draggersSequence) {
                    const temp = sequence.tasks.splice(draggingTask.taskIndex, 1);
                    sequence.tasks.splice(index, 0, ...temp);
                    loadSequences(currentJob.sequences);
                }
                taskElement.classList.remove('add-job-task-drag-over');
            });

            sequenceBlock.appendChild(taskElement);
        });
        addJobSequenceContainer.appendChild(sequenceBlock);
    });
}
async function loadTasksSelect() {
    const tasksResponse = await getDBEntrees(BUSINESS_SCHEMA, TASKS_TABLE, "id", "*", settings);
    if ((!tasksResponse) || (tasksResponse.error)) return;
    if (tasksResponse.length == 0) return;

    // taskModalTaskSelect.innerHTML = "";
    tasksResponse.forEach((task, index) => {
        const timerOption = document.createElement("option");
        timerOption.textContent = task.name;
        timerOption.id = task.id;
        timerOption.value = index;
        taskModalTaskSelect.appendChild(timerOption);
    });
}
function addTask(sequenceName, data) {
    let sequenceFound = false;

    if (!currentJob.sequences) currentJob.sequences = [];

    currentJob.sequences.forEach((sequence) => {
        if (sequence.name === sequenceName) {
            sequence.tasks.push(data);
            sequenceFound = true;
        }
    });

    if (!sequenceFound) {
        currentJob.sequences.push({
            name: sequenceName,
            tasks: [data]
        },)
    }
    loadSequences(currentJob.sequences);
};
