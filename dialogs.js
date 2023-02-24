import {
    getDueInDaysFromNowText,
    getCorrectDateOrder,
    getToday,
    incWorkDay,
    getClosedDatesArray,
    getShortDateText,
    formatDateToCA,
} from "../date-utilities.js";

import {
    isDev,
    isProd,
} from "../build.js";


// Add to main Style Sheet
const styles = `
    .dialogs-disable-select {
        -webkit-user-select: none;  
        -moz-user-select: none;    
        -ms-user-select: none;      
        user-select: none;
    }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);


const modalBackgroundStyles = `
    position: fixed;
    inset: 0;
    display: grid;
    justify-content: center;
    align-items: center;
    background-color: var(--background_transparent_color);
    z-index: 100;
    overflow: scroll;`;

const modalWindowStyles = `
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 0.5rem;
    max-width: 100%;
    height: max-content;
    border: 1px solid var(--border_color);
    background-color: var(--background_color);`;

const modalTitleStyles = `
    text-align: center;
    white-space: pre-line;`;

const modalButtonContainerStyles = `
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 1rem;
    width: 100%;
    font-size: 1.2rem;`;

 const modalButtonStyles = `
    cursor: pointer;
    padding: 0.5rem 1rem;
    font-size: 1.2rem;
    border: 1px solid var(--border_color);
    border-radius: 0.25rem;
    color: var(--color);
    background: var(--background_color);`;

// Contextmenu
const contextMenuBackgroundStyles = `
    position: fixed;
    inset: 0;
    background-color: var(--background_transparent_color);
    z-index: 100;
    overflow: scroll;`;

const contextMenuContainerStyles = `
    position: absolute;
    display: none;
    flex-direction: column;
    flex-wrap: wrap;
    justify-content: flex-end;
    width: max-content;
    font-size: 1.2rem;`;

const contextMenuButton = `
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    font-size: 1.2rem;
    border: 1px solid var(--border_color);
    color: var(--color);
    background: var(--background_color);`;

const modalCloseButtonStyles = `
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    cursor: pointer;
    padding: 0 0.5rem 0.25rem 0.5rem;
    font-size: inherit;
    border: none;
    color: var(--color);
    background: transparent;`;

const calendarButtonStyles = `
    position: absolute;
    top: 3.75rem;
    right: 0.25rem;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    font-size: .75em;
    border: none;
    color: var(--color);
    border: 1px solid var(--border_color);
    background: transparent;`;

const modalInputStyles = `
    width: 100%;
    padding: 0.25rem;
    font-size: 1.2rem;
    border: 1px solid var(--border_color);`;

const modalInputTextAreaStyles = `
    width: 100%;
    padding: 0.25rem;
    font-size: 1.2rem;
    border: 1px solid var(--border_color); `;
const modalInputCheckboxStyles = ``;

const currentEditorLabelStyles = `
    font-size: 1.2rem;
    color: var(--no);`;
const inputLabelStyles = `
    font-size: 1.2rem;`;
const inLineInputLabelStyles = `
    display: flex;
    align-items: center;
    font-size: 1.2rem;`;
const blockInputLabelStyles = `
    width: 100%;
    display: flex;
    flex-direction: column;
    font-size: 1.2rem;`;

// Calendar
const calendarContainerStyles = `
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: center;
    align-content: center;
    width: 100%;
    inset: 0;
    flex-grow: 1;
    overflow: scroll;
    border: 1px solid var(--border_color);
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: -moz-none;
    -o-user-select: none;
    user-select: none;
    scroll-behavior: smooth;`;
const calendarWeekStyles = `
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-content: center;
    width: 100%;
    height: max-content;
    align-items: stretch;
    flex: 1;`;
const calendarDayContainerStyles = `
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    flex-grow: 1;
    flex: 1;
    width: 12vw;
    min-width: 12vw;
    min-height: 8vw;
    overflow-wrap: break-word;
    padding-bottom: 0.5em;
    border-right: 1px solid var(--border_color);
    border-bottom: 1px solid var(--border_color);
    font-size: clamp(0.25em, 1.5vw, 1.125em);
    transition: background-color 1s;`;
const calendarDayHeaderStyles = `
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    background: transparent;
    pointer-events: none;`;
const dayNameElementStyles = `
    margin: 0.5rem;
    background: transparent;
    color: var(--inactive);`;
const dayNumberElementStyles = `
    margin: 0.5rem;
    background: transparent;
    color: var(--inactive);`;
const eventsContainer = `
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 1px;
    margin-top: auto;
    background: transparent;`
const eventTitleStyles = `
    width: 100%;
    overflow: visible;
    padding: 0 0.25em;
    margin: 0;
    text-align: center;
    color: black;`;
const calendarTooltipStyles = `
    position: absolute;
    display: none;
    width: max-content;
    padding: 0.25em;
    white-space: -moz-pre-wrap; /* Mozilla, supported since 1999 */
    white-space: -pre-wrap; /* Opera 4 - 6 */
    white-space: -o-pre-wrap; /* Opera 7 */
    white-space: pre-wrap; /* CSS3 - Text module (Candidate Recommendation) http://www.w3.org/TR/css3-text/#white-space */
    word-wrap: break-word; /* IE 5.5+ */
    font-size: smaller;
    border : 2px solid var(--border_color);
    border-radius: 0.5em;
    pointer-events: none;
    z-index: 1000;`;


const jobNameInputStyles = `
    padding: 0.25rem;
    font-size: 1.2rem;
    border: 1px solid var(--border_color);`;
const jobNotesLabelStyles = `
    text-align: center;
    font-size: 1.2rem;`;
const jobTextAreaNotesStyles = `
    width: 100%;
