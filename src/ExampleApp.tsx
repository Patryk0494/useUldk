import { useEffect, useState } from "react";
import { useUldk } from "./hooks/useUldk";

function ExampleApp() {
  const [selectedVoivodeship, setSelectedVoivodeship] = useState<string>("");

  const {
    voivodeships,
    fetchDistricts,
    districts,
    getRegionGeometryById,
    getParcelGeometryById,
  } = useUldk();

  const setRegionGeometry = async (id: string) => {
    if (!id) return;
    const geom = await getRegionGeometryById(id);
    console.log({ geom });
  };
  const setParcelGeometry = async () => {
    const parcel = await getParcelGeometryById("141201_1.0001.1867/2");
    console.log(parcel);
  };
  useEffect(() => {
    if (!selectedVoivodeship) return;
    fetchDistricts(selectedVoivodeship);
    setRegionGeometry(districts?.[0]?.value);
    setParcelGeometry();
  }, [selectedVoivodeship]);

  return (
    <>
      <div></div>
      <h1>useUldk example use</h1>
      <div className="card">
        <select
          name="wojewodztwo"
          id="woj"
          onChange={(e) => setSelectedVoivodeship(e?.target?.value)}
        >
          {voivodeships.map(({ label, value }) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="powiat"
          id="pow"
          onChange={(e) => console.log(e?.target?.value)}
        >
          {districts.map(({ label, value }) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

export default ExampleApp;
