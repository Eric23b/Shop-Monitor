import {
    getDBEntrees,
    updateDBEntry,
    insertDBEntry,
    getUserInfo,
    isSuperUser,} from "../db-utilities.js";

import {
    LOGS_SCHEMA,
    TIMER_TABLE,
    BUSINESS_SCHEMA,
    EMPLOYEES_TABLE,
    STATIONS_TABLE,
    JOBS_TABLE
} from "../directives.js";

import {
    Timer,
    stopRunningTimer,
    startOverTimeTimer,
} from "../timer-utilities.js";

const settings = {
    url: "",
    authorization: ""
}
let station = "";

const cardsContainer = document.querySelector("#cards-container");

const sort = document.querySelector("#sort");
const openAll = document.querySelector("#open-all");
const closeAll = document.querySelector("#close-all");
const searchInput = document.querySelector("#search-input");
const searchClearButton = document.querySelector("#search-clear-button");
const searchButton = document.querySelector("#search-button");

const addCheckboxModal = document.querySelector("#add-check-item-modal");
const addCheckboxModalInput = document.querySelector("#add-checkbox-input");
const addCheckboxModalOk = document.querySelector("#add-checkbox-ok-btn");
const addCheckboxModalCancel = document.querySelector("#add-checkbox-cancel-btn");

const yesNoModal = document.querySelector("#yes-no-item-modal");
const yesNoModalYesBtn = document.querySelector("#yes-btn");
const yesNoModalNoBtn = document.querySelector("#no-btn");

// const yesNoModal = document.querySelector("#yes-no-item-modal");
// const yesNoModalYesBtn = document.querySelector("#yes-btn");
// const yesNoModalNoBtn = document.querySelector("#no-btn");

const tasksDataList = document.querySelector("#tasks");

const dateLabel = document.querySelector("#date");

// INIT CODE

// Retrieve settings values
settings.url = getLocalStorageValue('serverURL') || "";
settings.authorization = getLocalStorageValue('serverAuthorization') || "";
station = getLocalStorageValue('stationName') || "";

const lateJobsDays = getLocalStorageValue('lateJobsDays') || 7;

const cardOpenCloseState = {};

const superUser = await isSuperUser(settings);
if (superUser) {
    const superUserElements = document.querySelectorAll('.super-user');
    superUserElements.forEach((element) => {
        element.classList.remove('super-user');
    });
}

setTheme();

loadJobs();

// Update the date/time at the bottom of the page
setInterval(updateDateTime, 1000);

const timer = new Timer(() => {
    if (noModalsAreOpen()) {
        loadJobs();
    }
}, 1000 * 60 * 1);

startOverTimeTimer(station, settings, stopRunningTimer);

// await checkOverTimers(station, settings, stopRunningTimer);
// setInterval( async () => {
//     await checkOverTimers(station, settings, stopRunningTimer);
// }, 30000);


// EVENT LISTENERS

// Got to home page
window.onkeydown = (event) => {
    if (event.key === "8" && event.ctrlKey) window.location = "/";
    timer.reset();
}

window.onmousedown = () => {
    timer.reset();
}

sort.addEventListener('change', loadJobs);

openAll.addEventListener('click', openAllCards);
function openAllCards() {
    const allCards = document.querySelectorAll('.card');
    allCards.forEach((card) => {
        card.setAttribute('open', 'true');
    });
};

closeAll.addEventListener('click', closeAllCards);
function closeAllCards() {
    const allCards = document.querySelectorAll('.card');
    allCards.forEach((card) => {
        card.removeAttribute('open');
    });
};


searchButton.addEventListener('click', search);
searchInput.addEventListener('keypress', (event) => {
    if (event.key === "Enter") search();
});
searchClearButton.addEventListener('click', () => {
    searchInput.value = '';
    loadJobs();
});



// FUNCTIONS

function search() {
    loadJobs(null, searchInput.value);
}

function differenceInDays(dateOne, dateTwo) {
    const date1 = new Date(dateOne);
    const date2 = new Date(dateTwo);
    
    const differenceInTime = date2.getTime() - date1.getTime();
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);

    return Math.floor(differenceInDays);
}

