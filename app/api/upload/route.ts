import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadFile } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Optional: Validate file type
        const allowedTypes = [
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
            "application/msword", // .doc
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
            "application/vnd.ms-excel", // .xls
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/gif"
        ];

        if (!allowedTypes.includes(file.type)) {
            // We'll allow it anyway but maybe log it? The user specifically asked for word/excel.
            // Let's stick to 'auto' for flexibility as requested.
        }

        const url = await uploadFile(file, "devkeep/notes");

        return NextResponse.json({ url }, { status: 200 });
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload file" },
            { status: 500 }
        );
    }
}

