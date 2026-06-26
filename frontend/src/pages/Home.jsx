import { useEffect, useState } from "react";
import axios from "axios";

export default function Home() {
  const [profesionales, setProfesionales] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost/appweb/backend/api/profesionales/listar.php")
.then(res => {
  console.log("RESPUESTA COMPLETA:", res);
  console.log("DATA:", res.data);

  setProfesionales(res.data);
})
      .catch((err) => console.log(err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Profesionales</h1>

      {profesionales.length === 0 ? (
        <p>No hay datos</p>
      ) : (
        profesionales.map((p) => (
          <div key={p.id}>
            <h3>{p.nombre_comercial}</h3>
            <p>{p.descripcion}</p>
          </div>
        ))
      )}
    </div>
  );
}