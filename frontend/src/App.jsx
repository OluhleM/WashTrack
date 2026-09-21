import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentDashboard from './pages/StudentDashboard';
import ManagerDashboard from './pages/ManagerDashboard';

function App() {
  return (
      <BrowserRouter>
        <Routes>

          <Route
              path="/"
              element={<Navigate to="/login" />}
          />

          <Route
              path="/login"
              element={<Login />}
          />

          <Route
              path="/signup"
              element={<Signup />}
          />

          <Route
              path="/student"
              element={<StudentDashboard />}
          />

          <Route
              path="/manager"
              element={<ManagerDashboard />}
          />

        </Routes>
      </BrowserRouter>
  );
}

export default App;
