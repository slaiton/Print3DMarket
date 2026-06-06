// src/pages/login/ResetPasswordPage.tsx
// Página que procesa el enlace de recuperación enviado por Supabase al correo

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './LoginPage.css';
import './ResetPasswordPage.css';

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [done, setDone]               = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase procesa automáticamente el hash de la URL al cargar
  // y dispara el evento PASSWORD_RECOVERY cuando el token es válido.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setSessionReady(true);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) throw updateErr;
      setDone(true);
      // Redirige al login después de 3 segundos
      setTimeout(() => navigate('/login'), 3000);
    } catch (e: any) {
      setError(e.message ?? 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="rp-container">
        <div className="login-card rp-card">
          {/* Logo */}
          <div className="rp-logo">
            <div className="rp-logo-icon"><Printer size={22} /></div>
            <span>Print3D Studio</span>
          </div>

          {done ? (
            /* ── Éxito ── */
            <div className="rp-success">
              <div className="rp-success-icon">
                <CheckCircle size={32} />
              </div>
              <h2>¡Contraseña actualizada!</h2>
              <p>Serás redirigido al inicio de sesión en unos segundos…</p>
              <button className="login-btn" onClick={() => navigate('/login')}>
                Ir al login
              </button>
            </div>
          ) : !sessionReady ? (
            /* ── Esperando token ── */
            <div className="rp-waiting">
              <div className="rp-spinner" />
              <p>Verificando enlace de recuperación…</p>
              <span>
                Si este mensaje no desaparece, el enlace puede haber expirado.{' '}
                <button className="rp-link" onClick={() => navigate('/login')}>
                  Volver al login
                </button>
              </span>
            </div>
          ) : (
            /* ── Formulario ── */
            <>
              <div className="card-header">
                <h2>Nueva contraseña</h2>
                <p>Elige una contraseña segura para tu cuenta</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nueva contraseña</label>
                  <div className="password-wrapper">
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowPw(s => !s)}>
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirmar contraseña</label>
                  <div className="password-wrapper">
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Repite la contraseña"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Indicador de fortaleza */}
                {password && (
                  <div className="rp-strength">
                    <div
                      className={`rp-strength-bar ${
                        password.length >= 12 ? 'strong'
                        : password.length >= 8  ? 'medium'
                        : 'weak'
                      }`}
                    />
                    <span>
                      {password.length >= 12 ? 'Contraseña fuerte'
                       : password.length >= 8  ? 'Contraseña media'
                       : 'Contraseña débil'}
                    </span>
                  </div>
                )}

                {error && <div className="error-box">{error}</div>}

                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? (
                    <><span className="loader" /> Guardando…</>
                  ) : (
                    'Guardar contraseña'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
