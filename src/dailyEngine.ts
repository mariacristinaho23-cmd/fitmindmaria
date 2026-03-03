// @ts-nocheck
import { behaviorData } from "./data/behaviorData";
export interface UserState {
    energiaHoy: number; // 1-5
    rachaAzucar: number;
    rachaFitness: number;
    rachaIngles: number;
    // rachaPython removed
    rachaLectura: number;
    cumplimientoAyer: number; // 0-5
    historialConsumoAzucar: boolean[]; // true = consumed, false = did not consume
    nivelFitness: number;
    nivelIngles: number;
    // nivelPython removed
    nivelLectura: number;
    nivelAzucar: number;
}

export type EngineMode = 'minimo' | 'estandar' | 'intenso';
function getSugarIntervention(nivel: number) {
    const categoria = behaviorData.find(c => c.tema === "azucar");
    if (!categoria) return null;

    const opciones = categoria.estrategias.filter(e => e.nivel <= nivel);

    if (opciones.length === 0) return null;

    return opciones[Math.floor(Math.random() * opciones.length)];
}
export interface GeneratedPlan {
    modo: EngineMode;
    sugarPlan: string;
    fitnessPlan: string;
    englishPlan: string;
    readingPlan: string;
}

// Internal Task Banks
type LevelBank = {
    [levelRange: string]: {
        minimo: string[];
        estandar: string[];
        intenso: string[];
    }
}

const BANK_SUGAR: LevelBank = {
    '1-3': {
        minimo: ["1 vaso de agua al primer antojo."],
        estandar: ["Sustitución básica: Come fruta en vez de un postre extra."],
        intenso: ["Cero azúcar añadido. Fuerza de voluntad al 100%."]
    },
    '4-6': {
        minimo: ["Si hay antojo, espera 10 mins antes de comerlo. Anota cómo te sientes."],
        estandar: ["Sustitución consciente + Journaling breve sobre tus triggers de hoy."],
        intenso: ["Día de limpieza: Sin edulcorantes, sin azúcar."]
    },
    '7-10': {
        minimo: ["Revisión cognitiva: Nombra la emoción detrás del antojo de hoy."],
        estandar: ["Intervención activa: Escribe 1 página sobre tu dominio emocional hoy."],
        intenso: ["Ayuno de dopamina enfocado. Control absoluto de impulsos."]
    }
};

const BANK_FITNESS: LevelBank = {
    '1-2': {
        minimo: ["3 mins de movilidad (cuello, hombros, caderas)."],
        estandar: ["Caminata ligera (15 min) o rutina de estiramientos suave."],
        intenso: ["Movilidad completa + 20 min de caminata rítmica."]
    },
    '3-5': {
        minimo: ["Una serie de flexiones y plancha al fallo técnico."],
        estandar: ["Rutina estructurada básica (20-30 min) cuerpo completo."],
        intenso: ["Circuito cardiovascular o levantamiento moderado (45 min)."]
    },
    '6-8': {
        minimo: ["Rutina rápida de core (10 min) y calentamiento activo."],
        estandar: ["Sesión de Fuerza: Enfoque en un grupo muscular (45 min)."],
        intenso: ["Sobrecarga progresiva: Récord personal en repeticiones o peso."]
    },
    '9-10': {
        minimo: ["Recuperación activa: Yoga intenso o carrera ligera (20m)."],
        estandar: ["Entrenamiento intenso o HIIT estructural (45-60 min)."],
        intenso: ["Doble sesión o Workout Elite: Empujar umbral de fatiga y fallo."]
    }
};

