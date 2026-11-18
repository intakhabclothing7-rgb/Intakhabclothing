export type GarmentSizeCode = 'XS' | 'S' | 'M' | 'L' | 'XL';

export interface SizeChartColumn {
  size: GarmentSizeCode;
  shoulder: number;
  chest: number;
  hip: number;
  shirtLength: number;
  trouserThigh: number;
  trouserWaist: number;
}

export const SIZE_CHART_SIZES: GarmentSizeCode[] = ['XS', 'S', 'M', 'L', 'XL'];

export const COORD_SIZE_CHART_COLUMNS: SizeChartColumn[] = [
  {
    size: 'XS',
    shoulder: 14,
    chest: 20,
    hip: 21,
    shirtLength: 29,
    trouserThigh: 12,
    trouserWaist: 13,
  },
  {
    size: 'S',
    shoulder: 15,
    chest: 21,
    hip: 22,
    shirtLength: 29,
    trouserThigh: 12.5,
    trouserWaist: 14,
  },
  {
    size: 'M',
    shoulder: 15.5,
    chest: 22,
    hip: 23,
    shirtLength: 30,
    trouserThigh: 13,
    trouserWaist: 15.5,
  },
  {
    size: 'L',
    shoulder: 16.5,
    chest: 23.5,
    hip: 24.5,
    shirtLength: 31,
    trouserThigh: 14.5,
    trouserWaist: 16,
  },
  {
    size: 'XL',
    shoulder: 17.5,
    chest: 24.5,
    hip: 25.5,
    shirtLength: 32,
    trouserThigh: 16,
    trouserWaist: 17,
  },
];

export interface SizeChartRowDef {
  key: keyof Omit<SizeChartColumn, 'size'>;
  label: string;
}

export const SIZE_CHART_ROWS: SizeChartRowDef[] = [
  { key: 'shoulder', label: 'Shoulder' },
  { key: 'chest', label: 'Chest' },
  { key: 'hip', label: 'Hip' },
  { key: 'shirtLength', label: 'Shirt Length' },
  { key: 'trouserThigh', label: 'Trouser Thigh' },
  { key: 'trouserWaist', label: 'Trouser Waist' },
];

export const getSizeChartEntry = (size: string): SizeChartColumn | undefined =>
  COORD_SIZE_CHART_COLUMNS.find((col) => col.size.toUpperCase() === size.trim().toUpperCase());

export const formatMeasurement = (inches: number, unit: 'inches' | 'cm'): string => {
  if (unit === 'inches') {
    return `${inches}`;
  }
  const cm = Math.round(inches * 2.54 * 10) / 10;
  return `${cm}`;
};
