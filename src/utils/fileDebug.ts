import * as FileSystem from "expo-file-system"
import { Platform } from "react-native"

export const debugFileInfo = async (uri: string, fileName: string, mimeType: string) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri)

    console.log("=== FILE DEBUG INFO ===")
    console.log("Platform:", Platform.OS)
    console.log("File Name:", fileName)
    console.log("MIME Type:", mimeType)
    console.log("URI:", uri)
    console.log("File exists:", fileInfo.exists)
    console.log("File size:", fileInfo.size)
    console.log("Is directory:", fileInfo.isDirectory)

    if (Platform.OS === "android") {
      try {
        const contentUri = await FileSystem.getContentUriAsync(uri)
        console.log("Content URI:", contentUri)
      } catch (error) {
        console.log("Content URI Error:", error)
      }
    }

    console.log("======================")
  } catch (error) {
    console.error("Debug error:", error)
  }
}
