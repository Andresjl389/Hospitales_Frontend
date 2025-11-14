// src/services/questionnaireService.ts
import {
  Question,
  Option,
  UserAnswerRequest,
  UserAnswerResponse,
  ResultResponse,
  Questionnaire,
  QuestionType,
} from "@/types/questionnaire";
import { authService } from "./authService";
import { API_URL } from "@/lib/constants";

class QuestionnaireService {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // Si es 401, el token expiró o es inválido
      if (response.status === 401) {
        console.log("🔒 Token inválido, intentando refrescar...");
        const newToken = await authService.refreshToken();

        if (!newToken) {
          throw new Error(
            "Sesión expirada. Por favor, inicia sesión nuevamente."
          );
        }

        throw new Error("Token refrescado, reintenta la operación");
      }

      const errorText = await response.text();
      throw new Error(
        errorText || `Error ${response.status}: ${response.statusText}`
      );
    }
    return await response.json();
  }

  async getQuestionsByTrainingId(id_training: string): Promise<Question[]> {
    try {
      if (!id_training) {
        throw new Error("ID de usuario no proporcionado");
      }

      // Construcción correcta de la URL con query param
      const url = `${API_URL}/evaluations/questions?training_id=${encodeURIComponent(
        id_training
      )}`;

      const response = await fetch(url, {
        credentials: "include",
      });

      const data = await this.handleResponse<Question[]>(response);
      console.log("✅ Preguntas", data);

      return data;
    } catch (error) {
      console.error("❌ Error al obtener las preguntas:", error);
      throw error;
    }
  }

  async getOption(id_question: string): Promise<Option[]>{
    try{
      if (!id_question){
        throw new Error("ID de question no proporcionado")
      }
      
      // Construcción correcta de la URL con query param
      const url = `${API_URL}/evaluations/options?question_id=${encodeURIComponent(
        id_question
      )}`;

      const response = await fetch(url, {
        credentials: "include",
      });

      const data = await this.handleResponse<Option[]>(response);
      console.log("✅ opciones", data);

      return data;
    }catch(error){
      console.error("❌ Error al obtener las opciones:", error);
      throw error;
    }
  }

  /**
   * Actualiza o crea respuestas del usuario
   * Soporta tanto respuesta única como selección múltiple
   * 
   * @param questionId - ID de la pregunta
   * @param optionId - ID de la opción (para respuesta única)
   * @param optionIds - Array de IDs de opciones (para selección múltiple)
   * @returns Respuesta del servidor
   */
  async updateUserAnswer(
    questionId: string, 
    optionId?: string, 
    optionIds?: string[]
  ): Promise<UserAnswerResponse | UserAnswerResponse[]> {
    try {
      console.log(`📡 SERVICIO - Actualizando respuesta:`, {
        questionId,
        optionId,
        optionIds
      });

      const url = `${API_URL}/results/user_answer`;

      // Construir el body según el tipo de respuesta
      const body: UserAnswerRequest = {
        question_id: questionId
      };

      if (optionIds && optionIds.length > 0) {
        body.option_ids = optionIds;
      } else if (optionId) {
        body.option_id = optionId;
      } else {
        throw new Error("Debe proporcionar option_id u option_ids");
      }

      const response = await fetch(url, {
        method: 'PUT',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      const data = await this.handleResponse<UserAnswerResponse | UserAnswerResponse[]>(response);
      console.log(`✅ SERVICIO - Respuesta actualizada correctamente`);

      return data;
    } catch (error) {
      console.error("❌ SERVICIO - Error al actualizar respuesta:", error);
      throw error;
    }
  }

  /**
   * Crea el resultado final del cuestionario
   */
  async createResult(questionnaireId: string): Promise<ResultResponse> {
    try {
      console.log(`📡 SERVICIO - Creando resultado para cuestionario: ${questionnaireId}`);

      const url = `${API_URL}/results/${questionnaireId}`;

      const response = await fetch(url, {
        method: 'POST',
        credentials: "include",
      });

      const data = await this.handleResponse<ResultResponse>(response);
      console.log(`✅ SERVICIO - Resultado creado:`, data);

      return data;
    } catch (error) {
      console.error("❌ SERVICIO - Error al crear resultado:", error);
      throw error;
    }
  }

  /**
   * Obtiene un resultado específico por su ID
   */
  async getResultById(resultId: string): Promise<ResultResponse> {
    try {
      console.log(`📡 SERVICIO - Obteniendo resultado: ${resultId}`);

      const url = `${API_URL}/results/${resultId}`;

      const response = await fetch(url, {
        credentials: "include",
      });

      const data = await this.handleResponse<ResultResponse>(response);
      console.log(`✅ SERVICIO - Resultado obtenido:`, data);

      return data;
    } catch (error) {
      console.error("❌ SERVICIO - Error al obtener resultado:", error);
      throw error;
    }
  }

  /**
   * Obtiene las respuestas del usuario por result_id (para feedback)
   */
  async getAnswersByResult(resultId: string): Promise<UserAnswerResponse[]> {
    try {
      console.log(`📡 SERVICIO - Obteniendo respuestas por resultado: ${resultId}`);

      const url = `${API_URL}/results/${resultId}/answers`;

      const response = await fetch(url, {
        credentials: "include",
      });

      const data = await this.handleResponse<UserAnswerResponse[]>(response);
      console.log(`✅ SERVICIO - Respuestas obtenidas:`, data.length);

      return data;
    } catch (error) {
      console.error("❌ SERVICIO - Error al obtener respuestas:", error);
      throw error;
    }
  }

  async getQuestionTypes(): Promise<QuestionType[]> {
    try {
      console.log("📡 Obteniendo tipos de preguntas...");
      const response = await fetch(`${API_URL}/evaluations/question_types`, {
        credentials: "include",
      });
      return await this.handleResponse<QuestionType[]>(response);
    } catch (error) {
      console.error("❌ Error al obtener tipos de preguntas:", error);
      throw error;
    }
  }

  async createQuestionnaire(trainingId: string): Promise<Questionnaire> {
    try {
      if (!trainingId) {
        throw new Error("ID de capacitación no proporcionado");
      }

      console.log("📡 Creando cuestionario para training:", trainingId);
      const response = await fetch(`${API_URL}/questionnaires`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ training_id: trainingId }),
      });

      return await this.handleResponse<Questionnaire>(response);
    } catch (error) {
      console.error("❌ Error al crear cuestionario:", error);
      throw error;
    }
  }

  async createQuestion(
    questionnaireId: string,
    questionText: string,
    questionTypeId: string
  ): Promise<Question> {
    try {
      if (!questionnaireId) {
        throw new Error("ID de cuestionario no proporcionado");
      }

      console.log("📡 Creando pregunta:", questionText);
      const response = await fetch(`${API_URL}/evaluations/questions`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          question_text: questionText,
          question_type_id: questionTypeId,
          questionnaire_id: questionnaireId,
        }),
      });

      return await this.handleResponse<Question>(response);
    } catch (error) {
      console.error("❌ Error al crear pregunta:", error);
      throw error;
    }
  }

  async createOption(
    questionId: string,
    optionText: string,
    isCorrect: boolean
  ): Promise<Option> {
    try {
      if (!questionId) {
        throw new Error("ID de pregunta no proporcionado");
      }

      const response = await fetch(`${API_URL}/evaluations/option`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          question_id: questionId,
          option_text: optionText,
          is_correct: isCorrect,
        }),
      });

      return await this.handleResponse<Option>(response);
    } catch (error) {
      console.error("❌ Error al crear opción:", error);
      throw error;
    }
  }
}

export const questionnaireService = new QuestionnaireService();
