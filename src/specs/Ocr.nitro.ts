import type { HybridObject } from "react-native-nitro-modules";


export interface Ocr extends HybridObject<{
    ios: "swift",
    android:"kotlin"
}> {
    scan(input: string) : string
}