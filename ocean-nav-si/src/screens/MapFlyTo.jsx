import React, { useEffect } from "react";
import { useMap } from "react-leaflet";

export function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target.center, target.zoom, { animate: true, duration: 1.1 });
  }, [target, map]);
  return null;
}
