
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
    showInputDialog,
    showJobDialog,
    showJobCardDialog,
    showCalendarEventDialog,
    dialogIsOpen,
} from "../dialogs.js";

const log = console.log;
let tIndex = 0;

const daysOfTheWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const settings = {
    url: "",
    authorization: ""
}

let nameDateSearchArray = [];

let draggingJobID = "";
let draggingCalendarEvent = {id: "", startDate: "", endDate: "", isStartDate: true};

const timerPageLink = document.querySelector('.timer-page-link');

const addNewJobBtn = document.querySelector('#add-job-btn');
const addNewEventBtn = document.querySelector('#add-event-btn');
const todayBtn = document.querySelector('#today-button');

const calenderContainer = document.querySelector('#calender');

const searchInput = document.querySelector('#search-input');
const searchClearButton = document.querySelector('#search-clear-btn');
const searchButton = document.querySelector('#search-btn');



settings.url = getLocalStorageValue('serverURL') || "";
settings.authorization = getLocalStorageValue('serverAuthorization') || "";
const stationName = getLocalStorageValue('stationName') || "";
let stationID = "";
const stationIDResponse = await getDBEntrees(BUSINESS_SCHEMA, STATIONS_TABLE, "name", stationName, settings);
if ((!stationIDResponse) || (stationIDResponse.error) || stationIDResponse.length === 0) {
    stationID = "";
}
else {
    stationID = stationIDResponse[0].id;
};

const theme = getLocalStorageValue('theme') || "light";

const superUser = await isSuperUser(settings);
const canEditCalendar = await canEditCalendarEvent();
const canEditJob = await canEditJobs();

console.log('Is super user: ' + superUser);
console.log('Can edit calendar events: ' + canEditCalendar);
console.log('Can edit jobs: ' + canEditJob);

// INITIALIZE CODE


if (superUser) {
    const superUserElements = document.querySelectorAll('.super-user');
    superUserElements.forEach((element) => {
        element.classList.remove('super-user');
    });
}

if (canEditCalendar) addNewEventBtn.style.display = "block";
if (canEditJob) addNewJobBtn.style.display = "block";


document.documentElement.setAttribute('data-color-theme', theme);

document.querySelector('#calender').addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

await buildCalender();
search("today");

startOverTimeTimer(stationName, settings, stopRunningTimer);

addNumberOfRunningTimersToTimerPageLink(timerPageLink, stationName, settings);


const autoUpdateTimer = new Timer(
    () => {
        if (dialogIsOpen()) return;
        buildCalender();
    },
    1000 * 60 * 1,
    true
);

// Clear editing
if (canEditJob) {
    await updateDBEntry(BUSINESS_SCHEMA, STATIONS_TABLE, {id: stationID, editing: ""}, settings);
}


// EVENT LISTENERS

// Search
// Enter key
searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        search(searchInput.value);
    }
});
// Escape key
searchInput.addEventListener('keyup', (event) => {
    if (event.key === 'Escape') {
        searchInput.value = "";
    }
});
// Clear search button 
searchClearButton.addEventListener('click', () => {searchInput.value = "";});
// Search button
searchButton.addEventListener('click', () => {search(searchInput.value);});

