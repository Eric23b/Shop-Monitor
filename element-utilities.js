
export function getDeleteButton(asyncCallback) {
    const button = document.createElement('button');
    button.textContent = "✖";
    button.title = "Delete";
    button.classList.add("delete-btn");
    button.onclick = asyncCallback;
    return button;
}