height: 5rem;
    border: 1px solid var(--border_color);`;
const jobShipDateLabelStyles = ``;
const jobShipDateInputStyles = ``;
const addJobSequenceLabelStyles = `
    font-size: 1.2rem;`;
const addJobSequenceContainerStyles = `
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 2rem;
    border: 1px solid var(--border_color);
    overflow: scroll;`;

const addJobModalSequence = `
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;`;
const addJobModalSequenceTask = `
    margin: 0.5rem;
    padding: 0.25rem 1rem;
    cursor: pointer;
    border-left: 2px solid transparent;
    background-color: var(--background_color);`;
const addJobModalSequenceTitle = `
    width: max-content;
    padding: 0.5rem;
    margin: 0;`;
const addJobTaskDragOver = `
    margin: 0.5rem;
    padding: 0.25rem 1rem;
    cursor: pointer;
    border-left: 2px solid var(--color);
    background-color: var(--background_hover_color);`;

    
const jobShopTimeLabelStyles = `
    padding: 0.25rem;
    font-size: 1.2rem;
    border: 1px solid var(--border_color);`;
const jobShopTimeContainer = `
    display: flex;
    flex-direction: row;
    flex-wrap: no-wrap;
    justify-content: flex-start;
    align-items: center;
    gap: 1rem;
    width: 100%;
    font-size: 1.2rem;`;
const jobShopTimeInputStyles = `
    flex-grow: 1;
    width: 100%;
    max-width: 8rem;
    padding: 0.25rem;
    font-size: 1.2rem;
    border: 1px solid var(--border_color);`;

const colorContainerStyles = `
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-around;
    gap: 1px;
    width: 100%;`;
const colorSelectBlock = `
    width: 1em;
    height: 1em;
    font-size: 2rem;
    text-align: center;
    color: black;
    cursor: pointer;`;

// Job timings dialog
const jobTimingMainContainerStyles = `
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    width: max-content`;
const jobTimingNamesContainerStyles = `
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: center;
    align-content: center;
    width: max-content;
    font-size: 1.2em;
    border: 1px solid var(--border_color);`;
const jobTimingNamesStyles = `
    width: 100%;
    height: 1.2em;
    padding: 0 0.5em;
    border: 1px solid var(--border_color);
    text-align: center;`;
const jobTimingDateTimesContainerStyles = `
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    width: max-content;`;
const jobTimingDatesContainerStyles = `
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: center;
    border: 1px solid var(--border_color);`;
const dateTimingDatesStyles = `
    width: 70px;
    border: 1px solid var(--border_color);
    text-align: center;`;
const jobTimingTimesContainerStyles = `
    position: relative;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: stretch;
    align-content: stretch;
    width: 100%;
    height: 1.2em;
    border: 1px solid var(--border_color);
    font-size: 1.2em;
    cursor: crosshair;`;
const jobTimingTimesStyles = `
    position: absolute;
    height: 22px;
    border: 1px solid var(--border_color);
    overflow: hidden;
    color: black;
    font-size: 12px;`;
const jobTimingVerticalLinesStyles = `
    position: absolute;
    height: 22px;
    border: 1px solid var(--border_color);
    overflow: hidden;
    color: black;
    font-size: 12px;`;


const jobCardTitleStyles = `
    margin: 0;`;
const jobCardShipDateStyles = `
    margin: 0;`;
const jobCardDueInDaysStyles = `
    margin: 0;`;
const jobCardCheckboxLabelStyles = `
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: center;
    align-content: center;
    gap: 0.25rem`;
const jobCardCheckboxStyles = `
    order: -1;`;

let draggingTask = {taskIndex: 0, sequenceName: ""};

export function showJobCardDialog(job, OKCallback) {
    const body = document.querySelector('body');
    const modalBackground = getModalBackground();
    const modalWindow = getModalWindow();
    modalWindow.style.alignItems = 'center';

    const jobTitle = document.createElement('h2');
    jobTitle.textContent = job.name;
    jobTitle.style.cssText = jobCardTitleStyles;
    
    const shipDate = document.createElement('h3');
    shipDate.textContent = job.shipDate;
    shipDate.style.cssText = jobCardShipDateStyles;

    const dueInDays = document.createElement('p');
    dueInDays.textContent = getDueInDaysFromNowText(job.shipDate);
    dueInDays.style.cssText = jobCardDueInDaysStyles;

    const jobNotes = document.createElement('p');
    jobNotes.textContent = job.note;
    jobNotes.style.cssText = jobCardDueInDaysStyles;
    
    const checkboxesContainer = document.createElement('div');
    checkboxesContainer.style.cssText = addJobSequenceContainerStyles;
    if (job.checklist) {
        job.checklist.forEach((checkbox) => {
            const labeledCheckbox = getLabeledCheckbox(checkbox.text, checkbox.checked, true, checkboxesContainer);
            checkboxesContainer.appendChild(labeledCheckbox);
        });
    }

    // Add checkbox
    const addCheckboxButton = getButton("Add checkbox", () => {
        showInputDialog("Add checkbox", "", (checkboxTitle) => {
                    const labeledCheckbox = getLabeledCheckbox(checkboxTitle, false);
                    checkboxesContainer.appendChild(labeledCheckbox);
                },
                () => {},
                'text',
                ""
            );
        }
    );

    // OK button
    const OKBtn = getButton("OK", () => {
        const checklistArray = [];
        const checkboxLabels = checkboxesContainer.querySelectorAll('label');
        checkboxLabels.forEach((checkboxLabel) => {
            const checkboxText = checkboxLabel.textContent;
            const checkboxValue = checkboxLabel.lastChild.checked;
            checklistArray.push({checked: checkboxValue, text: checkboxText});
        });
        job.checklist = checklistArray;

        OKCallback(job);
        body.removeChild(modalBackground);
    });

    // Cancel button
    const cancelBtn = getButton("Cancel", () => {
        body.removeChild(modalBackground);
    });
    // Button container
    const buttonContainer = getButtonContainer(cancelBtn, OKBtn);
    modalWindow.append(jobTitle, shipDate, dueInDays, jobNotes, checkboxesContainer, addCheckboxButton, buttonContainer);

    if (!job.active) {
        modalWindow.querySelectorAll('*').forEach((element) => {element.setAttribute('disabled', 'disabled');});
        modalWindow.querySelectorAll('*').forEach((element) => {element.style.color = 'var(--inactive)';});
        modalWindow.querySelectorAll('*').forEach((element) => {element.style.cursor = 'default';});
        OKBtn.removeAttribute('disabled', 'disabled');
        OKBtn.style.color = 'var(--color)';
        OKBtn.style.cursor = 'pointer';
    }

    modalBackground.appendChild(modalWindow);
    body.appendChild(modalBackground);
}

function getLabeledCheckbox(label, isChecked, deletable, containerElement) {
    const checkboxElement = document.createElement('input');
    checkboxElement.setAttribute('type', 'checkbox');
    if (isChecked) checkboxElement.setAttribute('checked', 'checked');
    checkboxElement.style.cssText = jobCardCheckboxStyles;
    checkboxElement.onclick = () => {checkboxLabel.checked = checkboxElement.checked};

    const checkboxLabel = document.createElement('label');
    checkboxLabel.textContent = label;
    checkboxLabel.style.cssText = jobCardCheckboxLabelStyles;
    checkboxLabel.checked = isChecked;
    if (deletable) {
        checkboxLabel.oncontextmenu = (event) => {
            event.preventDefault();
            showYesNoDialog(`Delete checkbox ${label}?`, () => {
                containerElement.removeChild(checkboxLabel);
            });
        }
    }
    checkboxLabel.appendChild(checkboxElement);
    return checkboxLabel;
}

export function showContextMenu(clickEvent, optionsArray, callback) {
    const body = document.querySelector('body');
    const modalBackground = getModalBackground();
    const modalWindow = getModalWindow();

    modalWindow.style.cssText = contextMenuContainerStyles;

    if (clickEvent.button != 2) return; 
    modalWindow.style.display = 'flex';
    modalWindow.style.top = `${clickEvent.clientY}px`;
    modalWindow.style.left = `${clickEvent.clientX}px`;

    modalBackground.onclick = (event) => {
        event.preventDefault();
        body.removeChild(modalBackground);
    }
    modalBackground.oncontextmenu = (event) => {
        event.preventDefault();
        body.removeChild(modalBackground);
    }
    
    optionsArray.forEach((text) => {
        const optionBtn = getButton(text, () => {
            callback(text);
        });
        optionBtn.style.cssText = contextMenuButton;
        modalWindow.append(optionBtn);
    });

    modalBackground.appendChild(modalWindow);
    body.appendChild(modalBackground);
}

export function showJobDialog(job, jobs, allTasks, OKCallback, cancelCallback, whoIsEditingTitle) {
    const originalJob = JSON.parse(JSON.stringify(job));

    const isNewJob = job === null;

    if (isNewJob) job = {active: true};

    const body = document.querySelector('body');
    const modalBackground = getModalBackground();
    const modalWindow = getModalWindow();
    modalWindow.style.alignItems = 'center';

    // Who is editing
    const currentEditorLabel = document.createElement('label');
    if (whoIsEditingTitle) currentEditorLabel.textContent = `${whoIsEditingTitle} is editing this job right now.`;
    currentEditorLabel.style.cssText = currentEditorLabelStyles;

    // Job Name
    const jobNameInput = document.createElement('input');
    jobNameInput.style.cssText = jobNameInputStyles;
    jobNameInput.value = job.name || "";
    const jobNameLabel = document.createElement('label');
    jobNameLabel.textContent = "Job Name ";
    jobNameLabel.style.cssText = inputLabelStyles;
    jobNameLabel.appendChild(jobNameInput);

    // Job Ship Date
    const jobShipDateInput = document.createElement('input');
    jobShipDateInput.setAttribute('type', 'date');
    jobShipDateInput.style.cssText = jobNameInputStyles;
    jobShipDateInput.value = job.shipDate || "";
    const jobShipDateLabel = document.createElement('label');
    jobShipDateLabel.textContent = "Ship Date ";
    jobShipDateLabel.style.cssText = inputLabelStyles;
    jobShipDateLabel.appendChild(jobShipDateInput);

    // Active
    const jobActiveInput = document.createElement('input');
    jobActiveInput.setAttribute('type', 'checkbox');
    if ((isNewJob) || (job.active)) jobActiveInput.setAttribute('checked', 'checked');
    jobActiveInput.style.cssText = jobNameInputStyles;
    const jobActiveLabel = document.createElement('label');
    jobActiveLabel.textContent = "Active ";
    jobActiveLabel.style.cssText = inLineInputLabelStyles;
    jobActiveLabel.appendChild(jobActiveInput);

    // Job Notes
    const jobNotesTextArea = document.createElement('textarea');
    jobNotesTextArea.style.cssText = jobTextAreaNotesStyles;
    jobNotesTextArea.setAttribute('placeholder', "Notes");
    jobNotesTextArea.value = job.note || "";
    const jobNoteLabel = document.createElement('label');
    jobNoteLabel.textContent = "Job Notes";
    jobNoteLabel.style.cssText = blockInputLabelStyles;
    jobNoteLabel.appendChild(jobNotesTextArea);
    
    // Sequences
    const sequenceContainer = document.createElement('div');
    sequenceContainer.style.cssText = addJobSequenceContainerStyles;
    if (job && job.hasOwnProperty('sequences')) {
        loadSequences(job.sequences, sequenceContainer, allTasks);
    }

    const sequenceLabel = document.createElement('label');
    sequenceLabel.style.cssText = addJobSequenceLabelStyles;
    sequenceLabel.textContent = "Sequences";
    sequenceLabel.appendChild(sequenceContainer);

    // Add task
    const AddTaskBtn = getButton("Add Task", async () => {
        await showAddTaskDialog(null, null, allTasks, async (sequenceName, newTask) => {
            if (!job.sequences) job.sequences = [];
            let sequenceFound = false;
            job.sequences.forEach((sequence) => {
                if (sequence.name === sequenceName) {
                    sequence.tasks.push(newTask);
                    sequenceFound = true;
                }
            });
            if (!sequenceFound) job.sequences.push({name: sequenceName, tasks: [newTask]});
            await loadSequences(job.sequences, sequenceContainer, allTasks);
        });
    });
    // Add tasks from text
    const AddTasksFromTextBtn = getButton("Add Tasks From Text", () => {
        if (!job.sequences) job.sequences = [];
        showAddTaskFromTextDialog(job.sequences, allTasks, async () => {
            await loadSequences(job.sequences, sequenceContainer, allTasks);
        });
    });
    // Add tasks button container
    const modalButtonContainer = getButtonContainer(AddTaskBtn, AddTasksFromTextBtn);


    // OK button
    const OKBtn = getButton("OK", () => {
        const jobName = jobNameInput.value;
        if (!jobName) {
            showAlertDialog("Please enter a job name.");
            return;
        }

        if (isNewJob) {
            let jobFound = false;
            jobs.forEach((aJob) => {if (String(aJob.name) === String(jobName)) jobFound = true;});
            if (jobFound) {
                showAlertDialog(`${jobName} job already exists.`);
                return;
            }
        }

        job.name = jobName;
        job.shipDate = jobShipDateInput.value || jobs[0].shipDate || formatDateToCA(getToday());
        job.estimatedDate = job.shipDate;
        job.active = jobActiveInput.checked;
        job.note = jobNotesTextArea.value;

        if (OKCallback) OKCallback(job);
        body.removeChild(modalBackground);
    });
    // Cancel button
    const cancelBtn = getButton("Cancel", () => {
        if (cancelCallback) cancelCallback(originalJob);
        body.removeChild(modalBackground);
    });
    // Button container
    const buttonContainer = getButtonContainer(cancelBtn, OKBtn);

    modalWindow.append(currentEditorLabel, jobNameLabel, jobShipDateLabel, jobActiveLabel, jobNoteLabel, sequenceLabel, modalButtonContainer, buttonContainer);
    modalBackground.appendChild(modalWindow);
    body.appendChild(modalBackground);
}

async function loadSequences(sequences, sequenceContainer, allTasks, updateSequencesCallback) {
    sequenceContainer.innerHTML = "";

    if (!sequences) return;
    if (sequences.length < 1) return;

    sequences.forEach((sequence, sequenceIndex) => {
        const sequenceTitle = document.createElement('h3');
        sequenceTitle.style.cssText = addJobModalSequenceTitle;
        addHoverColors(sequenceTitle);
        sequenceTitle.textContent = sequence.name;
        sequenceTitle.onclick = async () => {
            showYesNoDialog(`Delete "${sequence.name}" and it's tasks?`,
                async () => {
                    sequences.splice(sequenceIndex, 1);
                    // await updateSequencesCallback(sequences);
                    await loadSequences(sequences, sequenceContainer, allTasks);
                }
            );
        }
        sequenceContainer.appendChild(sequenceTitle);

        const sequenceBlock = document.createElement('div');
        sequenceBlock.style.cssText = addJobModalSequence;
        sequence.tasks.forEach((task, index) => {
            const taskElement = document.createElement('p');
            taskElement.setAttribute('draggable', 'true');
            taskElement.setAttribute('sequence-name', sequence.name);
            addHoverColors(taskElement);
            taskElement.style.cssText = addJobModalSequenceTask;
            const taskChecked = task.completed ? "✓" : "";
            taskElement.textContent = `${task.name} ${task.hours}:${String(task.minutes).length < 2 ? "0" : ""}${task.minutes} ${taskChecked}`;

            taskElement.addEventListener('click', () => {
                // addJobSequenceName.value = sequence.name;
                showAddTaskDialog(
                    sequence.name,
                    task,
                    allTasks,
                    async (sequenceName, newTask) => {
                        task.name = newTask.name;
                        task.id = newTask.id;
                        task.hours = newTask.hours;
                        task.minutes = newTask.minutes;
                        // task.completed = false;
                        // await updateSequencesCallback(sequences);
                        await loadSequences(sequences, sequenceContainer, allTasks);
                    });
            });
            taskElement.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                showYesNoDialog(`Delete "${task.name}" from ${sequence.name}?`,
                    async () => {
                        sequence.tasks.splice(index, 1);
                        // await updateSequencesCallback(sequences);
                        await loadSequences(sequences, sequenceContainer, allTasks);
                    }
                );
            });
            
            taskElement.addEventListener('dragstart', () => {
                draggingTask.sequenceName = sequence.name;
                draggingTask.taskIndex = index;
            });
            taskElement.addEventListener('dragover', (event) => {
                event.preventDefault();
            });

            taskElement.addEventListener('dragenter', (event) => {
                event.preventDefault();
                const draggersSequence = event.target.attributes['sequence-name'].value;
                if (draggingTask.sequenceName === draggersSequence) {
                    taskElement.style.cssText = addJobTaskDragOver;
                }
            });

            taskElement.addEventListener('dragleave', () => {
                taskElement.style.cssText = addJobModalSequenceTask;
            });

            taskElement.addEventListener('drop', async (event) => {
                const draggersSequence = event.target.attributes['sequence-name'].value;
                if (draggingTask.sequenceName === draggersSequence) {
                    const temp = sequence.tasks.splice(draggingTask.taskIndex, 1);
                    sequence.tasks.splice(index, 0, ...temp);
                    loadSequences(sequences, sequenceContainer, allTasks);
                }
                taskElement.style.cssText = addJobModalSequenceTask;
            });

            sequenceBlock.appendChild(taskElement);
        });
        sequenceContainer.appendChild(sequenceBlock);
    });
}

