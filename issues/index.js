import { insertDBEntry, getDBEntrees } from "../db-utilities.js";


const serverSettings = {
    url: "",
    authorization: ""
}

const itemList = [];

const homeBtn = document.querySelector("#home-btn");
const errorMessage = document.querySelector("#error-message");
const settingsBtn = document.querySelector("#settings-btn");

const settingsContainer = document.querySelector("#settings-container");
const serverURL = document.querySelector("#server-url");
const serverAuthorization = document.querySelector("#server-authorization");

const reportContainer = document.querySelector("#report-container");

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

// const otherIssuesContainer = document.querySelector("#other-issues-container");
// const otherIssuesFirstNameInput = document.querySelector("#other-issues-first-name-input");

const note = document.querySelector("#note");

const message = document.querySelector("#message");
const submitButton = document.querySelector("#submit-button");

const partIssuesContainer = document.querySelector("#part-issues-container");
const partIssuesTableData = document.querySelector("#part-issues-table");

const supplyIssuesContainer = document.querySelector("#supply-issues-container");
const supplyIssuesTableData = document.querySelector("#supply-issues-table");

// let optionsData;
let itemsArray = [];


// ---INITIALIZE---

serverSettings.url = serverURL.value = getLocalStorageValue('serverURL') || "";
serverSettings.authorization = serverAuthorization.value = getLocalStorageValue('serverAuthorization') || "";

// showSettings();
if (serverURL.value && serverAuthorization.value) {
    hideSettings();
}

try {
    loadPartIssues();
    loadSuppliesIssues();
    loadCategoriesSelect();
} catch (error) {
    showMessage(error);
}

setInterval(() => {
    if ((!issuesSelect.value) && (!note.value) && (!!serverURL.value) && (!!serverAuthorization.value)) {
        // const refreshLink = document.createElement('a');
        // refreshLink.href = "/";
        // refreshLink.click();
    }

    loadPartIssues();
    loadSuppliesIssues();
}, 60000); // 60000 * 20



// ---EVENT LISTENERS---


addItemToListBtn.addEventListener('click', () => {
    itemList.push({
        category: categorySelect[categorySelect.value].textContent,
        name: itemsSelect.value,
        currentAmount: suppliesEmpty.checked ? "Empty" : "Low",
    });
    updateLowSupplyItemsList();
});

homeBtn.addEventListener("click", () => {
    hideSettings();
});

settingsBtn.addEventListener("click", () => {
    showSettings();
});

serverURL.addEventListener('blur', () => {
    setLocalStorageValue('serverURL', serverURL.value);
    serverSettings.url = serverURL.value;
});

serverAuthorization.addEventListener('blur', function () {
    setLocalStorageValue('serverAuthorization', serverAuthorization.value);
    serverSettings.authorization = serverAuthorization.value;
});

issuesSelect.addEventListener("change", updateContainer);

categorySelect.addEventListener("change", updateCategoryItems);

// Send Button Click
submitButton.addEventListener('click', async (event) => {
    event.preventDefault();

    if (!formFilled()) return;

    const date = new Date();
    let data = {
        time: date.toLocaleTimeString(),
        date: date.toLocaleDateString(),
        note: note.value,
    };

    switch (issuesSelect.value) {
        case "part":
            data.jobName = jobNumberInput.value;
            data.cabinetNumber = cabinetNumberInput.value;
            data.part = partSelect.value;
            data.sent = false;
            data.show = true;
            await insertDBEntry("issues_schema", "parts_issues", data, serverSettings);
            // insertDBEntryOLB("parts_issues", data, serverSettings);
            loadFormMessageForPartIssue();
            break;

        case "supplies":
            itemList.forEach(async (item) => {
                data.category = item.category;
                data.item = item.name ;
                data.currently = item.currentAmount;
                data.ordered = false
                data.show = true;
                await insertDBEntry("issues_schema", "supply_issues", data, serverSettings);
                // await insertDBEntryOLB("supply_issues", data, serverSettings);
            });
            loadFormMessageForSupplyIssue();
            break;

        case "clock":
            const clockInOut = new Date(timeInput.value);
            data.acknowledged = false;
            data.missedTime = `${clockInOut.toLocaleDateString()} ${clockInOut.toLocaleTimeString()}`;
            data.firstName = clockFirstNameInput.value;
            await insertDBEntry("issues_schema", "time_clock_issues", data, serverSettings);
            // insertDBEntryOLB("time_clock_issues", data, serverSettings);
            loadFormMessageForClockIssue();
            break;

        case "other":
            data.acknowledged = false;
            // data.firstName = otherIssuesFirstNameInput.value;
            await insertDBEntry("issues_schema", "other_issues", data, serverSettings);
            // insertDBEntryOLB("other_issues", data, serverSettings);
            loadFormMessageForOtherIssue();
            break;
    
        default:
            break;
    }
});



