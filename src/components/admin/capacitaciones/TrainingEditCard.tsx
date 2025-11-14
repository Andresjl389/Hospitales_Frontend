import { useEffect, useRef, useState, ChangeEvent } from 'react';
import { Trainings } from '@/types/capacitacion';
import { TrainingFormState, createEmptyTrainingForm } from '@/types/adminTraining';
import { capacitacionesService } from '@/services/capacitacionesService';
import { TrainingMediaForm } from './TrainingMediaForm';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';

interface Props {
  trainingId: string | null;
  onClose: () => void;
  onTrainingUpdated: (training: Trainings) => void;
}

type PreviewStore = {
  image: string | null;
  video: string | null;
};

export function TrainingEditCard({ trainingId, onClose, onTrainingUpdated }: Props) {
  const [training, setTraining] = useState<Trainings | null>(null);
  const [form, setForm] = useState<TrainingFormState>(createEmptyTrainingForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const previewUrls = useRef<PreviewStore>({ image: null, video: null });
  const { showToast } = useToast();

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
    return () => {
      revokePreview('image');
      revokePreview('video');
    };
  }, []);

  if (!trainingId) return null;

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

  return (
    <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-6 space-y-5">
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

      {loading ? (
        <p className="text-sm text-gray-500">Cargando datos de la capacitación...</p>
      ) : training ? (
        <TrainingMediaForm
          form={form}
          onInputChange={handleInputChange}
          onFileChange={handleFileChange}
          accentColor="blue"
          imageFallback={training.url_image}
          videoFallback={training.url_video}
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
    </div>
  );
}
