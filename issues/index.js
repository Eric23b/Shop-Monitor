import { 
    insertDBEntry, 
    getDBEntrees,
    updateDBEntry,
    isSuperUser,
    getUserInfo,
} from "../db-utilities.js";

import {
    LOGS_SCHEMA,
    // TIMER_TABLE,
    RUNNING_TIMER_TABLE,
    COMPLETED_TIMER_TABLE,
    BUSINESS_SCHEMA,
    INVENTORY_SCHEMA,
    SUPPLY_LIST_TABLE,
    EMPLOYEES_TABLE,
    STATIONS_TABLE,
    JOBS_TABLE,
} from "../directives.js";

import {
    stopRunningTimer,
    startOverTimeTimer,
    addNumberOfRunningTimersToTimerPageLink,
} from "../timer-utilities.js";

import {
    showYesNoDialog,
    showAlertDialog,
    showInputDialog,
    showJobDialog,
    showCalendarEventDialog,
} from "../dialogs.js";

const settings = {
    url: "",
    authorization: ""
}
let station = "";

const itemList = [];

const errorMessage = document.querySelector("#error-message");

const reportContainer = document.querySelector("#report-container");

const timerPageLink = document.querySelector('.timer-page-link');

const issuesSelect = document.querySelector("#issues-select");

const partContainer = document.querySelector("#part-container");
const jobNumberInput = document.querySelector("#job-number");
const cabinetNumberInput = document.querySelector("#cabinet-number");
const partSelect = document.querySelector("#part-select");

const suppliesContainer = document.querySelector("#supplies-container");
const categorySelect = document.querySelector("#category-select");
const itemsSelect = document.querySelector("#items-select");
const suppliesEmpty = document.querySelector("#supplies-empty");
const addItemToListBtn = document.querySelector("#add-item-to-list");
const itemListContainer = document.querySelector("#item-list-container");

const clockContainer = document.querySelector("#clock-container");
const timeInput = document.querySelector("#time-input");
const clockFirstNameInput = document.querySelector("#first-name-input");

const note = document.querySelector("#note");

const additionalSuppliesContainer = document.querySelector("#additional-supplies-container");
const additionalSuppliesJob = document.querySelector("#additional-supplies-job-number");
const additionalSuppliesSupply = document.querySelector("#additional-supplies-supply-number");

const message = document.querySelector("#message");
const sendButton = document.querySelector("#send-button");
const submitButton = document.querySelector("#submit-button");

const partIssuesContainer = document.querySelector("#part-issues-container");
const partIssuesTableData = document.querySelector("#part-issues-table");

const supplyIssuesContainer = document.querySelector("#supply-issues-container");
const supplyIssuesTableData = document.querySelector("#supply-issues-table");

// const jobNamesSelect = document.querySelector("#job-name-select");

const suppliesDataList = document.querySelector("#supply-datalist");


let itemsArray = [];


// ---INITIALIZE---

setTheme();

settings.url = getLocalStorageValue('serverURL') || "";
settings.authorization = getLocalStorageValue('serverAuthorization') || "";
station = getLocalStorageValue('stationName') || "";


const superUser = await isSuperUser(settings);
if (superUser) {
    const superUserElements = document.querySelectorAll('.super-user');
    superUserElements.forEach((element) => {
        element.classList.remove('super-user');
    });
}


if (settings.url && settings.authorization) {
    try {
        loadPartIssues();
        loadSuppliesIssues();
        loadCategoriesSelect();
        loadJobs();
        loadDataListWithSupplies();
    } catch (error) {
        showAlertDialog(error);
    }

    setInterval(() => {
        loadPartIssues();
        loadSuppliesIssues();
    }, 60000); // 60000 * 20
}
else {
    showAlertDialog("Missing server settings");
}

startOverTimeTimer(station, settings, stopRunningTimer);

addNumberOfRunningTimersToTimerPageLink(timerPageLink, station, settings);



// ---EVENT LISTENERS---

// Got to home page
window.onkeydown = (event) => {
    if (event.key === "8" && event.ctrlKey) window.location = "/";
}

addItemToListBtn.addEventListener('click', () => {
    itemList.push({
        category: categorySelect[categorySelect.value].textContent,
        name: itemsSelect.value,
        currentAmount: suppliesEmpty.checked ? "Empty" : "Low",
    });
    updateLowSupplyItemsList();
});

