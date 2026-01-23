import { type ChildProcess, spawn } from "node:child_process";
import type { Readable } from "node:stream";
import {
  type CursorAgentBaseOptions,
  type CursorAgentInvocationOptions,
  type CursorOutputFormat,
  buildCursorAgentCommand,
} from "./command-builder.js";
import {
  type CursorJsonResult,
  CursorJsonResultSchema,
  type CursorStreamEvent,
  CursorStreamEventSchema,
} from "./schemas.js";
export type { CursorStreamEvent, CursorJsonResult };

export type CursorAgentConfig = CursorAgentBaseOptions & {
  env?: Record<string, string | undefined>;
  defaultModel?: string;
};

type SharedCursorAgentOptions = {
  prompt: string;
  model?: string;
  chatId?: string;
  resumeLatest?: boolean;
  extraArgs?: readonly string[];
  signal?: AbortSignal;
  sandbox?: string;
};

export type CursorAgentGenerateOptions = SharedCursorAgentOptions;

export type CursorAgentStreamOptions = SharedCursorAgentOptions & {
  streamPartialOutput?: boolean;
};

export class CursorAgentError extends Error {
  readonly exitCode: number;
  readonly stderr: string;
  readonly command: readonly string[];

  constructor(
    message: string,
    exitCode: number,
    stderr: string,
    command: readonly string[],
  ) {
    super(message);
    this.name = "CursorAgentError";
    this.exitCode = exitCode;
    this.stderr = stderr;
    this.command = command;
  }
}

export function parseCursorEventLine(line: string): CursorStreamEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    const result = CursorStreamEventSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

const DEFAULT_ENV: Record<string, string> = Object.fromEntries(
  Object.entries(process.env).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  ),
);

function toAbortError(reason: unknown): Error {
  if (reason instanceof Error) {
    return reason;
  }
  return new DOMException(reason ? String(reason) : "Aborted", "AbortError");
}

function throwIfAborted(signal?: AbortSignal): void {
  if (!signal) return;
  if (signal.aborted) {
    throw toAbortError(signal.reason);
  }
}

function bindAbort(
  signal: AbortSignal | undefined,
  proc: ChildProcess,
): () => void {
  if (!signal) return () => {};
  const onAbort = () => {
    proc.kill();
  };
  signal.addEventListener("abort", onAbort, { once: true });
  return () => signal.removeEventListener("abort", onAbort);
}

function mergeEnv(
  base: Record<string, string>,
  overrides: Record<string, string | undefined>,
): Record<string, string> {
  const merged = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete merged[key];
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

function waitForExit(proc: ChildProcess): Promise<number> {
  return new Promise((resolve) => {
    proc.once("exit", (code) => {
      resolve(code ?? 0);
    });
  });
}

async function* asyncStreamIterator(stream: Readable): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  for await (const chunk of stream) {
    yield decoder.decode(chunk as Uint8Array, { stream: true });
  }
}

export class CursorAgent {
  private readonly baseOptions: CursorAgentBaseOptions;
  private readonly env: Record<string, string | undefined>;
  private readonly defaultModel: string | undefined;

  constructor(config: CursorAgentConfig = {}) {
    const baseOptions: CursorAgentBaseOptions = {
      forceWrites: config.forceWrites ?? false,
      approveMcps: config.approveMcps ?? false,
      baseArgs: config.baseArgs ? [...config.baseArgs] : [],
    };
    if (config.cliPath) {
      baseOptions.cliPath = config.cliPath;
    }
    const resolvedKey = config.apiKey ?? process.env.CURSOR_API_KEY;
    if (resolvedKey) {
      baseOptions.apiKey = resolvedKey;
    }
    if (config.sandbox) {
      baseOptions.sandbox = config.sandbox;
    }
    this.baseOptions = baseOptions;
    this.env = config.env ?? {};
    this.defaultModel = config.defaultModel;
  }

  async generate(
    options: CursorAgentGenerateOptions,
  ): Promise<CursorJsonResult> {
    const command = this.buildCommand("json", options);
    const stdout = await this.collectStdout(command, options.signal);
    return this.parseJsonResult(stdout);
  }

