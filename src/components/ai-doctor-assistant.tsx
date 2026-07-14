
import { useState, useEffect, useRef } from 'react';
import { MessageCircle, SendHorizonal, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';
import ReactMarkdown from "react-markdown";

interface AiDoctorAssistantProps {
  predictionLabel: string;
  confidencePercent: string;
  riskLevel: string;
  hasHeatmap: boolean;
}

interface ChatMessage {
  id: number;
  sender: 'user' | 'ai';
  text: string;
}

export const AiDoctorAssistant = ({
  predictionLabel,
  confidencePercent,
  riskLevel,
  hasHeatmap,
}: AiDoctorAssistantProps) => {

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: Date.now(),
      sender: 'ai',
      text:
        'Hello, I am the PneumoNet AI Doctor Assistant. You can ask me questions about this chest X-ray analysis in clear, simple language.',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to newest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendQuestion = async (question: string) => {

    if (!question.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: 'user',
      text: question.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {

      const response = await apiService.askAssistant({
        question: question.trim(),
        prediction: predictionLabel,
        confidence: parseFloat(confidencePercent.replace('%', '')),
        riskLevel,
        hasHeatmap,
      });

      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: response.answer,
      };

      setMessages((prev) => [...prev, aiMessage]);

    } catch (err: any) {

      const errorMessage: ChatMessage = {
        id: Date.now() + 2,
        sender: 'ai',
        text:
          err?.response?.data?.answer ||
          'The AI assistant is temporarily unavailable. Please try again later.',
      };

      setMessages((prev) => [...prev, errorMessage]);

    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendQuestion(input);
  };

  const quickQuestions = [
    'What does this result mean?',
    'How serious is this?',
    'What should I do next?',
  ];

  return (
    <Card className="medical-card">

      <CardHeader className="flex flex-row items-center justify-between space-y-0">

        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <CardTitle>AI Doctor Assistant</CardTitle>
        </div>

      </CardHeader>

      <CardContent className="space-y-4">

        {/* Chat Window */}

        <div className="h-64 max-h-80 border border-border/60 rounded-lg bg-background/80 overflow-y-auto p-3 space-y-3">

          {messages.map((msg) => (

            <div
              key={msg.id}
              className={`flex ${
                msg.sender === 'user'
                  ? 'justify-end'
                  : 'justify-start'
              }`}
            >

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                }`}
              >

              {msg.sender === 'ai' ? (

              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>
                  {msg.text}
                </ReactMarkdown>
              </div>

              ) : (
              msg.text
              )}

              </div>

            </div>

          ))}

          {isLoading && (

            <div className="flex justify-start">

              <div className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 bg-muted text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Thinking about your question...
              </div>

            </div>

          )}

          <div ref={chatEndRef} />

        </div>

        {/* Quick Questions */}

        <div className="flex flex-wrap gap-2">

          {quickQuestions.map((q) => (

            <Button
              key={q}
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              disabled={isLoading}
              onClick={() => void sendQuestion(q)}
            >
              {q}
            </Button>

          ))}

        </div>

        {/* Input */}

        <form onSubmit={handleSubmit} className="flex gap-2">

          <input
            type="text"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            placeholder="Ask about the analysis result..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />

          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
          >

            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SendHorizonal className="w-4 h-4" />
            )}

          </Button>

        </form>

        <p className="text-[11px] text-muted-foreground">
          This AI explanation is for informational purposes only and should not
          replace professional medical advice.
        </p>

      </CardContent>

    </Card>
  );
};