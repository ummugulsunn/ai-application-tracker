'use client';

import React, { useState } from 'react';
import { InterviewPreparation } from '@/components/ai/InterviewPreparation';
import { Card } from '@/components/ui/Card';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { InterviewPreparation as InterviewPrepType } from '@/lib/ai/advancedAIService';

export default function InterviewPrepPage() {
  const [completedPreparations, setCompletedPreparations] = useState<InterviewPrepType[]>([]);

  const handlePreparationComplete = (preparation: InterviewPrepType) => {
    setCompletedPreparations(prev => [preparation, ...prev]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Interview Preparation</h1>
            <HelpTooltip content="Get AI-powered interview preparation materials tailored to specific roles and companies to boost your confidence and success rate" />
          </div>
          <p className="text-lg text-gray-600">
            Prepare for your interviews with personalized questions, company research, and strategic guidance
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          <InterviewPreparation onPreparationComplete={handlePreparationComplete} />

          {/* Interview Tips and Best Practices */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>📋</span>
                Before the Interview
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Research the company thoroughly (mission, values, recent news)
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Review the job description and match your skills
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Prepare specific examples using the STAR method
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Practice common questions out loud
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Prepare thoughtful questions to ask the interviewer
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Plan your outfit and test your technology
                </li>
              </ul>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>🎯</span>
                During the Interview
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  Arrive 5-10 minutes early (or join the call early)
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  Make eye contact and show enthusiasm
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  Listen carefully and ask for clarification if needed
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  Use specific examples to demonstrate your skills
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  Show genuine interest in the role and company
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  Take notes and ask insightful questions
                </li>
              </ul>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>📧</span>
                After the Interview
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  Send a thank-you email within 24 hours
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  Mention specific topics discussed in the interview
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  Reiterate your interest and qualifications
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  Address any concerns that came up
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  Follow up appropriately if you don't hear back
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  Reflect on the experience and take notes
                </li>
              </ul>
            </Card>
          </div>

          {/* Common Interview Question Categories */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>❓</span>
              Common Interview Question Categories
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Behavioral Questions</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Tell me about a time when...</li>
                  <li>• Describe a situation where...</li>
                  <li>• Give me an example of...</li>
                  <li>• How did you handle...</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Technical Questions</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Explain how you would...</li>
                  <li>• What's the difference between...</li>
                  <li>• How would you optimize...</li>
                  <li>• Walk me through your process...</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Situational Questions</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• What would you do if...</li>
                  <li>• How would you approach...</li>
                  <li>• If you were in charge of...</li>
                  <li>• How would you prioritize...</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* STAR Method Guide */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <span>⭐</span>
              The STAR Method for Behavioral Questions
            </h3>
            <p className="text-blue-800 mb-4">
              Use this framework to structure your answers to behavioral interview questions:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Situation</h4>
                <p className="text-sm text-blue-800">
                  Set the context and background for your story
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Task</h4>
                <p className="text-sm text-blue-800">
                  Describe the challenge or responsibility you faced
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Action</h4>
                <p className="text-sm text-blue-800">
                  Explain the specific steps you took to address the situation
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Result</h4>
                <p className="text-sm text-blue-800">
                  Share the outcomes and what you learned
                </p>
              </div>
            </div>
          </Card>

          {/* Salary Negotiation Tips */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>💰</span>
              Salary Negotiation Guidelines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Before Negotiating</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Research market rates for your role and location
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Consider the total compensation package
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Know your minimum acceptable offer
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Prepare justification for your ask
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">During Negotiation</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    Express enthusiasm for the role first
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    Be professional and collaborative
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    Focus on value you bring to the company
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    Be flexible and consider alternatives
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Interview Anxiety Tips */}
          <Card className="p-6 bg-green-50 border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
              <span>🧘</span>
              Managing Interview Anxiety
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-green-900 mb-2">Preparation Strategies</h4>
                <ul className="space-y-1 text-sm text-green-800">
                  <li>• Practice with mock interviews</li>
                  <li>• Prepare answers to common questions</li>
                  <li>• Research the company thoroughly</li>
                  <li>• Plan your journey and timing</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-green-900 mb-2">Relaxation Techniques</h4>
                <ul className="space-y-1 text-sm text-green-800">
                  <li>• Deep breathing exercises</li>
                  <li>• Progressive muscle relaxation</li>
                  <li>• Positive visualization</li>
                  <li>• Mindfulness meditation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-green-900 mb-2">Day-of Tips</h4>
                <ul className="space-y-1 text-sm text-green-800">
                  <li>• Get a good night's sleep</li>
                  <li>• Eat a healthy breakfast</li>
                  <li>• Arrive early but not too early</li>
                  <li>• Remember: they want you to succeed</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}