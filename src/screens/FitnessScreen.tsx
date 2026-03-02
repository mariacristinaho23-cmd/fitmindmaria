import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { theme } from '../styles/theme';
import { useStore, ExerciseLibraryItem } from '../store/useStore';
import { createWorkout, fetchExercises, saveExercise, deleteExercise as deleteExerciseDb } from '../lib/workouts';
import { Plus, Check, Camera, Dumbbell, X, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function FitnessScreen() {
    const { routines, addRoutine, workoutHistory, addWorkoutSession, weightLogs, addWeightLog, updateDailyLog, exerciseLibrary, setExerciseLibrary, addExerciseToLibrary, updateExerciseInLibrary, removeExerciseFromLibrary } = useStore();

    const [activeTab, setActiveTab] = useState<'rutinas' | 'biblioteca' | 'registrar'>('rutinas');

    // New Routine State
    const [routineName, setRoutineName] = useState('');
    const [exName, setExName] = useState('');
    const [exWeight, setExWeight] = useState('');
    const [exReps, setExReps] = useState('');
    const [exSets, setExSets] = useState('');
    const [tempExercises, setTempExercises] = useState<any[]>([]);

    // Log Workout State (Simple)
    const [selectedRoutine, setSelectedRoutine] = useState<string>('');
    const [duration, setDuration] = useState('');

    // Weight State
    const [currentWeight, setCurrentWeight] = useState('');

    // Biblioteca State
    const [libName, setLibName] = useState('');
    const [libMuscle, setLibMuscle] = useState('');
    const [libImage, setLibImage] = useState<string | null>(null);
    const [editingExercise, setEditingExercise] = useState<ExerciseLibraryItem | null>(null);

    // Advanced Workout Logging State
    const [advDuration, setAdvDuration] = useState('');
    const [advRoutineName, setAdvRoutineName] = useState('');
    const [advExercises, setAdvExercises] = useState<{ exerciseId: string; weight: string; reps: string; sets: string }[]>([]);

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

    const handleAddExercise = () => {
        if (!exName || !exWeight || !exReps || !exSets) {
            Alert.alert("Faltan datos", "Completa nombre, peso, series y repeticiones.");
            return;
        }
        setTempExercises([...tempExercises, {
            id: Date.now().toString(),
            name: exName,
            weight: parseFloat(exWeight),
            reps: parseInt(exReps),
            sets: parseInt(exSets)
        }]);
        setExName(''); setExWeight(''); setExReps(''); setExSets('');
    };

    const handleSaveRoutine = () => {
        if (!routineName || tempExercises.length === 0) {
            Alert.alert("Faltan datos", "Asigna un nombre a la rutina y agrega al menos un ejercicio.");
            return;
        }
        addRoutine({ name: routineName, exercises: tempExercises });
        setRoutineName('');
        setTempExercises([]);
        Alert.alert("Éxito", "Rutina guardada correctamente");
    };

    const handleLogWorkout = async () => {
        if (!selectedRoutine || !duration) {
            Alert.alert("Faltan datos", "Selecciona una rutina y especifica la duración.");
            return;
        }
        const todayStr = new Date().toISOString().split('T')[0];
        addWorkoutSession({
            date: todayStr,
            routineName: selectedRoutine,
            durationMinutes: parseInt(duration)
        });
        updateDailyLog(todayStr, { trained: true });

        // Try saving to Supabase
        const { data, error } = await createWorkout(todayStr, selectedRoutine, parseInt(duration));
        if (error) {
            console.error("Error saving to Supabase:", error);
            // We do not alert the user here as local save succeeded, but we could if strict sync is needed
        }

        setDuration('');
        setSelectedRoutine('');
        Alert.alert("¡Excelente trabajo!", "Entrenamiento registrado.");
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
            Alert.alert("Error", "No se pudo guardar el ejercicio.");
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

    const handleAddAdvExercise = (exerciseId: string) => {
        if (advExercises.find(a => a.exerciseId === exerciseId)) {
            setAdvExercises(advExercises.filter(a => a.exerciseId !== exerciseId));
        } else {
            setAdvExercises([...advExercises, { exerciseId, weight: '', reps: '', sets: '' }]);
        }
    };

    const handleUpdateAdvExercise = (exerciseId: string, field: 'weight' | 'reps' | 'sets', value: string) => {
        setAdvExercises(advExercises.map(e => e.exerciseId === exerciseId ? { ...e, [field]: value } : e));
    };

    const handleSaveAdvWorkout = async () => {
        if (!advDuration) {
            Alert.alert("Error", "Debes ingresar al menos la duración.");
            return;
        }

        const validExs = advExercises.filter(e => e.weight && e.reps && e.sets).map(e => ({
            exerciseId: e.exerciseId,
            weight: parseFloat(e.weight),
            reps: parseInt(e.reps),
            sets: parseInt(e.sets)
        }));

        const todayStr = new Date().toISOString().split('T')[0];
        const routineName = advRoutineName || "Entrenamiento Libre";

        // Save locally
        addWorkoutSession({
            date: todayStr,
            routineName: routineName,
            durationMinutes: parseInt(advDuration),
            exercises: validExs
        });
        updateDailyLog(todayStr, { trained: true });

        // Try saving to Supabase
        const { data, error } = await createWorkout(todayStr, routineName, parseInt(advDuration));
        if (error) {
            console.error("Error saving to Supabase:", error);
            // We do not alert the user here as local save succeeded, but we could if strict sync is needed
        }

        setAdvDuration(''); setAdvRoutineName(''); setAdvExercises([]);
        Alert.alert("¡Excelente!", "Entrenamiento registrado.");
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
                <TouchableOpacity onPress={() => setActiveTab('rutinas')} style={[styles.tabBtn, activeTab === 'rutinas' && styles.tabBtnActive]}>
                    <Dumbbell size={20} color={activeTab === 'rutinas' ? theme.colors.primary : theme.colors.textLight} />
                    <Text style={[styles.tabBtnText, activeTab === 'rutinas' && styles.tabBtnTextActive]}>Rutinas</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('biblioteca')} style={[styles.tabBtn, activeTab === 'biblioteca' && styles.tabBtnActive]}>
                    <Plus size={20} color={activeTab === 'biblioteca' ? theme.colors.primary : theme.colors.textLight} />
                    <Text style={[styles.tabBtnText, activeTab === 'biblioteca' && styles.tabBtnTextActive]}>Biblioteca</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('registrar')} style={[styles.tabBtn, activeTab === 'registrar' && styles.tabBtnActive]}>
                    <Check size={20} color={activeTab === 'registrar' ? theme.colors.primary : theme.colors.textLight} />
                    <Text style={[styles.tabBtnText, activeTab === 'registrar' && styles.tabBtnTextActive]}>Registrar</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {activeTab === 'rutinas' && (
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

                        {/* Create Routine */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Crear Nueva Rutina Simple</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nombre de la rutina (ej. Pierna y Glúteo)"
                                value={routineName}
                                onChangeText={setRoutineName}
                            />

                            <View style={styles.exerciseForm}>
                                <Text style={styles.label}>Agregar Ejercicio:</Text>

                                {exerciseLibrary && exerciseLibrary.length > 0 && (
                                    <>
                                        <Text style={[styles.subtext, { marginBottom: 5 }]}>O elige desde tu biblioteca:</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                                            {exerciseLibrary.map(ex => {
                                                const isSelected = exName === ex.name;
                                                return (
                                                    <TouchableOpacity
                                                        key={ex.id}
                                                        style={[styles.libraryChip, isSelected && styles.libraryChipActive]}
                                                        onPress={() => setExName(ex.name)}
                                                    >
                                                        <Text style={[styles.libraryChipText, isSelected && styles.libraryChipTextActive]}>{ex.name}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </ScrollView>
                                    </>
                                )}

                                <TextInput style={styles.input} placeholder="Nombre (ej. Sentadilla)" value={exName} onChangeText={setExName} />
                                <View style={styles.row}>
                                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Peso (kg)" keyboardType="numeric" value={exWeight} onChangeText={setExWeight} />
                                    <View style={{ width: 10 }} />
                                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Series" keyboardType="numeric" value={exSets} onChangeText={setExSets} />
                                    <View style={{ width: 10 }} />
                                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Reps" keyboardType="numeric" value={exReps} onChangeText={setExReps} />
                                </View>
                                <TouchableOpacity style={styles.outlineBtn} onPress={handleAddExercise}>
                                    <Plus color={theme.colors.primary} size={20} />
                                    <Text style={styles.outlineBtnText}>Agregar a la rutina</Text>
                                </TouchableOpacity>
                            </View>

                            {tempExercises.length > 0 && (
                                <View style={styles.tempList}>
                                    {tempExercises.map((ex, i) => (
                                        <Text key={i} style={styles.historyText}>• {ex.name} - {ex.sets}x{ex.reps} ({ex.weight}kg)</Text>
                                    ))}
                                </View>
                            )}

                            <TouchableOpacity style={styles.submitBtn} onPress={handleSaveRoutine}>
                                <Text style={styles.submitBtnText}>Guardar Rutina Completa</Text>
                            </TouchableOpacity>
                        </View>

                        {/* History */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Historial Histórico</Text>
                            {workoutHistory.slice(0, 5).map(w => (
                                <View key={w.id} style={styles.historyItem}>
                                    <Text style={styles.historyDate}>{w.date}</Text>
                                    <Text style={styles.historyText}>Rutina: {w.routineName} ({w.durationMinutes} min)</Text>
                                </View>
                            ))}
                            {workoutHistory.length === 0 && <Text style={styles.subtext}>Aún no hay entrenamientos registrados.</Text>}
                        </View>
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

                {activeTab === 'registrar' && (
                    <>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Entrenamiento Libre y Avanzado</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Duración Total (Minutos)"
                                keyboardType="numeric"
                                value={advDuration}
                                onChangeText={setAdvDuration}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Nombre Sesión (Opcional, ej: Pecho)"
                                value={advRoutineName}
                                onChangeText={setAdvRoutineName}
                            />

                            <Text style={[styles.label, { marginBottom: 10 }]}>Elige ejercicios (Tap para seleccionar):</Text>

                            {(exerciseLibrary || []).length === 0 && (
                                <Text style={styles.subtext}>Ve a la biblioteca a agregar ejercicios primero.</Text>
                            )}

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                                {(exerciseLibrary || []).map(ex => {
                                    const isSelected = !!advExercises.find(a => a.exerciseId === ex.id);
                                    return (
                                        <TouchableOpacity
                                            key={ex.id}
                                            style={[styles.libraryChip, isSelected && styles.libraryChipActive]}
                                            onPress={() => handleAddAdvExercise(ex.id)}
                                        >
                                            <Text style={[styles.libraryChipText, isSelected && styles.libraryChipTextActive]}>{ex.name}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            {advExercises.length > 0 && (
                                <View style={styles.advFormList}>
                                    {advExercises.map(advEx => {
                                        const originalEx = (exerciseLibrary || []).find(e => e.id === advEx.exerciseId);
                                        return (
                                            <View key={advEx.exerciseId} style={styles.advExRow}>
                                                <Text style={styles.advExName}>{originalEx?.name}</Text>
                                                <View style={styles.advExInputs}>
                                                    <TextInput style={styles.smallInput} placeholder="Peso(kg)" keyboardType="numeric" value={advEx.weight} onChangeText={v => handleUpdateAdvExercise(advEx.exerciseId, 'weight', v)} />
                                                    <TextInput style={styles.smallInput} placeholder="Series" keyboardType="numeric" value={advEx.sets} onChangeText={v => handleUpdateAdvExercise(advEx.exerciseId, 'sets', v)} />
                                                    <TextInput style={styles.smallInput} placeholder="Reps" keyboardType="numeric" value={advEx.reps} onChangeText={v => handleUpdateAdvExercise(advEx.exerciseId, 'reps', v)} />
                                                </View>
                                            </View>
                                        );
                                    })}
                                    <TouchableOpacity style={styles.submitBtn} onPress={handleSaveAdvWorkout}>
                                        <Text style={styles.submitBtnText}>Finalizar y Loggear</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
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
});
