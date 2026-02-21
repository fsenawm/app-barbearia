import { useState, useEffect, useCallback } from 'react';
import { scheduleStorage, ScheduleConfig, ScheduleBlock } from '../utils/storage';

export const useSchedules = () => {
    const [weeklyRoutine, setWeeklyRoutine] = useState<ScheduleConfig[]>([]);
    const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [newBlockDate, setNewBlockDate] = useState('');
    const [newBlockReason, setNewBlockReason] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Load data from Supabase on mount
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const [config, blocksData] = await Promise.all([
                    scheduleStorage.getConfig(),
                    scheduleStorage.getBlocks(),
                ]);
                setWeeklyRoutine(config);
                setBlocks(blocksData);
            } catch (e) {
                console.error('Error loading schedules:', e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const toggleDay = (index: number) => {
        setWeeklyRoutine(prev =>
            prev.map((item, i) => i === index ? { ...item, is_open: !item.is_open } : item)
        );
    };

    const updateTime = (index: number, field: 'start_time' | 'end_time', value: string) => {
        setWeeklyRoutine(prev =>
            prev.map((item, i) => i === index ? { ...item, [field]: value } : item)
        );
    };

    const removeBlock = useCallback(async (id: string) => {
        try {
            await scheduleStorage.removeBlock(id);
            setBlocks(prev => prev.filter(b => b.id !== id));
        } catch {
            alert('Erro ao remover bloqueio.');
        }
    }, []);

    const addBlock = useCallback(async () => {
        if (!newBlockDate) {
            alert('Selecione uma data para o bloqueio.');
            return;
        }
        try {
            const block = await scheduleStorage.addBlock(newBlockDate, newBlockReason);
            setBlocks(prev => [...prev, block]);
            setNewBlockDate('');
            setNewBlockReason('');
        } catch {
            alert('Erro ao adicionar bloqueio. Verifique se a data já não está bloqueada.');
        }
    }, [newBlockDate, newBlockReason]);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
            await scheduleStorage.saveConfig(weeklyRoutine);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        } catch {
            alert('Erro ao salvar configurações.');
        } finally {
            setIsSaving(false);
        }
    }, [weeklyRoutine]);

    const totalHours = weeklyRoutine.reduce((acc, d) => {
        if (!d.is_open || d.start_time === '--:--' || d.end_time === '--:--') return acc;
        const [sh, sm] = d.start_time.split(':').map(Number);
        const [eh, em] = d.end_time.split(':').map(Number);
        return acc + (eh - sh) + (em - sm) / 60;
    }, 0);

    return {
        weeklyRoutine,
        toggleDay,
        updateTime,
        blocks,
        removeBlock,
        addBlock,
        newBlockDate,
        setNewBlockDate,
        newBlockReason,
        setNewBlockReason,
        handleSave,
        isSaved,
        isSaving,
        isLoading,
        totalHours: Math.round(totalHours),
        activeBlocks: blocks.length,
    };
};
