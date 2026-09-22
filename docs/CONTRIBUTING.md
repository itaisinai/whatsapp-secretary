# Contributing to WhatsApp Secretary

## Development Setup

1. **Prerequisites:**
   - Node.js >= 20.0.0
   - pnpm >= 8.0.0
   - Git

2. **Clone and Install:**
   ```bash
   git clone <repository-url>
   cd whatsapp-secretary
   pnpm install
   ```

3. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials (see docs/POC_SETUP.md)
   ```

## Project Structure

This is a pnpm workspace monorepo with:
- `apps/*` - Applications (hermes-controller, future: control-plane)
- `packages/*` - Shared packages (shared, mcp-server)
- `docs/*` - Documentation

## Development Workflow

### Adding a New Feature

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes:**
   - Follow TypeScript strict mode
   - Add types for everything
   - Write clear comments for complex logic
   - Add TODO comments for future work

3. **Test your changes:**
   ```bash
   pnpm dev  # Run and test manually
   pnpm build  # Ensure it builds
   pnpm lint  # Check for issues
   ```

4. **Commit and push:**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**

### Adding a New Tool

1. **Define the tool in `packages/mcp-server/src/tools/`:**
   ```typescript
   export const myNewTool: ToolDefinition = {
     name: 'my_new_tool',
     description: 'Clear description of what it does',
     parameters: { /* ... */ },
   };
   ```

2. **Register in MCP Server:**
   ```typescript
   // In packages/mcp-server/src/server.ts
   this.registerTool(myNewTool);
   ```

3. **Implement the provider:**
   - Add method to relevant provider class
   - Implement validation
   - Return structured results with sources

4. **Update types in `packages/shared/src/types/`**

5. **Test thoroughly**

### Adding a New Package

1. **Create package structure:**
   ```bash
   mkdir -p packages/my-package/src
   ```

2. **Add package.json:**
   ```json
   {
     "name": "@whatsapp-secretary/my-package",
     "version": "0.1.0",
     "private": true,
     "main": "dist/index.js"
   }
   ```

3. **Add tsconfig.json:**
   ```json
   {
     "extends": "../../tsconfig.json",
     "compilerOptions": {
       "outDir": "./dist",
       "rootDir": "./src",
       "composite": true
     }
   }
   ```

4. **Update root tsconfig paths if needed**

5. **Install dependencies:**
   ```bash
   pnpm install
   ```

## Code Style

### TypeScript
- Use strict mode
- Explicit types (avoid `any`)
- Use interfaces for public APIs
- Use types for unions/intersections

### Naming
- Files: kebab-case (`email-provider.ts`)
- Classes: PascalCase (`EmailProvider`)
- Functions/variables: camelCase (`searchEmails`)
- Constants: UPPER_SNAKE_CASE (`MAX_EMAIL_LIMIT`)
- Types/Interfaces: PascalCase (`SearchEmailsParams`)

### Comments
- Code comments in English
- User-facing text in Hebrew
- TODO format: `// TODO: Description (Phase X)`
- Document why, not what

### Error Handling
- Use specific error messages
- Include context in errors
- Log errors appropriately
- Don't swallow errors

## Testing

### Manual Testing (Current)
```bash
pnpm dev
# Test with example queries in Hebrew
```

### Future: Automated Testing
- Unit tests for utilities
- Integration tests for providers
- E2E tests for full flow

## Git Commit Messages

Format: `<type>: <description>`

Types:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks
- `style:` Code style changes

Examples:
```
feat: add search_emails tool
fix: handle missing sender in email search
docs: update POC setup guide
refactor: extract email validation logic
chore: update dependencies
```

## Pull Request Guidelines

1. **Title:** Clear and descriptive
2. **Description:**
   - What changed
   - Why it changed
   - How to test
3. **Checklist:**
   - [ ] Code builds without errors
   - [ ] Tested manually
   - [ ] Documentation updated
   - [ ] No breaking changes (or documented)
   - [ ] Environment variables documented

## Security Guidelines

1. **Never commit:**
   - `.env` file
   - API keys or passwords
   - Personal information

2. **Use:**
   - App passwords (not main passwords)
   - Environment variables
   - Read-only access when possible

3. **Validate:**
   - All user inputs
   - All external data
   - Date ranges and limits

4. **Sanitize:**
   - Output data
   - Error messages
   - Log messages

## Documentation

When adding features:
1. Update relevant docs in `docs/`
2. Update CLAUDE.md if architecture changes
3. Update README.md if setup changes
4. Add comments for complex logic

## Getting Help

- Check existing documentation in `docs/`
- Read CLAUDE.md for project context
- Review B-Fresh Tech Design document
- Ask in team chat

## Phase-Specific Guidelines

### Phase 1 (POC)
- Focus on core functionality
- Use TODOs for Phase 2+ features
- No need for production-grade error handling
- Manual testing is sufficient

### Phase 2 (WhatsApp Integration)
- Add proper error handling
- Implement audit logging
- Add integration tests
- Consider edge cases

### Phase 3 (Extended Features)
- Production-ready code
- Full test coverage
- Performance optimization
- Monitoring and alerts
