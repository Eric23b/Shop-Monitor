
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

const settings = {
    url: "",
    authorization: ""
}

let draggingTask = {taskIndex: 0, sequenceName: ""};

let currentJob = {
    active: true,
    sequences: null,
}

const theme = getLocalStorageValue('theme') || "light";

const addNewJobBtn = document.querySelector('#add-job-btn');

const addModal= document.querySelector('#add-job-modal');
const addJobNameInput = document.querySelector('#add-job-name-input');
const addJobNotesInput = document.querySelector('#add-job-job-notes-textarea');
const addJobSequenceContainer = document.querySelector('#add-job-modal-sequence-container');
const addJobSequenceName = document.querySelector('#add-job-new-sequence-input');
const addJobNewTaskName = document.querySelector('#add-job-new-task-select');
const addJobHours = document.querySelector('#add-job-new-task-hours-input');
const addJobMinutes = document.querySelector('#add-job-new-task-minutes-input');
const addJobAddTaskBtn= document.querySelector('#add-job-new-task-btn');
const addJobOKBtn = document.querySelector('#add-job-ok');
const addJobCancelBtn = document.querySelector('#add-job-cancel');


const tableRows = document.querySelectorAll('.jobs-table tr');
const jobsTable = document.querySelector('#jobs-table');
const grabbers = document.querySelectorAll('.grabber');



// INIT CODE

document.documentElement.setAttribute('data-color-theme', theme);

settings.url = getLocalStorageValue('serverURL') || "";
settings.authorization = getLocalStorageValue('serverAuthorization') || "";
const stationName = getLocalStorageValue('stationName') || "";





// EVENT LISTENERS

// Show Add Job Modal
addNewJobBtn.addEventListener('click', async () => {
    clearCurrentJob();
    loadJobModal();
    await showAddJobModal();
});


// Add Task Button Click
addJobAddTaskBtn.addEventListener('click', addTask);

// Add Job OK click
addJobOKBtn.addEventListener('click', async () => {
    await addJobToDB();
    hideAddJobModal();
});
// Cancel adding job button
addJobCancelBtn.addEventListener('click', hideAddJobModal);






// FUNCTIONS

async function loadTasksSelect() {
    const tasksResponse = await getDBEntrees(BUSINESS_SCHEMA, TASKS_TABLE, "id", "*", settings);
    if ((!tasksResponse) || (tasksResponse.error)) return;
    if (tasksResponse.length == 0) return;

    addJobNewTaskName.innerHTML = "";
    tasksResponse.forEach((task, index) => {
        const timerOption = document.createElement("option");
        timerOption.textContent = task.name;
        timerOption.id = task.id;
        timerOption.value = index;
        addJobNewTaskName.appendChild(timerOption);
    });
}

function clearCurrentJob() {
    currentJob = {};
    currentJob.name = "";
    currentJob.id = null;
    currentJob.note = "";
    currentJob.active = true;
    currentJob.sequences = null;
}

loadJobs();
async function loadJobs() {
    const jobsResponse = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "__createdtime__", "*", settings);
    
    if ((!jobsResponse) || (jobsResponse.error)) return;

    jobsResponse.sort((a, b) => {
        const nameA = a.active;
        const nameB = b.active;
        if (nameA < nameB) return 1;
        if (nameA > nameB) return -1;
        return 0;
    });

    jobsTable.innerHTML = getTableHeaderRow(["Name", "Estimated Date", "Target Date", "Progress", "Note", "Active", "Hours", "Edit", "Delete"]);

    jobsResponse.forEach((job) => {
        const row = document.createElement('tr');
        row.classList.add('table-row-blank-border');
        row.addEventListener('dragenter', () => {row.classList.add('drag-over');});
        row.addEventListener('dragleave', () => {row.classList.remove('drag-over');});

        const progressBar = getTableDataWithProgressBar(50);
        const name = getTableDataWithText(job.name);
        const estimatedDate = getTableDataWithText(job.shipDate);
        const targetDate = getTableDataWithText(job.shipDate);

        // Note
        const note = getTableDataWithEditText(job.note, );
        note.onclick = async () => {
            job.note = prompt("Note", job.note || "");
            if (job.note !== null) {
                await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: job.id, note: job.note}, settings);
                loadJobs();
            }
        }
        note.style.cursor = "pointer";

        const active = getTableDataWithCheckbox(
            job.active,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: job.id, active: isChecked}, settings);
                loadJobs();
            }
        );

        const hours = getTableDataWithText("100");

        // Edit job
        const edit = getTableDataWithText("✏");
        edit.style.cursor = "pointer";
        edit.addEventListener('click', async () => {
            const jobsResponse = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "id", job.id, settings);
            if ((!jobsResponse) || (jobsResponse.error)) return;
            const originalJob = jobsResponse[0];
            addJobNameInput.value = originalJob.name;
            addJobNotesInput.value = originalJob.note;
            currentJob = originalJob;
            // console.log(originalJob)
            loadSequences(currentJob.sequences);
            await showAddJobModal();
        });

        const deleteTD = getTableDataWithDeleteButton(async () => {
            if (confirm(`Delete Job ${job.name}?`)) {``
                await deleteDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, job.id, settings);
                loadJobs();
            }
        });
        deleteTD.classList.add('table-delete-btn');

        const grabber = getTableDataWithGrabber();

        appendChildren(row, [name, estimatedDate, targetDate, progressBar, note, active, hours, edit, deleteTD, grabber]);
        jobsTable.appendChild(row);
    });
}

