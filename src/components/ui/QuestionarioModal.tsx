// /src/components/ui/QuestionarioModal.tsx
import React from "react";

type Option = {
  text: string;
  value: string;
};

type Question = {
  question: string;
  options: Option[];
  type: "single" | "multiple" | "boolean"; // single = selección múltiple (una sola), multiple = múltiple respuesta (varias), boolean = V/F
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  value: (string | string[])[]; 
  setValue: (value: (string | string[])[]) => void;
  onSubmit: () => void;
  loading?: boolean;
};

export function QuestionarioModal({
  isOpen,
  onClose,
  questions,
  value,
  setValue,
  onSubmit,
  loading = false,
}: Props) {
  if (!isOpen) return null;

  const handleSingleAnswer = (qIdx: number, answer: string) => {
    const newValue = [...value];
    newValue[qIdx] = answer;
    setValue(newValue);
  };

  const handleMultipleAnswer = (qIdx: number, answer: string) => {
    const newValue = [...value];
    const currentAnswers = Array.isArray(newValue[qIdx]) ? (newValue[qIdx] as string[]) : [];
    
    if (currentAnswers.includes(answer)) {
      newValue[qIdx] = currentAnswers.filter(a => a !== answer);
    } else {
      newValue[qIdx] = [...currentAnswers, answer];
    }
    setValue(newValue);
  };

  const isChecked = (qIdx: number, answer: string): boolean => {
    const currentValue = value[qIdx];
    if (Array.isArray(currentValue)) {
      return currentValue.includes(answer);
    }
    return currentValue === answer;
  };

  const allAnswered = questions.every((q, idx) => {
    const answer = value[idx];
    if (Array.isArray(answer)) {
      return answer.length > 0;
    }
    return !!answer;
  });

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full mx-auto shadow-2xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#1e5ba8] text-white p-6 rounded-t-2xl flex-shrink-0 relative">
          <h2 className="text-2xl font-bold text-center text-white">Cuestionario</h2>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-xl transition"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Content - con scroll oculto */}
        <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          <style dangerouslySetInnerHTML={{__html: `
            .custom-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .custom-scrollbar {
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
          `}} />
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando preguntas...</p>
              </div>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No hay preguntas disponibles para este cuestionario.</p>
            </div>
          ) : (
            <>
              {questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="p-6 border border-gray-300 rounded-lg bg-white shadow-sm"
                >
                  <div className="font-semibold text-gray-600 mb-4 text-sm">
                    Pregunta {qIdx + 1} de {questions.length}
                  </div>
                  <p className="mb-6 text-gray-900 leading-relaxed">{q.question}</p>
                  
                  {q.options.length === 0 ? (
                    <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
                      No hay opciones disponibles para esta pregunta
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {q.options.map((opt, oIdx) => (
                        <label
                          key={oIdx}
                          className="flex items-start gap-3 cursor-pointer group"
                        >
                          <input
                            type={q.type === "multiple" ? "checkbox" : "radio"}
                            name={`question_${qIdx}`}
                            value={opt.value}
                            checked={isChecked(qIdx, opt.value)}
                            onChange={() => {
                              if (q.type === "multiple") {
                                handleMultipleAnswer(qIdx, opt.value);
                              } else {
                                handleSingleAnswer(qIdx, opt.value);
                              }
                            }}
                            className="w-5 h-5 mt-0.5 accent-[#1e5ba8] cursor-pointer flex-shrink-0"
                          />
                          <span className="text-gray-700 group-hover:text-gray-900 leading-relaxed">
                            {opt.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Submit Button */}
              <div className="flex justify-center pt-4">
                <button
                  className="bg-[#1e90ff] text-white rounded-full px-8 py-3 font-semibold shadow-lg hover:bg-[#1e5ba8] transition disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
                  onClick={onSubmit}
                  disabled={!allAnswered || loading}
                >
                  Terminar cuestionario
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}