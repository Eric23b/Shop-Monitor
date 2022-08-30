
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

const log = console.log;

const daysOfTheWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const settings = {
    url: "",
    authorization: ""
}

const calenderContainer = document.querySelector('#calender');


settings.url = getLocalStorageValue('serverURL') || "";
settings.authorization = getLocalStorageValue('serverAuthorization') || "";
const stationName = getLocalStorageValue('stationName') || "";

const theme = getLocalStorageValue('theme') || "light";



// INITIALIZE CODE

document.documentElement.setAttribute('data-color-theme', theme);


// FUNCTIONS
buildCalender();
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

    log(jobs)

    calenderContainer.innerHTML = "";

    const dates = getDates(jobs);

    const dateIndex = new Date(dates.firstSunday);

    log(dates.lastSaturday.toDateString('en-CA'))
    log(dateIndex.toDateString('en-CA'))

    // jobs.forEach((job) => {
    let endCalender = false;
    while (!endCalender) {
        
        const weekContainer = document.createElement('div');
        weekContainer.classList.add('week');
    
        daysOfTheWeek.forEach((day) => {
            const dayContainer = document.createElement('div');
            dayContainer.classList.add('day');
    
            const dayNameElement = document.createElement('p');
            dayNameElement.classList.add('day-title');
            dayNameElement.textContent = dateIndex.toLocaleString('default', {weekday: 'short'});
    
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
                    jobTitle.textContent = job.name;
                    jobTitle.style.cursor = 'pointer';
                    jobTitle.onclick = (e) => {
                        log(job.id)
                    };
                    jobsContainer.appendChild(jobTitle);
                }
            });
    
            dayContainer.appendChild(dayNameElement);
            dayContainer.appendChild(dayNumberElement);
            dayContainer.appendChild(jobsContainer);
    
            weekContainer.appendChild(dayContainer);

            dateIndex.setDate(dateIndex.getDate() + 1);

            if (dateIndex.toDateString('en-CA') === dates.lastSaturday.toDateString('en-CA')) endCalender = true;
        });
    
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

function getLocalStorageValue(key) {
    if (window.localStorage[key])
        return JSON.parse(window.localStorage.getItem(key));
}