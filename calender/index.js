
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
    getUserInfo,
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
    CALENDAR_TABLE,
    TABLE_ATTRIBUTES,
    SYSTEM_SCHEMA,
    MESSAGES_TABLE,
} from "../directives.js";

import {
    Timer,
    stopRunningTimer,
    startOverTimeTimer,
    addNumberOfRunningTimersToTimerPageLink,
} from "../timer-utilities.js";

import {
    getDueInDaysFromNowText,
    getCorrectDate,
    getCorrectDateOrder,
    isToday,
    getToday,
    formatDateToCA,
} from "../date-utilities.js";

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
    showLoadingDialog,
    showInputDialog,
    showJobDialog,
    showJobCardDialog,
    showCalendarEventDialog,
    dialogIsOpen,
} from "../dialogs.js";

const log = console.log;
let tIndex = 0;

const settings = {
    url: getLocalStorageValue('serverURL') || "",
    authorization: getLocalStorageValue('serverAuthorization') || "",
}

const searchArrays = {
    date: [],
    jobs: [],
    events: [],
    months: [],
};

const bodyElement = document.querySelector('body');

const timerPageLink = document.querySelector('.timer-page-link');

const addNewJobBtn = document.querySelector('#add-job-btn');
const addNewEventBtn = document.querySelector('#add-event-btn');
const todayBtn = document.querySelector('#today-button');

const calenderContainer = document.querySelector('#calender');

const searchInput = document.querySelector('#search-input');
const searchClearButton = document.querySelector('#search-clear-btn');
const searchButton = document.querySelector('#search-btn');

const stationName = getLocalStorageValue('stationName') || "";

const theme = getLocalStorageValue('theme') || "light";
document.documentElement.setAttribute('data-color-theme', theme);

let superUser = false;
let canEditJob = false;
let canEditCalendar = false;



// INITIALIZE CODE //

buildCalender();

showLoadingDialog(async () => {
    [superUser, canEditJob, canEditCalendar] = await getPermissions();
    console.log(superUser, canEditJob, canEditCalendar);

    // Show hidden admin elements
    if (superUser) {
        const superUserElements = document.querySelectorAll('.super-user');
        superUserElements.forEach((element) => {
            element.classList.remove('super-user');
        });
    }

    if (canEditJob) addNewJobBtn.style.display = 'block';
    if (canEditCalendar) addNewEventBtn.style.display = 'block';

    addJobsToCalendar();
    addEventsToCalendar();

    jumpToDate(formatDateToCA(new Date()));
});

// let stationID = await getStationID();

startOverTimeTimer(stationName, settings, stopRunningTimer);

addNumberOfRunningTimersToTimerPageLink(timerPageLink, stationName, settings);


const autoUpdateTimer = new Timer(
    () => {
        if (dialogIsOpen()) return;
        showLoadingDialog(async() => {
            // loadCalendar();
            await addJobsToCalendar();
            await addEventsToCalendar();
        });
    },
    1000 * 60 * 1,
    true
);



// EVENT LISTENERS //

// No right click menu
document.querySelector('#calender').addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

// Search
// Enter key (search input)
searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        search(searchInput.value);
    }
});
// Escape key (search input)
searchInput.addEventListener('keyup', (event) => {
    if (event.key === 'Escape') {
        searchInput.value = "";
    }
});
// Clear search button (search input) 
searchClearButton.addEventListener('click', () => {searchInput.value = "";});
// Search button (search input)
searchButton.addEventListener('click', () => {search(searchInput.value);});
//
function search(searchText) {
    const inputText = String(searchText).toLowerCase().trim();

    if (inputText === "") return;
    
    let searchFound = false;

    const searchCollection = [
        ...searchArrays.days,
        ...searchArrays.jobs,
        ...searchArrays.events,
        ...searchArrays.months,
    ];

    for (const element of searchCollection) {
        const name = String(element.name).toLowerCase().trim();
        const date = String(element.date).toLowerCase().trim();

        if (inputText.includes(" ")) {
            const inputTextA = inputText.split(" ")[0];
            const inputTextB = inputText.split(" ")[1];
            if ((name.includes(inputTextA)) && (name.split(" ")[1] === inputTextB)) {
                jumpToDate(date);
                searchFound = true;
                break;
            }
        }
        else {
            if (name.includes(inputText)) {
                jumpToDate(date);
                searchFound = true;
                break;
            }
        }
    }

    if (!searchFound) {
        searchNotFound();
        function searchNotFound() {
            searchInput.style.color = "var(--no)";
            setTimeout(() => {
                searchInput.style.color = "var(--yes)";
            }, 500);
        }
    }
}