// Load
async function loadJobs(event, searchValue) {
    const jobsResponse = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "active", "true", settings);
    
    if ((!jobsResponse) || (jobsResponse.error)) return;

    switch (sort.value) {
        case "job-name-low-to-high":
            jobsResponse.sort((a, b) => {
                const nameA = String(a.name).toUpperCase();
                const nameB = String(b.name).toUpperCase();
                if (nameA < nameB) return 1;
                if (nameA > nameB) return -1;
                return 0;
            });
            break;
        case "job-name-high-to-low":
            jobsResponse.sort((a, b) => {
                const nameA = String(a.name).toUpperCase();
                const nameB = String(b.name).toUpperCase();
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            });
            break;
        case "latest-ship-date":
            jobsResponse.sort((a, b) => {
                const shipDateA = a.shipDate;
                const shipDateB = b.shipDate;
                if (shipDateA < shipDateB) return 1;
                if (shipDateA > shipDateB) return -1;
                return 0;
            });
            break;
        case "earliest-ship-date":
            jobsResponse.sort((a, b) => {
                const shipDateA = a.shipDate;
                const shipDateB = b.shipDate;
                if (shipDateA < shipDateB) return -1;
                if (shipDateA > shipDateB) return 1;
                return 0;
            });
            break;
    
        default:
            break;
    }


    const canEditJob = await canEditJobs();

    cardsContainer.innerHTML = "";

    // Used for drop downs
    tasksDataList.innerHTML = "";
    const tasks = [];

    let checkLabelID = 0;

    // Loop through cards
    for (const job of jobsResponse) {
        if (!job.active) continue;

        if (searchValue) {
            if (!String(job.name).toUpperCase().includes(String(searchValue).toUpperCase())) continue;
        }

        const card = document.createElement('details');
        card.classList.add('card');
        card.setAttribute('jobID', job.id);
        card.addEventListener('toggle', (event) => {
            cardOpenCloseState[job.id] = event.target.open;
        });
        // Open/Close cards
        cardOpenCloseState[job.id] ? card.setAttribute('open', 'open') : card.removeAttribute('open');

        const summary = document.createElement('summary');

        // Progress bar
        const progressBar = document.createElement('div');
        const progressElement = document.createElement('div');
        if (canEditJob) {
            progressBar.setAttribute('title', getJobTimes(job).percentCompleted);
            progressBar.classList.add('progress-bar');
            progressElement.style.width = `${getJobTimes(job).percentCompleted}%`;
            progressBar.appendChild(progressElement);
        }
        
        const cardTitle = document.createElement('h2');
        cardTitle.textContent = job.name;
        cardTitle.classList.add('card-title');
        cardTitle.appendChild(progressBar);
        
        const shipDate = document.createElement('h3');
        shipDate.textContent = `Ship: ${job.shipDate ? job.shipDate : ""}`;
        shipDate.classList.add('ship-date');
        
        const dueInDays = document.createElement('p');
        const dueInDaysFromNow = differenceInDays((new Date()).toLocaleDateString('en-CA'), job.shipDate);
        if (dueInDaysFromNow > 0) {
            const dueInDaysPlural = (dueInDaysFromNow > 1) ? "s" : "";
            dueInDays.textContent = `Due in ${dueInDaysFromNow} day${dueInDaysPlural}`;
        }
        else if (dueInDaysFromNow < 0) {
            const dueInDaysPlural = (Math.abs(dueInDaysFromNow) > 1) ? "s" : "";
            dueInDays.textContent = `Due ${Math.abs(dueInDaysFromNow)} day${dueInDaysPlural} ago`;
        }
        else {
            dueInDays.textContent = `Due today`;
        }
        dueInDays.classList.add('notes');
        
        const note = document.createElement('p');
        note.textContent = job.note;
        note.classList.add('notes');
        
        const checkListContainer = document.createElement('section');
        checkListContainer.classList.add('check-list-container');

        const checkValues = [];

        // Loop through checks
        if (job.checklist) {
            for (const checkItem of job.checklist) {
                const checkboxItem = getCheckboxItem(checkItem);

                checkListContainer.appendChild(checkboxItem);

                if (tasks.indexOf(checkItem.text) == -1) {
                    tasks.push(checkItem.text);
                }
            }
        }
        updateColorAndCheckInTitle(checkListContainer, cardTitle, job.shipDate);

        const addCheckboxButton = document.createElement('button');
        addCheckboxButton.textContent = "Add checkbox";
        addCheckboxButton.classList.add('add-check-item-button');
        addCheckboxButton.onclick = () => {
            showAddCheckboxModal(
                async (inputText) => {
                    let checklistArray = [];
                    checkValues.forEach(checkItem => {
                        checklistArray.push({
                            checked: checkItem.checkBox.checked,
                            text: checkItem.text, 
                            stationName: checkItem.stationName,
                        });
                    });

                    const stationName = getLocalStorageValue('stationName');
                    checklistArray.push({checked: false, text: inputText, stationName});
                    const checkItem = {
                        checkBox: {
                            checked: false
                        },
                        text: inputText,
                        stationName,
                    };
                    checkListContainer.appendChild(getCheckboxItem(checkItem));
                    updateColorAndCheckInTitle(checkListContainer, cardTitle, job.shipDate);
                    await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: job.id, checklist: JSON.stringify(checklistArray)}, settings);
                });
        };

        const allSequencesContainer = document.createElement('div');
        allSequencesContainer.classList.add('main-sequence-container');
        if (job.sequences && canEditJob) {
            job.sequences.forEach((sequence) => {
                const sequenceContainer = document.createElement('div');
                sequenceContainer.textContent = sequence.name;
                sequence.tasks.forEach((task) => {
                    const checkbox = document.createElement('input');
                    checkbox.setAttribute('type', 'checkbox');
                    if (task.completed) checkbox.setAttribute('checked', 'true');
                    checkbox.onchange = async () => {
                        task.completed = checkbox.checked;
                        await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: job.id, sequences: job.sequences}, settings);
                        progressElement.style.width = `${getJobTimes(job).percentCompleted}%`;
                    }

                    const taskCheckLabel = document.createElement('label');
                    taskCheckLabel.appendChild(checkbox);
                    taskCheckLabel.append(task.name)

                    sequenceContainer.appendChild(taskCheckLabel);
                });
                allSequencesContainer.appendChild(sequenceContainer);
            });
        }

        summary.appendChild(cardTitle);
        card.appendChild(summary);
        card.appendChild(shipDate);
        card.appendChild(dueInDays);
        card.appendChild(note);
        card.appendChild(allSequencesContainer);
        card.appendChild(checkListContainer);
        card.appendChild(addCheckboxButton);

        checkListContainer.onchange = async () => {
            let checklistArray = [];
            checkValues.forEach(checkItem => {
                checklistArray.push({
                    checked: checkItem.checkBox.checked,
                    text: checkItem.text, 
                    stationName: checkItem.stationName,
                });
            });
            updateColorAndCheckInTitle(checkListContainer, cardTitle, job.shipDate);
            await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: job.id, checklist: JSON.stringify(checklistArray)}, settings);
        }

        cardsContainer.appendChild(card);

        function updateColorAndCheckInTitle(checkListContainer, cardTitle, shipDate) {
            let allChecked = true;
            const checkboxes = checkListContainer.querySelectorAll('.check-box');

            checkboxes.forEach(checkbox => {
                if (!checkbox.checked) {allChecked = false}
            });

            cardTitle.classList.remove('card-title-checked');

            if (allChecked && checkboxes.length) {
                cardTitle.classList.add('card-title-checked');
            }

            if ((differenceInDays((new Date()).toLocaleDateString(), shipDate) < lateJobsDays) && !allChecked) {
                // cardTitle.style.color = 'var(--no)';

            }
            else {
                cardTitle.style.color = 'var(--color)';
            }
            if (checkboxes.length == -1) {
                cardTitle.style.color = 'var(--color)';
            }
        }
        
        function getCheckboxItem(checkItem) {
            let checkValuesIndex = 0;
            const checkID = `check-${checkLabelID++}`;

            const checkContainer = document.createElement('div');
            checkContainer.setAttribute('title', "Double click to delete");
            checkContainer.setAttribute('station', checkItem.stationName);
            checkContainer.classList.add('check-container');
            checkContainer.addEventListener('dblclick', async (event) => {
                event.preventDefault();
                showYesNoModal( async () => {
                    checkValues.splice(checkValuesIndex, 1);

                    let checklistArray = [];
                    checkValues.forEach(checkItem => {
                        checklistArray.push({
                            checked: checkItem.checkBox.checked,
                            text: checkItem.text, 
                            stationName: checkItem.stationName,
                        });
                    });
                    await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: job.id, checklist: JSON.stringify(checklistArray)}, settings);
                    loadJobs();
                });
            });

            const label = document.createElement('label');
            label.classList.add('check-list-item');
            label.setAttribute('for', checkID);
            label.innerText = checkItem.text;

            const checkBox = document.createElement('input');
            checkBox.setAttribute('type', 'checkbox');
            checkItem.checked ? checkBox.setAttribute('checked', 'true') : checkBox.removeAttribute('checked');
            checkBox.setAttribute('id', checkID);
            checkBox.classList.add('check-box');

            checkValuesIndex = checkValues.push({
                checkBox: checkBox,
                text: checkItem.text, 
                stationName: checkItem.stationName,
            }) - 1;

            checkContainer.appendChild(checkBox);
            checkContainer.appendChild(label);

            return checkContainer;
        }
    };

    // Update data
    tasks.forEach(task => {
        const taskOption = document.createElement('option');
        taskOption.value = task;
        tasksDataList.appendChild(taskOption);
    });

    // if (cardsAreOpen) {
    //     openAllCards();
    // }
    // else {
    //     closeAllCards();
    // }
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

