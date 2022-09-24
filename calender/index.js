
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
    stopRunningTimer,
    startOverTimeTimer,
    addNumberOfRunningTimersToTimerPageLink,
} from "../timer-utilities.js";

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
    showCalendarEventDialog,
} from "../dialogs.js";

const log = console.log;

const daysOfTheWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const settings = {
    url: "",
    authorization: ""
}

let draggingJobID = "";
let draggingEventID = "";

const timerPageLink = document.querySelector('.timer-page-link');

const addNewJobBtn = document.querySelector('#add-job-btn');
const addNewEventBtn = document.querySelector('#add-event-btn');
const todayBtn = document.querySelector('#today-button');

const calenderContainer = document.querySelector('#calender');


settings.url = getLocalStorageValue('serverURL') || "";
settings.authorization = getLocalStorageValue('serverAuthorization') || "";
const stationName = getLocalStorageValue('stationName') || "";

const theme = getLocalStorageValue('theme') || "light";

const superUser = await isSuperUser(settings);
const canEditCalendar = await canEditCalendarEvent();
const canEditJob = await canEditJobs();


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

buildCalender("today");

startOverTimeTimer(stationName, settings, stopRunningTimer);

addNumberOfRunningTimersToTimerPageLink(timerPageLink, stationName, settings);


// Event listeners

// Got to home page
window.onkeydown = (event) => {
    if (event.key === "8" && event.ctrlKey) window.location = "/";
}

