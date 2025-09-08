import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkRateLimit, withErrorHandling } from '@/lib/ai';
import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateCoverLetterSchema = z.object({
  jobDescription: z.string().min(20, 'Job description is required'),
  companyName: z.string().min(1, 'Company name is required'),
  position: z.string().min(1, 'Position title is required'),
  userProfile: z.object({
    name: z.string().optional(),
    skills: z.array(z.string()).optional(),
    experience: z.string().optional(),
    achievements: z.array(z.string()).optional(),
  }).optional(),
  tone: z.enum(['professional', 'enthusiastic', 'confident', 'friendly']).default('professional'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
});

interface CoverLetterGeneration {
  coverLetter: string;
  keyPoints: string[];
  suggestions: string[];
  tone: string;
  wordCount: number;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication (optional - works in guest mode too)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'guest';

    // Check rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'RATE_LIMIT_EXCEEDED', 
            message: 'Too many AI requests. Please try again later.' 
          } 
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = generateCoverLetterSchema.parse(body);

    const { jobDescription, companyName, position, userProfile, tone, length } = validatedData;

    const generationResult = await withErrorHandling(
      () => generateCoverLetterWithAI(jobDescription, companyName, position, userProfile, tone, length),
      {
        coverLetter: 'Cover letter generation is temporarily unavailable. Please try again later.',
        keyPoints: ['Service temporarily unavailable'],
        suggestions: ['Please try again later'],
        tone: tone,
        wordCount: 0
      },
      'Failed to generate cover letter'
    );

    return NextResponse.json({
      success: true,
      data: {
        generation: generationResult,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in cover letter generation endpoint:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid request data',
            details: error.errors 
          } 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'An unexpected error occurred' 
        } 
      },
      { status: 500 }
    );
  }
}

async function generateCoverLetterWithAI(
  jobDescription: string,
  companyName: string,
  position: string,
  userProfile: any,
  tone: string,
  length: string
): Promise<CoverLetterGeneration> {
  const prompt = buildCoverLetterGenerationPrompt(jobDescription, companyName, position, userProfile, tone, length);
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert career coach and professional writer specializing in creating compelling cover letters. Generate personalized cover letters that effectively showcase the candidate's qualifications and enthusiasm for the role.

        Respond with valid JSON in this format:
        {
          "coverLetter": "string (the complete cover letter text)",
          "keyPoints": ["point1", "point2", "point3"],
          "suggestions": ["suggestion1", "suggestion2"],
          "tone": "string (description of the tone used)",
          "wordCount": number
        }`
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) {
    throw new Error('No response from AI service');
  }

  return parseCoverLetterGeneration(response);
}

function buildCoverLetterGenerationPrompt(
  jobDescription: string,
  companyName: string,
  position: string,
  userProfile: any,
  tone: string,
  length: string
): string {
  const lengthGuidance = {
    short: '200-300 words, concise and impactful',
    medium: '300-400 words, balanced detail and brevity',
    long: '400-500 words, comprehensive and detailed'
  };

  const toneGuidance = {
    professional: 'formal, respectful, and business-appropriate',
    enthusiastic: 'energetic, passionate, and engaging',
    confident: 'assertive, self-assured, and compelling',
    friendly: 'warm, approachable, and personable'
  };

  return `
Generate a compelling cover letter for the following position:

Position: ${position}
Company: ${companyName}

Job Description:
${jobDescription}

${userProfile ? `
Candidate Profile:
- Name: ${userProfile.name || '[Your Name]'}
- Skills: ${userProfile.skills?.join(', ') || 'Not specified'}
- Experience: ${userProfile.experience || 'Not specified'}
- Key Achievements: ${userProfile.achievements?.join(', ') || 'Not specified'}
` : ''}

Requirements:
- Tone: ${toneGuidance[tone as keyof typeof toneGuidance]}
- Length: ${lengthGuidance[length as keyof typeof lengthGuidance]}
- Include specific references to the company and role
- Highlight relevant qualifications and achievements
- Show genuine interest and enthusiasm
- Include a strong opening and compelling closing
- Use professional formatting with clear paragraphs

The cover letter should:
1. Open with a compelling hook that mentions the specific role
2. Demonstrate knowledge of the company and role requirements
3. Highlight 2-3 most relevant qualifications or achievements
4. Show enthusiasm and cultural fit
5. Close with a strong call to action

Please also provide:
- Key points that make this cover letter effective
- Suggestions for customization or improvement
- Word count
`;
}

function parseCoverLetterGeneration(response: string): CoverLetterGeneration {
  try {
    const parsed = JSON.parse(response);
    
    return {
      coverLetter: parsed.coverLetter || 'Failed to generate cover letter content',
      keyPoints: parsed.keyPoints || [],
      suggestions: parsed.suggestions || [],
      tone: parsed.tone || 'professional',
      wordCount: parsed.wordCount || 0
    };
  } catch (error) {
    console.error('Failed to parse cover letter generation:', error);
    
    // Fallback generation
    return {
      coverLetter: 'Cover letter generation failed. Please try again with clearer requirements.',
      keyPoints: ['Generation parsing failed'],
      suggestions: ['Please try again with more specific requirements'],
      tone: 'professional',
      wordCount: 0
    };
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      success: false, 
      error: { 
        code: 'METHOD_NOT_ALLOWED', 
        message: 'GET method not supported for this endpoint' 
      } 
    },
    { status: 405 }
  );
}