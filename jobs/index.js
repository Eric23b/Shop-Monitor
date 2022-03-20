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

const addCheckboxModal = document.querySelector("#add-check-item-modal");
const addCheckboxModalInput = document.querySelector("#add-checkbox-input");
const addCheckboxModalOk = document.querySelector("#add-checkbox-ok-btn");
const addCheckboxModalCancel = document.querySelector("#add-checkbox-cancel-btn");

const yesNoModal = document.querySelector("#yes-no-item-modal");
const yesNoModalYesBtn = document.querySelector("#yes-btn");
const yesNoModalNoBtn = document.querySelector("#no-btn");

const tasksDataList = document.querySelector("#tasks");


// Retrieve settings values
settings.url = getLocalStorageValue('serverURL') || "";
settings.authorization = getLocalStorageValue('serverAuthorization') || "";

setTheme();

loadPartIssues();


// Load Parts Issues Table
async function loadPartIssues() {
    const response = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "__createdtime__", "*", settings);
    
    if ((!response) || (response.error)) return;
    
    response.sort((a, b) => {return b.__createdtime__ - a.__createdtime__});

    console.log(response);

    cardsContainer.innerHTML = "";

    tasksDataList.innerHTML = "";
    const tasks = [];

    let checkLabelID = 0;

    for (const entry of response) {
        if (!entry.active) continue;

        // console.log(entry);
        const card = document.createElement('section');
        card.classList.add('card')
        
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
        
        if (entry.checklist) {
            for (const checkItem of entry.checklist) {
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
                        loadPartIssues();
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
                    loadPartIssues();
                });
        };

        card.appendChild(cardTitle);
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