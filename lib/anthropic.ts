import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function createChatStream(messages: { role: 'user' | 'assistant'; content: string }[]) {
  const stream = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: messages,
    stream: true,
  });

  return stream;
}

export { anthropic };