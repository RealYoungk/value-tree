import { NextRequest, NextResponse } from "next/server";
import { handleResearch } from "@/shared/api/ai";
import { createClient } from "@/shared/supabase/server";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // Auth check
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

  let body: { companyName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청입니다." },
      { status: 400 },
    );
  }

  const { companyName } = body;
  if (!companyName || typeof companyName !== "string") {
    return NextResponse.json(
      { error: "회사명을 입력해주세요." },
      { status: 400 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
      };

      try {
        const result = await handleResearch(
          companyName,
          (status) => send({ type: "status", message: status }),
        );
        send({ type: "result", data: result });
      } catch (error) {
        const errorDetail =
          error instanceof Error ? error.message : String(error);
        console.error("Research error:", errorDetail);
        send({ type: "error", error: `리서치에 실패했습니다: ${errorDetail.slice(0, 200)}` });
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
