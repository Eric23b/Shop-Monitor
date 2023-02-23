export function getDueInDaysFromNowText(shipDate) {
    const dueInDaysFromNow = differenceInDays(formatDateToCA(getToday()), shipDate);
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
    const today = formatDateToCA(getToday());
    if (typeof startDate !== "string") return {start: today, end: today}
    if (typeof endDate !== "string") return {start: today, end: today}
    // cols
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

export function formatDateToCA(inputDate) {
    if (typeof inputDate === 'string') {
        let outputString = inputDate.replace( /\//g, "-");
        if (outputString.split("-")[2].length == 4) {
            const day = padNumberWithZero(outputString.split("-")[1]);
            const month = padNumberWithZero(outputString.split("-")[0]);
            const year = padNumberWithZero(outputString.split("-")[2]);
            outputString = `${year}-${month}-${day}`;
        }
        return outputString;
    }
    else {
        return `${inputDate.getFullYear()}-${padNumberWithZero(inputDate.getMonth() + 1)}-${padNumberWithZero(inputDate.getDate())}`;
    }
    function padNumberWithZero(number) {
        if (number <= 9) {
            return `0${Number(number)}`;
        }
        return String(number);
    }
}

export function offsetMonthBecauseJSIsStupid(date) {
    return [date.split("-")[0], Number(date.split("-")[1]) - 1, date.split("-")[2]].join("-");
}

export function isToday(date) {
    return (formatDateToCA(date) == formatDateToCA(getToday()));
}

export function getToday() {
    return new Date();
    // const utcDate = new Date();
    // return new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
}

export function getTomorrow() {
    const today = getToday();
    incWorkDay(today, 1);
    return today;
}

export function getMonth(length) {
    return (new Date()).toLocaleString("en-CA", {month: length});
}

/**
* eg. Nov 21
*/
export function getShortDateText(date) {
    try {
        const dateOBJ = new Date(date.split("-")[0], Number(date.split("-")[1]) - 1, date.split("-")[2]);
        let shipDateText = dateOBJ.toLocaleString("en-CA", { month: "short" });
        shipDateText += " " + dateOBJ.getDate();
        // console.log(shipDateText);
        return shipDateText.replace(".", "");
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
        if ((closedDates) && ((closedDates).indexOf(formatDateToCA(date)) > -1)) {skippedDate = true; continue;};

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
        closedDatesArray.push(formatDateToCA(indexDateObj));
        while (formatDateToCA(indexDateObj) != end) {
            indexDateObj.setDate(indexDateObj.getDate() + 1);
            closedDatesArray.push(formatDateToCA(indexDateObj));

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