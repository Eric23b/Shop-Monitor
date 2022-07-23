
import  {
    showAllMessages,
} from "./messaging.js";

const theme = getLocalStorageValue('theme') || "light";
document.documentElement.setAttribute('data-color-theme', theme);

function getLocalStorageValue(key) {
    if (window.localStorage[key])
        return JSON.parse(window.localStorage.getItem(key));
}

const messagesIcon = document.querySelector('#show-messages');
messagesIcon.onclick = showAllMessages;