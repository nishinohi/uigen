# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator built with Next.js 15, TypeScript, and Claude AI. It features a chat interface for describing components and a live preview/code editor for real-time development.

## Essential Commands

```bash
# Initial setup (installs deps, generates Prisma client, runs migrations)
npm run setup

# Development
npm run dev              # Start dev server with Turbopack
npm run dev:daemon       # Run dev server in background with logging

# Code quality
npm run lint             # Run ESLint
npm run test             # Run Vitest tests

# Build & production
npm run build            # Create production build
npm run start            # Start production server

# Database
npm run db:reset         # Reset database (destructive)
npx prisma generate      # Regenerate Prisma client
npx prisma migrate dev   # Run database migrations
```

## Architecture Overview

The application uses a virtual file system architecture where all generated components exist in memory without writing to disk. Key architectural patterns:

### Core Flow
1. User describes component in chat interface (left panel)
2. AI generates React component code using custom tools
3. Virtual file system manages component files in memory
4. Live preview renders component in iframe (right panel)
5. Monaco editor allows manual code editing
6. Projects persist to SQLite database for authenticated users

### Key Directories
- `/src/app/` - Next.js App Router pages and API routes
- `/src/components/chat/` - Chat interface components
- `/src/components/code-editor/` - Monaco editor and file tree
- `/src/components/preview/` - Component preview system
- `/src/lib/tools/` - AI tool implementations for file management
- `/src/lib/contexts/` - React contexts for state management
- `/src/actions/` - Server actions for database operations

### State Management
- `ChatContext` - Manages chat messages and AI interactions
- `FileSystemContext` - Virtual file system state
- `AuthContext` - Authentication state
- `PreviewContext` - Preview component state

### AI Integration
The app uses Vercel AI SDK with custom tools:
- `createFile` - Creates virtual files
- `editFile` - Modifies existing files
- `readFile` - Reads file contents
- `deleteFile` - Removes files
- `listFiles` - Lists directory contents

These tools operate on the virtual file system without disk I/O.

## Testing

Tests use Vitest with jsdom environment. Run individual tests with:
```bash
npx vitest path/to/test.tsx
```

Key testing patterns:
- Mock `next/navigation` for router testing
- Mock contexts when testing components in isolation
- Use React Testing Library for component interactions

## Database

Uses Prisma with SQLite. Schema includes:
- `User` - Authentication (email, hashedPassword)
- `Project` - Component data (code, messages, metadata)

Prisma client generates to `/src/generated/prisma/`

## Environment Variables

Required in `.env`:
- `ANTHROPIC_API_KEY` - Claude API key (optional - uses mock if missing)

## Development Tips

1. The virtual file system is central to the app - all component files are managed in memory
2. Authentication is JWT-based with httpOnly cookies
3. Preview uses sandboxed iframe with error boundaries
4. Monaco editor configuration is in `/src/components/code-editor/monaco-config.ts`
5. Tailwind CSS v4 with shadcn/ui components (New York style)

## Coding Philosophy

- 簡単な実装にコメントは残さず、複雑な実装となっているコードを理解するための補助となるコメントを残すようにしてください。

## Database Schema Management

- DBスキーマは @prisma/schema.prisma に定義しています。DB に保存しているデータ構造の情報が必要な場合は常に参照するようにしてください

## Testing Configuration

- vitest の設定は @vitest.config.mts に記載している