const BANK_ENGLISH: LevelBank = {
    '1-2': {
        minimo: ["5 min escuchando audio pasivamente en inglés."],
        estandar: ["10 min de Listening básico prestando atención a pronunciación."],
        intenso: ["15 min de Listening + leer la transcripción entera."]
    },
    '3-5': {
        minimo: ["Repasa mentalmente vocabulario por 5 min."],
        estandar: ["15 min de Listening + anota 3 palabras nuevas."],
        intenso: ["25 min de Listening enfocado (Podcast) y resume de qué trata."]
    },
    '6-8': {
        minimo: ["Lee un artículo rápido en inglés (5 min)."],
        estandar: ["10 min de Shadowing (repetir audio) + Writing breve."],
        intenso: ["Escucha 30 min sin subtítulos + escribe resumen complejo."]
    },
    '9-10': {
        minimo: ["Día de mantenimiento: Escucha algo técnico en inglés."],
        estandar: ["Conversación guiada o Writing sobre un tema profesional (20m)."],
        intenso: ["Inmersión profunda (1hr+): Todo en inglés, estudio de acentos y gramática avanzada."]
    }
};

// Python domain removed per product decision

const BANK_READING: LevelBank = {
    '1-3': {
        minimo: ["Lee un par de páginas o el índice para no perder el hábito."],
        estandar: ["Lee 10 páginas con atención plena."],
        intenso: ["Lee 15 páginas y anota las 3 ideas principales."]
    },
    '4-6': {
        minimo: ["Lee 5 páginas de tu lectura actual."],
        estandar: ["Avanza 20 páginas de forma enfocada."],
        intenso: ["Lee todo un capítulo o 30 páginas continuas."]
    },
    '7-10': {
        minimo: ["Lee +10 páginas y subraya información relevante."],
        estandar: ["Entrenamiento intelectual: +30 páginas."],
        intenso: ["Día de Inmersión: +40 páginas y escribe una nota reflexiva estructural sobre el libro."]
    }
};

const getLevelRange = (domain: 'sugar' | 'fitness' | 'english' | 'reading', level: number): string => {
    if (domain === 'fitness') {
        if (level <= 2) return '1-2';
        if (level <= 5) return '3-5';
        if (level <= 8) return '6-8';
        return '9-10';
    } else if (domain === 'english') {
        if (level <= 2) return '1-2';
        if (level <= 5) return '3-5';
        if (level <= 8) return '6-8';
        return '9-10';
    } else if (domain === 'reading') {
        if (level <= 3) return '1-3';
        if (level <= 6) return '4-6';
        return '7-10';
    } else { // sugar
        if (level <= 3) return '1-3';
        if (level <= 6) return '4-6';
        return '7-10';
    }
}

const getTaskFromLevel = (bank: LevelBank, range: string, modo: EngineMode): string => {
    const validRange = bank[range] ? range : Object.keys(bank)[0]; // Fallback to first level if error
    const tasks = bank[validRange][modo];
    return tasks[Math.floor(Math.random() * tasks.length)];
};

export const generateDailyPlan = (state: UserState): GeneratedPlan => {
    // B) Determinar modo automáticamente
    let modo: EngineMode = 'estandar';
    if (state.energiaHoy <= 2) {
        modo = 'minimo';
    } else if (state.energiaHoy >= 3 && state.energiaHoy <= 4) {
        modo = 'estandar';
    } else if (state.energiaHoy === 5 && state.cumplimientoAyer >= 4) {
        modo = 'intenso';
    }

    // C) Generar plan adaptativo
    const sugarIntervention = getSugarIntervention(state.nivelAzucar);
    const sugarPlan = sugarIntervention
        ? `${sugarIntervention.reencuadre} → ${sugarIntervention.accion}`
        : getTaskFromLevel(BANK_SUGAR, getLevelRange('sugar', state.nivelAzucar), modo);

    // D) Determinar Focus of the Day
    const { nivelIngles, nivelLectura } = state;
    // focusOfTheDay removed — plan will not include an explicit focus field

    return {
        modo,
        sugarPlan,
        fitnessPlan: getTaskFromLevel(BANK_FITNESS, getLevelRange('fitness', state.nivelFitness), modo),
        englishPlan: getTaskFromLevel(BANK_ENGLISH, getLevelRange('english', state.nivelIngles), modo),
        readingPlan: getTaskFromLevel(BANK_READING, getLevelRange('reading', state.nivelLectura), modo),
    };
};
