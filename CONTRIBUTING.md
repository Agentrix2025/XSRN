# Contributing to XSRN

Thank you for your interest in contributing to XSRN (X402 Service Routing Network)! This document provides guidelines and information about contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## 📜 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive criticism
- Avoid harassment and discrimination

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- A code editor (VS Code recommended)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/XSRN.git
cd XSRN
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/Agentrix2025/XSRN.git
```

## 💻 Development Setup

### Install Dependencies

```bash
npm install
```

### Environment Configuration

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

## 🔧 Making Changes

### Branch Naming

Use descriptive branch names:

- `feature/add-reward-calculation` - New features
- `fix/merkle-proof-validation` - Bug fixes
- `docs/update-api-reference` - Documentation updates
- `refactor/optimize-gas-usage` - Code refactoring

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(contracts): add batch claim function to MerkleDistributor
fix(sdk): correct epoch end time calculation
docs(readme): update deployment instructions
```

## 📤 Submitting Changes

### Pull Request Process

1. Update your fork with the latest upstream changes:

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

2. Create a new branch:

```bash
git checkout -b feature/your-feature-name
```

3. Make your changes and commit them

4. Push to your fork:

```bash
git push origin feature/your-feature-name
```

5. Open a Pull Request on GitHub

### Pull Request Template

When opening a PR, please include:

- **Description**: What does this PR do?
- **Motivation**: Why is this change needed?
- **Testing**: How was this tested?
- **Checklist**:
  - [ ] Tests pass locally
  - [ ] Code follows style guidelines
  - [ ] Documentation updated if needed
  - [ ] No breaking changes (or documented if any)

## 📝 Coding Standards

### Solidity

- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use NatSpec comments for all public functions
- Keep contracts under 300 lines when possible
- Use meaningful variable and function names

Example:
```solidity
/**
 * @notice Claims rewards for a specific epoch
 * @param epochId The epoch to claim rewards from
 * @param amount The amount to claim
 * @param merkleProof The Merkle proof for verification
 * @return success Whether the claim was successful
 */
function claim(
    uint256 epochId,
    uint256 amount,
    bytes32[] calldata merkleProof
) external returns (bool success) {
    // Implementation
}
```

### TypeScript

- Use TypeScript strict mode
- Define interfaces for all data structures
- Use async/await instead of callbacks
- Document public APIs with JSDoc

Example:
```typescript
/**
 * Generates a Merkle tree from reward data
 * @param rewards - Array of reward entries
 * @returns The generated Merkle tree with root and proofs
 */
async function generateMerkleTree(
  rewards: RewardEntry[]
): Promise<MerkleTreeResult> {
  // Implementation
}
```

### Code Formatting

Run before committing:

```bash
npm run lint:fix
npm run format
```

## 🧪 Testing

### Writing Tests

- Write tests for all new features
- Aim for >90% code coverage
- Test both success and failure cases
- Use descriptive test names

Example:
```typescript
describe('MerkleDistributor', () => {
  describe('claim', () => {
    it('should successfully claim with valid proof', async () => {
      // Test implementation
    });

    it('should revert when already claimed', async () => {
      // Test implementation
    });

    it('should revert with invalid proof', async () => {
      // Test implementation
    });
  });
});
```

### Running Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Specific file
npx hardhat test test/MerkleDistributor.test.ts
```

## 📖 Documentation

### When to Update Docs

- New features or APIs
- Changed behavior
- Bug fixes that affect usage
- Configuration changes

### Documentation Structure

- `README.md` - Project overview
- `docs/api/` - API reference
- `docs/guides/` - How-to guides
- `CHANGELOG.md` - Version history

## 🏷️ Versioning

We use [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## 🆘 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discord**: For questions and discussions
- **Email**: dev@agentrix.top

## 🙏 Recognition

Contributors will be recognized in:

- `CONTRIBUTORS.md` file
- Release notes
- Project website

Thank you for contributing to XSRN! 🎉
