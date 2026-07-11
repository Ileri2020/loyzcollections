import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, receiptIds } = body;

    if (!userId || !Array.isArray(receiptIds)) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }

    const guestUser = await prisma.user.findUnique({
      where: { email: "guest@loysfoods.com" },
      select: { id: true },
    });

    if (!guestUser) {
      return NextResponse.json(
        { error: "Guest user account not found" },
        { status: 500 }
      );
    }

    const updateResult = await prisma.cart.updateMany({
      where: {
        id: { in: receiptIds },
        userId: guestUser.id,
      },
      data: { userId },
    });

    return NextResponse.json({ updatedCount: updateResult.count });
  } catch (error) {
    console.error("Receipt link error:", error);
    return NextResponse.json(
      { error: "Failed to link receipts" },
      { status: 500 }
    );
  }
}
