const modalBackgroundStyles = `
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    background: var(--background_color_transparent);
    background-color: var(--background_transparent_color);
    z-index: 100;`;

const modalWindowStyles = `
    padding: 0.5rem;
    border: 1px solid var(--border_color);
    background-color: var(--background_color);`;

const modalTitleStyles = `
    text-align: center;
    white-space: pre-line;`;

const modalButtonContainerStyles = `
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    gap: 1rem;`;

 const modalButtonStyles = `
    cursor: pointer;
    padding: 0.5rem 1rem;
    font-size: larger;
    border: 1px solid var(--border_color);
    border-radius: 0.25rem;
    color: var(--color);
    background: var(--background_color);`;

const btnMouseOver = (event) => {
    event.target.style.color = 'var(--background_color)';
    event.target.style.backgroundColor = 'var(--color)';
}

const btnMouseLeave = (event) => {
    event.target.style.color = 'var(--color)';
    event.target.style.backgroundColor = 'var(--background_color)';
}

export function showAlertDialog(message, okCallback) {
    const body = document.querySelector('body');

    const modalBackground = document.createElement('section');
    modalBackground.style.cssText = modalBackgroundStyles;

    const modalWindow = document.createElement('div');
    modalWindow.style.cssText = modalWindowStyles;

    const modalTitle = document.createElement('h2');
    modalTitle.style.cssText = modalTitleStyles;
    modalTitle.textContent = message;

    const modalButtonContainer = document.createElement('div');
    modalButtonContainer.style.cssText = modalButtonContainerStyles;

    const modalOKButton = document.createElement('button');
    modalOKButton.textContent = "Ok";
    modalOKButton.style.cssText = modalButtonStyles;

    modalButtonContainer.appendChild(modalOKButton);
    modalWindow.appendChild(modalTitle);
    modalWindow.appendChild(modalButtonContainer);
    modalBackground.appendChild(modalWindow);
    body.appendChild(modalBackground);

    modalOKButton.focus();

    modalOKButton.onclick = () => {
        if (okCallback) okCallback();
        body.removeChild(modalBackground);
    }

    modalOKButton.onmouseover = btnMouseOver;
    modalOKButton.onmouseleave = btnMouseLeave;
}

export function showYesNoDialog(message, yesCallback, noCallback) {
    const body = document.querySelector('body');

    const modalBackground = document.createElement('section');
    modalBackground.style.cssText = modalBackgroundStyles;

    const modalWindow = document.createElement('div');
    modalWindow.style.cssText = modalWindowStyles;

    const modalTitle = document.createElement('h2');
    modalTitle.style.cssText = modalTitleStyles;
    modalTitle.textContent = message;

    const modalButtonContainer = document.createElement('div');
    modalButtonContainer.style.cssText = modalButtonContainerStyles;

    const modalYesButton = document.createElement('button');
    modalYesButton.textContent = "Yes";
    modalYesButton.style.cssText = modalButtonStyles;

    const modalNoButton = document.createElement('button');
    modalNoButton.textContent = "No";
    modalNoButton.style.cssText = modalButtonStyles;

    modalButtonContainer.appendChild(modalNoButton);
    modalButtonContainer.appendChild(modalYesButton);
    modalWindow.appendChild(modalTitle);
    modalWindow.appendChild(modalButtonContainer);
    modalBackground.appendChild(modalWindow);
    body.appendChild(modalBackground);

    modalYesButton.focus();

    modalYesButton.onclick = () => {
        if (yesCallback) yesCallback();
        body.removeChild(modalBackground);
    }

    modalYesButton.onmouseover = btnMouseOver;
    modalYesButton.onmouseleave = btnMouseLeave;

    modalNoButton.onclick = () => {
        if (noCallback) noCallback();
        body.removeChild(modalBackground);
    }

    modalNoButton.onmouseover = btnMouseOver;
    modalNoButton.onmouseleave = btnMouseLeave;
}