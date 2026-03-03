import { NextRequest, NextResponse } from "next/server";
import { handleChat } from "@/shared/api/ai";
import { createClient } from "@/shared/supabase/server";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

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

    let errorMessage = "처리에 실패했습니다. 다시 시도해주세요.";
    if (error instanceof Error) {
      if (error.message.includes("quota") || error.message.includes("429")) {
        errorMessage = "API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
      } else if (error.message.includes("API key")) {
        errorMessage = "API 키 설정에 문제가 있습니다.";
      }
      console.error("Error details:", error.message);
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}
