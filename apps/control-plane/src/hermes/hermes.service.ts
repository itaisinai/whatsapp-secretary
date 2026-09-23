import { Injectable, Logger, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn, ChildProcess } from 'node:child_process';
import type { WhatsAppMessageContext } from '@whatsapp-secretary/shared';

export interface HermesResponse {
  response: string;
  error?: string;
}

@Injectable()
export class HermesService implements OnModuleDestroy {
  private readonly logger = new Logger(HermesService.name);
  private activeProcesses = new Map<string, ChildProcess>();

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    this.logger.log(`HermesService initialized - config available: ${!!config}`);
  }

  async processMessage(
    message: string,
    context: WhatsAppMessageContext,
  ): Promise<HermesResponse> {
    this.logger.debug(`processMessage called - config available: ${!!this.config}`);
    const sessionId = this.getSessionId(context);
    const timeoutMs = 30000;

    this.logger.log(`Processing message for session ${sessionId}`);

    try {
      const hermesResponse = await this.callHermes(message, sessionId, timeoutMs);
      return { response: hermesResponse };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Hermes processing failed: ${errorMessage}`);
      return {
        response: 'מצטער, אירעה שגיאה בעיבוד הבקשה. אנא נסה שוב.',
        error: errorMessage,
      };
    }
  }

  private getSessionId(context: WhatsAppMessageContext): string {
    this.logger.debug(`getSessionId called - config available: ${!!this.config}`);
    if (!this.config) {
      this.logger.error('ConfigService is undefined in getSessionId!');
      return `whatsapp-${context.sender.phoneNumber.replace(/\D/g, '')}`;
    }

    const configSessionId = this.config.get<string>('hermes.sessionId');
    if (configSessionId && configSessionId !== 'poc-session') {
      return configSessionId;
    }
    const sanitized = context.sender.phoneNumber.replace(/\D/g, '');
    return `whatsapp-${sanitized}`;
  }

  private async callHermes(
    message: string,
    sessionId: string,
    timeoutMs: number,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const mcpServerPath = this.config.get<string>('hermes.mcpServerPath');
      if (!mcpServerPath) {
        reject(new Error('MCP_SERVER_PATH not configured'));
        return;
      }

      // Explicitly specify provider and model to avoid config issues
      // Note: --resume will create a new session if it doesn't exist, but only with a valid format
      // For now, we'll use a simpler session management without --resume to avoid issues
      const hermesArgs = [
        'chat',
        '--provider',
        'openai',
        '--model',
        'gpt-4o-mini',
        '-q',
        message,
        '--oneshot',
      ];

      this.logger.debug(`Spawning Hermes: hermes ${hermesArgs.join(' ')}`);

      // Ensure OPENAI_API_KEY is passed to Hermes
      const hermesEnv = {
        ...process.env,
        OPENAI_API_KEY: this.config.get<string>('hermes.openaiApiKey'),
      };

      const hermes = spawn('hermes', hermesArgs, {
        env: hermesEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      this.activeProcesses.set(sessionId, hermes);

      let stdout = '';
      let stderr = '';

      hermes.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      hermes.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      hermes.on('error', (error) => {
        this.activeProcesses.delete(sessionId);
        this.logger.error(`Failed to spawn Hermes: ${error.message}`);
        reject(new Error(`Failed to spawn Hermes: ${error.message}`));
      });

      hermes.on('close', (code) => {
        this.activeProcesses.delete(sessionId);

        // Always log stdout and stderr for debugging
        this.logger.debug(`Hermes stdout: ${stdout}`);
        if (stderr) {
          this.logger.debug(`Hermes stderr: ${stderr}`);
        }

        if (code === 0) {
          const response = this.extractHermesResponse(stdout);
          if (response) {
            resolve(response);
          } else {
            reject(new Error('Hermes returned empty response'));
          }
        } else {
          this.logger.error(`Hermes exited with code ${code}. stdout: ${stdout.substring(0, 500)}, stderr: ${stderr}`);
          reject(new Error(`Hermes exited with code ${code}`));
        }
      });

      const timeout = setTimeout(() => {
        hermes.kill('SIGTERM');
        setTimeout(() => hermes.kill('SIGKILL'), 5000);
        this.activeProcesses.delete(sessionId);
        reject(new Error('Hermes timeout'));
      }, timeoutMs);

      hermes.on('close', () => clearTimeout(timeout));
    });
  }

  /**
   * Extract the actual response from Hermes stdout.
   * Hermes output includes formatting, session info, etc.
   * We need to extract just the assistant's response.
   */
  private extractHermesResponse(stdout: string): string {
    // Hermes wraps the response in a box like:
    // ╭─ ☤ Hermes ───...───╮
    // <response text>
    // ╰──────...──────────╯

    const lines = stdout.split('\n');
    const responseLines: string[] = [];
    let inResponseBox = false;

    for (const line of lines) {
      if (line.includes('╭─') && line.includes('Hermes')) {
        inResponseBox = true;
        continue;
      }
      if (line.includes('╰─')) {
        inResponseBox = false;
        break;
      }
      if (inResponseBox && line.trim()) {
        responseLines.push(line.trim());
      }
    }

    const response = responseLines.join('\n').trim();
    this.logger.debug(`Extracted response: ${response}`);
    return response || stdout.trim(); // Fallback to full output if extraction fails
  }

  onModuleDestroy(): void {
    this.logger.log('Cleaning up active Hermes processes');
    for (const [sessionId, process] of this.activeProcesses.entries()) {
      this.logger.debug(`Killing process for session ${sessionId}`);
      process.kill('SIGTERM');
    }
    this.activeProcesses.clear();
  }
}
