
export function getTableHeaderRow(headers) {
    let htmlText = "<tr>";
    headers.forEach((header) => {
        htmlText += `<th>${header}</th>`;
    });
    htmlText += "</tr>";
    return htmlText;
}

export function getTableDataWithText(text, AddAlertText) {
    const td = document.createElement('td');
    td.textContent = text;
    if (AddAlertText) {
        td.onclick = () => {alert(text)}
        td.style.cursor = "pointer";
    }
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
    button.classList.add("delete-btn");
    button.onclick = asyncCallback;
    tableData.appendChild(button);
    return tableData;
}