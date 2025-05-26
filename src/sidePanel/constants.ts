export const GROQ_URL = 'https://api.groq.com/openai/v1/models';
export const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/models';
export const OPENAI_URL = 'https://api.openai.com/v1/models';
export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/models';

export const personaImages: {
  Agatha: string;
  Spike: string;
  Warren: string;
  Jet: string;
  Jan: string;
  Sherlock: string;
  Ein: string;
  Faye: string;
  default: string;
  [key: string]: string | undefined;
} = {
  Agatha: 'assets/images/agatha.png',
  Spike: 'assets/images/spike.png',
  Warren: 'assets/images/warren.png',
  Jet: 'assets/images/jet.png',
  Jan: 'assets/images/jan.png',
  Sherlock: 'assets/images/sherlock.png',
  Ein: 'assets/images/ein.png',
  Faye: 'assets/images/faye.png',
  default: 'assets/images/custom.png'
};