window.onkeydown = (event) => {
    // Go to home page ./
    if (event.key === "8" && event.ctrlKey) window.location = "/";

    // Jump to search
    if (event.key === "f" && event.ctrlKey) {
        event.preventDefault();
        searchInput.value = "";
        searchInput.focus();
    }
}

// Jump to today
todayBtn.addEventListener('click', () => {
    jumpToDate(formatDateToCA(new Date()));
});


// New Job Button
addNewJobBtn.addEventListener('click', async () => {
    const jobsResponse = await getJobs();
    const tasksResponse = await getTasks();

    showJobDialog(null, jobsResponse, tasksResponse, 
        async (newJob) => {
            showLoadingDialog(async() => {
                await insertDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, newJob, settings);
                loadCalendar();
                jumpToDate(newJob.shipDate);
            });
        },
        async (oldJob) => {
            // loadCalendar();
        }
    );
});

addNewEventBtn.addEventListener('click', async () => {
    showCalendarEventDialog(null, async (calendarEvent) => {
        showLoadingDialog(async() => {
            await insertDBEntry(BUSINESS_SCHEMA, CALENDAR_TABLE, calendarEvent, settings);
            loadCalendar();
            jumpToDate(calendarEvent.date);
        });
    });
});




// FUNCTIONS

function loadCalendar() {
    buildCalender();
    addJobsToCalendar();
    addEventsToCalendar();
}

function buildCalender() {
    searchArrays.days = [];
    searchArrays.months = [];

    let dateIndex = getToday();
    dateIndex.setMonth(dateIndex.getMonth() - 6);
    while (dateIndex.toLocaleString('default', {weekday: 'short'}) !== "Sun") {
        dateIndex.setDate(dateIndex.getDate() - 1);
    }
    
    const lastDate = getToday();
    while (lastDate.toLocaleString('default', {weekday: 'short'}) !== "Sat") {
        lastDate.setDate(lastDate.getDate() + 1);
    }
    lastDate.setDate(lastDate.getDate() + (30 * 7));

    const todayString = formatDateToCA(getToday());
    const lastDateString = formatDateToCA(lastDate);

    const weeks = [];

    let endCalender = false;
    while (!endCalender) {
        const weekContainer = document.createElement('div');
        weekContainer.classList.add('week');
    
        // Loop through days of the week
        for (let dayOfTheWeekIndex = 0; dayOfTheWeekIndex < 7; dayOfTheWeekIndex++) {
            const calendarDate = formatDateToCA(dateIndex);
            const dayOfTheMonth = dateIndex.getDate();

            // Add days to search array
            searchArrays.days.push({name: calendarDate, date: calendarDate});

            const dayContainer = document.createElement('div');
            if (dateIndex == getToday()) dayContainer.id = "today";
            dayContainer.setAttribute('data-date', calendarDate);
            dayContainer.classList.add(`date-${calendarDate}`);
            dayContainer.classList.add('day');

            const dayHeader = document.createElement('div');
            dayHeader.classList.add('day-header-container');
            dayHeader.setAttribute('data-after', dayOfTheMonth);
    
            // Day name
            if (dayOfTheMonth == 1) {
                const monthText = dateIndex.toLocaleString('default', {month: 'long'});
                dayHeader.setAttribute('data-before', monthText);
                dayHeader.classList.add('day-highlight-before');

                // Add months to search array
                searchArrays.months.push({name: monthText, date: calendarDate});
            }
            else {
                dayHeader.setAttribute('data-before', dateIndex.toLocaleString('default', {weekday: 'short'}));
            }
    
            // Day number
            if (calendarDate == todayString) {
                dayHeader.classList.add('day-highlight-after', 'day-underline-after');
            }

            // Events/Jobs container
            const eventContainer = document.createElement('div');
            eventContainer.classList.add('day-events-container');

            // dayContainer.appendChild(dayHeader);
            dayContainer.append(dayHeader, eventContainer);
            weekContainer.appendChild(dayContainer);

            // Increment day
            dateIndex.setDate(dateIndex.getDate() + 1);

            // Exit loop test
            if (formatDateToCA(dateIndex) == lastDateString) endCalender = true;
        }
        weeks.push(weekContainer);
    }

    calenderContainer.innerHTML = "";
    calenderContainer.append(...weeks);

    calenderContainer.ondragover = (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    };
    calenderContainer.ondrop = async (event) => {
        event.preventDefault();
        const data = JSON.parse(event.dataTransfer.getData("text"));

        // Find date of day container
        const droppedElement = document.querySelector(`[data-id="${data.id}"]`);
        if (!droppedElement) return;
        let dayContainer = event.target;
        if (!dayContainer.classList.contains('day')) dayContainer = event.target.parentElement.parentElement;
        if (!dayContainer.classList.contains('day')) return;
        dayContainer.querySelector('.day-events-container').appendChild(droppedElement);

        const dropDate = dayContainer.getAttribute('data-date');

        // Job
        if (data.isJob && canEditJob) {
            await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: data.id, shipDate: dropDate}, settings);
        }
        // Calendar event
        else if (canEditCalendar) {
            if (data.startDate === data.endDate) {
                await updateDBEntry(BUSINESS_SCHEMA, CALENDAR_TABLE, {id: data.id, date: dropDate}, settings);
            }
            else {
                let startDate = data.startDate;
                let endDate = data.endDate;

                if (dropDate == startDate) {
                    if (dropDate.replaceAll("-", "") > endDate.replaceAll("-", "")) {
                        startDate = endDate;
                        endDate = dropDate;
                    }
                    else {
                        startDate = dropDate;
                    }
                }
                else {
                    if (dropDate.replaceAll("-", "") > endDate.replaceAll("-", "")) {
                        endDate = dropDate;
                    }
                    if (dropDate.replaceAll("-", "") < startDate.replaceAll("-", "")) {
                        endDate = startDate;
                        startDate = dropDate;
                    }
                    else {
                        endDate = dropDate;
                    }
                }

                await updateDBEntry(BUSINESS_SCHEMA, CALENDAR_TABLE, {
                    id: data.id,
                    date: startDate,
                    endDate: endDate}, settings);
            }
        }
    }
}

