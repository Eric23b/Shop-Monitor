
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

import {
    showYesNoDialog,
    showAlertDialog,
    showInputDialog,
    showJobDialog,
} from "../dialogs.js";

const settings = {
    url: "",
    authorization: ""
}

let draggingJobIndex = 0;
let draggingTask = {taskIndex: 0, sequenceName: ""};

let currentJob = {
    active: true,
    sequences: null,
}

const theme = getLocalStorageValue('theme') || "light";

const addNewJobBtn = document.querySelector('#add-job-btn');

// Add Tasks From Text
const addTaskFromTextModalBackground = document.querySelector('#add-task-from-text-modal-background');
const addTaskFromTextModalSequenceName = document.querySelector('#tasks-from-text-sequence-name');
const addTasksFromTextTextArea = document.querySelector('#add-tasks-from-text-textarea');
const addTasksFromTextOKBtn = document.querySelector('#tasks-from-text-ok-btn');
const addTasksFromTextCancelBtn = document.querySelector('#tasks-from-text-cancel-btn');

const tableRows = document.querySelectorAll('.jobs-table tr');
const jobsTable = document.querySelector('#jobs-table');
const grabbers = document.querySelectorAll('.grabber');


const checklistPromptBackground = document.querySelector("#checklist-prompt");
const checklistPromptLabel = document.querySelector("#checklist-prompt-label");
const checklistPromptCheckContainer = document.querySelector("#checklist-prompt-checkbox-container");
const checklistPromptCancelBtn = document.querySelector("#checklist-prompt-cancel-btn");
const checklistPromptOKBtn = document.querySelector("#checklist-prompt-ok-btn");

const log = console.log;


// INIT CODE

document.documentElement.setAttribute('data-color-theme', theme);

settings.url = getLocalStorageValue('serverURL') || "";
settings.authorization = getLocalStorageValue('serverAuthorization') || "";
const stationName = getLocalStorageValue('stationName') || "";





// EVENT LISTENERS

// New Job Button
addNewJobBtn.addEventListener('click', async () => {
    const jobsResponse = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "id", "*", settings);
    if ((!jobsResponse) || (jobsResponse.error)) return;

    const tasksResponse = await getDBEntrees(BUSINESS_SCHEMA, TASKS_TABLE, "id", "*", settings);
    if ((!tasksResponse) || (tasksResponse.error)) return;

    showJobDialog(null, jobsResponse, tasksResponse, 
        async (newJob) => {
            await insertDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, newJob, settings);
            await loadJobs();
        },
        async (oldJob) => {
            await loadJobs();
        }
    );
});

// addJobAddTasksFromTextBtn.addEventListener('click', );
function addTasksFromTextBtn(){
    showAddTaskFromTextModal(
        async (sequenceName, text) => {
            if (!sequenceName) {
                showAlertDialog("Please add a sequence name.");
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
                    showAlertDialog(`Task "${ownTask.name} not found.\nPlease added "${ownTask.name}" to Tasks in the Admin page.`);
                }
            }
        }
    );
};

await loadJobs();




// FUNCTIONS

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

