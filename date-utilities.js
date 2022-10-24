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