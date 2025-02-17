import { useMapEvents } from "react-leaflet";
import type { LeafletMouseEvent } from "leaflet";

export const MapClickHandler = ({handleClick}: { handleClick: (e: LeafletMouseEvent) => void }): null => {
  useMapEvents({
    click: handleClick
  });

  return null;
}
