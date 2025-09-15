import imagekit from "@/configs/imagekit";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    const formData = await req.formData();

    const name = formData.get("name");
    const username = formData.get("username");
    const description = formData.get("description");
    const email = formData.get("email");
    const contact = formData.get("contact");
    const address = formData.get("address");
    const image = formData.get("image");

    if (
      !name ||
      !address ||
      !description ||
      !username ||
      !email ||
      !contact ||
      !image
    ) {
      return NextResponse.json(
        { error: "Missing store info" },
        { status: 400 }
      );
    }

    const store = await prisma.store.findFirst({
      where: {
        userId: userId,
      },
    });

    if (store) {
      return NextResponse.json({ status: store.status });
    }

    const isUsernameTaken = await prisma.store.findFirst({
      where: {
        username: username.toLowerCase(),
      },
    });

    if (isUsernameTaken) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await image.arrayBuffer());

    const response = await imagekit.upload({
      file: buffer,
      fileName: image.name,
      folder: "logos",
    });

    const optimizedImage = imagekit.url({
      path: response.filePath,
      transformation: [
        { quality: "auto" },
        { format: "webp" },
        { width: "512" },
      ],
    });

    const newStore = await prisma.store.create({
      data: {
        userId,
        name,
        description,
        username: username.toLowerCase(),
        email,
        contact,
        address,
        logo: optimizedImage,
      },
    });

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        store: {
          connect: { id: newStore.id },
        },
      },
    });

    return NextResponse.json(
      { message: "Applied , Waiting for approval" },
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
    const {userId} = getAuth(req)
    
     const store = await prisma.store.findFirst({
      where: {
        userId: userId,
      },
    });

    if (store) {
      return NextResponse.json({ status: store.status });
    }

    return NextResponse.json({status : "Not Registered"})
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
