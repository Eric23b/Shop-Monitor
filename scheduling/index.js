
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
    showCalendarPreviewDialog,
} from "../dialogs.js";

const settings = {
    url: "",
    authorization: ""
}

let draggingJobIndex = 0;

const theme = getLocalStorageValue('theme') || "light";

const addNewJobBtn = document.querySelector('#add-job-btn');

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

// Got to home page
window.onkeydown = (event) => {
    if (event.key === "8" && event.ctrlKey) window.location = "/";
}

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

await loadJobs(null, true);


// showCalendarPreviewDialog("Preview", [
//     {name: "13000dfsgsdfzhgszdf", startDate: "2022-11-01", endDate: "2022-11-10"},
//     {name: "13001", startDate: "2022-11-05", endDate: "2022-11-7"},
//     {name: "13002", startDate: "2023-02-03", endDate: "2023-03-15"},
//     {name: "13003", startDate: "2022-11-03", endDate: "2022-11-15"},
//     {name: "13004", startDate: "2022-11-16", endDate: "2022-11-22"},
// ]
// );


// FUNCTIONS



async function loadJobs(jobs, sortByIndex) {
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

    await updateEstimateDateAndStartDate(jobs);

    // Estimated date preview calendar
    const previewEstimatedDatesBtn = document.createElement('button');
    previewEstimatedDatesBtn.textContent = "Estimated\nDate Preview";
    previewEstimatedDatesBtn.style.cssText = `
        border: none;
        font-size: 1em;
        cursor: pointer;
        color: var(--yes);`;
    previewEstimatedDatesBtn.setAttribute('title', 'Open preview calendar');
    previewEstimatedDatesBtn.onclick = async () => {
        const jobsForCalendarPreview = [];
        jobs.forEach((job) => {
            const jobTimes = getJobTimes(job);
            if (!job.active) return;
            jobsForCalendarPreview.push({name: job.name,
                                         startDate: job.startDate || job.estimatedDate,
                                         endDate: job.estimatedDate,
                                         tooltip: `${jobTimes.remainingTimeString} remaining.`,
                                        });
        });

        showCalendarPreviewDialog("Preview of Estimated Dates", jobsForCalendarPreview, true, true);
    };

    // Update all button
    const updateAllEstimatedDatesBtn = document.createElement('button');
    updateAllEstimatedDatesBtn.textContent = "⇨";
    updateAllEstimatedDatesBtn.style.cssText = `
        color: var(--yes);
        border: none;
        font-size: 2.5em;
        cursor: pointer;`;
    updateAllEstimatedDatesBtn.setAttribute('title', 'Update All Ship Dates');
    updateAllEstimatedDatesBtn.onclick = async () => {
        showYesNoDialog("Update All Ship Dates?",
            async () => {
                jobs.forEach(async (job) => {
                    if (job.active) {
                        job.shipDate = job.estimatedDate;
                        await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: job.id, shipDate: job.shipDate}, settings);
                    }
                });
                await loadJobs(jobs);
            }
        );
    };

    // Ship date preview calendar  
    const previewShipDatesBtn = document.createElement('button');
    previewShipDatesBtn.textContent = "Ship Date";
    previewShipDatesBtn.style.cssText = `
        border: none;
        font-size: 1em;
        cursor: pointer;
        color: var(--yes);`;
    previewShipDatesBtn.setAttribute('title', 'Open ship date calendar');
    previewShipDatesBtn.onclick = async () => {
        const jobsForCalendarPreview = [];
        jobs.forEach((job) => {
            if (!job.active) return;
            jobsForCalendarPreview.push({name: job.name,
                                         startDate: job.shipDate,
                                         endDate: job.shipDate
                                        });
        });

        showCalendarPreviewDialog("Current Shipping Dates", jobsForCalendarPreview, false, false);
    };

    // Table header
    jobsTable.innerHTML = "";
    jobsTable.appendChild(getTableHeaderRow(["Name", previewEstimatedDatesBtn, updateAllEstimatedDatesBtn, previewShipDatesBtn, "Progress", "Note", "Active", "Remaining\nTime", "Shop\nTime", "Edit", "Delete", ""]));

    let todayAdded = false;
    jobs.forEach((job, jobIndex) => {
        if ((!job.active) && (!todayAdded)) {
            todayAdded = true;
            const today = getToday().toLocaleDateString('en-CA');
            jobsTable.appendChild(getTableHeaderRow(["Today", today, "-", "-", "-", "-", "-", "-", "-", "-", "-", ""]));
        }

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

        // Estimated date
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

        // Ship date
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
        const note = getTableDataWithEditText(job.index || "");
        // const note = getTableDataWithEditText(job.note);
        note.onclick = async () => {
            showInputDialog("Note", job.note, async (note) => {
                job.note = note;
                await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: job.id, note: job.note}, settings);
                await loadJobs();
            }, null, 'textarea', "job notes");
        }
        note.style.cursor = "pointer";

        // Active
        const active = getTableDataWithCheckbox(
            job.active,
            async (event) => {
                const isChecked = event.target.checked;
                await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: job.id, active: isChecked}, settings);
                await loadJobs();
            }
        );

        // Remaining Time
        const remainingHours = getTableDataWithText(`${jobTimes.remainingTimeString}`);

        // Shop Hours
        const shopHours = getTableDataWithText(`${jobTimes.totalTimeString}`);

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
                    await loadJobs(jobs);
                }
            );
        });

        // Delete
        const deleteTD = getTableDataWithDeleteButton(async () => {
            if (showYesNoDialog(`Delete Job ${(job.name || "")}?`, async () => {
                await deleteDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, job.id, settings);
                loadJobs();
            }));
        });
        deleteTD.classList.add('table-delete-btn');

        // Grabber
        let grabber = document.createElement('td');
        if (job.active) {
            grabber = getTableDataWithGrabber();
            grabber.setAttribute('job-index', jobIndex);
        }

        appendChildren(row, [name, estimatedDate, updateShipDate, shipDate, progressBar, note, active, remainingHours, shopHours, edit, deleteTD, grabber]);
        jobsTable.appendChild(row);
    });
}