// Add Task
async function showAddTaskDialog(sequenceName, task, allTasks, OKCallback, cancelCallback) {
    if (!task) task = {};

    const body = document.querySelector('body');
    const modalBackground = getModalBackground();
    const modalWindow = getModalWindow();
    const modalTitle = getModalTitle("Task");

    // Sequence name
    const sequenceNameInput = document.createElement('input');
    sequenceNameInput.setAttribute('list', 'sequence-name-data-list');
    sequenceNameInput.style.cssText = modalInputStyles;
    sequenceNameInput.disabled = sequenceName ? true : false;
    const sequenceNameDataList = document.createElement('datalist');
    sequenceNameDataList.setAttribute('id','sequence-name-data-list')
    const optionsText = ["Cabinets", "Veneers", "Doors", "Add-on"];
    optionsText.forEach((sequenceNameOption) => {
        const sequenceName = document.createElement('option');
        sequenceName.value = sequenceNameOption;
        sequenceNameDataList.appendChild(sequenceName);
    });
    sequenceNameInput.value = sequenceName ? sequenceName : optionsText[0];
    const sequenceNameLabel = document.createElement('label');
    sequenceNameLabel.textContent = "Sequence Name";
    sequenceNameLabel.style.cssText = blockInputLabelStyles;
    sequenceNameLabel.appendChild(sequenceNameInput);
    sequenceNameLabel.appendChild(sequenceNameDataList);

    // Task name
    const taskNameSelect = document.createElement('select');
    taskNameSelect.style.cssText = modalInputStyles;
    allTasks.forEach((aTask, index) => {
        const taskOption = document.createElement("option");
        taskOption.textContent = aTask.name;
        taskOption.id = aTask.id;
        taskOption.value = index;
        if (aTask.name === task.name) taskOption.setAttribute('selected', true);
        taskNameSelect.appendChild(taskOption);
    });
    const taskNameLabel = document.createElement('label');
    taskNameLabel.textContent = "Task Name";
    taskNameLabel.style.cssText = blockInputLabelStyles;
    taskNameLabel.appendChild(taskNameSelect);
    
    // Shop hours
    const shopHoursInput = document.createElement('input');
    shopHoursInput.setAttribute('placeholder', 'Hours');
    shopHoursInput.setAttribute('min', '0');
    shopHoursInput.setAttribute('type', 'number');
    shopHoursInput.value = task.hours || 0;
    shopHoursInput.style.cssText = jobShopTimeInputStyles;
    
    const shopMinutesInput = document.createElement('input');
    shopMinutesInput.setAttribute('placeholder', 'Minutes');
    shopMinutesInput.setAttribute('min', '0');
    shopMinutesInput.setAttribute('type', 'number');
    shopMinutesInput.value = task.minutes || 0;
    shopMinutesInput.style.cssText = jobShopTimeInputStyles;

    const shopTimeLabel = document.createElement('label');
    shopTimeLabel.textContent = "Shop time";
    shopTimeLabel.style.cssText = blockInputLabelStyles;

    const shopTimeContainer = document.createElement('div');
    shopTimeContainer.style.cssText = jobShopTimeContainer;
    shopTimeContainer.append(shopHoursInput, " : ", shopMinutesInput);
    shopTimeLabel.appendChild(shopTimeContainer);

    const completedCheckbox = getLabeledCheckbox("Completed", task.completed, false, null);
    completedCheckbox.style.fontSize = '1.2rem';

    const modalOKButton = getButton("OK", () => {
        const taskName = taskNameSelect[taskNameSelect.value].textContent;
        const sequenceName = sequenceNameInput.value;
        if (sequenceName === "") {
            showAlertDialog("Please add a sequence name.");
            return;
        }
        if (taskName === "") {
            showAlertDialog("Please select a task.");
            return;
        }
        task.name = taskName
        task.id = taskNameSelect[taskNameSelect.value].id,
        task.hours = Number(shopHoursInput.value);
        task.minutes = Number(shopMinutesInput.value);
        task.completed = completedCheckbox.checked;
        if (OKCallback) OKCallback(sequenceName, task);
        body.removeChild(modalBackground);
    });

    const modalCancelButton = getButton("Cancel", () => {
        if (cancelCallback) cancelCallback();
        body.removeChild(modalBackground);
    });

    const modalButtonContainer = getButtonContainer(modalCancelButton, modalOKButton);

    modalWindow.append(modalTitle, sequenceNameLabel, taskNameLabel, shopTimeLabel, completedCheckbox, modalButtonContainer);
    modalBackground.appendChild(modalWindow);
    body.appendChild(modalBackground);
    
    sequenceNameInput.focus();
}

