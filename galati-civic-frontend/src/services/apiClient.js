import axios from 'axios';

export const apiBaseUrl = (import.meta.env.VITE_API_URL || 'https://severin-bumbaru-2026.onrender.com/api').replace(/\/+$/, '');

export const authConfig = (token) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);

export const resolveData = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === 'object') {
        if (Array.isArray(payload.data)) return payload.data;
        if (Array.isArray(payload.items)) return payload.items;
        if (Array.isArray(payload.issues)) return payload.issues;
    }
    return payload;
};

export const apiClient = axios.create({
    baseURL: apiBaseUrl,
});
