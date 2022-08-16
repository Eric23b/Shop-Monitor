
export function getTableHeaderRow(headers) {
    let htmlText = "<tr>";
    headers.forEach((header) => {
        htmlText += `<th>${header}</th>`;
    });
    htmlText += "</tr>";
    return htmlText;
}
export function getTableDataRow(dataArray) {
    let htmlText = "<tr>";
    for (const data of dataArray) {
        htmlText += `<td>${data || ""}</td>`;
    }
    htmlText += "</tr>";
    return htmlText;
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
    const td = document.createElement('td');
    const bar = document.createElement('div');
    bar.style.width = percentage + "%";
    bar.style.height = "1.25em";
    bar.style.backgroundColor = "var(--yes)";
    td.style.backgroundColor = "var(--background_hover_color)";
    td.appendChild(bar);
    return td;
}

{/* <td class="grabber" draggable="true">⁝</td> */}
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