// Add Jobs to Calendar
async function addJobsToCalendar() {
    let jobs = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "id", "*", settings);
    if ((!jobs) || (jobs.error) || jobs.length === 0) {
        jobs = [];
    }

    // Add jobs to search array
    searchArrays.jobs = [];
    jobs.forEach((job) => {
        searchArrays.jobs.push({name: job.name, date: job.shipDate});
    });

    // Loop through jobs
    jobs.forEach((job) => {
        const eventContainer = document.querySelector(`.date-${job.shipDate} .day-events-container`);
        if (!eventContainer) return;

        const jobElement = document.createElement('p');

        if (!job.active) jobElement.style.color = "var(--inactive)";

        jobElement.setAttribute('data-id', job.id);
        jobElement.classList.add(job.id);

        if (canEditJob) {
            // Dragging
            jobElement.setAttribute('draggable', 'true');
            jobElement.addEventListener('dragover', (event) => {
                event.dataTransfer.dropEffect = "move";
                event.preventDefault()
            });
            jobElement.addEventListener('dragstart', (event) => {
                event.dataTransfer.setData("text", JSON.stringify({id: job.id, isJob: true}));
                event.dataTransfer.effectAllowed = "move";
                event.target.style.cursor = 'grabbing';
            });
            jobElement.addEventListener('dragend', (event) => {event.target.style.cursor = 'pointer'});

            // Click
            jobElement.onclick = async (event) => {
                showWaitingCursor(bodyElement, jobElement);
                
                const jobsResponse = await getJobs();
                const tasksResponse = await getTasks();
                const stationID = await getStationID();
                const whoIsEditingJob = await checkOutItemForEditing(job.id, stationName, stationID);
                
                stopWaitingCursor(bodyElement, jobElement);

                showJobDialog(job, jobsResponse, tasksResponse,
                    // OK click
                    async (newJob) => {
                        showLoadingDialog(async() => {
                            await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, newJob, settings);
                            await updateDBEntry(BUSINESS_SCHEMA, STATIONS_TABLE, {id: stationID, editing: ""}, settings);
                            // addJobsToCalendar();
                            loadCalendar();
                            jumpToDate(newJob.shipDate);
                        });
                    },
                    // Cancel click
                    async (originalJob) => {
                        if (whoIsEditingJob == stationName) {
                            await updateDBEntry(BUSINESS_SCHEMA, STATIONS_TABLE, {id: stationID, editing: ""}, settings);
                        }
                    },
                    (whoIsEditingJob == stationName) ? "" : whoIsEditingJob
                );
            }

        }
        else {
            jobElement.style.cursor = 'pointer';
            jobElement.onclick = async () => {
                showJobCardDialog(job, async (newJob) => {
                    await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, newJob, settings);
                });
            };
        }

        const percentCompleted = getJobTimes(job).percentCompleted;
        const jobProgressBar = document.createElement('div');
        jobProgressBar.style.width = `${percentCompleted}%`;
        jobProgressBar.classList.add('progress-bar');
        if (!job.active) jobProgressBar.style.borderColor = "var(--inactive)";

        jobElement.setAttribute('title', job.note || "");
        jobElement.classList.add('day-event');
        jobElement.textContent = job.name;

        jobElement.appendChild(jobProgressBar);

        // Try to remove exciting job just in case
        removeAllElementsWithClassName(job.id);

        eventContainer.appendChild(jobElement);
    });
}

