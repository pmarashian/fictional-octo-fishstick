export const OUTPUT_FORMATS = ["text", "json", "stream-json"] as const;
export type CursorOutputFormat = (typeof OUTPUT_FORMATS)[number];

export type CursorAgentBaseOptions = {
  cliPath?: string;
  apiKey?: string;
  forceWrites?: boolean;
  approveMcps?: boolean;
  baseArgs?: readonly string[];
  sandbox?: string;
};

export type CursorAgentInvocationOptions = {
  prompt: string;
  model?: string;
  chatId?: string;
  resumeLatest?: boolean;
  outputFormat?: CursorOutputFormat;
  streamPartialOutput?: boolean;
  print?: boolean;
  extraArgs?: readonly string[];
  sandbox?: string;
};

const DEFAULT_CLI_PATH = "cursor-agent";

export function buildCursorAgentCommand(
  baseOptions: CursorAgentBaseOptions,
  invocation: CursorAgentInvocationOptions,
): string[] {
  const prompt = invocation.prompt;
  if (!prompt || !prompt.trim()) {
    throw new Error("Cursor agent prompt must be a non-empty string");
  }

  const command = [baseOptions.cliPath ?? DEFAULT_CLI_PATH];
  const args: string[] = [];

  if (baseOptions.baseArgs?.length) {
    args.push(...baseOptions.baseArgs);
  }

  if (baseOptions.forceWrites) {
    args.push("--force");
  }

  if (baseOptions.approveMcps) {
    args.push("--approve-mcps");
  }

  if (baseOptions.apiKey) {
    args.push("--api-key", baseOptions.apiKey);
  }

  const outputFormat: CursorOutputFormat = invocation.outputFormat ?? "text";
  const shouldPrint = invocation.print ?? outputFormat !== "text";
  if (shouldPrint) {
    args.push("--print");
  }
  if (outputFormat !== "text") {
    args.push("--output-format", outputFormat);
  }
  if (outputFormat === "stream-json" && invocation.streamPartialOutput) {
    args.push("--stream-partial-output");
  }

  if (invocation.chatId) {
    args.push("--resume", invocation.chatId);
  } else if (invocation.resumeLatest) {
    args.push("--resume");
  }

  if (invocation.model) {
    args.push("--model", invocation.model);
  }

  if (invocation.sandbox) {
    args.push("--sandbox", invocation.sandbox);
  } else if (baseOptions.sandbox) {
    args.push("--sandbox", baseOptions.sandbox);
  }

  if (invocation.extraArgs?.length) {
    args.push(...invocation.extraArgs);
  }

  args.push(prompt);

  return [...command, ...args];
}