issuesSelect.addEventListener("change", updateContainer);

categorySelect.addEventListener("change", updateCategoryItems);

// Send Button Click
sendButton.addEventListener('click', async (event) => {
    event.preventDefault();

    if (!formFilled()) {
        // event.preventDefault();
        return;
    }

    const date = new Date();
    let data = {
        time: date.toLocaleTimeString(),
        date: date.toLocaleDateString(),
        note: note.value,
    };

    let sendEmail = false;

    switch (issuesSelect.value) {
        case "part":
            data.jobName = jobNumberInput.value;
            data.cabinetNumber = cabinetNumberInput.value;
            data.part = partSelect.value;
            data.sent = false;
            data.show = true;
            await insertDBEntry("issues_schema", "parts_issues", data, settings);
            loadFormMessageForPartIssue();
            console.log('Part Issue sent');
            sendEmail = true;
            break;

        case "supplies":
            if (itemList.length <= 0) {
                showAlertDialog("Add items to list first");
                event.preventDefault();
                return;
            }
            for (const item of itemList) {
                data.category = item.category;
                data.item = item.name ;
                data.currently = item.currentAmount;
                data.ordered = false
                data.show = true;
                await insertDBEntry("issues_schema", "supply_issues", data, settings);
            }
            loadFormMessageForSupplyIssue();
            console.log('Supply Issue sent');
            sendEmail = true;
            break;

        case "clock":
            const clockInOut = new Date(timeInput.value);
            data.acknowledged = false;
            data.missedTime = `${clockInOut.toLocaleDateString()} ${clockInOut.toLocaleTimeString()}`;
            data.firstName = clockFirstNameInput.value;
            await insertDBEntry("issues_schema", "time_clock_issues", data, settings);
            loadFormMessageForClockIssue();
            console.log('Time Clock Issue sent');
            sendEmail = true;
            break;

        case "other":
            data.acknowledged = false;
            await insertDBEntry("issues_schema", "other_issues", data, settings);
            loadFormMessageForOtherIssue();
            console.log('Other Issue sent');
            sendEmail = true;
            break;

        case "additional":
            const jobID = additionalSuppliesJob.children[additionalSuppliesJob.value].getAttribute("db_id");
            const jobs = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "id", jobID, settings);
            if (jobs[0].additionalSupplies == null) {
                jobs[0].additionalSupplies = [];
            }
            jobs[0].additionalSupplies.push({supplies: additionalSuppliesSupply.value, note: note.value});
            await updateDBEntry(BUSINESS_SCHEMA, JOBS_TABLE, jobs[0], settings);
            loadFormMessageForAdditionalSupplies();
            console.log('Additional supplies sent');
            sendEmail = false;
            break;

        default:
            break;
    }

    // const a = document.createElement('a');
    // a.href = "/success.html";
    // a.click();

    if (sendEmail) {
        submitButton.click();
    }
    else {
        const a = document.createElement('a');
        a.href = "/issues.html";
        a.click();
    }

});



// ---FUNCTIONS---

function setTheme() {
    const theme = getLocalStorageValue('theme') || "light";
    document.documentElement.setAttribute('data-color-theme', theme);
}

function updateLowSupplyItemsList() {
    itemListContainer.innerHTML = ``;
    itemList.forEach((item, index) => {
        const listItem = getItemElement(item.category, item.name, item.currentAmount, index);
        itemListContainer.appendChild(listItem);
    })
};

function getItemElement(category, item, currentAmount, index) {
    const categoryLabel = document.createElement("p");
    categoryLabel.innerHTML = `${category}<br/>${item}<br/>${currentAmount}`;
    categoryLabel.classList.add("list-item");
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "✖";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.onclick = (event) => {
        if (event.target.tagName !== "BUTTON") return;
        itemList.splice(index, 1);
        updateLowSupplyItemsList();
    }
    categoryLabel.appendChild(deleteBtn);
    return categoryLabel;
}

