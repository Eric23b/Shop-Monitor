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

const modalInputStyles = `
    width: 100%;
    padding: 0.25rem;
    font-size: 1.2rem;
    border: 1px solid var(--border_color); `;

const modalInputTextAreaStyles = `
    width: 100%;
    padding: 0.25rem;
    font-size: 1.2rem;
    border: 1px solid var(--border_color); `;

const inlineInputLabelStyles = `
    font-size: 1.2rem;`;
const blockInputLabelStyles = `
    width: 100%;
    display: flex;
    flex-direction: column;
    font-size: 1.2rem;`;
const jobNameInputStyles = `
    width: 100%;
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

const jobCardTitleStyles = `
    margin: 0;`;
const jobCardShipDateStyles = `
    margin: 0;`;
const jobCardDueInDaysStyles = `
    margin: 0;`;

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
    dueInDays.textContent = job.shipDate;
    dueInDays.style.cssText = jobCardDueInDaysStyles;

    // Ok button
    const okBtn = getButton("OK", () => {
        body.removeChild(modalBackground);
    });
    
    modalWindow.append(jobTitle, shipDate, dueInDays, okBtn);
    modalBackground.appendChild(modalWindow);
    body.appendChild(modalBackground);
}

export function showJobDialog(job, jobs, allTasks, OKCallback, cancelCallback) {
    const isNewJob = job === null;

    if (!job) job = {active: true};

    const body = document.querySelector('body');
    const modalBackground = getModalBackground();
    const modalWindow = getModalWindow();
    modalWindow.style.alignItems = 'center';

    // Job Name
    const jobNameInput = document.createElement('input');
    jobNameInput.style.cssText = jobNameInputStyles;
    jobNameInput.value = job.name || "";
    const jobNameLabel = document.createElement('label');
    jobNameLabel.textContent = "Job Name ";
    jobNameLabel.style.cssText = inlineInputLabelStyles;
    jobNameLabel.appendChild(jobNameInput);

    // Job Ship Date
    const jobShipDateInput = document.createElement('input');
    jobShipDateInput.setAttribute('type', 'date');
    jobShipDateInput.style.cssText = jobNameInputStyles;
    jobShipDateInput.value = job.shipDate || "";
    const jobShipDateLabel = document.createElement('label');
    jobShipDateLabel.textContent = "Ship Date ";
    jobShipDateLabel.style.cssText = inlineInputLabelStyles;
    jobShipDateLabel.appendChild(jobShipDateInput);

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
        job.shipDate = jobShipDateInput.value;
        job.note = jobNotesTextArea.value;

        if (OKCallback) OKCallback(job);
        body.removeChild(modalBackground);
    });
    // Cancel button
    const cancelBtn = getButton("Cancel", () => {
        if (cancelCallback) cancelCallback(job);
        body.removeChild(modalBackground);
    });
    // Button container
    const buttonContainer = getButtonContainer(cancelBtn, OKBtn);

    modalWindow.append(jobNameLabel, jobShipDateLabel, jobNoteLabel, sequenceLabel, modalButtonContainer, buttonContainer);
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
            taskElement.textContent = `${task.name} ${task.hours}:${String(task.minutes).length < 2 ? "0" : ""}${task.minutes}`;

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
    sequenceNameInput.value = sequenceName;
    sequenceNameInput.disabled = sequenceName ? true : false;
    const sequenceNameDataList = document.createElement('datalist');
    sequenceNameDataList.setAttribute('id','sequence-name-data-list')
    const optionsText = ["Cabinets", "Veneers", "Doors", "Add-on"];
    optionsText.forEach((sequenceNameOption) => {
        const sequenceName = document.createElement('option');
        sequenceName.value = sequenceNameOption;
        sequenceNameDataList.appendChild(sequenceName);
    });
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
        if (OKCallback) OKCallback(sequenceName, task);
        body.removeChild(modalBackground);
    });

    const modalCancelButton = getButton("Cancel", () => {
        if (cancelCallback) cancelCallback();
        body.removeChild(modalBackground);
    });

    const modalButtonContainer = getButtonContainer(modalCancelButton, modalOKButton);

    modalWindow.append(modalTitle, sequenceNameLabel, taskNameLabel, shopTimeLabel, modalButtonContainer);
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
    const sequenceNameLabel = document.createElement('label');
    sequenceNameLabel.textContent = "Sequence Name";
    sequenceNameLabel.style.cssText = blockInputLabelStyles;
    sequenceNameLabel.appendChild(sequenceNameInput);
    sequenceNameLabel.appendChild(sequenceNameDataList);

    // Text
    const TextArea = document.createElement('textarea');
    TextArea.style.cssText = modalInputTextAreaStyles;
    TextArea.style.height = '15rem';
    const sequenceTextLabel = document.createElement('label');
    sequenceTextLabel.textContent = "Text";
    sequenceTextLabel.style.cssText = blockInputLabelStyles;
    sequenceTextLabel.appendChild(TextArea);

    TextArea.value = `Job Labor   53 hours 47 minutes
    Cutting   10 hours 0 minutes
    Banding 10 hours 0 minutes
    Assembly 10 hours 0 minutes
    Finishing 10 hours 0 minutes
    Packaging    10 hours 0 minutes`;

    const modalOKButton = getButton("OK", () => {
        const sequenceName = sequenceNameInput.value;
        const text = TextArea.value;
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

    // Event Date
    const dateInput = document.createElement('input');
    dateInput.setAttribute('type', 'date');
    dateInput.style.cssText = jobNameInputStyles;
    dateInput.value = calendarEvent.date || "";
    const dateLabel = document.createElement('label');
    dateLabel.textContent = "Date ";
    dateLabel.style.cssText = inlineInputLabelStyles;
    dateLabel.appendChild(dateInput);

    // Text
    const TextArea = document.createElement('textarea');
    TextArea.style.cssText = modalInputTextAreaStyles;
    TextArea.style.height = '5rem';
    TextArea.value = calendarEvent.note || "";
    const eventNoteLabel = document.createElement('label');
    eventNoteLabel.textContent = "Note";
    eventNoteLabel.style.cssText = blockInputLabelStyles;
    eventNoteLabel.appendChild(TextArea);

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

    const modalOKButton = getButton("OK", () => {
        if ((!eventNameInput.value) || (!dateInput.value)) {
            showAlertDialog(
                (eventNameInput.value ? "": "Please add a event name.\n") +
                (dateInput.value ? "": "Please select a date."));
            return;
        }
        calendarEvent.name = eventNameInput.value;
        calendarEvent.date = dateInput.value;
        calendarEvent.note = TextArea.value;
        calendarEvent.color = selectedColor;
        if (OKCallback) OKCallback(calendarEvent);
        body.removeChild(modalBackground);
    });

    const modalCancelButton = getButton("Cancel", () => {
        if (cancelCallback) cancelCallback();
        body.removeChild(modalBackground);
    });

    const modalButtonContainer = getButtonContainer(modalCancelButton, modalOKButton);

    modalWindow.append(modalTitle, eventNameLabel, dateLabel, eventNoteLabel, colorContainer, modalButtonContainer);
    modalBackground.appendChild(modalWindow);
    body.appendChild(modalBackground);
    
    eventNameInput.focus();
}

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