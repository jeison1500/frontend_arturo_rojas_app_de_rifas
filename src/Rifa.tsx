import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { supabase } from './supabaseClient';
import './rifa.css';
import { FaCog } from 'react-icons/fa';

interface Cliente {
  id: number;
  name: string;
  address?: { address?: string } | null;
  phonePrimary?: string | null;
  email?: string | null;
  identification?: string | null;
}

function Countdown({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const now = new Date();
    const difference = +targetDate - +now;
    return {
      days: Math.max(0, Math.floor(difference / (1000 * 60 * 60 * 24))),
      hours: Math.max(0, Math.floor((difference / (1000 * 60 * 60)) % 24)),
      minutes: Math.max(0, Math.floor((difference / 1000 / 60) % 60)),
      // seconds: Math.max(0, Math.floor((difference / 1000) % 60)),
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="countdown-row">
      {Object.entries(timeLeft).map(([label, value]) => (
        <div className="countdown-box" key={label}>
          <div className="countdown-number">{value}</div>
          <div className="countdown-label">{label}</div>
        </div>
      ))}
    </div>
  );
}

interface ErroresFormulario {
  cedula: boolean;
  nombre: boolean;
  direccion: boolean;
  telefono: boolean;
  correo: boolean;
  factura: boolean;
}


function Rifa() {
const [cedula, setCedula] = useState('');
const [nombreCliente, setNombreCliente] = useState('');
const [buscandoNombre, setBuscandoNombre] = useState(false);
const [cedulaNoEncontrada, setCedulaNoEncontrada] = useState(false);
const [direccionCliente, setDireccionCliente] = useState('');
const [telefonoCliente, setTelefonoCliente] = useState('');
const [correoCliente, setCorreoCliente] = useState('');
const [factura, setFactura] = useState('');
const [errores, setErrores] = useState<ErroresFormulario>({
  cedula: false,
  nombre: false,
  direccion: false,
  telefono: false,
  correo: false,
  factura: false,
});
const [valorMinimoFactura, setValorMinimoFactura] = useState<number>(0);  
const [loading, setLoading] = useState(false);
const [numerosAsignados, setNumerosAsignados] = useState<number[]>([]);
const [fechaInicioFacturas, setFechaInicioFacturas] = useState<Date | null>(null);
const [fechaFinSorteo, setFechaFinSorteo] = useState<Date | null>(null);
const [tituloRifa, setTituloRifa] = useState<string>('');
// useEffect(() => {
//   const consultarNombrePorCedula = async () => {
//     const cedulaLimpia = cedula.trim();
//     if (!cedulaLimpia) return;

//     setBuscandoNombre(true);
//     setCedulaNoEncontrada(false);

//     Swal.fire({
//       title: 'Buscando cliente...',
//       text: 'Por favor espera un momento',
//       allowOutsideClick: false,
//       allowEscapeKey: false,
//       didOpen: () => {
//         Swal.showLoading();
//       }
//     });

//     try {
//       const res = await fetch(`https://bakend-arturo-rojas-app-rifas.onrender.com/cliente?cedula=${cedulaLimpia}`);
//       if (!res.ok) throw new Error('Error al consultar el cliente');
//       const data: Cliente[] = await res.json();

//       if (data && data.length > 0) {
//         setNombreCliente(data[0].name || '');
//         setCedulaNoEncontrada(false);
//       } else {
//         setNombreCliente('');
//         setCedulaNoEncontrada(true);
//       }
//     } catch (error) {
//       console.error('Error al buscar el cliente por cédula:', error);
//       setNombreCliente('');
//       setCedulaNoEncontrada(true);
//     } finally {
//       setBuscandoNombre(false);
//       Swal.close(); // Cierra el spinner de Swal
//     }
//   };

//   consultarNombrePorCedula();
// }, [cedula]);

const consultarNombrePorCedula = async () => {
  const cedulaLimpia = cedula.trim();
  if (!cedulaLimpia) return;

  setBuscandoNombre(true);
  setCedulaNoEncontrada(false);

  Swal.fire({
    title: 'Buscando cliente...',
    text: 'Por favor espera un momento',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    // Paso 1: Consultar si ya está en la tabla de rifa
    const { data: rifaData, error: rifaError } = await supabase
      .from('rifa')
      .select('nombre, direccion, telefono, correo')
      .eq('cedula', cedulaLimpia)
      .limit(1)
      .single();

    if (rifaData && !rifaError) {
      // Rellenar automáticamente los campos si ya está registrado
      setNombreCliente(rifaData.nombre || '');
      setDireccionCliente(rifaData.direccion || '');
      setTelefonoCliente(rifaData.telefono || '');
      setCorreoCliente(rifaData.correo || '');
      setCedulaNoEncontrada(false);
      Swal.close();
      setBuscandoNombre(false);
      return;
    }

    // Paso 2: Si no está en rifa, buscar desde tu backend
    const res = await fetch(`https://bakend-arturo-rojas-app-rifas.onrender.com/cliente?cedula=${cedulaLimpia}`);
    if (!res.ok) throw new Error('Error al consultar el cliente');
    const data: Cliente[] = await res.json();

    if (data && data.length > 0) {
      setNombreCliente(data[0].name || '');
      setCedulaNoEncontrada(false);
    } else {
      setNombreCliente('');
      setCedulaNoEncontrada(true);
    }

  } catch (error) {
    console.error('Error al buscar el cliente por cédula:', error);
    setNombreCliente('');
    setCedulaNoEncontrada(true);
  } finally {
    setBuscandoNombre(false);
    Swal.close();
  }
};




  useEffect(() => {
    const obtenerConfiguracion = async () => {
      const { data, error } = await supabase.from('configuracion').select('*');
      if (error) return console.error('Error al obtener configuración:', error);
      const config = Object.fromEntries(data.map((c: any) => [c.clave, c.valor]));
      setFechaInicioFacturas(new Date(config['fecha_inicio_facturas']));
      setFechaFinSorteo(new Date(config['fecha_fin_sorteo']));
      setTituloRifa(config['titulo_rifa'] || '');
      setValorMinimoFactura(Number(config['valor_minimo_factura']) || 0); // 🔶 cargar valor mínimo
    };
    obtenerConfiguracion();
  }, []);

 const limpiarFormulario = () => {
  setCedula('');
  setNombreCliente('');
  setDireccionCliente('');
  setTelefonoCliente('');
  setCorreoCliente('');
  setFactura('');
  setNumerosAsignados([]);
  setErrores({
    cedula: false,
    nombre: false,
    direccion: false,
    telefono: false,
    correo: false,
    factura: false,
  });
};

 const verificarFacturaYRegistrar = async () => {
  const cedulaLimpia = cedula.trim();
  const facturaLimpia = factura.trim();

  if (!cedulaLimpia || !facturaLimpia || !nombreCliente || !direccionCliente || !telefonoCliente || !correoCliente) {
    return Swal.fire('Faltan campos', 'Todos los campos son obligatorios', 'warning');
  }

  const nuevosErrores = {
    cedula: !cedulaLimpia,
    nombre: !nombreCliente.trim(),
    direccion: !direccionCliente.trim(),
    telefono: !/^[0-9]{10}$/.test(telefonoCliente),
    correo: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoCliente),
    factura: !facturaLimpia,
  };

  setErrores(nuevosErrores);
  if (Object.values(nuevosErrores).some(e => e)) {
    return Swal.fire('Datos inválidos', 'Revisa los campos marcados en rojo', 'warning');
  }

  // Swal.fire({
  //   title: '🔍 Buscando factura, por favor espera...',
  //   allowOutsideClick: false,
  //   allowEscapeKey: false,
  //   showConfirmButton: false,
  //   didOpen: () => {
  //     Swal.showLoading();
  //   }
  // });

  setLoading(true);


  try {
    const resCliente = await fetch(`https://bakend-arturo-rojas-app-rifas.onrender.com/cliente?cedula=${cedulaLimpia}`);
    if (!resCliente.ok) throw new Error('Error al consultar cliente');
    const dataCliente = await resCliente.json();
    const cliente = dataCliente.length ? dataCliente[0] : null;

    if (!cliente) {
      setLoading(false);

      return Swal.fire('No encontrado', 'No se encontró un cliente con esa cédula', 'error');
    }

    console.log('🔍 Validando factura con el backend...');
    console.log('➡️ Número:', facturaLimpia, '| Cédula:', cedulaLimpia);

    const resFactura = await fetch(
      `https://bakend-arturo-rojas-app-rifas.onrender.com/factura-unica?numero=${facturaLimpia}&cedula=${cedulaLimpia}`
    );

    const resultadoFactura = await resFactura.json();
    console.log('📦 Respuesta de /factura-unica:', resultadoFactura);

    if (!resFactura.ok || resultadoFactura.encontrada === false) {
setLoading(false);

  return Swal.fire('Factura no válida', resultadoFactura?.error || 'Error de validación de factura', 'warning');
}

if (resultadoFactura.fueraDeSorteo) {
setLoading(false);

  return Swal.fire('Factura fuera del sorteo', resultadoFactura.mensaje || '', 'warning');
}

    const fechaFactura = new Date(resultadoFactura.date || resultadoFactura.fecha || resultadoFactura.createdAt);
    if (fechaInicioFacturas && fechaFactura < fechaInicioFacturas) {
setLoading(false);

      return Swal.fire(
        'Factura fuera del sorteo',
        `La factura tiene fecha ${fechaFactura.toLocaleDateString()} y no es válida para este sorteo.\nSolo se aceptan facturas desde ${fechaInicioFacturas.toLocaleDateString()}.`,
        'warning'
      );
    }

    const montoFactura = Number(resultadoFactura.total || resultadoFactura.totalAmount || resultadoFactura.amount || 0);
    if (valorMinimoFactura > 0 && montoFactura < valorMinimoFactura) {
setLoading(false);

      return Swal.fire(
        'Valor insuficiente',
        `El valor de la factura es $${montoFactura.toLocaleString()} y debe ser al menos $${valorMinimoFactura.toLocaleString()} para participar.`,
        'warning'
      );
    }

    const { data: rifaExistente } = await supabase
      .from('rifa')
      .select('id')
      .eq('factura_id', facturaLimpia);

    if (rifaExistente && rifaExistente.length > 0) {
 setLoading(false);

      return Swal.fire('Factura duplicada', 'Esta factura ya fue registrada en una rifa', 'warning');
    }

    let numeroRifa: number;
    let existe: boolean;
    do {
      numeroRifa = Math.floor(100000 + Math.random() * 900000);
      const { data } = await supabase.from('rifa').select('id').eq('numero_rifa', numeroRifa);
      existe = (data ?? []).length > 0;
    } while (existe);

    const { error } = await supabase.from('rifa').insert([{
      cedula: cedulaLimpia,
      nombre: nombreCliente.toUpperCase(),
      direccion: direccionCliente.toUpperCase(),
      telefono: telefonoCliente,
      correo: correoCliente.toUpperCase(),
      numero_rifa: numeroRifa,
      factura_id: facturaLimpia
    }]);
setLoading(false);

    if (error) {
      return Swal.fire('Error', 'No se pudo guardar el número de rifa', 'error');
    }

    await Swal.fire(
      '¡Éxito!',
      `Nombre: ${nombreCliente.toUpperCase()}\nNúmero de rifa: ${numeroRifa}`,
      'success'
    );
    limpiarFormulario();
  } catch (e) {
    console.error('Error en verificarFacturaYRegistrar:', e);
    setLoading(false);
    Swal.fire('Error', 'Ocurrió un problema inesperado', 'error');
  }
};


  const consultarRifasExistentes = async () => {
    if (!cedula) return Swal.fire('Cédula requerida', 'Introduce una cédula para consultar', 'warning');

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rifa')
        .select('numero_rifa')
        .eq('cedula', cedula);

      setLoading(false);

      if (error) {
        console.error(error);
        return Swal.fire('Error', 'No se pudo consultar los números de rifa', 'error');
      }

      if (!data || data.length === 0) {
        setNumerosAsignados([]);
        return Swal.fire('Sin registros', 'No hay números asignados para esta cédula', 'info');
      }

      setNumerosAsignados(data.map((r: any) => r.numero_rifa));
    } catch (e) {
      console.error('Error en consultarRifasExistentes:', e);
      setLoading(false);
      Swal.fire('Error', 'Ocurrió un problema inesperado al consultar', 'error');
    }
  };

  return (
    <>
      <button
  onClick={async () => {
    const { value: formValues } = await Swal.fire({
      title: '🔐 Acceso al Panel de Administración',
      html:
        `<input id="swal-user" class="swal2-input" placeholder="Correo electrónico">` +
        `<input id="swal-pass" type="password" class="swal2-input" placeholder="Contraseña">` +
        `<a id="forgot-password" </a>`,
      focusConfirm: false,
      preConfirm: () => {
        const usuario = (document.getElementById('swal-user') as HTMLInputElement).value;
        const clave = (document.getElementById('swal-pass') as HTMLInputElement).value;
        return { usuario, clave };
      },
      showCancelButton: true,
      confirmButtonText: 'Ingresar',
      cancelButtonText: 'Cancelar'
    });

    if (formValues) {
      const { usuario, clave } = formValues;

      const usuarioValido = 'Arturojas10@hotmail.com';
      const claveValida = 'Sajorutr4';

      if (usuario === usuarioValido && clave === claveValida) {
        window.location.href = '/admin';
      } else {
        Swal.fire('Acceso denegado', 'Usuario o contraseña incorrectos', 'error');
      }
    }
  }}
  className="admin-float-button desktop-only"
  title="Panel de administración"
>
  <FaCog size={24} />
</button>


      <div className="rifa-container">
        <div className="rifa-overlay"></div>
        <div className="rifa-card">
  <h1 className="rifa-title">
    {tituloRifa || 'Participa en nuestra espectacular rifa de una moto eléctrica'}
  </h1>

  {fechaFinSorteo && <Countdown targetDate={fechaFinSorteo} />}
     <input
  type="number"
  value={cedula}
  onChange={e => setCedula(e.target.value)}
  onBlur={consultarNombrePorCedula} // se ejecuta al salir del campo
  onKeyDown={e => {
    if (e.key === 'Enter') consultarNombrePorCedula(); // o al presionar Enter
  }}
  placeholder="Número de cédula"
  className={`rifa-input ${errores.cedula ? 'input-error' : ''}`}
/>

 <input
  type="text"
  value={nombreCliente}
  readOnly
  placeholder="Nombre completo"
  className={`rifa-input ${errores.nombre ? 'input-error' : ''}`}
/>
{loading && (
  <div className="custom-loader-overlay">
    <div className="custom-loader-spinner"></div>
  </div>
)}
{cedulaNoEncontrada && !buscandoNombre && (
  <div className="mensaje-error">⚠️ Cédula no encontrada</div>
)}



          <input
    type="text"
    value={direccionCliente}
    onChange={e => setDireccionCliente(e.target.value)}
    placeholder="Dirección"
    className={`rifa-input ${errores.direccion ? 'input-error' : ''}`}
  />

            <input
   type="number"
    value={telefonoCliente}
    onChange={e => setTelefonoCliente(e.target.value)}
    placeholder="Teléfono"
    className={`rifa-input ${errores.telefono ? 'input-error' : ''}`}
  />

            <input
    type="email"
    value={correoCliente}
    onChange={e => setCorreoCliente(e.target.value)}
    placeholder="Correo electrónico"
    className={`rifa-input ${errores.correo ? 'input-error' : ''}`}
  />


          <input
    type="number"
    value={factura}
    onChange={e => setFactura(e.target.value)}
    placeholder="Número de factura"
    className={`rifa-input ${errores.factura ? 'input-error' : ''}`}
  />
            <button onClick={verificarFacturaYRegistrar} className="rifa-button">
    Generar número aleatorio
  </button>
           <button onClick={consultarRifasExistentes} className="rifa-button">
    Consultar números asignados
  </button>
  {numerosAsignados.length > 0 && (
    <div className="tabla-numeros">
      <h3>Números asignados a esta cédula:</h3>
      <table>
        <thead>
          <tr><th>#</th><th>Número de Rifa</th></tr>
        </thead>
        <tbody>
          {numerosAsignados.map((num, index) => (
            <tr key={index}><td>{index + 1}</td><td>{num}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )}

          <div className="rifa-link">
            <a href="https://ejemplo.com/sorteo">Ir al sorteo →<br />ejemplo.com/sorteo</a>
          </div>
        </div>
      </div>
      




    </>
  );
}

export default Rifa;
