import { useState, useCallback } from 'react';
import { apiService, AnalysisRequest, AnalysisResponse, ApiError } from '@/services/api';

export interface UseAnalysisReturn {
  // State
  isAnalyzing: boolean;
  error: string | null;
  result: AnalysisResponse | null;
  
  // Actions
  analyzeImage: (file: File) => Promise<void>;
  clearError: () => void;
  clearResult: () => void;
  reset: () => void;
}

export const useAnalysis = (): UseAnalysisReturn => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  const analyzeImage = useCallback(async (file: File) => {
    if (!file) {
      setError('No file selected');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size too large. Please select an image smaller than 10MB');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const analysisResult = await apiService.analyzeXRay({ file });
      setResult(analysisResult);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during analysis');
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  const reset = useCallback(() => {
    setIsAnalyzing(false);
    setError(null);
    setResult(null);
  }, []);

  return {
    isAnalyzing,
    error,
    result,
    analyzeImage,
    clearError,
    clearResult,
    reset,
  };
};
