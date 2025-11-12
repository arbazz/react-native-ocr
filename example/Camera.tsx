import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Camera, useCameraDevice, useCameraDevices } from 'react-native-vision-camera';

export default function CameraView() {
    const devices = useCameraDevice('back');
    const [ocrText, setOcrText] = useState("");

    useEffect(() => {
        (async () => {
            // const status = await Camera.requestCameraPermission();
            // if (status !== 'granted') {
            //     console.warn('Camera permission not granted');
            // }
        })();
    }, []);

    const device = devices
    if (!device) return null;

    return (
        <View>
            <Text>Camer</Text>
            <Camera
                style={{ flex: 1 }}
                device={device}
                isActive={true}
                // frameProcessor={frameProcessor}
                fps={2} // process every 0.5s
            />
        </View>
    )
}