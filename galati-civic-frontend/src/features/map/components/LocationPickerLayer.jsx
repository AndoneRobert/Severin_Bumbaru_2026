import React from 'react';
import { Marker, Popup, useMapEvents } from 'react-leaflet';
import { SELECTED_ICON } from '../utils/mapIcons';

const LocationPickerLayer = ({ enabled = true, location, onPickLocation, icon = SELECTED_ICON, renderPopup, popupMaxWidth = 300 }) => {
    useMapEvents({
        click(e) {
            if (!enabled || !onPickLocation) return;
            onPickLocation(e.latlng);
        },
    });

    if (!location) return null;

    const markerPosition = Array.isArray(location) ? location : [location.lat, location.lng];
    return (
        <Marker position={markerPosition} icon={icon}>
            {renderPopup && <Popup maxWidth={popupMaxWidth} closeOnClick={false}>{renderPopup()}</Popup>}
        </Marker>
    );
};

export default LocationPickerLayer;
