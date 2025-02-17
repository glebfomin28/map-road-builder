import { useEffect, useState } from 'react';
import { IGeoJsonCollection } from '../map-road-builder.domain';

export const useFetchGeoJson = () => {
    const [dataGeoJson, setDataGeoJson] = useState<IGeoJsonCollection | null>(null);
    const [isLoadingGeoJson, setIsLoadingGeoJson] = useState<boolean>(false);
    const [errorGeoJson, setErrorGeoJson] = useState<string | null>(null);

    const fetchGeoJson = async () => {
        setIsLoadingGeoJson(true);
        try {
            const response = await fetch(
                'https://drive.google.com/uc?export=download&id=1H84XUryEKx2S4rUYBQHxeeP017Od0Aqc'
            );
            const newData = (await response.json()) as IGeoJsonCollection;
            setDataGeoJson(newData);
        } catch (err) {
            setErrorGeoJson('Ошибка загрузки GeoJSON');
        } finally {
            setIsLoadingGeoJson(false);
        }
    };

    const reset = () => {
        setDataGeoJson(null);
        setIsLoadingGeoJson(false);
        setErrorGeoJson(null);
    };

    const reloadGeoJson = async () => {
        reset();
        await fetchGeoJson();
    };

    useEffect(() => {
        fetchGeoJson();
    }, []);

    return {
        dataGeoJson,
        isLoadingGeoJson,
        errorGeoJson,
        reloadGeoJson
    };
};
