import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Verify from './pages/Verify';
import StudentDashboard from './pages/StudentDashboard';
import ManagerDashboard from './pages/ManagerDashboard';

function BrandPanel() {
    const { pathname } = useLocation();
    if (!['/login', '/signup', '/verify'].includes(pathname)) return null;

    return (
        <aside className="brand-panel">
            <div>
                <div className="brand-kicker">New Market Junction · Laundry</div>
                <h1>Wash<br />Track</h1>
                <p>Book a machine, report a fault, and get your laundry point back.</p>
            </div>
            <div className="brand-foot">Built by students, for students.</div>
        </aside>
    );
}

function App() {
    return (
        <BrowserRouter>
            <BrandPanel />
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/verify" element={<Verify />} />
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/manager" element={<ManagerDashboard />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;