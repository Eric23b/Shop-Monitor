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

const addCheckboxModal = document.querySelector("#add-check-item-modal");
const addCheckboxModalInput = document.querySelector("#add-checkbox-input");
const addCheckboxModalOk = document.querySelector("#add-checkbox-ok-btn");
const addCheckboxModalCancel = document.querySelector("#add-checkbox-cancel-btn");

const yesNoModal = document.querySelector("#yes-no-item-modal");
const yesNoModalYesBtn = document.querySelector("#yes-btn");
const yesNoModalNoBtn = document.querySelector("#no-btn");

const tasksDataList = document.querySelector("#tasks");

// INIT CODE

// Retrieve settings values
settings.url = getLocalStorageValue('serverURL') || "";
settings.authorization = getLocalStorageValue('serverAuthorization') || "";

setTheme();

loadJobs();


// EVENT LISTENERS

window.onkeydown = (e) => {
    if (e.key === "8" && e.ctrlKey) {
        const adminLink = document.createElement('a');
        adminLink.href = "admin.html";
        adminLink.click();
    }
}

sort.addEventListener('change', loadJobs);

// Load Parts Issues Table
async function loadJobs() {
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
    

    // console.log(response);

    cardsContainer.innerHTML = "";

    tasksDataList.innerHTML = "";
    const tasks = [];

    let checkLabelID = 0;

    // Loop through cards
    for (const entry of response) {
        if (!entry.active) continue;

        // console.log(entry);
        const card = document.createElement('details');
        card.classList.add('card');

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

        let jobDoneCheck = false;
        
        // Loop through checks
        if (entry.checklist) {
            // Set to true if checklist longer than 0
            jobDoneCheck = (entry.checklist.length > 0);

            for (const checkItem of entry.checklist) {
                if (!checkItem.checked) {
                    jobDoneCheck = false;
                }

                let checkValuesIndex = 0;
                const checkID = `check-${checkLabelID++}`;

                const checkContainer = document.createElement('div');
                checkContainer.setAttribute('title', "Right click to remove");
                checkContainer.classList.add('check-container');
                checkContainer.addEventListener('contextmenu', async (event) => {
                    event.preventDefault();
                    showYesNoModal( async () => {
                        checkValues.splice(checkValuesIndex, 1);
    
                        let checklistArray = [];
                        checkValues.forEach(checkItem => {
                            checklistArray.push({checked: checkItem.checkBox.checked, text: checkItem.text});
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

                checkValuesIndex = checkValues.push({checkBox: checkBox, text: checkItem.text}) - 1;

                checkContainer.appendChild(checkBox);
                checkContainer.appendChild(label);

                checkListContainer.appendChild(checkContainer);

                if (tasks.indexOf(checkItem.text) == -1) {
                    tasks.push(checkItem.text);
                }
            }
        }
        if (jobDoneCheck) {
            cardTitle.classList.add('card-title-checked');
        }


        // const taskOption = document.createElement('option');
        // taskOption.value = checkItem.text;
        // tasksDataList.appendChild(taskOption);

        const addCheckboxButton = document.createElement('button');
        addCheckboxButton.textContent = "Add checkbox";
        addCheckboxButton.classList.add('add-check-item-button');
        addCheckboxButton.onclick = () => {
            showAddCheckboxModal(
                async (inputText) => {
                    let checklistArray = [];
                    checkValues.forEach(checkItem => {
                        checklistArray.push({checked: checkItem.checkBox.checked, text: checkItem.text});
                    });
                    checklistArray.push({checked: false, text: inputText});
                    await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: entry.id, checklist: JSON.stringify(checklistArray)}, settings);
                    loadJobs();
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
                checklistArray.push({checked: checkItem.checkBox.checked, text: checkItem.text});
            });
            await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, {id: entry.id, checklist: JSON.stringify(checklistArray)}, settings);
            // loadPartIssues();
        }
        cardsContainer.appendChild(card);
    };

    tasks.forEach(task => {
        const taskOption = document.createElement('option');
        taskOption.value = task;
        tasksDataList.appendChild(taskOption);
    })
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
    const yesNoModal = document.querySelector("#yes-no-item-modal");
    const yesNoModalYesBtn = document.querySelector("#yes-btn");
    const yesNoModalNoBtn = document.querySelector("#no-btn");
    yesNoModal.style.display = 'flex';
    yesNoModalYesBtn.onclick = () => {
        yesCallback();
        yesNoModal.style.display = 'none';
    };
    yesNoModalNoBtn.onclick = () => {
        yesNoModal.style.display = 'none';
    };
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