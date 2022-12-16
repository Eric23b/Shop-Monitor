export const INVENTORY_SCHEMA = "inventory_schema";
export const SUPPLY_LIST_TABLE = "supply_list";

export const ISSUE_SCHEMA = "issues_schema";
export const PARTS_ISSUES_TABLE = "parts_issues";
export const SUPPLY_ISSUES_TABLE = "supply_issues";
export const TIME_CLOCK_ISSUES_TABLE = "time_clock_issues";
export const OTHER_ISSUES_TABLE = "other_issues";

export const LOGS_SCHEMA = "logs_schema";
export const TIMER_TABLE = "timer_table";
export const COMPLETED_TIMER_TABLE = "completed_timers";
export const RUNNING_TIMER_TABLE = "running_timers";

export const BUSINESS_SCHEMA = "business_schema";
export const EMPLOYEES_TABLE = "employees";
export const JOBS_TABLE = "jobs";
export const STATIONS_TABLE = "stations";
export const TASKS_TABLE = "tasks";
export const CALENDAR_TABLE = "calendar";

export const SYSTEM_SCHEMA = "system_schema";
export const MESSAGES_TABLE = "message";

export const TABLE_ATTRIBUTES = {
    supplyList: ["category", "item"],

    partsIssues: ["cabinetNumber", "date", "jobName", "note", "part", "sent", "show", "time"],
    supplyIssues: ["category", "item", "currently", "date", "note", "ordered", "show", "time"],
    timeClockIssues: ["firstName", "date", "acknowledged", "missedTime", "note", "time"],
    otherIssues: ["date", "acknowledged", "note", "time"],

    timer_logs: ["employeeName", "employeeID", "eventType", "jobName", "jobID", "station", "task", "time", "date"],
    running_timers: ["employeeName", "employeeID", "jobName", "jobID", "station", "task", "time", "date"],
    completed_timers: ["employeeName", "employeeID", "jobName", "jobID", "station", "task", "durationMS", "durationTime", "timerStart", "timerEnd", "date"],

    employees: ["active", "name", "stations"],
    jobs: ["active", "finishType", "name", "checklist", "shipDate", "note"],
    stations: ["active", "name", "tasks", "editing"],
    tasks: ["active", "name", "hours", "minutes"],
    calendar: ["name", "date", "endDate", "dates", "closed", "color", "note"],
}
