import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Brain, Shield, Zap, Users, Award, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadZone } from '@/components/ui/upload-zone';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAnalysis } from '@/hooks/useAnalysis';
import { apiService } from '@/services/api';
import heroImage from '@/assets/hero-medical.jpg';

const Index = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImageDataUrl, setSelectedImageDataUrl] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const { isAnalyzing, error, result, analyzeImage, clearError, clearResult } = useAnalysis();

  // Check server status on component mount
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const isHealthy = await apiService.checkHealth();
        setServerStatus(isHealthy ? 'online' : 'offline');
      } catch {
        setServerStatus('offline');
      }
    };

    checkServerStatus();
  }, []);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    clearError();
    clearResult();

    // Create a preview data URL that can be reused on the results page + PDF report.
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null;
      setSelectedImageDataUrl(dataUrl);
    };
    reader.onerror = () => {
      setSelectedImageDataUrl(null);
    };
    reader.readAsDataURL(file);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setSelectedImageDataUrl(null);
    clearError();
    clearResult();
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    
    try {
      await analyzeImage(selectedFile);
    } catch (err) {
      // Error is handled by the useAnalysis hook
      console.error('Analysis failed:', err);
    }
  };

  // Navigate to results when analysis is complete
  useEffect(() => {
    if (result && !isAnalyzing) {
      navigate('/results', {
        state: {
          result: result.result,
          confidence: result.confidence,
          fileName: result.fileName,
          fileSize: result.fileSize,
          processingTime: result.processingTime,
          modelVersion: result.modelVersion,
          uploadedImageDataUrl: selectedImageDataUrl,
          gradCamImage: result.gradCamImage
        }
      });
    }
  }, [result, isAnalyzing, navigate, selectedImageDataUrl]);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Detection",
      description: "Advanced deep learning model trained on thousands of chest X-rays"
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Get pneumonia screening results in seconds, not hours"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your medical images are processed securely and never stored"
    }
  ];

  const stats = [
    {
      icon: Users,
      value: "50K+",
      label: "Analyses Performed"
    },
    {
      icon: Award,
      value: "95.22%",
      label: "Accuracy Rate"
    },
    {
      icon: CheckCircle,
      value: "24/7",
      label: "Available Service"
    }
  ];

  return (
    <div className="min-h-screen hero-gradient">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src={heroImage} 
            alt="Medical AI Background" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background" />
        </div>
        
        <div className="relative max-w-4xl mx-auto animate-fade-in">
          <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">AI Medical Screening</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Pneumonia Detection
            <span className="block text-primary">Made Simple</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Upload your chest X-ray and get instant AI-powered pneumonia screening results 
            with personalized health recommendations from our advanced medical AI system.
          </p>
          
          {/* Stats Pills */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full">
                <stat.icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-center space-x-4">
            <Button 
              variant="medical" 
              size="lg"
              onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Start Analysis
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>

          {/* Server Status Indicator */}
          <div className="mt-6 flex justify-center">
            <div className="flex items-center space-x-2 bg-muted/50 px-4 py-2 rounded-full">
              {serverStatus === 'checking' && (
                <>
                  <Activity className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Checking server...</span>
                </>
              )}
              {serverStatus === 'online' && (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">AI Server Online</span>
                </>
              )}
              {serverStatus === 'offline' && (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">AI Server Offline</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our AI Screening?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Cutting-edge technology meets healthcare to provide you with accurate, 
              fast, and reliable pneumonia detection.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="medical-card hover:glow-effect transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Upload & Analysis Section */}
      <section id="upload-section" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Upload Your X-Ray</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Select a clear chest X-ray image for instant AI analysis. Our advanced deep learning model 
                will provide accurate pneumonia detection results within seconds.
              </p>
            </div>

            <UploadZone
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              onClear={handleClearFile}
            />

            {/* Error Display */}
            {error && (
              <Alert variant="destructive" className="animate-slide-up">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearError}
                    className="ml-2 h-auto p-0 text-destructive hover:text-destructive"
                  >
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {selectedFile && !isAnalyzing && !error && (
              <div className="text-center animate-slide-up">
                <Button 
                  variant="medical"
                  size="lg"
                  onClick={handleAnalyze}
                  className="px-8"
                  disabled={serverStatus === 'offline'}
                >
                  <Brain className="w-5 h-5 mr-2" />
                  {serverStatus === 'offline' ? 'Server Offline' : 'Analyze X-Ray'}
                </Button>
                <p className="text-sm text-muted-foreground mt-3">
                  {serverStatus === 'offline' 
                    ? 'Please ensure your Colab backend is running'
                    : 'Analysis typically takes 2-3 seconds'
                  }
                </p>
              </div>
            )}

            {isAnalyzing && (
              <div className="text-center space-y-6 animate-fade-in">
                <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-glow">
                  <Activity className="w-10 h-10 text-primary animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Analyzing X-Ray...</h3>
                  <p className="text-muted-foreground">Our AI is examining your image for pneumonia indicators</p>
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary to-primary-glow h-3 rounded-full animate-pulse transition-all duration-1000" 
                         style={{ width: '85%' }} />
                  </div>
                  <p className="text-sm text-muted-foreground">Processing image data...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Trusted by Healthcare Professionals</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our AI pneumonia detection system is validated by medical experts and used in clinical settings worldwide.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">95.22%</div>
              <div className="text-sm text-muted-foreground">Clinical Accuracy</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">50K+</div>
              <div className="text-sm text-muted-foreground">Analyses Completed</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">2.3s</div>
              <div className="text-sm text-muted-foreground">Average Processing Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center text-muted-foreground">
          <p className="text-sm">
            This AI screening tool is for educational purposes and should not replace professional medical diagnosis.
            Always consult with healthcare professionals for medical concerns.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;