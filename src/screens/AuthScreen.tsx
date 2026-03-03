// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { theme } from '../styles/theme';
import { useStore } from '../store/useStore';

export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signInWithEmail() {
        if (!email || !password) {
            Alert.alert("Error", "Por favor ingresa tu correo y contraseña.");
            return;
        }
        console.log("Intentando iniciar sesión con", email);
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error("Error en sign in:", error);
                Alert.alert('Error', error.message);
            } else {
                console.log("Sesión iniciada correctamente");
            }
        } catch (e: any) {
            console.error("Excepción en sign in:", e);
            Alert.alert("Error inesperado", e.message || "Ocurrió un error");
        } finally {
            setLoading(false);
        }
    }

    async function signUpWithEmail() {
        if (!email || !password) {
            Alert.alert("Error", "Por favor ingresa tu correo y contraseña.");
            return;
        }
        console.log("Intentando crear cuenta con", email);
        setLoading(true);
        try {
            const {
                data: { session },
                error,
            } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                console.error("Error en sign up:", error);
                Alert.alert('Error', error.message);
            } else if (!session) {
                Alert.alert('Revisa tu correo', 'Te hemos enviado un enlace para verificar tu cuenta.');
            } else {
                console.log("Cuenta creada correctamente");
            }
        } catch (e: any) {
            console.error("Excepción en sign up:", e);
            Alert.alert("Error inesperado", e.message || "Ocurrió un error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="always"
            >
                <View style={styles.header}>
                    <Text style={styles.title}>FitMind</Text>
                    <Text style={styles.subtitle}>Inicia sesión para sincronizar tus rutinas en la nube.</Text>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.label}>Correo Electrónico</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setEmail}
                        value={email}
                        placeholder="ejemplo@correo.com"
                        placeholderTextColor={theme.colors.textLight}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <Text style={styles.label}>Contraseña</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setPassword}
                        value={password}
                        secureTextEntry
                        placeholder="Mínimo 6 caracteres"
                        placeholderTextColor={theme.colors.textLight}
                        autoCapitalize="none"
                    />

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.primaryButton, loading && styles.disabledButton]}
                            disabled={loading}
                            onPress={signInWithEmail}
                        >
                            <Text style={styles.primaryButtonText}>{loading ? 'Cargando...' : 'Iniciar Sesión'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.secondaryButton, loading && styles.disabledButton]}
                            disabled={loading}
                            onPress={signUpWithEmail}
                        >
                            <Text style={styles.secondaryButtonText}>{loading ? 'Cargando...' : 'Crear Cuenta'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 48,
        fontWeight: '900',
        color: theme.colors.primary,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.text,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    formContainer: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    label: {
        ...theme.typography.h4,
        color: theme.colors.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        color: theme.colors.text,
        marginBottom: 20,
        ...theme.typography.body,
    },
    buttonContainer: {
        marginTop: 10,
    },
    primaryButton: {
        backgroundColor: theme.colors.primary,
        padding: 16,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.secondary,
        padding: 16,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: theme.colors.secondary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    disabledButton: {
        opacity: 0.5,
    }
});
