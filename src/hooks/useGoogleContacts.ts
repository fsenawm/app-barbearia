import { useState } from 'react';

export interface GoogleContact {
    resourceName: string;
    name: string;
    phone: string;
    rawPhone: string;
}

interface PeopleApiPerson {
    resourceName: string;
    names?: { displayName: string }[];
    phoneNumbers?: { value: string }[];
}

const fetchPeopleContacts = async (accessToken: string): Promise<GoogleContact[]> => {
    let contacts: GoogleContact[] = [];
    let pageToken: string | undefined;

    do {
        const url = new URL('https://people.googleapis.com/v1/people/me/connections');
        url.searchParams.set('personFields', 'names,phoneNumbers');
        url.searchParams.set('pageSize', '1000');
        if (pageToken) url.searchParams.set('pageToken', pageToken);

        const res = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) throw new Error('Erro ao buscar contatos');

        const data = await res.json();
        const connections: PeopleApiPerson[] = data.connections || [];

        const parsed = connections
            .filter((c) => c.phoneNumbers?.length && c.names?.length)
            .map((c) => {
                const raw = c.phoneNumbers![0].value;
                const digits = raw.replace(/\D/g, '');
                return {
                    resourceName: c.resourceName,
                    name: c.names![0].displayName,
                    phone: digits,
                    rawPhone: raw,
                };
            })
            .filter((c) => c.phone.length >= 10);

        contacts = contacts.concat(parsed);
        pageToken = data.nextPageToken;
    } while (pageToken);

    return contacts.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
};

export const useGoogleContacts = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [contacts, setContacts] = useState<GoogleContact[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

    const triggerImport = (onContacts: (contacts: GoogleContact[]) => void) => {
        if (!clientId) {
            setError('VITE_GOOGLE_CLIENT_ID não configurado.');
            return;
        }

        if (typeof window.google === 'undefined') {
            setError('Google não carregado. Tente novamente.');
            return;
        }

        setError(null);
        setIsLoading(true);
        setIsReady(false);

        const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'https://www.googleapis.com/auth/contacts.readonly',
            callback: async (response) => {
                if (response.error) {
                    setError('Autorização negada.');
                    setIsLoading(false);
                    return;
                }
                try {
                    const fetched = await fetchPeopleContacts(response.access_token);
                    setContacts(fetched);
                    setIsReady(true);
                    onContacts(fetched);
                } catch {
                    setError('Erro ao buscar contatos do Google.');
                } finally {
                    setIsLoading(false);
                }
            },
        });

        tokenClient.requestAccessToken({ prompt: 'consent' });
    };

    return { triggerImport, isLoading, contacts, error, isReady, hasClientId: !!clientId };
};
