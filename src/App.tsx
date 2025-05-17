import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Rifa from './Rifa';
import AdminPanel from './AdminPanel';
import BienvenidaRifa from './BienvenidaRifa';

export default function App() {
  return (
    <Router>
      <Routes>

        {/* Página de inicio con el modal */}
        <Route
          path="/"
          element={
            <>
              <BienvenidaRifa />
              <Rifa />
            </>
          }
        />

        {/* Panel de administración sin modal */}
        <Route path="/admin" element={<AdminPanel />} />
        
      </Routes>
    </Router>
  );
}
