import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

const parsePrice = (price: string): number => {
    if (!price) return 0;
    return parseFloat(price.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
};

const formatCurrency = (value: number): string => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export const useRanking = () => {
    const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
    const [rawData, setRawData] = useState<Record<string, { name: string; count: number; revenue: number }>>({});
    const [isLoading, setIsLoading] = useState(false);

    const loadData = async (p: 'week' | 'month' | 'year') => {
        setIsLoading(true);
        try {
            const now = new Date();
            let startDate: string;

            if (p === 'week') {
                const weekAgo = new Date(now);
                weekAgo.setDate(now.getDate() - 7);
                startDate = weekAgo.toISOString().split('T')[0];
            } else if (p === 'month') {
                startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
            } else {
                startDate = `${now.getFullYear()}-01-01`;
            }

            const endDate = now.toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('appointments')
                .select('service_id, services(name, price)')
                .gte('appointment_date', startDate)
                .lte('appointment_date', endDate);

            if (error) throw error;

            const grouped: Record<string, { name: string; count: number; revenue: number }> = {};
            (data || []).forEach((a: any) => {
                const sid = a.service_id;
                if (!grouped[sid]) {
                    grouped[sid] = { name: a.services?.name || 'Desconhecido', count: 0, revenue: 0 };
                }
                grouped[sid].count++;
                grouped[sid].revenue += parsePrice(a.services?.price || '0');
            });
            setRawData(grouped);
        } catch (e) {
            console.error('Error loading ranking:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData(period);
    }, [period]);

    const sortedRanking = useMemo(() => {
        return Object.entries(rawData)
            .sort((a, b) => b[1].revenue - a[1].revenue)
            .map(([, v], i) => ({
                rank: i + 1,
                title: v.name,
                atendimentos: v.count,
                revenueNum: v.revenue,
                revenue: formatCurrency(v.revenue),
            }));
    }, [rawData]);

    const maxRevenue = sortedRanking[0]?.revenueNum || 1;

    const rankingWithProgress = sortedRanking.map(r => ({
        ...r,
        progress: Math.round((r.revenueNum / maxRevenue) * 100),
    }));

    const top1 = rankingWithProgress[0]
        ? {
            title: rankingWithProgress[0].title,
            description: `${rankingWithProgress[0].atendimentos} atendimentos no período`,
            revenue: rankingWithProgress[0].revenue,
            atendimentos: rankingWithProgress[0].atendimentos,
            progress: 100,
        }
        : {
            title: 'Nenhum serviço',
            description: 'Sem agendamentos no período',
            revenue: 'R$ 0',
            atendimentos: 0,
            progress: 0,
        };

    const ranking = rankingWithProgress.slice(1);

    return {
        period,
        setPeriod,
        top1,
        ranking,
        isLoading,
    };
};