// Add tasks from Text
function showAddTaskFromTextDialog(sequences, allTasks, OKCallback, cancelCallback) {
    const body = document.querySelector('body');
    const modalBackground = getModalBackground();
    const modalWindow = getModalWindow();
    const modalTitle = getModalTitle("Task");

    // Sequence name
    const sequenceNameInput = document.createElement('input');
    sequenceNameInput.setAttribute('list', 'sequence-name-data-list');
    sequenceNameInput.style.cssText = modalInputStyles;
    const sequenceNameDataList = document.createElement('datalist');
    sequenceNameDataList.setAttribute('id','sequence-name-data-list')
    const optionsText = ["Cabinets", "Veneers", "Doors", "Add-on"];
    optionsText.forEach((sequenceNameOption) => {
        const sequenceName = document.createElement('option');
        sequenceName.value = sequenceNameOption;
        sequenceNameDataList.appendChild(sequenceName);
    });
    sequenceNameInput.value = optionsText[0];
    const sequenceNameLabel = document.createElement('label');
    sequenceNameLabel.textContent = "Sequence Name";
    sequenceNameLabel.style.cssText = blockInputLabelStyles;
    sequenceNameLabel.appendChild(sequenceNameInput);
    sequenceNameLabel.appendChild(sequenceNameDataList);

    // Text
    const textArea = document.createElement('textarea');
    textArea.style.cssText = modalInputTextAreaStyles;
    textArea.style.height = '15rem';
    const sequenceTextLabel = document.createElement('label');
    sequenceTextLabel.textContent = "Text";
    sequenceTextLabel.style.cssText = blockInputLabelStyles;
    sequenceTextLabel.appendChild(textArea);

    if (isDev) {
        textArea.value = `Job Labor   53 hours 47 minutes
                        Cutting   10 hours 0 minutes
                        Banding 10 hours 0 minutes
                        Assembly 10 hours 0 minutes
                        Finishing 10 hours 0 minutes
                        Packaging    10 hours 0 minutes`;
    }
    else {
        textArea.value = "";
    }

    const modalOKButton = getButton("OK", () => {
        const sequenceName = sequenceNameInput.value;
        const text = textArea.value;
        const errors = calculate(sequenceName, sequences, text, allTasks).errors;
        if (errors.length > 0) {
            showAlertDialog(errors.join("\n"));
            return;
        }
        if (OKCallback) OKCallback();
        body.removeChild(modalBackground);
    });

    const modalCancelButton = getButton("Cancel", () => {
        if (cancelCallback) cancelCallback();
        body.removeChild(modalBackground);
    });

    const modalButtonContainer = getButtonContainer(modalCancelButton, modalOKButton);

    modalWindow.append(modalTitle, sequenceNameLabel, sequenceTextLabel, modalButtonContainer);
    modalBackground.appendChild(modalWindow);
    body.appendChild(modalBackground);
    
    sequenceNameInput.focus();


    function calculate(sequenceName, sequences, text, allTasks) {
        const errors = [];
        if (!sequenceName) {
            errors.push("Please add a sequence name.");
            return {errors};
        }

        // const totalShopTime = getTotalShopHours(text);
    
        const taskList = getTaskTimes(text).tasks;
        errors.push(...getTaskTimes(text).errors);
    
        if ((!allTasks) || (allTasks.error)) return;
        if (allTasks.length == 0) return;
    
    
        for (const ownTask of taskList) {
            let taskFound = false;
            for (const task of allTasks) {
                if (task.name === ownTask.name) {
                    taskFound = true;
                    addTask(
                        sequenceName,
                        sequences,
                        {
                            name: ownTask.name,
                            id: task.id,
                            hours: ownTask.hours,
                            minutes: ownTask.minutes,
                            completed: false,
                        }
                    );
                }
            }
            if (!taskFound) errors.push(`Task "${ownTask.name}" not found. Please added "${ownTask.name}" to Tasks in the Admin page.`);
        }
        return {errors};
    }

    function addTask(sequenceName, sequences, data) {
        let sequenceFound = false;

        sequences.forEach((sequence) => {
            if (sequence.name === sequenceName) {
                sequence.tasks.push(data);
                sequenceFound = true;
            }
        });
    
        if (!sequenceFound) {
            sequences.push({
                name: sequenceName,
                tasks: [data]
            },)
        }
    };

    function getTaskTimes(text) {
        const errors = [];

        const textArray = text.split('\n');
    
        // Remove all spaces
        for (let i = 0; i < textArray.length; i++) {
            textArray[i] = textArray[i].replace(/\s/g, "");
        }
        
        // Find first line
        let jobLaborLineIndex = 0;
        for (let i = 0; i < textArray.length; i++) {
            if (textArray[i].startsWith("JobLabor")) jobLaborLineIndex = i;
        }
    
        const tasks = [];
        for (let i = jobLaborLineIndex + 1; i < textArray.length; i++) {
            // skip empty lines
            if (!textArray[i]) continue;
    
            const task = {};
    
            // Find task name
            if (textArray[i].match(/^\D+/)) {
                task.name = textArray[i].match(/^\D+/)[0];
            }
            else {
                errors.push(`Missing task name on line ${i + 1}`);
            }
    
            // Find task hours
            if (textArray[i].match(/\d+hours/)) {
                task.hours = Number(textArray[i].match(/\d+hours/)[0].split("hours")[0]);
            }
            else {
                task.hours = 0;
            }
            
            // Find task minutes
            if (textArray[i].match(/\d+minutes/)) {
                task.minutes = Number(textArray[i].match(/\d+minutes/)[0].split("minutes")[0]);
            }
            else {
                task.minutes = 0;
            }
    
            tasks.push(task);
        }
        return {tasks, errors};
    }
}

