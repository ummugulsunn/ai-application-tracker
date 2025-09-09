import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InterviewPreparation } from '../InterviewPreparation';

// Mock fetch
global.fetch = jest.fn();

const mockInterviewPreparation = {
  commonQuestions: [
    {
      question: 'Tell me about yourself',
      category: 'general' as const,
      suggestedAnswer: 'I am a software developer with 5 years of experience...',
      tips: ['Keep it concise', 'Focus on relevant experience']
    }
  ],
  companyResearch: {
    keyPoints: ['Leading tech company', 'Focus on innovation'],
    questionsToAsk: ['What does success look like in this role?'],
    recentNews: ['Company launched new product'],
    culture: ['Collaborative environment'],
    values: ['Innovation', 'Excellence']
  },
  skillsToHighlight: ['JavaScript', 'React', 'Problem solving'],
  weaknessesToAddress: ['Public speaking', 'Time management'],
  salaryNegotiation: {
    marketRange: '$80,000 - $120,000',
    negotiationTips: ['Research market rates', 'Be confident'],
    timing: 'After receiving an offer',
    factors: ['Experience level', 'Location']
  },
  preparationTimeline: {
    oneWeekBefore: ['Research the company'],
    threeDaysBefore: ['Practice common questions'],
    oneDayBefore: ['Review your resume'],
    dayOf: ['Arrive early', 'Stay calm']
  },
  followUpStrategy: {
    thankYouEmail: 'Dear [Interviewer Name], Thank you for taking the time...',
    followUpTimeline: ['Send thank you within 24 hours'],
    nextSteps: ['Wait for response', 'Follow up if needed']
  }
};

describe('InterviewPreparation', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders the initial form correctly', () => {
    render(<InterviewPreparation />);
    
    expect(screen.getByText('Interview Preparation Assistant')).toBeInTheDocument();
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/job description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/interview type/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate interview preparation/i })).toBeInTheDocument();
  });

  it('disables button when fields are empty', () => {
    render(<InterviewPreparation />);
    
    const generateButton = screen.getByRole('button', { name: /generate interview preparation/i });
    expect(generateButton).toBeDisabled();
    
    // Fill in company name only
    fireEvent.change(screen.getByLabelText(/company name/i), {
      target: { value: 'Google' }
    });
    expect(generateButton).toBeDisabled();
    
    // Fill in job description only (clear company name first)
    fireEvent.change(screen.getByLabelText(/company name/i), {
      target: { value: '' }
    });
    fireEvent.change(screen.getByLabelText(/job description/i), {
      target: { value: 'Software Engineer position...' }
    });
    expect(generateButton).toBeDisabled();
    
    // Fill in both fields
    fireEvent.change(screen.getByLabelText(/company name/i), {
      target: { value: 'Google' }
    });
    expect(generateButton).not.toBeDisabled();
  });

  it('generates interview preparation successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockInterviewPreparation
      })
    });

    const onComplete = jest.fn();
    render(<InterviewPreparation onPreparationComplete={onComplete} />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/company name/i), {
      target: { value: 'Google' }
    });
    fireEvent.change(screen.getByLabelText(/job description/i), {
      target: { value: 'Software Engineer position requiring React and JavaScript experience...' }
    });
    
    // Submit the form
    const generateButton = screen.getByRole('button', { name: /generate interview preparation/i });
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Interview Preparation')).toBeInTheDocument();
      expect(screen.getByText('Tell me about yourself')).toBeInTheDocument();
      expect(screen.getByText('Leading tech company')).toBeInTheDocument();
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('$80,000 - $120,000')).toBeInTheDocument();
    });

    expect(onComplete).toHaveBeenCalledWith(mockInterviewPreparation);
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Failed to generate preparation'
      })
    });

    render(<InterviewPreparation />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/company name/i), {
      target: { value: 'Google' }
    });
    fireEvent.change(screen.getByLabelText(/job description/i), {
      target: { value: 'Software Engineer position...' }
    });
    
    // Submit the form
    const generateButton = screen.getByRole('button', { name: /generate interview preparation/i });
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to generate preparation/i)).toBeInTheDocument();
    });
  });

  it('allows resetting to generate new preparation', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockInterviewPreparation
      })
    });

    render(<InterviewPreparation />);
    
    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/company name/i), {
      target: { value: 'Google' }
    });
    fireEvent.change(screen.getByLabelText(/job description/i), {
      target: { value: 'Software Engineer position...' }
    });
    fireEvent.click(screen.getByRole('button', { name: /generate interview preparation/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Interview Preparation')).toBeInTheDocument();
    });

    // Reset
    const resetButton = screen.getByRole('button', { name: /new preparation/i });
    fireEvent.click(resetButton);
    
    expect(screen.getByText('Interview Preparation Assistant')).toBeInTheDocument();
    expect(screen.getByLabelText(/company name/i)).toHaveValue('');
    expect(screen.getByLabelText(/job description/i)).toHaveValue('');
  });

  it('displays all sections of the preparation results', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockInterviewPreparation
      })
    });

    render(<InterviewPreparation />);
    
    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/company name/i), {
      target: { value: 'Google' }
    });
    fireEvent.change(screen.getByLabelText(/job description/i), {
      target: { value: 'Software Engineer position...' }
    });
    fireEvent.click(screen.getByRole('button', { name: /generate interview preparation/i }));
    
    await waitFor(() => {
      // Check all major sections are displayed
      expect(screen.getByText('Common Interview Questions')).toBeInTheDocument();
      expect(screen.getByText('Company Research')).toBeInTheDocument();
      expect(screen.getByText('Skills to Highlight')).toBeInTheDocument();
      expect(screen.getByText('Areas to Address')).toBeInTheDocument();
      expect(screen.getByText('Salary Negotiation')).toBeInTheDocument();
      expect(screen.getByText('Preparation Timeline')).toBeInTheDocument();
      expect(screen.getByText('Follow-up Strategy')).toBeInTheDocument();
    });
  });

  it('shows loading state during generation', async () => {
    (fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true, data: mockInterviewPreparation })
      }), 100))
    );

    render(<InterviewPreparation />);
    
    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/company name/i), {
      target: { value: 'Google' }
    });
    fireEvent.change(screen.getByLabelText(/job description/i), {
      target: { value: 'Software Engineer position...' }
    });
    fireEvent.click(screen.getByRole('button', { name: /generate interview preparation/i }));
    
    // Should show loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Interview Preparation')).toBeInTheDocument();
    });
  });

  it('updates interview type selection', () => {
    render(<InterviewPreparation />);
    
    const select = screen.getByLabelText(/interview type/i);
    fireEvent.change(select, { target: { value: 'technical' } });
    
    expect(select).toHaveValue('technical');
  });
});