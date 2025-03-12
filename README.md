# useUldk React Hook

A powerful and developer-friendly React hook to interact with ULDK (National Spatial Data Infrastructure) services in Poland, providing access to region geometries and administrative divisions.

## Installation

```bash
npm install useuldk-react
```

## Features
- Fetch voivodeships, districts, tenants, and precincts.
- Retrieve region and parcel geometries by ID.
- Coordinate transformation from EPSG:2180 to EPSG:4326.
- Handles API errors gracefully.

## Usage

### Importing the Hook
```tsx
import { useUldk } from 'useuldk-react';
```

### Example Usage
```tsx
import React, { useEffect } from 'react';
import { useUldk } from 'useuldk-react';

function App() {
  const {
    voivodeships,
    districts,
    fetchDistricts,
    getRegionGeometryById,
    error,
  } = useUldk();

  useEffect(() => {
    fetchDistricts('02'); // Example TERYT code for district
  }, []);

  return (
    <div>
      <h1>Voivodeships</h1>
      {voivodeships.map((v) => (
        <p key={v.value}>{v.label}</p>
      ))}
      {error && <p>Error: {error}</p>}
    </div>
  );
}

export default App;
```

## API Reference

### `useUldk(props: useUldkPropsType | undefined): UldkReturnType`

#### Parameters
- `props?.voivodeship?` (string): Optional TERYT code for a voivodeship.
- `props?.district?` (string): Optional TERYT code for a district.
- `props?.tenant?` (string): Optional TERYT code for a tenant.

#### Return
- `voivodeships`: List of available voivodeships.
- `districts`: List of available districts.
- `fetchDistricts(value: string)`: Fetch districts based on voivodeship.
- `fetchTenants(value: string)`: Fetch tenants based on district.
- `precincts`: List of precincts.
- `fetchPrecincts(value: string)`: Fetch precincts based on tenant.
- `getRegionGeometryById(regionId: string)`: Fetch geometry for a region.
- `getParcelGeometryById(parcelId: string)`: Fetch geometry for a parcel.
- `error`: Error message if fetching fails.

### Example for Fetching Region Geometry
```tsx
const fetchGeometry = async () => {
  const geometry = await getRegionGeometryById("02");
  console.log(geometry);
};
```

## Types

```typescript
export type Option = {
  label: string;
  value: string;
};

export type UldkReturnType = {
  voivodeships: Option[];
  districts: Option[];
  fetchDistricts: (value: string) => Promise<void>;
  fetchTenants: (value: string) => Promise<void>;
  tenants: Option[];
  fetchPrecincts: (value: string) => Promise<void>;
  precincts: Option[];
  getRegionGeometryById: (regionId: string) => Promise<Geometry | Geometry[] | undefined>;
  getParcelGeometryById: (parcelId: string) => Promise<Geometry | Geometry[] | undefined>;
  error: string | null;
};

export type useUldkPropsType = {
  voivodeship?: string;
  district?: string;
  tenant?: string;
} | undefined;
```

## License

MIT License. See `LICENSE` file for details.