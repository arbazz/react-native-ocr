import React, { useState, useMemo, useEffect } from "react";
import { View, Text } from "react-native";
import { Camera, useCameraDevice, useFrameProcessor, Frame } from "react-native-vision-camera";
import { runOnJS } from "react-native-reanimated";
import { HybridOcr } from "react-native-ocr";

export default function FrameView() {
    const devices = useCameraDevice('back');
    const [ocrText, setOcrText] = useState("");
    const device = devices
    const frameProcessor = useFrameProcessor((frame) => {
        'worklet';
        runOnJS(processFrame)(frame);
    }, []);
    
    const processFrame = async (frame: any) => {

        const ocrFrame = { width: frame.width, height: frame.height, data: frame };
        try {
            const text = await HybridOcr.scanFrame(ocrFrame);
            setOcrText(text);
        } catch (e) {
            console.error(e);
        }
    };
    useEffect(() => {
        (async () => {
            const status = await Camera.requestCameraPermission();
            if (status !== 'granted') {
                console.warn('Camera permission not granted');
            }
        })();
    }, []);
    if (!device) return null;

    return (
        <View style={{ flex: 1 }}>
            <Camera
                style={{ flex: 1 }}
                device={device}
                isActive={true}
                frameProcessor={frameProcessor}
                fps={2} // process every 0.5s
            />
            <View style={{ position: "absolute", bottom: 50, left: 20 }}>
                <Text style={{ color: "white" }}>{ocrText}</Text>
            </View>
        </View>
    );
}