export function showCalendarPreviewDialog(title, calendarEvents, weekdaysOnly, randomColor) {
    const body = document.querySelector('body');
    const modalBackground = getModalBackground();
    const modalWindow = getModalWindow();
    modalWindow.style.maxHeight = '90vh';
    const modalTitle = getModalTitle(title);

    const calendarContainer = document.createElement('div');
    calendarContainer.style.cssText = calendarContainerStyles;
    calendarContainer.classList.add('calendar-container');

    calendarEvents.sort((a, b) => {
        const dateA = a.startDate;
        const dateB = b.startDate;
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return 0;
    });

    // Close button
    const modalCloseButton = getCloseButton(() => {
        body.removeChild(modalBackground);
    });

    loadCalendarContainer(calendarContainer, calendarEvents)

    modalTitle.appendChild(modalCloseButton);
    modalWindow.append(modalTitle, calendarContainer);
    modalBackground.appendChild(modalWindow);
    body.appendChild(modalBackground);

    function loadCalendarContainer(container, calendarEvents) {
        const dateProperties = getDates(calendarEvents);
        const dateIndex = dateProperties.firstSunday;
        const weeks = [];

        // Swap start and end dates if end date is before start date
        calendarEvents.forEach(event => {
            if (event.startDate > event.endDate) {
                const temp = event.startDate;
                event.startDate = event.endDate;
                event.endDate = temp;
            }
        });

        calendarEvents.forEach(event => {
            const startDate = getCorrectDate(event.startDate);
            const endDate = getCorrectDate(event.endDate);
            const dates = [formatDateToCA(startDate)];
            
            while (formatDateToCA(startDate) !== formatDateToCA(endDate)) {
                startDate.setDate(startDate.getDate() + 1);
                dates.push(formatDateToCA(startDate));
            }
            event.dates = dates;
        });

        let endCalender = false;
        while (!endCalender) {
            const weekContainer = document.createElement('div');
            weekContainer.classList.add('week');
            weekContainer.style.cssText = calendarWeekStyles;
        
            // Loop through days of the week
            for (let dayOfTheWeekIndex = 0; dayOfTheWeekIndex < 7; dayOfTheWeekIndex++) {
                const calendarDate = formatDateToCA(dateIndex);
                const dayContainer = document.createElement('div');
                dayContainer.style.cssText = calendarDayContainerStyles;

                const resizeObserver = new ResizeObserver(() => {
                    const screenWidth = window.innerWidth;
                    if (screenWidth <= 600) {
                        dayContainer.style.fontSize = 'large';
                        dayContainer.style.width = '100%';
                        weekContainer.style.flexDirection = 'column';
                    }
                    else {
                        dayContainer.style.fontSize = 'clamp(0.25em, 1.5vw, 1.125em)';
                        dayContainer.style.width = '100%';
                        weekContainer.style.flexDirection = 'row';
                    }
                });
                resizeObserver.observe(document.querySelector('body'));
                
                dayContainer.classList.add(`date-${calendarDate}`);
                dayContainer.classList.add('day');
    
                const dayHeader = document.createElement('div');
                dayHeader.classList.add('day-header-container');
                dayHeader.style.cssText = calendarDayHeaderStyles;
        
                const dayNameElement = document.createElement('p');
                const options = {month: "short"};
                const monthText = (new Intl.DateTimeFormat("en-CA", options).format(dateIndex));
                dayNameElement.classList.add('day-week-name');
                dayNameElement.style.cssText = dayNameElementStyles;
                if (dateIndex.getDate() == 1) {
                    dayNameElement.textContent = monthText;
                    dayNameElement.style.color = 'var(--yes)';
                }
                else {
                    dayNameElement.textContent = dateIndex.toLocaleString('default', {weekday: 'short'});
                }
                if (dateProperties.today.toDateString('en-CA') === dateIndex.toDateString('en-CA')) {
                    dayNameElement.textContent = "Today";
                    dayNameElement.style.color = 'var(--yes)';
                }
        
                const dayNumberElement = document.createElement('p');
                const dayNumber = dateIndex.toLocaleString('default', {day: 'numeric'});
                dayNumberElement.style.cssText = dayNumberElementStyles;
                dayNumberElement.classList.add('day-number');
                if (dateProperties.today.toDateString('en-CA') === dateIndex.toDateString('en-CA')) {
                    dayNumberElement.classList.add('today');
                    dayNumberElement.style.color = 'var(--yes)'
                }
                dayNumberElement.textContent = dayNumber;
    
                // // Add Calender Events
                const eventContainer = document.createElement('div');
                eventContainer.classList.add('events-container');
                eventContainer.style.cssText = eventsContainer;
                
                let eventColor = 0;
                calendarEvents.forEach((calenderEvent) => {
                    const dayName = (dateIndex.toLocaleString('default', {weekday: 'short'}));
                    if ((dayName === "Sat") && (weekdaysOnly)) return;
                    if ((dayName === "Sun") && (weekdaysOnly)) return;

                    eventColor += 1;
                    if (eventColor >= 8) eventColor = 1;
    
                    if (calenderEvent.dates.indexOf(calendarDate) !== -1) {    
                        const eventTitle = document.createElement('p');
                        eventTitle.textContent = calenderEvent.name;
                        eventTitle.style.cssText = eventTitleStyles;
                        if (randomColor) {
                            eventTitle.style.backgroundColor = `var(--color-${eventColor || 1})`;
                        }
                        else {
                            eventTitle.style.color = 'var(--color)';
                        }

                        if (calenderEvent.tooltip) {
                            const tooltip = document.createElement('p');
                            tooltip.textContent = calenderEvent.tooltip || "";
                            tooltip.style.cssText = calendarTooltipStyles;
                            tooltip.style.borderColor = randomColor ? `var(--color-${eventColor || 1})` : `var(--border_color)`;
                            eventTitle.onmouseover = () => {
                                tooltip.style.display = "block";
                                if (!randomColor) eventTitle.style.backgroundColor = 'var(--background_hover_color)';
                            }
                            eventTitle.onmousemove = (event) => {
                                const numberOfLines = calenderEvent.tooltip.split(/\r\n|\r|\n/).length;
                                tooltip.style.top = `calc(${event.clientY}px - ${numberOfLines + 2.5}em)`;
                                tooltip.style.left = `${event.clientX}px`;
                            }
                            eventTitle.onmouseleave = () => {
                                tooltip.style.display = "none";
                                if (!randomColor) eventTitle.style.backgroundColor = 'var(--background_color)';
                            }
                            body.appendChild(tooltip);
                        }
                        eventContainer.appendChild(eventTitle);
                        }
                });
    
                dayHeader.appendChild(dayNameElement);
                dayHeader.appendChild(dayNumberElement);
        
                dayContainer.appendChild(dayHeader);
                dayContainer.appendChild(eventContainer);
        
                weekContainer.appendChild(dayContainer);
    
                // Increment day
                dateIndex.setDate(dateIndex.getDate() + 1);
    
                // Stop looping
                if (formatDateToCA(dateIndex) === formatDateToCA(dateProperties.lastSaturday)) endCalender = true;
            };
            weeks.push(weekContainer);
        }
        container.innerHTML = "";
        container.append(...weeks);
    }

    function getDates(calendarEvents) {
        const events = JSON.parse(JSON.stringify(calendarEvents));
        
        // Sort by end date to find last date
        events.sort((a, b) => {
            const dateA = a.endDate;
            const dateB = b.endDate;
            if (dateA < dateB) return 1;
            if (dateA > dateB) return -1;
            return 0;
        });
        const latestDate = events[0].endDate || formatDateToCA(getCorrectDate());

        // Sort by start date
        events.sort((a, b) => {
            const dateA = a.startDate;
            const dateB = b.startDate;
            if (dateA < dateB) return -1;
            if (dateA > dateB) return 1;
            return 0;
        });
        const earliestDate = events[0].startDate || formatDateToCA(getCorrectDate());

        const today = getToday();
        const todayText = formatDateToCA(getToday());
    
        let firstSunday = getCorrectDate(earliestDate);
        if (firstSunday > getToday()) {
            firstSunday = getToday();
        }
        while (firstSunday.toLocaleString('default', {weekday: 'short'}) !== "Sun") {
            firstSunday.setDate(firstSunday.getDate() - 1);
        }
    
        const lastSaturday = getCorrectDate(latestDate);
        while (lastSaturday.toLocaleString('default', {weekday: 'short'}) !== "Sat") {
            lastSaturday.setDate(lastSaturday.getDate() + 1);
        }
    
        return {earliestDate, latestDate, todayText, today, firstSunday, lastSaturday}
    }
}