async function loadJobs(jobs) {
    if (jobs == null) {
        jobs = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "__createdtime__", "*", settings);
        if ((!jobs) || (jobs.error)) return;
        // Sort by ship date
        jobs.sort((a, b) => {
            const nameA = a.shipDate;
            const nameB = b.shipDate;
            if (nameA < nameB) return 1;
            if (nameA > nameB) return -1;
            return 0;
        });
        
        // Sort by active
        jobs.sort((a, b) => {
            const nameA = a.active;
            const nameB = b.active;
            if (nameA < nameB) return 1;
            if (nameA > nameB) return -1;
            return 0;
        });
    }
    jobs.forEach((job, index) => {job.index = index});

    await updateEstimateDates(jobs);

    async function updateEstimateDates(jobs) {
        // Sort by index
        jobs.sort((a, b) => {
            const nameA = a.index;
            const nameB = b.index;
            if (nameA > nameB) return -1;
            if (nameA < nameB) return 1;
            return 0;
        });

        const dailyAvailableShopHoursDec = await getTotalAvailableShopHoursDec();
    
        const dayIndex = new Date();
        let dayFraction = 0;

        jobs.forEach((job) => {
            if (!job.active) return;

            const jobTimes = getJobTimes(job);
            jobTimes.daysToCompleteDec = jobTimes.totalTimeRemainingDec / dailyAvailableShopHoursDec;
            
            jobTimes.startDay = new Date(dayIndex);

            const fraction = Number((jobTimes.daysToCompleteDec % 1).toFixed(3));
            incWorkDay(dayIndex, Math.floor(jobTimes.daysToCompleteDec) + Math.floor(dayFraction + fraction));
            dayFraction = Number(((dayFraction + fraction) % 1).toFixed(3));
            
            jobTimes.shipDay = new Date(dayIndex);

            job.estimatedDate = jobTimes.shipDay.toLocaleDateString('en-CA');
        });

        // Sort by index
        jobs.sort((a, b) => {
            const nameA = a.index;
            const nameB = b.index;
            if (nameA > nameB) return 1;
            if (nameA < nameB) return -1;
            return 0;
        });

        // Sort by active
        jobs.sort((a, b) => {
            const nameA = a.active;
            const nameB = b.active;
            if (nameA < nameB) return 1;
            if (nameA > nameB) return -1;
            return 0;
        });
    }

    jobsTable.innerHTML = getTableHeaderRow(["Name", "Estimated\nDate", "", "Ship\nDate", "Progress", "Note", "Active", "Shop\nHours", "Edit", "Delete", ""]);

    jobs.forEach((job, jobIndex) => {
        const jobTimes = getJobTimes(job);

        const row = document.createElement('tr');
        row.classList.add('table-row-blank-border');
        if (job.active) {
            row.addEventListener('dragstart', () => {draggingJobIndex = jobIndex});
            row.addEventListener('dragenter', () => {row.classList.add('drag-over')});
            row.addEventListener('dragleave', () => {row.classList.remove('drag-over')});
            row.addEventListener('dragover', (event) => {event.preventDefault()});
            row.addEventListener('drop', async () => {
                row.classList.remove('drag-over');
                const tempJob = jobs.splice(draggingJobIndex, 1);
                jobs.splice(jobIndex, 0, ...tempJob);
                await loadJobs(jobs);
            });
        }

        // Name
        const name = getTableDataWithText(job.name);
        name.onclick = async () => {
            showInputDialog("Rename job", job.name, async (name) => {
                job.name = name;
                await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: job.id, name: job.name}, settings);
                await loadJobs();
            });
        }
        name.style.cursor = "pointer";

        const estimatedDateString = job.estimatedDate ? job.estimatedDate : "";
        const estimatedDate = getTableDataWithText(job.active ? estimatedDateString : "");
        estimatedDate.setAttribute('title', getDateText(job.estimatedDate));

        // ⇨ Update ship date button
        let updateShipDate = document.createElement('td');
        if (job.active) {
            updateShipDate = getTableDataWithText("⇨");
            updateShipDate.style.cursor = "pointer";
            updateShipDate.style.color = (job.estimatedDate == job.shipDate) ? "var(--yes)" : "var(--no)";
            updateShipDate.classList.add('table-text-btn');
            updateShipDate.addEventListener('click', async () => {
                job.shipDate = job.estimatedDate;
                await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: job.id, shipDate: job.shipDate}, settings);
                await loadJobs(jobs);
            });
        }


        
        
        const shipDate = getTableDataWithEditText(job.shipDate);
        shipDate.setAttribute('title', getDateText(job.shipDate));
        // const month = new Date(job.shipDate).toLocaleString("en-CA", { month: "long" }).toLowerCase();
        // shipDate.classList.add(month);
        shipDate.onclick = async () => {
            showInputDialog("Ship Date", job.shipDate, async (shipDate) => {
                job.shipDate = shipDate;
                await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: job.id, shipDate: job.shipDate}, settings);
                await loadJobs();
            }, null, 'date');
        }

        // Progress bar
        const progressBar = getTableDataWithProgressBar(jobTimes.percentCompleted);
        progressBar.addEventListener('click', () => {
            showChecklistPrompt(job.sequences, async (newSequences) => {
                await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: job.id, sequences: newSequences}, settings);
                await loadJobs();
            }, (oldSequences) => {job.sequences = oldSequences});
        });

        // Note
        // const note = getTableDataWithEditText(job.index || "");
        const note = getTableDataWithEditText(job.note);
        note.onclick = async () => {
            showInputDialog("Note", job.note, async (note) => {
                job.note = note;
                await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: job.id, note: job.note}, settings);
                await loadJobs();
            }, null, 'textarea', "job notes");
        }
        note.style.cursor = "pointer";

        const active = getTableDataWithCheckbox(
            job.active,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: job.id, active: isChecked}, settings);
                await loadJobs();
            }
        );

        const hours = getTableDataWithText(`${jobTimes.totalHours}:${jobTimes.totalMinutes}`);

        // Edit job
        const edit = getTableDataWithText("✏");
        edit.style.cursor = "pointer";
        edit.classList.add('table-text-btn');
        edit.addEventListener('click', async () => {
            const jobsResponse = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "id", "*", settings);
            if ((!jobsResponse) || (jobsResponse.error)) return;

            const tasksResponse = await getDBEntrees(BUSINESS_SCHEMA, TASKS_TABLE, "id", "*", settings);
            if ((!tasksResponse) || (tasksResponse.error)) return;
            
            showJobDialog(job, jobsResponse, tasksResponse, 
                async (newJob) => {
                    await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, newJob, settings);
                    await loadJobs();
                },
                async (oldJob) => {
                    await loadJobs();
                }
            );
        });

        const deleteTD = getTableDataWithDeleteButton(async () => {
            if (showYesNoDialog(`Delete Job ${(job.name || "")}?`, async () => {
                await deleteDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, job.id, settings);
                loadJobs();
            }));
        });
        deleteTD.classList.add('table-delete-btn');

        let grabber = document.createElement('td');
        if (job.active) {
            grabber = getTableDataWithGrabber();
            grabber.setAttribute('job-index', jobIndex);
        }

        appendChildren(row, [name, estimatedDate, updateShipDate, shipDate, progressBar, note, active, hours, edit, deleteTD, grabber]);
        jobsTable.appendChild(row);
    });
}