// Add Events to Calendar
async function addEventsToCalendar() {
    let calendarResponse = await getDBEntrees(BUSINESS_SCHEMA, CALENDAR_TABLE, "id", "*", settings);
    if ((!calendarResponse) || (calendarResponse.error) || calendarResponse.length === 0) {
        calendarResponse = [];
    };

    // Add calendar event to search array
    searchArrays.events = [];
    calendarResponse.forEach((calendarEvent) => {
        searchArrays.events.push({name: calendarEvent.name, date: calendarEvent.date});
    });

    // Add end date if is missing
    calendarResponse.forEach((calendarEvent) => {
        if (calendarEvent.endDate == "") calendarEvent.endDate = calendarEvent.date; 
    });

    // Correct date order
    calendarResponse.forEach((calendarEvent) => {
        if (calendarEvent.date > calendarEvent.endDate) {
            const tmp = calendarEvent.date;
            calendarEvent.date = calendarEvent.endDate;
            calendarEvent.endDate = tmp;
        }
    });

    // Build dates array
    calendarResponse.forEach((calendarEvent) => {
        if (calendarEvent.date == calendarEvent.endDate) {
            calendarEvent.dates = [calendarEvent.date];
        }
        else if (calendarEvent.date != calendarEvent.endDate) {
            let loopCount = 0;
            const dateIndex = getCorrectDate(calendarEvent.date);
            calendarEvent.dates = [];
            while (formatDateToCA(dateIndex) <= calendarEvent.endDate) {
                calendarEvent.dates.push(formatDateToCA(dateIndex));
                dateIndex.setDate(dateIndex.getDate() + 1);

                if (loopCount++ > 100) break;
            }
        }
    });

    // calendarResponse.forEach((calendarEvent) => {
    //     calendarEvent.dates.forEach((date) => {
    //         console.log(date);
    //     });
    // });

    // const eventContainer = document.createElement('div');
    // eventContainer.classList.add('events-container');

    calendarResponse.forEach((calenderEvent) => {
        if (!document.querySelector(`.date-${calenderEvent.date} .day-events-container`)) return;

        const endDate = calenderEvent.endDate || calenderEvent.date;
        const isMultiDayEvent = calenderEvent.dates.length > 1;


        const eventTitle = document.createElement('p');

        eventTitle.setAttribute('data-id', calenderEvent.id);
        eventTitle.classList.add(calenderEvent.id);

        // eventTitle.style.width = "100%";
        eventTitle.classList.add('day-event');
        eventTitle.setAttribute('title', calenderEvent.note || "");

        // Dragging
        eventTitle.setAttribute('draggable', 'true');
        eventTitle.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData("text", JSON.stringify({
                id: calenderEvent.id,
                isJob: false,
                startDate: calenderEvent.date,
                endDate: calenderEvent.endDate,
            }));
            event.dataTransfer.effectAllowed = "move";
            event.target.style.cursor = 'grabbing';
        });
        eventTitle.addEventListener('dragover', (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
        });
        eventTitle.textContent = calenderEvent.name;
        eventTitle.style.color = "black";
        if (isMultiDayEvent) eventTitle.style.width = "100%";
        eventTitle.style.backgroundColor = `var(--color-${calenderEvent.color || 1})`;

        // if (canEditCalendar) {
            eventTitle.style.cursor = 'pointer';
            eventTitle.onclick = async () => {
                showCalendarEventDialog(calenderEvent, 
                    async (newEvent) => {
                        showLoadingDialog(async() => {
                            await updateDBEntry(BUSINESS_SCHEMA, CALENDAR_TABLE, newEvent, settings);
                            loadCalendar();
                            jumpToDate(newEvent.date);
                        });
                    },
                    async (oldJob) => {
                        // await buildCalender();
                    }
                );
            };
            eventTitle.addEventListener('contextmenu', async (event) => {
                event.preventDefault();
                showYesNoDialog(`Delete "${calenderEvent.name}"?`, async () => {
                    showLoadingDialog(async() => {
                        await deleteDBEntry(BUSINESS_SCHEMA, CALENDAR_TABLE, calenderEvent.id, settings);
                        loadCalendar();
                    });
                });
            });
        // }


        removeAllElementsWithClassName(calenderEvent.id);

        // Add Events to Calendar 
        // calenderEvent.dates.forEach((date) => {
        //     const clone = eventTitle.cloneNode(true);
        //     const eventContainer = document.querySelector(`.date-${date} .day-events-container`);
        //     if (!eventContainer) return;
        //     eventContainer.appendChild(clone);
        // });
        
        const eventContainer = document.querySelector(`.date-${calenderEvent.date} .day-events-container`);
        if (!eventContainer) return;
        eventContainer.appendChild(eventTitle);

    });
}

