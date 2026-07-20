<div align="center" markdown="1">

# Excel Formula Trainer

> **An interactive, beginner-friendly web app for learning Microsoft Excel formulas. No build step, no dependencies, no backend — plain HTML, CSS, and JavaScript.**

[![Version](https://img.shields.io/badge/version-0.1.11-blue.svg)](https://github.com/excel-formula-trainer)
[![Language](https://img.shields.io/badge/language-JavaScript-green.svg)](https://github.com/excel-formula-trainer)
[![Generated](https://img.shields.io/badge/generated-docgen-8A2BE2)](https://github.com/opencode-ai/docgen)

</div>

---

## 📋 Table of Contents

- [**Installation**](installation.md) — Setup and installation guide
- [**Quick Start**](quickstart.md) — Getting started quickly
- [**API Reference**](api-reference.md) — Full API documentation

---

## 🚀 Overview

### 🚀 Overview

`docgen` is an AI-powered documentation generation engine designed to automatically analyze source codebases and produce comprehensive, high-quality, and structured documentation. Built with Python 3.11+ and powered by the `Typer` framework, `docgen` parses source files (including JavaScript, HTML, CSS, and Python) to construct a semantic understanding of a project, and then leverages Large Language Models (LLMs) to generate API references, user guides, and system overviews.

The tool is highly relevant for projects such as the **Excel Formula Trainer** (a client-side web application consisting of `app.js`, `data.js`, `locales.js`, `index.html`, and `style.css`), where it can extract context from JavaScript files, HTML templates, and localized strings to generate comprehensive user and developer documentation without manual writing.

#### Core Architecture

- **Context Collection**: The `ContextCollector` and `SourceParser` scan the target directory, utilizing specialized parsers like `JsTsParser` and `HtmlParser` to extract structured syntax trees, comments, and metadata.
- **Git Integration**: The `GitExtractor` retrieves historical context and commit messages to understand how the codebase evolved.
- **LLM Engine**: The `GenerationEngine` coordinates with various LLM providers (via `ProviderFactory` and `LLMProvider`) to generate documentation sections.
- **Caching Layer**: To optimize performance and reduce API costs, `docgen` employs both a standard `ResponseCache` and a `SemanticCache` to avoid regenerating unchanged sections.
- **Output Formats**: Documentation can be served locally via a built-in preview server, exported to a single self-contained HTML file, compiled into a PDF, or structured as a MkDocs site configuration.

---

## ✨ Features

### ✨ Key Features

- **Multi-Language Parsing**: Built-in AST-based parsers such as `JsTsParser` and `HtmlParser` extract logical structures, functions, classes, and UI elements from source files.
- **AI-Powered Generation & Refinement**: Generates high-quality documentation using state-of-the-art LLMs, with the ability to iteratively refine specific sections using the `docgen refine` command.
- **Semantic Caching**: Reduces LLM API usage and costs by caching responses using semantic similarity (`SemanticCache` and `ResponseCache`).
- **Flexible Export Formats**: Supports multiple export targets including self-contained HTML files via `docgen html`, PDF documents via `docgen export`, and MkDocs site configurations via `docgen site`.
- **Local Live Preview**: A built-in development server (`docgen serve`) with file-watching capabilities to preview documentation changes in real-time.
- **Extensible Provider Architecture**: Supports multiple LLM backends (configured via `docgen setup` and listed via `docgen providers`).

---

<div align="center" markdown="1">

*Generated with ❤️ by [docgen](https://github.com/opencode-ai/docgen) on 2026-07-16*

</div>