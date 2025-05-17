import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import './admin.css';
import { FaCog } from 'react-icons/fa';
import Swal from 'sweetalert2';


export default function AdminPanel() {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [tituloRifa, setTituloRifa] = useState('');
  const [loading, setLoading] = useState(false);
  const [valorMinimoFactura, setValorMinimoFactura] = useState<number>(0);
  const [imagenBienvenida, setImagenBienvenida] = useState<File | null>(null);
  const [previewImagen, setPreviewImagen] = useState<string | null>(null);
  

  useEffect(() => {
    const cargarFechas = async () => {
      const { data, error } = await supabase.from('configuracion').select('*');
      if (error) return console.error(error);
      const config = Object.fromEntries(data.map((c: any) => [c.clave, c.valor]));
      setFechaInicio(config['fecha_inicio_facturas'] || '');
      setFechaFin(config['fecha_fin_sorteo'] || '');
      setTituloRifa(config['titulo_rifa'] || '');
      setValorMinimoFactura(Number(config['valor_minimo_factura']) || 0);
    };
    cargarFechas();
  }, []);

  const guardarConfiguracion = async () => {
    setLoading(true);

    let imagenURL = null;

    if (imagenBienvenida) {
      const extension = imagenBienvenida.name.split('.').pop();
      const nombreArchivo = `bienvenida.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(nombreArchivo, imagenBienvenida, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        setLoading(false);
        return Swal.fire('Error', 'No se pudo subir la imagen', 'error');
      }

      const { data: urlPublica } = supabase
        .storage
        .from('banners')
        .getPublicUrl(nombreArchivo);

      imagenURL = urlPublica.publicUrl;
    }

    const configuracionBase = [
      { clave: 'fecha_inicio_facturas', valor: fechaInicio },
      { clave: 'fecha_fin_sorteo', valor: fechaFin },
      { clave: 'titulo_rifa', valor: tituloRifa },
      { clave: 'valor_minimo_factura', valor: valorMinimoFactura.toString() },
    ];

    if (imagenURL) {
      configuracionBase.push({ clave: 'imagen_bienvenida', valor: imagenURL });
    }

    await supabase.from('configuracion').upsert(configuracionBase);

    setLoading(false);
    setImagenBienvenida(null);
    setPreviewImagen(null);

    Swal.fire({
      icon: 'success',
      title: '¡Guardado!',
      text: 'La configuración se ha actualizado correctamente.',
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const exportarExcel = async () => {
    const { data, error } = await supabase.from('rifa').select('*');
    if (error || !data) {
      return Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron obtener los datos de la rifa.',
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rifa');

    const blob = new Blob([
      XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }),
    ], { type: 'application/octet-stream' });

    saveAs(blob, 'rifa_registros.xlsx');
  };

  return (
    <>
      <a href="/" className="admin-back-button" title="Volver al inicio">
        <FaCog />
      </a>

      <div className="admin-panel">
        <h1>Panel de Administración</h1>

        <div className="form-group">
          <label>Fecha mínima de factura:</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Fecha y hora final del sorteo:</label>
          <input
            type="datetime-local"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Título de la rifa:</label>
          <input
            type="text"
            value={tituloRifa}
            onChange={(e) => setTituloRifa(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Valor mínimo de la factura:</label>
          <input
            type="number"
            min="0"
            value={valorMinimoFactura}
            onChange={(e) => setValorMinimoFactura(Number(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label>Imagen de bienvenida (opcional):</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setImagenBienvenida(file);
              if (file) {
                const previewURL = URL.createObjectURL(file);
                setPreviewImagen(previewURL);
              }
            }}
          />

          {imagenBienvenida && previewImagen && (
  <div className="preview-container">
    <p style={{ marginBottom: '0.5rem' }}>Toca la imagen para quitarla</p>
    <img
      src={previewImagen}
      alt="Preview"
      className="preview-imagen"
      onClick={() => {
        setImagenBienvenida(null);
        setPreviewImagen(null);
      }}
    />
  </div>
)}

        </div>

        <button
          onClick={guardarConfiguracion}
          disabled={loading}
          className="admin-button"
        >
          {loading ? 'Guardando...' : 'Guardar Configuración'}
        </button>

        <button onClick={exportarExcel} className="admin-button">
          Exportar registros de rifa a Excel
        </button>
      </div>
    </>
  );
}
