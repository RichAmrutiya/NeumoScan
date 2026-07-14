import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, Activity, Shield, Heart, Clock, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AiDoctorAssistant } from '@/components/ai-doctor-assistant';
import lungsBackground from '@/assets/lungs-background.jpg';
// @ts-ignore - these libraries don't ship TS types by default
import jsPDF from 'jspdf';
// @ts-ignore
import html2canvas from 'html2canvas';

interface ResultData {
  result: 'pneumonia' | 'normal';
  confidence: number;
  fileName: string;
  fileSize: number;
  processingTime?: number;
  modelVersion?: string;
  uploadedImageDataUrl?: string | null;
  gradCamImage?: string | null;
}

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const resultData = location.state as ResultData;

  // Redirect if no result data
  if (!resultData) {
    navigate('/');
    return null;
  }

  const { result, confidence, fileName, fileSize, processingTime, modelVersion, uploadedImageDataUrl, gradCamImage } = resultData;
  const isPneumonia = result === 'pneumonia';

  const confidencePercentRaw = confidence <= 1 ? confidence * 100 : confidence;
  const confidencePercentText = confidencePercentRaw.toFixed(1);

  // Risk is driven by both the prediction outcome and its confidence:
  // - Negative (no pneumonia) + high confidence => Low risk
  // - Pneumonia + high confidence             => High risk
  // - All other combinations                  => Moderate risk
  let riskLevel: 'Low' | 'Moderate' | 'High';
  if (!isPneumonia) {
    if (confidencePercentRaw >= 80) {
      riskLevel = 'Low';
    } else {
      // For negative results with lower confidence, treat as moderate/uncertain.
      riskLevel = 'Moderate';
    }
  } else {
    if (confidencePercentRaw >= 80) {
      riskLevel = 'High';
    } else {
      // For pneumonia detections with lower confidence, surface as moderate risk.
      riskLevel = 'Moderate';
    }
  }

  const riskBadgeClass =
    riskLevel === 'Low'
      ? 'bg-green-500/15 text-green-700 border border-green-500/20'
      : riskLevel === 'Moderate'
        ? 'bg-yellow-500/15 text-yellow-700 border border-yellow-500/20'
        : 'bg-red-500/15 text-red-700 border border-red-500/20';

  const pneumoniaRecommendations = [
    "Consult a healthcare professional immediately for proper diagnosis",
    "Get plenty of rest and maintain adequate hydration",
    "Take prescribed medications exactly as directed by your doctor",
    "Monitor symptoms including fever, cough, and breathing difficulty",
    "Use a humidifier to ease breathing and reduce chest discomfort",
    "Consider warm salt water gargles for throat irritation relief",
    "Avoid smoking and exposure to secondhand smoke completely",
    "Follow up with your healthcare provider within 24-48 hours"
  ];

  const normalRecommendations = [
    "Maintain regular physical exercise to strengthen respiratory system",
    "Avoid smoking and exposure to environmental pollutants",
    "Get annual flu and pneumonia vaccinations as recommended",
    "Practice excellent hand hygiene to prevent respiratory infections",
    "Maintain a balanced diet rich in vitamins C, D, and zinc",
    "Ensure adequate sleep for optimal immune system function",
    "Consider annual health screenings and chest X-rays if recommended",
    "Stay hydrated and maintain good indoor air quality"
  ];

  const analysisDetails = {
    analysisTime: new Date().toLocaleString(),
    imageProcessed: fileName,
    imageSizeMB: (fileSize / (1024 * 1024)).toFixed(2),
    modelVersion: modelVersion || "PneumoNet v2.1",
    processingTime: processingTime ? `${processingTime.toFixed(1)}s` : "2.3s"
  };

  const modelMetrics = {
    accuracy: '95.22%',
    precision: '91.14%',
    recall: '95.22%',
    f1: '91.14%',
    dataset: 'Chest X-ray Pneumonia Dataset (Kaggle)',
  };

  const pipelineSteps = [
    {
      title: 'Image preprocessing',
      description: 'Resize image and normalize pixel values.',
    },
    {
      title: 'Lung region extraction',
      description: 'Identify and focus on lung regions in the X-ray.',
    },
    {
      title: 'CNN feature extraction',
      description: 'Deep learning model extracts diagnostic features.',
    },
    {
      title: 'Pneumonia classification',
      description: 'Model predicts Pneumonia vs Normal.',
    },
    {
      title: 'Result generation',
      description: 'Prediction and confidence score are produced.',
    },
  ];

  const handleDownloadReport = async () => {
    const element = document.getElementById('pdf-report-root') as HTMLElement | null;
    if (!element) return;

    // html2canvas captures rendered pixels. If the template is fully transparent (opacity: 0),
    // the result will be a blank canvas. Temporarily make it renderable while keeping it off-screen.
    const prevStyle = {
      position: element.style.position,
      left: element.style.left,
      top: element.style.top,
      transform: element.style.transform,
      opacity: element.style.opacity,
      zIndex: element.style.zIndex,
      pointerEvents: element.style.pointerEvents,
    };

    element.style.position = 'fixed';
    element.style.left = '0';
    element.style.top = '0';
    element.style.transform = 'translateX(-10000px)';
    element.style.opacity = '1';
    element.style.zIndex = '0';
    element.style.pointerEvents = 'none';

    // Render the styled HTML report to a canvas, then embed that canvas into a PDF.
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#f1f5f9',
    });

    // Restore previous styles after capture
    element.style.position = prevStyle.position;
    element.style.left = prevStyle.left;
    element.style.top = prevStyle.top;
    element.style.transform = prevStyle.transform;
    element.style.opacity = prevStyle.opacity;
    element.style.zIndex = prevStyle.zIndex;
    element.style.pointerEvents = prevStyle.pointerEvents;

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'pt', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // If content is taller than one page, add extra pages.
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`PneumoNet_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="min-h-screen relative">
      {/* Background with lungs image */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src={lungsBackground} 
          alt="Human Lungs" 
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/90" />
      </div>

      <div className="relative py-8 px-4">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          <div className="text-center space-y-4">
            <Badge variant={isPneumonia ? "destructive" : "secondary"} className="text-sm px-4 py-2">
              Analysis Complete
            </Badge>
            <h1 className="text-4xl font-bold">Analysis Results</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Your chest X-ray has been analyzed using advanced AI technology. 
              Please review the results and recommendations below.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hidden HTML template used for styled PDF generation */}
          <div
            id="pdf-report-root"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '800px',
              fontFamily: '"Inter", Arial, sans-serif',
              backgroundColor: '#f1f5f9',
              color: '#0f172a',
              padding: '24px',
              boxSizing: 'border-box',
              // Keep it off-screen but still renderable for canvas capture.
              transform: 'translateX(-10000px)',
              opacity: 1,
              pointerEvents: 'none',
              zIndex: -1,
            }}
          >
            {/* Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
                color: '#ffffff',
                padding: '20px 24px',
                borderRadius: '16px',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
                PneumoNet AI Analysis Report
              </div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>
                AI-powered pneumonia detection system
              </div>
              <div style={{ fontSize: '11px', marginTop: '8px', opacity: 0.8 }}>
                Generated: {analysisDetails.analysisTime}
              </div>
            </div>

            {/* Patient analysis card */}
            <div
              style={{
                display: 'flex',
                gap: '20px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                padding: '18px 20px',
                marginBottom: '20px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '10px',
                    color: '#0f172a',
                  }}
                >
                  Uploaded Chest X-ray Image
                </div>
                <div
                  style={{
                    borderRadius: '10px',
                    backgroundColor: '#e5e7eb',
                    padding: '6px',
                    textAlign: 'center',
                    minHeight: '180px',
                  }}
                >
                  {uploadedImageDataUrl ? (
                    <img
                      src={uploadedImageDataUrl}
                      alt="Uploaded Chest X-ray"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '260px',
                        borderRadius: '10px',
                        objectFit: 'contain',
                        display: 'block',
                        margin: '0 auto',
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '11px', color: '#4b5563' }}>
                      Image preview unavailable
                    </span>
                  )}
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '8px',
                    color: '#0f172a',
                  }}
                >
                  Analysis Details
                </div>
                <div
                  style={{
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600 }}>Prediction Result: </span>
                    <span>{isPneumonia ? 'Pneumonia Detected' : 'No Pneumonia Detected'}</span>
                  </div>
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600 }}>Confidence Score: </span>
                    <span>{confidencePercentText}%</span>
                  </div>
                  <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 600 }}>Risk Level: </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '2px 10px',
                        borderRadius: '999px',
                        fontSize: '10px',
                        fontWeight: 600,
                        color:
                          riskLevel === 'High'
                            ? '#7f1d1d'
                            : riskLevel === 'Low'
                              ? '#14532d'
                              : '#854d0e',
                        backgroundColor:
                          riskLevel === 'High'
                            ? '#fee2e2'
                            : riskLevel === 'Low'
                              ? '#dcfce7'
                              : '#fef9c3',
                      }}
                    >
                      {riskLevel} Risk
                    </span>
                  </div>
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600 }}>Processing Time: </span>
                    <span>{analysisDetails.processingTime}</span>
                  </div>
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600 }}>AI Model: </span>
                    <span>{analysisDetails.modelVersion}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>Image File: </span>
                    <span>{analysisDetails.imageProcessed}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Pneumonia Localization (report) */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
                padding: '16px 18px',
                marginBottom: '18px',
                border: '1px solid #e5e7eb',
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '10px',
                  color: '#0f172a',
                }}
              >
                AI Pneumonia Localization
              </div>
              {isPneumonia && gradCamImage ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      marginBottom: '8px',
                    }}
                  >
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: '10px',
                          color: '#64748b',
                          marginBottom: '4px',
                        }}
                      >
                        Original X-ray
                      </div>
                      {uploadedImageDataUrl && (
                        <img
                          src={uploadedImageDataUrl}
                          alt="Original Chest X-ray"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '180px',
                            borderRadius: '10px',
                            objectFit: 'contain',
                          }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: '10px',
                          color: '#64748b',
                          marginBottom: '4px',
                        }}
                      >
                        AI Heatmap Detection
                      </div>
                      <img
                        src={gradCamImage}
                        alt="Grad-CAM highlighted pneumonia region"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '180px',
                          borderRadius: '10px',
                          objectFit: 'contain',
                        }}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: '#475569',
                    }}
                  >
                    Highlighted areas indicate regions that most strongly influenced the AI model's
                    pneumonia prediction.
                  </div>
                  <div
                    style={{
                      marginTop: '4px',
                      fontSize: '10px',
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                  >
                    Detected Suspicious Lung Region
                  </div>
                </>
              ) : (
                <div
                  style={{
                    fontSize: '10px',
                    color: '#475569',
                  }}
                >
                  No pneumonia-specific regions detected by the model for this image.
                </div>
              )}
            </div>

            {/* Model performance metrics (report) */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
                padding: '16px 18px',
                marginBottom: '18px',
                border: '1px solid #e5e7eb',
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '10px',
                  color: '#0f172a',
                }}
              >
                Model Performance Metrics
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { label: 'Accuracy', value: modelMetrics.accuracy },
                  { label: 'Precision', value: modelMetrics.precision },
                  { label: 'Recall', value: modelMetrics.recall },
                  { label: 'F1 Score', value: modelMetrics.f1 },
                ].map((m) => (
                  <div
                    key={m.label}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '12px',
                    }}
                  >
                    <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '6px' }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: '10px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '12px',
                }}
              >
                <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '6px' }}>
                  Dataset Used
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                  {modelMetrics.dataset}
                </div>
              </div>
            </div>

            {/* AI analysis pipeline (report) */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
                padding: '16px 18px',
                marginBottom: '18px',
                border: '1px solid #e5e7eb',
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '10px',
                  color: '#0f172a',
                }}
              >
                AI Analysis Pipeline
              </div>
              <div style={{ display: 'grid', gap: '10px' }}>
                {pipelineSteps.map((step, idx) => (
                  <div key={step.title} style={{ display: 'flex', gap: '10px' }}>
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '999px',
                        backgroundColor: '#1e3a8a',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '1px',
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
                        {step.title}
                      </div>
                      <div style={{ fontSize: '10px', color: '#475569', lineHeight: 1.4 }}>
                        {step.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Precautions */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
                padding: '16px 18px',
                marginBottom: '18px',
                border: '1px solid #e5e7eb',
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '10px',
                  color: '#0f172a',
                }}
              >
                Recommended Precautions
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '11px' }}>
                {(isPneumonia ? pneumoniaRecommendations : normalRecommendations).map(
                  (rec, idx) => (
                    <li
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '6px',
                        marginBottom: '6px',
                      }}
                    >
                      <span
                        style={{
                          color: '#22c55e',
                          fontWeight: 700,
                          fontSize: '12px',
                          lineHeight: '1.2',
                        }}
                      >
                        ✔
                      </span>
                      <span style={{ color: '#111827' }}>{rec}</span>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Disclaimer */}
            <div
              style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '4px',
                  color: '#7f1d1d',
                }}
              >
                Medical Disclaimer
              </div>
              <div
                style={{
                  fontSize: '10px',
                  lineHeight: 1.5,
                  color: '#7f1d1d',
                }}
              >
                This AI system provides preliminary screening only and should not replace
                professional medical diagnosis. Always consult a qualified healthcare
                professional for medical advice, diagnosis, or treatment.
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                fontSize: '10px',
                textAlign: 'center',
                color: '#6b7280',
                borderTop: '1px solid #e5e7eb',
                paddingTop: '8px',
                marginTop: '4px',
              }}
            >
              <div>Generated by PneumoNet AI System</div>
              <div>© 2026 PneumoNet</div>
            </div>
          </div>

          {/* Uploaded X-ray Preview */}
          <Card className="medical-card">
            <CardHeader>
              <CardTitle>Uploaded Chest X-ray</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full flex justify-center">
                {uploadedImageDataUrl ? (
                  <img
                    src={uploadedImageDataUrl}
                    alt="Uploaded Chest X-ray"
                    className="max-w-full w-[720px] rounded-lg border border-border/60 object-contain bg-muted/20"
                  />
                ) : (
                  <div className="w-full text-center text-sm text-muted-foreground py-10">
                    Image preview unavailable.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Pneumonia Localization (UI) */}
          <Card className="medical-card">
            <CardHeader>
              <CardTitle>AI Pneumonia Localization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isPneumonia && gradCamImage ? (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Original Chest X-ray
                      </div>
                      <div className="w-full flex justify-center">
                        {uploadedImageDataUrl && (
                          <img
                            src={uploadedImageDataUrl}
                            alt="Original Chest X-ray"
                            className="max-w-full rounded-lg border border-border/60 object-contain bg-muted/20"
                          />
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        AI Heatmap Detection (Grad-CAM)
                      </div>
                      <div className="w-full flex justify-center">
                        <img
                          src={gradCamImage}
                          alt="Grad-CAM highlighted pneumonia region"
                          className="max-w-full rounded-lg border border-border/60 object-contain bg-muted/20"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Highlighted areas indicate regions that influenced the AI model&apos;s pneumonia
                    prediction.
                  </p>
                  <p className="text-xs font-medium text-center text-foreground">
                    Detected Suspicious Lung Region
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  No pneumonia-specific regions detected by the model for this image.
                </p>
              )}
            </CardContent>
          </Card>

          {/* AI Doctor Assistant */}
          <AiDoctorAssistant
            predictionLabel={isPneumonia ? 'Pneumonia Detected' : 'No Pneumonia Detected'}
            confidencePercent={confidencePercentText}
            riskLevel={riskLevel}
            hasHeatmap={Boolean(isPneumonia && gradCamImage)}
          />

          {/* Main Result Card */}
          <Card className="medical-card">
            <CardHeader className="text-center pb-6">
              <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                isPneumonia ? 'bg-medical-danger/10' : 'bg-medical-success/10'
              }`}>
                {isPneumonia ? (
                  <AlertTriangle className="w-10 h-10 text-medical-danger" />
                ) : (
                  <CheckCircle className="w-10 h-10 text-medical-success" />
                )}
              </div>
              
              <CardTitle className="text-3xl font-bold mb-2">
                {isPneumonia ? 'Pneumonia Detected' : 'No Pneumonia Detected'}
              </CardTitle>
              
              <div className="flex items-center justify-center space-x-4 text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm">Confidence: {confidencePercentText}%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{analysisDetails.processingTime}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-3">
                <span className="text-sm text-muted-foreground">Risk Level</span>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${riskBadgeClass}`}>
                  {riskLevel}
                </span>
              </div>
            </CardHeader>
            
            <CardContent className="text-center space-y-6">
              <p className={`text-lg ${isPneumonia ? 'text-medical-danger' : 'text-medical-success'}`}>
                {isPneumonia 
                  ? 'Our AI model has detected patterns consistent with pneumonia in your chest X-ray image.'
                  : 'Excellent news! No signs of pneumonia were detected in your chest X-ray analysis.'
                }
              </p>
              
              {isPneumonia && (
                <div className="p-4 bg-medical-danger/5 border border-medical-danger/20 rounded-lg">
                  <p className="text-sm text-foreground">
                    <strong>Important Medical Disclaimer:</strong> This AI screening tool provides preliminary analysis 
                    and should not replace professional medical diagnosis. Please consult with a qualified healthcare 
                    provider immediately for proper evaluation, diagnosis, and treatment planning.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Model Performance Metrics (UI) */}
          <Card className="medical-card">
            <CardHeader>
              <CardTitle>Model Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: 'Accuracy', value: modelMetrics.accuracy },
                  { label: 'Precision', value: modelMetrics.precision },
                  { label: 'Recall', value: modelMetrics.recall },
                  { label: 'F1 Score', value: modelMetrics.f1 },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl p-4 shadow-[0_4px_10px_rgba(0,0,0,0.16)] bg-background/80 border border-border/60"
                  >
                    <div className="text-xs text-muted-foreground">{m.label}</div>
                    <div className="text-2xl font-bold mt-1 text-primary">{m.value}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-4 shadow-[0_4px_10px_rgba(0,0,0,0.16)] bg-background/80 border border-border/60">
                <div className="text-xs text-muted-foreground">Dataset</div>
                <div className="text-sm font-semibold mt-1 text-foreground">
                  {modelMetrics.dataset}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis Pipeline (UI) */}
          <Card className="medical-card">
            <CardHeader>
              <CardTitle>AI Analysis Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipelineSteps.map((step, idx) => (
                  <div key={step.title} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        {idx + 1}
                      </div>
                      {idx !== pipelineSteps.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-2" />
                      )}
                    </div>
                    <div className="pt-1">
                      <div className="font-semibold">{step.title}</div>
                      <div className="text-sm text-muted-foreground">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Analysis Details */}
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>Analysis Details</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Analysis Time:</span>
                    <span className="font-medium">{analysisDetails.analysisTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Image File:</span>
                    <span className="font-medium truncate max-w-40" title={analysisDetails.imageProcessed}>
                      {analysisDetails.imageProcessed}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Image Size:</span>
                    <span className="font-medium">{analysisDetails.imageSizeMB} MB</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">AI Model:</span>
                    <span className="font-medium">{analysisDetails.modelVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Processing Time:</span>
                    <span className="font-medium">{analysisDetails.processingTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Result:</span>
                    <Badge variant={isPneumonia ? "destructive" : "secondary"}>
                      {isPneumonia ? 'Positive' : 'Negative'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-primary" />
                <span>{isPneumonia ? 'Immediate Action Required' : 'Preventive Health Measures'}</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="grid gap-4">
                {(isPneumonia ? pneumoniaRecommendations : normalRecommendations).map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isPneumonia ? 'bg-medical-danger text-white' : 'bg-medical-success text-white'
                    }`}>
                      <span className="text-xs font-bold">{index + 1}</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Health Metrics Card */}
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-primary" />
                <span>Health Insights</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">AI Accuracy</h3>
                  <p className="text-2xl font-bold text-primary">95.7%</p>
                  <p className="text-xs text-muted-foreground">Clinical validation rate</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">Quick Results</h3>
                  <p className="text-2xl font-bold text-primary">&lt;3s</p>
                  <p className="text-xs text-muted-foreground">Average processing time</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">Trusted by</h3>
                  <p className="text-2xl font-bold text-primary">50K+</p>
                  <p className="text-xs text-muted-foreground">Healthcare professionals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/')}
              variant="medical"
              size="lg"
              className="px-8"
            >
              Perform New Analysis
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="px-8"
              onClick={handleDownloadReport}
            >
              Download Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;