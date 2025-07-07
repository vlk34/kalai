import * as ImageManipulator from "expo-image-manipulator";

export interface ProcessedImage {
  uri: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Processes an image to optimize it for upload by:
 * 1. Converting to WebP format for better compression
 * 2. Resizing if necessary to reduce file size
 * 3. Optimizing quality for the best balance of size and quality
 */
export async function processImageForUpload(
  imageUri: string,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: "webp" | "jpeg" | "png";
  } = {}
): Promise<ProcessedImage> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    format = "webp",
  } = options;

  try {
    // First, get the image info to check current dimensions
    const imageInfo = await ImageManipulator.manipulateAsync(
      imageUri,
      [], // No operations, just get info
      {
        format: ImageManipulator.SaveFormat.WEBP,
        compress: 1, // No compression for info gathering
      }
    );

    // Calculate new dimensions while maintaining aspect ratio
    let { width, height } = imageInfo;
    const aspectRatio = width / height;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    // Process the image with optimal settings
    const processedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: Math.round(width),
            height: Math.round(height),
          },
        },
      ],
      {
        format:
          format === "webp"
            ? ImageManipulator.SaveFormat.WEBP
            : format === "jpeg"
              ? ImageManipulator.SaveFormat.JPEG
              : ImageManipulator.SaveFormat.PNG,
        compress: quality,
      }
    );

    // Get file size (approximate)
    const response = await fetch(processedImage.uri);
    const blob = await response.blob();
    const size = blob.size;

    return {
      uri: processedImage.uri,
      width: processedImage.width,
      height: processedImage.height,
      size,
    };
  } catch (error) {
    console.error("Image processing error:", error);
    throw new Error("Failed to process image for upload");
  }
}

/**
 * Creates a FormData object with the processed image ready for upload
 */
export async function createImageFormData(
  imageUri: string,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: "webp" | "jpeg" | "png";
  }
): Promise<{ formData: FormData; processedImage: ProcessedImage }> {
  const processedImage = await processImageForUpload(imageUri, options);

  const formData = new FormData();
  const fileExtension = options?.format || "webp";

  formData.append("photo", {
    uri: processedImage.uri,
    type: `image/${fileExtension}`,
    name: `photo.${fileExtension}`,
  } as any);

  return { formData, processedImage };
}

/**
 * Quick image optimization for camera captures
 * Uses more aggressive compression for faster uploads
 */
export async function optimizeCameraImage(
  imageUri: string
): Promise<ProcessedImage> {
  return processImageForUpload(imageUri, {
    maxWidth: 1280,
    maxHeight: 1280,
    quality: 0.7, // Slightly more compression for camera images
    format: "webp",
  });
}

/**
 * Quick image optimization for gallery picks
 * Uses higher quality since gallery images are usually better
 */
export async function optimizeGalleryImage(
  imageUri: string
): Promise<ProcessedImage> {
  return processImageForUpload(imageUri, {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.8,
    format: "webp",
  });
}
