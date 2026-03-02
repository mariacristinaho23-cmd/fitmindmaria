import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';
import { BookOpen, ShieldAlert, Sparkles, Brain } from 'lucide-react-native';

const libraryData = [
    {
        id: '1',
        title: 'Estrategias Anti-Antojos',
        icon: <ShieldAlert color={theme.colors.primary} size={24} />,
        content: [
            '1. Beber un vaso grande de agua y esperar 10 minutos.',
            '2. Cambiar de ambiente inmediatamente (ej. salir a caminar).',
            '3. Recordar tu "Por qué": La claridad mental es más importante que el sabor momentáneo.',
            '4. Comer una manzana si es hambre real. Si no quieres la manzana, no es hambre.',
        ]
    },
    {
        id: '2',
        title: 'Protocolos de Acción (Urgencia)',
        icon: <Brain color={theme.colors.secondary} size={24} />,
        content: [
            'Si siento ansiedad: 5 minutos de respiración profunda (caja 4-4-4-4).',
            'Si siento desmotivación: Leer la lista de victorias recientes en la pantalla de Progreso.',
            'Si quiero saltar el estudio: Hacer solo 5 minutos. Generalmente el momentum continúa.',
        ]
    },
    {
        id: '3',
        title: 'Mantras y Afirmaciones',
        icon: <Sparkles color={theme.colors.primary} size={24} />,
        content: [
            '"Soy una persona que cumple sus promesas a sí misma."',
            '"La incomodidad es el precio de entrada para el crecimiento."',
            '"Elijó la disciplina sobre el arrepentimiento."',
            '"Cada vez que digo no a un impulso, mi fuerza de voluntad crece."'
        ]
    },
    {
        id: '4',
        title: 'Notas Personales y Filosofía',
        icon: <BookOpen color={theme.colors.secondary} size={24} />,
        content: [
            'Identidad: Ya no soy alguien que está "intentando" dejar el azúcar. Soy una persona libre de azúcar.',
            'El conocimiento técnico de Python y el dominio del Inglés son las llaves para mi siguiente nivel profesional.',
            'El entrenamiento no es un castigo, es una celebración de lo que mi cuerpo puede hacer.'
        ]
    }
];

export default function BibliotecaScreen() {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.title}>Biblioteca Mental</Text>
                <Text style={styles.subtitle}>Tu arsenal de herramientas para la disciplina y el enfoque.</Text>
            </View>

            {libraryData.map((item) => (
                <View key={item.id} style={styles.card}>
                    <TouchableOpacity
                        style={styles.cardHeader}
                        onPress={() => toggleExpand(item.id)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.iconContainer}>
                            {item.icon}
                        </View>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                    </TouchableOpacity>

                    {expandedId === item.id && (
                        <View style={styles.cardContent}>
                            {item.content.map((point, index) => (
                                <Text key={index} style={styles.pointText}>{point}</Text>
                            ))}
                        </View>
                    )}
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        padding: theme.spacing.lg,
    },
    header: {
        marginBottom: theme.spacing.lg,
    },
    title: {
        ...theme.typography.h2,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        ...theme.typography.body,
        color: theme.colors.textLight,
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    iconContainer: {
        marginRight: theme.spacing.md,
    },
    cardTitle: {
        ...theme.typography.h3,
        color: theme.colors.text,
        flex: 1,
    },
    cardContent: {
        padding: theme.spacing.lg,
        paddingTop: 0,
        borderTopWidth: 1,
        borderTopColor: theme.colors.background,
    },
    pointText: {
        ...theme.typography.body,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
        lineHeight: 22,
    }
});
