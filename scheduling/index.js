
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
    showContextMenu,
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



// FUNCTIONS

async function loadJobs(jobs, sortByIndex) {
    if (jobs == null) {
        jobs = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "__createdtime__", "*", settings);
        if ((!jobs) || (jobs.error)) return;

        sortDown(jobs, "shipDate");

        sortByCompleted(jobs);

        sortDown(jobs, "active");
    }

    jobs.forEach((job, index) => {job.index = index});

    const tasksResponse = await getDBEntrees(BUSINESS_SCHEMA, TASKS_TABLE, "active", true, settings);
    if ((!jobs) || (jobs.error)) return;
    await updateEstimateDateAndStartDate(jobs, tasksResponse);

    // Estimated date preview calendar button
    const previewEstimatedDatesBtn = document.createElement('button');
    previewEstimatedDatesBtn.textContent = "Estimated\nDate Preview";
    previewEstimatedDatesBtn.style.cssText = `border: none;
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
                                         tooltip: jobTimes.totalTimeString + " shop time.\n" +
                                                  jobTimes.remainingTimeString + " remaining.\n" +
                                                  jobTimes.percentCompleted + "% completed.",
                                        });
        });

        showCalendarPreviewDialog("Preview of Estimated Dates", jobsForCalendarPreview, true, true);
    };

    // Update all button
    const updateAllEstimatedDatesBtn = document.createElement('button');
    updateAllEstimatedDatesBtn.textContent = "⇨";
    updateAllEstimatedDatesBtn.style.cssText = `color: var(--yes);
                                                border: none;
                                                font-size: 2.5em;
                                                cursor: pointer;`;
    updateAllEstimatedDatesBtn.setAttribute('title', 'Update All Ship Dates');
    updateAllEstimatedDatesBtn.onclick = async () => {
        showYesNoDialog("Update All Ship Dates?",
            async () => {
                jobs.forEach(async (job) => {
                    if (!job.active) return;
                    job.shipDate = job.estimatedDate;
                    await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: job.id, shipDate: job.shipDate}, settings);
                    
                });
                await loadJobs(jobs);
            }
        );
    };

    // Ship date preview calendar  
    const previewShipDatesBtn = document.createElement('button');
    previewShipDatesBtn.textContent = "Ship Date";
    previewShipDatesBtn.style.cssText = `border: none;
                                         font-size: 1em;
                                         cursor: pointer;
                                         color: var(--yes);`;
    previewShipDatesBtn.setAttribute('title', 'Open ship date calendar');
    previewShipDatesBtn.onclick = async () => {
        const jobsForCalendarPreview = [];
        jobs.forEach((job) => {
            if (!job.active) return;
            const jobTimes = getJobTimes(job);
            jobsForCalendarPreview.push({name: job.name,
                                         startDate: job.shipDate,
                                         endDate: job.shipDate,
                                         tooltip: jobTimes.totalTimeString + " shop time.\n" +
                                                  jobTimes.remainingTimeString + " remaining.\n" +
                                                  jobTimes.percentCompleted + "% completed.",
                                        });
        });

        showCalendarPreviewDialog("Current Shipping Dates", jobsForCalendarPreview, false, false);
    };

    // Table header
    jobsTable.innerHTML = "";
    jobsTable.appendChild(getTableHeaderRow(["Name", previewEstimatedDatesBtn, updateAllEstimatedDatesBtn, previewShipDatesBtn, "Progress", "Note", "Active", "Remaining\nTime", "Shop\nTime", "Edit", "Delete", ""]));

    let todayAdded = false;
    jobs.forEach((job, jobIndex) => {
        // Sneak in today row
        if ((!job.active) && (!todayAdded)) {
            const today = getToday().toLocaleDateString('en-CA');
            jobsTable.appendChild(getTableHeaderRow(["Today", today, "-", "-", "-", "-", "-", "-", "-", "-", "-", ""]));
            todayAdded = true;
        }

        const jobTimes = getJobTimes(job);

        const row = document.createElement('tr');
        row.classList.add('table-row-blank-border');
        row.oncontextmenu = (event) => {event.preventDefault()}
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
        row.oncontextmenu = async (event) => {
            event.preventDefault();
            const jobActiveText = job.active ? "Deactivate" : "Activate";
            const moveOptions = job.active ? ["Move Up", "Move Down"] : [];
            const menuOptions = ["Edit", "Delete", "Rename", jobActiveText, ...moveOptions];
            showContextMenu(event, menuOptions, (text) => {
                switch (text) {
                    case "Edit": editJob(job); break;
                    case "Delete": deleteJob(job); break;
                    case "Rename": renameJob(job); break;
                    case "Activate": jobActivity(job, true); break;
                    case "Deactivate": jobActivity(job, false); break;
                    case "Move Up": moveJobUp(jobs, jobIndex); break;
                    case "Move Down": moveJobDown(jobs, jobIndex); break;
                    default: break;
                }
            });
        }

        // Name
        const name = getTableDataWithText(job.name);
        name.onclick = async () => {await renameJob(job)};
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
        progressBar.onclick = async () => {
            showChecklistPrompt(job.sequences, async (newSequences) => {
                await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: job.id, sequences: newSequences}, settings);
                await loadJobs();
            }, (oldSequences) => {job.sequences = oldSequences});
        };

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
        edit.onclick = async () => {editJob(job)};

        // Delete
        const deleteTD = getTableDataWithDeleteButton(async () => {deleteJob(job)});
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

async function renameJob(job) {
    showInputDialog("Rename job", job.name, async (name) => {
        job.name = name;
        await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: job.id, name: job.name}, settings);
        await loadJobs();
    });
}

async function jobActivity(job, active) {
    await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: job.id, active: active}, settings);
    await loadJobs();
}

async function editJob(job) {
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
            // await loadJobs(jobs);
        }
    );
}

async function deleteJob(job) {
    if (showYesNoDialog(`Delete Job ${(job.name || "")}?`, async () => {
        await deleteDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, job.id, settings);
        loadJobs();
    }));
}

async function moveJobUp(jobs, jobIndex) {
    if (jobIndex == 0) return;
    const tempJob = jobs.splice(jobIndex - 1, 1);
    jobs.splice(jobIndex, 0, ...tempJob);
    await loadJobs(jobs);
}

async function moveJobDown(jobs, jobIndex) {
    let lastActiveJob = 0;
    for (let index = 0; index < jobs.length; index++) {
        if (jobs[index].active == false) {
            lastActiveJob = index - 1;
            break;
        }
    }
    if (lastActiveJob <= jobIndex) return;
    const tempJob = jobs.splice(jobIndex + 1, 1);
    jobs.splice(jobIndex, 0, ...tempJob);
    await loadJobs(jobs);
}

async function updateEstimateDateAndStartDate(jobs, tasksResponse) {
    // const jobsCopy = JSON.parse(JSON.stringify(jobs));
    const shopTasks = JSON.parse(JSON.stringify(tasksResponse));

    const jobsCopy = cleanupAndCopyJobs(jobs);

    sortDown(jobsCopy, 'index');

    // Add total minutes to shopTasks
    shopTasks.forEach((task) => {task.totalMinutes = Number(task.hours * 60) + task.minutes});

    // // Added scaledMinutes to job tasks
    AddedScaledMinutesToJobTasks(jobsCopy, shopTasks);

    // // Add minutePointer property to shopTasks
    // shopTasks.forEach((shopTask) => {shopTask.minutePointer = 0});

    // Add task pointers incrementally to jobsCopy
    jobsCopy.forEach((jobCopy) => {
        jobCopy.sequences.forEach((sequence) => {
            if (!sequence.tasks) return;
            sequence.minutePointer = 0;
            sequence.tasks.forEach((jobTask) => {
                if (jobTask.completed) return;
                jobTask.minuteStartPointer = sequence.minutePointer;
                const totalTaskMinutes = Number(jobTask.scaledMinutes);
                jobTask.minuteEndPointer = totalTaskMinutes + jobTask.minuteStartPointer;
                sequence.minutePointer += totalTaskMinutes;
                // console.log(jobCopy.name, jobTask.name, jobTask.minuteStartPointer, jobTask.minuteEndPointer, jobTask.scaledMinutes);
            });
        });
    });

    const jobTasksArray = [];
    jobsCopy.forEach((jobCopy) => {
        jobCopy.sequences.forEach((sequence, sequenceIndex) => {
            if (!sequence.tasks) return;
            sequence.tasks.forEach((jobTask, taskIndex) => {
                if (jobTask.completed) return;
                // console.log(jobTask);
                jobTasksArray.push({jobName: String(jobCopy.name),
                                    jobID: jobCopy.id,
                                    taskID: jobTask.id,
                                    taskName: jobTask.name,
                                    start: Number(jobTask.minuteStartPointer),
                                    end: Number(jobTask.minuteEndPointer),
                                    sequenceIndex: Number(sequenceIndex),
                                    taskIndex: Number(taskIndex),
                                    timeInMinutes: jobTask.scaledMinutes
                                    });
            });
        });
    });
    // console.log(jobTasksArray);

    for (let taskIndex = 1; taskIndex < jobTasksArray.length; taskIndex++) {
        const currentJobTask = jobTasksArray[taskIndex];
        let lookBackIndex = taskIndex - 1;
        while (lookBackIndex != -1) {
            const previousJobTask = jobTasksArray[lookBackIndex];
            // if (currentJobTask.jobID == previousJobTask.jobID) console.log(currentJobTask.jobName);
            if (currentJobTask.taskID == previousJobTask.taskID) {
                // console.log(currentJobTask.jobName, currentJobTask.taskName);
                if (currentJobTask.start < previousJobTask.end) {
                    currentJobTask.start = previousJobTask.end;
                    currentJobTask.end = currentJobTask.start + currentJobTask.timeInMinutes;
                }
            }
            // console.log(previousJobTask);
            lookBackIndex--;
        }
    }

    // console.log(jobTasksArray);
    // return

    let currentJobID = jobTasksArray[0].jobID;
    let jobIndex = 0;
    const jobNameDaysFromNowArray = [{}];
    jobNameDaysFromNowArray[jobIndex].daysFromNowStart = 0;
    // const jobNameDaysFromNowArray = [{id: currentJobID, daysFromNow: jobTasksArray[0].end / (8 * 60)}];
    jobTasksArray.forEach((jobTask, index) => {
        if (currentJobID != jobTask.jobID) {
            jobNameDaysFromNowArray[jobIndex].daysFromNowStart = Math.floor(Math.max((jobTask.start / (8 * 60)), 0));
            jobIndex++;
        }
        // console.log(jobTask.jobName, jobTask.start / (8 * 60), jobTask.end / (8 * 60));
        jobNameDaysFromNowArray[jobIndex] = {};
        jobNameDaysFromNowArray[jobIndex].id = currentJobID;
        jobNameDaysFromNowArray[jobIndex].daysFromNowEnd = jobTask.end / (8 * 60);
        jobNameDaysFromNowArray[jobIndex].name = jobTask.jobName;
        if (index == jobTasksArray.length - 1) {
            jobNameDaysFromNowArray[jobIndex].daysFromNowStart = Math.ceil(Math.max((jobTask.start / (8 * 60)), 0));
        }
        // console.log(jobTask.jobName, jobNameDaysFromNowArray[jobIndex].daysFromNowStart, jobTask.end / (8 * 60), index);
        jobNameDaysFromNowArray[jobIndex].taskLength = jobTask.end;
        currentJobID = jobTask.jobID;
    });
    // console.log(jobNameDaysFromNowArray);
    
    jobNameDaysFromNowArray.forEach((jobTask) => {
        const startDate = getToday();
        incWorkDay(startDate, jobTask.daysFromNowStart);
        jobTask.startDate = startDate.toLocaleDateString('en-CA');
        const endDate = getToday();
        incWorkDay(endDate, jobTask.daysFromNowEnd);
        jobTask.shipDate = endDate.toLocaleDateString('en-CA');
        // console.log(jobTask.startDate, jobTask.daysFromNowStart, jobTask.daysFromNowEnd, jobTask.name);
    });
    
    // console.log(jobNameDaysFromNowArray);

    jobNameDaysFromNowArray.forEach((jobDates) => {
        jobs.forEach((job) => {
            if (jobDates.id == job.id) {
                job.estimatedDate = jobDates.shipDate;
                job.startDate = jobDates.startDate;
            }
        });
    });

    jobTasksArray.forEach((jobTask) => {
        jobs.forEach((job) => {
            if (jobTask.jobID == job.id) {
                job.sequences[jobTask.sequenceIndex].tasks[jobTask.taskIndex].start = jobTask.start;
                job.sequences[jobTask.sequenceIndex].tasks[jobTask.taskIndex].end = jobTask.end;
            }
        });
    });

    // Add tomorrow to completed jobs
    jobs.forEach((job) => {
        if (isCompleted(job)) {
            job.estimatedDate = getTomorrow().toLocaleDateString('en-CA');
            job.startDate = getTomorrow().toLocaleDateString('en-CA');
        }
    });
    console.log(jobs);
    return
}

function AddedScaledMinutesToJobTasks(jobs, shopTasks) {
    jobs.forEach((job) => {
        if (!job.sequences) return;
        job.sequences.forEach((sequence) => {
            if (!sequence.tasks) return;
            sequence.tasks.forEach((jobTask) => {
                shopTasks.forEach((shopTask) => {
                    if (jobTask.id == shopTask.id) {
                        const shiftLength = 8;
                        const totalAvailableDailyMinutes = Number(shopTask.totalMinutes);
                        const minutesScale = totalAvailableDailyMinutes / (shiftLength * 60);
                        jobTask.totalMinutes = (jobTask.hours * 60) + jobTask.minutes;
                        jobTask.scaledMinutes = (jobTask.totalMinutes / minutesScale) || 0;
                        // console.log(jobTask.totalMinutes);
                        // console.log(jobTask.scaledMinutes, totalAvailableDailyMinutes, scaledAvailableDailyMinutes);
                    }
                });
            });
        });
    });
}

function getShopTaskByID(taskID, tasks) {
    for (const task of tasks) {
        if (task.id == taskID) return task;
    }
}

/**
* No active jobs, no jobs without sequences and no completed jobs
*/
function cleanupAndCopyJobs(jobs) {
    const jobsCopy = [];
    jobs.forEach((job) => {
        if (!job.active) return;
        if (!job.sequences) return;
        if (isCompleted(job)) return;
        jobsCopy.push(JSON.parse(JSON.stringify(job)));
    });
    return jobsCopy;
}

function sortByCompleted(jobs) {
    jobs.sort((a) => {
        if (isCompleted(a)) return 1;
        if (!isCompleted(a)) return -1;
        return 0;
    });
}
        
function sortDown(array, property) {
    array.sort((a, b) => {
        const nameA = a[property];
        const nameB = b[property];
        if (nameA < nameB) return 1;
        if (nameA > nameB) return -1;
        return 0;
    });
}
        
function sortUp(array, property) {
    array.sort((a, b) => {
        const nameA = a[property];
        const nameB = b[property];
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });
}

function isCompleted(job) {
    if (!job.sequences) return true;
    if (!job.sequences[0].tasks) return true;
    let completed = true;
    job.sequences.forEach((sequence) => {
        if (!sequence.tasks) return;
        sequence.tasks.forEach((jobTask) => {
            if (!jobTask.completed) completed = false;
        });
    });
    return completed;
}

function getToday() {
    const utcDate = new Date();
    return new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
}

function getTomorrow() {
    const today = getToday();
    incWorkDay(today, 1);
    return today
}

/**
* eg. November 21/2022
*/
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
