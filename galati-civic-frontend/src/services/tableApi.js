import { apiBaseUrl, apiClient, resolveData } from './apiClient';

const buildTablePath = (tableName) => {
    const table = (tableName || '').trim();
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
        throw new Error('Numele tabelei este invalid.');
    }
    return `/tables/${table}`;
};

export const listTableRows = async (tableName, options = {}) => {
    const response = await apiClient.get(buildTablePath(tableName), { params: options });
    return resolveData(response.data);
};

export const createTableRow = async (tableName, payload) => {
    const response = await apiClient.post(buildTablePath(tableName), payload);
    return resolveData(response.data);
};

export const updateTableRow = async (tableName, id, payload) => {
    const response = await apiClient.put(`${buildTablePath(tableName)}/${id}`, payload);
    return resolveData(response.data);
};

export const deleteTableRow = async (tableName, id) => {
    await apiClient.delete(`${buildTablePath(tableName)}/${id}`);
};

export { apiBaseUrl };