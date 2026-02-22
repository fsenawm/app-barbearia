import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { localDb } from '../lib/localDb';
import { fullSync } from '../lib/syncQueue';

function translateError(message: string): string {
    if (message.includes('Invalid login credentials')) return 'Email ou senha incorretos.';
    if (message.includes('Email not confirmed')) return 'Confirme seu email antes de entrar.';
    if (message.includes('User already registered')) return 'Este email já está cadastrado.';
    if (message.includes('already registered')) return 'Este email já está cadastrado.';
    if (message.includes('Password should be at least')) return 'A senha deve ter pelo menos 6 caracteres.';
    if (message.includes('Unable to validate email')) return 'Email inválido.';
    if (message.includes('Signup is disabled')) return 'Cadastro desativado. Contate o suporte.';
    return message;
}

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
            if (session?.user) fullSync().catch(console.error);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string): Promise<boolean> => {
        setError(null);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setError(translateError(error.message));
            return false;
        }
        await fullSync().catch(console.error);
        return true;
    };

    const signUp = async (email: string, password: string, name: string): Promise<'ok' | 'confirm' | false> => {
        setError(null);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } },
        });
        if (error) {
            setError(translateError(error.message));
            return false;
        }
        // If session is null, email confirmation is required
        if (!data.session) return 'confirm';
        await fullSync().catch(console.error);
        return 'ok';
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        await Promise.all([
            localDb.clients.clear(),
            localDb.services.clear(),
            localDb.appointments.clear(),
            localDb.schedule_config.clear(),
            localDb.schedule_blocks.clear(),
            localDb.sync_queue.clear(),
        ]);
    };

    return { user, loading, error, signIn, signUp, signOut };
};