// Jump to today
todayBtn.addEventListener('click', () => {
    jumpToDate((new Date()).toLocaleDateString('en-CA'));
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
    const jobs = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "active", true, settings);
    if ((!jobs) || (jobs.error) || jobs.length === 0) return;

    const inActiveJobs = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "active", false, settings);
    if ((!inActiveJobs) || (inActiveJobs.error) || inActiveJobs.length === 0) return;

    const calendarResponse = await getDBEntrees(BUSINESS_SCHEMA, CALENDAR_TABLE, "id", "*", settings);

    // Sort events date
    calendarResponse.sort((a, b) => {
        const nameA = a.date;
        const nameB = b.date;
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });

    // Sort by ship date
    jobs.sort((a, b) => {
        const nameA = a.shipDate;
        const nameB = b.shipDate;
        if (nameA < nameB) return 1;
        if (nameA > nameB) return -1;
        return 0;
    });

    const canEditJob = await canEditJobs();
    const canEditCalendar = await canEditCalendarEvent();
    
    const dates = getDates(jobs, calendarResponse);
    
    let dateIndex;
    if (dates.firstSunday.toLocaleDateString('en-CA') < new Date().toLocaleDateString('en-CA')) {
        dateIndex = new Date(dates.firstSunday);
    }
    else {
        // Find earliest Sunday
        dateIndex = new Date();
        while (dateIndex.toLocaleString('default', {weekday: 'short'}) !== "Sun") {
            dateIndex.setDate(dateIndex.getDate() - 1);
        }
    }
    dateIndex.setDate(dateIndex.getDate() - 98);
    
    const lastDatePlusOneMonth = new Date(getCorrectDate(dates.lastSaturday));
    
    lastDatePlusOneMonth.setDate(lastDatePlusOneMonth.getDate() + 105);

    const weeks = [];

    let endCalender = false;
    while (!endCalender) {
        const weekContainer = document.createElement('div');
        weekContainer.classList.add('week');
    
        // Loop through days of the week
        for (let dayOfTheWeekIndex = 0; dayOfTheWeekIndex < 7; dayOfTheWeekIndex++) {
            const date = dateIndex.toLocaleDateString('en-CA');
            const dayContainer = document.createElement('div');
            if (dates.today.toDateString('en-CA') === dateIndex.toDateString('en-CA')) {
                dayContainer.id = "today";
            }
            dayContainer.classList.add(`date-${date}`);
            dayContainer.classList.add('day');
            dayContainer.addEventListener('dragenter', () => {dayContainer.classList.add('drag-over')});
            dayContainer.addEventListener('dragleave', () => {dayContainer.classList.remove('drag-over')});
            dayContainer.addEventListener('dragover', (event) => {event.preventDefault()});
            dayContainer.addEventListener('drop', async () => {
                dayContainer.classList.remove('drag-over');
                if (draggingJobID && canEditJob) {
                    await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: draggingJobID, shipDate: date}, settings);
                }
                if (draggingEventID && canEditCalendar) {
                    await updateDBEntry(BUSINESS_SCHEMA, CALENDAR_TABLE, {id: draggingEventID, date: date}, settings);
                }
                draggingJobID = "";
                draggingEventID = "";
                await buildCalender();
            });

            const dayHeader = document.createElement('div');
            dayHeader.classList.add('day-header-container');
    
            const dayNameElement = document.createElement('p');
            dayNameElement.classList.add('day-week-name');
            if (dateIndex.getDate() == 1) {
                const options = { month: "long" };
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

            // Add Jobs
            const jobsContainer = document.createElement('div');
            jobsContainer.classList.add('jobs-container');
            jobs.forEach((job) => {
                if (job.shipDate === dateIndex.toLocaleDateString('en-CA')) {
                    const jobTitle = document.createElement('p');
                    jobTitle.setAttribute('draggable', 'true');
                    jobTitle.setAttribute('title', job.note || "");
                    jobTitle.addEventListener('dragstart', () => {draggingJobID = job.id});
                    jobTitle.textContent = job.name;
                    if (canEditJob) {
                        jobTitle.style.cursor = 'pointer';
                        jobTitle.onclick = async () => {
                            const jobsResponse = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "id", "*", settings);
                            if ((!jobsResponse) || (jobsResponse.error)) return;
                
                            const tasksResponse = await getDBEntrees(BUSINESS_SCHEMA, TASKS_TABLE, "id", "*", settings);
                            if ((!tasksResponse) || (tasksResponse.error)) return;
                            
                            showJobDialog(job, jobsResponse, tasksResponse, 
                                async (newJob) => {
                                    await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, newJob, settings);
                                    await buildCalender();
                                },
                                async (oldJob) => {
                                    // await buildCalender();
                                }
                            );
                        };
                        jobTitle.addEventListener('contextmenu', async (event) => {
                            event.preventDefault();
                            showYesNoDialog(`Delete "${job.name}"?`, async () => {
                                await deleteDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, job.id, settings);
                                await buildCalender();
                            });
                        });
                    }
                    jobsContainer.appendChild(jobTitle);
                }
            });

            // Add Inactive Jobs
            const inActiveJobsContainer = document.createElement('div');
            inActiveJobsContainer.classList.add('jobs-container');
            inActiveJobs.forEach((job) => {
                if (job.shipDate === dateIndex.toLocaleDateString('en-CA')) {
                    const jobTitle = document.createElement('p');
                    jobTitle.setAttribute('title', job.note || "");
                    jobTitle.textContent = job.name;
                    jobTitle.style.color = "var(--inactive)"
                    inActiveJobsContainer.appendChild(jobTitle);
                }
            });

            // Add Calender Events
            const eventContainer = document.createElement('div');
            eventContainer.classList.add('events-container');
            calendarResponse.forEach((event) => {
                if (event.date === dateIndex.toLocaleDateString('en-CA')) {
                    const eventTitle = document.createElement('p');
                    eventTitle.setAttribute('draggable', 'true');
                    eventTitle.setAttribute('title', event.note || "");
                    eventTitle.addEventListener('dragstart', () => {draggingEventID = event.id});
                    eventTitle.textContent = event.name;
                    eventTitle.style.color = "black";
                    eventTitle.style.backgroundColor = `var(--color-${event.color || 1})`;
                    if (canEditCalendar) {
                        eventTitle.style.cursor = 'pointer';
                        eventTitle.onclick = async () => {
                            showCalendarEventDialog(event, 
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
                            showYesNoDialog(`Delete "${event.name}"?`, async () => {
                                await deleteDBEntry(BUSINESS_SCHEMA, CALENDAR_TABLE, event.id, settings);
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
            dayContainer.appendChild(inActiveJobsContainer);
    
            weekContainer.appendChild(dayContainer);

            // Increment day
            dateIndex.setDate(dateIndex.getDate() + 1);

            if (dateIndex.toDateString('en-CA') === lastDatePlusOneMonth.toDateString('en-CA')) endCalender = true;
            // if (dateIndex.toDateString('en-CA') === dates.lastSaturday.toDateString('en-CA')) endCalender = true;
        };
        
        weeks.push(weekContainer);
    }
    calenderContainer.innerHTML = "";
    calenderContainer.append(...weeks);

    if (scrollTo === "today") {
        const todayElement = document.querySelector('#today');
        todayElement.scrollIntoView();
    }
}

function getDates(jobs, events) {
    if (!events) events = [];

    const earliestDate = jobs[jobs.length - 1].shipDate || (new Date()).toLocaleDateString('en-CA');
    const latestDate = jobs[0].shipDate || (new Date()).toLocaleDateString('en-CA');

    const firstSunday = new Date(getCorrectDate(earliestDate));

    while (firstSunday.toLocaleString('default', {weekday: 'short'}) !== "Sun") {
        firstSunday.setDate(firstSunday.getDate() - 1);
    }

    const lastSaturday = new Date(getCorrectDate(latestDate));

    while (lastSaturday.toLocaleString('default', {weekday: 'short'}) !== "Sat") {
        lastSaturday.setDate(lastSaturday.getDate() + 1);
    }

    const today = new Date();

    return {earliestDate, latestDate, firstSunday, lastSaturday, today}
}

function getCorrectDate(date) {
    // Stupid javascript
    const utcDate = new Date(date);
    return new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
}

function jumpToDate(date) {
    const todayElement = document.querySelector(`.date-${date}`);
    if (todayElement === null) return;
    todayElement.scrollIntoView();
    todayElement.style.backgroundColor = "var(--yes)";
    setTimeout(() => {
        todayElement.style.backgroundColor = "var(--background_color)";
    }, 1000);
};

function offsetMonthBecauseJSIsStupid(date) {
    return [date.split("-")[0], Number(date.split("-")[1]) - 1, date.split("-")[2]].join("-")
}

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