async function showAddCheckboxModal(okCallback) {
    addCheckboxModal.style.display = 'flex';
    addCheckboxModalInput.value = "";
    addCheckboxModalInput.setAttribute('list', "tasks");
    addCheckboxModalInput.focus();
    addCheckboxModalOk.onclick = () => {
        okCallback(addCheckboxModalInput.value);
        addCheckboxModal.style.display = 'none';
    };
    addCheckboxModalCancel.onclick = () => {
        addCheckboxModal.style.display = 'none';
    };
}


async function showYesNoModal(yesCallback) {
    yesNoModal.style.display = 'flex';
    yesNoModalYesBtn.onclick = () => {
        yesCallback();
        yesNoModal.style.display = 'none';
    };
    yesNoModalNoBtn.onclick = () => {
        yesNoModal.style.display = 'none';
    };
}

function noModalsAreOpen() {
    return !((addCheckboxModal.style.display == 'flex') || (yesNoModal.style.display == 'flex'));
}

function getLocalStorageValue(key) {
    if (window.localStorage[key])
        return JSON.parse(window.localStorage.getItem(key));
}

function setLocalStorageValue(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
}

function setTheme() {
    const theme = getLocalStorageValue('theme') || "light";
    document.documentElement.setAttribute('data-color-theme', theme);
    // darkThemeCheckbox.checked = theme == "dark" ? true : false;
}

function updateDateTime() {
    dateLabel.textContent = `${(new Date()).toLocaleDateString()} ${(new Date()).toLocaleTimeString('en-US')}`;
}

async function canEditJobs() {
    if (superUser) return true;
    const userInfo = await getUserInfo(settings);
    console.log(userInfo)
    const readJobs = userInfo.role.permission.business_schema.tables.jobs.read;
    const insertJobs = userInfo.role.permission.business_schema.tables.jobs.insert;
    const deleteJobs = userInfo.role.permission.business_schema.tables.jobs.delete;
    const updateJobs = userInfo.role.permission.business_schema.tables.jobs.update;
    return (readJobs && insertJobs && deleteJobs && updateJobs);
}