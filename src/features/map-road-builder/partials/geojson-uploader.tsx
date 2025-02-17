import { useState } from 'react';
import cn from 'classnames';
import { IGeoJsonCollection } from '../map-road-builder.domain';
import styles from '../map-road-builder.module.css';

interface IGeojsonUploaderProps {
    setGeoJsonData: (data: IGeoJsonCollection | null) => void;
}

export const GeojsonUploader = ({ setGeoJsonData }: IGeojsonUploaderProps) => {
    const [isUploadCorrect, setIsUploadCorrect] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [fileName, setFileName] = useState<string>('');

    const isGeoJsonValid = (obj: IGeoJsonCollection): boolean =>
        obj?.type === 'FeatureCollection' && Array.isArray(obj.features);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setErrorMessage(null);
        setIsLoading(true);

        const file = e.target.files?.[0];

        if (!file) {
            setIsLoading(false);
            return;
        }

        try {
            const text = await file.text();
            const parsed = JSON.parse(text) as IGeoJsonCollection;

            setFileName(file.name);

            if (!isGeoJsonValid(parsed)) {
                setErrorMessage('Неверный формат GeoJSON');
                setIsUploadCorrect(false);
            } else {
                setIsUploadCorrect(true);
                setGeoJsonData(parsed);
            }
        } catch (err) {
            console.error('Ошибка парсинга JSON', err);
            setErrorMessage('Ошибка: не удалось прочитать JSON-файл.');
            setIsUploadCorrect(false);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.uploader_overlay}>
                <h3>Загрузка файла...</h3>
            </div>
        );
    }

    return (
        <div className={cn(styles.uploader_overlay, { [styles.uploader_overlay_top]: isUploadCorrect })}>
            <div className={styles.col}>
                {!fileName ? (
                    <>
                        <h3>Загрузите GeoJSON</h3>
                        <label htmlFor="geojson-file" className={styles.uploader_custom_file_label}>
                            Выбрать файл
                        </label>
                        <input
                            id="geojson-file"
                            type="file"
                            accept=".geojson,application/geo+json,application/json"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </>
                ) : (
                    <span>Выбранный файл: {fileName}</span>
                )}
                {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>}
            </div>
        </div>
    );
};
