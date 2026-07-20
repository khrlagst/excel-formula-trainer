
# 🚀 Quick Start

### 🚀 Quick Start

This guide demonstrates how to initialize, generate, and preview documentation for a project (such as the **Excel Formula Trainer** codebase containing `app.js`, `data.js`, and `index.html`).

#### Step 1: Initialize the Documentation Project

Scaffold a new documentation configuration in your project directory:
```bash
docgen init --force
```

#### Step 2: Generate Documentation

Generate the documentation using the default LLM provider and model:
```bash
docgen generate --source . --output ./docs --semantic-cache
```

#### Step 3: Preview Locally

Start the local development server to preview the generated documentation in your browser:
```bash
docgen serve --docs-dir ./docs --port 8000 --watch
```
Open your browser and navigate to `http://localhost:8000` to view the live documentation.