// calenderContainer.onmouseover = (event) => {
//     if ((draggingJobID) && (event.target.classList.contains('day'))) {
//         event.target.classList.add('drag-over');
//         event.target.onmouseleave = () => {
//             event.target.classList.remove('drag-over');
//         }
//         // console.log(event.target.classList[0].replaceAll('date-', ''));
//     }
// }

// calenderContainer.onmouseleave = (event) => {
//     if (event.target.classList.contains('day')) {
//         console.log(event.target.classList[0].replaceAll('date-', ''));
//     }
// }

function getJobTimes(job) {
    // Calculate shop hours
    let times = {};
    times.totalHours = 0;
    times.totalMinutes = 0;
    times.totalTimeDec = 0;
    times.totalCompletedTimeDec = 0;
    times.totalTimeRemainingDec = 0;
    times.percentCompleted = "0";
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
    else {
        return times;
    }
    times.totalHours = Number(times.totalHours + Math.floor(times.totalMinutes / 60));
    times.totalMinutes = Number((((times.totalMinutes / 60) % 1) * 60).toFixed(0));
    times.totalTimeDec = times.totalHours + (times.totalMinutes / 60);
    times.totalCompletedTimeDec = times.completedHours + (times.completedMinutes / 60);
    times.totalTimeRemainingDec = times.totalTimeDec - times.totalCompletedTimeDec;
    times.percentCompleted = ((times.totalCompletedTimeDec / (times.totalTimeDec || 0)) * 100).toFixed(0);

    const totalTimeInMinutes = ((times.totalHours * 60) + times.totalMinutes);
    const totalCompletedTimeInMinutes = ((times.completedHours * 60) + times.completedMinutes);
    times.totalTimeRemainingInMinutes = totalTimeInMinutes - totalCompletedTimeInMinutes;
    return times;
}

async function getJobs(column, filter) {
    return await getDBTable(BUSINESS_SCHEMA, JOBS_TABLE, column, filter);
}

async function getTasks(column, filter) {
    return await getDBTable(BUSINESS_SCHEMA, TASKS_TABLE, column, filter);
}

async function getDBTable(schema, table, column, filter) {
    const response = await getDBEntrees(schema, table, column || "id", filter || "*", settings);
    if ((!response) || (response.error) || (response.length === 0)) return [];
    return response;
}

function getWhoIsEditing(currentEditingResponse) {
    if ((!currentEditingResponse) || (currentEditingResponse.error) || (currentEditingResponse.length === 0)) {
        return "";
    }
    return currentEditingResponse[0].name;
}

