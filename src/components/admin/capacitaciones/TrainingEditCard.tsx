import { useEffect, useRef, useState, ChangeEvent } from 'react';
import { Trainings } from '@/types/capacitacion';
import { TrainingFormState, createEmptyTrainingForm } from '@/types/adminTraining';
import { capacitacionesService } from '@/services/capacitacionesService';
import { TrainingMediaForm } from './TrainingMediaForm';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { adminService } from '@/services/adminService';
import { questionnaireService } from '@/services/questionnaireService';
import { Option, Question, QuestionType } from '@/types/questionnaire';
import { isBooleanQuestionType } from '@/lib/utils';
import { buildMediaUrl } from '@/lib/media';

interface Props {
  trainingId: string | null;
  onClose: () => void;
  onTrainingUpdated: (training: Trainings) => void;
}

type PreviewStore = {
  image: string | null;
  video: string | null;
};

type AreaOption = Awaited<ReturnType<typeof adminService.getAreas>>[number];
type QuestionWithOptions = { question: Question; options: Option[] };
type BooleanChoice = 'verdadero' | 'falso';
const editSteps = [
  { key: 'training', title: 'Capacitación', description: 'Información base' },
  { key: 'areas', title: 'Áreas', description: 'Asignaciones' },
  { key: 'questionnaire', title: 'Cuestionario', description: 'Preguntas y respuestas' },
] as const;
type EditStep = (typeof editSteps)[number]['key'];

