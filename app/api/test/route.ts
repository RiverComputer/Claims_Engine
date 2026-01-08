import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Test if we can import Prisma
    const { prisma } = await import("@/lib/db/client");
    
    // Test a simple query
    const count = await prisma.project.count();
    
    return NextResponse.json({ 
      success: true, 
      count,
      message: "Prisma is working" 
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || String(error),
      stack: error?.stack,
    }, { status: 500 });
  }
}

