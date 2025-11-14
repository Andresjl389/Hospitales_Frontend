// src/components/ui/QuizResults.tsx
import { CheckCircle, XCircle, PartyPopper, BookOpen } from "lucide-react";

interface QuestionResult {
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface QuizResultsProps {
  score: number; // Porcentaje 0-100
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number; // en minutos
  questions: QuestionResult[];
  onRetry: () => void;
  onNext: () => void;
  onExit: () => void;
  passingScore?: number; // Score mínimo para aprobar (default 70)
}

export function QuizResults({
  score,
  correctAnswers,
  totalQuestions,
  timeSpent,
  questions,
  onRetry,
  onNext,
  onExit,
  passingScore = 70,
}: QuizResultsProps) {
  const passed = score >= passingScore;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Titulo del video
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tarjeta de Resultado Principal */}
          <div
            className={`rounded-xl shadow-lg p-8 text-white ${
              passed
                ? "bg-gradient-to-br from-green-500 to-green-600"
                : "bg-gradient-to-br from-amber-400 to-orange-500"
            }`}
          >
            {/* Ícono y Mensaje */}
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
                {passed ? "¡Felicitaciones!" : "¡Sigue intentando!"}
              </h2>
              <p className="text-lg opacity-95">
                {passed
                  ? "Has completado exitosamente la capacitación"
                  : "Estás en el camino correcto, la práctica hace al maestro"}
              </p>
            </div>

            {/* Estadísticas */}
            <div className="space-y-6">
              {/* Calificación */}
              <div className="text-center">
                <div className="text-6xl font-bold mb-2">{score}%</div>
                <div className="text-xl opacity-90">Calificación final</div>
              </div>

              {/* Respuestas Correctas */}
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">
                  {correctAnswers}/{totalQuestions}
                </div>
                <div className="text-xl opacity-90">Respuestas correctas</div>
              </div>

              {/* Tiempo */}
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">{timeSpent} min</div>
                <div className="text-xl opacity-90">Tiempo total</div>
              </div>
            </div>
          </div>

          {/* Revisión de Respuestas */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Revisión de respuestas
            </h3>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {questions.map((q, index) => (
                <div
                  key={index}
                  className={`border-l-4 rounded-lg p-4 ${
                    q.isCorrect
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                  }`}
                >
                  {/* Header con ícono */}
                  <div className="flex items-start gap-3 mb-3">
                    {q.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p
                        className={`font-semibold mb-1 ${
                          q.isCorrect ? "text-green-900" : "text-red-900"
                        }`}
                      >
                        Pregunta {index + 1} -{" "}
                        {q.isCorrect ? "Correcta" : "Incorrecta"}
                      </p>
                      <p className="text-sm text-gray-700 mb-3">
                        {q.questionText}
                      </p>
                    </div>
                  </div>

                  {/* Respuestas */}
                  <div className="ml-8 space-y-2">
                    <div
                      className={`text-sm ${
                        q.isCorrect ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      <span className="font-semibold">Tu respuesta:</span>{" "}
                      {q.userAnswer}
                    </div>
                    {!q.isCorrect && (
                      <div className="text-sm text-green-700 bg-green-100 px-3 py-2 rounded">
                        <span className="font-semibold">
                          Respuesta correcta:
                        </span>{" "}
                        {q.correctAnswer}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <button
            onClick={onExit}
            className="px-8 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-lg"
          >
            Salir
          </button>

          {!passed && (
            <button
              onClick={onRetry}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              Intentar de nuevo
            </button>
          )}

          {passed && (
            <button
              onClick={onNext}
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
