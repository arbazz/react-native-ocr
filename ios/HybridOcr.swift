import Foundation
import NitroModules
@preconcurrency import Vision
import UIKit

class HybridOcr: HybridOcrSpec {

    func scan(input: String) throws -> String {
        return input
    }

    func scanFrame(frame: Frame) throws -> Promise<String> {
        return Promise.async {
            return try await self.recognizeText(frame)
        }
    }

    func scanImage(path: String) throws -> Promise<String> {
        return Promise.async {
            return try await self.recognizeTextFromImage(path, region: nil)
        }
    }

    func scanImageWithRegion(path: String, x: Double, y: Double, width: Double, height: Double) throws -> Promise<String> {
        return Promise.async {
            let region = CGRect(x: x, y: y, width: width, height: height)
            return try await self.recognizeTextFromImage(path, region: region)
        }
    }

    public func recognizeText(_ frame: Frame) async throws -> String {
        guard frame.isValid else {
            throw NSError(domain: "HybridOcr", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid frame"])
        }

        let nativeBuffer = try await frame.getNativeBuffer().await()
        let pixelBufferPtr = UnsafeMutableRawPointer(bitPattern: UInt(nativeBuffer.pointer))
        guard let pixelBuffer = pixelBufferPtr?.assumingMemoryBound(to: CVPixelBuffer.self).pointee else {
            throw NSError(domain: "HybridOcr", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid CVPixelBuffer pointer"])
        }

        return try await performOCR(on: pixelBuffer, region: nil)
    }

    private func recognizeTextFromImage(_ path: String, region: CGRect?) async throws -> String {
        var cleanPath = path
        if cleanPath.hasPrefix("file://") {
            cleanPath = String(cleanPath.dropFirst(7))
        }
        
        guard let image = UIImage(contentsOfFile: cleanPath) else {
            throw NSError(domain: "HybridOcr", code: 1, userInfo: [NSLocalizedDescriptionKey: "Could not load image from path: \(cleanPath)"])
        }
        
        guard let cgImage = image.cgImage else {
            throw NSError(domain: "HybridOcr", code: 2, userInfo: [NSLocalizedDescriptionKey: "Could not get CGImage from UIImage"])
        }

        return try await performOCR(on: cgImage, region: region)
    }

    private func performOCR(on pixelBuffer: CVPixelBuffer, region: CGRect?) async throws -> String {
        return try await withCheckedThrowingContinuation { continuation in
            let request = VNRecognizeTextRequest { request, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                if let results = request.results as? [VNRecognizedTextObservation] {
                    var filteredResults = results
                    
                    // Filter results by region if specified
                    if let region = region {
                        filteredResults = results.filter { observation in
                            // VNRecognizedTextObservation uses normalized coordinates (0-1)
                            let bbox = observation.boundingBox
                            return region.intersects(bbox)
                        }
                    }
                    
                    let recognizedText = filteredResults
                        .compactMap { $0.topCandidates(1).first?.string }
                        .joined(separator: "\n")
                    continuation.resume(returning: recognizedText)
                } else {
                    continuation.resume(returning: "")
                }
            }
            
            request.recognitionLevel = .accurate
            request.usesLanguageCorrection = true
            
            // Set region of interest if specified
            if let region = region {
                request.regionOfInterest = region
            }

            let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, options: [:])
            DispatchQueue.global(qos: .userInitiated).async {
                do {
                    try handler.perform([request])
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
    }

    private func performOCR(on cgImage: CGImage, region: CGRect?) async throws -> String {
        return try await withCheckedThrowingContinuation { continuation in
            let request = VNRecognizeTextRequest { request, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                if let results = request.results as? [VNRecognizedTextObservation] {
                    var filteredResults = results
                    
                    // Filter results by region if specified
                    if let region = region {
                        filteredResults = results.filter { observation in
                            let bbox = observation.boundingBox
                            return region.intersects(bbox)
                        }
                    }
                    
                    let recognizedText = filteredResults
                        .compactMap { $0.topCandidates(1).first?.string }
                        .joined(separator: "\n")
                    continuation.resume(returning: recognizedText)
                } else {
                    continuation.resume(returning: "")
                }
            }
            
            request.recognitionLevel = .accurate
            request.usesLanguageCorrection = true
            
            // Set region of interest if specified
            if let region = region {
                request.regionOfInterest = region
            }

            let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
            DispatchQueue.global(qos: .userInitiated).async {
                do {
                    try handler.perform([request])
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
    }
}
