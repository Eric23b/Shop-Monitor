import {
    getDBEntrees,
    updateDBEntry,
    insertDBEntry} from "../db-utilities.js";

import {
    LOGS_SCHEMA,
    TIMER_TABLE,
    BUSINESS_SCHEMA,
    EMPLOYEES_TABLE,
    STATIONS_TABLE,
    JOBS_TABLE
} from "../directives.js";

const settings = {
    url: "",
    authorization: ""
}

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

const cardOpenCloseState = {};

setTheme();

loadJobs();

// Update the date/time at the bottom of the page
setInterval(updateDataTime, 1000);

class Timer {
    constructor(callback, duration) {
        let timerObj = setInterval(callback, duration);

        this.stop = function () {
            if (timerObj) {
                clearInterval(timerObj);
                timerObj = null;
            }
            return this;
        };

        // start timer using current settings (if it's not already running)
        this.start = function () {
            if (!timerObj) {
                this.stop();
                timerObj = setInterval(callback, duration);
            }
            return this;
        };

        // start with new or original interval, stop current interval
        this.reset = function (newT = duration) {
            duration = newT;
            return this.stop().start();
        };
    }
}
const timer = new Timer(() => {
    if (noModalsAreOpen()) {
        loadJobs();
    }
}, 1000 * 60 * 1);


// EVENT LISTENERS

window.onkeydown = (event) => {
    if (event.key === "8" && event.ctrlKey) {
        const adminLink = document.createElement('a');
        adminLink.href = "/";
        adminLink.click();
    }
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

// Load Parts Issues Table
async function loadJobs(event, searchValue) {
    const response = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "active", "true", settings);
    
    if ((!response) || (response.error)) return;

    switch (sort.value) {
        case "job-name-low-to-high":
            response.sort((a, b) => {
                const nameA = String(a.name).toUpperCase();
                const nameB = String(b.name).toUpperCase();
                if (nameA < nameB) return 1;
                if (nameA > nameB) return -1;
                return 0;
            });
            break;
        case "job-name-high-to-low":
            response.sort((a, b) => {
                const nameA = String(a.name).toUpperCase();
                const nameB = String(b.name).toUpperCase();
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            });
            break;
        case "latest-ship-date":
            response.sort((a, b) => {
                const shipDateA = a.shipDate;
                const shipDateB = b.shipDate;
                if (shipDateA < shipDateB) return 1;
                if (shipDateA > shipDateB) return -1;
                return 0;
            });
            break;
        case "earliest-ship-date":
            response.sort((a, b) => {
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

    cardsContainer.innerHTML = "";

    // Used for drop downs
    tasksDataList.innerHTML = "";
    const tasks = [];

    let checkLabelID = 0;

    // Loop through cards
    for (const entry of response) {
        if (!entry.active) continue;

        if (searchValue) {
            if (!String(entry.name).toUpperCase().includes(String(searchValue).toUpperCase())) continue;
        }

        const card = document.createElement('details');
        card.classList.add('card');
        card.setAttribute('jobID', entry.id);
        card.addEventListener('toggle', (event) => {
            cardOpenCloseState[entry.id] = event.target.open;
        });
        // Open/Close cards
        cardOpenCloseState[entry.id] ? card.setAttribute('open', 'open') : card.removeAttribute('open');

        const summary = document.createElement('summary');
        
        const cardTitle = document.createElement('h2');
        cardTitle.textContent = entry.name;
        cardTitle.classList.add('card-title');
        
        const shipDate = document.createElement('h3');
        shipDate.textContent = `Ship: ${entry.shipDate ? entry.shipDate : ""}`;
        shipDate.classList.add('ship-date');
        
        const note = document.createElement('p');
        note.textContent = entry.note;
        note.classList.add('notes');
        
        const checkListContainer = document.createElement('section');
        checkListContainer.classList.add('check-list-container');

        const checkValues = [];

        // Loop through checks
        if (entry.checklist) {
            for (const checkItem of entry.checklist) {
                const checkboxItem = getCheckboxItem(checkItem);

                checkListContainer.appendChild(checkboxItem);

                if (tasks.indexOf(checkItem.text) == -1) {
                    tasks.push(checkItem.text);
                }
            }
        }

        updateColorAndCheckInTitle(checkListContainer, cardTitle, entry.shipDate);

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
                    updateColorAndCheckInTitle(checkListContainer, cardTitle, entry.shipDate);
                    await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: entry.id, checklist: JSON.stringify(checklistArray)}, settings);
                });
        };

        summary.appendChild(cardTitle);
        card.appendChild(summary);
        card.appendChild(shipDate);
        card.appendChild(note);
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
            updateColorAndCheckInTitle(checkListContainer, cardTitle, entry.shipDate);
            await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: entry.id, checklist: JSON.stringify(checklistArray)}, settings);
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

            if ((differenceInDays((new Date()).toLocaleDateString(), shipDate) < 7) && !allChecked) {
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
                    await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: entry.id, checklist: JSON.stringify(checklistArray)}, settings);
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

function updateDataTime() {
    dateLabel.textContent = `${(new Date()).toLocaleDateString()} ${(new Date()).toLocaleTimeString('en-US')}`;
}
