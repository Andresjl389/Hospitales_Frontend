import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Trainings } from '@/types/capacitacion';
import { TrainingFormState, createEmptyTrainingForm } from '@/types/adminTraining';
import { TrainingMediaForm } from './TrainingMediaForm';
import { Button } from '@/components/ui/Button';
import { capacitacionesService } from '@/services/capacitacionesService';
import { adminService } from '@/services/adminService';
import { questionnaireService } from '@/services/questionnaireService';
import { Option, Question, QuestionType } from '@/types/questionnaire';
import { useToast } from '@/components/ui/ToastProvider';
import { isBooleanQuestionType } from '@/lib/utils';
type CreateStep = 'training' | 'areas' | 'questionnaire';

type PreviewStore = {
  image: string | null;
  video: string | null;
};

type QuestionWithOptions = {
  question: Question;
  options: Option[];
};

type BooleanChoice = 'verdadero' | 'falso';

type AreaOption = Awaited<ReturnType<typeof adminService.getAreas>>[number];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTrainingCreated: (training: Trainings) => void;
}

const creationSteps: { key: CreateStep; title: string; description: string }[] = [
  { key: 'training', title: 'Capacitación', description: 'Carga la información base' },
  { key: 'areas', title: 'Áreas', description: 'Asigna los equipos responsables' },
  { key: 'questionnaire', title: 'Cuestionario', description: 'Crea preguntas y respuestas' },
];