export function showCalendarEventDialog(calendarEvent, OKCallback, cancelCallback) {
    if (!calendarEvent) calendarEvent = {};

    const body = document.querySelector('body');
    const modalBackground = getModalBackground();
    const modalWindow = getModalWindow();
    const modalTitle = getModalTitle("Event");

    // Event name
    const eventNameInput = document.createElement('input');
    eventNameInput.style.cssText = modalInputStyles;
    eventNameInput.value = calendarEvent.name || "";
    const eventNameLabel = document.createElement('label');
    eventNameLabel.textContent = "Event Name";
    eventNameLabel.style.cssText = blockInputLabelStyles;
    eventNameLabel.appendChild(eventNameInput);

    // Start Date
    const dateInput = document.createElement('input');
    dateInput.setAttribute('type', 'date');
    dateInput.style.cssText = jobNameInputStyles;
    dateInput.value = calendarEvent.date || "";
    const dateLabel = document.createElement('label');
    dateLabel.textContent = "Start Date ";
    dateLabel.style.cssText = inputLabelStyles;
    dateLabel.appendChild(dateInput);

    // End Date
    const endDateInput = document.createElement('input');
    endDateInput.setAttribute('type', 'date');
    endDateInput.style.cssText = jobNameInputStyles;
    endDateInput.value = calendarEvent.endDate || calendarEvent.date || "";
    const endDateLabel = document.createElement('label');
    endDateLabel.textContent = "End Date ";
    endDateLabel.style.cssText = inputLabelStyles;
    endDateLabel.appendChild(endDateInput);

    // Text
    const TextArea = document.createElement('textarea');
    TextArea.style.cssText = modalInputTextAreaStyles;
    TextArea.style.height = '5rem';
    TextArea.value = calendarEvent.note || "";
    const eventNoteLabel = document.createElement('label');
    eventNoteLabel.textContent = "Note";
    eventNoteLabel.style.cssText = blockInputLabelStyles;
    eventNoteLabel.appendChild(TextArea);

    // Business Closed checkbox
    const ClosedCheckbox = document.createElement('input');
    ClosedCheckbox.setAttribute('type', 'checkbox');
    // checkbox.style.cssText = modalInputCheckboxStyles;
    if (calendarEvent.closed) ClosedCheckbox.setAttribute('checked', 'checked');
    ClosedCheckbox.style.cssText = jobNameInputStyles;
    // checkbox.value = calendarEvent.closed || false;
    const closedCheckboxLabel = document.createElement('label');
    closedCheckboxLabel.textContent = "Closed";
    closedCheckboxLabel.style.cssText = inLineInputLabelStyles;
    closedCheckboxLabel.style.margin = 'auto';
    // closedCheckboxLabel.style.cssText = blockInputLabelStyles;
    closedCheckboxLabel.appendChild(ClosedCheckbox);

    // Color select
    const colorContainer = document.createElement('div');
    colorContainer.style.cssText = colorContainerStyles;
    let selectedColor = calendarEvent.color || 1;
    for (let colorIndex = 1; colorIndex < 8; colorIndex++) {
        const color = document.createElement('div');
        color.style.cssText = colorSelectBlock;
        if (colorIndex == selectedColor) color.textContent = "✓";
        color.style.backgroundColor = `var(--color-${colorIndex})`;
        color.onclick = () => {
            selectedColor = colorIndex;
            for (const colorBlock of colorContainer.children) {
                colorBlock.textContent = "";
            }
            color.textContent = "✓";
        }
        colorContainer.appendChild(color);
    }

    // OK callback
    const modalOKButton = getButton("OK", () => {
        if ((!eventNameInput.value) || (!dateInput.value)) {
            showAlertDialog(
                (eventNameInput.value ? "": "Please add a event name.\n") +
                (dateInput.value ? "": "Please select a date."));
            return;
        }

        calendarEvent.name = eventNameInput.value;
        calendarEvent.date = dateInput.value;
        calendarEvent.endDate = endDateInput.value || dateInput.value;
        calendarEvent.note = TextArea.value;
        calendarEvent.closed = ClosedCheckbox.checked;
        calendarEvent.color = selectedColor;
        
        const correctedDate = getCorrectDateOrder(calendarEvent.date, calendarEvent.endDate);
        calendarEvent.date = correctedDate.start;
        calendarEvent.endDate = correctedDate.end;

        if (OKCallback) OKCallback(calendarEvent);
        body.removeChild(modalBackground);
    });

    // Cancel callback
    const modalCancelButton = getButton("Cancel", () => {
        if (cancelCallback) cancelCallback();
        body.removeChild(modalBackground);
    });

    const modalButtonContainer = getButtonContainer(modalCancelButton, modalOKButton);

    modalWindow.append(modalTitle, eventNameLabel, dateLabel, endDateLabel, eventNoteLabel, closedCheckboxLabel, colorContainer, modalButtonContainer);
    modalBackground.appendChild(modalWindow);
    body.appendChild(modalBackground);
    
    eventNameInput.focus();
}

