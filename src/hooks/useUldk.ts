/**
 * Custom hook for interacting with the ULDK service to fetch geographical data.
 * Provides functionality for fetching voivodeships, districts, tenants, and parcel geometry.
 *
 * @module useUldk
 */

import { useCallback, useEffect, useState } from "react";
import { Geometry, Position } from "geojson";
import * as wkx from "wkx";
import { Buffer } from "buffer";
import proj4 from "proj4";

proj4.defs(
  "EPSG:2180",
  "+proj=tmerc +lat_0=0 +lon_0=19 +k=0.9993 +x_0=500000 +y_0=-5300000 +datum=WGS84 +units=m +no_defs"
);

/**
 * Transforms polygon coordinates from EPSG:2180 to EPSG:4326.
 * @param {Position[][]} coord - Polygon coordinates in EPSG:2180.
 * @returns {Position[][]} Transformed polygon coordinates.
 */
const transformPolygonCoordinates = (coord: Position[][]): Position[][] => {
  const sourceProj = "EPSG:2180";
  const destProj = "EPSG:4326"; // WGS84 Lat/Lng
  return coord.map((ring) =>
    ring.map(([x, y]) => proj4(sourceProj, destProj, [x, y]))
  );
};

/**
 * Converts a WKB (Well-Known Binary) string to GeoJSON format, transforming coordinates to EPSG:4326.
 * @param {string} wkbFormatString - WKB string.
 * @returns {Geometry} Transformed GeoJSON object.
 */
function from2180to4326(wkbFormatString: string): Geometry {
  const sourceProj = "EPSG:2180";
  const destProj = "EPSG:4326"; // WGS84 Lat/Lng
  const geometry = wkx.Geometry.parse(Buffer.from(wkbFormatString, "hex"));
  const geojson = geometry.toGeoJSON() as Geometry;
  // Transform coordinates
  if (geojson.type === "Polygon") {
    geojson.coordinates = transformPolygonCoordinates(geojson.coordinates);
  }
  if (geojson.type === "MultiPolygon") {
    geojson.coordinates = geojson.coordinates.map((ring) => {
      return transformPolygonCoordinates(ring);
    });
  } else if (geojson.type === "Point") {
    geojson.coordinates = proj4(sourceProj, destProj, geojson.coordinates);
  }

  return geojson;
}

/**
 * Parses and prepares WKB geometry data.
 * @param {string} data - Data containing WKB geometry.
 * @returns {Geometry[] | undefined} Array of geometries.
 */
function prepareGeometry(data: string): Geometry[] | undefined {
  try {
    const [status, ...response] = data.split("\n");
    if (status.includes("-1")) {
      throw new Error("Resource not found");
    }
    return response.filter(Boolean).map((wkd) => from2180to4326(wkd));
  } catch (error) {
    console.log(error);
  }
}

/**
 * Parses and prepares list data from ULDK service.
 * @param {string} data - Data response from ULDK.
 * @returns {Option[]} List of options.
 */
function prepareData(data: string): Option[] {
  const list = data.split("\n");
  list.shift();
  return list
    .filter((val) => val.includes("|"))
    .map((val) => {
      const [label, value] = val.split("|");
      return { value, label };
    });
}

export type Option = { label: string; value: string };

type UldkReturnType = {
  voivodeships: Option[];
  districts: Option[];
  fetchDistricts: (value: string) => Promise<void>;
  fetchTenants: (value: string) => Promise<void>;
  tenants: Option[];
  fetchPrecincts: (value: string) => Promise<void>;
  precincts: Option[];
  getRegionGeometryById: (
    regionId: string
  ) => Promise<Geometry | Geometry[] | undefined>;
  getParcelGeometryById: (
    parcelId: string
  ) => Promise<Geometry | Geometry[] | undefined>;
  error: string | null;
};
type useUldkPropsType =
  | {
      voivodeship?: string;
      district?: string;
      tenant?: string;
    }
  | undefined;

/**
 * @typedef {Object} Option
 * @property {string} label - Display name.
 * @property {string} value - Associated value.
 */

/**
 * @typedef {Object} UldkReturnType
 * @property {Option[]} voivodeships - List of voivodeships.
 * @property {Option[]} districts - List of districts.
 * @property {function} fetchDistricts - Fetch districts by voivodeship.
 * @property {function} fetchTenants - Fetch tenants by district.
 * @property {Option[]} tenants - List of tenants.
 * @property {function} fetchPrecincts - Fetch precincts by tenant.
 * @property {Option[]} precincts - List of precincts.
 * @property {function} getRegionGeometryById - Fetch region geometry by ID.
 * @property {function} getParcelGeometryById - Fetch parcel geometry by ID.
 * @property {string|null} error - Error message.
 */

