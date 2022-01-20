import { CLIOptions } from './options';

export interface LoggerFunction {
  raw(...args: string[]): void;
  log(...args: string[]): void;
  warn(...args: string[]): void;
  trace(...args: string[]): void;
  error(...args: string[] | Error[]): void;
  success(...args: string[]): void;
}

/**
 Logger function to print out steps of the lib

 @param prefix - Shows the origin of the log, e.g. function name
 @param options - Option flags of the library in an object
 */
export interface Logger {
  (prefix: string, options?: CLIOptions): LoggerFunction;
}
