


const theme = getLocalStorageValue('theme') || "light";

const addJobBtn = document.querySelector('#add-job-btn');
const addModal= document.querySelector('#add-job-modal');
const addJobOKBtn = document.querySelector('#add-job-ok');
const addJobCancelBtn = document.querySelector('#add-job-cancel');

const tableRows = document.querySelectorAll('.jobs-table tr');
const jobsTable = document.querySelector('#jobs-table');
const grabbers = document.querySelectorAll('.grabber');

const scheduleTabBtn = document.querySelector('#scheduling-tab-btn');
const calendarTabBtn = document.querySelector('#calendar-tab-btn');

const JobPage = document.querySelector('#job-page');
const calendarPage = document.querySelector('#calendar-page');


// INIT CODE
tableRows.forEach((row, index) => {
    if (index === 0) return;
    
    row.addEventListener('dragenter', (event) => {
        row.classList.add('drag-over');
    });
    row.addEventListener('dragleave', (event) => {
        row.classList.remove('drag-over');
    });
    // row.addEventListener('dragstart', (event) => {
    //     jobsTable.style.cursor = "grabbing";
    // });
    // row.addEventListener('dragend', (event) => {
    //     jobsTable.style.cursor = "grab";
    // });
})

// EVENT LISTENERS

addJobBtn.addEventListener('click', (event) => {
    addModal.style.display = 'flex';
});

addJobOKBtn.addEventListener('click', (event) => {
    addModal.style.display = 'none';
});

addJobCancelBtn.addEventListener('click', (event) => {
    addModal.style.display = 'none';
});

scheduleTabBtn.addEventListener('click', () => {
    JobPage.style.display = 'block';
    calendarPage.style.display = 'none';
    scheduleTabBtn.classList.add('tab-btn-active');
    calendarTabBtn.classList.remove('tab-btn-active');
});
calendarTabBtn.addEventListener('click', () => {
    JobPage.style.display = 'none';
    calendarPage.style.display = 'block';
    scheduleTabBtn.classList.remove('tab-btn-active');
    calendarTabBtn.classList.add('tab-btn-active');
});


document.documentElement.setAttribute('data-color-theme', theme);




// FUNCTIONS

function getLocalStorageValue(key) {
    if (window.localStorage[key])
        return JSON.parse(window.localStorage.getItem(key));
}