async function updateEstimateDateAndStartDate(jobs) {

    class ChronologicalTaskPointer {
        constructor(tasksResponse) {
            this.tasks = JSON.parse(JSON.stringify(tasksResponse));
            this.tasks.forEach((task) => {
                task.dailyAvailableMinutes = (task.hours * 60) + task.minutes;
                task.minutePointer = 0;
            });
            this.lastMinutePointer = 0;
        }

        incTaskPointer(taskID, minutes, newSequence) {
            const finishDate = this.#getToday();
            let daysRemaining = 0;
            let taskFound = false;
            this.tasks.forEach((task) => {
                if (task.id === taskID) {
                    taskFound = true;

                    daysRemaining = Math.floor(((newSequence ? this.lastMinutePointer : 0) + task.minutePointer + minutes) / task.dailyAvailableMinutes);
                    task.minutePointer += minutes;
                    this.lastMinutePointer = task.minutePointer;
                    incWorkDay(finishDate, daysRemaining);
                }
            });
            if (!taskFound) console.log("Task not found.");
            return finishDate;
        }

        #getToday() {
            const utcDate = new Date();
            return new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
        }
    }

    // Sort by index
    jobs.sort((a, b) => {
        const nameA = a.index;
        const nameB = b.index;
        if (nameA > nameB) return -1;
        if (nameA < nameB) return 1;
        return 0;
    });

    const tasksResponse = await getDBEntrees(BUSINESS_SCHEMA, TASKS_TABLE, "id", "*", settings);
    if ((!tasksResponse) || (tasksResponse.error)) return;
    if (tasksResponse.length == 0) return;

    const taskPointerObj = new ChronologicalTaskPointer(tasksResponse);

    let dateOfCompletion = (new Date()).toLocaleDateString('en-CA');
    jobs.forEach((job) => {
        if (!job.active) return;
        if (!job.sequences) return;
        let jobIsCompleted = true;

        let maxDateOfCompletion = dateOfCompletion;

        job.startDate = dateOfCompletion;

        job.sequences.forEach((sequence) => {
            if (!sequence.tasks) return;

            let newSequence = true;
            sequence.tasks.forEach((jobTask) => {
                if (!jobTask.completed) {
                    const remainingTimePerTaskInMinutes = Number(jobTask.hours * 60) + Number(jobTask.minutes);
                    dateOfCompletion = taskPointerObj.incTaskPointer(jobTask.id, remainingTimePerTaskInMinutes, newSequence).toLocaleDateString('en-CA');
                    if (Number(dateOfCompletion.replaceAll("-", "")) > Number(maxDateOfCompletion.replaceAll("-", ""))) {
                        maxDateOfCompletion = dateOfCompletion;
                    }
                    jobIsCompleted = false;
                }
                newSequence = false;
            });
        });
        if (jobIsCompleted) {
            job.startDate = getToday().toLocaleDateString('en-CA');
            job.estimatedDate = getToday().toLocaleDateString('en-CA');
            job.completed = true;
        }
        else {
            job.estimatedDate = maxDateOfCompletion;
        }
    });

    // Sort by index
    jobs.sort((a, b) => {
        const nameA = a.index;
        const nameB = b.index;
        if (nameA > nameB) return 1;
        if (nameA < nameB) return -1;
        return 0;
    });

    // 
    jobs.sort((a, b) => {
        const nameA = a.index;
        const nameB = b.index;
        if (a.completed) return 1;
        if (b.completed) return -1;
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
function getToday() {
    const utcDate = new Date();
    return new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
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
            date.setDate(date.getDate() + 2);
        }
        if (dayName === "Sun") {
            date.setDate(date.getDate() + 1);
        }
    }
}
    
