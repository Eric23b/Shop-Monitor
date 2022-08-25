
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

const yesNoModal = document.querySelector('#yes-no-modal');
const yesNoModalTitle = document.querySelector('#yes-no-modal-title');
const yesNoModalNoBtn = document.querySelector('#no-btn');
const yesNoModalYesBtn = document.querySelector('#yes-btn');

const alert = document.querySelector('#alert');
const alertLabel = document.querySelector('#alert-modal-label');
const alertMessage = document.querySelector('#alert-modal-message');
const alertOKBtn = document.querySelector('#alert-ok-btn');

const prompt = document.querySelector('#prompt');
const promptLabel = document.querySelector('#prompt-modal-label');
const promptInput = document.querySelector('#prompt-modal-input');
const promptCancelBtn = document.querySelector('#prompt-modal-cancel-btn');
const promptOKBtn = document.querySelector('#prompt-modal-ok-btn');

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

addJobAddTasksFromTextBtn.addEventListener('click', async () => {
    showAddTaskFromTextModal(
        async (sequenceName, text) => {
            if (!sequenceName) {
                showAlert("Missing sequence name", "Add a sequence name");
                return;
            }

            const totalShopTime = getTotalShopHours(text);
        
            const taskList = getTaskTimes(text);
        
            const tasksResponse = await getDBEntrees(BUSINESS_SCHEMA, TASKS_TABLE, "id", "*", settings);
            if ((!tasksResponse) || (tasksResponse.error)) return;
            if (tasksResponse.length == 0) return;
        
            const errors = [];
        
            for (const ownTask of taskList) {
                let taskFound = false;
                for (const task of tasksResponse) {
                    if (task.name === ownTask.name) {
                        taskFound = true;
                        addTask(
                            sequenceName,
                            {
                                name: ownTask.name,
                                id: task.id,
                                hours: ownTask.hours,
                                minutes: ownTask.minutes,
                                completed: false,
                            }
                        );
                    }
                }
                if (!taskFound) {
                    showAlert("Task not found",`Task "${ownTask.name} not found.\nPlease added "${ownTask.name}" to Tasks in the Admin page.`);
                }
            }
        }
    );
});

// Add Job OK click
addJobOKBtn.addEventListener('click', async () => {
    await addJobToDB();
    hideAddJobModal();
});
// Cancel adding job button
addJobCancelBtn.addEventListener('click', hideAddJobModal);





// FUNCTIONS

async function showPrompt(title, defaultText, OKCallback, cancelCallback) {
    prompt.style.display = 'flex';

    promptLabel.textContent = title;

    promptInput.value = defaultText || "";
    promptInput.focus();

    promptInput.onkeypress = (event) => {
        if (event.key === "Enter") {
            OKCallback(promptInput.value);
            prompt.style.display = 'none';
        }
    };

    promptOKBtn.onclick = async () => {
        OKCallback(promptInput.value);
        prompt.style.display = 'none';
    }
    
    promptCancelBtn.onclick = async () => {
        if (cancelCallback) cancelCallback();
        prompt.style.display = 'none';
    }
}

async function showAlert(title, message, OKCallback) {
    alert.style.display = 'flex';
    alertLabel.textContent = title;
    alertMessage.textContent = message;
    alertOKBtn.focus();
    alertOKBtn.onclick = async () => {
            if (OKCallback) OKCallback();
            alert.style.display = 'none';
    }
}

async function showYesNoModal(title, OKCallback) {
    yesNoModalTitle.textContent = title;
    yesNoModal.style.display = 'flex';
    yesNoModalYesBtn.focus();

    yesNoModalYesBtn.onclick = () => {
        OKCallback();
        yesNoModal.style.display = 'none';
    };

    yesNoModalNoBtn.onclick = () => {yesNoModal.style.display = 'none';};
}

async function showAddTaskFromTextModal(OKCallback, cancelCallback) {
    addTaskFromTextModalBackground.style.display = 'flex';

    addTasksFromTextOKBtn.onclick = async () => {
        OKCallback(addTaskFromTextModalSequenceName.value, addTasksFromTextTextArea.value);
        if (addTaskFromTextModalSequenceName.value) hideAddTaskFromTextModal();
    };

    addTasksFromTextCancelBtn.onclick = async () => {
        if (cancelCallback) cancelCallback();
        hideAddTaskFromTextModal();
    }
}

