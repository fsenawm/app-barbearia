import { useState, useEffect } from 'react';
import { clientsStorage, Client } from '../utils/storage';

type Mode = 'list' | 'new' | 'edit';

export const useClients = () => {
    const [mode, setMode] = useState<Mode>('list');
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [search, setSearch] = useState('');

    const [clientData, setClientData] = useState({
        name: '',
        phone: '',
        birthDate: '',
        notes: '',
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const loadClients = async () => {
        setIsLoading(true);
        const data = await clientsStorage.getClients();
        setClients(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadClients();
    }, []);

    const filteredClients = clients.filter(c => {
        const searchLower = search.toLowerCase();
        const searchDigits = search.replace(/\D/g, '');
        return (
            c.name.toLowerCase().includes(searchLower) ||
            c.phone.includes(search) ||
            (searchDigits.length >= 4 && c.phone.replace(/\D/g, '').includes(searchDigits))
        );
    });

    const startNew = () => {
        setClientData({ name: '', phone: '', birthDate: '', notes: '' });
        setEditingClient(null);
        setMode('new');
    };

    const startEdit = (client: Client) => {
        setClientData({
            name: client.name,
            phone: client.phone,
            birthDate: client.birthDate || '',
            notes: client.notes || '',
        });
        setEditingClient(client);
        setMode('edit');
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Excluir este cliente? Esta ação não pode ser desfeita.')) return;
        try {
            await clientsStorage.deleteClient(id);
            await loadClients();
        } catch {
            alert('Erro ao excluir cliente.');
        }
    };

    const handleSave = async () => {
        if (!clientData.name.trim() || !clientData.phone) {
            alert('Por favor, preencha nome e WhatsApp.');
            return;
        }

        const digits = clientData.phone.replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 11) {
            alert('Número de WhatsApp inválido. Use o formato (XX) XXXXX-XXXX.');
            return;
        }

        // Verificar telefone duplicado
        const isDuplicate = clients.some(c => {
            if (mode === 'edit' && editingClient && c.id === editingClient.id) return false;
            return c.phone.replace(/\D/g, '') === digits;
        });
        if (isDuplicate) {
            alert('Já existe um cliente cadastrado com este número de WhatsApp.');
            return;
        }

        setIsSaving(true);
        try {
            if (mode === 'edit' && editingClient) {
                await clientsStorage.updateClient(editingClient.id, clientData);
            } else {
                await clientsStorage.saveClient(clientData);
            }
            setIsSaved(true);
            await loadClients();
            setTimeout(() => {
                setIsSaved(false);
                setMode('list');
            }, 1500);
        } catch {
            alert('Erro ao salvar cliente.');
        } finally {
            setIsSaving(false);
        }
    };

    const updateField = (field: keyof typeof clientData, value: string) => {
        setClientData(prev => ({ ...prev, [field]: value }));
    };

    return {
        mode,
        setMode,
        clients,
        filteredClients,
        search,
        setSearch,
        clientData,
        updateField,
        editingClient,
        isLoading,
        isSaving,
        isSaved,
        startNew,
        startEdit,
        handleDelete,
        handleSave,
    };
};
