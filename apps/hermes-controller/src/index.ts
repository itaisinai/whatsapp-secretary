#!/usr/bin/env node
import { Command } from 'commander';
import dotenv from 'dotenv';
import { HermesController } from './hermes-controller';
import { CLIInterface } from './cli-interface';
import { validateEnvironment } from './config/environment';

dotenv.config();

const program = new Command();

program
  .name('hermes-controller')
  .description('WhatsApp Secretary - Hermes Agent Controller (POC)')
  .version('0.1.0');

program
  .command('chat')
  .description('Start interactive chat session with Hermes Agent')
  .option('-s, --session <id>', 'Session ID to resume', 'default')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action(async (options) => {
    try {
      const env = validateEnvironment();
      const controller = new HermesController(env);
      const cli = new CLIInterface(controller, options.session, options.verbose);

      await controller.initialize();
      await cli.start();
    } catch (error) {
      console.error('Error starting chat:', error);
      process.exit(1);
    }
  });

program
  .command('test')
  .description('Test Hermes Agent connection and tools')
  .action(async () => {
    try {
      const env = validateEnvironment();
      const controller = new HermesController(env);

      console.log('Testing Hermes Agent connection...');
      await controller.initialize();
      await controller.testConnection();

      console.log('✓ Connection successful');
      process.exit(0);
    } catch (error) {
      console.error('✗ Connection failed:', error);
      process.exit(1);
    }
  });

program.parse();
