import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import './bienvenida.css';

function BienvenidaRifa() {
  const [imagenUrl, setImagenUrl] = useState<string | null>(null);
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    const cargarImagen = async () => {
      const { data, error } = await supabase.from('configuracion').select('*');
      if (error) {
        console.error('Error al obtener configuración:', error);
        return;
      }

      const config = Object.fromEntries(data.map((item: any) => [item.clave, item.valor]));
      const url = config['imagen_bienvenida'];
      if (url) {
        setImagenUrl(url);
        setMostrar(true);
      }
    };

    cargarImagen();
  }, []);

  if (!mostrar || !imagenUrl) return null;

  const cerrarModal = () => setMostrar(false);

  return (
    <div className="modal-bienvenida" onClick={cerrarModal}>
      <span className="modal-cerrar">✕</span>
      <img
        src={imagenUrl}
        alt="Bienvenida Rifa"
        className="modal-imagen"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default BienvenidaRifa;
