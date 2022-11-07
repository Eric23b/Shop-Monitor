
export function getTableHeaderRow(headers) {
    const row = document.createElement('tr');
    headers.forEach((header) => {
        const tableHeader = document.createElement('th');
        if (typeof header === 'string') {
            tableHeader.textContent = header;
        }
        else {
            tableHeader.appendChild(header);
        }
        row.appendChild(tableHeader);
    });
    return row;
}
export function getTableDataRow(dataArray) {
    const row = document.createElement('tr');
    dataArray.forEach((data) => {
        const tableData = document.createElement('td');
        tableData.textContent = data;
        row.appendChild(tableData);
    });
    return row;
}

export function getTableDataWithText(text, AddAlertText) {
    const td = document.createElement('td');
    td.textContent = text;
    if ((text) && (AddAlertText)) {
        td.onclick = () => {alert(text)}
        td.style.cursor = "pointer";
    }
    return td;
}

export function getTableDropdown(text, dataList, changeCallback) {
    const select = document.createElement('select');

    dataList.forEach((text) => {
        const option = document.createElement('option');
        option.textContent = text;
        option.value = text;
        select.appendChild(option);
    });
    select.value = text;

    select.onclick = async () => {
        if (changeCallback) {
            changeCallback(select.value);
        }
    }
    return select;
}

export function getTableDataWithEditText(text, promptText, editCallback) {
    const td = document.createElement('td');
    td.textContent = text == "null" ? "" : text;
    td.onclick = () => {
        const newText = prompt(promptText, text == null ? "" : text);
        editCallback(newText);
    }
    td.style.cursor = "pointer";
    return td;
}

export function getTableDataWithProgressBar(percentage) {
    percentage = isNaN(percentage) ? 0 : percentage;
    const td = document.createElement('td');
    const bar = document.createElement('div');
    bar.style.width = percentage + "%";
    bar.style.height = "1.25em";
    bar.style.backgroundColor = "var(--yes)";
    td.style.backgroundColor = "var(--background_hover_color)";
    td.setAttribute('title', percentage + "% completed")
    td.appendChild(bar);
    return td;
}

export function getTableDataWithGrabber() {
    const td = document.createElement('td');
    td.classList.add("grabber");
    td.setAttribute("draggable", "true");
    td.textContent = "⁝";
    return td;
}

export function getTableDataWithCheckbox(checked, asyncCallback) {
    const tableData = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.checked = checked;
    checkbox.onchange = asyncCallback;
    tableData.appendChild(checkbox);
    return tableData;
}

export function getTableDataWithDeleteButton(asyncCallback) {
    const tableData = document.createElement('td');
    const button = document.createElement('button');
    button.textContent = "✖";
    button.title = "Delete";
    button.classList.add("delete-btn");
    button.onclick = asyncCallback;
    tableData.appendChild(button);
    return tableData;
}