function search(searchText) {
    const inputText = String(searchText).toLowerCase().trim();

    if (inputText === "") return;
    
    let searchFound = false;

    // nameDateSearchArray is updated every time buildCalender is run.
    for (const element of nameDateSearchArray) {
        const name = String(element.name).toLowerCase().trim();
        const date = String(element.date).toLowerCase().trim();

        if (inputText.includes(" ")) {
            const inputTextA = inputText.split(" ")[0];
            const inputTextB = inputText.split(" ")[1];
            if ((name.includes(inputTextA)) && (name.split(" ")[1] === inputTextB)) {
                // jumpToDate(date);
                searchFound = true;
                break;
            }
        }
        else {
            if (name.includes(inputText)) {
                // jumpToDate(date);
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

// Got to home page
window.onkeydown = (event) => {
    if (event.key === "8" && event.ctrlKey) window.location = "/";
}

// Jump to today
todayBtn.addEventListener('click', () => {
    jumpToDate(formatDateToCA(new Date()));
});


// New Job Button
addNewJobBtn.addEventListener('click', async () => {
    const jobsResponse = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "id", "*", settings);
    if ((!jobsResponse) || (jobsResponse.error)) return;

    const tasksResponse = await getDBEntrees(BUSINESS_SCHEMA, TASKS_TABLE, "id", "*", settings);
    if ((!tasksResponse) || (tasksResponse.error)) return;

    showJobDialog(null, jobsResponse, tasksResponse, 
        async (newJob) => {
            await insertDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, newJob, settings);
            await buildCalender();
            jumpToDate(newJob.shipDate);
        },
        async (oldJob) => {
            // await buildCalender();
        }
    );
});

addNewEventBtn.addEventListener('click', async () => {
    showCalendarEventDialog(null, async (calendarEvent) => {
        await insertDBEntry(BUSINESS_SCHEMA, CALENDAR_TABLE, calendarEvent, settings);
        buildCalender();
    });
});




// FUNCTIONS
async function buildCalender(scrollTo) {
    const jobs = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "id", "*", settings);
    if ((!jobs) || (jobs.error) || jobs.length === 0) {
        jobs = [];
    };

    // Reset nameDateSearchArray and add today
    nameDateSearchArray = [{name: "today", date: formatDateToCA(getToday())}];
    // Add jobs to search array
    jobs.forEach((job) => {
        nameDateSearchArray.push({name: job.name, date: job.shipDate});
    });


    const calendarResponse = await getDBEntrees(BUSINESS_SCHEMA, CALENDAR_TABLE, "id", "*", settings);
    if ((!calendarResponse) || (calendarResponse.error) || calendarResponse.length === 0) {
        calendarResponse = [];
    };

    // Sort events date
    calendarResponse.sort((a, b) => {
        const nameA = a.date;
        const nameB = b.date;
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });

    // Add calendar event to search array
    calendarResponse.forEach((calendarEvent) => {
        nameDateSearchArray.push({name: calendarEvent.name, date: calendarEvent.date});
    });

    // Sort calendar events by number of days
    calendarResponse.sort((a, b) => {
        // TODO: Check if dates are not null
        const aEventsLength = Number((a.endDate || a.date ).replaceAll("-", "")) - Number(a.date.replaceAll("-", ""));
        const bEventsLength = Number((b.endDate || b.date ).replaceAll("-", "")) - Number(b.date.replaceAll("-", ""));
        if (aEventsLength < bEventsLength) {
            return -1;
        }
        else if (aEventsLength > bEventsLength) {
            return 1;
        }
        else {
            return 0;
        }
    });

    // Sort by ship date
    jobs.sort((a, b) => {
        const nameA = a.shipDate;
        const nameB = b.shipDate;
        if (nameA < nameB) return 1;
        if (nameA > nameB) return -1;
        return 0;
    });

    // Correct any miss ordered dates (end date before start date)
    calendarResponse.forEach((calendarEvent) => {
        if (calendarEvent.date === calendarEvent.endDate) return;
        const correctedDate = getCorrectDateOrder(calendarEvent.date, calendarEvent.endDate);
        calendarEvent.date = correctedDate.start;
        calendarEvent.endDate = correctedDate.end;
    });

    const canEditJob = await canEditJobs();
    const canEditCalendar = await canEditCalendarEvent();
    
    const dates = getDates(jobs, calendarResponse);
    
    let dateIndex;
    if (formatDateToCA(dates.firstSunday) < formatDateToCA(getToday())) {
        dateIndex = new Date(dates.firstSunday);
    }
    else {
        // Find earliest Sunday
        dateIndex = new Date();
        while (dateIndex.toLocaleString('default', {weekday: 'short'}) !== "Sun") {
            dateIndex.setDate(dateIndex.getDate() - 1);
        }
    }
    dateIndex.setDate(dateIndex.getDate() - (15 * 7));  // weeks
    
    const lastDatePlusNDays = getCorrectDate(dates.lastSaturday);
    
    lastDatePlusNDays.setDate(lastDatePlusNDays.getDate() + (22 * 7));

    const allDatesInArray = getAllDatesInArray(dateIndex, lastDatePlusNDays);
    calendarResponse.forEach((calendarEvent) => {
        calendarEvent.dates = [];
        allDatesInArray.forEach((date) => {
            if ((date >= calendarEvent.date) && (date <= calendarEvent.endDate)) {
                calendarEvent.dates.push(date);
            }
        });
    });

    const weeks = [];

    let endCalender = false;
    while (!endCalender) {
        const weekContainer = document.createElement('div');
        weekContainer.classList.add('week');
    
        // Loop through days of the week
        for (let dayOfTheWeekIndex = 0; dayOfTheWeekIndex < 7; dayOfTheWeekIndex++) {
            const calendarDate = formatDateToCA(dateIndex);
            const dayContainer = document.createElement('div');
            if (dates.today.toDateString('en-CA') === dateIndex.toDateString('en-CA')) {
                dayContainer.id = "today";
            }
            dayContainer.classList.add(`date-${calendarDate}`);
            dayContainer.classList.add('day');
            dayContainer.addEventListener('dragenter', () => {dayContainer.classList.add('drag-over')});
            dayContainer.addEventListener('dragleave', () => {dayContainer.classList.remove('drag-over')});
            dayContainer.addEventListener('dragover', (event) => {event.preventDefault()});
            dayContainer.addEventListener('drop', async () => {
                dayContainer.classList.remove('drag-over');

                // Job drag drop
                if (draggingJobID && canEditJob) {
                    await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: draggingJobID, shipDate: calendarDate}, settings);
                }

                // Calender drag drop
                if (draggingCalendarEvent.id && canEditCalendar) {
                    if (draggingCalendarEvent.startDate === draggingCalendarEvent.endDate) {
                        await updateDBEntry(BUSINESS_SCHEMA, CALENDAR_TABLE, {id: draggingCalendarEvent.id, date: calendarDate}, settings);
                    }
                    else {
                        let startDate = draggingCalendarEvent.startDate;
                        let endDate = draggingCalendarEvent.endDate;

                        if (draggingCalendarEvent.isStartDate) {
                            if (calendarDate.replaceAll("-", "") > endDate.replaceAll("-", "")) {
                                startDate = endDate;
                                endDate = calendarDate;
                            }
                            else {
                                startDate = calendarDate;
                            }
                        }
                        else {
                            if (calendarDate.replaceAll("-", "") > endDate.replaceAll("-", "")) {
                                endDate = calendarDate;
                            }
                            if (calendarDate.replaceAll("-", "") < startDate.replaceAll("-", "")) {
                                endDate = startDate;
                                startDate = calendarDate;
                            }
                            else {
                                endDate = calendarDate;
                            }
                        }

                        await updateDBEntry(BUSINESS_SCHEMA, CALENDAR_TABLE, {
                            id: draggingCalendarEvent.id,
                            date: startDate,
                            endDate: endDate}, settings);
                    }
                }
                draggingJobID = "";
                draggingCalendarEvent = {id: "", startDate: "", endDate: "", isStartDate: true};
                await buildCalender();
            });

            const dayHeader = document.createElement('div');
            dayHeader.classList.add('day-header-container');
    
            const dayNameElement = document.createElement('p');
            const options = { month: "long" };
            const monthText = (new Intl.DateTimeFormat("en-CA", options).format(dateIndex));
            dayNameElement.classList.add('day-week-name');
            if (dateIndex.getDate() == 1) {
                dayNameElement.textContent = monthText
                dayNameElement.classList.add('day-title-first-of-the-month');

                // Add months to search array
                nameDateSearchArray.push({name: monthText, date: calendarDate});
            }
            else {
                dayNameElement.textContent = dateIndex.toLocaleString('default', {weekday: 'short'});
            }
    
            const dayNumberElement = document.createElement('p');
            const dayNumber = dateIndex.toLocaleString('default', {day: 'numeric'});
            dayNumberElement.classList.add('day-number');
            if (dates.today.toDateString('en-CA') === dateIndex.toDateString('en-CA')) {
                dayNumberElement.classList.add('today');
            }
            dayNumberElement.textContent = dayNumber;

            // Add month/ and day to search array
            nameDateSearchArray.push({name: monthText + " " + dayNumber, date: calendarDate});

            // Add Jobs
            const jobsContainer = document.createElement('div');
            jobsContainer.classList.add('jobs-container');
            jobs.forEach((job) => {
                if (job.shipDate !== formatDateToCA(dateIndex)) return;

                const percentCompleted = getJobTimes(job).percentCompleted;
                
                const jobTitle = document.createElement('p');
                jobTitle.setAttribute('draggable', 'true');
                jobTitle.setAttribute('title', job.note || "");
                jobTitle.addEventListener('dragstart', () => {draggingJobID = job.id});
                if (!job.active) jobTitle.style.color = "var(--inactive)";
                jobTitle.textContent = job.name;

                const jobProgressBar = document.createElement('div');
                if (canEditJob) {
                    jobTitle.style.cursor = 'pointer';
                    jobTitle.onclick = async () => {
                        const jobsResponse = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "id", "*", settings);
                        if ((!jobsResponse) || (jobsResponse.error)) return;
            
                        const tasksResponse = await getDBEntrees(BUSINESS_SCHEMA, TASKS_TABLE, "id", "*", settings);
                        if ((!tasksResponse) || (tasksResponse.error)) return;
            
                        const currentEditingResponse = await getDBEntrees(BUSINESS_SCHEMA, STATIONS_TABLE, "editing", job.id, settings);
                        const whoIsEditingJob = getWhoIsEditing(currentEditingResponse);
                        if (whoIsEditingJob === "") {
                            await updateDBEntry(BUSINESS_SCHEMA, STATIONS_TABLE, {id: stationID, editing: job.id}, settings);
                        }

                        showJobDialog(job, jobsResponse, tasksResponse, 
                            async (newJob) => {
                                await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, newJob, settings);
                                await updateDBEntry(BUSINESS_SCHEMA, STATIONS_TABLE, {id: stationID, editing: ""}, settings);
                                await buildCalender();
                            },
                            async (originalJob) => {
                                await updateDBEntry(BUSINESS_SCHEMA, STATIONS_TABLE, {id: stationID, editing: ""}, settings);
                            },
                            whoIsEditingJob
                        );
                    };
                    jobTitle.addEventListener('contextmenu', async (event) => {
                        event.preventDefault();
                        showYesNoDialog(`Delete "${job.name}"?`, async () => {
                            await deleteDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, job.id, settings);
                            await buildCalender();
                        });
                    });

                    jobProgressBar.style.width = `${percentCompleted}%`;
                    jobProgressBar.classList.add('job-progress-bar');
                    if (!job.active) jobProgressBar.style.borderColor = "var(--inactive)";
                }
                else { // Can't edit jobs
                    jobTitle.style.cursor = 'pointer';
                    jobTitle.onclick = async () => {
                        const jobsResponse = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "id", "*", settings);
                        if ((!jobsResponse) || (jobsResponse.error)) return;
                        
                        showJobCardDialog(job, async (newJob) => {
                            await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, newJob, settings);
                        });
                    };
                }
                jobsContainer.appendChild(jobTitle);
                jobsContainer.appendChild(jobProgressBar);
            
            });

            // // Add Calender Events
            const eventContainer = document.createElement('div');
            eventContainer.classList.add('events-container');

            calendarResponse.forEach((calenderEvent) => {
                const endDate = calenderEvent.endDate || calenderEvent.date;
                const isMultiDayEvent = calenderEvent.dates.length > 1;

                if (calenderEvent.dates.indexOf(calendarDate) !== -1) {

                    const eventTitle = document.createElement('p');
                    eventTitle.setAttribute('draggable', 'true');
                    eventTitle.setAttribute('title', calenderEvent.note || "");
                    eventTitle.addEventListener('dragstart', () => {
                        draggingCalendarEvent.id = calenderEvent.id;
                        draggingCalendarEvent.startDate = calenderEvent.date;
                        draggingCalendarEvent.endDate = endDate;
                        draggingCalendarEvent.isStartDate = calenderEvent.dates[0] === calendarDate;
                    });
                    eventTitle.textContent = calenderEvent.name;
                    eventTitle.style.color = "black";
                    if (isMultiDayEvent) eventTitle.style.width = "100%";
                    eventTitle.style.backgroundColor = `var(--color-${calenderEvent.color || 1})`;

                        if (canEditCalendar) {
                            eventTitle.style.cursor = 'pointer';
                            eventTitle.onclick = async () => {
                                showCalendarEventDialog(calenderEvent, 
                                    async (newEvent) => {
                                        await updateDBEntry(BUSINESS_SCHEMA, CALENDAR_TABLE, newEvent, settings);
                                        await buildCalender();
                                    },
                                    async (oldJob) => {
                                        // await buildCalender();
                                    }
                                );
                            };
                            eventTitle.addEventListener('contextmenu', async (e) => {
                                e.preventDefault();
                                showYesNoDialog(`Delete "${calenderEvent.name}"?`, async () => {
                                    await deleteDBEntry(BUSINESS_SCHEMA, CALENDAR_TABLE, calenderEvent.id, settings);
                                    await buildCalender();
                                });
                            });
                        }
                        eventContainer.appendChild(eventTitle);
                    }
            });

            dayHeader.appendChild(dayNameElement);
            dayHeader.appendChild(dayNumberElement);
    
            dayContainer.appendChild(dayHeader);
            dayContainer.appendChild(jobsContainer);
            dayContainer.appendChild(eventContainer);
            // dayContainer.appendChild(inActiveJobsContainer);
    
            weekContainer.appendChild(dayContainer);

            // Add dates to search array
            nameDateSearchArray.push({name: calendarDate, date: calendarDate});

            // Increment day
            dateIndex.setDate(dateIndex.getDate() + 1);

            if (dateIndex.toDateString('en-CA') === lastDatePlusNDays.toDateString('en-CA')) endCalender = true;
        };
        weeks.push(weekContainer);
    }

    log(nameDateSearchArray);

    calenderContainer.innerHTML = "";
    calenderContainer.append(...weeks);
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
    times.totalTimeDec = times.totalHours + (times.totalMinutes / 60);
    times.totalCompletedTimeDec = times.completedHours + (times.completedMinutes / 60);
    times.totalTimeRemainingDec = times.totalTimeDec - times.totalCompletedTimeDec;
    times.percentCompleted = ((times.totalCompletedTimeDec / times.totalTimeDec) * 100).toFixed(0);

    const totalTimeInMinutes = ((times.totalHours * 60) + times.totalMinutes);
    const totalCompletedTimeInMinutes = ((times.completedHours * 60) + times.completedMinutes);
    times.totalTimeRemainingInMinutes = totalTimeInMinutes - totalCompletedTimeInMinutes;
    return times;
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
    dateElement.style.backgroundColor = "var(--yes)";
    setTimeout(() => {
        dateElement.style.backgroundColor = "var(--background_color)";
    }, 1000);
};

async function canEditJobs() {
    if (superUser) return true;
    const userInfo = await getUserInfo(settings);
    const readJobs = userInfo.role.permission.business_schema.tables.jobs.read;
    const insertJobs = userInfo.role.permission.business_schema.tables.jobs.insert;
    const deleteJobs = userInfo.role.permission.business_schema.tables.jobs.delete;
    const updateJobs = userInfo.role.permission.business_schema.tables.jobs.update;
    return (readJobs && insertJobs && deleteJobs && updateJobs);
}
async function canEditCalendarEvent() {
    if (superUser) return true;
    const userInfo = await getUserInfo(settings);
    const readJobs = userInfo.role.permission.business_schema.tables.calendar.read;
    const insertJobs = userInfo.role.permission.business_schema.tables.calendar.insert;
    const deleteJobs = userInfo.role.permission.business_schema.tables.calendar.delete;
    const updateJobs = userInfo.role.permission.business_schema.tables.calendar.update;
    return (readJobs && insertJobs && deleteJobs && updateJobs);
}

function getLocalStorageValue(key) {
    if (window.localStorage[key])
        return JSON.parse(window.localStorage.getItem(key));
}
