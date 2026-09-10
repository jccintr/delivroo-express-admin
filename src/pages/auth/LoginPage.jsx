import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Label, TextInput, Alert, Spinner } from 'flowbite-react';
import { useAuth } from '../../context/AuthContext';
import PasswordInput from '../../components/ui/PasswordInput';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-ink">Entrar</h2>
      <p className="mb-6 text-sm text-ink-soft">Acesse o painel administrativo do Delivroo Express.</p>

      {error && (
        <Alert color="failure" className="mb-4">
          {error}
        </Alert>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="email" className="mb-1 block">
            E-mail
          </Label>
          <TextInput
            id="email"
            name="email"
            type="email"
            placeholder="voce@delivroo.express"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="password" className="mb-1 block">
            Senha
          </Label>
          <PasswordInput
            id="password"
            name="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <Button
          type="submit"
          color="warning"
          className="mt-2 bg-orange text-white enabled:hover:bg-orange-dark"
          disabled={loading}
          isProcessing={loading}
        >
          {!loading ? 'Entrar' : <Spinner size="sm" />}
        </Button>
      </form>
    </div>
  );
}
