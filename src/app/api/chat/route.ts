import { NextRequest, NextResponse } from "next/server";
import { handleChat } from "@/shared/api/ai";
import { createClient } from "@/shared/supabase/server";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // Auth check (non-streaming errors)
  try {
    var supabase = await createClient();
    var {
      data: { user },
    } = await supabase.auth.getUser();
  } catch {
    return NextResponse.json(
      { error: "인증 처리에 실패했습니다." },
      { status: 500 },
    );
  }

  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: { message?: string; history?: any; currentValuation?: any };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청입니다." },
      { status: 400 },
    );
  }

  const { message, history, currentValuation } = body;

  if (!message || typeof message !== "string") {
    return NextResponse.json(
      { error: "메시지를 입력해주세요." },
      { status: 400 },
    );
  }

  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return NextResponse.json(
      { error: "메시지를 입력해주세요." },
      { status: 400 },
    );
  }

  if (trimmed.length > 500) {
    return NextResponse.json(
      { error: "메시지는 500자 이내로 입력해주세요." },
      { status: 400 },
    );
  }

  // Stream response to avoid Vercel timeout
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
      };

      try {
        const chatResult = await handleChat(
          {
            message: trimmed,
            history: Array.isArray(history) ? history.slice(-20) : [],
            currentValuation: currentValuation ?? undefined,
          },
          (status) => send({ type: "status", message: status }),
        );

        if (chatResult.type === "intent") {
          // Client will handle analyze flow via /api/chat/research + /api/chat/structure
          send({ type: "intent", data: chatResult.data });
        } else {
          send({ type: "result", data: chatResult.data });
        }
      } catch (error) {
        const errorDetail =
          error instanceof Error ? error.message : String(error);
        console.error("Chat error:", errorDetail);

        let errorMessage = `처리에 실패했습니다: ${errorDetail.slice(0, 200)}`;
        if (errorDetail.includes("quota") || errorDetail.includes("429")) {
          errorMessage =
            "API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
        } else if (errorDetail.includes("API key")) {
          errorMessage = "API 키 설정에 문제가 있습니다.";
        }

        send({ type: "error", error: errorMessage });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
