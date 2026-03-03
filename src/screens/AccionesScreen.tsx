// @ts-nocheck
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { theme } from '../styles/theme';
import { useStore } from '../store/useStore';
import { Dumbbell, BookOpen, CheckCircle2 } from 'lucide-react-native';



export default function AccionesScreen() {
    const { addCredits, addStudyLog, updateDailyLog, dailyPlans, dailyLogs, currentDate, forceResetDay } = useStore();

    const today = new Date(currentDate + "T12:00:00Z");
    const weekdayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dayLabel = `${weekdayNames[today.getDay()]}, ${today.getDate()}`;

    const [snackMsg, setSnackMsg] = useState<string | null>(null);
    const anim = useRef(new Animated.Value(80)).current; // translateY
    const [claiming, setClaiming] = useState<Record<string, boolean>>({});

    // Focus timer state
    const [running, setRunning] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const intervalRef = useRef<number | null>(null);

    const showSnack = (msg: string) => {
        setSnackMsg(msg);
        anim.setValue(80);
        Animated.timing(anim, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => {
            setTimeout(() => {
                Animated.timing(anim, { toValue: 80, duration: 250, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => setSnackMsg(null));
            }, 1700);
        });
    };



    // Claimable reinforcement cards (will disappear when task marked completed in dailyLogs)
    const claimableActions = [
        { id: 'read', title: 'Lectura', field: 'read', base: 50 },
        { id: 'sugar', title: 'Día sin azúcar', field: 'sugarFree', base: 20 },
        { id: 'train', title: 'Completar Entrenamiento', field: 'trained', base: 150 },
        { id: 'study', title: 'Estudio', field: 'english', base: 50 },
    ];

    const handleClaim = (action: { id: string; title: string; field: string; base: number }) => {
        if (claiming[action.id]) return;
        setClaiming(prev => ({ ...prev, [action.id]: true }));

        const todayStr = useStore.getState().currentDate;
        // compute multiplier from plan mode to show amount
        const plan = (dailyPlans && dailyPlans[todayStr]) || null;
        const modo: any = plan?.modo || 'estandar';
        const multipliers: Record<string, number> = { minimo: 0.5, estandar: 1, intenso: 1.5 };
        const mult = multipliers[modo] || 1;
        const amount = Math.round(action.base * mult);

        // mark daily log field to true; store will grant credits via updateDailyLog
        updateDailyLog(todayStr, { [action.field]: true } as any);
        showSnack(`+${amount} ✨  •  Recompensa: ${action.title}`);
    };



    const startFocus = () => {
        if (running) return;
        setRunning(true);
        intervalRef.current = setInterval(() => {
            setSeconds(s => s + 1);
        }, 1000) as unknown as number;
    };

    const stopFocus = () => {
        if (!running) return;
        setRunning(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current as unknown as number);
            intervalRef.current = null;
        }
        const minutes = Math.floor(seconds / 60);
        if (minutes > 0) {
            const amount = minutes * 2; // 2 créditos por minuto
            const todayStr = currentDate;
            try {
                addStudyLog({ date: todayStr, type: 'focus', timeMinutes: minutes });
            } catch (e) { }
            const prev = useStore.getState().creditosDisponibles || 0;
            addCredits(amount);
            const total = prev + amount;
            showSnack(`+${amount} ✨  •  Total: ${total}`);
        } else {
            showSnack('Tiempo de enfoque insuficiente para obtener créditos');
        }
        setSeconds(0);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Registrar Esfuerzo</Text>
            <Text style={styles.sub}>Cada acción cuenta para tus créditos. Hoy: {dayLabel}</Text>

            <View style={styles.topCard}>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={styles.timerIcon}><BookOpen color='#FFFFFF' size={18} /></View>
                        <Text style={[styles.topTitle, { marginLeft: theme.spacing.sm }]}>ENFOQUE PROFUNDO</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.sm }}>
                        <Text style={styles.timerText}>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</Text>
                        <TouchableOpacity style={[styles.focusBtn, running ? styles.focusBtnStop : styles.focusBtnStart]} onPress={running ? stopFocus : startFocus}>
                            <Text style={styles.focusBtnText}>{running ? 'Detener' : 'Iniciar'}</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.caption, { marginTop: theme.spacing.sm }]}>Ganas 2 créditos por cada minuto de enfoque real.</Text>
                </View>
            </View>



            {/* Claimable reinforcement cards (only show if not already completed today) */}
            {claimableActions.map(act => {
                const todayStr = currentDate;
                const todayLog = (dailyLogs || {})[todayStr] || {};
                if (todayLog[act.field as keyof typeof todayLog]) return null;

                // compute displayed amount using today's plan mode (mirror handleClaim)
                const plan = (dailyPlans && dailyPlans[todayStr]) || null;
                const modo: any = plan?.modo || 'estandar';
                const multipliers: Record<string, number> = { minimo: 0.5, estandar: 1, intenso: 1.5 };
                const mult = multipliers[modo] || 1;
                const amount = Math.round(act.base * mult);
                return (
                    <TouchableOpacity key={act.id} disabled={claiming[act.id]} style={styles.card} onPress={() => handleClaim(act)}>
                        <View style={styles.cardLeft}>
                            <View style={styles.iconWrap}>
                                {act.id === 'train' && <Dumbbell color={theme.colors.primary} size={20} />}
                                {(act.id === 'read' || act.id === 'study') && <BookOpen color={theme.colors.primary} size={20} />}
                                {act.id === 'sugar' && <CheckCircle2 color={theme.colors.primary} size={20} />}
                            </View>
                        </View>
                        <View style={styles.cardCenter}>
                            <Text style={styles.cardTitle}>{act.title}</Text>
                            <Text style={styles.cardDesc}>Pulsa para registrar y ganar créditos hoy.</Text>
                        </View>
                        <View style={styles.cardRight}>
                            <Text style={styles.creditPlus}>+{amount}</Text>
                        </View>
                    </TouchableOpacity>
                );
            })}

            <Text style={styles.note}>Tip: los montos cambian cada día para mantener motivación. Canjea en la Tienda cuando tengas suficientes créditos.</Text>

            <TouchableOpacity style={{ marginTop: 24, padding: 14, backgroundColor: '#FFE6E6', borderRadius: 8, alignItems: 'center' }} onPress={() => {
                forceResetDay();
                showSnack('Reinicio forzado: ¡Hola Nuevo Día!');
            }}>
                <Text style={{ color: '#D32F2F', fontWeight: 'bold' }}>⚠️ Forzar Nuevo Día (Bug Fix)</Text>
            </TouchableOpacity>

            {snackMsg && (
                <Animated.View style={[styles.snack, { transform: [{ translateY: anim }] }]}>
                    <Text style={styles.snackText}>{snackMsg}</Text>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: theme.spacing.lg, backgroundColor: theme.colors.background },
    header: { ...theme.typography.h2, color: theme.colors.text, marginBottom: theme.spacing.sm },
    sub: { ...theme.typography.body, color: theme.colors.textLight, marginBottom: theme.spacing.md },
    card: { backgroundColor: theme.colors.surface, flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.md },
    cardLeft: { width: 48, alignItems: 'center' },
    iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF7F5', alignItems: 'center', justifyContent: 'center' },
    cardCenter: { flex: 1, paddingLeft: theme.spacing.md },
    cardTitle: { ...theme.typography.body, color: theme.colors.text, fontWeight: '600' },
    cardDesc: { ...theme.typography.caption, color: theme.colors.textLight, marginTop: 4 },
    cardRight: { alignItems: 'flex-end' },
    creditPlus: { color: theme.colors.success, fontWeight: '700' },
    note: { marginTop: theme.spacing.md, ...theme.typography.caption, color: theme.colors.textLight }
    ,
    snack: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 24,
        backgroundColor: '#111827',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 6,
    },
    snackText: { color: '#FFFFFF', textAlign: 'center', ...theme.typography.body }
    ,
    topCard: {
        backgroundColor: '#FFF9EE',
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    topLeft: { width: 36, alignItems: 'center', justifyContent: 'center' },
    topCenter: { flex: 1, paddingHorizontal: theme.spacing.sm },
    topTitle: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: '700', marginBottom: 6 },
    topInput: { backgroundColor: '#FFFFFF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: theme.borderRadius.sm, borderWidth: 1, borderColor: '#F0E2C6' },
    addButton: { backgroundColor: '#F59E0B', paddingVertical: 10, paddingHorizontal: 14, borderRadius: theme.borderRadius.sm, marginLeft: theme.spacing.sm },
    addButtonText: { color: '#ffffff', fontWeight: '700' }
    ,
    timerIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
    timerText: { fontSize: 36, fontWeight: '800', marginRight: theme.spacing.md, marginLeft: theme.spacing.sm, color: theme.colors.text },
    focusBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: theme.borderRadius.md },
    focusBtnStart: { backgroundColor: theme.colors.primary, marginLeft: 'auto' },
    focusBtnStop: { backgroundColor: theme.colors.error, marginLeft: 'auto' },
    focusBtnText: { color: '#FFF', fontWeight: '700' },
    caption: { ...theme.typography.caption, color: theme.colors.textLight }
});
