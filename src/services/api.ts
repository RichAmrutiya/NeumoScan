// API service for communicating with Google Colab backend
export interface AnalysisRequest {
  file: File;
}

export interface AnalysisResponse {
  result: 'pneumonia' | 'normal';
  confidence: number;
  fileName: string;
  fileSize: number;
  processingTime?: number;
  modelVersion?: string;
  gradCamImage?: string;
  error?: string;
}

export interface AiAssistantRequest {
  question: string;
  prediction: string;
  confidence: number;
  riskLevel: string;
  hasHeatmap: boolean;
}

export interface AiAssistantResponse {
  answer: string;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    // Use environment variable or default to localhost for development
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  }

  /**
   * Upload and analyze an X-ray image
   */
  async analyzeXRay(request: AnalysisRequest): Promise<AnalysisResponse> {
    const formData = new FormData();
    formData.append('file', request.file);

    try {
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, let browser set it with boundary
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `HTTP error! status: ${response.status}`,
          response.status,
          errorData
        );
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data.result || !data.confidence) {
        throw new ApiError('Invalid response format from server');
      }

      return {
        result: data.result,
        confidence: data.confidence,
        fileName: request.file.name,
        fileSize: request.file.size,
        processingTime: data.processingTime,
        modelVersion: data.modelVersion,
        gradCamImage: data.gradCamImage,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(
          'Unable to connect to the analysis server. Please check if your Colab backend is running.',
          0,
          { originalError: error.message }
        );
      }
      
      throw new ApiError(
        'An unexpected error occurred during analysis',
        0,
        { originalError: error }
      );
    }
  }

  /**
   * Ask the AI doctor assistant about an analysis result
   */
  async askAssistant(payload: AiAssistantRequest): Promise<AiAssistantResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `Assistant error! status: ${response.status}`,
          response.status,
          errorData
        );
      }

      const data = await response.json();
      if (!data.answer) {
        throw new ApiError('Invalid response from AI assistant');
      }

      return { answer: data.answer as string };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        'An unexpected error occurred while contacting the AI assistant',
        0,
        { originalError: error }
      );
    }
  }

  /**
   * Check if the API server is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get server status and information
   */
  async getServerInfo(): Promise<{ status: string; modelVersion?: string; uptime?: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new ApiError(`Server status check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to get server information');
    }
  }
}

// Custom error class for API errors
class ApiError extends Error {
  public status?: number;
  public details?: any;

  constructor(message: string, status?: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export { ApiError };