export function showJobTaskTimingDialog(jobs, shopTasks, calendarEvents) {
    // console.log(shopTasks);
    const jobsCopy = cleanupAndCopyJobs(jobs);

    const body = document.querySelector('body');
    const modalBackground = getModalBackground();
    modalBackground.style.display = 'block';
    const modalWindow = getModalWindow();
    modalWindow.style.margin = 'auto';
    modalWindow.style.maxWidth = 'max-content';
    modalWindow.style.overflow = 'scroll';
    const modalTitle = getModalTitle("Task Timing Preview");
    const mainContainer = document.createElement('div');
    const jobNamesContainer = document.createElement('div');
    const datesTimesContainer = document.createElement('div');
    const datesContainer = document.createElement('div');
    const timingContainer = document.createElement('div');
    const datesOverlayContainer = document.createElement('div');

    mainContainer.style.cssText = jobTimingMainContainerStyles;

    // Job names
    const jobName = document.createElement('div');
    jobName.textContent = "";
    jobName.style.cssText = jobTimingNamesStyles;
    jobNamesContainer.appendChild(jobName);
    mainContainer.appendChild(jobNamesContainer);
    jobsCopy.forEach(job => {
        const jobName = document.createElement('div');
        jobName.textContent = job.name;
        jobName.style.cssText = jobTimingNamesStyles;
        if (job.sequences.length > 1) jobName.style.height = '2.4em';
        jobNamesContainer.style.cssText = jobTimingNamesContainerStyles;
        jobNamesContainer.appendChild(jobName);
        mainContainer.appendChild(jobNamesContainer);
    });


    // Dates header
    datesContainer.style.cssText = jobTimingDatesContainerStyles;
    const earliestDate = getCorrectDate(findEarliestDate(jobsCopy));
    const latestDate = getCorrectDate(findLatestDate(jobsCopy));
    const closedDatesArray = getClosedDatesArray(calendarEvents);
    incWorkDay(latestDate, 1, closedDatesArray);
    const datesArray = getAllWorkDaysInArray(earliestDate, latestDate, closedDatesArray);
    const numberOfVerticalLines = datesArray.length;
    datesArray.forEach(date => {
        const dateElement = document.createElement('div');
        dateElement.textContent = getShortDateText(date.date);
        dateElement.style.cssText = dateTimingDatesStyles;
        dateElement.classList.add('dialogs-disable-select');
        if (date.dateSkipped) dateElement.style.borderLeftColor = `var(--no)`;
        if (date.dateSkipped) dateElement.style.borderLeftWidth = `5px`;
        datesContainer.appendChild(dateElement);
    });
    datesTimesContainer.style.cssText = jobTimingDateTimesContainerStyles;
    datesTimesContainer.appendChild(datesContainer);
    mainContainer.appendChild(datesTimesContainer);

    // Task times
    // console.log(jobsCopy);
    jobsCopy.forEach(job => {
        job.sequences.forEach(sequence => {
            const timesContainer = document.createElement('div');
            timesContainer.style.cssText = jobTimingTimesContainerStyles;

            for (let lineIndex = 1; lineIndex < numberOfVerticalLines; lineIndex++) {
                const line = document.createElement('div');
                line.style.cssText = jobTimingVerticalLinesStyles;
                line.style.left = `${(lineIndex * 70) - 1}px`;
                timesContainer.appendChild(line);
            }

            let ShipPosition = 0;
            sequence.tasks.forEach(task => {
                ShipPosition = task.end;

                const taskColor = getTaskColorNumber(task.id, shopTasks);

                const taskElement = document.createElement('div');
                taskElement.textContent = (task.completed ? "✓" : "") + task.name;
                taskElement.style.cssText = jobTimingTimesStyles;
                taskElement.style.width = `${Math.abs(task.end - task.start) / 7}px`;
                taskElement.style.left = `${task.start / 7}px`;
                if (task.completed) {
                    taskElement.style.color = `var(--color`;
                    taskElement.style.backgroundColor = `var(--background_color)`;
                }
                else {
                    taskElement.style.backgroundColor = `var(--color-${taskColor})`;
                }
                timesContainer.appendChild(taskElement);

                // Tooltip
                const currentShipDateText = `Current Ship Date:\n${job.shipDate}\n`
                const currentEstimatedDateText = `Estimated Ship Date:\n${job.estimatedDate}\n`
                const taskTime = `${task.hours}:${String(task.minutes).length == 1 ? "0" + task.minutes : task.minutes} hours`;
                const taskCompletedText = `${task.completed ? "✓ Completed" : ""}`
                const tooltipText = `${job.name}\n` +
                                    `${currentShipDateText}` +
                                    `${currentEstimatedDateText}` +
                                    `${task.name}\n` +
                                    `${taskTime}\n` +
                                    `${taskCompletedText}`;
                addTooltip(taskElement, tooltipText, taskColor);
            });

            // Ship date tooltip
            const shipElement = document.createElement('div');
            shipElement.textContent = "Ship Date";
            shipElement.style.cssText = jobTimingTimesStyles;
            const leftPosition = (Math.floor((ShipPosition / 7) / 70) + 1) * 70;
            const elementWidth = 70;
            shipElement.style.width = `${elementWidth}px`;
            shipElement.style.left = `${leftPosition}px`;
            shipElement.style.color = `var(--background_color)`;
            shipElement.style.backgroundColor = `var(--color)`;
            const tooltipText = `${job.name}\nCurrent Ship Date:\n${job.shipDate}\nEstimated Ship Date:\n${job.estimatedDate}`;
            addTooltip(shipElement, tooltipText);
            timesContainer.appendChild(shipElement);

            datesTimesContainer.appendChild(timesContainer);
        });
    });

    function addTooltip(element, tooltipText, borderColor) {
        const tooltip = document.createElement('p');
        tooltip.textContent = tooltipText;
        tooltip.style.cssText = calendarTooltipStyles;
        tooltip.style.borderColor = (borderColor) ? `var(--color-${borderColor})` : 'var(--border_color}';
        element.onmouseover = () => {
            tooltip.style.display = "block";
            element.style.zIndex = '2';
        }
        element.onmousemove = (event) => {
            const numberOfLines = tooltipText.split(/\r\n|\r|\n/).length;
            tooltip.style.top = `calc(${event.clientY}px - ${numberOfLines + 2.5}em)`;
            tooltip.style.left = `${event.clientX}px`;
        }
        element.onmouseleave = () => {
            tooltip.style.display = "none";
            element.style.zIndex = '1';
        }

        body.appendChild(tooltip);
    }

    // Close button
    const modalCloseButton = getCloseButton(() => {
        body.removeChild(modalBackground);
    });

    // Calendar button
    const calendarButton = getButton("Calendar Preview", () => {
        const calendarEvents = [];
        jobsCopy.forEach((job) => {
            calendarEvents.push({name: job.name, startDate: job.startDate || job.estimatedDate, endDate: job.estimatedDate});
        })
        showCalendarPreviewDialog("Calendar Preview", calendarEvents, true, true)
    });
    calendarButton.style.cssText = calendarButtonStyles;

    modalTitle.appendChild(calendarButton);
    modalTitle.appendChild(modalCloseButton);
    modalWindow.append(modalTitle, mainContainer);
    modalBackground.appendChild(modalWindow);
    body.appendChild(modalBackground);

    function getTaskColorNumber(taskID, tasks) {
        let colorNumber = 1;
        tasks.forEach((task, index) => {
            if (taskID == task.id) colorNumber = index + 1;
        });
        return colorNumber;
    }

    /**
    * No active jobs, no jobs without sequences and no completed jobs
    */
    function cleanupAndCopyJobs(jobs) {
        const jobsCopy = [];
        jobs.forEach((job) => {
            if (!job.active) return;
            if (!job.sequences) return;
            if (!Array.isArray(job.sequences)) return;
            // TODO:
            if (!job.sequences.length > 0) return;
            if (!job.sequences[0].tasks) return;
            if (!Array.isArray(job.sequences[0].tasks)) return;
            if (isCompleted(job)) return;
            jobsCopy.push(JSON.parse(JSON.stringify(job)));
        });
        return jobsCopy;
    }

    function findEarliestDate(jobs) {
        let earliestDate = formatDateToCA(getToday());
        jobs.forEach(job => {
            if (job.startDate < earliestDate) {earliestDate = job.startDate}
        });
        return earliestDate;
    }

    function findLatestDate(jobs) {
        let latestDate = formatDateToCA(getToday());
        jobs.forEach(job => {
            if (job.estimatedDate > latestDate) {latestDate = job.estimatedDate}
        });
        return latestDate;
    }

    function getAllWorkDaysInArray(startDate, endDate, closedDates) {
        const dateCounterIndex = getCorrectDate(startDate);
        const endDateText = formatDateToCA(endDate);
        const datesArray = [];
        let dateSkipped = false;
        let currentDateText = formatDateToCA(startDate);
        while (endDateText > currentDateText) {
            currentDateText = formatDateToCA(dateCounterIndex);
            datesArray.push({date: currentDateText, dateSkipped : dateSkipped});
            dateSkipped = incWorkDay(dateCounterIndex, 1, closedDates);
            // dateCounterIndex.setDate(dateCounterIndex.getDate() + 1);
        }
        return datesArray;
    }

    function isCompleted(job) {
        try {
            if (!job.sequences) return true;
            if (!Array.isArray(job.sequences)) return true;
            if (job.sequences.length === 0) return true;
            if (!job.sequences[0].tasks) return;
            if (!Array.isArray(job.sequences[0].tasks)) return true;
            let completed = true;
            job.sequences.forEach((sequence) => {
                if (!sequence.tasks) return;
                sequence.tasks.forEach((jobTask) => {
                    if (!jobTask.completed) completed = false;
                });
            });
            return completed;
        } catch (error) {
            console.warn(`isCompleted() failed for job: ${job.name}.`);
            return true;
        }
    }
}

