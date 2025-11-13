package com.margelo.nitro.ocr

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Rect
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import com.margelo.nitro.core.Promise
import java.io.File
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

class HybridOcr : HybridOcrSpec() {

    private val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

    override fun scan(input: String): String {
        return "scanned $input"
    }

    override fun scanFrame(frame: Frame): Promise<String> {
        return Promise.async {
            recognizeTextFromFrame(frame)
        }
    }

    override fun scanImage(path: String): Promise<String> {
        return Promise.async {
            recognizeTextFromImage(path, null)
        }
    }

    override fun scanImageWithRegion(
        path: String,
        x: Double,
        y: Double,
        width: Double,
        height: Double
    ): Promise<String> {
        return Promise.async {
            val region = Region(x, y, width, height)
            recognizeTextFromImage(path, region)
        }
    }

    private suspend fun recognizeTextFromFrame(frame: Frame): String {
        if (!frame.isValid) {
            throw Exception("Invalid frame")
        }

        // Get the native buffer from frame
        val nativeBuffer = frame.getNativeBuffer()

        // TODO: Convert native buffer to InputImage
        // This depends on your Frame implementation
        // For now, throwing an exception
        throw Exception("scanFrame not yet implemented for Android")
    }

    private suspend fun recognizeTextFromImage(path: String, region: Region?): String {
        // Remove file:// prefix if present
        val cleanPath = if (path.startsWith("file://")) {
            path.substring(7)
        } else {
            path
        }

        // Load image from file
        val file = File(cleanPath)
        if (!file.exists()) {
            throw Exception("Could not load image from path: $cleanPath")
        }

        val bitmap = BitmapFactory.decodeFile(cleanPath)
            ?: throw Exception("Could not decode bitmap from path: $cleanPath")

        return performOCR(bitmap, region)
    }

    private suspend fun performOCR(bitmap: Bitmap, region: Region?): String = suspendCoroutine { continuation ->
        try {
            val image = InputImage.fromBitmap(bitmap, 0)

            recognizer.process(image)
                .addOnSuccessListener { visionText ->
                    if (region != null) {
                        // Filter text blocks by region
                        val imageWidth = bitmap.width
                        val imageHeight = bitmap.height

                        // Convert normalized coordinates to pixel coordinates
                        val regionRect = Rect(
                            (region.x * imageWidth).toInt(),
                            (region.y * imageHeight).toInt(),
                            ((region.x + region.width) * imageWidth).toInt(),
                            ((region.y + region.height) * imageHeight).toInt()
                        )

                        val filteredText = visionText.textBlocks
                            .filter { block ->
                                block.boundingBox?.let { bbox ->
                                    Rect.intersects(regionRect, bbox)
                                } ?: false
                            }
                            .joinToString("\n") { it.text }

                        continuation.resume(filteredText)
                    } else {
                        // Return all text
                        val allText = visionText.textBlocks
                            .joinToString("\n") { it.text }
                        continuation.resume(allText)
                    }
                }
                .addOnFailureListener { exception ->
                    continuation.resumeWithException(exception)
                }
        } catch (e: Exception) {
            continuation.resumeWithException(e)
        }
    }

    override val memorySize: Long
        get() = 0L

    // Helper data class for region
    private data class Region(
        val x: Double,
        val y: Double,
        val width: Double,
        val height: Double
    )
}