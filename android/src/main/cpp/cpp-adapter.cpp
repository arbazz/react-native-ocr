#include <jni.h>
#include "NitroOcrOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::ocr::initialize(vm);
}
