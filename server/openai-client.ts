/**
 * Shared OpenAI Client Configuration
 * Provides a centralized way to access OpenAI client with proper error handling
 */

import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

/**
 * Get OpenAI client instance - creates one if not exists
 */
export const getOpenAIClient = (): OpenAI => {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.');
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
};

/**
 * Check if OpenAI is available
 */
export const isOpenAIAvailable = (): boolean => {
  return !!process.env.OPENAI_API_KEY;
};

/**
 * Reset OpenAI client (useful for testing or config changes)
 */
export const resetOpenAIClient = (): void => {
  openaiClient = null;
};

/**
 * Enhanced OpenAI Service for Complete Video Generation Pipeline
 */
class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = getOpenAIClient();
  }

  /**
   * Generate complete video script with scenes and voiceover instructions using OpenAI GPT-4
   */
  async generateVideoScript(params: {
    prompt: string;
    duration: number;
    visualStyle: string;
    tone: string;
    voiceGender?: string;
    language?: string;
    accent?: string;
  }) {
    const { prompt, duration, visualStyle, tone, voiceGender = 'Female', language = 'English', accent = 'American' } = params;

    try {
      console.log('[OPENAI] Generating complete video script with voiceover instructions...');

      const systemPrompt = `You are an expert video scriptwriter and AI video generation specialist. Create a complete video production script with detailed scene breakdowns, visual descriptions, and voiceover instructions.

Your task is to create a professional video script that will be used for:
1. AI image generation for each scene
2. Voiceover generation using ElevenLabs
3. Complete video production pipeline

REQUIREMENTS:
- Total video duration: ${duration} seconds
- Visual style: ${visualStyle}
- Tone: ${tone}
- Voice: ${voiceGender} voice with ${accent} accent in ${language}
- Break into logical scenes (3-8 scenes based on duration)
- Each scene should be 3-8 seconds long
- Provide detailed visual descriptions for AI image generation
- Write compelling narration optimized for voiceover
- Include emotional context and voiceover instructions

CRITICAL: Respond with JSON in this EXACT format:
{
  "title": "Compelling video title",
  "description": "Brief video description",
  "totalDuration": ${duration},
  "voiceProfile": {
    "gender": "${voiceGender}",
    "language": "${language}",
    "accent": "${accent}",
    "tone": "${tone}",
    "pace": "medium",
    "emphasis": "natural"
  },
  "scenes": [
    {
      "id": "scene_1",
      "duration": 5,
      "narration": "Clear, engaging narration text optimized for voiceover",
      "visualDescription": "Detailed visual description for AI image generation (cinematic, photorealistic, etc.)",
      "voiceInstructions": {
        "emotion": "calm/energetic/dramatic/inspiring",
        "pace": "slow/medium/fast",
        "emphasis": "words to emphasize",
        "pause": "natural pause points"
      },
      "visualElements": ["specific visual element 1", "element 2", "element 3"],
      "cameraAngle": "wide/close-up/medium/aerial",
      "lighting": "natural/dramatic/soft/golden hour"
    }
  ],
  "motionEngine": {
    "recommendation": "RunwayGen2/AnimateDiff",
    "reason": "Brief reason for engine choice based on scene complexity"
  }
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a complete video production script for: ${prompt}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 3000
      });

      const script = JSON.parse(response.choices[0].message.content || '{}');
      
      // Ensure all scenes have unique IDs and complete structure
      script.scenes = script.scenes.map((scene: any, index: number) => ({
        ...scene,
        id: scene.id || `scene_${index + 1}`,
        voiceInstructions: scene.voiceInstructions || {
          emotion: 'natural',
          pace: 'medium',
          emphasis: '',
          pause: 'natural'
        }
      }));

      console.log('[OPENAI] Complete video script generated successfully:', script.title);
      return script;

    } catch (error) {
      console.error('[OPENAI] Script generation error:', error);
      
      // Fallback to mock script for testing when OpenAI fails
      console.log('[OPENAI] Using fallback mock script for testing');
      return this.generateMockScript(prompt, duration, visualStyle, tone);
    }
  }

  /**
   * Generate a comprehensive mock script for testing when OpenAI fails
   */
  private generateMockScript(prompt: string, duration: number, visualStyle: string, tone: string, voiceGender = 'Female', language = 'English', accent = 'American') {
    const scenesCount = Math.min(Math.max(Math.ceil(duration / 5), 3), 8); // 3-8 scenes
    const sceneLength = Math.floor(duration / scenesCount);
    
    const scenes = [];
    for (let i = 0; i < scenesCount; i++) {
      scenes.push({
        id: `scene_${i + 1}`,
        duration: sceneLength,
        narration: `Scene ${i + 1}: This is a ${tone} segment about ${prompt}. The ${visualStyle} style creates engaging content that captures the viewer's attention and delivers the message effectively.`,
        visualDescription: `${visualStyle} cinematography showing ${prompt} - Scene ${i + 1}. High quality, professional production with excellent lighting and composition. Cinematic, photorealistic, 8K resolution.`,
        voiceInstructions: {
          emotion: i % 3 === 0 ? 'calm' : i % 3 === 1 ? 'energetic' : 'inspiring',
          pace: 'medium',
          emphasis: i % 2 === 0 ? 'key words' : 'natural flow',
          pause: 'natural pause points'
        },
        visualElements: ['cinematic lighting', 'professional composition', 'high quality', 'engaging visuals'],
        cameraAngle: i % 2 === 0 ? 'wide' : 'close-up',
        lighting: i % 3 === 0 ? 'natural' : i % 3 === 1 ? 'dramatic' : 'golden hour'
      });
    }

    return {
      title: `${prompt} - AI Generated Video`,
      description: `A ${duration}-second video about ${prompt} with ${visualStyle} style and ${tone} tone`,
      totalDuration: duration,
      voiceProfile: {
        gender: voiceGender,
        language: language,
        accent: accent,
        tone: tone,
        pace: 'medium',
        emphasis: 'natural'
      },
      scenes: scenes,
      motionEngine: {
        recommendation: 'AnimateDiff',
        reason: 'Mock script generation - using budget-friendly option for testing'
      }
    };
  }

  /**
   * Generate voiceover text optimized for ElevenLabs
   */
  async generateVoiceoverText(params: {
    scenes: any[];
    voiceProfile: any;
    totalDuration: number;
  }) {
    const { scenes, voiceProfile, totalDuration } = params;

    try {
      console.log('[OPENAI] Optimizing voiceover text for ElevenLabs...');

      const systemPrompt = `You are a voiceover optimization expert. Your task is to refine narration text to be perfectly suited for AI voiceover generation using ElevenLabs.

REQUIREMENTS:
- Optimize timing and pacing for ${totalDuration} seconds total duration
- Voice profile: ${voiceProfile.gender} voice, ${voiceProfile.language} language, ${voiceProfile.accent} accent
- Tone: ${voiceProfile.tone}
- Add natural pauses, emphasis markers, and pronunciation guides
- Ensure smooth transitions between scenes
- Maintain emotional consistency

For each scene, provide:
1. Optimized narration text with timing markers
2. Pronunciation guides for difficult words
3. Emotional emphasis instructions
4. Natural pause points

Respond with JSON in this format:
{
  "optimizedScenes": [
    {
      "id": "scene_1",
      "optimizedNarration": "Narration with (pause) and *emphasis* markers",
      "pronunciationGuide": "difficult-word: pronunciation",
      "timingNotes": "Speed up/slow down instructions",
      "emotionalCues": "Specific emotional direction for this scene"
    }
  ],
  "totalEstimatedDuration": ${totalDuration},
  "voiceSettings": {
    "stability": 0.75,
    "similarity_boost": 0.8,
    "style": 0.6
  }
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Optimize voiceover for scenes: ${JSON.stringify(scenes)}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2000
      });

      const optimizedVoiceover = JSON.parse(response.choices[0].message.content || '{}');
      console.log('[OPENAI] ✓ Voiceover optimization complete');
      return optimizedVoiceover;

    } catch (error) {
      console.error('[OPENAI] Voiceover optimization error:', error);
      
      // Fallback to basic optimization
      return {
        optimizedScenes: scenes.map(scene => ({
          id: scene.id,
          optimizedNarration: scene.narration,
          pronunciationGuide: '',
          timingNotes: 'natural pace',
          emotionalCues: scene.voiceInstructions?.emotion || 'natural'
        })),
        totalEstimatedDuration: totalDuration,
        voiceSettings: {
          stability: 0.75,
          similarity_boost: 0.8,
          style: 0.6
        }
      };
    }
  }

  /**
   * Generate enhanced scene descriptions for image generation
   */
  async generateSceneImagePrompts(params: {
    scenes: any[];
    visualStyle: string;
    overallTheme: string;
  }) {
    const { scenes, visualStyle, overallTheme } = params;

    try {
      console.log('[OPENAI] Generating enhanced scene image prompts...');

      const systemPrompt = `You are an expert AI image generation prompt engineer. Create highly detailed, optimized prompts for scene image generation using SDXL and similar models.

REQUIREMENTS:
- Visual style: ${visualStyle}
- Overall theme: ${overallTheme}
- Each prompt should be 50-100 words
- Include specific technical details for AI image generation
- Add negative prompts to avoid unwanted elements
- Ensure visual consistency across all scenes
- Use proven prompt engineering techniques

For each scene, provide:
1. Detailed positive prompt with technical specifications
2. Negative prompt to avoid unwanted elements
3. Style consistency notes
4. Technical settings recommendations

Respond with JSON in this format:
{
  "enhancedScenes": [
    {
      "id": "scene_1",
      "positivePrompt": "Detailed, technical prompt with style specifications",
      "negativePrompt": "Elements to avoid in generation",
      "styleNotes": "Consistency requirements",
      "technicalSettings": {
        "width": 1024,
        "height": 1024,
        "steps": 30,
        "guidance_scale": 7.5
      }
    }
  ],
  "overallStyleGuide": "Consistency guidelines for all scenes"
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create optimized image prompts for scenes: ${JSON.stringify(scenes)}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2500
      });

      const enhancedPrompts = JSON.parse(response.choices[0].message.content || '{}');
      console.log('[OPENAI] ✓ Enhanced scene image prompts generated');
      return enhancedPrompts;

    } catch (error) {
      console.error('[OPENAI] Scene image prompt generation error:', error);
      
      // Fallback to basic prompts
      return {
        enhancedScenes: scenes.map(scene => ({
          id: scene.id,
          positivePrompt: `${scene.visualDescription}, ${visualStyle}, cinematic, high quality, 8K, photorealistic`,
          negativePrompt: 'blurry, low quality, distorted, watermark, text, worst quality',
          styleNotes: `Maintain ${visualStyle} consistency`,
          technicalSettings: {
            width: 1024,
            height: 1024,
            steps: 30,
            guidance_scale: 7.5
          }
        })),
        overallStyleGuide: `Maintain consistent ${visualStyle} style throughout all scenes`
      };
    }
  }

  /**
   * Regenerate a specific scene in the script
   */
  async regenerateScene(params: {
    originalPrompt: string;
    sceneId: string;
    visualStyle: string;
    tone: string;
    currentScript: any;
  }) {
    const { originalPrompt, sceneId, visualStyle, tone, currentScript } = params;

    try {
      console.log('[OPENAI] Regenerating scene:', sceneId);

      const sceneIndex = currentScript.scenes.findIndex((scene: any) => scene.id === sceneId);
      if (sceneIndex === -1) {
        throw new Error('Scene not found');
      }

      const currentScene = currentScript.scenes[sceneIndex];
      const contextBefore = sceneIndex > 0 ? currentScript.scenes[sceneIndex - 1] : null;
      const contextAfter = sceneIndex < currentScript.scenes.length - 1 ? currentScript.scenes[sceneIndex + 1] : null;

      const systemPrompt = `You are regenerating a specific scene in a video script. 

Original video concept: ${originalPrompt}
Visual style: ${visualStyle}
Tone: ${tone}
Scene duration: ${currentScene.duration} seconds

Context:
${contextBefore ? `Previous scene: "${contextBefore.narration}"` : 'This is the first scene'}
Current scene to regenerate: "${currentScene.narration}"
${contextAfter ? `Next scene: "${contextAfter.narration}"` : 'This is the last scene'}

Create a new version of the current scene that:
- Maintains narrative flow with adjacent scenes
- Uses the same duration (${currentScene.duration} seconds)
- Matches the visual style and tone
- Provides fresh content while staying on topic

Respond with JSON in this exact format:
{
  "id": "${sceneId}",
  "duration": ${currentScene.duration},
  "narration": "New narration text for this scene",
  "description": "New detailed visual description for AI image generation",
  "emotion": "appropriate emotion",
  "visualElements": ["element1", "element2", "element3"]
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Regenerate this scene with fresh content while maintaining the narrative flow.` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.9,
        max_tokens: 500
      });

      const updatedScene = JSON.parse(response.choices[0].message.content || '{}');
      
      console.log('[OPENAI] Scene regenerated successfully:', sceneId);
      return updatedScene;

    } catch (error) {
      console.error('[OPENAI] Scene regeneration error:', error);
      throw new Error('Failed to regenerate scene with OpenAI GPT-4');
    }
  }
}

export default OpenAIService;
export { OpenAIService };