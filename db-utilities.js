
export async function getDBEntrees(schema, table, searchColumn, searchValue, serverSettings, dbActiveCallback) {
    dbActiveCallback();
    const headers = getBasicHeaders(serverSettings.authorization);
    const raw = JSON.stringify({
        operation: "search_by_value",
        schema: schema,
        table: table,
        search_attribute: searchColumn,
        search_value: searchValue,
        get_attributes: ["*"]
    });
    const requestOptions = buildRequestOptions(headers, raw);
    const response = await sendDBRequest(serverSettings.url, requestOptions);
    // console.log(response);
    return response;
}

export async function insertDBEntry(schema, table, data, serverSettings, dbActiveCallback) {
    dbActiveCallback();
    const headers = getBasicHeaders(serverSettings.authorization);
    const raw = JSON.stringify({
        operation: "insert",
        schema: schema,
        table: table,
        records: [data]
    });
    const requestOptions = buildRequestOptions(headers, raw);
    const response = await sendDBRequest(serverSettings.url, requestOptions);
    // console.log(response);
}

export async function updateDBEntry(schema, table, data, serverSettings, dbActiveCallback) {
    dbActiveCallback();
    const headers = getBasicHeaders(serverSettings.authorization);
    const raw = JSON.stringify({
        operation: "update",
        schema: schema,
        table: table,
        records: [data]
    });
    const requestOptions = buildRequestOptions(headers, raw);
    const response = await sendDBRequest(serverSettings.url, requestOptions);
    // console.log(response);
}

export async function deleteDBEntry(schema, table, id, serverSettings, dbActiveCallback) {
    dbActiveCallback();
    const headers = getBasicHeaders(serverSettings.authorization);
    const raw = JSON.stringify({
        operation: "delete",
        schema: schema,
        table: table,
        hash_values: [id]
    });
    const requestOptions = buildRequestOptions(headers, raw);
    const response = await sendDBRequest(serverSettings.url, requestOptions);
    // console.log(response);
}

function getBasicHeaders(authorization) {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", `Basic ${authorization}`);
    return headers;
}

function buildRequestOptions(headers, body) {
    return {
        method: 'POST',
        headers: headers,
        body: body,
        redirect: 'follow'
    };
}

async function sendDBRequest(url, requestOptions) {
    const response = await fetch(url, requestOptions);
    if (!response.ok) {
        console.error(response.statusText);
    }
    const data = await response.json();
    return data;
}