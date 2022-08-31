
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

let draggingJobID = 0;

const calenderContainer = document.querySelector('#calender');


settings.url = getLocalStorageValue('serverURL') || "";
settings.authorization = getLocalStorageValue('serverAuthorization') || "";
const stationName = getLocalStorageValue('stationName') || "";

const theme = getLocalStorageValue('theme') || "light";



// INITIALIZE CODE


const superUser = await isSuperUser(settings);
if (superUser) {
    const superUserElements = document.querySelectorAll('.super-user');
    superUserElements.forEach((element) => {
        element.classList.remove('super-user');
    });
}

document.documentElement.setAttribute('data-color-theme', theme);

buildCalender();


// FUNCTIONS
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

    calenderContainer.innerHTML = "";

    const dates = getDates(jobs);

    const dateIndex = new Date(dates.firstSunday);

    const lastDatePlusOneMonth = new Date(dates.lastSaturday);

    lastDatePlusOneMonth.setDate(lastDatePlusOneMonth.getDate() + 28);

    let endCalender = false;
    while (!endCalender) {
        const weekContainer = document.createElement('div');
        weekContainer.classList.add('week');
    
        for (let index = 0; index < 7; index++) {
            const date = dateIndex.toLocaleDateString('en-CA');
            const dayContainer = document.createElement('div');
            dayContainer.classList.add('day');
            dayContainer.addEventListener('dragenter', () => {dayContainer.classList.add('drag-over')});
            dayContainer.addEventListener('dragleave', () => {dayContainer.classList.remove('drag-over')});
            dayContainer.addEventListener('dragover', (event) => {event.preventDefault()});
            dayContainer.addEventListener('drop', async () => {
                dayContainer.classList.remove('drag-over');
                await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: draggingJobID, shipDate: date}, settings);
                await buildCalender();
            });

            const dayHeader = document.createElement('div');
            dayHeader.classList.add('day-header-container');
    
            const dayNameElement = document.createElement('p');
            dayNameElement.classList.add('day-week-name');
            if (dateIndex.getDate() == 1) {
                const options = { month: "short" };
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

            const jobsContainer = document.createElement('div');
            jobsContainer.classList.add('jobs-container');
            jobs.forEach((job) => {
                if (job.shipDate === dateIndex.toLocaleDateString('en-CA')) {
                    const jobTitle = document.createElement('p');
                    jobTitle.setAttribute('draggable', 'true');
                    jobTitle.addEventListener('dragstart', () => {draggingJobID = job.id});
                    jobTitle.textContent = job.name;
                    jobTitle.style.cursor = 'pointer';
                    jobTitle.onclick = () => {
                        // log(job.id)
                    };
                    jobsContainer.appendChild(jobTitle);
                }
            });

            dayHeader.appendChild(dayNameElement);
            dayHeader.appendChild(dayNumberElement);
    
            dayContainer.appendChild(dayHeader);
            dayContainer.appendChild(jobsContainer);
    
            weekContainer.appendChild(dayContainer);

            // Increment day
            dateIndex.setDate(dateIndex.getDate() + 1);

            if (dateIndex.toDateString('en-CA') === lastDatePlusOneMonth.toDateString('en-CA')) endCalender = true;
            // if (dateIndex.toDateString('en-CA') === dates.lastSaturday.toDateString('en-CA')) endCalender = true;
        };
    
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