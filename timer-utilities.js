import {getDBEntrees,
    insertDBEntry,
    deleteDBEntry,
} from "/db-utilities.js";

import {
    LOGS_SCHEMA,
    // TIMER_TABLE,
    RUNNING_TIMER_TABLE,
    COMPLETED_TIMER_TABLE,
    BUSINESS_SCHEMA,
    EMPLOYEES_TABLE,
    STATIONS_TABLE,
    JOBS_TABLE,
} from "/directives.js";

export class Timer {
    constructor(callback, duration) {
        let timerObj = setInterval(callback, duration);

        this.stop = function () {
            if (timerObj) {
                clearInterval(timerObj);
                timerObj = null;
            }
            return this;
        };

        // start timer using current settings (if it's not already running)
        this.start = function () {
            if (!timerObj) {
                this.stop();
                timerObj = setInterval(callback, duration);
            }
            return this;
        };

        // start with new or original interval, stop current interval
        this.reset = function (newT = duration) {
            duration = newT;
            return this.stop().start();
        };
    }
}

export async function startOverTimeTimer(station, serverSettings, stopRunningTimersCallback, refreshTimersUICallback) {
    await checkOverTimers(station, serverSettings, stopRunningTimersCallback, refreshTimersUICallback);
    setInterval( async () => {
        await checkOverTimers(station, serverSettings, stopRunningTimersCallback, refreshTimersUICallback);
    }, 60000);
}

export async function checkOverTimers(station, serverSettings, stopRunningTimersCallback, refreshTimersUICallback) {
    const employeeResponse = await getDBEntrees(BUSINESS_SCHEMA, EMPLOYEES_TABLE, "stations", `*${station}*`, serverSettings);
    if ((!employeeResponse) || (employeeResponse.error) || (employeeResponse.length == 0)) return true;
    
    const runningTimersResponse = await getDBEntrees(LOGS_SCHEMA, RUNNING_TIMER_TABLE, "station", station, serverSettings);
    if ((!runningTimersResponse) || (runningTimersResponse.error || (runningTimersResponse.length == 0))) return true;

    runningTimersResponse.forEach(async runningTimer => {
        employeeResponse.forEach(async employee => {
            if (runningTimer.employeeID == employee.id) {
                if (employee.shiftEnd && employee.shiftEnd.includes(":")) {
                    const theTime = timeToDecimal((new Date()).toLocaleTimeString());
                    const shiftEnd = timeToDecimal(employee.shiftEnd);
                    if (theTime >= shiftEnd) {
                        await stopRunningTimersCallback(runningTimer, station, serverSettings, refreshTimersUICallback);
                    }
                }
            }
        });
    });
}
export async function stopRunningTimer(runningTimer, station, serverSettings, refreshTimersUICallback) {
    const runningTimersResponse = await getDBEntrees(LOGS_SCHEMA, RUNNING_TIMER_TABLE, "id", runningTimer.id, serverSettings);
    if ((!runningTimersResponse) || (runningTimersResponse.error || (runningTimersResponse.length == 0))) return true;
    insertDBEntry(
        LOGS_SCHEMA,
        COMPLETED_TIMER_TABLE,
        {
            employeeName: runningTimer.employeeName,
            employeeID: runningTimer.employeeID,
            jobName: runningTimer.jobName,
            jobID: runningTimer.jobID,
            station: station,
            task: runningTimer.task,
            taskID: runningTimer.taskID || "",
            date: (new Date()).toLocaleDateString(),
            timeStart: runningTimer.time,
            timeEnd: (new Date()).toLocaleTimeString(),
            durationMS: Date.now() - runningTimersResponse[0].__createdtime__,
            durationTime: msToTime(Date.now() - runningTimersResponse[0].__createdtime__),
            submitType: "timed",
        }, 
        serverSettings
    );
    // showMessage("Stopped");
    await deleteDBEntry(LOGS_SCHEMA, RUNNING_TIMER_TABLE, runningTimer.id, serverSettings);

    if (refreshTimersUICallback) {
        await refreshTimersUICallback();
    }
}

export function addNumberOfRunningTimersToTimerPageLink(timerPageLinkElement, stationName, settings) {
    addTextToAfterElement();

    setInterval(async () => {
        await addTextToAfterElement();
    }, 60000);

    async function addTextToAfterElement() {
        if (stationName === "") return;

        const numberOfTimers = await numberOfRunningTimers(stationName, settings);
        let linkText = "Timer";
        let afterText = "";
        if (numberOfTimers > 0) {
            linkText = "Timers";
            afterText = `(${numberOfTimers})`;
        }
        timerPageLinkElement.textContent = linkText;
        timerPageLinkElement.setAttribute('data-number-of-running-timers', afterText);
    }
}

export async function numberOfRunningTimers(station, serverSettings) {
    const runningTimersResponse = await getDBEntrees(LOGS_SCHEMA, RUNNING_TIMER_TABLE, "station", station, serverSettings);
    if ((!runningTimersResponse) || (runningTimersResponse.error || (runningTimersResponse.length == 0))) {
        return 0;
    }
    else {
        return runningTimersResponse.length;
    }
}

export function timeToDecimal(time) {
    const hours24 = (time.includes("p") || time.includes("P")) ? 12 : 0;
    const nowHours = Number(time.split(':')[0]) + hours24;
    const nowMins = time.split(':')[1];
    return Number(nowHours + nowMins);
}


function msToTime(s) {
    const ms = s % 1000;
    s = (s - ms) / 1000;
    const secs = s % 60;
    s = (s - secs) / 60;
    const mins = s % 60;
    const hrs = (s - mins) / 60;
  
    return hrs + ':' + mins + ':' + secs;
    // return hrs + ':' + mins + ':' + secs + '.' + ms;
  }

// export async function getDBEntrees() {

// }