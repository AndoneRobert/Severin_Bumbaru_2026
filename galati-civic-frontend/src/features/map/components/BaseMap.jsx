import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ensureLeafletDefaultIcon } from '../utils/mapIcons';

const BaseMap = ({
    center = [45.4353, 28.008],
    zoom = 13,
    style = { height: '100%', width: '100%' },
    tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution = '&copy; OpenStreetMap contributors',
    children,
}) => {
    ensureLeafletDefaultIcon();

    return (
        <MapContainer center={center} zoom={zoom} style={style}>
            <TileLayer url={tileUrl} attribution={attribution} />
            {children}
        </MapContainer>
    );
};

export default BaseMap;
