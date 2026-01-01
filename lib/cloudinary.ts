import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

/**
 * Upload image to Cloudinary
 */
export async function uploadImage(
    file: File,
    folder: string = "devkeep"
): Promise<string> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new Promise((resolve, reject) => {
            cloudinary.uploader
                .upload_stream(
                    {
                        folder,
                        resource_type: "auto",
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result!.secure_url);
                    }
                )
                .end(buffer);
        });
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw new Error("Failed to upload image");
    }
}

/**
 * Delete image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<void> {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Cloudinary delete error:", error);
        throw new Error("Failed to delete image");
    }
}