// function setToNextWorkDay(date) {
//     const dayName = (date.toLocaleString('default', {weekday: 'short'}));
//     if (dayName === "Sat") {
//         date.setDate(date.getDate() + 2);
//     }
//     if (dayName === "Sun") {
//         date.setDate(date.getDate() + 1);
//     }
// }

// async function getAvailableShopHours(tasksResponse) {
//     // const tasksResponse = await getDBEntrees(BUSINESS_SCHEMA, TASKS_TABLE, "id", "*", settings);
//     if ((!tasksResponse) || (tasksResponse.error)) return;
//     if (tasksResponse.length == 0) return;

//     const returnObject = {};

//     let totalHours = 0;
//     let totalMinutes = 0;
//     tasksResponse.forEach((task) => {
//         totalHours += task.hours;
//         totalMinutes += task.minutes;

//         returnObject[task.id] = Number(task.hours * 60) + Number(task.minutes);
//     });
//     totalHours = Number(totalHours + Math.floor(totalMinutes / 60));
//     totalMinutes = Number((((totalMinutes / 60) % 1) * 60).toFixed(0));
//     returnObject.total = totalHours + (totalMinutes / 60);

//     returnObject.totalMinutes = Number(totalHours * 60) + Number(totalMinutes);
//     return returnObject;
// }

function getJobTimes(job) {
    // Calculate shop hours
    let times = {};
    times.totalHours = 0;
    times.totalMinutes = 0;
    times.completedHours = 0;
    times.completedMinutes = 0;
    times.allTasksCompleted = true;
    times.remainingTimePerTaskInMinutes = {};
    if (job.sequences) {
        job.sequences.forEach((sequence) => {
            if (sequence.tasks) {
                sequence.tasks.forEach((task) => {
                    times.totalHours += Number(task.hours);
                    times.totalMinutes += Number(task.minutes);
                    if (task.completed) {
                        times.completedHours += Number(task.hours);
                        times.completedMinutes += Number(task.minutes);
                        times.remainingTimePerTaskInMinutes[task.id] = 0;
                    }
                    else {
                        times.remainingTimePerTaskInMinutes[task.id] = Number(task.hours * 60) + Number(task.minutes);
                        times.allTasksCompleted = false;
                    }
                });
            }
        });
    }
    times.totalHours = Number(times.totalHours + Math.floor(times.totalMinutes / 60));
    times.totalMinutes = Number((((times.totalMinutes / 60) % 1) * 60).toFixed(0));
    times.totalTimeString = `${times.totalHours}:${(times.totalMinutes < 10) ? "0" + String(times.totalMinutes) : times.totalMinutes}`
    times.totalTimeDec = times.totalHours + (times.totalMinutes / 60);
    times.totalCompletedTimeDec = times.completedHours + (times.completedMinutes / 60);
    times.totalTimeRemainingDec = times.totalTimeDec - times.totalCompletedTimeDec;
    times.percentCompleted = ((times.totalCompletedTimeDec / times.totalTimeDec) * 100).toFixed(0);

    const totalTimeInMinutes = ((times.totalHours * 60) + times.totalMinutes);
    const totalCompletedTimeInMinutes = ((times.completedHours * 60) + times.completedMinutes);
    times.totalTimeRemainingInMinutes = totalTimeInMinutes - totalCompletedTimeInMinutes;

    const remainingHours = Math.floor(times.totalTimeRemainingInMinutes / 60);
    const remainingMinutes = (Math.floor(times.totalTimeRemainingInMinutes) - (Math.floor(times.totalTimeRemainingInMinutes / 60) * 60));
    times.remainingTimeString = `${remainingHours}:${(remainingMinutes < 10) ? "0" + String(remainingMinutes) : remainingMinutes}`;
    return times;
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