async function hideAddTaskFromTextModal() {
    addTaskFromTextModalBackground.style.display = 'none';
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

function hideAddTaskModal() {
    taskModalBackground.style.display = "none";
}

function getTaskTimes(text) {
    const textArray = text.split('\n');

    // Remove all spaces
    for (let i = 0; i < textArray.length; i++) {
        textArray[i] = textArray[i].replace(/\s/g, "");
    }
    
    // Find first line
    let jobLaborLineIndex = 0;
    for (let i = 0; i < textArray.length; i++) {
        if (textArray[i].startsWith("JobLabor")) jobLaborLineIndex = i;
    }

    let tasks = [];
    for (let i = jobLaborLineIndex + 1; i < textArray.length; i++) {
        // skip empty lines
        if (!textArray[i]) continue;

        const task = {};

        // Find task name
        if (textArray[i].match(/^\D+/)) {
            task.name = textArray[i].match(/^\D+/)[0];
        }
        else {
            task.name = "Missing task name";
        }

        // Find task hours
        if (textArray[i].match(/\d+hours/)) {
            task.hours = Number(textArray[i].match(/\d+hours/)[0].split("hours")[0]);
        }
        else {
            task.hours = 0;
        }
        
        // Find task minutes
        if (textArray[i].match(/\d+minutes/)) {
            task.minutes = Number(textArray[i].match(/\d+minutes/)[0].split("minutes")[0]);
        }
        else {
            task.minutes = 0;
        }

        tasks.push(task);
    }
    return tasks;
}

function getTotalShopHours(text) {
    const textArray = text.split('\n');

    for (let i = 0; i < textArray.length; i++) {
        textArray[i] = textArray[i].replace(/\s/g, "");
    }
    
    let jobLaborLine = "";
    for (const line of textArray) {
        if (line.startsWith("JobLabor")) jobLaborLine = line;
    }

    const jobHours = getJobLaborHours(jobLaborLine);
    const jobMinutes = getJobLaborMinutes(jobLaborLine);
    return jobHours + ":" + jobMinutes;

    function getJobLaborMinutes(line) {
        jobLaborLine = line.replace("JobLabor", "");
        if (jobLaborLine.includes("minutes")) {
            let minutes = jobLaborLine.split("hours");
            return Number(minutes[1].replace("minutes", ""));
        }
        else {
            return 0;
        }
    }

    function getJobLaborHours(line) {
        jobLaborLine = line.replace("JobLabor", "");
        if (jobLaborLine.includes("hours")) {
            let hours = jobLaborLine.split("hours");
            return Number(hours[0]);
        }
        else {
            return 0;
        }
    }
}

async function loadTasksSelect() {
    const tasksResponse = await getDBEntrees(BUSINESS_SCHEMA, TASKS_TABLE, "id", "*", settings);
    if ((!tasksResponse) || (tasksResponse.error)) return;
    if (tasksResponse.length == 0) return;

    taskModalTaskSelect.innerHTML = "";
    tasksResponse.forEach((task, index) => {
        const timerOption = document.createElement("option");
        timerOption.textContent = task.name;
        timerOption.id = task.id;
        timerOption.value = index;
        taskModalTaskSelect.appendChild(timerOption);
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

    jobsTable.innerHTML = getTableHeaderRow(["Name", "Estimated\nDate", "Ship\nDate", "Progress", "Note", "Active", "Shop\nHours", "Edit", "Delete"]);

    jobsResponse.forEach((job) => {
        // Calculate shop hours
        let totalHours = 0;
        let totalMinutes = 0;
        let completedHours = 0;
        let completedMinutes = 0;
        let allTasksCompleted = true;
        if (job.sequences) {
            job.sequences.forEach((sequence) => {
                if (sequence.tasks) {
                    sequence.tasks.forEach((task) => {
                        totalHours += Number(task.hours);
                        totalMinutes += Number(task.minutes);
                        if (task.completed) {
                            completedHours += Number(task.hours);
                            completedMinutes += Number(task.minutes);
                        }
                        else {
                            allTasksCompleted = false;
                        }
                    });
                }
            });
        }
        totalHours = Number(totalHours + Math.floor(totalMinutes / 60));
        totalMinutes = Number((((totalMinutes / 60) % 1) * 60).toFixed(0));
        const totalDecimalTime = totalHours + (totalMinutes / 60);
        const totalDecimalCompletedTime = completedHours + (completedMinutes / 60);
        const percentCompleted = ((totalDecimalCompletedTime / totalDecimalTime) * 100).toFixed(0);

        const row = document.createElement('tr');
        row.classList.add('table-row-blank-border');
        row.addEventListener('dragenter', () => {row.classList.add('drag-over');});
        row.addEventListener('dragleave', () => {row.classList.remove('drag-over');});

        const progressBar = getTableDataWithProgressBar(percentCompleted);
        progressBar.setAttribute('title', percentCompleted + "% completed")

        const name = getTableDataWithText(job.name);
        name.onclick = async () => {
            showPrompt("Note", job.name, async (name) => {
                job.name = name;
                await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: job.id, name: job.name}, settings);
                loadJobs();
            });
        }
        name.style.cursor = "pointer";


        const estimatedDate = getTableDataWithText(job.active ? job.shipDate : "");

        const shipDate = getTableDataWithText(job.shipDate);

        // Note
        const note = getTableDataWithEditText(job.note, );
        note.onclick = async () => {
            showPrompt("Note", job.note, async (note) => {
                job.note = note;
                await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: job.id, note: job.note}, settings);
                loadJobs();
            });
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

        const hours = getTableDataWithText(`${totalHours}:${totalMinutes}`);

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
            loadSequences(currentJob.sequences);
            await showAddJobModal();
        });

        const deleteTD = getTableDataWithDeleteButton(async () => {
            if (confirm(`Delete Job ${job.name}?`)) {
                await deleteDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, job.id, settings);
                loadJobs();
            }
        });
        deleteTD.classList.add('table-delete-btn');

        let grabber = document.createElement('td');
        if (job.active) {
            grabber = getTableDataWithGrabber();
        }

        appendChildren(row, [name, estimatedDate, shipDate, progressBar, note, active, hours, edit, deleteTD, grabber]);
        jobsTable.appendChild(row);
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
            showAlert("Job name already exists", `Sorry, ${jobName} already exists.`)
            // alert("Job name already exists", `Sorry, ${jobName} already exists.`);
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