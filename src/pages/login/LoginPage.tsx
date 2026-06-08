import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, Eye, EyeOff, Layers3, Box, Cuboid, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { SEOHead } from '../../seo/SEOHead';
import { PAGE_META } from '../../seo/seo.config';
import './LoginPage.css';

// ── Vista principal: iniciar sesión ──────────────────────────
function LoginForm({ onForgot }: { onForgot: () => void }) {
  const { signIn }  = useAuthStore();
  const navigate    = useNavigate();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
            onChange={e => setEmail(e.target.value)}
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
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowPw(s => !s)}>
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Enlace olvidé contraseña */}
        <div className="forgot-link-wrap">
          <button type="button" className="forgot-link" onClick={onForgot}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}

        <button type="submit" disabled={loading} className="login-btn">
          {loading ? (
            <><span className="loader" /> Verificando…</>
          ) : 'Ingresar'}
        </button>
      </form>

      <div className="login-footer">
        ¿Necesitas acceso?
        <a href="mailto:admin@print3d.com">Contactar administrador</a>
      </div>
    </>
  );
}

// ── Vista: olvidé mi contraseña ───────────────────────────────
function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetErr) throw resetErr;
      setSent(true);
    } catch (err: any) {
      setError(err.message ?? 'Error al enviar el correo');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="forgot-success">
        <div className="forgot-success-icon">
          <CheckCircle size={32} />
        </div>
        <h2>Revisa tu correo</h2>
        <p>
          Enviamos un enlace de recuperación a <strong>{email}</strong>.
          Haz clic en él para crear una nueva contraseña.
        </p>
        <p className="forgot-note">
          Si no lo ves, revisa la carpeta de spam.
        </p>
        <button className="login-btn" onClick={onBack}>
          Volver al login
        </button>
      </div>
    );
  }

  return (
    <>
      <button type="button" className="back-btn" onClick={onBack}>
        <ArrowLeft size={15} /> Volver
      </button>

      <div className="card-header">
        <h2>Recuperar contraseña</h2>
        <p>Te enviaremos un enlace para crear una nueva contraseña</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Correo electrónico</label>
          <div className="input-icon-wrap">
            <Mail size={16} className="input-icon" />
            <input
              type="email"
              placeholder="correo@empresa.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              style={{ paddingLeft: 38 }}
            />
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}

        <button type="submit" disabled={loading} className="login-btn">
          {loading ? (
            <><span className="loader" /> Enviando…</>
          ) : 'Enviar enlace de recuperación'}
        </button>
      </form>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'forgot'>('login');

  return (
    <div className="login-page">
      <SEOHead
        title={PAGE_META.login.title}
        description={PAGE_META.login.description}
        noIndex={true}
      />
      <div className="login-background">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="login-container">
        {/* Branding */}
        <div className="login-brand">
          <div className="brand-logo"><Printer size={42} /></div>
          <h1>Print3D Studio</h1>
          <p>Gestiona pedidos, inventario y ventas de tus impresiones 3D desde una sola plataforma.</p>
          <div className="brand-icons">
            <div className="icon-card"><Layers3 /><span>Modelos</span></div>
            <div className="icon-card"><Box /><span>Inventario</span></div>
            <div className="icon-card"><Cuboid /><span>Producción</span></div>
          </div>
        </div>

        {/* Card */}
        <div className="login-card">
          {mode === 'login' ? (
            <LoginForm onForgot={() => setMode('forgot')} />
          ) : (
            <ForgotPasswordForm onBack={() => setMode('login')} />
          )}
        </div>
      </div>
    </div>
  );
}
