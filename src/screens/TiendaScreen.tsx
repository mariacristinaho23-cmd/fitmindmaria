import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { theme } from '../styles/theme';
import { useStore } from '../store/useStore';

const CATALOG = [
    { id: 'coffee', title: 'Café especial', cost: 200 },
    { id: 'movie', title: 'Noche de película', cost: 500 },
    { id: 'book', title: 'Libro nuevo', cost: 800 },
];

export default function TiendaScreen() {
    const { creditosDisponibles, canjearRecompensa } = useStore();
    const { customRewards, addCustomReward, removeCustomReward, redeemReward, redemptionHistory } = useStore();

    const [title, setTitle] = useState('');
    const [cost, setCost] = useState('');

    const handleBuy = (item: { title: string; cost: number }) => {
        const ok = redeemReward(item);
        if (ok) {
            Alert.alert('Compra realizada', `Has canjeado ${item.cost} créditos por ${item.title}`);
        } else {
            Alert.alert('Créditos insuficientes', `Necesitas ${item.cost} créditos para comprar ${item.title}`);
        }
    };

    const handleAddCustom = () => {
        const c = parseInt(cost || '0', 10);
        if (!title || !c || c <= 0) return Alert.alert('Datos inválidos', 'Introduce nombre y precio válidos');
        addCustomReward({ title, cost: c });
        setTitle(''); setCost('');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Mercado de Recompensas</Text>
            <Text style={styles.sub}>Créditos disponibles: {creditosDisponibles}</Text>
            <FlatList
                data={CATALOG}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        <Text style={styles.title}>{item.title}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.cost}>{item.cost} ✨</Text>
                            <TouchableOpacity style={styles.buyBtn} onPress={() => handleBuy(item)}>
                                <Text style={styles.buyText}>Canjear</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            <View style={{ height: 1, backgroundColor: '#EEE', marginVertical: theme.spacing.md }} />

            <Text style={[styles.sub, { marginBottom: theme.spacing.sm }]}>Recompensas Personalizadas</Text>
            <View style={{ flexDirection: 'row', marginBottom: theme.spacing.sm }}>
                <TextInput placeholder='Nombre de la recompensa' value={title} onChangeText={setTitle} style={styles.input} />
                <TextInput placeholder='Precio' value={cost} onChangeText={setCost} style={[styles.input, { width: 100, marginLeft: theme.spacing.sm }]} keyboardType='numeric' />
                <TouchableOpacity style={[styles.buyBtn, { marginLeft: theme.spacing.sm }]} onPress={handleAddCustom}><Text style={styles.buyText}>Añadir</Text></TouchableOpacity>
            </View>

            {(customRewards || []).map(r => (
                <View key={r.id} style={styles.item}>
                    <Text style={styles.title}>{r.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.cost}>{r.cost} ✨</Text>
                        <TouchableOpacity style={styles.buyBtn} onPress={() => handleBuy(r)}>
                            <Text style={styles.buyText}>Canjear</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ marginLeft: theme.spacing.sm }} onPress={() => removeCustomReward(r.id)}>
                            <Text style={{ color: theme.colors.error }}>Eliminar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}

            <View style={{ height: 1, backgroundColor: '#EEE', marginVertical: theme.spacing.md }} />

            <Text style={[styles.sub, { marginBottom: theme.spacing.sm }]}>Historial de Canjes</Text>
            {(redemptionHistory || []).length === 0 ? (
                <Text style={styles.planText}>Aún no has canjeado nada.</Text>
            ) : (
                (redemptionHistory || []).map(h => (
                    <View key={h.id} style={styles.item}>
                        <Text style={styles.title}>{h.title}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.cost}>{h.cost} ✨</Text>
                            <Text style={[styles.planText, { marginLeft: theme.spacing.sm, color: theme.colors.textLight }]}>{new Date(h.date).toLocaleString()}</Text>
                        </View>
                    </View>
                ))
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: theme.spacing.lg, backgroundColor: theme.colors.background },
    header: { ...theme.typography.h2, color: theme.colors.text, marginBottom: theme.spacing.sm },
    sub: { ...theme.typography.body, color: theme.colors.textLight, marginBottom: theme.spacing.md },
    item: { backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: theme.borderRadius.sm, marginBottom: theme.spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { ...theme.typography.body, color: theme.colors.text },
    cost: { ...theme.typography.caption, color: theme.colors.textLight, marginRight: theme.spacing.sm },
    buyBtn: { backgroundColor: theme.colors.primary, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.borderRadius.sm },
    buyText: { color: theme.colors.surface }
    ,
    input: { flex: 1, backgroundColor: '#FFF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: theme.borderRadius.sm, borderWidth: 1, borderColor: '#EEE' },
    planText: { ...theme.typography.body, color: theme.colors.text }
});
