export function getDueInDaysFromNowText(shipDate) {
    const dueInDaysFromNow = differenceInDays((new Date()).toLocaleDateString('en-CA'), shipDate);
    if (dueInDaysFromNow > 0) {
        const dueInDaysPlural = (dueInDaysFromNow > 1) ? "s" : "";
        return `Due in ${dueInDaysFromNow} day${dueInDaysPlural}`;
    }
    else if (dueInDaysFromNow < 0) {
        const dueInDaysPlural = (Math.abs(dueInDaysFromNow) > 1) ? "s" : "";
        return `Due ${Math.abs(dueInDaysFromNow)} day${dueInDaysPlural} ago`;
    }
    else {
        return `Due today`;
    }
}

export function getCorrectDateOrder(startDate, endDate) {
    if (startDate.replaceAll("-", "") > endDate.replaceAll("-", "")) {
        return {start: endDate, end: startDate};
    }
    else {
        return {start: startDate, end: endDate};
    }
}

export function differenceInDays(dateOne, dateTwo) {
        const date1 = getCorrectDate(dateOne);
        const date2 = getCorrectDate(dateTwo);
        
        const differenceInTime = date2.getTime() - date1.getTime();
        const differenceInDays = differenceInTime / (1000 * 3600 * 24);
    
        return Math.floor(differenceInDays);
    }

export function getCorrectDate(date) {
    // Stupid javascript
    const utcDate = new Date(date);
    return new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
}

export function offsetMonthBecauseJSIsStupid(date) {
    return [date.split("-")[0], Number(date.split("-")[1]) - 1, date.split("-")[2]].join("-")
}

export function getToday() {
    const utcDate = new Date();
    return new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
}

/**
* eg. Nov 21
*/
export function getShortDateText(date) {
    try {
        const dateOBJ = new Date(date.split("-")[0], Number(date.split("-")[1]) - 1, date.split("-")[2]);
        let shipDateText = dateOBJ.toLocaleString("en-CA", { month: "short" });
        shipDateText += " " + dateOBJ.getDate();
        return shipDateText;
    } catch (error) {
        console.error("getShortDateText() failed:\n" + error);
        return "";
    }
}

/**
* eg. November 21
*/
export function getLongDateText(date) {
    try {
        const shipDateObj = new Date(date.split("-")[0], Number(date.split("-")[1]) - 1, date.split("-")[2]);
        let shipDateText = shipDateObj.toLocaleString("en-CA", { month: "long" });
        shipDateText += " " + shipDateObj.getDate();
        shipDateText += "/" + shipDateObj.getFullYear();
        return shipDateText;
    } catch (error) {
        console.error("getLongDateText() failed:\n" + error);
        return "";
    }
}

export function incWorkDay(date, amount, closedDates) {
    let index = 0;

    let skippedDate = false;
    while (index < amount) {
        date.setDate(date.getDate() + 1);

        const dayName = (date.toLocaleString('default', {weekday: 'short'}));
        if (dayName === "Sat") {skippedDate = true; continue;};
        if (dayName === "Sun") {skippedDate = true; continue;};
        if ((closedDates) && ((closedDates).indexOf(date.toLocaleDateString('en-CA')) > -1)) {skippedDate = true; continue;};

        index++;
    }
    return skippedDate;
}

export function getClosedDatesArray(calendarEvents) {
    const closedDatesArray = [];    
    calendarEvents.forEach((calendarEvent) => {
        if (!calendarEvent.closed) return;

        let start = calendarEvent.date;
        let end = calendarEvent.endDate || calendarEvent.date;

        // Correct date order if any
        if (start > end) {
            const tempStart = start;
            start = end;
            end = tempStart;
        }

        if (start == end) {
            closedDatesArray.push(start);
            return;
        }
        
        let errorCounter = 1;
        const indexDateObj = getCorrectDate(start);
        closedDatesArray.push(indexDateObj.toLocaleDateString('en-CA'));
        while (indexDateObj.toLocaleDateString('en-CA') != end) {
            indexDateObj.setDate(indexDateObj.getDate() + 1);
            closedDatesArray.push(indexDateObj.toLocaleDateString('en-CA'));

            if (errorCounter++ > 365) {console.error('Closed Date While Loop Endless!'); break}
        }
    });

    // No duplicates
    const filteredDatesArray = [];
    closedDatesArray.forEach((date) => {
        if (filteredDatesArray.indexOf(date) == -1) {
            filteredDatesArray.push(date);
        }
    });

    return filteredDatesArray;
}