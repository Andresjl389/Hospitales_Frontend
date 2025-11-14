export type TrainingFormState = {
  title: string;
  description: string;
  imageFile: File | null;
  videoFile: File | null;
  imagePreview: string | null;
  videoPreview: string | null;
};

export const createEmptyTrainingForm = (): TrainingFormState => ({
  title: '',
  description: '',
  imageFile: null,
  videoFile: null,
  imagePreview: null,
  videoPreview: null,
});
