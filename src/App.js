import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, Container } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useMemo, useState } from 'react';
import LoginForm from './components/auth/LoginForm';
import NavBar from './components/layout/NavBar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Transactions from './pages/Transactions';
import Dashboard from './pages/Dashboard';
import { AuthProvider } from './services/auth';

function App() {
  const [mode, setMode] = useState('dark');

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
    },
  }), [mode]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <NavBar toggleTheme={() => setMode(prev => prev === 'light' ? 'dark' : 'light')} mode={mode} />
          <Container>
            <Routes>
              <Route path="/login" element={<LoginForm />} />
               <Route
                path="/"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Transactions />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<h1>Page non trouvée</h1>} />
            </Routes>
          </Container>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;