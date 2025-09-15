import imagekit from "@/configs/imagekit";
import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json(
        { error: "Not Authorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    const name = formData.get("name");
    const description = formData.get("description");
    const mrp = Number(formData.get("mrp"));
    const price = Number(formData.get("price"));
    const category = formData.get("category");
    const images = formData.getAll("images");

    if (
      !name ||
      !description ||
      !mrp ||
      !price ||
      !category ||
      images.length < 1
    ) {
      return NextResponse.json(
        { error: "Missing Product Detials" },
        { status: 400 }
      );
    }

    const imagesUrl = await Promise.all(
      images.map(async (img) => {
        const buffer = Buffer.from(await img.arrayBuffer());
        const response = await imagekit.upload({
          file: buffer,
          fileName: img.name,
          folder: "products",
        });

        const optimizedUrl = imagekit.url({
          path: response.filePath,
          transformation: [
            { quality: "auto" },
            { format: "webp" },
            { width: "1024" },
          ],
        });

        return optimizedUrl;
      })
    );

    await prisma.product.create({
      data: {
        name,
        description,
        mrp,
        price,
        category,
        images: imagesUrl,
        storeId,
      },
    });

    return NextResponse.json(
      { message: "Product added successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}

export async function GET(req) {
  try {
    const { userId } = getAuth(req);

    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json(
        { error: "Not Authorized" },
        { status: 401 }
      );
    }

    const products = await prisma.product.findMany({
      where: {
        storeId,
      },
    });

    return NextResponse.json({products})
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
