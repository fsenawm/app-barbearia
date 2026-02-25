import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const Auth: React.FC = () => {
    const { signIn, signUp, resetPassword, error } = useAuth();
    const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (mode === 'forgot') {
            const ok = await resetPassword(email);
            if (ok) setResetSent(true);
        } else if (mode === 'login') {
            await signIn(email, password);
        } else {
            const result = await signUp(email, password, name);
            if (result === 'confirm') setConfirmed(true);
        }

        setLoading(false);
    };

    if (resetSent) {
        return (
            <div className="min-h-screen bg-[#111a21] flex flex-col items-center justify-center px-6">
                <div className="w-full max-w-sm text-center">
                    <span className="material-symbols-outlined text-primary text-6xl mb-4 block" translate="no">lock_reset</span>
                    <h2 className="text-white text-xl font-bold mb-2 font-['Manrope']">Email enviado!</h2>
                    <p className="text-slate-400 text-sm font-['Manrope']">
                        Enviamos um link de recuperação para <strong className="text-slate-300">{email}</strong>.
                        Verifique sua caixa de entrada e siga as instruções.
                    </p>
                    <button
                        onClick={() => { setResetSent(false); setMode('login'); }}
                        className="mt-6 text-primary text-sm font-semibold font-['Manrope']"
                    >
                        Voltar para o login
                    </button>
                </div>
            </div>
        );
    }

    if (confirmed) {
        return (
            <div className="min-h-screen bg-[#111a21] flex flex-col items-center justify-center px-6">
                <div className="w-full max-w-sm text-center">
                    <span className="material-symbols-outlined text-primary text-6xl mb-4 block" translate="no">mark_email_read</span>
                    <h2 className="text-white text-xl font-bold mb-2 font-['Manrope']">Verifique seu email</h2>
                    <p className="text-slate-400 text-sm font-['Manrope']">
                        Enviamos um link de confirmação para <strong className="text-slate-300">{email}</strong>.
                        Clique no link e depois faça o login.
                    </p>
                    <button
                        onClick={() => { setConfirmed(false); setMode('login'); }}
                        className="mt-6 text-primary text-sm font-semibold font-['Manrope']"
                    >
                        Voltar para o login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#111a21] flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-primary/15 mb-4">
                        <span className="material-symbols-outlined text-primary text-[36px]" translate="no">content_cut</span>
                    </div>
                    <h1 className="text-white text-2xl font-extrabold font-['Manrope'] tracking-tight">BarberApp</h1>
                    <p className="text-slate-500 text-sm mt-1 font-['Manrope']">
                        {mode === 'forgot'
                            ? 'Recupere sua senha'
                            : mode === 'login'
                                ? 'Entre na sua conta'
                                : 'Crie sua conta'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {mode === 'register' && (
                        <div>
                            <label className="text-slate-400 text-xs font-semibold mb-1.5 block font-['Manrope']">SEU NOME</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Nome da barbearia ou dono"
                                required
                                autoComplete="name"
                                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 outline-none focus:border-primary transition-colors font-['Manrope']"
                            />
                        </div>
                    )}

                    <div>
                        <label className="text-slate-400 text-xs font-semibold mb-1.5 block font-['Manrope']">EMAIL</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                            autoComplete="email"
                            className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 outline-none focus:border-primary transition-colors font-['Manrope']"
                        />
                    </div>

                    {mode !== 'forgot' && (
                        <div>
                            <label className="text-slate-400 text-xs font-semibold mb-1.5 block font-['Manrope']">SENHA</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                required
                                minLength={6}
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 outline-none focus:border-primary transition-colors font-['Manrope']"
                            />
                        </div>
                    )}

                    {mode === 'login' && (
                        <div className="flex justify-end -mt-2">
                            <button
                                type="button"
                                onClick={() => setMode('forgot')}
                                className="text-primary text-xs font-semibold font-['Manrope'] hover:underline"
                            >
                                Esqueceu a senha?
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                            <span className="material-symbols-outlined text-red-400 text-[18px] shrink-0" translate="no">error</span>
                            <p className="text-red-400 text-sm font-['Manrope']">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white font-bold py-3.5 rounded-xl text-sm active:scale-95 transition-transform disabled:opacity-60 font-['Manrope'] mt-1"
                    >
                        {loading
                            ? (mode === 'forgot'
                                ? 'Enviando...'
                                : mode === 'login' ? 'Entrando...' : 'Criando conta...')
                            : (mode === 'forgot'
                                ? 'Enviar link de recuperação'
                                : mode === 'login' ? 'Entrar' : 'Criar conta')}
                    </button>
                </form>

                {/* Toggle */}
                <div className="text-center mt-6">
                    {mode === 'forgot' ? (
                        <p className="text-slate-500 text-sm font-['Manrope']">
                            Lembrou a senha?{' '}
                            <button
                                onClick={() => setMode('login')}
                                className="text-primary font-semibold"
                            >
                                Voltar para o login
                            </button>
                        </p>
                    ) : mode === 'login' ? (
                        <p className="text-slate-500 text-sm font-['Manrope']">
                            Não tem conta?{' '}
                            <button
                                onClick={() => setMode('register')}
                                className="text-primary font-semibold"
                            >
                                Criar conta
                            </button>
                        </p>
                    ) : (
                        <p className="text-slate-500 text-sm font-['Manrope']">
                            Já tem conta?{' '}
                            <button
                                onClick={() => setMode('login')}
                                className="text-primary font-semibold"
                            >
                                Entrar
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Auth;
