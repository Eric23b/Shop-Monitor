
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

const job = {
    active: true,
    sequences: [
        {
            name: "Cabinets",
            tasks: [
                {
                    taskName: "Cutting",
                    taskID: "#cutting"
                },
                {
                    taskName: "Banding",
                    taskID: "#banding"
                },
                {
                    taskName: "Assembling",
                    taskID: "#assembling"
                },
                {
                    taskName: "Packaging",
                    taskID: "#packaging"
                }
            ]
        },
        {
            name: "Veneers",
            tasks: [
                {
                    taskName: "Cutting",
                    taskID: "#cutting"
                },
                {
                    taskName: "Banding",
                    taskID: "#banding"
                },
                {
                    taskName: "Sanding",
                    taskID: "#sanding"
                },
                {
                    taskName: "Finishing",
                    taskID: "#finishing"
                },
                {
                    taskName: "Packaging",
                    taskID: "#packaging"
                }
            ]
        }
    ]
}

const theme = getLocalStorageValue('theme') || "light";

const addJobBtn = document.querySelector('#add-job-btn');
// const addJobBtn = document.querySelector('#add-job-btn');

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




loadJobModal();



// EVENT LISTENERS

// Show Add Job Modal
addJobBtn.addEventListener('click', showAddJobModal);


// Add Job OK click
addJobOKBtn.addEventListener('click', async () => {
    await addJobToDB();
});

// Add Task Button Click
addJobAddTaskBtn.addEventListener('click', addTask);

// Cancel adding job button
addJobCancelBtn.addEventListener('click', hideAddJobModal);






// FUNCTIONS


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

    console.log(jobsResponse);

    jobsTable.innerHTML = getTableHeaderRow(["Name", "Estimated Date", "Target Date", "Progress", "Note", "Active", "Hours", "Delete"]);

    jobsResponse.forEach((job) => {
        const row = document.createElement('tr');
        row.classList.add('table-row-blank-border');
        row.addEventListener('dragenter', () => {row.classList.add('drag-over');});
        row.addEventListener('dragleave', () => {row.classList.remove('drag-over');});

        const progressBar = getTableDataWithProgressBar(50);
        const name = getTableDataWithText(job.name);
        const estimatedDate = getTableDataWithText(job.shipDate);
        const targetDate = getTableDataWithText(job.shipDate);

        const note = getTableDataWithEditText(job.note, );
        note.onclick = () => {
            console.log(prompt("Note", job.note));
            // showPrompt("Note", job.note, async (newNote) => {
            //         await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: job.id, note: newNote}, settings);
            //         await loadJobsTable();
            //     });
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

        const deleteTD = getTableDataWithDeleteButton(async () => {
            if (confirm(`Delete Job ${job.name}?`)) {``
                await deleteDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, job.id, settings);
                loadJobs();
            }
        });
        deleteTD.classList.add('table-delete-btn');

        const grabber = getTableDataWithGrabber();

        appendChildren(row, [name, estimatedDate, targetDate, progressBar, note, active, hours, deleteTD, grabber]);
        jobsTable.appendChild(row);
    });
}



function addTask() {
    if (!addJobSequenceName.value) return;

    let sequenceFound = false;
    job.sequences.forEach((sequence) => {
        if (sequence.name === addJobSequenceName.value) {
            sequence.tasks.push({
                taskName: addJobNewTaskName.value,
                taskID: "",
                hours: addJobHours.value,
                minutes: addJobMinutes.value,
            });
            sequenceFound = true;
        }
    });

    if (!sequenceFound) {
        job.sequences.push({
            name: addJobSequenceName.value,
            tasks: [
                {
                    taskName: addJobNewTaskName.value,
                    taskID: "#"
                },
            ]
        },)
    }
console.log(job);
loadSequences(job.sequences);
};

function loadJobModal() {
    addJobNameInput.value = job.name;
    addJobNotesInput.value = job.note;

    loadSequences(job.sequences);
}

function loadSequences(sequences) {
    addJobSequenceContainer.innerHTML = "";
    sequences.forEach((sequence) => {
        const sequenceTitle = document.createElement('h3');
        sequenceTitle.textContent = sequence.name;
        addJobSequenceContainer.appendChild(sequenceTitle);

        const sequenceBlock = document.createElement('div');
        sequenceBlock.classList.add('add-job-modal-sequence');
        sequence.tasks.forEach((task, index) => {
            const taskElement = document.createElement('p');
            taskElement.setAttribute('draggable', 'true');
            taskElement.setAttribute('sequence-name', sequence.name);

            taskElement.classList.add('add-job-modal-sequence-task');
            taskElement.textContent = task.taskName;

            
            taskElement.addEventListener('dragstart', (e) => {
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
                    loadSequences(job.sequences);

                }
                taskElement.classList.remove('add-job-task-drag-over');
            });

            sequenceBlock.appendChild(taskElement);
        });
        addJobSequenceContainer.appendChild(sequenceBlock);
    });
    
}


async function addJobToDB(){
    // showAddJobModal();
    
    const jobName = addJobNameInput.value.trim();
    const jobNote = addJobNotesInput.value;
    job.name = jobName;
    job.note = jobNote;
    
    if (!jobName) return;

    if (!await jobNameExists(jobName)) {
        await insertDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, job, settings);
    }
    else {
        showAlert("Job name already exists", `Sorry, ${jobName} already exists.`);
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

function showAddJobModal(){
    addModal.style.display = 'flex';
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