import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, XCircle, Award, Brain, Clock } from 'lucide-react';
import { useMCQQuiz } from '@/hooks/useMCQQuiz';
import { MCQ_RULES } from '@/types/recovery';
import type { MCQAttemptResult } from '@/types/recovery';

export function MCQQuiz() {
  const {
    currentQuestion,
    questionIndex,
    questions,
    dailyLimit,
    loading,
    submitting,
    submitAnswer,
    nextQuestion,
    canTakeQuiz,
    getRemainingQuestions,
    getCreditsEarnedToday,
  } = useMCQQuiz();

  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [result, setResult] = useState<MCQAttemptResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleOptionSelect = (option: 'A' | 'B' | 'C' | 'D') => {
    if (!showResult) {
      setSelectedOption(option);
    }
  };

  const handleSubmit = async () => {
    if (!selectedOption || submitting) return;

    const attemptResult = await submitAnswer(selectedOption);
    setResult(attemptResult);
    setShowResult(true);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setResult(null);
    setShowResult(false);
    nextQuestion();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!canTakeQuiz()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Daily Limit Reached
          </CardTitle>
          <CardDescription>
            You've completed {MCQ_RULES.MAX_QUESTIONS_PER_DAY} questions today and earned{' '}
            {getCreditsEarnedToday()} credits!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Questions Today:</span>
              <span className="font-semibold">{dailyLimit?.questions_attempted || 0} / 5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Credits Earned:</span>
              <span className="font-semibold text-green-600">{getCreditsEarnedToday()} credits</span>
            </div>
            <p className="text-sm text-center text-muted-foreground mt-4">
              Come back tomorrow for more questions!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion || questions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Questions Available</CardTitle>
          <CardDescription>
            Complete some learning sessions to unlock quiz questions based on topics you've studied.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const options: Array<{ key: 'A' | 'B' | 'C' | 'D'; text: string }> = [
    { key: 'A', text: currentQuestion.option_a },
    { key: 'B', text: currentQuestion.option_b },
    { key: 'C', text: currentQuestion.option_c },
    { key: 'D', text: currentQuestion.option_d },
  ];

  const progressPercent = ((questionIndex + 1) / questions.length) * 100;

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className="text-xs">
            {currentQuestion.topic}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {currentQuestion.skill_level}
          </Badge>
        </div>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Question {questionIndex + 1} of {questions.length}
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {getRemainingQuestions()} remaining today
          </span>
        </CardTitle>
        <Progress value={progressPercent} className="h-2" />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Question Text */}
        <div className="bg-secondary/30 p-4 rounded-lg">
          <p className="text-lg font-medium leading-relaxed">{currentQuestion.question_text}</p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {options.map((option) => {
            const isSelected = selectedOption === option.key;
            const isCorrect = result?.correct_option === option.key;
            const isWrong = showResult && selectedOption === option.key && !result?.is_correct;

            let optionClass = 'border-2 transition-all cursor-pointer hover:border-primary';
            if (isSelected && !showResult) {
              optionClass += ' border-primary bg-primary/5';
            }
            if (showResult && isCorrect) {
              optionClass += ' border-green-500 bg-green-50';
            }
            if (isWrong) {
              optionClass += ' border-red-500 bg-red-50';
            }

            return (
              <div
                key={option.key}
                className={optionClass}
                onClick={() => handleOptionSelect(option.key)}
              >
                <div className="p-4 flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-semibold">
                    {option.key}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed">{option.text}</p>
                  </div>
                  {showResult && isCorrect && (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  )}
                  {isWrong && <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Result Feedback */}
        {showResult && result && (
          <div
            className={`p-4 rounded-lg ${
              result.is_correct ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
            }`}
          >
            <div className="flex items-start gap-3 mb-2">
              {result.is_correct ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-semibold ${result.is_correct ? 'text-green-900' : 'text-red-900'}`}>
                  {result.is_correct ? 'Correct!' : 'Incorrect'}
                </p>
                {result.explanation && (
                  <p className="text-sm text-muted-foreground mt-1">{result.explanation}</p>
                )}
              </div>
            </div>

            {result.is_correct && result.credits_earned && result.credits_earned > 0 && (
              <div className="flex items-center gap-2 mt-3 p-2 bg-white rounded border border-green-300">
                <Award className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-semibold text-green-700">
                  +{result.credits_earned} credits earned!
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {getCreditsEarnedToday()} / {MCQ_RULES.MAX_DAILY_CREDITS} credits today
            </span>
          </div>

          {!showResult ? (
            <Button onClick={handleSubmit} disabled={!selectedOption || submitting} size="lg">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Answer'
              )}
            </Button>
          ) : questionIndex < questions.length - 1 ? (
            <Button onClick={handleNext} size="lg">
              Next Question
            </Button>
          ) : (
            <Button onClick={handleNext} size="lg" variant="outline">
              View Summary
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
