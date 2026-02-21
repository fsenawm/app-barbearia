import { useState, useMemo, useEffect } from 'react';
import { servicesStorage, Service } from '../utils/storage';

export const useServices = () => {
    const [search, setSearch] = useState('');
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const loadServices = async () => {
        setIsLoading(true);
        const data = await servicesStorage.getServices();
        setServices(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadServices();
    }, []);

    const filteredServices = useMemo(() => {
        return services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    }, [services, search]);

    const handleAddService = async (newService: Omit<Service, 'id' | 'isPopular'>) => {
        setIsSaving(true);
        try {
            await servicesStorage.saveService({ ...newService, isPopular: false });
            await loadServices();
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        } catch {
            alert('Erro ao salvar serviço.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteService = async (id: string) => {
        if (!window.confirm('Excluir este serviço? Agendamentos vinculados podem ser afetados.')) return;
        try {
            await servicesStorage.deleteService(id);
            await loadServices();
        } catch {
            alert('Erro ao excluir serviço.');
        }
    };

    const handleUpdateService = async (id: string, updates: Partial<Omit<Service, 'id'>>) => {
        setIsSaving(true);
        try {
            await servicesStorage.updateService(id, updates);
            await loadServices();
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        } catch {
            alert('Erro ao atualizar serviço.');
        } finally {
            setIsSaving(false);
        }
    };

    return {
        search,
        setSearch,
        services,
        filteredServices,
        handleAddService,
        handleDeleteService,
        handleUpdateService,
        isLoading,
        isSaving,
        isSaved,
    };
};
