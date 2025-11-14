import Image from 'next/image';
import { ChangeEvent } from 'react';
import { TrainingFormState } from '@/types/adminTraining';

type Props = {
  form: TrainingFormState;
  onInputChange: (field: 'title' | 'description', value: string) => void;
  onFileChange: (type: 'image' | 'video') => (event: ChangeEvent<HTMLInputElement>) => void;
  accentColor?: 'blue' | 'green';
  imageFallback?: string | null;
  videoFallback?: string | null;
  titlePlaceholder?: string;
  descriptionPlaceholder?: string;
};

const accentStyles = {
  blue: {
    focus: 'focus:ring-blue-500',
    label: 'text-blue-600',
    buttonText: 'text-blue-600',
    border: 'border-blue-500',
  },
  green: {
    focus: 'focus:ring-green-500',
    label: 'text-green-600',
    buttonText: 'text-green-600',
    border: 'border-green-500',
  },
} as const;

export function TrainingMediaForm({
  form,
  onInputChange,
  onFileChange,
  accentColor = 'blue',
  imageFallback,
  videoFallback,
  titlePlaceholder = 'Título de la capacitación',
  descriptionPlaceholder = 'Describe brevemente el objetivo del curso',
}: Props) {
  const accent = accentStyles[accentColor];
  const currentImage = form.imagePreview ?? imageFallback;
  const currentVideo = form.videoPreview ?? videoFallback;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Título</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => onInputChange('title', e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm ${accent.focus}`}
            placeholder={titlePlaceholder}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            rows={5}
            className={`w-full border rounded-lg px-3 py-2 text-sm ${accent.focus}`}
            placeholder={descriptionPlaceholder}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Imagen de portada</label>
          <div className="flex items-center gap-4">
            {currentImage ? (
              <Image
                src={currentImage}
                alt="Imagen de la capacitación"
                width={112}
                height={112}
                className="w-28 h-28 rounded-lg object-cover border"
                unoptimized
              />
            ) : (
              <div className="w-28 h-28 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                Sin imagen
              </div>
            )}
            <label className="flex-1 cursor-pointer border rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
              <span className={`font-medium ${accent.buttonText}`}>Actualizar imagen</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange('image')}
              />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Video</label>
          <div className="space-y-2">
            {currentVideo ? (
              <video src={currentVideo} controls className="w-full rounded-lg border max-h-48 bg-black" />
            ) : (
              <div className="h-32 border rounded-lg flex items-center justify-center text-xs text-gray-400">
                Sin video
              </div>
            )}
            <label className="flex cursor-pointer border rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 justify-between items-center">
              <span className={`font-medium ${accent.buttonText}`}>Seleccionar video</span>
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={onFileChange('video')}
              />
              <span className="text-xs text-gray-400">MP4, AVI, MOV</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
