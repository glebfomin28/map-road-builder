import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import { MapClickHandler } from './partials/map-click-handler';
import { useMapRoad } from './hooks/use-map-road';
import { GeojsonUploader } from './partials/geojson-uploader';
import { useState } from 'react';
import { IGeoJsonCollection } from './map-road-builder.domain';
import styles from './map-road-builder.module.css';
import 'leaflet/dist/leaflet.css';

const UAE_COORDINATES: [number, number] = [25.276987, 55.296249];

export function MapRoadBuilder() {
    const [dataGeoJson, setDataGeoJson] = useState<IGeoJsonCollection | null>(null);

    const {
        markerPositions,
        routeCoords,
        // isLoadingGeoJson,
        // errorGeoJson,
        // reloadGeoJson,
        handleMarkerClick,
        handleMapClick
    } = useMapRoad(dataGeoJson);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <GeojsonUploader setGeoJsonData={setDataGeoJson} />
            {/*{isLoadingGeoJson && !errorGeoJson && <LoadingOverlay />}*/}
            {/*{errorGeoJson && <ErrorOverlay errorText={errorGeoJson} reload={reloadGeoJson} />}*/}
            <MapContainer className={styles.map_container} center={UAE_COORDINATES} zoom={13} scrollWheelZoom>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                />
                <MapClickHandler handleClick={handleMapClick} />
                {markerPositions.map((pos, i) => (
                    <Marker
                        key={i}
                        position={pos}
                        eventHandlers={{
                            click: () => handleMarkerClick(i)
                        }}
                    />
                ))}
                {routeCoords.length > 1 && (
                    <Polyline positions={routeCoords} pathOptions={{ color: 'green', weight: 3 }} />
                )}
            </MapContainer>
        </div>
    );
}
