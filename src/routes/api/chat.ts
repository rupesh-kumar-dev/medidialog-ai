import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import {
  createLovableAiGatewayProvider,
  MEDISAGE_MODEL,
  MEDISAGE_SYSTEM_PROMPT,
} from "@/lib/ai-gateway.server";

type ChatRequestBody = { messages?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages } = (await request.json()) as ChatRequestBody;
          if (!Array.isArray(messages) || messages.length === 0) {
            return new Response("Messages are required", { status: 400 });
          }

          const key = process.env["LOVABLE_API_KEY"];
          if (!key) {
            return new Response("AI service is not configured.", { status: 500 });
          }

          const gateway = createLovableAiGatewayProvider(key);
          const result = streamText({
            model: gateway(MEDISAGE_MODEL),
            system: MEDISAGE_SYSTEM_PROMPT,
            messages: await convertToModelMessages(messages as UIMessage[]),
          });

          return result.toUIMessageStreamResponse({
            originalMessages: messages as UIMessage[],
          });
        } catch (error) {
          console.error("chat route error", error);
          return new Response("Sorry, MediSage AI is temporarily unavailable.", { status: 500 });
        }
      },
    },
  },
});