function getAllDatesInArray(startDate, endDate) {
    const dateCounterIndex = getCorrectDate(startDate);
    const endDateText = formatDateToCA(endDate);
    const datesArray = [];
    let currentDateText = formatDateToCA(startDate)
    while (endDateText !== currentDateText) {
        currentDateText = formatDateToCA(dateCounterIndex);
        datesArray.push(currentDateText);
        dateCounterIndex.setDate(dateCounterIndex.getDate() + 1);
    }
    return datesArray;
}

function getDates(jobs, events) {
    if (!events) events = [];

    const earliestDate = jobs[jobs.length - 1].shipDate || formatDateToCA(getToday());
    const latestDate = jobs[0].shipDate || formatDateToCA(getToday());

    const firstSunday = getCorrectDate(earliestDate);

    while (firstSunday.toLocaleString('default', {weekday: 'short'}) !== "Sun") {
        firstSunday.setDate(firstSunday.getDate() - 1);
    }

    const lastSaturday = getCorrectDate(latestDate);

    while (lastSaturday.toLocaleString('default', {weekday: 'short'}) !== "Sat") {
        lastSaturday.setDate(lastSaturday.getDate() + 1);
    }

    const today = new Date();

    return {earliestDate, latestDate, firstSunday, lastSaturday, today}
}

function jumpToDate(date) {
    let dateElement = document.querySelector(`.date-${date}`);

    if (date === "today") {
        dateElement = document.querySelector('#today');
    }

    if (dateElement === null) return;

    dateElement.scrollIntoView();
    // dateElement.style.backgroundColor = "var(--yes)";
    dateElement.classList.add('yes-background');
    setTimeout(() => {
        dateElement.classList.remove('yes-background');
        // dateElement.style.backgroundColor = "var(--background_color)";
    }, 1000);
};

async function getPermissions() {
    const userInfo = await getUserInfo(settings);
    // console.log(userInfo);

    const isSuperUser = (userInfo.role.role === 'super_user') || userInfo.role.permission.super_user || false;
    
    if (isSuperUser) {
        return [true, true, true];
    }
    else {
        const job = getPermissionsOfTable(userInfo, BUSINESS_SCHEMA, JOBS_TABLE);
        const calendar = getPermissionsOfTable(userInfo, BUSINESS_SCHEMA, CALENDAR_TABLE);
        return [false, job.hasAllPermissions, calendar.hasAllPermissions];
    }

    function getPermissionsOfTable(userInfo, schema, table) {
        const permissions = userInfo.role.permission[schema].tables[table];
        permissions.hasAllPermissions = (permissions.read && permissions.insert && permissions.delete && permissions.update);
        return permissions
    }
}


async function checkOutItemForEditing(itemID, stationName, stationID) {
    const currentEditingResponse = await getDBEntrees(BUSINESS_SCHEMA, STATIONS_TABLE, "editing", itemID, settings);
    if ((!currentEditingResponse) || (currentEditingResponse.error) || (currentEditingResponse.length === 0)) {
        await updateDBEntry(BUSINESS_SCHEMA, STATIONS_TABLE, {id: stationID, editing: itemID}, settings);

        // const stationIDResponse = await getDBEntrees(BUSINESS_SCHEMA, STATIONS_TABLE, "id", stationID, settings);

        return String(stationName);
    }
    return String(currentEditingResponse[0].name);
}

async function getStationID() {
    const stationIDResponse = await getDBEntrees(BUSINESS_SCHEMA, STATIONS_TABLE, "name", stationName, settings);
    if ((!stationIDResponse) || (stationIDResponse.error) || stationIDResponse.length === 0) {
        return "";
    }
    else {
        return stationIDResponse[0].id;
    }
}

function getLocalStorageValue(key) {
    if (window.localStorage[key])
        return JSON.parse(window.localStorage.getItem(key));
}

function removeAllElementsWithClassName(className) {
    const elements = document.getElementsByClassName(className);
    while (elements.length > 0) {
      elements[0].parentNode.removeChild(elements[0]);
    }
}

function showWaitingCursor() {
    for (const element of arguments) element.style.cursor = "wait";
}

function stopWaitingCursor() {
    for (const element of arguments) element.style.cursor = "default";
}