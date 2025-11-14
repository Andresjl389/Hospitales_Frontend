// src/types/questionnaire.ts
import { Trainings } from "./capacitacion";
import { UserInfo } from "./auth";

export interface OptionBase {
  is_correct: boolean;
  option_text: string;
}

export interface Option extends OptionBase {
  id: string;
  questions: Question;
}

export interface Question {
  id: string;
  question_text: string;
  question_types: QuestionType;
  questionnaires: Questionnaire;
}

export interface QuestionInfo {
  question_text: string;
}

export interface QuestionType {
  id: string;
  name: string;
}

export interface Questionnaire {
  id: string;
  trainings: Trainings;
}

// ============================================
// NUEVOS TIPOS PARA EL SISTEMA DE RESPUESTAS
// ============================================

/**
 * Request para crear/actualizar respuesta de usuario
 */
export interface UserAnswerRequest {
  question_id: string;
  option_id?: string;        // Para respuesta única (single, boolean)
  option_ids?: string[];     // Para selección múltiple (multiple)
}

/**
 * Response del backend al guardar una respuesta
 */
export interface UserAnswerResponse {
  id: string;
  answer_date: string;
  user: UserInfo;
  questions: QuestionInfo;
  options: OptionBase;
}

export interface ResultResponse {
  id: string;
  score: number;
  status: string;
  created_at: string;
  user_id: string;
  questionnaire_id: string;
}