function addTask() {
    if (!addJobSequenceName.value) return;

    const data = {
        taskName: addJobNewTaskName[addJobNewTaskName.value].textContent,
        taskID: addJobNewTaskName[addJobNewTaskName.value].id,
        hours: Number(addJobHours.value),
        minutes: Number(addJobMinutes.value),
    }

    let sequenceFound = false;

    if (!currentJob.sequences) currentJob.sequences = [];

    currentJob.sequences.forEach((sequence) => {
        if (sequence.name === addJobSequenceName.value) {
            sequence.tasks.push(data);
            sequenceFound = true;
        }
    });

    if (!sequenceFound) {
        currentJob.sequences.push({
            name: addJobSequenceName.value,
            tasks: [data]
        },)
    }
    loadSequences(currentJob.sequences);
    console.log(currentJob.sequences);
};

function loadJobModal() {
    addJobNameInput.value = currentJob.name;
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
            if (confirm(`Delete "${sequence.name}" sequence?`)) {
                sequences.splice(sequenceIndex, 1);
                loadSequences(currentJob.sequences);
            }
        }
        addJobSequenceContainer.appendChild(sequenceTitle);

        const sequenceBlock = document.createElement('div');
        sequenceBlock.classList.add('add-job-modal-sequence');
        sequence.tasks.forEach((task, index) => {
            const taskElement = document.createElement('p');
            taskElement.setAttribute('draggable', 'true');
            taskElement.setAttribute('sequence-name', sequence.name);

            taskElement.classList.add('add-job-modal-sequence-task');
            taskElement.textContent = `${task.taskName} ${task.hours}:${task.minutes}`;

            taskElement.addEventListener('click', () => {
                if (confirm(`Delete "${task.taskName}" task?`)) {
                    sequence.tasks.splice(index, 1);
                    loadSequences(currentJob.sequences);
                }
            });
            
            taskElement.addEventListener('dragstart', () => {
                draggingTask.sequenceName = sequence.name;
                draggingTask.taskIndex = index;
            });
            taskElement.addEventListener('dragover', (e) => {
                e.preventDefault();
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

async function addJobToDB(){
    const jobName = addJobNameInput.value.trim();
    const jobNote = addJobNotesInput.value;
    currentJob.name = jobName;
    currentJob.note = jobNote;
    
    if (!jobName) return;

    if (currentJob.id) {
        await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, currentJob, settings);
    }
    else {
        if (await jobNameExists(jobName)) {
            alert("Job name already exists", `Sorry, ${jobName} already exists.`);
            // showAlert("Job name already exists", `Sorry, ${jobName} already exists.`);
        } else {
            await insertDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, currentJob, settings);
        }
    }
    await loadJobs();
}

async function jobNameExists(jobName) {
    const response = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "__createdtime__", "*", settings);
    
    if ((!response) || (response.error)) return;
    
    const jobsNameArray = [];
    response.forEach((job) => {
        jobsNameArray.push(String(job.name));
    });

    return jobsNameArray.indexOf(jobName) > -1;
};

async function showAddJobModal(){
    addModal.style.display = 'flex';
    await loadTasksSelect();
}

function hideAddJobModal(){
    addModal.style.display = 'none';
}

function getLocalStorageValue(key) {
    if (window.localStorage[key])
        return JSON.parse(window.localStorage.getItem(key));
}

function appendChildren(parent, childList) {
    childList.forEach((childElement) => {
        parent.appendChild(childElement);
    });
}