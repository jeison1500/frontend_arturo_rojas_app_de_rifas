import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { supabase } from './supabaseClient';
import './rifa.css';


/* ============================
   COMPONENTE COUNTDOWN
============================ */
function Countdown({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const diff = targetDate.getTime() - now;

      setTimeLeft({
        days: Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))),
        hours: Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24)),
        minutes: Math.max(0, Math.floor((diff / (1000 * 60)) % 60)),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="countdown-row">
      {Object.entries(timeLeft).map(([k, v]) => (
        <div key={k} className="countdown-box">
          <div className="countdown-number">{v}</div>
          <div className="countdown-label">{k}</div>
        </div>
      ))}
    </div>
  );
}

/* ============================
   COMPONENTE PRINCIPAL
============================ */
export default function Rifa() {
  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [factura, setFactura] = useState('');
  const [loading, setLoading] = useState(false);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);
  const [titulo, setTitulo] = useState('');
  const [valorMinimo, setValorMinimo] = useState(0);

  /* ============================
     CONFIGURACIÓN
  ============================ */
  useEffect(() => {
    const cargarConfig = async () => {
      const { data } = await supabase.from('configuracion').select('*');
      const cfg = Object.fromEntries(data!.map((c: any) => [c.clave, c.valor]));
      setFechaFin(new Date(cfg.fecha_fin_sorteo));
      setTitulo(cfg.titulo_rifa);
      setValorMinimo(Number(cfg.valor_minimo_factura));
    };
    cargarConfig();
  }, []);

  /* ============================
     CONSULTAR CLIENTE
  ============================ */
  const consultarCliente = async () => {
    if (!cedula) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('fidelizacion')
      .select('nombre, direccion, telefono, correo')
      .eq('cedula', cedula)
      .maybeSingle();

    setLoading(false);

    if (error || !data) {
      Swal.fire('No encontrado', 'La cédula no existe en fidelización', 'warning');
      setNombre('');
      setDireccion('');
      setTelefono('');
      setCorreo('');
      return;
    }

    setNombre(data.nombre);
    setDireccion(data.direccion);
    setTelefono(data.telefono);
    setCorreo(data.correo);
  };

  /* ============================
     REGISTRAR FACTURA
  ============================ */
  const registrarFactura = async () => {
    if (!cedula || !factura) {
      return Swal.fire('Error', 'Cédula y factura son obligatorias', 'warning');
    }

    setLoading(true);

    // 🔴 VALIDAR FACTURA DUPLICADA
    const { data: facturaExistente } = await supabase
      .from('facturas_cache')
      .select('id')
      .eq('numero_factura', factura)
      .maybeSingle();

    if (facturaExistente) {
      setLoading(false);
      return Swal.fire(
        'Factura ya registrada',
        'Los puntos de esta factura ya fueron asignados',
        'info'
      );
    }

    // 🔢 CALCULAR PUNTOS
    const puntosGanados = Math.floor(valorMinimo / 1000);

    // 🔵 ACTUALIZAR PUNTOS
    const { data: cliente } = await supabase
      .from('fidelizacion')
      .select('puntos')
      .eq('cedula', cedula)
      .maybeSingle();

    const nuevosPuntos = (cliente?.puntos || 0) + puntosGanados;

    await supabase
      .from('fidelizacion')
      .update({
        puntos: nuevosPuntos,
        fecha_ultima_factura: new Date(),
      })
      .eq('cedula', cedula);

    // 🧾 GUARDAR FACTURA
    await supabase.from('facturas_cache').insert({
      numero_factura: factura,
      cedula_cliente: cedula,
      nombre_cliente: nombre,
    });

    setLoading(false);

    Swal.fire(
      'Éxito',
      `Factura registrada.\nPuntos actuales: ${nuevosPuntos}`,
      'success'
    );

    setFactura('');
  };

  /* ============================
     UI
  ============================ */
  return (
    <div className="rifa-container">
      <div className="rifa-card">
        <h1>{titulo}</h1>
        {fechaFin && <Countdown targetDate={fechaFin} />}

        <input
          value={cedula}
          onChange={e => setCedula(e.target.value)}
          onBlur={consultarCliente}
          placeholder="Cédula"
        />

        <input value={nombre} readOnly placeholder="Nombre" />
        <input value={direccion} readOnly placeholder="Dirección" />
        <input value={telefono} readOnly placeholder="Teléfono" />
        <input value={correo} readOnly placeholder="Correo" />

        <input
          value={factura}
          onChange={e => setFactura(e.target.value)}
          placeholder="Número de factura"
        />

        <button onClick={registrarFactura}>
          Registrar factura
        </button>

        {loading && <p>Cargando...</p>}
      </div>
    </div>
  );
}
