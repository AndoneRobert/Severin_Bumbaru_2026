import axios from 'axios';

const apiBaseUrl = (import.meta.env.VITE_API_URL || 'https://severin-bumbaru-2026.onrender.com/api').replace(/\/+$/, '');

const buildTablePath = (tableName) => {
    const table = (tableName || '').trim();
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
        throw new Error('Numele tabelei este invalid.');
    }
    return `${apiBaseUrl}/tables/${table}`;
};

export const listTableRows = async (tableName, options = {}) => {
    const response = await axios.get(buildTablePath(tableName), { params: options });
    return response.data;
};

export const createTableRow = async (tableName, payload) => {
    const response = await axios.post(buildTablePath(tableName), payload);
    return response.data;
};

export const updateTableRow = async (tableName, id, payload) => {
    const response = await axios.put(`${buildTablePath(tableName)}/${id}`, payload);
    return response.data;
};

export const deleteTableRow = async (tableName, id) => {
    await axios.delete(`${buildTablePath(tableName)}/${id}`);
};

export { apiBaseUrl };