function loadFormMessageForPartIssue() {
    message.value = "";
    message.value += "Missing or damaged part.\n";
    message.value += `Job#: ${jobNumberInput.value}\n`;
    message.value += `Cabinet#: ${cabinetNumberInput.value}\n`;
    message.value += `Part: ${partSelect.value}`;
}
function loadFormMessageForSupplyIssue() {
    message.value = "";
    for (const item of itemList) {
        message.value += `Supplies ${item.currentAmount}\nCategory: ${item.category}\nItem:${item.name}\n----------------\n`;
    }
}
function loadFormMessageForClockIssue() {
    message.value = "";
    const time = new Date(timeInput.value);
    const options = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true};
    const formattedTime = time.toLocaleString('en-US', options);
    message.value += `${clockFirstNameInput.value} forgot to clock in/out on ${formattedTime}\n`;
}

function loadFormMessageForOtherIssue() {
    message.value = "";
}

function loadFormMessageForAdditionalSupplies() {
    message.value = "";
}

async function loadCategoriesSelect() {
    const categories = await getItemCategories();
    itemsArray = categories;
    
    try {        
        categorySelect.innerHTML = "";
        for (let index = 0; index < categories.length; index++) {
            const category = categories[index];
        
            const option = document.createElement("option");
            option.textContent = category;
            option.value = index;
            categorySelect.appendChild(option);
    
            const items = await getDBEntrees("inventory_schema", "supply_list", "category", category, settings);
            itemsArray[index] = [];
            items.forEach((item) => {
                itemsArray[index].push(item.item);
            });
            updateCategoryItems();
        };
    } catch (error) {
        // showAlertDialog(error);
    }
}

async function getItemCategories() {
    const categories = [];
    const response = await getDBEntrees("inventory_schema", "supply_list", "category", "*", settings);

    if ((!response) || (response.error)) return;

    response.sort((a, b) => {
        const categoryA = a.category.toUpperCase();
        const categoryB = b.category.toUpperCase();
        if (categoryA < categoryB) return -1;
        if (categoryA > categoryB) return 1;
        return 0;
      });

    response.forEach((item) => {
        if (categories.indexOf(item.category) === -1) {
            categories.push(item.category);
        }
    });
    return categories;
}

function updateCategoryItems() {
    itemsSelect.innerHTML = "";

    itemsArray[categorySelect.value].forEach((item) => {
        const option = document.createElement("option");
        option.textContent = item;
        option.value = item;
        itemsSelect.appendChild(option);
    });
}

function updateContainer() {
    hideContainers();

    if (!issuesSelect.value) return;
    
    if (issuesSelect.value === "part") partContainer.style.display = "flex";
    if (issuesSelect.value === "supplies") suppliesContainer.style.display = "flex";
    if (issuesSelect.value === "clock") clockContainer.style.display = "flex";
    if (issuesSelect.value === "additional") additionalSuppliesContainer.style.display = "flex";
}

async function loadPartIssues() {
    const response = await getDBEntrees("issues_schema", "parts_issues", "show", true, settings);

    if ((!response) || (response.error)) return;
    
    response.sort((a, b) => {return b.__createdtime__ - a.__createdtime__});

    partIssuesTableData.innerHTML = 
        `<tr>
            <th>Job</th>
            <th>Cabinet</th>
            <th>Part</th>
            <th>Sent</th>
        </tr>`;

    response.forEach(element => {
        const row = document.createElement('tr');
        const job = document.createElement('td');
        const cabinetNumber = document.createElement('td');
        const part = document.createElement('td');
        const sent = document.createElement('td');

        job.textContent = element.jobName;
        cabinetNumber.textContent = element.cabinetNumber;
        part.textContent = element.part;
        sent.textContent = element.sent ? "Yes" : "No";
        sent.style.color = element.sent ? "var(--yes)" : "var(--no)";

        row.appendChild(job);
        row.appendChild(cabinetNumber);
        row.appendChild(part);
        row.appendChild(sent);
        
        partIssuesTableData.appendChild(row);
    });
}

