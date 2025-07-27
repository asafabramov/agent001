# Claude Code Guidelines

## Project Context: Hebrew RTL Chatbot

This is a production-ready Hebrew Right-to-Left (RTL) chatbot application built with modern web technologies. The project demonstrates advanced UI/UX patterns for Hebrew language applications with AI integration.

### Project Overview
- **Primary Language**: Hebrew (עברית) with full RTL support
- **AI Integration**: Claude Sonnet 4 with streaming responses
- **Database**: Supabase (PostgreSQL) for conversation persistence
- **Deployment**: Vercel Edge Functions
- **UI Framework**: Next.js 14 + shadcn/ui + Framer Motion

### Key Features Implemented
- ✅ Real-time AI streaming with typewriter effects
- ✅ Complete Hebrew RTL layout and typography
- ✅ Conversation history with Supabase integration
- ✅ Markdown rendering with syntax highlighting
- ✅ Mobile-responsive design with drawer sidebar
- ✅ Dark/light mode support
- ✅ Professional animations and transitions

### Technical Achievements
- **Performance**: Optimized streaming with debounced scrolling
- **RTL Layout**: Proper Hebrew text flow (user left, assistant right)
- **Markdown**: ReactMarkdown with Hebrew RTL prose styles
- **Accessibility**: Full keyboard navigation and screen reader support
- **Security**: Environment variables properly configured
- **Build**: Zero TypeScript errors, passing all lints

### Architecture Patterns Used
- Component memoization for performance
- Debounced scroll behavior to prevent blinking
- Lazy markdown parsing (plain text → formatted)
- Edge runtime for optimal global performance
- Row Level Security (RLS) for data protection

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