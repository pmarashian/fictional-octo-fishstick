import { z } from "zod";

const SystemInitSchema = z
	.object({
		type: z.literal("system").describe("Top-level event channel identifier."),
		subtype: z.literal("init").describe("System event kind: initialization."),
		apiKeySource: z
			.string()
			.describe("How the API key was provided (e.g. 'flag', 'env')."),
		cwd: z.string().describe("Process current working directory on the host."),
		session_id: z.string().describe("Unique session identifier for this run."),
		model: z.string().describe("Selected model identifier."),
		permissionMode: z.string().describe("Permission mode used by the agent."),
	})
	.describe("System initialization event emitted once at start.")
	.passthrough();

const TextContentSchema = z
	.object({
		type: z.literal("text").describe("Content block kind: plain text."),
		text: z.string().describe("Plain text content for this block."),
	})
	.describe("A single text content block.");

const MessageSchema = z
	.object({
		role: z
			.enum(["user", "assistant"])
			.describe("Speaker role for the message."),
		content: z
			.array(TextContentSchema)
			.describe("Ordered list of content blocks."),
	})
	.describe("Chat message payload shared by user and assistant events.");

const UserMessageSchema = z
	.object({
		type: z.literal("user").describe("Top-level event type: user message."),
		message: MessageSchema.extend({
			role: z
				.literal("user")
				.describe("Role fixed to 'user' for this payload."),
		}).describe("User chat message payload."),
		session_id: z
			.string()
			.describe("Session identifier that this event belongs to."),
		timestamp_ms: z
			.number()
			.optional()
			.describe("Client-side timestamp in milliseconds since Unix epoch."),
	})
	.describe("Event carrying the user's input message.")
	.passthrough();

const AssistantMessageSchema = z
	.object({
		type: z
			.literal("assistant")
			.describe("Top-level event type: assistant message."),
		message: MessageSchema.extend({
			role: z
				.literal("assistant")
				.describe("Role fixed to 'assistant' for this payload."),
		}).describe("Assistant chat message payload."),
		session_id: z
			.string()
			.describe("Session identifier that this event belongs to."),
		timestamp_ms: z
			.number()
			.optional()
			.describe("Timestamp in milliseconds when this message was emitted."),
	})
	.describe("Event carrying the assistant's output message.")
	.passthrough();

const ThinkingDeltaSchema = z
	.object({
		type: z
			.literal("thinking")
			.describe("Top-level event type: internal 'thinking' stream."),
		subtype: z
			.literal("delta")
			.describe("Delta indicates an incremental trace chunk."),
		text: z.string().describe("Opaque thinking text chunk; may be empty."),
		session_id: z
			.string()
			.describe("Session identifier that this event belongs to."),
		timestamp_ms: z
			.number()
			.describe("Timestamp in milliseconds since Unix epoch."),
	})
	.describe("Incremental 'thinking' trace event chunk.")
	.passthrough();

const ThinkingCompletedSchema = z
	.object({
		type: z
			.literal("thinking")
			.describe("Top-level event type: internal 'thinking' stream."),
		subtype: z
			.literal("completed")
			.describe("Marks the end of the thinking stream."),
		session_id: z
			.string()
			.describe("Session identifier that this event belongs to."),
		timestamp_ms: z
			.number()
			.describe("Timestamp in milliseconds since Unix epoch."),
	})
	.describe("Terminal event indicating thinking has completed.")
	.passthrough();

const ResultEventSchema = z
	.object({
		type: z
			.literal("result")
			.describe("Top-level event type: terminal result."),
		subtype: z.literal("success").describe("Result kind: success."),
		duration_ms: z
			.number()
			.describe("Total wall-clock duration of the run (ms)."),
		duration_api_ms: z
			.number()
			.describe("Total duration spent in model API (ms)."),
		is_error: z.boolean().describe("Whether the run ended in an error state."),
		result: z.string().describe("Final assistant text result."),
		session_id: z
			.string()
			.describe("Session identifier that this event belongs to."),
		request_id: z
			.string()
			.optional()
			.describe("Optional request identifier for this invocation."),
	})
	.describe("Terminal result event for successful runs.")
	.passthrough();

const ToolCallResultPayloadSchema = z
	.object({
		success: z
			.object({
				content: z.string().optional(),
				isEmpty: z.boolean().optional(),
				exceededLimit: z.boolean().optional(),
				totalLines: z.number().optional(),
				totalChars: z.number().optional(),
				path: z.string().optional(),
				linesCreated: z.number().optional(),
				fileSize: z.number().optional(),
			})
			.passthrough()
			.optional(),
		error: z
			.object({
				message: z.string(),
			})
			.passthrough()
			.optional(),
	})
	.passthrough()
	.refine((payload) => Boolean(payload.success) || Boolean(payload.error), {
		message: "Tool call result must include success or error",
	});

const ReadToolCallSchema = z
	.object({
		args: z
			.object({
				path: z.string().describe("Relative path requested for reading."),
			})
			.passthrough(),
		result: ToolCallResultPayloadSchema.optional(),
	})
	.passthrough();

const WriteToolCallSchema = z
	.object({
		args: z
			.object({
				path: z.string().describe("Relative path targeted for writing."),
				fileText: z.string().describe("File contents to write."),
				toolCallId: z
					.string()
					.optional()
					.describe("Optional ID for correlating write operations."),
			})
			.passthrough(),
		result: ToolCallResultPayloadSchema.optional(),
	})
	.passthrough();

const FunctionToolCallSchema = z
	.object({
		name: z.string().describe("Tool function name."),
		arguments: z
			.union([z.string(), z.record(z.string(), z.unknown())])
			.describe("Serialized arguments payload."),
		result: ToolCallResultPayloadSchema.optional(),
	})
	.passthrough();

const ToolCallPayloadSchema = z
	.object({
		readToolCall: ReadToolCallSchema.optional(),
		writeToolCall: WriteToolCallSchema.optional(),
		functionCall: FunctionToolCallSchema.optional(),
		function: FunctionToolCallSchema.optional(),
	})
	.passthrough();

const ToolCallEventSchema = z
	.object({
		type: z
			.literal("tool_call")
			.describe("Event type emitted around tool invocation."),
		subtype: z
			.enum(["started", "completed"])
			.describe("Tool call lifecycle stage."),
		call_id: z
			.string()
			.describe("Unique identifier shared across started/completed events."),
		tool_call: ToolCallPayloadSchema.describe(
			"Tool-specific payload detailing IO and results.",
		),
		session_id: z
			.string()
			.describe("Session identifier this tool call belongs to."),
		timestamp_ms: z
			.number()
			.optional()
			.describe("Timestamp of the tool event, when available."),
	})
	.describe("Events emitted before and after each tool invocation.")
	.passthrough();

const CursorStreamEventSchema = z
	.union([
		SystemInitSchema,
		UserMessageSchema,
		ThinkingDeltaSchema,
		ThinkingCompletedSchema,
		AssistantMessageSchema,
		ToolCallEventSchema,
		ResultEventSchema,
	])
	.describe("Union of all NDJSON events emitted by cursor-agent.");

const CursorJsonResultSchema = ResultEventSchema.describe(
	"Single JSON result object emitted when --output-format json is used.",
);

export type CursorStreamEvent = z.infer<typeof CursorStreamEventSchema>;
export type CursorJsonResult = z.infer<typeof CursorJsonResultSchema>;

export { CursorStreamEventSchema, CursorJsonResultSchema };
