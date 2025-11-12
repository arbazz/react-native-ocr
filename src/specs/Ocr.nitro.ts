import type { HybridObject } from "react-native-nitro-modules";

export interface Frame {
    width: number;
    height: number;
    data: string;
}

export interface Ocr extends HybridObject<{
    ios: "swift";
    android: "kotlin";
}> {
    scan(input: string): string;
    scanFrame(frame: Frame): Promise<string>;
}