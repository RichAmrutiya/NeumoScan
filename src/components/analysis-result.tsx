import { CheckCircle, AlertTriangle, Activity, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface AnalysisResultProps {
  result: 'pneumonia' | 'normal' | null;
  confidence?: number;
  onNewAnalysis: () => void;
}

export const AnalysisResult = ({ result, confidence, onNewAnalysis }: AnalysisResultProps) => {
  if (!result) return null;

  const isPneumonia = result === 'pneumonia';

  const pneumoniaRecommendations = [
    "Consult a healthcare professional immediately",
    "Get plenty of rest and stay hydrated",
    "Take prescribed medications as directed",
    "Monitor symptoms and temperature regularly",
    "Consider warm salt water gargles for throat comfort",
    "Use a humidifier to ease breathing"
  ];

  const normalRecommendations = [
    "Maintain regular exercise for lung health",
    "Avoid smoking and secondhand smoke",
    "Get vaccinated against flu and pneumonia",
    "Practice good hand hygiene",
    "Eat a balanced diet rich in vitamins",
    "Consider annual health check-ups"
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Result Header */}
      <Card className="medical-card">
        <CardHeader className="text-center pb-4">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
            isPneumonia ? 'bg-medical-danger/10' : 'bg-medical-success/10'
          }`}>
            {isPneumonia ? (
              <AlertTriangle className="w-8 h-8 text-medical-danger" />
            ) : (
              <CheckCircle className="w-8 h-8 text-medical-success" />
            )}
          </div>
          
          <CardTitle className="text-2xl font-bold">
            {isPneumonia ? 'Pneumonia Detected' : 'No Pneumonia Detected'}
          </CardTitle>
          
          {confidence && (
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Confidence: {confidence.toFixed(1)}%</span>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="text-center">
          <p className={`text-lg ${isPneumonia ? 'text-medical-danger' : 'text-medical-success'}`}>
            {isPneumonia 
              ? 'Our AI model has detected signs consistent with pneumonia in your X-ray.'
              : 'Great news! No signs of pneumonia were detected in your X-ray.'
            }
          </p>
          
          {isPneumonia && (
            <div className="mt-4 p-4 bg-medical-danger/5 border border-medical-danger/20 rounded-lg">
              <p className="text-sm text-foreground">
                <strong>Important:</strong> This is an AI screening tool and should not replace professional medical diagnosis. 
                Please consult with a healthcare provider for proper evaluation and treatment.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-primary" />
            <span>{isPneumonia ? 'Recommended Actions' : 'Preventive Measures'}</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <ul className="space-y-3">
            {(isPneumonia ? pneumoniaRecommendations : normalRecommendations).map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  isPneumonia ? 'bg-medical-danger' : 'bg-medical-success'
                }`} />
                <span className="text-sm text-foreground">{recommendation}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="text-center">
        <Button 
          onClick={onNewAnalysis}
          className="medical-button-primary"
          size="lg"
        >
          Analyze Another X-Ray
        </Button>
      </div>
    </div>
  );
};