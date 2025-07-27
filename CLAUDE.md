# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context: Hebrew RTL Chatbot

This is a production-ready Hebrew Right-to-Left (RTL) chatbot application built with modern web technologies. The project demonstrates advanced UI/UX patterns for Hebrew language applications with AI integration.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

### Testing & Quality
- Run `npm run lint` after making changes to ensure code quality
- Build with `npm run build` to verify TypeScript compilation
- No specific test framework configured - add tests if implementing new features

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14 App Router with Edge Runtime
- **UI**: shadcn/ui components + Framer Motion animations
- **Styling**: Tailwind CSS with RTL configuration
- **AI**: Claude Sonnet 4 (claude-sonnet-4-20250514) via Anthropic SDK
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Fonts**: Noto Sans Hebrew + Inter for proper Hebrew display

### Key Architecture Patterns
- **Component memoization** for performance optimization
- **Debounced scroll behavior** to prevent blinking during streaming
- **Edge runtime** for optimal global performance (`export const runtime = 'edge'`)
- **Row Level Security (RLS)** for data protection in Supabase
- **Streaming responses** with ReadableStream for real-time AI chat

### File Structure Overview
```
app/
├── api/
│   ├── chat/route.ts           # Claude streaming endpoint (Edge runtime)
│   ├── conversations/route.ts  # CRUD operations for conversations
│   ├── files/[conversationId]/route.ts  # File management
│   ├── process-file/route.ts   # File processing (PDF, DOCX, etc.)
│   └── upload/route.ts         # File upload handling
├── globals.css                 # RTL styles + Hebrew fonts
├── layout.tsx                  # RTL + theme provider setup
└── page.tsx                    # Main chat interface

components/chat/
├── ChatInterface.tsx           # Main chat container with state management
├── ConversationSidebar.tsx     # History sidebar with mobile drawer
├── MessageBubble.tsx           # Individual message display with RTL
├── StreamingMessage.tsx        # Real-time typing animation
├── MessageInput.tsx            # Hebrew RTL input with send functionality
├── MessageList.tsx             # Animated message container with scroll
├── MediaGallery.tsx            # File upload and media management
└── FileUploadButton.tsx        # File upload interface

lib/
├── anthropic.ts                # Claude client and streaming setup
├── supabase.ts                 # Database client configuration
├── file-utils.ts               # File processing utilities
├── types.ts                    # TypeScript definitions
└── utils.ts                    # General utilities
```

### Critical RTL Implementation Details
- **Layout Direction**: `dir="rtl"` set in root layout
- **Font Loading**: Dual font setup (Hebrew + Latin) with CSS variables
- **Chat Bubbles**: User messages on left, assistant on right (RTL flow)
- **Toast Notifications**: RTL-configured with Hebrew fonts
- **Component Styling**: All components use RTL-aware Tailwind classes

### Database Schema (Supabase)
- **conversations**: Chat session storage with Hebrew titles
- **messages**: Individual chat messages with role-based structure
- **conversation_files**: File attachments linked to conversations
- **message_files**: Junction table for message-file relationships
- **profiles**: User profile management

### API Endpoints Architecture
- **POST /api/chat**: Streaming chat with Claude using ReadableStream
- **GET/POST /api/conversations**: Full CRUD for conversation management
- **POST /api/upload**: File upload with type validation
- **POST /api/process-file**: Extract text from PDFs, DOCX, Excel files
- **GET /api/files/[conversationId]**: Retrieve conversation files

---

## Architecture Decisions
Consider implications before making changes:
- Impact on existing functionality
- Performance considerations  
- Scalability requirements
- Security implications
- Maintainability and code clarity

## Use Git Tools

- **Before modifying files** - Understand history and context
- **When tests fail** - Check recent changes for root cause
- **Finding related code** - Use `git grep` for comprehensive search
- **Understanding features** - Follow evolution through commit history
- **Checking workflows** - Investigate CI/CD issues and pipeline failures

## The Ten Universal Commandments

1. **Thou shalt ALWAYS use MCP tools before coding**
2. **Thou shalt NEVER assume; always question**
3. **Thou shalt write code that's clear and obvious**
4. **Thou shalt be BRUTALLY HONEST in assessments**
5. **Thou shalt PRESERVE CONTEXT, not delete it**
6. **Thou shalt make atomic, descriptive commits**
7. **Thou shalt document the WHY, not just the WHAT**
8. **Thou shalt test before declaring done**
9. **Thou shalt handle errors explicitly**
10. **Thou shalt treat user data as sacred**

## Final Reminders

- **Codebase > Documentation > Training data** (in order of truth)
- Research current docs, don't trust outdated knowledge
- Ask questions early and often
- Use slash commands for consistent workflows
- Derive documentation on-demand
- Extended thinking for complex problems
- Visual inputs for UI/UX debugging
- Test locally before pushing
- **Think simple: clear, obvious, no bullshit**

---

**Remember**: Write code as if the person maintaining it is a violent psychopath who knows where you live. Make it that clear.

⌘K to generate a command