  async *stream(
    options: CursorAgentStreamOptions,
  ): AsyncGenerator<CursorStreamEvent, void, void> {
    const command = this.buildCommand("stream-json", options);
    const { proc, stderrPromise, cleanup } = this.spawnProcess(
      command,
      options.signal,
    );

    const stdoutStream = proc.stdout;

    if (!stdoutStream) {
      cleanup();
      throw new Error("Cursor agent stream is unavailable");
    }

    let buffer = "";
    try {
      for await (const chunk of asyncStreamIterator(stdoutStream)) {
        throwIfAborted(options.signal);
        buffer += chunk;
        while (true) {
          const nl = buffer.indexOf("\n");
          if (nl < 0) break;
          const line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          const parsed = parseCursorEventLine(line);
          if (parsed) {
            yield parsed;
          }
        }
      }
      if (buffer.trim().length) {
        const parsed = parseCursorEventLine(buffer);
        if (parsed) {
          yield parsed;
        }
      }

      const [exitCode, stderr] = await Promise.all([
        waitForExit(proc),
        stderrPromise,
      ]);
      if (exitCode !== 0) {
        throw new CursorAgentError(
          stderr.trim() || "Cursor agent failed",
          exitCode,
          stderr,
          command,
        );
      }
    } finally {
      cleanup();
    }
  }

  private buildCommand(
    format: CursorOutputFormat,
    options: CursorAgentStreamOptions | CursorAgentGenerateOptions,
  ): string[] {
    const streamPartial =
      format === "stream-json" && "streamPartialOutput" in options
        ? options.streamPartialOutput
        : undefined;
    const invocation: CursorAgentInvocationOptions = {
      prompt: options.prompt,
      outputFormat: format,
      print: true,
    };

    const resolvedModel = options.model ?? this.defaultModel;

    if (resolvedModel) {
      invocation.model = resolvedModel;
    }

    if (options.chatId) {
      invocation.chatId = options.chatId;
    }

    if (typeof streamPartial === "boolean") {
      invocation.streamPartialOutput = streamPartial;
    }

    if (options.resumeLatest) {
      invocation.resumeLatest = true;
    }

    if (options.sandbox) {
      invocation.sandbox = options.sandbox;
    }

    if (options.extraArgs && options.extraArgs.length > 0) {
      invocation.extraArgs = options.extraArgs;
    }

    return buildCursorAgentCommand(this.baseOptions, invocation);
  }

  private async collectStdout(
    command: string[],
    signal?: AbortSignal,
  ): Promise<string> {
    const { proc, stderrPromise, cleanup } = this.spawnProcess(command, signal);
    const stdoutStream = proc.stdout;
    if (!stdoutStream) {
      cleanup();
      throw new Error("Cursor agent output stream is unavailable");
    }
    try {
      const stdout = await new Promise<string>((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        stdoutStream.on("data", (chunk) => chunks.push(chunk));
        stdoutStream.on("end", () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer.toString("utf-8"));
        });
        stdoutStream.on("error", reject);
      });
      const [stderr, exitCode] = await Promise.all([
        stderrPromise,
        waitForExit(proc),
      ]);
      if (exitCode !== 0) {
        throw new CursorAgentError(
          stderr.trim() || "Cursor agent failed",
          exitCode,
          stderr,
          command,
        );
      }
      return stdout;
    } finally {
      cleanup();
    }
  }

  private spawnProcess(command: string[], signal?: AbortSignal) {
    throwIfAborted(signal);
    const [program, ...args] = command;
    if (!program) {
      throw new Error("Command must have at least one element");
    }
    const proc = spawn(program, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: mergeEnv(DEFAULT_ENV, this.env),
    }) as ChildProcess & {
      stdout: Readable;
      stderr: Readable;
    };
    const cleanup = bindAbort(signal, proc);
    const stderrStream = proc.stderr;
    const stderrPromise = stderrStream
      ? new Promise<string>((resolve, reject) => {
          const chunks: Uint8Array[] = [];
          stderrStream.on("data", (chunk) => chunks.push(chunk));
          stderrStream.on("end", () => {
            const buffer = Buffer.concat(chunks);
            resolve(buffer.toString("utf-8"));
          });
          stderrStream.on("error", reject);
        })
      : Promise.resolve("");
    return { proc, stderrPromise, cleanup };
  }

  private parseJsonResult(output: string): CursorJsonResult {
    const normalized = output.trim();
    if (!normalized) {
      throw new Error("Cursor agent produced no output");
    }
    const lastLine = normalized.split("\n").filter(Boolean).pop();
    if (!lastLine) {
      throw new Error("Cursor agent output did not contain JSON");
    }
    const parsed = JSON.parse(lastLine);
    return CursorJsonResultSchema.parse(parsed);
  }
}
