# Web Automation Course

Welcome to the Web Automation course repository. This project provides the examples, exercises, and learning material for building maintainable browser automation with Playwright and TypeScript.

## Course Scope

The course covers the complete web automation lifecycle, from framework setup and test design to reporting, debugging, and continuous integration with GitHub Actions. The main topics include:

- Web automation foundations and Playwright setup
- Test framework structure and the first automated test
- Design patterns and maintainable test architecture
- Development lifecycle and team practices
- Test lifecycle control
- Locators, selectors, and the DOM
- Assertions and validation strategies
- Wait strategies and synchronization
- Browser automation workflows
- Reports and debugging techniques
- CI/CD with GitHub Actions

## Learning Path

The course material is organized into progressive modules:

| Module | Topic |
| --- | --- |
| M1 | Course overview |
| M2 | Introduction to web automation |
| M3 | Framework setup and first test |
| M4 | Design patterns |
| M5 | Development lifecycle and team practices |
| M6 | Test lifecycle control |
| M7 | Locators, selectors, and the DOM |
| M8 | Assertions |
| M9 | Wait strategies |
| M10 | Browser automation |
| M11 | Reports and debugging |
| M12 | CI, GitHub Actions, and wrap-up |

Additional material covers the automation lifecycle and the use of AI skills in automation projects.

## Repository Structure

```text
automation-course/
├── docs/                  # Published course material
├── .gitignore             # Shared exclusions for the project
└── README.md              # Course and repository overview
```

The `docs/` directory is the publication area for the course material. New presentations, guides, diagrams, and reference documents should be organized there as they are added to the repository.

## Prerequisites

Install the following tools before starting:

- Node.js LTS
- npm
- Git
- Visual Studio Code
- Basic TypeScript knowledge
- Basic software testing concepts

Playwright and the project dependencies will be added as the implementation evolves.

## Getting Started

Clone the repository and enter the project directory:

```bash
git clone https://github.com/anaelince/web-automation.git
cd web-automation
```

Install dependencies after the project configuration is available:

```bash
npm install
```

Run the available Playwright tests with:

```bash
npx playwright test
```

## Documentation

Course presentations and supporting resources are stored in [`docs/`](docs/). The documentation will grow alongside the practical automation examples so that each topic can be studied and applied in the same repository.

## Contribution Guidelines

When adding course content or examples:

1. Keep documentation and code examples in English.
2. Place published learning material in `docs/`.
3. Follow the existing module naming convention.
4. Keep examples focused on one automation concept at a time.
5. Do not commit secrets, local environment files, test reports, or generated Playwright artifacts.

## Repository Integration

This repository uses GitHub for source control, collaboration, and future CI/CD workflows.
