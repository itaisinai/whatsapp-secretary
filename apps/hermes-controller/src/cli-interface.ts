import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { HermesController } from './hermes-controller';

export class CLIInterface {
  private controller: HermesController;
  private sessionId: string;
  private verbose: boolean;
  private running = false;

  constructor(controller: HermesController, sessionId: string, verbose = false) {
    this.controller = controller;
    this.sessionId = sessionId;
    this.verbose = verbose;
  }

  async start(): Promise<void> {
    this.running = true;

    console.log(chalk.cyan('\n╔══════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║') + '  WhatsApp Secretary - Hermes Agent Controller  ' + chalk.cyan('║'));
    console.log(chalk.cyan('╚══════════════════════════════════════════════════════╝\n'));
    console.log(chalk.gray(`Session: ${this.sessionId}`));
    console.log(chalk.gray('Commands: /help, /quit, /clear, /test\n'));

    while (this.running) {
      try {
        const { message } = await inquirer.prompt<{ message: string }>([
          {
            type: 'input',
            name: 'message',
            message: chalk.green('You:'),
            prefix: '',
          },
        ]);

        const trimmed = message.trim();

        if (!trimmed) {
          continue;
        }

        if (trimmed.startsWith('/')) {
          await this.handleCommand(trimmed);
          continue;
        }

        await this.sendMessage(trimmed);
      } catch (error) {
        if ((error as { isTtyError?: boolean }).isTtyError) {
          console.log(chalk.red('\nPrompt could not be rendered in this environment.'));
          this.running = false;
        } else {
          console.error(chalk.red('Error:'), error);
        }
      }
    }

    await this.controller.shutdown();
    console.log(chalk.gray('\nGoodbye!\n'));
  }

  private async sendMessage(message: string): Promise<void> {
    const spinner = ora('Thinking...').start();

    try {
      const response = await this.controller.sendMessage(message);
      spinner.stop();

      console.log(chalk.blue('\nAssistant:'), response);
      console.log();
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('\nError:'), error);
      console.log();
    }
  }

  private async handleCommand(command: string): Promise<void> {
    const [cmd, ...args] = command.slice(1).split(' ');

    switch (cmd.toLowerCase()) {
      case 'help':
        this.showHelp();
        break;

      case 'quit':
      case 'exit':
        this.running = false;
        break;

      case 'clear':
        console.clear();
        break;

      case 'test':
        await this.runTests();
        break;

      case 'session':
        console.log(chalk.gray(`Current session: ${this.controller.getSessionId()}`));
        break;

      case 'verbose':
        this.verbose = !this.verbose;
        console.log(chalk.gray(`Verbose mode: ${this.verbose ? 'ON' : 'OFF'}`));
        break;

      default:
        console.log(chalk.red(`Unknown command: ${cmd}`));
        console.log(chalk.gray('Type /help for available commands'));
        break;
    }
  }

  private showHelp(): void {
    console.log(chalk.cyan('\nAvailable Commands:'));
    console.log(chalk.gray('  /help      - Show this help message'));
    console.log(chalk.gray('  /quit      - Exit the application'));
    console.log(chalk.gray('  /clear     - Clear the screen'));
    console.log(chalk.gray('  /test      - Run connection tests'));
    console.log(chalk.gray('  /session   - Show current session ID'));
    console.log(chalk.gray('  /verbose   - Toggle verbose logging'));
    console.log();
    console.log(chalk.cyan('Example Queries:'));
    console.log(chalk.gray('  תראה לי את חמשת המיילים האחרונים'));
    console.log(chalk.gray('  אילו מיילים עדיין לא קראתי?'));
    console.log(chalk.gray('  מה המיילים האחרונים שקיבלתי מיוסי?'));
    console.log(chalk.gray('  תמצא מיילים מהשבוע האחרון בנושא פרויקט'));
    console.log();
  }

  private async runTests(): Promise<void> {
    const spinner = ora('Running tests...').start();

    try {
      await this.controller.testConnection();
      spinner.succeed('All tests passed');
    } catch (error) {
      spinner.fail('Tests failed');
      console.error(chalk.red('Error:'), error);
    }

    console.log();
  }
}