/**
 * @typedef {Object} useUldkPropsType
 * @property {string} [voivodeship] - Initial voivodeship.
 * @property {string} [district] - Initial district.
 * @property {string} [tenant] - Initial tenant.
 */

/**
 * Custom hook for fetching geographical data from the ULDK service.
 * @param {useUldkPropsType | undefined} props - Initial props.
 * @returns {UldkReturnType} ULDK data and methods.
 */
const useUldk = (props: useUldkPropsType = undefined): UldkReturnType => {
  const [voivodeships, setVoivodeships] = useState<Option[]>([]);
  const [districts, setDistricts] = useState<Option[]>([]);
  const [tenants, setTenants] = useState<Option[]>([]);
  const [precincts, setPrecincts] = useState<Option[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchObject = useCallback(
    async ({ object, teryt }: { object: string; teryt: string }) => {
      const controller = new AbortController();
      try {
        const resp = await fetch(
          `https://uldk.gugik.gov.pl/service.php?obiekt=${object}&wynik=${object},teryt&teryt=${teryt}`,
          { signal: controller.signal }
        );
        const data = await resp.text();
        return prepareData(data);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
        }
      }
      return () => controller.abort();
    },
    []
  );
  useEffect(() => {
    fetch(
      "https://uldk.gugik.gov.pl/service.php?obiekt=wojewodztwo&wynik=wojewodztwo,teryt"
    )
      .then((resp) => resp.text())
      .then((data) => {
        setVoivodeships(prepareData(data) || []);
      })
      .catch((e) => {
        console.error(e);
        setError("Failed to fetch voivodeships" + e);
      });
  }, []);

  /**
   * Fetches districts based on the selected voivodeship.
   * @param {string} value - The TERYT code of the voivodeship.
   * @returns {Promise<void>} Resolves when the districts have been fetched and set.
   */
  const fetchDistricts = useCallback(
    async (value: string) => {
      try {
        const object = await fetchObject({ object: "powiat", teryt: value });
        if (Array.isArray(object)) {
          setDistricts(object || []);
        }
      } catch (e) {
        console.error(e);
      }
    },
    [fetchObject]
  );
  /**
   * Fetches tenants based on the selected district.
   * @param {string} value - The TERYT code of the district.
   * @returns {Promise<void>} Resolves when the tenants have been fetched and set.
   */
  const fetchTenants = async (value: string) => {
    const object = await fetchObject({ object: "gmina", teryt: value });
    if (Array.isArray(object)) {
      setTenants(object || []);
    }
  };
  /**
   * Fetches precincts based on the selected tenant.
   * @param {string} value - The TERYT code of the tenant.
   * @returns {Promise<void>} Resolves when the precincts have been fetched and set.
   */
  const fetchPrecincts = useCallback(
    async (value: string) => {
      const object = await fetchObject({ object: "obreb", teryt: value });
      if (Array.isArray(object)) {
        setPrecincts(object || []);
      }
    },
    [fetchObject]
  );
  /**
   * Fetches geometry for a specific region by its ID.
   * @param {string} regionId - The ID of the region.
   * @returns {Promise<Geometry | Geometry[] | undefined>} Geometry of the region.
   */
  const getRegionGeometryById = useCallback(async (regionId: string) => {
    const resp = await fetch(
      `https://uldk.gugik.gov.pl/?request=GetRegionById&id=${regionId}`
    );
    const data = await resp.text();

    return prepareGeometry(data);
  }, []);
  /**
   * Fetches geometry for a specific parcel by its ID.
   * @param {string} parcelId - The ID of the parcel.
   * @returns {Promise<Geometry | Geometry[] | undefined>} Geometry of the parcel.
   */
  const getParcelGeometryById = useCallback(async (parcelId: string) => {
    const resp = await fetch(
      `https://uldk.gugik.gov.pl/?request=GetParcelById&id=${parcelId}`
    );
    const data = await resp.text();
    return prepareGeometry(data);
  }, []);
  useEffect(() => {
    if (props?.voivodeship) fetchDistricts(props.voivodeship);
    if (props?.district) fetchTenants(props.district);
    if (props?.tenant) fetchPrecincts(props.tenant);
  }, [props?.voivodeship, props?.district, props?.tenant]);
  return {
    voivodeships,
    districts,
    fetchDistricts,
    fetchTenants,
    tenants,
    fetchPrecincts,
    precincts,
    getRegionGeometryById,
    getParcelGeometryById,
    error,
  };
};

export { useUldk };
