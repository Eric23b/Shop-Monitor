
export async function getDBEntrees(schema, table, searchColumn, searchValue, serverSettings, dbActiveCallback) {    
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

    if (dbActiveCallback) dbActiveCallback(!response.error);

    return response;
}

export async function insertDBEntry(schema, table, data, serverSettings, dbActiveCallback) {
    const headers = getBasicHeaders(serverSettings.authorization);
    const raw = JSON.stringify({
        operation: "insert",
        schema: schema,
        table: table,
        records: [data]
    });
    const requestOptions = buildRequestOptions(headers, raw);
    const response = await sendDBRequest(serverSettings.url, requestOptions);

    if (dbActiveCallback) dbActiveCallback(!response.error);
}

export async function updateDBEntry(schema, table, data, serverSettings, dbActiveCallback) {
    const headers = getBasicHeaders(serverSettings.authorization);
    const raw = JSON.stringify({
        operation: "update",
        schema: schema,
        table: table,
        records: [data]
    });
    const requestOptions = buildRequestOptions(headers, raw);
    const response = await sendDBRequest(serverSettings.url, requestOptions);

    if (dbActiveCallback) dbActiveCallback(!response.error);
}

export async function deleteDBEntry(schema, table, id, serverSettings, dbActiveCallback) {
    const headers = getBasicHeaders(serverSettings.authorization);
    const raw = JSON.stringify({
        operation: "delete",
        schema: schema,
        table: table,
        hash_values: [id]
    });
    const requestOptions = buildRequestOptions(headers, raw);
    const response = await sendDBRequest(serverSettings.url, requestOptions);

    if (dbActiveCallback) dbActiveCallback(!response.error);
}

export async function createSchema(schema, serverSettings, dbActiveCallback) {
    const headers = getBasicHeaders(serverSettings.authorization);
    const raw = JSON.stringify({
        operation: "create_schema",
        schema: schema,
    });
    const requestOptions = buildRequestOptions(headers, raw);
    const response = await sendDBRequest(serverSettings.url, requestOptions);

    if (dbActiveCallback) dbActiveCallback(!response.error);

    if (response.message) {
        return response.message;
    }
    else {
        return response.error;
    }
}

export async function createTable(table, schema, serverSettings, dbActiveCallback) {
    const headers = getBasicHeaders(serverSettings.authorization);
    const raw = JSON.stringify({
        "operation": "create_table",
        "schema": schema,
        "table": table,
        "hash_attribute": "id"
    });
    const requestOptions = buildRequestOptions(headers, raw);
    const response = await sendDBRequest(serverSettings.url, requestOptions);

    if (dbActiveCallback) dbActiveCallback(!response.error);

    if (response.message) {
        return response.message;
    }
    else {
        return response.error;
    }
}

/**
 * Adds columns/attributes to a table 
 * @param {[String]} attributes - An array of column/attribute titles
 * @param {String} table
 * @param {String} schema
 * @param {{url:String, authorization:String}} serverSettings
 * @param {callback} dbActiveCallback
 * @return {String}  Database messages
 */
export async function createAttributes(attributes, table, schema, serverSettings, dbActiveCallback) {
    let message = "";
    for (const attribute of attributes) {
        message += await createAttribute(attribute, table, schema, serverSettings, dbActiveCallback) + "\n";
    }
    return message.trim();
}
/**
 * Adds column/attribute to a table
 * @param {String} attribute - column/attribute title
 * @param {String} table
 * @param {String} schema
 * @param {{url:String, authorization:String}} serverSettings
 * @param {callback} dbActiveCallback
 * @return {String}  Database message
 */
export async function createAttribute(attribute, table, schema, serverSettings, dbActiveCallback) {
    const headers = getBasicHeaders(serverSettings.authorization);
    const raw = JSON.stringify({
        "operation": "create_attribute",
        "schema": schema,
        "table": table,
        "attribute": attribute
    });
    const requestOptions = buildRequestOptions(headers, raw);
    const response = await sendDBRequest(serverSettings.url, requestOptions);
    
    if (dbActiveCallback) dbActiveCallback(!response.error);

    if (response.message) {
        return response.message;
    }
    else {
        return response.error;
    }
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
    try {
        const response = await fetch(url, requestOptions);
        const data = await response.json();
        return data;
    } catch (error) {
    }
}