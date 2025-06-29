// Dimensiones mínimas en centímetros (8.5 x 5.5 cm)
export const MIN_CROP_WIDTH_CM = 8.5;
export const MIN_CROP_HEIGHT_CM = 5.5;

// Conversión cm a píxeles (considerando 160 ppi estándar)
export const CM_TO_PIXELS = (cm: number) => Math.round(cm * 160 / 2.54);