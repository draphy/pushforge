# Contributing to PushForge

Thank you for your interest in contributing to PushForge! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to uphold our Code of Conduct, which expects all contributors to be respectful and create a harassment-free experience for everyone.

## Contribution Workflow

We follow a structured workflow for all contributions. Here's the process:

### 1. Create an Issue

- Before making any changes, start by creating an issue in the [GitHub issue tracker](https://github.com/draphy/pushforge/issues)
- Clearly describe the bug, feature, or improvement you want to address
- Wait for a Linear issue number to be assigned in the comments

### 2. Branch Naming Convention

Create a branch with the following naming format:

```
username/wpn-issuenumber-issuetitle
```

Example:

```
johndoe/wpn-123-fix-payload-encryption
```

### 3. Fork and Clone the Repository

- Fork the repository to your GitHub account
- Clone your fork to your local machine
- Add the upstream repository as a remote

```bash
git clone https://github.com/yourusername/pushforge.git
cd pushforge
git remote add upstream https://github.com/draphy/pushforge.git
```

### 4. Set Up the Development Environment

```bash
# Install dependencies
pnpm install

# Build packages
pnpm build
```

### 5. Make Your Changes

- Create a new branch with the proper naming convention
- Make your changes following the coding conventions
- Write or update tests as needed
- Update documentation if necessary

### 6. Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for clear and meaningful commit messages.

Format:

```
<type>: [WPN-<issue-number>] <description>
```

Where `type` is one of:

- `feat`: A new feature
- `fix`: A bug fix
- `bug`: A bug fix (alternative to fix)
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `ci`: CI configuration changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `chore`: Maintenance tasks
- `revert`: Reverting changes
- `release`: Release-related changes

Example:

```
feat: [WPN-123] Add support for Safari push notifications
```

### 7. Pull Request Process

1. Push your changes to your fork
2. Create a pull request against the main repository
3. Use this format for the PR title:
   ```
   <type>: [WPN-<issue-number>] <Title starting with capital letter>
   ```
   Example:
   ```
   feat: [WPN-123] Add support for Safari push notifications
   ```
4. Provide a detailed description in the PR
5. Link the PR to the relevant issue
6. Ensure all status checks pass
7. Request a review from at least one maintainer

Pull requests require approval from at least one reviewer before they can be merged.

### 8. Code Quality Tools

Before submitting your PR, ensure your code passes all checks by running:

```bash
# Format and lint with Biome
pnpm biome:format
pnpm biome:lint

# Run type checking
pnpm type:check

# Run all checks and build (recommended before commit)
pnpm commit:check
```

## Development Guidelines

### Code Style

We use [Biome](https://biomejs.dev/) for linting and formatting. Our code style is enforced by the configuration in the repository.

### Testing

- Write tests for new features and bug fixes
- Maintain or improve test coverage
- Run tests locally before submitting a PR

### Documentation

- Update documentation to reflect any changes
- Use clear and concise language
- Follow the existing documentation style

## Getting Help

If you need help with the contribution process or have questions, feel free to:

- Comment on the relevant issue
- Ask questions in pull requests
- Reach out to the maintainers

---

Thank you for contributing to PushForge! Your efforts help make this project better for everyone.
