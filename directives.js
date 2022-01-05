export const INVENTORY_SCHEMA = "inventory_schema";
export const SUPPLY_LIST_TABLE = "supply_list";

export const ISSUE_SCHEMA = "issues_schema";
export const PARTS_ISSUES_TABLE = "parts_issues";
export const SUPPLY_ISSUES_TABLE = "supply_issues";
export const TIME_CLOCK_ISSUES_TABLE = "time_clock_issues";
export const OTHER_ISSUES_TABLE = "other_issues";

export const TABLE_ATTRIBUTES = {
    supplyList: ["category", "item"],
    partsIssues: ["cabinetNumber", "date", "jobName", "note", "part", "sent", "show", "time"],
    supplyIssues: ["category", "item", "currently", "date", "note", "ordered", "show", "time"],
    timeClockIssues: ["firstName", "date", "acknowledged", "missedTime", "note", "time"],
    otherIssues: ["date", "acknowledged", "note", "time"],
}