function getDateText(date) {
    try {
        const shipDateObj = new Date(date.split("-")[0], Number(date.split("-")[1]) - 1, date.split("-")[2]);
        let shipDateText = shipDateObj.toLocaleString("en-CA", { month: "long" });
        shipDateText += " " + shipDateObj.getDate();
        shipDateText += "/" + shipDateObj.getFullYear();
        return shipDateText;
    } catch (error) {
        // console.error(error);
        return "";
    }
}
    
function incWorkDay(date, amount) {
    let index = 0;
    while (index < amount) {
        index++;
        date.setDate(date.getDate() + 1);
        const dayName = (date.toLocaleString('default', {weekday: 'short'}));
        if (dayName === "Sat") {
            index += 2;
            date.setDate(date.getDate() + 2);
        }
    }
}

async function getTotalAvailableShopHoursDec() {
    const tasksResponse = await getDBEntrees(BUSINESS_SCHEMA, TASKS_TABLE, "id", "*", settings);
    if ((!tasksResponse) || (tasksResponse.error)) return;
    if (tasksResponse.length == 0) return;

    let totalHours = 0;
    let totalMinutes = 0;
    tasksResponse.forEach((task) => {
        totalHours += task.hours;
        totalMinutes += task.minutes;
    });
    totalHours = Number(totalHours + Math.floor(totalMinutes / 60));
    totalMinutes = Number((((totalMinutes / 60) % 1) * 60).toFixed(0));
    let totalDecimalTime = totalHours + (totalMinutes / 60);
    return totalDecimalTime;
}

