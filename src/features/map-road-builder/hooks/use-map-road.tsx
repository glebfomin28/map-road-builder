import { useCallback, useEffect, useState } from 'react';
import type { LeafletMouseEvent } from 'leaflet';
import {
    buildGraph,
    convertPathToLatLngArray,
    dijkstra,
    findClosestNode,
    getBBox,
    getFilteredFeatures
} from '../map-road-builder.utilities';
import { IGeoJsonCollection } from '../map-road-builder.domain';

export const useMapRoad = (dataGeoJson: IGeoJsonCollection | null) => {
    const [markerPositions, setMarkerPositions] = useState<[number, number][]>([]);
    const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

    // Удаление маркера по клику
    const handleMarkerClick = (i: number) => {
        const copy = [...markerPositions];
        copy.splice(i, 1);
        setMarkerPositions(copy);
        setRouteCoords([]);
    };

    // Клик по карте
    const handleMapClick = (e: LeafletMouseEvent) => {
        if (markerPositions.length < 2) {
            setMarkerPositions([...markerPositions, [e.latlng.lat, e.latlng.lng]]);
        } else {
            setMarkerPositions([[e.latlng.lat, e.latlng.lng]]);
            setRouteCoords([]);
        }
    };

    // Логика построения маршрута
    const buildRoute = useCallback(() => {
        if (!dataGeoJson || markerPositions.length < 2) return;

        const [latA, lngA] = markerPositions[0];
        const [latB, lngB] = markerPositions[1];

        // Фильтруем фичи по bbox
        const bbox = getBBox(latA, lngA, latB, lngB, 0.05);
        const filteredFeatures = getFilteredFeatures(dataGeoJson, bbox);

        const smallGeojson: IGeoJsonCollection = { ...dataGeoJson, features: filteredFeatures };

        const graph = buildGraph(smallGeojson);

        // Ближайшие узлы
        const startId = findClosestNode(graph, latA, lngA);
        const endId = findClosestNode(graph, latB, lngB);

        if (!startId || !endId) {
            alert('Не найдены ближайшие вершины к точкам. \nИщите в Арабских Эмиратах.');
            setRouteCoords([]);
            setMarkerPositions([]);
            return;
        }

        const path = dijkstra(graph, startId, endId);
        if (path.length < 2) {
            alert('Путь не найден');
            setRouteCoords([]);
            setMarkerPositions([]);
            return;
        }
        setRouteCoords(convertPathToLatLngArray(graph, path));
    }, [dataGeoJson, markerPositions]);

    useEffect(() => {
        if (markerPositions.length === 2) {
            buildRoute();
        } else {
            setRouteCoords([]);
        }
    }, [buildRoute, markerPositions]);

    return {
        markerPositions,
        routeCoords,
        handleMapClick,
        handleMarkerClick
    };
};
