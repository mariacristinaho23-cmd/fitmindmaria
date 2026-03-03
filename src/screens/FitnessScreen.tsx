import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image, Modal, Pressable } from 'react-native';
import { theme } from '../styles/theme';
import { useStore, ExerciseLibraryItem } from '../store/useStore';
import { createWorkout, createWorkoutFull, updateWorkoutFull, deleteWorkoutFull, fetchExercises, saveExercise, deleteExercise as deleteExerciseDb } from '../lib/workouts';
import { Plus, Check, Camera, Dumbbell, X, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function FitnessScreen() {
    const { workoutHistory, addWorkoutSession, updateWorkoutSession, removeWorkoutSession, weightLogs, addWeightLog, updateDailyLog, exerciseLibrary, setExerciseLibrary, addExerciseToLibrary, updateExerciseInLibrary, removeExerciseFromLibrary, dailyLogs, dailyPlans } = useStore();

    const [activeTab, setActiveTab] = useState<'hoy' | 'biblioteca'>('hoy');

    

    // Weight State
    const [currentWeight, setCurrentWeight] = useState('');

    // Biblioteca State
    const [libName, setLibName] = useState('');
    const [libMuscle, setLibMuscle] = useState('');
    const [libImage, setLibImage] = useState<string | null>(null);
    const [editingExercise, setEditingExercise] = useState<ExerciseLibraryItem | null>(null);

    

    useEffect(() => {
        if (activeTab === 'biblioteca') {
            loadExercisesFromDb();
        }
    }, [activeTab]);

    const loadExercisesFromDb = async () => {
        const { data, error } = await fetchExercises();
        if (data && !error) {
            setExerciseLibrary(data.map(ex => ({
                id: ex.id,
                name: ex.name,
                muscleGroup: ex.muscleGroup,
                notes: ex.notes || undefined,
                equipment: ex.equipment || undefined,
                imageUri: ex.imageUri || undefined
            })));
        }
    };

    

    const handleLogWeight = () => {
        if (!currentWeight) {
            Alert.alert("Faltan datos", "Ingresa tu peso.");
            return;
        }
        addWeightLog({
            date: new Date().toISOString().split('T')[0],
            weight: parseFloat(currentWeight)
        });
        setCurrentWeight('');
        Alert.alert("Guardado", "Peso registrado.");
    };

    const handlePickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            let finalUri = asset.uri;

            if (asset.base64) {
                // Determine mime type from uri or default to jpeg
                const mimeType = finalUri?.endsWith('.png') ? 'image/png' : 'image/jpeg';
                finalUri = `data:${mimeType};base64,${asset.base64}`;
            } else if (finalUri.startsWith('blob:')) {
                try {
                    const response = await fetch(finalUri);
                    const blob = await response.blob();
                    finalUri = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                } catch (e) {
                    console.error("Error converting blob", e);
                }
            }

            setLibImage(finalUri);
        }
    };

    const handleSaveLibraryDb = async () => {
        if (!libName || !libMuscle) {
            Alert.alert("Faltan datos", "Completa nombre y grupo muscular.");
            return;
        }

        console.log("Saving Exercise to Db:", { libName, libMuscle, libImage, editingExerciseId: editingExercise?.id });

        const exerciseData = {
            id: editingExercise?.id,
            name: libName,
            muscleGroup: libMuscle,
            imageUri: libImage || undefined
        };

        const { error } = await saveExercise(exerciseData);

        if (error) {
            Alert.alert("Error", (error as any)?.message || JSON.stringify(error));
            return;
        }

        Alert.alert(editingExercise ? "Actualizado" : "Guardado", "Ejercicio guardado en la biblioteca.");

        // Refresh the list from the cloud
        await loadExercisesFromDb();

        setEditingExercise(null);
        setLibName(''); setLibMuscle(''); setLibImage(null);
    };

    const handleEditExercise = (ex: ExerciseLibraryItem) => {
        setEditingExercise(ex);
        setLibName(ex.name);
        setLibMuscle(ex.muscleGroup);
        // Ensure imageUri is properly set in the state
        setLibImage(ex.imageUri || null);
    };

    const handleCancelEdit = () => {
        setEditingExercise(null);
        setLibName(''); setLibMuscle(''); setLibImage(null);
    };

    const handleDeleteExercise = () => {
        if (!editingExercise) return;
        Alert.alert(
            "Eliminar Ejercicio",
            `¿Estás seguro que deseas eliminar "${editingExercise.name}" de tu biblioteca?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        const { error } = await deleteExerciseDb(editingExercise.id);
                        if (error) {
                            Alert.alert('Error', 'No se pudo eliminar el ejercicio.');
                        } else {
                            await loadExercisesFromDb();
                            setEditingExercise(null);
                            setLibName(''); setLibMuscle(''); setLibImage(null);
                            Alert.alert("Eliminado", "El ejercicio ha sido borrado.");
                        }
                    }
                }
            ]
        );
    };

    // Today's session helpers (Registro de Entrenamiento Diario)
    const [todaysExercises, setTodaysExercises] = useState<{ exerciseId: string; name: string; weight: string; reps: string; sets: string }[]>([]);
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [showMuscleModal, setShowMuscleModal] = useState(false);
    const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [sessionToView, setSessionToView] = useState<any>(null);

    const handleAddExerciseToToday = (ex: ExerciseLibraryItem) => {
        if (todaysExercises.find(e => e.exerciseId === ex.id)) return;
        setTodaysExercises([...todaysExercises, { exerciseId: ex.id, name: ex.name, weight: '', reps: '', sets: '' }]);
    };

    const handleUpdateTodayExercise = (exerciseId: string, field: 'weight' | 'reps' | 'sets', value: string) => {
        setTodaysExercises(todaysExercises.map(e => e.exerciseId === exerciseId ? { ...e, [field]: value } : e));
    };

    const handleRemoveTodayExercise = (exerciseId: string) => {
        setTodaysExercises(todaysExercises.filter(e => e.exerciseId !== exerciseId));
    };

    // Session modal view handlers
    const closeSessionModal = () => {
        setShowSessionModal(false);
        setSessionToView(null);
    };

    const handleSaveTodaysSession = async () => {
        if (todaysExercises.length === 0) {
            Alert.alert('Nada para guardar', 'Agrega al menos un ejercicio para registrar el entrenamiento de hoy.');
            return;
        }

        const validExs = todaysExercises.map(e => ({ exerciseId: e.exerciseId, weight: parseFloat(e.weight) || 0, reps: parseInt(e.reps) || 0, sets: parseInt(e.sets) || 0 }));
        const todayStr = new Date().toISOString().split('T')[0];

        let localId: string | null = null;

        if (editingSessionId) {
            // update local
            updateWorkoutSession({ id: editingSessionId, date: todayStr, routineName: 'Entrenamiento de Hoy', durationMinutes: 0, exercises: validExs });
            localId = editingSessionId;
        } else {
            addWorkoutSession({ date: todayStr, routineName: 'Entrenamiento de Hoy', durationMinutes: 0, exercises: validExs });
            localId = (Date.now()).toString(); // best-effort placeholder; the store's addWorkoutSession generates its own id
        }

        // Determine if we are marking trained for the first time (avoid duplicate messaging)
        const wasTrained = !!dailyLogs?.[todayStr]?.trained;

        updateDailyLog(todayStr, { trained: true });

        // Compute expected credit amount (mirror logic from store:updateDailyLog) for user feedback
        if (!wasTrained) {
            try {
                const plan = (dailyPlans && dailyPlans[todayStr]) || null;
                const modo: any = plan?.modo || 'estandar';
                const multipliers: Record<string, number> = { minimo: 0.5, estandar: 1, intenso: 1.5 };
                const mult = multipliers[modo] || 1;
                const baseTrained = 150;
                const amount = Math.round(baseTrained * mult);
                Alert.alert('Guardado', `Entrenamiento del día guardado en historial. +${amount} créditos`);
            } catch (e) {
                Alert.alert('Guardado', 'Entrenamiento del día guardado en historial.');
            }
        } else {
            Alert.alert('Guardado', 'Entrenamiento del día actualizado en historial.');
        }

        // Try syncing exercises and workout to Supabase
        try {
            // If editing a session that has a remoteId, use it
            let remoteId: string | undefined;
            if (editingSessionId) {
                const localSession = (workoutHistory || []).find(w => w.id === editingSessionId);
                remoteId = localSession?.remoteId;
            }

            if (remoteId) {
                await updateWorkoutFull(remoteId, todayStr, 'Entrenamiento de Hoy', 0, validExs);
            } else {
                const res = await createWorkoutFull(todayStr, 'Entrenamiento de Hoy', 0, validExs);
                if (res && res.data && res.data.id) {
                    // update local session to store remoteId
                    const createdRemoteId = res.data.id;
                    // find the recently added local session by date/name — prefer editingSessionId if present
                    const targetLocal = editingSessionId ? (workoutHistory || []).find(w => w.id === editingSessionId) : (workoutHistory || []).find(w => w.date === todayStr && w.routineName === 'Entrenamiento de Hoy');
                    if (targetLocal) {
                        updateWorkoutSession({ ...targetLocal, remoteId: createdRemoteId });
                    }
                }
            }
        } catch (err) {
            console.error('Error syncing workout full:', err);
        }

        setTodaysExercises([]);
        setEditingSessionId(null);
        Alert.alert('Guardado', 'Entrenamiento del día guardado en historial.');
    };

    const openSessionModal = (session: any) => {
        setSessionToView(session);
        setShowSessionModal(true);
    };

    const handleDeleteSession = (sessionId: string) => {
        Alert.alert('Eliminar sesión', '¿Deseas eliminar esta sesión?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: async () => {
                const s = (workoutHistory || []).find(w => w.id === sessionId);
                if (s?.remoteId) {
                    try {
                        await deleteWorkoutFull(s.remoteId);
                    } catch (e) {
                        console.error('Error deleting remote workout:', e);
                    }
                }
                removeWorkoutSession(sessionId);
                if (sessionToView?.id === sessionId) {
                    setSessionToView(null);
                    setShowSessionModal(false);
                }
            } }
        ]);
    };

    

    const getRecentHistoryForLibraryEx = (exId: string) => {
        for (let w of workoutHistory) {
            if (w.exercises) {
                let found = w.exercises.find(e => e.exerciseId === exId);
                if (found) {
                    return { date: w.date, ...found };
                }
            }
        }
        return null;
    };

    return (
        <View style={styles.container}>
            <View style={styles.tabsRow}>
                <TouchableOpacity onPress={() => setActiveTab('hoy')} style={[styles.tabBtn, activeTab === 'hoy' && styles.tabBtnActive]}>
                    <Dumbbell size={20} color={activeTab === 'hoy' ? theme.colors.primary : theme.colors.textLight} />
                    <Text style={[styles.tabBtnText, activeTab === 'hoy' && styles.tabBtnTextActive]}>Entrenamiento de Hoy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('biblioteca')} style={[styles.tabBtn, activeTab === 'biblioteca' && styles.tabBtnActive]}>
                    <Plus size={20} color={activeTab === 'biblioteca' ? theme.colors.primary : theme.colors.textLight} />
                    <Text style={[styles.tabBtnText, activeTab === 'biblioteca' && styles.tabBtnTextActive]}>Biblioteca</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {activeTab === 'hoy' && (
                    <>
                        {/* Weight Tracking */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Seguimiento de Peso</Text>
                            <View style={styles.row}>
                                <TextInput
                                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                    placeholder="Peso en kg (ej. 65.5)"
                                    keyboardType="numeric"
                                    value={currentWeight}
                                    onChangeText={setCurrentWeight}
                                />
                                <TouchableOpacity style={styles.smallBtn} onPress={handleLogWeight}>
                                    <Text style={styles.smallBtnText}>Guardar</Text>
                                </TouchableOpacity>
                            </View>
                            {weightLogs.length > 0 && (
                                <Text style={styles.subtext}>Último registro: {weightLogs[0].weight} kg ({weightLogs[0].date})</Text>
                            )}
                        </View>

                        {/* Historial Reciente: editar / eliminar sesiones */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Historial Reciente</Text>
                            {(workoutHistory || []).slice(0, 7).map(w => (
                                <View key={w.id} style={[styles.historyItem, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                                    <TouchableOpacity style={{ flex: 1 }} onPress={() => openSessionModal(w)}>
                                        <Text style={styles.historyDate}>{w.date}</Text>
                                        <Text style={styles.historyText}>{w.routineName} — {w.exercises ? w.exercises.length + ' ejercicios' : ''}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.smallOutlineBtn, { borderColor: theme.colors.error }]} onPress={() => handleDeleteSession(w.id)}>
                                        <Text style={[styles.outlineBtnText, { color: theme.colors.error }]}>Eliminar</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {(workoutHistory || []).length === 0 && <Text style={styles.subtext}>Aún no hay entrenamientos registrados.</Text>}
                        </View>
                        {/* Entrenamiento de Hoy */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Entrenamiento de Hoy</Text>

                                <Text style={[styles.label, { marginBottom: 8 }]}>Seleccionar por grupo muscular:</Text>
                                {(exerciseLibrary || []).length === 0 && (
                                    <Text style={styles.subtext}>Agrega ejercicios en la Biblioteca primero.</Text>
                                )}

                                <View style={{ marginBottom: 12 }}>
                                    <TouchableOpacity style={styles.outlineBtn} onPress={() => setShowMuscleModal(true)}>
                                        <Text style={styles.outlineBtnText}>{selectedMuscle ? `Grupo: ${selectedMuscle}` : 'Seleccionar Grupo Muscular'}</Text>
                                    </TouchableOpacity>

                                    <Modal visible={showMuscleModal} animationType='slide' transparent={true}>
                                        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' }}>
                                            <View style={{ backgroundColor: theme.colors.surface, margin: 20, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, maxHeight: '70%' }}>
                                                <Text style={[styles.cardTitle, { marginBottom: 8 }]}>Seleccionar Grupo</Text>
                                                <ScrollView>
                                                    {Array.from(new Set((exerciseLibrary || []).map(e => (e.muscleGroup || 'Otros').trim()))).map(group => (
                                                        <Pressable key={group} onPress={() => { setSelectedMuscle(group); setShowMuscleModal(false); }} style={{ paddingVertical: 12 }}>
                                                            <Text style={[styles.label, { color: theme.colors.text }]}>{group || 'Otros'}</Text>
                                                        </Pressable>
                                                    ))}
                                                </ScrollView>
                                                <TouchableOpacity style={[styles.outlineBtn, { marginTop: theme.spacing.md }]} onPress={() => { setSelectedMuscle(null); setShowMuscleModal(false); }}>
                                                    <Text style={styles.outlineBtnText}>Cancelar</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </Modal>

                                    {/* List exercises for selected muscle */}
                                    {selectedMuscle && (
                                    <View style={{ marginTop: 8 }}>
                                        {(exerciseLibrary || []).filter(ex => ((ex.muscleGroup || 'Otros').trim() === selectedMuscle)).map(ex => (
                                            <View key={ex.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                                                <Text style={{ flex: 1, paddingRight: 12, ...styles.libName }}>{ex.name}</Text>
                                                <TouchableOpacity style={styles.smallOutlineBtn} onPress={() => handleAddExerciseToToday(ex)}>
                                                    <Text style={styles.outlineBtnText}>Agregar</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                )}
                                </View>

                            {todaysExercises.length > 0 && (
                                <View style={{ marginTop: 8 }}>
                                    {todaysExercises.map(ex => (
                                        <View key={ex.exerciseId} style={[styles.advExRow, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                                            <Text style={{ flex: 1, ...styles.advExName }}>{ex.name}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <TextInput value={ex.weight} onChangeText={v => handleUpdateTodayExercise(ex.exerciseId, 'weight', v)} placeholder='Peso' keyboardType='numeric' style={[styles.smallInput, { width: 80 }]} />
                                                <TextInput value={ex.sets} onChangeText={v => handleUpdateTodayExercise(ex.exerciseId, 'sets', v)} placeholder='Series' keyboardType='numeric' style={[styles.smallInput, { width: 70, marginLeft: 8 }]} />
                                                <TextInput value={ex.reps} onChangeText={v => handleUpdateTodayExercise(ex.exerciseId, 'reps', v)} placeholder='Reps' keyboardType='numeric' style={[styles.smallInput, { width: 70, marginLeft: 8 }]} />
                                                <TouchableOpacity onPress={() => handleRemoveTodayExercise(ex.exerciseId)} style={{ marginLeft: 8 }}>
                                                    <Trash2 color={theme.colors.error} size={18} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}

                                    {editingSessionId && (
                                        <Text style={[styles.subtext, { marginBottom: 8, color: theme.colors.primary }]}>Editando sesión guardada</Text>
                                    )}
                                    <TouchableOpacity style={[styles.submitBtn, { marginTop: 12 }]} onPress={handleSaveTodaysSession}>
                                        <Text style={styles.submitBtnText}>{editingSessionId ? 'Guardar Cambios' : 'Guardar Entrenamiento del Día'}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </>
                )}

                {/* Session viewer modal */}
                <Modal visible={showSessionModal} animationType='slide' transparent={true}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' }}>
                        <View style={{ backgroundColor: theme.colors.surface, margin: 20, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, maxHeight: '80%' }}>
                            <Text style={styles.cardTitle}>Detalle de Sesión</Text>
                            <Text style={styles.subtext}>{sessionToView?.date} — {sessionToView?.routineName}</Text>
                            <ScrollView style={{ marginTop: 12 }}>
                                {(sessionToView?.exercises || []).map((e: any, i: number) => (
                                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                                        <Text style={{ flex: 1 }}>{(exerciseLibrary || []).find(x => x.id === e.exerciseId)?.name || e.exerciseId}</Text>
                                        <Text style={{ marginLeft: 12 }}>{e.sets}x{e.reps} @ {e.weight}kg</Text>
                                    </View>
                                ))}
                            </ScrollView>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.md }}>
                                <TouchableOpacity style={styles.outlineBtn} onPress={closeSessionModal}><Text style={styles.outlineBtnText}>Cerrar</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.outlineBtn, { borderColor: theme.colors.error }]} onPress={() => handleDeleteSession(sessionToView?.id)}><Text style={[styles.outlineBtnText, { color: theme.colors.error }]}>Eliminar</Text></TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {activeTab === 'biblioteca' && (
                    <>
                        <View style={styles.card}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
                                <Text style={[styles.cardTitle, { marginBottom: 0 }]}>
                                    {editingExercise ? 'Editar Ejercicio' : 'Agregar Ejercicio a la Biblioteca'}
                                </Text>
                                {editingExercise && (
                                    <TouchableOpacity onPress={handleCancelEdit}>
                                        <X color={theme.colors.textLight} size={24} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder="Nombre del Ejercicio (ej. Press Militar)"
                                value={libName}
                                onChangeText={setLibName}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Grupo Muscular (ej. Hombros)"
                                value={libMuscle}
                                onChangeText={setLibMuscle}
                            />

                            <TouchableOpacity style={styles.outlineBtn} onPress={handlePickImage}>
                                <Camera color={theme.colors.primary} size={20} />
                                <Text style={styles.outlineBtnText}>{libImage ? "Cambiar Imagen" : "Elegir Imagen de Galería"}</Text>
                            </TouchableOpacity>
                            {libImage && (
                                <Image source={{ uri: libImage }} style={styles.previewImage} />
                            )}

                            <TouchableOpacity style={styles.submitBtn} onPress={handleSaveLibraryDb}>
                                <Text style={styles.submitBtnText}>{editingExercise ? 'Guardar Cambios' : 'Guardar en Biblioteca'}</Text>
                            </TouchableOpacity>

                            {editingExercise && (
                                <TouchableOpacity style={[styles.outlineBtn, { borderColor: theme.colors.error, marginTop: theme.spacing.md }]} onPress={handleDeleteExercise}>
                                    <Trash2 color={theme.colors.error} size={20} />
                                    <Text style={[styles.outlineBtnText, { color: theme.colors.error }]}>Eliminar Ejercicio</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {!editingExercise && (
                            <>
                                <Text style={[styles.cardTitle, { marginVertical: 10, marginLeft: 5 }]}>Mi Biblioteca ({exerciseLibrary?.length || 0})</Text>
                                <Text style={[styles.subtext, { marginLeft: 5, marginBottom: 10 }]}>Toca un ejercicio para ver sus detalles o editarlo.</Text>

                                {(() => {
                                    const grouped = (exerciseLibrary || []).reduce((acc: Record<string, ExerciseLibraryItem[]>, ex) => {
                                        const group = ex.muscleGroup ? ex.muscleGroup.trim().toUpperCase() : 'OTROS';
                                        if (!acc[group]) acc[group] = [];
                                        acc[group].push(ex);
                                        return acc;
                                    }, {});

                                    return Object.keys(grouped).sort().map(muscle => (
                                        <View key={muscle} style={{ marginBottom: theme.spacing.md }}>
                                            <Text style={styles.muscleGroupTitle}>{muscle}</Text>
                                            {grouped[muscle].map(ex => {
                                                const recent = getRecentHistoryForLibraryEx(ex.id);
                                                return (
                                                    <TouchableOpacity key={ex.id} style={styles.libraryCard} onPress={() => handleEditExercise(ex)}>
                                                        {ex.imageUri ? <Image source={{ uri: ex.imageUri }} style={styles.libThumb} /> : <View style={styles.libThumb} />}
                                                        <View style={styles.libInfo}>
                                                            <Text style={styles.libName}>{ex.name}</Text>
                                                            {/* Hiding muscle name here since it's the section header now */}
                                                            {recent ? (
                                                                <Text style={styles.libRecent}>
                                                                    Última vez: {recent.weight}kg | {recent.sets}x{recent.reps} ({recent.date})
                                                                </Text>
                                                            ) : (
                                                                <Text style={styles.libRecent}>Sin historial registrado.</Text>
                                                            )}
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    ));
                                })()}
                            </>
                        )}
                    </>
                )}

                

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    tabsRow: { flexDirection: 'row', backgroundColor: theme.colors.surface, paddingTop: 50, paddingBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, elevation: 2, zIndex: 10 },
    tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabBtnActive: { borderBottomColor: theme.colors.primary },
    tabBtnText: { ...theme.typography.caption, color: theme.colors.textLight, marginTop: 4, fontWeight: '600' },
    tabBtnTextActive: { color: theme.colors.primary },
    content: { padding: theme.spacing.lg },
    card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg, marginBottom: theme.spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: theme.spacing.md },
    label: { ...theme.typography.body, fontWeight: '600', color: theme.colors.text, marginBottom: theme.spacing.xs },
    input: { backgroundColor: '#F5F5F5', borderRadius: theme.borderRadius.sm, padding: theme.spacing.md, color: theme.colors.text, marginBottom: theme.spacing.md },
    row: { flexDirection: 'row', alignItems: 'center' },
    smallBtn: { backgroundColor: theme.colors.primary, padding: theme.spacing.md, borderRadius: theme.borderRadius.sm, marginLeft: theme.spacing.sm },
    smallBtnText: { ...theme.typography.body, fontWeight: '600', color: theme.colors.surface },
    subtext: { ...theme.typography.caption, color: theme.colors.textLight, marginTop: theme.spacing.sm },
    submitBtn: { backgroundColor: theme.colors.primary, padding: theme.spacing.md, borderRadius: theme.borderRadius.sm, alignItems: 'center', marginTop: theme.spacing.sm },
    submitBtnText: { ...theme.typography.body, fontWeight: '700', color: theme.colors.surface },
    outlineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: theme.borderRadius.sm, marginBottom: theme.spacing.sm },
    outlineBtnText: { ...theme.typography.body, color: theme.colors.primary, marginLeft: theme.spacing.xs },
    exerciseForm: { backgroundColor: '#FAFAFA', padding: theme.spacing.sm, borderRadius: theme.borderRadius.sm, marginBottom: theme.spacing.md },
    tempList: { marginBottom: theme.spacing.md, padding: theme.spacing.sm, backgroundColor: '#F0F8FF', borderRadius: theme.borderRadius.sm },
    historyItem: { marginBottom: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', paddingBottom: theme.spacing.sm },
    historyDate: { ...theme.typography.caption, color: theme.colors.textLight },
    historyText: { ...theme.typography.body, color: theme.colors.text, marginTop: 4 },
    routineScroll: { marginBottom: theme.spacing.md },
    routineChip: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, backgroundColor: '#F5F5F5', borderRadius: theme.borderRadius.full, marginRight: theme.spacing.sm },
    routineChipActive: { backgroundColor: theme.colors.accent },
    routineChipText: { ...theme.typography.body, color: theme.colors.text },
    routineChipTextActive: { color: theme.colors.surface, fontWeight: '600' },
    previewImage: { width: '100%', height: 200, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.sm, resizeMode: 'cover' },
    libraryCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.sm, marginBottom: theme.spacing.md, flexDirection: 'row', padding: theme.spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1 },
    libThumb: { width: 60, height: 60, borderRadius: theme.borderRadius.sm, marginRight: theme.spacing.md, backgroundColor: '#eee' },
    libInfo: { flex: 1, justifyContent: 'center' },
    libName: { ...theme.typography.h2, color: theme.colors.text },
    libMuscle: { ...theme.typography.caption, color: theme.colors.accent, fontWeight: '600', marginTop: 2 },
    libRecent: { ...theme.typography.caption, color: theme.colors.textLight, marginTop: 4 },
    muscleGroupTitle: { ...theme.typography.body, fontWeight: '700', color: theme.colors.primary, marginLeft: 5, marginBottom: theme.spacing.sm, letterSpacing: 1 },
    libraryChip: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, backgroundColor: '#F5F5F5', borderRadius: theme.borderRadius.full, marginRight: theme.spacing.sm, borderWidth: 1, borderColor: 'transparent' },
    libraryChipActive: { borderColor: theme.colors.primary, backgroundColor: '#F0F8FF' },
    libraryChipText: { ...theme.typography.body, color: theme.colors.text },
    libraryChipTextActive: { color: theme.colors.primary, fontWeight: '600' },
    advFormList: { backgroundColor: '#FAFAFA', padding: theme.spacing.sm, borderRadius: theme.borderRadius.sm, marginBottom: theme.spacing.md },
    advExRow: { marginBottom: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: theme.spacing.sm },
    advExName: { ...theme.typography.body, fontWeight: '600', color: theme.colors.text, marginBottom: 5 },
    advExInputs: { flexDirection: 'row', justifyContent: 'space-between' },
    smallInput: { backgroundColor: theme.colors.surface, borderRadius: 4, borderWidth: 1, borderColor: '#DDD', padding: 10, width: '30%', textAlign: 'center' }
    ,
    smallOutlineBtn: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: theme.borderRadius.sm }
});
