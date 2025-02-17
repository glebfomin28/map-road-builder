import styles from "../map-road-builder.module.css";

export const ErrorOverlay = ({
  errorText,
  reload,
}: {
  errorText: string | null;
  reload?: () => void
}) => (
    <div className={styles.error_overlay}>
      <h3>{errorText}</h3>
      <button onClick={reload}>Повторная загрузка</button>
    </div>
  )
