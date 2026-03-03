import { NextRequest, NextResponse } from "next/server";
import { handleChat } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

    const result = await handleChat({
      message: trimmed,
      history: Array.isArray(history) ? history.slice(-20) : [],
      currentValuation: currentValuation ?? undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "처리에 실패했습니다. 다시 시도해주세요." },
      { status: 500 },
    );
  }
}