export function TrainingEditCard({ trainingId, onClose, onTrainingUpdated }: Props) {
  const [activeStep, setActiveStep] = useState<EditStep>('training');
  const [training, setTraining] = useState<Trainings | null>(null);
  const [form, setForm] = useState<TrainingFormState>(createEmptyTrainingForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const previewUrls = useRef<PreviewStore>({ image: null, video: null });
  const { showToast } = useToast();

  // Áreas
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [assignedAreas, setAssignedAreas] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [assigningAreas, setAssigningAreas] = useState(false);

  // Cuestionario
  const [questionnaireId, setQuestionnaireId] = useState<string | null>(null);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
  const [questionDraft, setQuestionDraft] = useState<{
    text: string;
    typeId: string;
    booleanCorrect: BooleanChoice;
  }>({ text: '', typeId: '', booleanCorrect: 'verdadero' });
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [optionDrafts, setOptionDrafts] = useState<Record<string, { text: string; isCorrect: boolean }>>({});
  const [optionLoading, setOptionLoading] = useState<Record<string, boolean>>({});

  const revokePreview = (type: 'image' | 'video') => {
    const url = previewUrls.current[type];
    if (url) {
      URL.revokeObjectURL(url);
      previewUrls.current[type] = null;
    }
  };

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

  useEffect(() => {
    const loadTraining = async () => {
      if (!trainingId) return;
      setLoading(true);

      try {
        const data = await capacitacionesService.getTrainingById(trainingId);
        setTraining(data);
        setForm({
          title: data.title,
          description: data.description,
          imageFile: null,
          videoFile: null,
          imagePreview: null,
          videoPreview: null,
        });
      } catch (error) {
        console.error('❌ Error al cargar la capacitación:', error);
        showToast({
          type: 'error',
          title: 'Error al cargar',
          description: error instanceof Error ? error.message : 'No se pudo cargar la capacitación.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadTraining();
  }, [trainingId, showToast]);

  useEffect(() => {
    if (!trainingId) return;
    let isMounted = true;

    const loadAreasAndAssignments = async () => {
      try {
        setAreasLoading(true);
        const [areasData, assignments] = await Promise.all([
          adminService.getAreas(),
          adminService.getAssignments(),
        ]);
        if (!isMounted) return;
        setAreas(areasData);
        const assigned = assignments
          .filter((item) => item.trainings?.id === trainingId)
          .map((item) => item.area.id);
        setAssignedAreas(Array.from(new Set(assigned)));
      } catch (error) {
        console.error('❌ Error al cargar áreas:', error);
        showToast({
          type: 'error',
          title: 'Error al cargar áreas',
          description: error instanceof Error ? error.message : 'No se pudieron cargar las áreas.',
        });
      } finally {
        if (isMounted) setAreasLoading(false);
      }
    };

    const loadQuestionTypes = async () => {
      try {
        const types = await questionnaireService.getQuestionTypes();
        if (!isMounted) return;
        setQuestionTypes(types);
        setQuestionDraft((prev) => ({
          ...prev,
          typeId: prev.typeId || types[0]?.id || '',
          booleanCorrect: prev.booleanCorrect || 'verdadero',
        }));
      } catch (error) {
        console.error('❌ Error al obtener tipos de pregunta:', error);
        showToast({
          type: 'error',
          title: 'Error de cuestionario',
          description: error instanceof Error ? error.message : 'No se pudieron cargar los tipos de pregunta.',
        });
      }
    };

    const loadQuestionsData = async () => {
      try {
        setQuestionsLoading(true);
        const fetchedQuestions = await questionnaireService.getQuestionsByTrainingId(trainingId);
        if (!isMounted) return;

        if (fetchedQuestions.length > 0 && fetchedQuestions[0].questionnaires) {
          setQuestionnaireId(fetchedQuestions[0].questionnaires.id);
        }

        const questionsWithOptions = await Promise.all(
          fetchedQuestions.map(async (question) => {
            try {
              const options = await questionnaireService.getOption(question.id);
              return { question, options };
            } catch (error) {
              console.error('❌ Error obteniendo opciones:', error);
              return { question, options: [] };
            }
          })
        );

        if (!isMounted) return;
        setQuestions(questionsWithOptions);
        setOptionDrafts((prev) => {
          const next = { ...prev };
          questionsWithOptions.forEach(({ question }) => {
            if (!isBooleanQuestionType(question.question_types.name) && !next[question.id]) {
              next[question.id] = { text: '', isCorrect: false };
            }
          });
          return next;
        });
      } catch (error) {
        console.error('❌ Error al obtener preguntas:', error);
        showToast({
          type: 'error',
          title: 'Error de cuestionario',
          description: error instanceof Error ? error.message : 'No se pudieron cargar las preguntas.',
        });
      } finally {
        if (isMounted) setQuestionsLoading(false);
      }
    };

    loadAreasAndAssignments();
    loadQuestionTypes();
    loadQuestionsData();

    return () => {
      isMounted = false;
      revokePreview('image');
      revokePreview('video');
    };
  }, [trainingId, showToast]);

  const handleUpdate = async () => {
    if (!training) return;

    if (!form.title.trim() || !form.description.trim()) {
      showToast({
        type: 'error',
        title: 'Campos obligatorios',
        description: 'Título y descripción son requeridos.',
      });
      return;
    }

    const payload: {
      title?: string;
      description?: string;
      video?: File | null;
      image?: File | null;
    } = {};

    if (form.title !== training.title) {
      payload.title = form.title.trim();
    }

    if (form.description !== training.description) {
      payload.description = form.description.trim();
    }

    if (form.imageFile) {
      payload.image = form.imageFile;
    }

    if (form.videoFile) {
      payload.video = form.videoFile;
    }

    if (Object.keys(payload).length === 0) {
      showToast({
        type: 'info',
        title: 'Sin cambios',
        description: 'Realiza algún ajuste antes de guardar.',
      });
      return;
    }

    setSaving(true);

    try {
      const updated = await capacitacionesService.updateTraining(training.id, payload);
      setTraining(updated);
      onTrainingUpdated(updated);
      revokePreview('image');
      revokePreview('video');
      setForm({
        title: updated.title,
        description: updated.description,
        imageFile: null,
        videoFile: null,
        imagePreview: null,
        videoPreview: null,
      });
      showToast({
        type: 'success',
        title: 'Capacitación actualizada',
        description: 'Los cambios se guardaron correctamente.',
      });
    } catch (error) {
      console.error('❌ Error al actualizar capacitación:', error);
      showToast({
        type: 'error',
        title: 'Error al actualizar',
        description: error instanceof Error ? error.message : 'No se pudo actualizar la capacitación.',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleAreaSelection = (areaId: string) => {
    if (assignedAreas.includes(areaId)) return;
    setSelectedAreas((prev) =>
      prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId]
    );
  };

  const handleAssignAreas = async () => {
    if (!training) return;
    const pendingAreas = selectedAreas.filter((id) => !assignedAreas.includes(id));

    if (pendingAreas.length === 0) {
      showToast({
        type: 'info',
        title: 'Sin áreas nuevas',
        description: 'Selecciona al menos un área no asignada.',
      });
      return;
    }

    setAssigningAreas(true);

    try {
      await Promise.all(
        pendingAreas.map((areaId) =>
          capacitacionesService.assignTrainingToArea(training.id, areaId)
        )
      );

      setAssignedAreas((prev) => Array.from(new Set([...prev, ...pendingAreas])));
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

  const ensureQuestionnaire = async (): Promise<string | null> => {
    if (questionnaireId) return questionnaireId;
    if (!trainingId) return null;

    try {
      const questionnaire = await questionnaireService.createQuestionnaire(trainingId);
      setQuestionnaireId(questionnaire.id);
      return questionnaire.id;
    } catch (error) {
      console.error('❌ Error al crear cuestionario:', error);
      showToast({
        type: 'error',
        title: 'Error de cuestionario',
        description: error instanceof Error ? error.message : 'No se pudo crear el cuestionario.',
      });
      return null;
    }
  };

  const handleCreateQuestion = async () => {
    const qId = questionnaireId || (await ensureQuestionnaire());
    if (!qId) return;

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
        qId,
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

  const selectedQuestionType = questionTypes.find((type) => type.id === questionDraft.typeId);
  const isBooleanSelected = selectedQuestionType ? isBooleanQuestionType(selectedQuestionType.name) : false;

  if (!trainingId) return null;

  return (
    <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">Editar capacitación</p>
          <h2 className="text-xl font-semibold text-gray-800">
            {training ? training.title : 'Seleccionando capacitación...'}
          </h2>
          {training && (
            <p className="text-sm text-gray-500 mt-1">
              ID: #{training.id.split('-')[0]} · Autor: {training.user?.first_name} {training.user?.last_name}
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
          Cerrar
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {editSteps.map((step) => (
          <button
            key={step.key}
            onClick={() => setActiveStep(step.key)}
            className={`text-left rounded-xl border p-4 transition ${
              activeStep === step.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-200'
            }`}
            type="button"
          >
            <p className={`text-sm font-semibold ${activeStep === step.key ? 'text-blue-700' : 'text-gray-600'}`}>
              {step.title}
            </p>
            <p className="text-sm text-gray-500">{step.description}</p>
          </button>
        ))}
      </div>

      {activeStep === 'training' && (
        <>
          {loading ? (
            <p className="text-sm text-gray-500">Cargando datos de la capacitación...</p>
          ) : training ? (
            <TrainingMediaForm
              form={form}
              onInputChange={handleInputChange}
              onFileChange={handleFileChange}
              accentColor="blue"
              imageFallback={buildMediaUrl(training.url_image)}
              videoFallback={buildMediaUrl(training.url_video)}
              titlePlaceholder="Título de la capacitación"
              descriptionPlaceholder="Resumen de la capacitación"
            />
          ) : (
            <p className="text-sm text-red-600">No se encontró la capacitación seleccionada.</p>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              isLoading={saving}
              disabled={saving || loading || !training}
            >
              Guardar cambios
            </Button>
          </div>
        </>
      )}

      {activeStep === 'areas' && (
        <div className="space-y-5">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-600">
              Selecciona nuevas áreas para asignar esta capacitación. Las áreas ya asignadas aparecen bloqueadas.
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
          ) : areas.length === 0 ? (
            <p className="text-sm text-gray-500">No hay áreas registradas.</p>
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

          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setSelectedAreas([])}
              disabled={assigningAreas || selectedAreas.length === 0}
            >
              Limpiar selección
            </Button>
            <Button
              onClick={handleAssignAreas}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              isLoading={assigningAreas}
              disabled={assigningAreas || selectedAreas.length === 0}
            >
              Asignar áreas seleccionadas
            </Button>
          </div>
        </div>
      )}

      {activeStep === 'questionnaire' && (
        <div className="space-y-6">
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
                    onChange={() => setQuestionDraft((prev) => ({ ...prev, booleanCorrect: 'falso' }))}
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
            {questionsLoading ? (
              <p className="text-sm text-gray-500">Cargando preguntas existentes...</p>
            ) : questions.length === 0 ? (
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
        </div>
      )}
    </div>
  );
}
