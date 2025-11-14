// src/app/(protected)/user/capacitaciones/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trainings } from "@/types/capacitacion";
import { ArrowLeft, Clock, User, AlertCircle } from "lucide-react";
import { QuestionarioModal } from "@/components/ui/QuestionarioModal";
import React from "react";
import { 
  Question as BackendQuestion, 
  Option as BackendOption 
} from "@/types/questionnaire";
import { capacitacionesService } from "@/services/capacitacionesService";
import { questionnaireService } from "@/services/questionnaireService";

// Tipos para el modal (internos del componente)
type ModalOption = {
  text: string;
  value: string;
};

type ModalQuestion = {
  question: string;
  options: ModalOption[];
  type: "single" | "multiple" | "boolean";
};

export default function VideoCapacitacionPage() {
  const params = useParams();
  const router = useRouter();
  const [capacitacion, setCapacitacion] = useState<Trainings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [backendQuestions, setBackendQuestions] = useState<BackendQuestion[]>([]);
  const [backendOptions, setBackendOptions] = useState<BackendOption[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [questionnaireId, setQuestionnaireId] = useState<string | null>(null);

  // Estado del cuestionario/modal
  const [isOpen, setIsOpen] = useState(false);
  const [answers, setAnswers] = useState<(string | string[])[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Función para determinar el tipo de pregunta según el nombre del backend
  const getQuestionType = (typeName: string): "single" | "multiple" | "boolean" => {
    const normalizedName = typeName.toLowerCase().trim();
    
    // CASO 1: Múltiple respuesta (permite seleccionar VARIAS opciones - checkboxes)
    if (normalizedName === "múltiple respuesta" || 
        normalizedName === "multiple respuesta") {
      return "multiple";
    }
    
    // CASO 2: Falso o verdadero (solo dos opciones V/F - radio buttons)
    if (normalizedName === "falso o verdadero" ||
        normalizedName === "verdadero o falso" ||
        normalizedName === "falso/verdadero" ||
        normalizedName === "verdadero/falso") {
      return "boolean";
    }
    
    // CASO 3: Selección múltiple (solo UNA respuesta de varias opciones - radio buttons)
    // Este es el caso por defecto
    return "single";
  };

  // Función para transformar datos del backend al formato del modal
  const transformQuestionsForModal = (): ModalQuestion[] => {
    return backendQuestions.map((q) => {
      const questionOptions = backendOptions.filter(
        opt => opt.questions.id === q.id
      );
      
      const questionType = getQuestionType(q.question_types.name);

      return {
        question: q.question_text,
        type: questionType,
        options: questionOptions.map(opt => ({
          text: opt.option_text,
          value: opt.id
        }))
      };
    });
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📤 ENVIANDO CUESTIONARIO");
      
      // 1. Guardar todas las respuestas usando PUT (upsert)
      console.log("  - Guardando respuestas...");
      
      for (let idx = 0; idx < backendQuestions.length; idx++) {
        const question = backendQuestions[idx];
        const answer = answers[idx];
        const questionType = getQuestionType(question.question_types.name);
        
        console.log(`    • Pregunta ${idx + 1} (${question.question_text.substring(0, 50)}...)`);
        console.log(`      Tipo: ${question.question_types.name} → ${questionType}`);
        
        try {
          // Si la respuesta es un array (múltiple respuesta), enviar option_ids
          if (Array.isArray(answer) && answer.length > 0) {
            console.log(`      Opciones seleccionadas: ${answer.length}`);
            console.log(`      IDs: ${answer.join(', ')}`);
            
            await questionnaireService.updateUserAnswer(
              question.id, 
              undefined,  // option_id
              answer      // option_ids
            );
            
            console.log(`      ✓ Respuesta múltiple guardada correctamente`);
          } 
          // Si es respuesta única, enviar option_id
          else if (typeof answer === 'string' && answer) {
            console.log(`      Opción seleccionada: ${answer}`);
            
            await questionnaireService.updateUserAnswer(
              question.id, 
              answer,     // option_id
              undefined   // option_ids
            );
            
            console.log(`      ✓ Respuesta única guardada correctamente`);
          }
          else {
            console.warn(`      ⚠️ Respuesta vacía o inválida para pregunta ${idx + 1}`);
          }
          
        } catch (error) {
          console.error(`      ✗ Error guardando respuesta:`, error);
          throw new Error(`Error guardando respuesta para pregunta ${idx + 1}`);
        }
        
        // Pequeña pausa entre preguntas para evitar sobrecarga
        if (idx < backendQuestions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log("  ✅ Todas las respuestas guardadas");
      
      // 2. Crear el resultado en el backend
      if (!questionnaireId) {
        throw new Error("No se pudo obtener el ID del cuestionario");
      }
      
      console.log("  - Creando resultado en el backend...");
      const result = await questionnaireService.createResult(questionnaireId);
      
      console.log("  ✅ Resultado creado:", result);
      console.log(`    • Score: ${result.score}%`);
      console.log(`    • Estado: ${result.status}`);
      
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      // 3. Cerrar modal y mostrar resultados
      setIsOpen(false);
      
      // Navegar a página de resultados con el ID del resultado
      router.push(`/user/capacitaciones/${params.id}/resultados?result_id=${result.id}`);
      
    } catch (err) {
      console.error("❌ Error al enviar respuestas:", err);
      alert(`Error al enviar el cuestionario: ${err instanceof Error ? err.message : 'Error desconocido'}. Por favor, intenta de nuevo.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateAnswer = (questionIndex: number): boolean => {
    const question = backendQuestions[questionIndex];
    const answer = answers[questionIndex];
    const questionOptions = backendOptions.filter(
      opt => opt.questions.id === question.id
    );

    if (Array.isArray(answer)) {
      const correctOptionIds = questionOptions
        .filter(opt => opt.is_correct)
        .map(opt => opt.id);
      
      return answer.length === correctOptionIds.length && 
             answer.every(a => correctOptionIds.includes(a)) &&
             correctOptionIds.every(id => answer.includes(id));
    } else {
      const selectedOption = questionOptions.find(opt => opt.id === answer);
      return selectedOption?.is_correct || false;
    }
  };

  // Función para cargar preguntas y opciones (se ejecuta al hacer clic)
  const fetchQuestionsAndOptions = async () => {
    try {
      setQuestionsLoading(true);
      const id = params.id as string;
      
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🔍 CUESTIONARIO - Iniciando carga");
      console.log("🎯 Training ID solicitado:", id);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      // Obtener preguntas
      const questionsData = await questionnaireService.getQuestionsByTrainingId(id);
      
      console.log("📋 PREGUNTAS RECIBIDAS:");
      console.log("  - Total de preguntas:", questionsData.length);
      
      // Obtener el questionnaire_id de la primera pregunta
      if (questionsData.length > 0 && questionsData[0].questionnaires) {
        const qId = questionsData[0].questionnaires.id;
        setQuestionnaireId(qId);
        console.log("  - Questionnaire ID:", qId);
      }
      
      setBackendQuestions(questionsData);
      
      // Obtener opciones para todas las preguntas
      const allOptions: BackendOption[] = [];
      
      for (const question of questionsData) {
        try {
          const optionsData = await questionnaireService.getOption(question.id);
          allOptions.push(...optionsData);
          const qType = getQuestionType(question.question_types.name);
          
          // Log mejorado con emojis para identificar rápido el tipo
          const typeEmoji = qType === "multiple" ? "☑️" : qType === "boolean" ? "✔️" : "🔘";
          console.log(`  ${typeEmoji} "${question.question_text}" [${question.question_types.name} → ${qType}]: ${optionsData.length} opciones`);
        } catch (err) {
          console.error(`  ✗ Error obteniendo opciones para pregunta ${question.id}:`, err);
        }
      }
      
      setBackendOptions(allOptions);
      setQuestionsLoaded(true);
      
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("✅ RESUMEN:");
      console.log("  - Preguntas cargadas:", questionsData.length);
      console.log("  - Opciones cargadas:", allOptions.length);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
    } catch (err) {
      console.error("❌ Error obteniendo preguntas:", err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las preguntas del cuestionario"
      );
    } finally {
      setQuestionsLoading(false);
    }
  };

  // Handler para abrir el modal y cargar el cuestionario
  const handleIniciarCuestionario = async () => {
    // Si ya se cargaron las preguntas antes, solo abrir el modal
    if (questionsLoaded && backendQuestions.length > 0) {
      setAnswers([]);
      setIsOpen(true);
      return;
    }

    // Si no se han cargado, cargarlas primero
    await fetchQuestionsAndOptions();
    
    // Solo abrir el modal si se cargaron preguntas exitosamente
    if (backendQuestions.length > 0) {
      setAnswers([]);
      setIsOpen(true);
    }
  };

  // Solo cargar la capacitación al montar el componente
  useEffect(() => {
    const fetchCapacitacion = async () => {
      try {
        const id = params.id as string;
        console.log("🎯 CAPACITACIÓN - Solicitando training_id:", id);
        
        const data = await capacitacionesService.getTrainingById(id);
        console.log("✅ CAPACITACIÓN - Datos recibidos:", data);
        
        setCapacitacion(data);
      } catch (err) {
        console.error("❌ Error cargando capacitación:", err);
        setError("No se pudo cargar la capacitación");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchCapacitacion();
    }
  }, [params.id]);

  const handleGoBack = () => {
    router.push("/user/capacitaciones");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando video...</p>
        </div>
      </div>
    );
  }

  if (error || !capacitacion) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh]">
        <p className="text-red-500 mb-4">{error || "Capacitación no encontrada"}</p>
        <button
          onClick={handleGoBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Volver a capacitaciones
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Botón de regresar */}
      <button
        onClick={handleGoBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Volver a capacitaciones</span>
      </button>

      {/* Título */}
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {capacitacion.title}
      </h1>

      {/* Video Player */}
      <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl mb-8">
        <div className="relative" style={{ paddingBottom: "56.25%" }}>
          {capacitacion.url_video ? (
            <video
              className="absolute inset-0 w-full h-full"
              controls
              poster={capacitacion.url_image}
            >
              <source src={capacitacion.url_video} type="video/mp4" />
              Tu navegador no soporta el elemento de video.
            </video>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-12 h-12 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
                <p className="text-gray-400">Video no disponible</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Descripción y detalles */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-5 h-5" />
            <span className="font-medium">
              Duración: {capacitacion.duration_minutes.toString()} minutos
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-5 h-5" />
            <span>
              {capacitacion.user.first_name} {capacitacion.user.last_name}
            </span>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Descripción
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {capacitacion.description}
          </p>
        </div>
      </div>

      {/* Botón para abrir el cuestionario */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <button
          onClick={handleIniciarCuestionario}
          className="bg-[#1e5ba8] text-white rounded-lg px-6 py-3 font-semibold shadow-lg hover:bg-[#164a8f] transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={questionsLoading}
        >
          {questionsLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Cargando cuestionario...</span>
            </>
          ) : questionsLoaded ? (
            "Abrir Cuestionario"
          ) : (
            "Iniciar Cuestionario"
          )}
        </button>
        
        {/* Info de estado */}
        {questionsLoaded && backendQuestions.length > 0 && !questionsLoading && (
          <span className="text-sm text-green-600 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {backendQuestions.length} pregunta(s) cargadas
          </span>
        )}

        {/* Mensaje si no hay cuestionario */}
        {questionsLoaded && backendQuestions.length === 0 && !questionsLoading && (
          <span className="text-sm text-amber-600 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            No hay cuestionario disponible para esta capacitación
          </span>
        )}
      </div>

      {/* Modal de cuestionario */}
      <QuestionarioModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        questions={transformQuestionsForModal()}
        value={answers}
        setValue={setAnswers}
        onSubmit={handleSubmit}
        loading={isSubmitting}
      />
    </div>
  );
}
