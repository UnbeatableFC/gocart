import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Add new Rating
export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Not Authorized" },
        { status: 401 }
      );
    }

    const { orderId, productId, rating, review } = await req.json();
    const order = await prisma.order.findUnique({
      where: { id: orderId, userId },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const isAlreadyRated = await prisma.rating.findFirst({
      where: { productId, orderId },
    });

    if (isAlreadyRated) {
      return NextResponse.json(
        { error: "Product Already Rated" },
        { status: 400 }
      );
    }

    const res = await prisma.rating.create({
      data: {
        userId,
        productId,
        rating,
        review,
        orderId,
      },
    });

    return NextResponse.json({
      message: "Rating added successfully",
      rating: res,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}

// Get all ratings
export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Not Authorized" },
        { status: 401 }
      );
    }

    const ratings = await prisma.rating.findMany({
      where: { userId },
    });

    return NextResponse.json({
      ratings,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
