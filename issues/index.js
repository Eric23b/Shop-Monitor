import { insertDBEntry, getDBEntrees } from "../db-utilities.js";


const serverSettings = {
    url: "",
    authorization: ""
}

const itemList = [];

const errorMessage = document.querySelector("#error-message");

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

const note = document.querySelector("#note");

const message = document.querySelector("#message");
const submitButton = document.querySelector("#submit-button");

const partIssuesContainer = document.querySelector("#part-issues-container");
const partIssuesTableData = document.querySelector("#part-issues-table");

const supplyIssuesContainer = document.querySelector("#supply-issues-container");
const supplyIssuesTableData = document.querySelector("#supply-issues-table");

let itemsArray = [];


// ---INITIALIZE---

setTheme();

serverSettings.url = getLocalStorageValue('serverURL') || "";
serverSettings.authorization = getLocalStorageValue('serverAuthorization') || "";

if (serverSettings.url && serverSettings.authorization) {
    try {
        loadPartIssues();
        loadSuppliesIssues();
        loadCategoriesSelect();
    } catch (error) {
        showMessage(error);
    }

    setInterval(() => {
    
        loadPartIssues();
        loadSuppliesIssues();
    }, 60000); // 60000 * 20
}
else {
    showMessage("Missing server settings");
}





// ---EVENT LISTENERS---


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
            });
            loadFormMessageForSupplyIssue();
            break;

        case "clock":
            const clockInOut = new Date(timeInput.value);
            data.acknowledged = false;
            data.missedTime = `${clockInOut.toLocaleDateString()} ${clockInOut.toLocaleTimeString()}`;
            data.firstName = clockFirstNameInput.value;
            await insertDBEntry("issues_schema", "time_clock_issues", data, serverSettings);
            loadFormMessageForClockIssue();
            break;

        case "other":
            data.acknowledged = false;
            await insertDBEntry("issues_schema", "other_issues", data, serverSettings);
            loadFormMessageForOtherIssue();
            break;
    
        default:
            break;
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
}

async function loadPartIssues() {
    const response = await getDBEntrees("issues_schema", "parts_issues", "show", true, serverSettings);

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
    const response = await getDBEntrees("issues_schema", "supply_issues", "show", true, serverSettings);

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
            if (!jobNumberInput.value) showMessage("Missing name");
            else if (!cabinetNumberInput.value) showMessage("Missing cabinet number");
            return !!jobNumberInput.value && !!cabinetNumberInput.value && !!partSelect.value;

        case "supplies":
            if (itemList.length <= 0) showMessage("Remember to add item to list");
            return itemList.length > 0;

        case "clock":
            if (!timeInput.value) showMessage("Missing date/time");
            else if (!clockFirstNameInput.value) showMessage("Missing first name");
            return !!timeInput.value && !!clockFirstNameInput.value;

        case "other":
            if (!note.value) showMessage("Add a note");
            return !!note.value;

        default:
            if (!note.value) showMessage("Select an Issue from the drop-down");
            return false;
    }
}

function hideContainers() {
    partContainer.style.display = "none";
    suppliesContainer.style.display = "none";
    clockContainer.style.display = "none";
}

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
    }, 5000);
}