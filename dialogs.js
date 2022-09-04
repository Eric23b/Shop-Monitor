const modalBackgroundStyles = `
        position: fixed;
        inset: 0;
        display: grid;
        justify-content: center;
        align-items: center;
        background: var(--background_color_transparent);
        background-color: var(--background_transparent_color);
        z-index: 100;
        overflow: scroll;
    `;

const modalWindowStyles = `
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 0.5rem;
        width: max-content;
        max-width: 100%;
        height: max-content;
        border: 1px solid var(--border_color);
        background-color: var(--background_color);
    `;

const modalTitleStyles = `
        text-align: center;
        white-space: pre-line;
    `;

const modalButtonContainerStyles = `
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 1rem;
        font-size: larger;
    `;

 const modalButtonStyles = `
        cursor: pointer;
        padding: 0.5rem 1rem;
        font-size: larger;
        border: 1px solid var(--border_color);
        border-radius: 0.25rem;
        color: var(--color);
        background: var(--background_color);
    `;

const modalInputStyles = `
        padding: 0.25rem;
        font-size: larger;
        border: 1px solid var(--border_color);
    `;

const modalInputTextAreaStyles = `
        padding: 0.25rem;
        font-size: larger;
        border: 1px solid var(--border_color);
    `;

// Input Dialog
export function showInputDialog(message, defaultText, OKCallback, cancelCallback, inputType, placeholder) {
    const body = document.querySelector('body');
    const modalBackground = getModalBackground();
    const modalWindow = getModalWindow();
    const modalTitle = getModalTitle(message);

    let modalInput;
    if (inputType === 'textarea') {
        modalInput = document.createElement('textarea');
        modalInput.style.cssText = modalInputTextAreaStyles;
    }
    else {
        modalInput = document.createElement('input');
        modalInput.style.cssText = modalInputStyles;
        if (inputType) modalInput.setAttribute('type', inputType);
    }
    modalInput.value = defaultText;
    if (placeholder) modalInput.setAttribute('placeholder', placeholder);

    const modalOKButton = getButton("OK", () => {
        if (OKCallback) OKCallback(modalInput.value);
        body.removeChild(modalBackground);
    });

    const modalCancelButton = getButton("Cancel", () => {
        if (cancelCallback) cancelCallback(defaultText);
        body.removeChild(modalBackground);
    });

    const modalButtonContainer = getButtonContainer(modalCancelButton, modalOKButton);

    modalWindow.append(modalTitle, modalInput, modalButtonContainer);
    modalBackground.appendChild(modalWindow);
    body.appendChild(modalBackground);

    modalInput.focus();
}

// Alert
export function showAlertDialog(message, okCallback) {
    const body = document.querySelector('body');
    const modalBackground = getModalBackground();
    const modalWindow = getModalWindow();
    const modalTitle = getModalTitle(message);
    
    const modalOKButton = getButton("OK", () => {
        if (okCallback) okCallback();
        body.removeChild(modalBackground);
    });

    const modalButtonContainer = getButtonContainer(modalOKButton);

    modalButtonContainer.appendChild(modalOKButton);
    modalWindow.append(modalTitle, modalButtonContainer);
    modalBackground.appendChild(modalWindow);
    body.appendChild(modalBackground);

    // modalOKButton.focus();
}

// Yes/No or Confirm Dialog
export function showYesNoDialog(message, yesCallback, noCallback) {
    const body = document.querySelector('body');
    const modalBackground = getModalBackground();
    const modalWindow = getModalWindow();
    const modalTitle = getModalTitle(message);

    const modalYesButton = getButton("Yes", () => {
        if (yesCallback) yesCallback();
        body.removeChild(modalBackground);
    });

    const modalNoButton = getButton("No", () => {
        if (noCallback) noCallback();
        body.removeChild(modalBackground);
    });

    const modalButtonContainer = getButtonContainer(modalNoButton, modalYesButton);

    modalWindow.append(modalTitle, modalButtonContainer);
    modalBackground.appendChild(modalWindow);
    body.appendChild(modalBackground);
    
    // modalYesButton.focus();
}

function getModalBackground() {
    const background = document.createElement('section');
    background.style.cssText = modalBackgroundStyles;
    return background
}

function getModalWindow() {
    const window = document.createElement('div');
    window.style.cssText = modalWindowStyles;
    return window
}

function getModalTitle(message) {
    const title = document.createElement('h2');
    title.style.cssText = modalTitleStyles;
    title.textContent = message;
    return title;
}

function getButton(text, callback) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = modalButtonStyles;
    btn.onclick = callback;
    btn.onmouseover = btnMouseOver;
    btn.onmouseleave = btnMouseLeave;
    return btn;
}

function getButtonContainer() {
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = modalButtonContainerStyles;
    buttonContainer.append(...arguments);
    return buttonContainer;
}

const btnMouseOver = (event) => {
    event.target.style.color = 'var(--background_color)';
    event.target.style.backgroundColor = 'var(--color)';
}

const btnMouseLeave = (event) => {
    event.target.style.color = 'var(--color)';
    event.target.style.backgroundColor = 'var(--background_color)';
}