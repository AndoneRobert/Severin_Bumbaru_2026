import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let defaultIconConfigured = false;

export const ensureLeafletDefaultIcon = () => {
    if (defaultIconConfigured) return;
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });
    defaultIconConfigured = true;
};

export const makePinIcon = (color) => L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:${color};border:2.5px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.4);transform:rotate(-45deg);"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -30],
});

export const STATUS_COLORS = {
    Nou: '#ef4444',
    'În lucru': '#f59e0b',
    'În verificare': '#3b82f6',
    Rezolvat: '#10b981',
};

export const STATUS_ICONS = Object.fromEntries(
    Object.entries(STATUS_COLORS).map(([status, color]) => [status, makePinIcon(color)]),
);

export const SELECTED_ICON = makePinIcon('#a855f7');

export const getIssueIcon = (status, isSelected = false) => {
    if (isSelected) return SELECTED_ICON;
    return STATUS_ICONS[status] || STATUS_ICONS.Nou;
};
