package com.margelo.nitro.ocr

class HybridOcr: HybridOcrSpec(){
    override fun scan(input: String): String {
        return "scanned $input"
    }

}