async function loadSuppliesIssues() {
    const response = await getDBEntrees("issues_schema", "supply_issues", "show", true, settings);

    if ((!response) || (response.error)) return;
    
    response.sort((a, b) => {return b.__createdtime__ - a.__createdtime__});

    supplyIssuesTableData.innerHTML = 
        `<tr>
            <th>Category</th>
            <th>Item</th>
            <th>Ordered</th>
        </tr>`;

    response.forEach(element => {
        const row = document.createElement('tr');
        const category = document.createElement('td');
        const item = document.createElement('td');
        const ordered = document.createElement('td');

        category.textContent = element.category;
        item.textContent = element.item;
        ordered.textContent = element.ordered ? "Yes" : "No";
        ordered.style.color = element.ordered ? "var(--yes)" : "var(--no)";

        row.appendChild(category);
        row.appendChild(item);
        row.appendChild(ordered);
        
        supplyIssuesTableData.appendChild(row);
    });
}

function formFilled() {
    // if (!issuesSelect.value) return false;

    switch (issuesSelect.value) {
        case "part":
            if (!jobNumberInput.value) showAlertDialog("Missing job name");
            else if (!cabinetNumberInput.value) showAlertDialog("Missing cabinet number");
            return !!jobNumberInput.value && !!cabinetNumberInput.value && !!partSelect.value;

        case "supplies":
            if (itemList.length <= 0) showAlertDialog("Remember to add items to list");
            return itemList.length > 0;

        case "clock":
            if (!timeInput.value) showAlertDialog("Missing date/time");
            else if (!clockFirstNameInput.value) showAlertDialog("Missing first name");
            return !!timeInput.value && !!clockFirstNameInput.value;

        case "other":
            if (!note.value) showAlertDialog("Add a note");
            return !!note.value;

        case "additional":
            const jobName = additionalSuppliesJob.children[additionalSuppliesJob.value].textContent;
            if (!jobName) showAlertDialog("Missing job name");
            else if (!additionalSuppliesSupply.value) showAlertDialog("Missing supply name");
            return !!jobName && !!additionalSuppliesSupply.value;

        default:
            showAlertDialog("Select an Issue from the drop-down");
            return false;
    }
}

function hideContainers() {
    partContainer.style.display = "none";
    suppliesContainer.style.display = "none";
    clockContainer.style.display = "none";
    additionalSuppliesContainer.style.display = "none";
}

function getLocalStorageValue(key) {
    if (window.localStorage[key])
        return JSON.parse(window.localStorage.getItem(key));
}

function setLocalStorageValue(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
}

// function showMessage(messageText) {
//     errorMessage.textContent = messageText;
//     setTimeout(() => {
//         errorMessage.textContent = "";
//     }, 6000);
// }

async function loadJobs() {
    const jobsResponse = await getDBEntrees(BUSINESS_SCHEMA, JOBS_TABLE, "active", true, settings);
    if ((!jobsResponse) || (jobsResponse.error)) {
        showAlertDialog("Error loading jobs");
    }
    else {
        jobsResponse.sort((a, b) => {
            const nameA = String(a.name).toUpperCase();
            const nameB = String(b.name).toUpperCase();
            if (nameA < nameB) return 1;
            if (nameA > nameB) return -1;
            return 0;
        });
        loadSelectFromArray(additionalSuppliesJob, "name", true, jobsResponse);
    }
}

function loadSelectFromArray(selectElement, textAttribute, setID, array, addBlank) {
    selectElement.innerHTML = "";

    if (addBlank) {
        const option = document.createElement("option");
        option.setAttribute("disabled", true);
        option.setAttribute("selected", true);
        option.textContent = "";
        option.value = "";
        selectElement.appendChild(option);
    }

    array.forEach((element, index) => {
        const option = document.createElement("option");
        option.textContent = element[textAttribute] || element;
        if (setID) option.setAttribute('db_id', element.id);
        option.value = index;
        selectElement.appendChild(option);
    });
}

async function loadDataListWithSupplies() {
    // const filter = categoryFilterInput.value || "*";
    
    const response = await getDBEntrees(INVENTORY_SCHEMA, SUPPLY_LIST_TABLE, "__createdtime__", "*", settings);
    
    if ((!response) || (response.error)) return;
    
    response.sort((a, b) => {
        const categoryA = a.category.toUpperCase();
        const categoryB = b.category.toUpperCase();
        if (categoryA < categoryB) return -1;
        if (categoryA > categoryB) return 1;
        return 0;
    });

    response.forEach((supply) => {
        const option = document.createElement("option");
        option.value = supply.item;
        suppliesDataList.appendChild(option);
    });
}