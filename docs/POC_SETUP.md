# POC Setup Guide

This guide will help you set up the POC environment for the WhatsApp Secretary project.

## Prerequisites

1. **Node.js** >= 20.0.0
2. **pnpm** >= 8.0.0
3. **Email account** (Gmail or Outlook) with 2-Factor Authentication enabled

## Email Provider Setup

The POC requires read-only access to an email account. You have two options:

### Option 1: Gmail with App Password (Recommended for POC)

1. **Enable 2-Factor Authentication** on your Google account:
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate an App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select "Other" as the device and name it "WhatsApp Secretary POC"
   - Click "Generate"
   - Copy the 16-character password (without spaces)

3. **Add to .env**:
   ```bash
   EMAIL_PROVIDER=gmail
   EMAIL_ADDRESS=your.email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # The app password you generated
   ```

### Option 2: Outlook with App Password

1. **Enable 2-Factor Authentication** on your Microsoft account:
   - Go to https://account.microsoft.com/security
   - Enable Two-step verification

2. **Generate an App Password**:
   - Go to https://account.microsoft.com/security
   - Click "Advanced security options"
   - Under "App passwords", click "Create a new app password"
   - Copy the generated password

3. **Add to .env**:
   ```bash
   EMAIL_PROVIDER=outlook
   EMAIL_ADDRESS=your.email@outlook.com
   EMAIL_PASSWORD=the_app_password_you_generated
   ```

### Option 3: OAuth2 Flow (Future Implementation)

OAuth2 will be supported in future versions for better security. This will eliminate the need for app passwords.

## LLM Provider Setup

### OpenAI

1. Get your API key from https://platform.openai.com/api-keys
2. Add to .env:
   ```bash
   LLM_PROVIDER=openai
   LLM_API_KEY=sk-...
   LLM_MODEL=gpt-4-turbo-preview
   ```

### Anthropic Claude

1. Get your API key from https://console.anthropic.com/
2. Add to .env:
   ```bash
   LLM_PROVIDER=anthropic
   LLM_API_KEY=sk-ant-...
   LLM_MODEL=claude-3-opus-20240229
   ```

## Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   cd whatsapp-secretary
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Copy environment template**:
   ```bash
   cp .env.example .env
   ```

4. **Edit .env** with your actual credentials:
   ```bash
   nano .env  # or use your preferred editor
   ```

## Running the POC

### Test the connection:
```bash
pnpm --filter hermes-controller test
```

### Start interactive chat:
```bash
pnpm dev
```

### Example queries (in Hebrew):
- `תראה לי את חמשת המיילים האחרונים`
- `אילו מיילים עדיין לא קראתי?`
- `מה המיילים האחרונים שקיבלתי מיוסי?`
- `תמצא מיילים מהשבוע האחרון בנושא פרויקט`

### CLI Commands:
- `/help` - Show available commands
- `/test` - Run connection tests
- `/session` - Show current session ID
- `/verbose` - Toggle verbose logging
- `/quit` - Exit the application

## Security Notes

⚠️ **IMPORTANT SECURITY CONSIDERATIONS:**

1. **Never commit .env file** - It's already in .gitignore
2. **Use App Passwords** - Never use your main account password
3. **Read-Only Access** - The POC only reads emails, never writes
4. **Revoke Access** - You can revoke app passwords anytime from your account settings
5. **Test Account** - Consider using a test email account for the POC

## Troubleshooting

### "Missing required environment variables"
- Make sure you copied `.env.example` to `.env`
- Check that all required variables are filled in

### Gmail authentication fails
- Verify 2FA is enabled
- Make sure you're using an App Password, not your regular password
- Check that IMAP is enabled in Gmail settings

### Outlook authentication fails
- Verify 2FA is enabled
- Make sure you're using an App Password
- Check that your account allows IMAP access

### "Cannot find module" errors
- Run `pnpm install` again
- Try `pnpm clean` followed by `pnpm install`

## Next Steps

After the POC is successful, the next phase will:
1. Implement actual Hermes Agent integration
2. Implement email search functionality
3. Add Hebrew language support
4. Test with real queries

Phase 2 will add:
1. WhatsApp Business API integration
2. NestJS Control Plane
3. Session management
4. Audit logging

## Support

For issues or questions, please check:
- Project README.md
- B-Fresh Tech Design document
- Create an issue in the project repository
