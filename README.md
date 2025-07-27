# צ'אט בוט עברי - Hebrew AI Chatbot

A beautiful, scalable Hebrew RTL chatbot built with Next.js 14, Claude Sonnet 4, and Supabase.

## Features

- 🇮🇱 **Hebrew RTL Support** - Complete Hebrew interface with proper RTL layout
- 🤖 **Claude Sonnet 4 Integration** - Powered by Anthropic's latest model
- ⚡ **Streaming Responses** - Real-time AI response streaming with typewriter effect
- 💾 **Conversation History** - Persistent chat history with Supabase
- 🎨 **Beautiful UI** - shadcn/ui components with Framer Motion animations
- 📱 **Responsive Design** - Mobile-first with animated sidebar
- 🌙 **Dark/Light Mode** - Professional theme switching
- 🚀 **Vercel Ready** - Optimized for Vercel Edge Functions

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **UI Library**: shadcn/ui + Framer Motion
- **Styling**: Tailwind CSS with RTL configuration
- **AI Model**: Claude Sonnet 4 (claude-sonnet-4-20250514)
- **Database**: Supabase (PostgreSQL + real-time)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel Edge Functions

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file with the following variables:

```env
# AI API Keys
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
3. Enable Row Level Security (RLS) policies

### 4. Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 5. Deployment to Vercel

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # Claude streaming endpoint
│   │   └── conversations/route.ts # CRUD operations
│   ├── globals.css                # RTL styles + Hebrew fonts
│   ├── layout.tsx                 # RTL + theme provider
│   └── page.tsx                   # Main chat interface
├── components/
│   ├── ui/                        # shadcn components
│   ├── chat/                      # Chat interface components
│   └── providers/                 # Theme provider
├── lib/
│   ├── supabase.ts               # Database client
│   ├── anthropic.ts              # Claude client
│   ├── utils.ts                  # Utilities
│   └── types.ts                  # TypeScript definitions
└── supabase/
    └── schema.sql                # Database schema
```

## Key Components

### Chat Interface
- **MessageBubble**: Individual message display with RTL support
- **StreamingMessage**: Real-time typing animation for AI responses
- **MessageInput**: Hebrew RTL input with send functionality
- **MessageList**: Animated message container with scroll management
- **ConversationSidebar**: History sidebar with mobile drawer

### API Endpoints
- **POST /api/chat**: Streaming chat responses using Claude Sonnet 4
- **GET/POST /api/conversations**: Conversation CRUD operations

## Hebrew RTL Features

- Complete Hebrew interface with proper RTL layout
- Hebrew fonts (Noto Sans Hebrew + Inter)
- RTL-aware chat bubbles and animations
- Hebrew placeholders and error messages
- Professional commercial design

## Development Notes

- Uses Edge Runtime for optimal performance
- Framer Motion for smooth animations
- Row Level Security for data protection
- TypeScript for type safety
- ESLint for code quality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.