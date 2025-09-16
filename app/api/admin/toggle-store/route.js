import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

//toggle store is active
export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    const isAdmin = await authAdmin(userId);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Not Authorized" },
        { status: 401 }
      );
    }

    const { storeId } = await req.json();
    if (!storeId) {
      return NextResponse.json(
        { error: "Missing store id" },
        { status: 400 }
      );
    }

    // Find store

    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 400 }
      );
    }

    await prisma.store.update({
      where: { id: storeId },
      data: {
        isActive: !store.isActive,
      },
    });

    return NextResponse.json({
      message: "Store updated successfully",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
