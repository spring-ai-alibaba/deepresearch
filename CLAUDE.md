# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Spring AI Alibaba DeepResearch is an AI-powered research automation platform that provides intelligent deep research capabilities with automated task planning, multi-source search integration, and report generation.

## Technology Stack

- **Backend**: Java 17, Spring Boot 3.4.8, Spring AI 1.0.0, Spring AI Alibaba 1.0.0.4
- **Frontend**: Vue 3 with TypeScript, Vite 5.x, Ant Design Vue 4.x, Pinia
- **AI Integration**: DashScope API with multiple search engines (Tavily, Jina, Baidu, SerpAPI, Aliyun AI Search)
- **Data Storage**: Redis (optional), Elasticsearch (for RAG)
- **Build Tools**: Maven 3.x (backend), pnpm (frontend)

## Development Commands

### Backend (Maven)
```bash
# Start development server
mvn spring-boot:run

# Build project
mvn clean package

# Run tests
mvn test

# Skip tests during build
mvn clean package -DskipTests
```

### Frontend (Vue 3)
```bash
cd ui-vue3

# Install dependencies
pnpm install

# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run format

# Run tests
npm run test:unit
```

### Docker
```bash
# Build Docker image
docker build -t alibaba-deepresearch:v1.0 .

# Run with Docker Compose
docker-compose up
```

## Architecture Overview

### Core Components
- **Graph-Based Execution**: Uses Spring AI Alibaba Graph framework for workflow orchestration with node-based execution
- **Agent-Based Architecture**: Multiple specialized AI agents with smart routing based on query type
- **Multi-Modal Search**: Unified search interface across multiple providers with intelligent result aggregation
- **Event-Driven Design**: Streaming response architecture with real-time progress updates

### Key Backend Modules
- `controller/`: REST API endpoints (Chat, Report, Mcp, RagData)
- `service/`: Business logic services
- `agents/`: AI agent implementations
- `node/`: Graph execution nodes
- `rag/`: Retrieval-Augmented Generation components
- `config/`: Configuration classes

### Frontend Structure
- `src/components/`: Vue components with Monaco Editor integration
- `src/views/`: Page views with streaming chat interface
- `src/router/`: Vue Router configuration
- Pinia for state management with persistence

## Required Environment Variables

```bash
# Required
AI_DASHSCOPE_API_KEY=your_dashscope_key
TAVILY_API_KEY=your_tavily_key

# Optional
JINA_API_KEY=your_jina_key
ALIYUN_AI_SEARCH_API_KEY=your_aliyun_key
ALIYUN_AI_SEARCH_BASE_URL=your_aliyun_url
REDIS_PASSWORD=your_redis_password
AI_DEEPRESEARCH_EXPORT_PATH=/path/to/export
```

## Configuration Files

- `src/main/resources/application.yml`: Main application configuration
- `src/main/resources/application-observability.yml`: Monitoring and observability
- `src/main/resources/application-kb.yml`: Knowledge base and RAG configuration

## Key Features

- **Deep Research Agent**: AI-powered research automation with graph-based execution
- **Multi-Source Search**: Integration with Tavily, Jina, Baidu, SerpAPI, Aliyun AI Search
- **Report Generation**: Automated research reports with PDF/Markdown export
- **RAG Support**: Elasticsearch integration for retrieval-augmented generation
- **Real-time Chat**: Streaming conversation interface
- **Task Planning**: Intelligent task decomposition and execution
- **Observability**: OpenTelemetry and Langfuse integration
- **MCP Services**: Model Context Protocol support

## API Endpoints

- `POST /chat/stream` - Real-time chat streaming
- `GET /api/reports/{threadId}` - Retrieve research reports
- `POST /api/rag/upload` - Upload documents for RAG
- `GET /api/mcp/services` - MCP service discovery

## Development Setup

1. Set required environment variables
2. Start backend: `mvn spring-boot:run`
3. Start frontend: `cd ui-vue3 && pnpm install && npm run dev`
4. Access application at `http://localhost:5173` (frontend) and `http://localhost:8080` (backend API)
