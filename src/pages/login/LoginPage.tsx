
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Printer,
  Eye,
  EyeOff,
  Layers3,
  Box,
  Cuboid
} from 'lucide-react';

import { useAuthStore } from '../../store/useAuthStore';
import './LoginPage.css';

export default function LoginPage() {
  const { signIn } = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al iniciar sesión'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="login-container">

        {/* Branding */}
        <div className="login-brand">

          <div className="brand-logo">
            <Printer size={42} />
          </div>

          <h1>Print3D Studio</h1>

          <p>
            Gestiona pedidos, inventario y ventas de tus
            impresiones 3D desde una sola plataforma.
          </p>

          <div className="brand-icons">
            <div className="icon-card">
              <Layers3 />
              <span>Modelos</span>
            </div>

            <div className="icon-card">
              <Box />
              <span>Inventario</span>
            </div>

            <div className="icon-card">
              <Cuboid />
              <span>Producción</span>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="login-card">

          <div className="card-header">
            <h2>Bienvenido</h2>
            <p>Inicia sesión para continuar</p>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label>Correo electrónico</label>

              <input
                type="email"
                placeholder="correo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Contraseña</label>

              <div className="password-wrapper">

                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>

              </div>
            </div>

            {error && (
              <div className="error-box">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="login-btn"
            >
              {loading ? (
                <>
                  <span className="loader"></span>
                  Verificando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>

          </form>

          <div className="login-footer">
            ¿Necesitas acceso?
            <a href="mailto:admin@print3d.com">
              Contactar administrador
            </a>
          </div>

        </div>

      </div>

    </div>
  );
}