// ---FUNCTIONS---

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
        console.log(event);
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
    // message.value += suppliesEmpty.checked ? `Supply empty.\n` : `Supply low.\n`;
    // message.value += `${categorySelect.textContent}, ${itemsSelect.value}`;
    // message.value += `${supplies[categorySelect.value].name}, ${itemsSelect.value}`;
}
function loadFormMessageForClockIssue() {
    message.value = "";
    const time = new Date(timeInput.value);
    const options = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true};
    const formattedTime = time.toLocaleString('en-US', options);
    message.value += `${clockFirstNameInput.value} forgot to clock in/out at ${formattedTime}\n`;
}
function loadFormMessageForOtherIssue() {
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
    
            const items = await getDBEntrees("inventory_schema", "supply_list", "category", category, serverSettings);
            // const items = await getDBEntreesOLD("supply_list", "category", category, serverSettings);
            itemsArray[index] = [];
            items.forEach((item) => {
                itemsArray[index].push(item.item);
            });
            updateCategoryItems();
        };
    } catch (error) {
        // showMessage(error);
    }
}

async function getItemCategories() {
    const categories = [];
    const response = await getDBEntrees("inventory_schema", "supply_list", "category", "*", serverSettings);
    // const response = await getDBEntreesOLD("supply_list", "category", "*", serverSettings);

    if (response.error) return;

    response.forEach((item) => {
        if (categories.indexOf(item.category) === -1) {
            categories.push(item.category);
        }
    });
    return categories;
}

function updateCategoryItems() {
    itemsSelect.innerHTML = "";

    // itemsArray[event.target.value].forEach((item) => {
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
    // if (issuesSelect.value === "other") otherIssuesContainer.style.display = "flex";
}

async function loadPartIssues() {
    const response = await getDBEntrees("issues_schema", "parts_issues", "show", true, serverSettings);
    // const response = await getDBEntreesOLD("parts_issues", "show", true, serverSettings);

    if (response.error) return;
    
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
    const response = await getDBEntrees("issues_schema", "supply_issues", "show", true, serverSettings);
    // const response = await getDBEntreesOLD("supply_issues", "show", true, serverSettings);

    if (response.error) return;
    
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

function showSettings() {
    reportContainer.style.display = "none";
    partIssuesContainer.style.display = "none";
    supplyIssuesContainer.style.display = "none";
    settingsContainer.style.display = "block";
    homeBtn.textContent = "⌂";
    homeBtn.style.fontSize = "4rem";
}

function hideSettings() {
    settingsContainer.style.display = "none";
    partIssuesContainer.style.display = "block";
    reportContainer.style.display = "block";
    supplyIssuesContainer.style.display = "block";
    homeBtn.textContent = "↺";
    homeBtn.style.fontSize = "3rem";
}

function formFilled() {
    if (!issuesSelect.value) return false;

    switch (issuesSelect.value) {
        case "part":
            return !!jobNumberInput.value && !!cabinetNumberInput.value && !!partSelect.value;

        case "supplies":
            return itemList.length > 0;

        case "clock":
            return !!timeInput.value && !!clockFirstNameInput.value;

        case "other":
            return !!note.value;

        default:
            return false;
    }
}

function hideContainers() {
    partContainer.style.display = "none";
    suppliesContainer.style.display = "none";
    clockContainer.style.display = "none";
    // otherIssuesContainer.style.display = "none";
}

// async function getDBEntreesOLD(table, searchColumn, searchValue, serverSettings) {
//     const myHeaders = new Headers();
//     myHeaders.append("Content-Type", "application/json");
//     myHeaders.append("Authorization", `Basic ${serverSettings.authorization}`);

//     const raw = JSON.stringify({
//         "operation": "search_by_value",
//         "schema": "issues_schema",
//         "table": table,
//         "search_attribute": searchColumn,
//         "search_value": searchValue,
//         "get_attributes": ["*"]
//     });

//     const requestOptions = {
//         method: 'POST',
//         headers: myHeaders,
//         body: raw,
//         redirect: 'follow'
//     };

//     const response = await fetch(serverSettings.url, requestOptions);
//     // if (!response.ok) {
//     //     showMessage(`DB error: ${response.statusText}`);
//     // }
//     const data = await response.json();
//     // console.log(data);
//     return data;
// }

// async function insertDBEntryOLB(table, data, serverSettings) {
//     const myHeaders = new Headers();
//     myHeaders.append("Content-Type", "application/json");
//     myHeaders.append("Authorization", `Basic ${serverSettings.authorization}`);

//     const raw = JSON.stringify({
//         "operation": "insert",
//         "schema": "issues_schema",
//         "table": table,
//         "records": [
//             data
//         ],
//     });

//     const requestOptions = {
//         method: 'POST',
//         headers: myHeaders,
//         body: raw,
//         redirect: 'follow'
//     };

//     const response = await fetch(serverSettings.url, requestOptions);
//     // if (!response.ok) {
//     //     showMessage(`DB error: ${response.statusText}`);
//     // }
//     const text = await response.text();
//     console.log(text);
// }

function getLocalStorageValue(key) {
    if (window.localStorage[key])
        return JSON.parse(window.localStorage.getItem(key));
}

function setLocalStorageValue(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
}

function showMessage(messageText) {
    errorMessage.textContent = messageText;
    setTimeout(() => {
        errorMessage.textContent = "";
    }, 4000);
}