import Foundation
import NitroModules
@preconcurrency import Vision
import UIKit

class HybridOcr: HybridOcrSpec {
    func scanFrame(frame: Frame) throws ->  Promise<String>  {
        return Promise.async {
            return try await self.recognizeText(from: frame)
        }
        
    
    }
    func recognizeText(from frameData: Frame) async throws -> String {
        guard let imageData = Data(base64Encoded: frameData.data),
              let uiImage = UIImage(data: imageData),
              let cgImage = uiImage.cgImage else {
            throw NSError(domain: "HybridOcr", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid frame data"])
        }

        return try await withCheckedThrowingContinuation { continuation in
            let request = VNRecognizeTextRequest { request, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                
                if let results = request.results as? [VNRecognizedTextObservation] {
                    let recognizedText = results
                        .compactMap { $0.topCandidates(1).first?.string }
                        .joined(separator: " ")
                    continuation.resume(returning: recognizedText)
                } else {
                    continuation.resume(returning: "")
                }
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
    func scan(input: String) throws -> String {
        
        return input
    }


  
}