// Input Dialog
export function showInputDialog(message, defaultText, OKCallback, cancelCallback, inputType, placeholder, options) {
    const body = document.querySelector('body');
    const modalBackground = getModalBackground();
    const modalWindow = getModalWindow();
    const modalTitle = getModalTitle(message);

    let modalInput;
    switch (inputType) {
        case 'textarea':
            modalInput = document.createElement('textarea');
            modalInput.style.cssText = modalInputTextAreaStyles;
        break;
        case 'select':
            modalInput = document.createElement('select');
            modalInput.style.cssText = modalInputStyles;
            options.forEach((text) => {
                const option = document.createElement('option');
                option.textContent = text;
                option.value = text;
                modalInput.appendChild(option);
            });
        break;
        case 'date':
            modalInput = document.createElement('input');
            modalInput.style.cssText = modalInputStyles;
            if (inputType) modalInput.setAttribute('type', 'date');
        break;
        case 'time':
            modalInput = document.createElement('input');
            modalInput.style.cssText = modalInputStyles;
            if (inputType) modalInput.setAttribute('type', 'time');
        break;
        case 'number':
            modalInput = document.createElement('input');
            modalInput.style.cssText = modalInputStyles;
            if (inputType) modalInput.setAttribute('type', 'number');
        break;
        // Text is default
        default:
            modalInput = document.createElement('input');
            modalInput.style.cssText = modalInputStyles;
            modalInput.setAttribute('type', 'text');
        break;
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

// Loading
export async function showLoadingDialog(doneCallback, text) {
    const body = document.querySelector('body');
    const modalBackground = getModalBackground();

    modalBackground.textContent = text || "Loading...";
    
    body.appendChild(modalBackground);
    
    await doneCallback();

    body.removeChild(modalBackground);
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

export function dialogIsOpen () {
    const openDialogs = document.querySelectorAll('.dialog-is-open');
    return openDialogs.length > 0;
}

function getModalBackground() {
    const background = document.createElement('section');
    background.classList.add('dialog-is-open');
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
    btn.onmouseover = (event) => {if (!btn.getAttribute('disabled')) btnMouseOver(event)};
    btn.onmouseleave = (event) => {if (!btn.getAttribute('disabled')) btnMouseLeave(event)};
    return btn;
}

function getButtonContainer() {
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = modalButtonContainerStyles;
    buttonContainer.append(...arguments);
    return buttonContainer;
}

function getCloseButton(callback) {
    const btn = document.createElement('button');
    btn.textContent = "×";
    btn.style.cssText = modalCloseButtonStyles;
    btn.onclick = callback;
    btn.onmouseover = (event) => {if (!btn.getAttribute('disabled')) btnMouseOver(event)};
    btn.onmouseleave = (event) => {if (!btn.getAttribute('disabled')) btnMouseLeave(event)};
    return btn;
}

function addHoverColors(element) {
    element.onmouseover = () => {
        element.style.color = 'var(--background_color)';
        element.style.backgroundColor = 'var(--color)';
    }
    element.onmouseleave = () => {
        element.style.color = 'var(--color)';
        element.style.backgroundColor = 'var(--background_color)';
    }
}

function btnMouseOver(event) {
    event.target.style.color = 'var(--background_color)';
    event.target.style.backgroundColor = 'var(--color)';
}

function btnMouseLeave(event) {
    event.target.style.color = 'var(--color)';
    event.target.style.backgroundColor = 'var(--background_color)';
}

function getCorrectDate(date) {
    // Stupid javascript
    const utcDate = new Date(date);
    return new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
}