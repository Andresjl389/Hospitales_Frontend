// src/app/(protected)/user/capacitaciones/[id]/resultados/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PartyPopper, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { questionnaireService } from '@/services/questionnaireService';
import { capacitacionesService } from '@/services/capacitacionesService';
import { useAuth } from '@/hooks/useAuth';
import { ResultResponse, UserAnswerResponse } from '@/types/questionnaire';

export default function ResultadosPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [trainingTitle, setTrainingTitle] = useState('');
  const [answers, setAnswers] = useState<UserAnswerResponse[]>([]);
  const [resultData, setResultData] = useState<ResultResponse | null>(null);
  const [statusUpdated, setStatusUpdated] = useState(false);

  const resultId = searchParams.get('result_id');

  const passed = resultData?.status?.toLowerCase() === 'aprobado';
  const score = resultData?.score || 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const trainingId = params.id as string;
        const training = await capacitacionesService.getTrainingById(trainingId);
        setTrainingTitle(training.title);

        if (resultId) {
          const result = await questionnaireService.getResultById(resultId);
          setResultData(result);

          // Mostrar feedback (respuestas del usuario) si aprobó
          if (result.status.toLowerCase() === 'aprobado') {
            const userAnswers = await questionnaireService.getAnswersByResult(resultId);
            setAnswers(userAnswers);
          }
        }
      } catch (error) {
        console.error('❌ Error cargando resultados:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && resultId) fetchData();
  }, [params.id, user, resultId]);

  useEffect(() => {
    const userId = user?.id;
    const markTrainingCompleted = async (targetUserId: string) => {
      const trainingId = params.id as string;

      try {
        const userTrainings = await capacitacionesService.getUserTraining(targetUserId);
        const userTraining = userTrainings.find(
          (training) => training.trainings.id === trainingId
        );

        if (!userTraining) {
          console.warn(
            '⚠️ No se encontró una asignación de usuario para el training aprobado:',
            trainingId
          );
          return;
        }

        const currentStatus = userTraining.status.name.toLowerCase();

        if (currentStatus !== 'completed') {
          await capacitacionesService.updateUserTraining(userTraining.id, 'Completed');
          console.log('✅ Estado de capacitación actualizado a Completed');
        } else {
          console.log('ℹ️ La capacitación ya estaba marcada como Completed');
        }
      } catch (error) {
        console.error('❌ Error actualizando estado de capacitación:', error);
      } finally {
        setStatusUpdated(true);
      }
    };

    if (
      userId &&
      resultData &&
      !statusUpdated &&
      resultData.status.toLowerCase() === 'aprobado'
    ) {
      markTrainingCompleted(userId);
    }
  }, [user?.id, resultData, params.id, statusUpdated]);

  const handleRetry = () => router.push(`/user/capacitaciones/${params.id}`);
  const handleNext = () => router.push('/user/capacitaciones');
  const handleExit = () => router.push('/user/capacitaciones');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando resultados...</p>
        </div>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh]">
        <p className="text-red-500 mb-4">No se encontraron resultados</p>
        <button
          onClick={handleExit}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Volver a capacitaciones
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          {trainingTitle}
        </h1>

        <div className={`grid grid-cols-1 ${passed ? 'lg:grid-cols-2' : ''} gap-6`}>
          {/* Tarjeta de Resultado */}
          <div
            className={`rounded-xl shadow-lg p-8 text-white ${
              passed
                ? 'bg-gradient-to-br from-green-500 to-green-600'
                : 'bg-gradient-to-br from-amber-400 to-orange-500'
            }`}
          >
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                {passed ? (
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                    <PartyPopper className="w-16 h-16 text-green-500" />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-amber-500" />
                  </div>
                )}
              </div>
              <h2 className="text-3xl font-bold mb-2">
                {passed ? '¡Felicitaciones!' : '¡Sigue intentando!'}
              </h2>
              <p className="text-lg opacity-95">
                {passed
                  ? 'Has completado exitosamente la capacitación'
                  : 'Estás en el camino correcto, la práctica hace al maestro'}
              </p>
            </div>

            {/* Calificación */}
            <div className="space-y-6 text-center">
              <div>
                <div className="text-6xl font-bold mb-2">{score}%</div>
                <div className="text-xl opacity-90">Calificación final</div>
              </div>
            </div>
          </div>

          {/* Revisión de respuestas (si aprobó) */}
          {passed && answers.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Revisión de respuestas
              </h3>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {answers.map((a, index) => (
                  <div
                    key={a.id}
                    className={`border-l-4 rounded-lg p-4 ${
                      a.options.is_correct
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {a.options.is_correct ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p
                          className={`font-semibold mb-1 ${
                            a.options.is_correct ? 'text-green-900' : 'text-red-900'
                          }`}
                        >
                          Pregunta {index + 1} -{' '}
                          {a.options.is_correct ? 'Correcta' : 'Incorrecta'}
                        </p>
                        <p className="text-sm text-gray-700 mb-3">
                          {a.questions.question_text}
                        </p>
                      </div>
                    </div>

                    {/* Mostrar la opción elegida */}
                    <div className="ml-8 text-sm">
                      <span className="font-semibold">Tu respuesta:</span>{' '}
                      {a.options.option_text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <button
            onClick={handleExit}
            className="px-8 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-lg"
          >
            Salir
          </button>

          {!passed && (
            <button
              onClick={handleRetry}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              Intentar de nuevo
            </button>
          )}

          {passed && (
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              Siguiente video
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
