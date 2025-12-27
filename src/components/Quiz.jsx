import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import AIPrincipleAccordion from './AIPrincipleAccordion';
import { getAIPrincipleExplanation } from '../utils/aiPrincipleExplainer';
import { generateDynamicExample } from '../utils/aiPrincipleExampleGenerator';

const Quiz = ({ questions, onComplete, analysisResult }) => {
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [dynamicExamples, setDynamicExamples] = useState({});
  const { CheckCircle, XCircle } = Icons;
  
  // 동적 예시 생성
  useEffect(() => {
    if (!analysisResult) return;
    
    const loadExamples = async () => {
      const examples = {};
      try {
        const questionExample = await generateDynamicExample('question-generation', analysisResult);
        if (questionExample) examples['question-generation'] = questionExample;
        
        const gradingExample = await generateDynamicExample('grading', analysisResult);
        if (gradingExample) examples['grading'] = gradingExample;
      } catch (error) {
        console.log('예시 생성 실패:', error);
      }
      setDynamicExamples(examples);
    };
    
    loadExamples();
  }, [analysisResult]);

  const handleAnswer = (questionId, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleSubmit = () => {
    let totalScore = 0;
    let correctCount = 0;

    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        totalScore += q.points;
        correctCount++;
      }
    });

    setScore(totalScore);
    setShowResults(true);
  };

  const handleComplete = () => {
    const results = questions.map(q => ({
      questionId: q.id,
      question: q.question,
      userAnswer: answers[q.id],
      correctAnswer: q.correctAnswer,
      isCorrect: answers[q.id] === q.correctAnswer,
      explanation: q.explanation,
      points: answers[q.id] === q.correctAnswer ? q.points : 0
    }));

    onComplete({
      totalScore,
      maxScore: questions.reduce((sum, q) => sum + q.points, 0),
      correctCount,
      totalQuestions: questions.length,
      results
    });
  };

  if (showResults) {
    return (
      <div className="glass-panel rounded-xl p-6 space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-yellow-300 mb-4">📝 채점 결과</h3>
          
          {/* 채점 AI 원리 설명 */}
          <div className="mb-6">
            <AIPrincipleAccordion 
              step="grading" 
              explanation={getAIPrincipleExplanation('grading', analysisResult, dynamicExamples['grading'])} 
            />
          </div>
          <div className="text-4xl font-bold text-white mb-2">
            {score}점 / {questions.reduce((sum, q) => sum + q.points, 0)}점
          </div>
          <div className="text-purple-200">
            {questions.filter(q => answers[q.id] === q.correctAnswer).length}문제 맞음 / {questions.length}문제
          </div>
        </div>

        <div className="space-y-4">
          {questions.map((q) => {
            const userAnswer = answers[q.id];
            const isCorrect = userAnswer === q.correctAnswer;
            
            return (
              <div
                key={q.id}
                className={`p-4 rounded-lg border-2 ${
                  isCorrect
                    ? 'bg-green-900/30 border-green-500'
                    : 'bg-red-900/30 border-red-500'
                }`}
              >
                <div className="flex items-start gap-3 mb-2">
                  {isCorrect ? (
                    <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={24} />
                  ) : (
                    <XCircle className="text-red-400 flex-shrink-0 mt-1" size={24} />
                  )}
                  <div className="flex-1">
                    <div className="font-bold text-white mb-2">
                      문제 {q.id}. {q.question}
                    </div>
                    <div className="text-sm text-gray-300 mb-2">
                      {isCorrect ? (
                        <span className="text-green-300">✅ 정답입니다!</span>
                      ) : (
                        <span className="text-red-300">
                          ❌ 틀렸어요. 정답은 {q.options[q.correctAnswer]} 입니다.
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-purple-200 bg-purple-900/40 p-3 rounded mt-2">
                      <strong>💡 해설:</strong> {q.explanation}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleComplete}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-6 py-3 rounded-lg hover:shadow-lg transition"
        >
          결과 보고서 보기
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-6 space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-yellow-300 mb-2">📚 그래프 해석 문제</h3>
        <p className="text-purple-200">초등학교 4학년 수준의 문제를 풀어보세요!</p>
      </div>
      
      {/* AI 원리 설명 */}
      <div className="mb-6">
        <AIPrincipleAccordion 
          step="question-generation" 
          explanation={getAIPrincipleExplanation('question-generation', analysisResult, dynamicExamples['question-generation'])} 
        />
      </div>

      <div className="space-y-6">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-black/40 rounded-lg p-4 border border-purple-500/30">
            <div className="font-bold text-white mb-4">
              문제 {q.id}. {q.question}
            </div>
            <div className="space-y-2">
              {q.options.map((option, optIdx) => (
                <label
                  key={optIdx}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                    answers[q.id] === optIdx
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800/50 text-gray-200 hover:bg-gray-700/50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${q.id}`}
                    value={optIdx}
                    checked={answers[q.id] === optIdx}
                    onChange={() => handleAnswer(q.id, optIdx)}
                    className="w-4 h-4"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={Object.keys(answers).length < questions.length}
        className={`w-full font-bold px-6 py-3 rounded-lg transition ${
          Object.keys(answers).length < questions.length
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
        }`}
      >
        제출하기
      </button>
    </div>
  );
};

export default Quiz;

