const serverSettings = {
    url: "",
    authorization: ""
}

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

const clockContainer = document.querySelector("#clock-container");
const timeInput = document.querySelector("#time-input");
const clockFirstNameInput = document.querySelector("#first-name-input");

const otherIssuesContainer = document.querySelector("#other-issues-container");
const otherIssuesFirstNameInput = document.querySelector("#other-issues-first-name-input");

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
        const refreshLink = document.createElement('a');
        refreshLink.href = "/";
        refreshLink.click();
    }
}, 60000 * 20);



// ---EVENT LISTENERS---

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
submitButton.addEventListener('click', (event) => {
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
            insertDBEntry("parts_issues", data, serverSettings);
            loadFormMessageForPartIssue();
            break;

        case "supplies":
            data.category = categorySelect[categorySelect.value].textContent;
            data.item = itemsSelect.value;
            data.currently = suppliesEmpty.checked ? "Empty" : "Low";
            data.ordered = false
            data.show = true;
            insertDBEntry("supply_issues", data, serverSettings);
            loadFormMessageForSupplyIssue();
            break;

        case "clock":
            const clockInOut = new Date(timeInput.value);
            data.acknowledged = false;
            data.missedTime = `${clockInOut.toLocaleDateString()} ${clockInOut.toLocaleTimeString()}`;
            data.firstName = clockFirstNameInput.value;
            insertDBEntry("time_clock_issues", data, serverSettings);
            loadFormMessageForClockIssue();
            break;

        case "other":
            data.acknowledged = false;
            data.firstName = otherIssuesFirstNameInput.value;
            console.log(otherIssuesFirstNameInput);
            insertDBEntry("other_issues", data, serverSettings);
            loadFormMessageForOtherIssue();
            break;
    
        default:
            break;
    }
});



// ---FUNCTIONS---

function loadFormMessageForPartIssue() {
    message.value = "";
    message.value += "Missing or damaged part.\n";
    message.value += `Job#: ${jobNumberInput.value}\n`;
    message.value += `Cabinet#: ${cabinetNumberInput.value}\n`;
    message.value += `Part: ${partSelect.value}`;
}
function loadFormMessageForSupplyIssue() {
    message.value = "";
    message.value += suppliesEmpty.checked ? `Supply empty.\n` : `Supply low.\n`;
    message.value += `${categorySelect.textContent}, ${itemsSelect.value}`;
    // message.value += `${supplies[categorySelect.value].name}, ${itemsSelect.value}`;
}
function loadFormMessageForClockIssue() {
    message.value = "";
    const time = new Date(timeInput.value);
    const options = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true};
    const formattedTime = time.toLocaleString('en-US', options);
    message.value += `Forgot to clock in/out at ${formattedTime}\n`;
}
function loadFormMessageForOtherIssue() {
    message.value = "";
    const time = new Date(timeInput.value);
    const options = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true};
    const formattedTime = time.toLocaleString('en-US', options);
    message.value += `Forgot to clock in/out at ${formattedTime}\n`;
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
    
            const items = await getDBEntrees("supply_list", "category", category, serverSettings)
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
    const response = await getDBEntrees("supply_list", "category", "*", serverSettings);

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
    if (issuesSelect.value === "other") otherIssuesContainer.style.display = "flex";
}

async function loadPartIssues() {
    const response = await getDBEntrees("parts_issues", "show", true, serverSettings);

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
    const response = await getDBEntrees("supply_issues", "show", true, serverSettings);

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
        case "other":
            return !!note.value;

        case "part":
            return !!jobNumberInput.value && !!cabinetNumberInput.value && !!partSelect.value;

        case "supplies":
            return !!categorySelect.value && !!itemsSelect.value;

        case "clock":
            return !!timeInput.value && !!clockFirstNameInput.value;
    
        default:
            return false;
    }
}

function hideContainers() {
    partContainer.style.display = "none";
    suppliesContainer.style.display = "none";
    clockContainer.style.display = "none";
    otherIssuesContainer.style.display = "none";
}

async function getDBEntrees(table, searchColumn, searchValue, serverSettings) {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Basic ${serverSettings.authorization}`);

    const raw = JSON.stringify({
        "operation": "search_by_value",
        "schema": "issues_schema",
        "table": table,
        "search_attribute": searchColumn,
        "search_value": searchValue,
        "get_attributes": ["*"]
    });

    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    const response = await fetch(serverSettings.url, requestOptions);
    // if (!response.ok) {
    //     showMessage(`DB error: ${response.statusText}`);
    // }
    const data = await response.json();
    // console.log(data);
    return data;
}

async function insertDBEntry(table, data, serverSettings) {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Basic ${serverSettings.authorization}`);

    const raw = JSON.stringify({
        "operation": "insert",
        "schema": "issues_schema",
        "table": table,
        "records": [
            data
        ],
    });

    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    const response = await fetch(serverSettings.url, requestOptions);
    // if (!response.ok) {
    //     showMessage(`DB error: ${response.statusText}`);
    // }
    const text = await response.text();
    console.log(text);
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
    }, 4000);
}