function getJobTimes(job) {
    // Calculate shop hours
    let times = {};
    times.totalHours = 0;
    times.totalMinutes = 0;
    times.completedHours = 0;
    times.completedMinutes = 0;
    times.allTasksCompleted = true;
    if (job.sequences) {
        job.sequences.forEach((sequence) => {
            if (sequence.tasks) {
                sequence.tasks.forEach((task) => {
                    times.totalHours += Number(task.hours);
                    times.totalMinutes += Number(task.minutes);
                    if (task.completed) {
                        times.completedHours += Number(task.hours);
                        times.completedMinutes += Number(task.minutes);
                    }
                    else {
                        times.allTasksCompleted = false;
                    }
                });
            }
        });
    }
    times.totalHours = Number(times.totalHours + Math.floor(times.totalMinutes / 60));
    times.totalMinutes = Number((((times.totalMinutes / 60) % 1) * 60).toFixed(0));
    times.totalTimeDec = times.totalHours + (times.totalMinutes / 60);
    times.totalCompletedTimeDec = times.completedHours + (times.completedMinutes / 60);
    times.totalTimeRemainingDec = times.totalTimeDec - times.totalCompletedTimeDec;
    times.percentCompleted = ((times.totalCompletedTimeDec / times.totalTimeDec) * 100).toFixed(0);
    return times;
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

function getLocalStorageValue(key) {
    if (window.localStorage[key])
        return JSON.parse(window.localStorage.getItem(key));
}

function appendChildren(parent, childList) {
    childList.forEach((childElement) => {
        parent.appendChild(childElement);
    });
}

function showChecklistPrompt(sequences, OKCallback, cancelCallback) {
    if (!sequences) sequences = [];

    const sequencesCopy = JSON.parse(JSON.stringify(sequences));

    checklistPromptBackground.style.display = "flex";
    checklistPromptBackground.style.backgroundColor = "var(--background_transparent_color)";

    checklistPromptCheckContainer.innerHTML = "";

    sequences.forEach((sequence) => {
        const sequenceContainer = document.createElement('div');
        sequenceContainer.classList.add('checklist-prompt-checkbox-container');

        const sequenceTitle = document.createElement('h2');
        sequenceTitle.textContent = sequence.name;
        sequenceTitle.classList.add('checklist-prompt-sequence-title');

        sequenceContainer.appendChild(sequenceTitle);

        sequence.tasks.forEach((task) => {
            const checkLabel = document.createElement('label');
            checkLabel.classList.add('checklist-prompt-check-label');
    
            const checkbox = document.createElement('input');
            checkbox.setAttribute('type', 'checkbox');
            if (task.completed) checkbox.setAttribute('checked', 'true');
            checkbox.onchange = (event) => {
                task.completed = event.target.checked;
            }
    
            checkLabel.innerText = task.name;
            checkbox.id = task.id;
    
            checkLabel.appendChild(checkbox);
            sequenceContainer.appendChild(checkLabel);
        });

        checklistPromptCheckContainer.appendChild(sequenceContainer);
    });

    // OK click
    checklistPromptOKBtn.onclick = () => {
        if (OKCallback) OKCallback(sequences);
        checklistPromptBackground.style.display = "none";
    };

    checklistPromptCancelBtn.onclick = cancelClick;
    function cancelClick() {
        if (cancelCallback) cancelCallback(sequencesCopy);
        checklistPromptBackground.style.display = "none";
    }
}