export function TrainingCreationWizard({ isOpen, onClose, onTrainingCreated }: Props) {
  const [step, setStep] = useState<CreateStep>('training');
  const [form, setForm] = useState<TrainingFormState>(createEmptyTrainingForm);
  const [loading, setLoading] = useState(false);
  const [createdTraining, setCreatedTraining] = useState<Trainings | null>(null);
  const { showToast } = useToast();

  const previewUrls = useRef<PreviewStore>({ image: null, video: null });

  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [assignedAreas, setAssignedAreas] = useState<string[]>([]);
  const [assigningAreas, setAssigningAreas] = useState(false);

  const [questionnaireId, setQuestionnaireId] = useState<string | null>(null);
  const [questionnaireLoading, setQuestionnaireLoading] = useState(false);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  const [questionDraft, setQuestionDraft] = useState<{
    text: string;
    typeId: string;
    booleanCorrect: BooleanChoice;
  }>({ text: '', typeId: '', booleanCorrect: 'verdadero' });
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
  const [optionDrafts, setOptionDrafts] = useState<
    Record<string, { text: string; isCorrect: boolean }>
  >({});
  const [optionLoading, setOptionLoading] = useState<Record<string, boolean>>({});

  const revokePreview = (type: 'image' | 'video') => {
    const url = previewUrls.current[type];
    if (url) {
      URL.revokeObjectURL(url);
      previewUrls.current[type] = null;
    }
  };

  const resetWizard = useCallback(() => {
    setStep('training');
    setCreatedTraining(null);
    setForm(createEmptyTrainingForm());
    setAreas([]);
    setSelectedAreas([]);
    setAssignedAreas([]);
    setQuestionnaireId(null);
    setQuestionnaireLoading(false);
    setQuestionTypes([]);
    setQuestionDraft({ text: '', typeId: '', booleanCorrect: 'verdadero' });
    setQuestions([]);
    setOptionDrafts({});
    setOptionLoading({});
    setLoading(false);
    setAssigningAreas(false);
    setCreatingQuestion(false);
    revokePreview('image');
    revokePreview('video');
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetWizard();
    }
  }, [isOpen, resetWizard]);

  useEffect(() => {
    return () => {
      revokePreview('image');
      revokePreview('video');
    };
  }, []);

  useEffect(() => {
    if (!isOpen || step !== 'areas' || areas.length > 0) return;

    const fetchAreas = async () => {
      try {
        setAreasLoading(true);
        const data = await adminService.getAreas();
        setAreas(data);
      } catch (error) {
        console.error('❌ Error al obtener áreas:', error);
        showToast({
          type: 'error',
          title: 'Error al cargar áreas',
          description: error instanceof Error ? error.message : 'No se pudieron cargar las áreas.',
        });
      } finally {
        setAreasLoading(false);
      }
    };

    fetchAreas();
  }, [isOpen, step, areas.length, showToast]);

  useEffect(() => {
    if (!isOpen || step !== 'questionnaire') return;

    const prepareQuestionnaire = async () => {
      if (!createdTraining) {
        showToast({
          type: 'error',
          title: 'Falta la capacitación',
          description: 'Crea la capacitación antes de configurar el cuestionario.',
        });
        setStep('training');
        return;
      }

      try {
        setQuestionnaireLoading(true);

        if (!questionnaireId) {
          const questionnaire = await questionnaireService.createQuestionnaire(createdTraining.id);
          setQuestionnaireId(questionnaire.id);
        }

        if (questionTypes.length === 0) {
          const types = await questionnaireService.getQuestionTypes();
          setQuestionTypes(types);
          setQuestionDraft((prev) => ({
            ...prev,
            typeId: prev.typeId || types[0]?.id || '',
            booleanCorrect: prev.booleanCorrect || 'verdadero',
          }));
        }
      } catch (error) {
        console.error('❌ Error preparando cuestionario:', error);
        showToast({
          type: 'error',
          title: 'Error al preparar cuestionario',
          description: error instanceof Error ? error.message : 'No se pudo crear el cuestionario.',
        });
      } finally {
        setQuestionnaireLoading(false);
      }
    };

    prepareQuestionnaire();
  }, [isOpen, step, createdTraining, questionnaireId, questionTypes.length, showToast]);

  if (!isOpen) return null;

  const selectedQuestionType = questionTypes.find((type) => type.id === questionDraft.typeId);
  const isBooleanSelected = selectedQuestionType ? isBooleanQuestionType(selectedQuestionType.name) : false;

  const handleInputChange = (field: 'title' | 'description', value: string) => {
    setForm((prev) => (field === 'title' ? { ...prev, title: value } : { ...prev, description: value }));
  };

  const handleFileChange = (type: 'image' | 'video') => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    revokePreview(type);

    let preview: string | null = null;
    if (file) {
      preview = URL.createObjectURL(file);
      previewUrls.current[type] = preview;
    }

    setForm((prev) =>
      type === 'image'
        ? { ...prev, imageFile: file, imagePreview: preview }
        : { ...prev, videoFile: file, videoPreview: preview }
    );

    event.target.value = '';
  };

  const handleCreateTraining = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      showToast({
        type: 'error',
        title: 'Campos obligatorios',
        description: 'Título y descripción son necesarios.',
      });
      return;
    }

    if (!form.imageFile || !form.videoFile) {
      showToast({
        type: 'error',
        title: 'Recursos faltantes',
        description: 'Debes subir la imagen de portada y el video.',
      });
      return;
    }

    const formData = new FormData();
    formData.append('title', form.title.trim());
    formData.append('description', form.description.trim());
    formData.append('image', form.imageFile);
    formData.append('video', form.videoFile);

    setLoading(true);

    try {
      const newTraining = await capacitacionesService.createTraining(formData);
      setCreatedTraining(newTraining);
      showToast({
        type: 'success',
        title: 'Capacitación creada',
        description: 'Ahora asigna las áreas correspondientes.',
      });
      setForm(createEmptyTrainingForm());
      revokePreview('image');
      revokePreview('video');
      setStep('areas');
    } catch (error) {
      console.error('❌ Error al crear capacitación:', error);
      showToast({
        type: 'error',
        title: 'Error al crear capacitación',
        description: error instanceof Error ? error.message : 'No se pudo crear la capacitación.',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAreaSelection = (areaId: string) => {
    if (assignedAreas.includes(areaId)) return;
    setSelectedAreas((prev) =>
      prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId]
    );
  };

  const handleAssignAreas = async () => {
    if (!createdTraining) {
      showToast({
        type: 'error',
        title: 'Capacitación incompleta',
        description: 'Crea la capacitación antes de asignarla.',
      });
      setStep('training');
      return;
    }

    if (selectedAreas.length === 0) {
      showToast({
        type: 'error',
        title: 'Selecciona un área',
        description: 'Debes elegir al menos un área para continuar.',
      });
      return;
    }

    setAssigningAreas(true);

    try {
      await Promise.all(
        selectedAreas.map((areaId) =>
          capacitacionesService.assignTrainingToArea(createdTraining.id, areaId)
        )
      );

      setAssignedAreas((prev) => Array.from(new Set([...prev, ...selectedAreas])));
      setSelectedAreas([]);
      showToast({
        type: 'success',
        title: 'Áreas asignadas',
        description: 'Las áreas seleccionadas ya tienen esta capacitación.',
      });
    } catch (error) {
      console.error('❌ Error al asignar áreas:', error);
      showToast({
        type: 'error',
        title: 'Error al asignar áreas',
        description: error instanceof Error ? error.message : 'No se pudieron asignar las áreas.',
      });
    } finally {
      setAssigningAreas(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!questionnaireId) {
      showToast({
        type: 'error',
        title: 'Cuestionario faltante',
        description: 'Debes generar el cuestionario antes de agregar preguntas.',
      });
      return;
    }

    if (!questionDraft.text.trim() || !questionDraft.typeId) {
      showToast({
        type: 'error',
        title: 'Información incompleta',
        description: 'Completa el texto de la pregunta y selecciona un tipo.',
      });
      return;
    }

    const selectedType = questionTypes.find((type) => type.id === questionDraft.typeId);
    const isBooleanType = selectedType ? isBooleanQuestionType(selectedType.name) : false;

    setCreatingQuestion(true);

    try {
      const newQuestion = await questionnaireService.createQuestion(
        questionnaireId,
        questionDraft.text.trim(),
        questionDraft.typeId
      );

      let newOptions: Option[] = [];

      if (isBooleanType) {
        const correctChoice = questionDraft.booleanCorrect;
        const [trueOption, falseOption] = await Promise.all([
          questionnaireService.createOption(newQuestion.id, 'Verdadero', correctChoice === 'verdadero'),
          questionnaireService.createOption(newQuestion.id, 'Falso', correctChoice === 'falso'),
        ]);
        newOptions = [trueOption, falseOption];
      }

      setQuestions((prev) => [...prev, { question: newQuestion, options: newOptions }]);

      if (!isBooleanType) {
        setOptionDrafts((prev) => ({
          ...prev,
          [newQuestion.id]: { text: '', isCorrect: false },
        }));
      }

      setQuestionDraft((prev) => ({ ...prev, text: '', booleanCorrect: 'verdadero' }));
      showToast({
        type: 'success',
        title: 'Pregunta creada',
        description: isBooleanType
          ? 'Se agregaron las opciones Verdadero/Falso automáticamente.'
          : 'Ahora agrega las respuestas correspondientes.',
      });
    } catch (error) {
      console.error('❌ Error al crear pregunta:', error);
      showToast({
        type: 'error',
        title: 'Error al crear pregunta',
        description: error instanceof Error ? error.message : 'No se pudo crear la pregunta.',
      });
    } finally {
      setCreatingQuestion(false);
    }
  };

  const handleOptionDraftChange = (
    questionId: string,
    field: 'text' | 'isCorrect',
    value: string | boolean
  ) => {
    setOptionDrafts((prev) => {
      const current = prev[questionId] ?? { text: '', isCorrect: false };
      return {
        ...prev,
        [questionId]: {
          text: field === 'text' ? (value as string) : current.text,
          isCorrect: field === 'isCorrect' ? (value as boolean) : current.isCorrect,
        },
      };
    });
  };

  const handleAddOption = async (questionId: string) => {
    const question = questions.find((item) => item.question.id === questionId)?.question;
    if (question && isBooleanQuestionType(question.question_types.name)) {
      showToast({
        type: 'info',
        title: 'Pregunta de Verdadero/Falso',
        description: 'Las opciones ya están creadas automáticamente para este tipo de pregunta.',
      });
      return;
    }

    const draft = optionDrafts[questionId] ?? { text: '', isCorrect: false };

    if (!draft.text.trim()) {
      showToast({
        type: 'error',
        title: 'Respuesta vacía',
        description: 'Escribe la respuesta antes de guardarla.',
      });
      return;
    }

    setOptionLoading((prev) => ({ ...prev, [questionId]: true }));

    try {
      const option = await questionnaireService.createOption(questionId, draft.text.trim(), draft.isCorrect);

      setQuestions((prev) =>
        prev.map((item) =>
          item.question.id === questionId
            ? { ...item, options: [...item.options, option] }
            : item
        )
      );

      setOptionDrafts((prev) => ({
        ...prev,
        [questionId]: { text: '', isCorrect: false },
      }));

      showToast({
        type: 'success',
        title: 'Respuesta guardada',
        description: 'La opción se añadió correctamente.',
      });
    } catch (error) {
      console.error('❌ Error al crear respuesta:', error);
      showToast({
        type: 'error',
        title: 'Error al crear respuesta',
        description: error instanceof Error ? error.message : 'No se pudo crear la respuesta.',
      });
    } finally {
      setOptionLoading((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const handleCompleteCreation = () => {
    const publishTraining = async () => {
      try {
        if (!createdTraining) {
          throw new Error('No se encontró la capacitación creada');
        }

        // Re-consultar la capacitación para asegurarnos de traer URL de imagen/video ya procesados
        const refreshed = await capacitacionesService.getTrainingById(createdTraining.id);
        onTrainingCreated(refreshed);
        showToast({
          type: 'success',
          title: 'Configuración finalizada',
          description: 'La capacitación ya aparece en el listado con sus recursos.',
        });
      } catch (error) {
        console.error('❌ Error finalizando configuración:', error);
        showToast({
          type: 'error',
          title: 'Error al finalizar',
          description: error instanceof Error ? error.message : 'No se pudo publicar la capacitación.',
        });
      } finally {
        onClose();
      }
    };

    publishTraining();
  };

  const handleClose = () => {
    onClose();
    resetWizard();
  };

  return (
    <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">Configuración guiada</p>
          <h2 className="text-xl font-semibold text-gray-900">
            {createdTraining ? createdTraining.title : 'Paso 1: Información de la capacitación'}
          </h2>
          {createdTraining && (
            <p className="text-sm text-gray-500 mt-1">
              ID: #{createdTraining.id.split('-')[0]}
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={handleClose}>
          Cerrar
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {creationSteps.map((wizardStep, index) => {
          const isActive = step === wizardStep.key;
          const isCompleted = creationSteps.findIndex((item) => item.key === step) > index;
          return (
            <div
              key={wizardStep.key}
              className={`rounded-xl border p-4 ${
                isActive
                  ? 'border-blue-500 bg-blue-50'
                  : isCompleted
                    ? 'border-blue-200 bg-white'
                    : 'border-gray-200 bg-white'
              }`}
            >
              <p className={`text-sm font-semibold ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>
                {index + 1}. {wizardStep.title}
              </p>
              <p className="text-sm text-gray-600">{wizardStep.description}</p>
            </div>
          );
        })}
      </div>

      {step === 'training' && (
        <div className="space-y-6">
          <TrainingMediaForm
            form={form}
            onInputChange={handleInputChange}
            onFileChange={handleFileChange}
            accentColor="blue"
            titlePlaceholder="Título de la capacitación"
            descriptionPlaceholder="Describe brevemente el objetivo del curso"
          />

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTraining}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              isLoading={loading}
            >
              Guardar capacitación
            </Button>
          </div>
        </div>
      )}

      {step === 'areas' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-600">
              Selecciona las áreas que deberán completar esta capacitación.
            </p>
            {assignedAreas.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs">
                {assignedAreas.map((areaId) => {
                  const area = areas.find((a) => a.id === areaId);
                  if (!area) return null;
                  return (
                    <span
                      key={areaId}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100"
                    >
                      {area.name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {areasLoading ? (
            <p className="text-sm text-gray-500">Cargando áreas...</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {areas.map((area) => {
                const selected = selectedAreas.includes(area.id);
                const alreadyAssigned = assignedAreas.includes(area.id);
                return (
                  <label
                    key={area.id}
                    className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition ${
                      selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    } ${alreadyAssigned ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={alreadyAssigned}
                      onChange={() => toggleAreaSelection(area.id)}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">{area.name}</span>
                  </label>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep('training')}>
                Volver
              </Button>
              <Button
                onClick={handleAssignAreas}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                isLoading={assigningAreas}
              >
                Asignar áreas seleccionadas
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => setStep('questionnaire')}
              disabled={assignedAreas.length === 0}
            >
              Continuar al cuestionario →
            </Button>
          </div>
        </div>
      )}

      {step === 'questionnaire' && (
        <div className="space-y-6">
          {questionnaireLoading ? (
            <p className="text-sm text-gray-500">Preparando cuestionario...</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Texto de la pregunta</label>
                  <textarea
                    value={questionDraft.text}
                    onChange={(e) => setQuestionDraft((prev) => ({ ...prev, text: e.target.value }))}
                    rows={4}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-500"
                    placeholder="¿Cuál es el objetivo principal de esta capacitación?"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Tipo de pregunta</label>
                  <select
                    value={questionDraft.typeId}
                    onChange={(e) =>
                      setQuestionDraft((prev) => ({
                        ...prev,
                        typeId: e.target.value,
                        booleanCorrect: prev.booleanCorrect || 'verdadero',
                      }))
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-500"
                  >
                    <option value="">Selecciona un tipo</option>
                    {questionTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                {isBooleanSelected && (
                  <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                    <p className="text-sm text-gray-600">Marca la respuesta correcta:</p>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="boolean-correct"
                        value="verdadero"
                        checked={questionDraft.booleanCorrect === 'verdadero'}
                        onChange={() =>
                          setQuestionDraft((prev) => ({ ...prev, booleanCorrect: 'verdadero' }))
                        }
                        className="accent-blue-600"
                      />
                      Verdadero
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="boolean-correct"
                        value="falso"
                        checked={questionDraft.booleanCorrect === 'falso'}
                        onChange={() =>
                          setQuestionDraft((prev) => ({ ...prev, booleanCorrect: 'falso' }))
                        }
                        className="accent-blue-600"
                      />
                      Falso
                    </label>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleCreateQuestion}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  isLoading={creatingQuestion}
                  disabled={!questionDraft.typeId}
                >
                  Agregar pregunta
                </Button>
              </div>

              <div className="space-y-4">
                {questions.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Todavía no has agregado preguntas. Empieza con la primera.
                  </p>
                ) : (
                  questions.map(({ question, options }) => {
                    const draft = optionDrafts[question.id] ?? { text: '', isCorrect: false };
                    const isBooleanTypeQuestion = isBooleanQuestionType(question.question_types.name);
                    return (
                      <div key={question.id} className="border rounded-xl p-4 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <p className="font-medium text-gray-800">{question.question_text}</p>
                            <p className="text-xs text-gray-500">Tipo: {question.question_types.name}</p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {options.length} respuesta{options.length === 1 ? '' : 's'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {options.length === 0 ? (
                            <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded">
                              Esta pregunta aún no tiene respuestas.
                            </p>
                          ) : (
                            options.map((opt) => (
                              <div
                                key={opt.id}
                                className={`text-sm px-3 py-2 rounded border ${
                                  opt.is_correct
                                    ? 'border-green-200 bg-green-50 text-green-700'
                                    : 'border-gray-200'
                                }`}
                              >
                                {opt.option_text}
                              </div>
                            ))
                          )}
                        </div>

                        {isBooleanTypeQuestion ? (
                          <p className="text-sm text-blue-700 bg-blue-50 border border-blue-100 px-3 py-2 rounded">
                            Las opciones Verdadero/Falso se crearon automáticamente para esta pregunta.
                          </p>
                        ) : (
                          <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <input
                              type="text"
                              value={draft.text}
                              onChange={(e) => handleOptionDraftChange(question.id, 'text', e.target.value)}
                              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-500"
                              placeholder="Escribe una opción de respuesta"
                            />
                            <label className="flex items-center gap-2 text-sm text-gray-600">
                              <input
                                type="checkbox"
                                checked={draft.isCorrect}
                                onChange={(e) => handleOptionDraftChange(question.id, 'isCorrect', e.target.checked)}
                                className="accent-blue-600"
                              />
                              Es correcta
                            </label>
                            <Button
                              size="sm"
                              onClick={() => handleAddOption(question.id)}
                              isLoading={optionLoading[question.id]}
                            >
                              Agregar respuesta
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep('areas')}>
                  Volver
                </Button>
                <Button variant="outline" onClick={handleCompleteCreation} disabled={questions.length === 0}>
                  Finalizar configuración
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
