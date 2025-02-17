import { TPQItem, TGraph, TNodeId, IBBox, IRoadFeature, IGeoJsonCollection } from './map-road-builder.domain';

const EARTH_RADIUS = 6371e3; // радиус Земли в метрах

const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const toRad = (val: number) => (val * Math.PI) / 180;

    // Переводим широты в радианы
    const latRad1 = toRad(lat1);
    const latRad2 = toRad(lat2);

    // Разница широт и долгот в радианах
    const deltaLatRad = toRad(lat2 - lat1);
    const deltaLngRad = toRad(lng2 - lng1);

    // Формула гаверсинусов
    const a = Math.sin(deltaLatRad / 2) ** 2 + Math.cos(latRad1) * Math.cos(latRad2) * Math.sin(deltaLngRad / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS * c; // метры
};

export function buildGraph(geojson: IGeoJsonCollection): TGraph {
    const graph: TGraph = {};

    for (const feature of geojson.features) {
        if (!feature.geometry || feature.geometry.type !== 'LineString') continue;
        const coords = feature.geometry.coordinates; // [[lng, lat], [lng, lat], ...]
        for (let i = 0; i < coords.length - 1; i++) {
            const [lng1, lat1] = coords[i];
            const [lng2, lat2] = coords[i + 1];

            const id1: TNodeId = `${lat1},${lng1}`;
            const id2: TNodeId = `${lat2},${lng2}`;

            if (!graph[id1]) {
                graph[id1] = { id: id1, lat: lat1, lng: lng1, neighbors: [] };
            }
            if (!graph[id2]) {
                graph[id2] = { id: id2, lat: lat2, lng: lng2, neighbors: [] };
            }

            const dist = haversineDistance(lat1, lng1, lat2, lng2);

            graph[id1].neighbors.push({ nodeId: id2, distance: dist });
            graph[id2].neighbors.push({ nodeId: id1, distance: dist });
        }
    }

    return graph;
}

// Поиск ближайшей вершины
export const findClosestNode = (graph: TGraph, lat: number, lng: number): TNodeId | null => {
    let closest: TNodeId | null = null;
    let minDist = Infinity;
    for (const nodeId in graph) {
        const node = graph[nodeId];
        const dist = haversineDistance(lat, lng, node.lat, node.lng);
        if (dist < minDist) {
            minDist = dist;
            closest = nodeId;
        }
    }
    return closest;
};

// Приоритетная очередь (MinHeap) для Dijkstra
class MinHeap {
    private items: TPQItem[] = [];

    private left(i: number) {
        return 2 * i + 1;
    }
    private right(i: number) {
        return 2 * i + 2;
    }
    private parent(i: number) {
        return Math.floor((i - 1) / 2);
    }

    public size(): number {
        return this.items.length;
    }
    public isEmpty(): boolean {
        return this.size() === 0;
    }

    public add(item: TPQItem) {
        this.items.push(item);
        this.bubbleUp(this.items.length - 1);
    }

    public poll(): TPQItem | undefined {
        if (this.isEmpty()) return undefined;
        const root = this.items[0];
        const last = this.items.pop()!;
        if (this.items.length > 0) {
            this.items[0] = last;
            this.bubbleDown(0);
        }
        return root;
    }

    private bubbleUp(index: number) {
        while (index > 0) {
            const p = this.parent(index);
            if (this.items[index].dist >= this.items[p].dist) break;
            this.swap(index, p);
            index = p;
        }
    }

    private bubbleDown(index: number) {
        const length = this.items.length;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const l = this.left(index);
            const r = this.right(index);
            let smallest = index;
            if (l < length && this.items[l].dist < this.items[smallest].dist) {
                smallest = l;
            }
            if (r < length && this.items[r].dist < this.items[smallest].dist) {
                smallest = r;
            }
            if (smallest === index) break;
            this.swap(index, smallest);
            index = smallest;
        }
    }

    private swap(a: number, b: number) {
        [this.items[a], this.items[b]] = [this.items[b], this.items[a]];
    }
}

// Dijkstra с приоритетной очередью
export function dijkstra(graph: TGraph, startId: TNodeId, endId: TNodeId): TNodeId[] {
    const dist: Record<TNodeId, number> = {};
    const prev: Record<TNodeId, TNodeId | null> = {};
    const visited = new Set<TNodeId>();

    for (const nodeId in graph) {
        dist[nodeId] = Infinity;
        prev[nodeId] = null;
    }
    dist[startId] = 0;

    const pq = new MinHeap();
    pq.add({ nodeId: startId, dist: 0 });

    while (!pq.isEmpty()) {
        const current = pq.poll()!;
        if (!current) break;

        const currentId = current.nodeId;
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        if (currentId === endId) {
            // дошли до цели
            break;
        }

        for (const neighbor of graph[currentId].neighbors) {
            if (visited.has(neighbor.nodeId)) continue;
            const alt = dist[currentId] + neighbor.distance;
            if (alt < dist[neighbor.nodeId]) {
                dist[neighbor.nodeId] = alt;
                prev[neighbor.nodeId] = currentId;
                pq.add({ nodeId: neighbor.nodeId, dist: alt });
            }
        }
    }

    const path: TNodeId[] = [];
    let u: TNodeId | null = endId;
    while (u !== null) {
        path.unshift(u);
        u = prev[u];
    }
    return path;
}

// Конвертация пути (NodeId[] -> [lat, lng][])
export function convertPathToLatLngArray(graph: TGraph, path: TNodeId[]): [number, number][] {
    return path.map(id => {
        const node = graph[id];
        return [node.lat, node.lng];
    });
}

// bbox-фильтрация
export function getBBox(latA: number, lngA: number, latB: number, lngB: number, buffer = 0.01): IBBox {
    const minLat = Math.min(latA, latB) - buffer;
    const maxLat = Math.max(latA, latB) + buffer;
    const minLng = Math.min(lngA, lngB) - buffer;
    const maxLng = Math.max(lngA, lngB) + buffer;
    return { minLat, maxLat, minLng, maxLng };
}

const isLineStringInBBox = (feature: IRoadFeature, bbox: IBBox): boolean => {
    if (!feature.geometry || feature.geometry.type !== 'LineString') return false;
    const coords = feature.geometry.coordinates; // [[lng, lat], ...]
    for (const [lng, lat] of coords) {
        if (lat >= bbox.minLat && lat <= bbox.maxLat && lng >= bbox.minLng && lng <= bbox.maxLng) {
            return true;
        }
    }
    return false;
};

export const getFilteredFeatures = (allRoads: IGeoJsonCollection, bbox: IBBox): IRoadFeature[] =>
    allRoads.features.filter((feature: IRoadFeature) => isLineStringInBBox(feature, bbox));
