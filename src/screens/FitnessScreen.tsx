// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image, Modal, Pressable } from 'react-native';
import { theme } from '../styles/theme';
import { useStore, ExerciseLibraryItem } from '../store/useStore';
import { createWorkout, createWorkoutFull, updateWorkoutFull, fetchExercises, saveExercise, deleteExercise as deleteExerciseDb } from '../lib/workouts';
import { Plus, Check, Camera, Dumbbell, X, Trash2, List } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function FitnessScreen() {
    const { workoutHistory, addWorkoutSession, updateWorkoutSession, weightLogs, addWeightLog, updateDailyLog, exerciseLibrary, setExerciseLibrary, addExerciseToLibrary, updateExerciseInLibrary, removeExerciseFromLibrary, dailyLogs, dailyPlans, routines, addRoutine, updateRoutine, removeRoutine, currentDate } = useStore();

    const [activeTab, setActiveTab] = useState<'hoy' | 'rutinas' | 'biblioteca'>('hoy');



    // Weight State
    const [currentWeight, setCurrentWeight] = useState('');

    // Biblioteca State
    const [libName, setLibName] = useState('');
    const [libMuscle, setLibMuscle] = useState('');
    const [libImage, setLibImage] = useState<string | null>(null);
    const [editingExercise, setEditingExercise] = useState<ExerciseLibraryItem | null>(null);

    // Rutinas State
    const [showRoutineModal, setShowRoutineModal] = useState(false);
    const [routineName, setRoutineName] = useState('');
    const [routineExercises, setRoutineExercises] = useState<string[]>([]);
    const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
    const [showLoadRoutineModal, setShowLoadRoutineModal] = useState(false);



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
            date: currentDate,
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

    const handleAddExerciseToToday = (ex: ExerciseLibraryItem, defaultWeight = '', defaultReps = '', defaultSets = '') => {
        if (todaysExercises.find(e => e.exerciseId === ex.id)) return;
        setTodaysExercises(prev => [...prev, { exerciseId: ex.id, name: ex.name, weight: defaultWeight, reps: defaultReps, sets: defaultSets }]);
    };

    const handleUpdateTodayExercise = (exerciseId: string, field: 'weight' | 'reps' | 'sets', value: string) => {
        setTodaysExercises(todaysExercises.map(e => e.exerciseId === exerciseId ? { ...e, [field]: value } : e));
    };

    const handleRemoveTodayExercise = (exerciseId: string) => {
        setTodaysExercises(todaysExercises.filter(e => e.exerciseId !== exerciseId));
    };



    const handleSaveTodaysSession = async () => {
        if (todaysExercises.length === 0) {
            Alert.alert('Nada para guardar', 'Agrega al menos un ejercicio para registrar el entrenamiento de hoy.');
            return;
        }

        const validExs = todaysExercises.map(e => ({ exerciseId: e.exerciseId, weight: parseFloat(e.weight) || 0, reps: parseInt(e.reps) || 0, sets: parseInt(e.sets) || 0 }));
        const todayStr = currentDate;

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
                    <Text style={[styles.tabBtnText, activeTab === 'hoy' && styles.tabBtnTextActive]} numberOfLines={1} adjustsFontSizeToFit>Entrenamiento</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('rutinas')} style={[styles.tabBtn, activeTab === 'rutinas' && styles.tabBtnActive]}>
                    <List size={20} color={activeTab === 'rutinas' ? theme.colors.primary : theme.colors.textLight} />
                    <Text style={[styles.tabBtnText, activeTab === 'rutinas' && styles.tabBtnTextActive]}>Rutinas</Text>
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
                            {(weightLogs || []).length > 0 && (
                                <Text style={styles.subtext}>
                                    Último registro: {weightLogs[0].weight}kg ({weightLogs[0].date})</Text>
                            )}
                        </View>


                        {/* Entrenamiento de Hoy */}
                        <View style={styles.card}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                                <Text style={[styles.cardTitle, { marginBottom: 8, marginRight: 8 }]}>Entrenamiento de Hoy</Text>
                                {(routines || []).length > 0 && (
                                    <TouchableOpacity style={[styles.smallOutlineBtn, { marginBottom: 8 }]} onPress={() => setShowLoadRoutineModal(true)}>
                                        <Text style={styles.outlineBtnText}>Cargar Rutina</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <Modal visible={showLoadRoutineModal} animationType='slide' transparent={true}>
                                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' }}>
                                    <View style={{ backgroundColor: theme.colors.surface, margin: 20, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, maxHeight: '80%' }}>
                                        <Text style={[styles.cardTitle, { marginBottom: 12 }]}>Seleccionar Rutina</Text>
                                        <ScrollView>
                                            {(routines || []).map(r => (
                                                <TouchableOpacity key={r.id} style={styles.routineChip} onPress={() => {
                                                    // Load exercises
                                                    (r.exerciseIds || []).forEach(id => {
                                                        const ex = exerciseLibrary.find(e => e.id === id);
                                                        if (ex) {
                                                            const recent = getRecentHistoryForLibraryEx(id);
                                                            handleAddExerciseToToday(ex, recent ? recent.weight.toString() : '', recent ? recent.reps.toString() : '', recent ? recent.sets.toString() : '');
                                                        }
                                                    });
                                                    setShowLoadRoutineModal(false);
                                                }}>
                                                    <Text style={styles.routineChipText}>{r.name} ({(r.exerciseIds || []).length} ej.)</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                        <TouchableOpacity style={[styles.outlineBtn, { marginTop: theme.spacing.md }]} onPress={() => setShowLoadRoutineModal(false)}>
                                            <Text style={styles.outlineBtnText}>Cancelar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </Modal>

                            <Text style={[styles.label, { marginBottom: 8, marginTop: 12 }]}>Seleccionar por grupo muscular:</Text>
                            {(exerciseLibrary || []).length === 0 && (
                                <Text style={styles.subtext}>Agrega ejercicios en la Biblioteca primero.</Text>
                            )}

                            <View style={{ marginBottom: 12, paddingHorizontal: 4 }}>
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
                                <View style={{ marginTop: 8, paddingHorizontal: 4 }}>
                                    {todaysExercises.map(ex => (
                                        <View key={ex.exerciseId} style={[styles.advExRow, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                                            <Text style={{ flex: 0.8, ...styles.advExName }}>{ex.name}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <TextInput value={ex.weight} onChangeText={v => handleUpdateTodayExercise(ex.exerciseId, 'weight', v)} placeholder='Peso' keyboardType='numeric' style={[styles.smallInput, { width: 65 }]} />
                                                <TextInput value={ex.sets} onChangeText={v => handleUpdateTodayExercise(ex.exerciseId, 'sets', v)} placeholder='Series' keyboardType='numeric' style={[styles.smallInput, { width: 60, marginLeft: 6 }]} />
                                                <TextInput value={ex.reps} onChangeText={v => handleUpdateTodayExercise(ex.exerciseId, 'reps', v)} placeholder='Reps' keyboardType='numeric' style={[styles.smallInput, { width: 60, marginLeft: 6 }]} />
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



                {activeTab === 'rutinas' && (
                    <>
                        <View style={styles.card}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
                                <Text style={[styles.cardTitle, { marginBottom: 0 }]}>
                                    {editingRoutineId ? 'Editar Rutina' : 'Crear Nueva Rutina'}
                                </Text>
                                {editingRoutineId && (
                                    <TouchableOpacity onPress={() => {
                                        setEditingRoutineId(null);
                                        setRoutineName('');
                                        setRoutineExercises([]);
                                        setShowRoutineModal(false);
                                    }}>
                                        <X color={theme.colors.textLight} size={24} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder="Nombre de la Rutina (ej. Pecho y Tríceps)"
                                value={routineName}
                                onChangeText={setRoutineName}
                            />

                            <Text style={[styles.label, { marginBottom: 8 }]}>Ejercicios en la Rutina:</Text>
                            {routineExercises.length === 0 ? (
                                <Text style={{ ...styles.subtext, marginBottom: 16 }}>Aún no has agregado ejercicios.</Text>
                            ) : (
                                <View style={{ marginBottom: 16 }}>
                                    {routineExercises.map(id => {
                                        const ex = exerciseLibrary.find(e => e.id === id);
                                        if (!ex) return null;
                                        return (
                                            <View key={id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
                                                <Text style={{ flex: 1, ...styles.libName }}>{ex.name}</Text>
                                                <TouchableOpacity onPress={() => setRoutineExercises(routineExercises.filter(eId => eId !== id))}>
                                                    <X color={theme.colors.error} size={20} />
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}

                            <TouchableOpacity style={styles.outlineBtn} onPress={() => setShowRoutineModal(true)}>
                                <Plus color={theme.colors.primary} size={20} />
                                <Text style={styles.outlineBtnText}>Modificar Ejercicios</Text>
                            </TouchableOpacity>

                            <Modal visible={showRoutineModal} animationType='slide' transparent={true}>
                                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' }}>
                                    <View style={{ backgroundColor: theme.colors.surface, margin: 20, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, maxHeight: '80%' }}>
                                        <Text style={[styles.cardTitle, { marginBottom: 12 }]}>Añadir Ejercicios</Text>
                                        <ScrollView>
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
                                                            const isSelected = routineExercises.includes(ex.id);
                                                            return (
                                                                <TouchableOpacity key={ex.id} style={[styles.libraryCard, isSelected && { borderColor: theme.colors.primary, borderWidth: 1 }]} onPress={() => {
                                                                    if (isSelected) setRoutineExercises(routineExercises.filter(id => id !== ex.id));
                                                                    else setRoutineExercises([...routineExercises, ex.id]);
                                                                }}>
                                                                    <View style={styles.libInfo}>
                                                                        <Text style={styles.libName}>{ex.name}</Text>
                                                                    </View>
                                                                    {isSelected && <Check color={theme.colors.primary} size={20} />}
                                                                </TouchableOpacity>
                                                            );
                                                        })}
                                                    </View>
                                                ));
                                            })()}
                                        </ScrollView>
                                        <TouchableOpacity style={[styles.submitBtn, { marginTop: theme.spacing.md }]} onPress={() => setShowRoutineModal(false)}>
                                            <Text style={styles.submitBtnText}>Aceptar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </Modal>

                            <TouchableOpacity style={styles.submitBtn} onPress={() => {
                                if (!routineName.trim() || routineExercises.length === 0) {
                                    Alert.alert('Faltan datos', 'Ponle un nombre a tu rutina y selecciona al menos un ejercicio.');
                                    return;
                                }
                                if (editingRoutineId) {
                                    updateRoutine(editingRoutineId, { name: routineName, exerciseIds: routineExercises });
                                    Alert.alert('Actualizado', 'La rutina fue actualizada.');
                                } else {
                                    addRoutine({ name: routineName, exerciseIds: routineExercises });
                                    Alert.alert('Guardado', 'La rutina fue creada.');
                                }
                                setEditingRoutineId(null);
                                setRoutineName('');
                                setRoutineExercises([]);
                            }}>
                                <Text style={styles.submitBtnText}>{editingRoutineId ? 'Guardar Cambios' : 'Crear Rutina'}</Text>
                            </TouchableOpacity>

                            {editingRoutineId && (
                                <TouchableOpacity style={[styles.outlineBtn, { borderColor: theme.colors.error, marginTop: theme.spacing.md }]} onPress={() => {
                                    removeRoutine(editingRoutineId);
                                    setEditingRoutineId(null);
                                    setRoutineName('');
                                    setRoutineExercises([]);
                                    Alert.alert('Eliminado', 'Rutina eliminada.');
                                }}>
                                    <Trash2 color={theme.colors.error} size={20} />
                                    <Text style={[styles.outlineBtnText, { color: theme.colors.error }]}>Eliminar Rutina</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {!editingRoutineId && (routines || []).length > 0 && (
                            <View>
                                <Text style={[styles.cardTitle, { marginVertical: 10, marginLeft: 5 }]}>Mis Rutinas ({(routines || []).length})</Text>
                                {(routines || []).map(r => (
                                    <TouchableOpacity key={r.id} style={styles.card} onPress={() => {
                                        setEditingRoutineId(r.id);
                                        setRoutineName(r.name);
                                        setRoutineExercises(r.exerciseIds || []);
                                    }}>
                                        <Text style={styles.cardTitle}>{r.name}</Text>
                                        <Text style={styles.subtext}>{(r.exerciseIds || []).length} ejercicios</Text>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                                            {(r.exerciseIds || []).map(id => {
                                                const ex = exerciseLibrary.find(e => e.id === id);
                                                return <Text key={id} style={{ ...styles.routineChipText, marginRight: 8, color: theme.colors.primary }}>• {ex?.name || 'Desconocido'}</Text>;
                                            })}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </>
                )}



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
    tabsRow: { flexDirection: 'row', backgroundColor: theme.colors.surface, paddingTop: 50, paddingBottom: 10, paddingHorizontal: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, elevation: 2, zIndex: 10 },
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
