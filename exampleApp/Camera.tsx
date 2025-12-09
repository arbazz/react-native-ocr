import React, { useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Dimensions, Image } from 'react-native'
import {
    Camera,
    useCameraDevice,
} from 'react-native-vision-camera'
import { HybridOcr } from 'react-native-ocr'

// PROGRAMMATIC SCAN REGION (Normalized 0-1)
// Adjust these values to change the scan area in the code
const SCAN_REGION = {
    x: 0.1,      // 10% from left
    y: 0.3,      // 30% from top
    width: 0.8,  // 80% of width
    height: 0.2  // 20% of height
}

const SCREEN_WIDTH = Dimensions.get('window').width
const SCREEN_HEIGHT = Dimensions.get('window').height

export default function CameraView() {
    const camera = useRef<Camera>(null)
    const device = useCameraDevice('back')

    const [ocrResult, setOcrResult] = useState<{ text: string, croppedImagePath?: string } | null>(null)
    const [isScanning, setIsScanning] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        (async () => {
            const status = await Camera.requestCameraPermission()
            if (status !== 'granted') console.warn('Camera permission not granted')
        })()
    }, [])

    const captureAndScan = async () => {
        if (!camera.current) return

        setIsScanning(true)
        setError(null)
        setOcrResult(null)

        try {
            // Take a photo
            const photo = await camera.current.takePhoto()
            console.log('Photo captured:', photo.path)
            console.log('Scanning Region:', SCAN_REGION)

            // Run OCR on the photo with focus region
            // Now returns JSON string: { text: "...", croppedImagePath: "..." }
            const jsonString = await HybridOcr.scanImageWithRegion(
                photo.path,
                SCAN_REGION.x,
                SCAN_REGION.y,
                SCAN_REGION.width,
                SCAN_REGION.height
            )

            console.log('OCR Raw Result:', jsonString)

            try {
                const parsed = JSON.parse(jsonString)
                setOcrResult(parsed)
            } catch (e) {
                // Fallback for older native module version or plain string return
                setOcrResult({ text: jsonString })
            }

        } catch (error: any) {
            console.error('Error:', error)
            setError(error.message)
        } finally {
            setIsScanning(false)
        }
    }

    if (!device) return null

    return (
        <View style={styles.container}>
            <Camera
                ref={camera}
                style={styles.preview}
                device={device}
                isActive={true}
                photo={true}
            />

            {/* Static Focus Frame Visualizer */}
            <View
                style={[
                    styles.focusFrame,
                    {
                        left: `${SCAN_REGION.x * 100}%`,
                        top: `${SCAN_REGION.y * 100}%`,
                        width: `${SCAN_REGION.width * 100}%`,
                        height: `${SCAN_REGION.height * 100}%`
                    }
                ]}
            >
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                <Text style={styles.focusText}>Scanning Area</Text>
            </View>

            <TouchableOpacity
                style={[styles.captureButton, isScanning && styles.captureButtonDisabled]}
                onPress={captureAndScan}
                disabled={isScanning}
            >
                <Text style={styles.captureText}>
                    {isScanning ? 'Scanning...' : 'Scan Text'}
                </Text>
            </TouchableOpacity>

            {/* Results Display */}
            {(ocrResult || error) && (
                <ScrollView style={styles.resultBox}>
                    {error ? (
                        <Text style={styles.errorText}>Error: {error}</Text>
                    ) : (
                        <>
                            <Text style={styles.resultLabel}>Result:</Text>
                            <Text style={styles.resultText}>{ocrResult?.text || 'No text found'}</Text>

                            {ocrResult?.croppedImagePath ? (
                                <>
                                    <Text style={styles.resultLabel}>Cropped Image:</Text>
                                    <Image
                                        source={{ uri: ocrResult.croppedImagePath }}
                                        style={styles.croppedImage}
                                        resizeMode="contain"
                                    />
                                </>
                            ) : null}
                        </>
                    )}
                </ScrollView>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    preview: {
        flex: 1,
    },
    focusFrame: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: 'rgba(0, 255, 0, 0.8)',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#00ff00',
        borderWidth: 4,
    },
    topLeft: {
        top: -2,
        left: -2,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    topRight: {
        top: -2,
        right: -2,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
    },
    bottomLeft: {
        bottom: -2,
        left: -2,
        borderRightWidth: 0,
        borderTopWidth: 0,
    },
    bottomRight: {
        bottom: -2,
        right: -2,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    focusText: {
        color: 'white',
        fontSize: 14,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        overflow: 'hidden',
    },
    captureButton: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 30,
        zIndex: 20,
    },
    captureButtonDisabled: {
        backgroundColor: '#cccccc',
    },
    captureText: {
        color: 'black',
        fontSize: 18,
        fontWeight: 'bold',
    },
    resultBox: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        maxHeight: 300,
        backgroundColor: 'rgba(0,0,0,0.9)',
        padding: 15,
        borderRadius: 10,
        zIndex: 30,
    },
    resultLabel: {
        color: '#aaaaaa',
        fontSize: 12,
        marginBottom: 4,
        marginTop: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    resultText: {
        color: 'white',
        fontSize: 16,
        lineHeight: 24,
    },
    errorText: {
        color: '#ff4444',
        fontSize: 14,
    },
    croppedImage: {
        width: '100%',
        height: 100,
        marginTop: 5,
        backgroundColor: '#333',
        borderRadius: 4,
    }
})