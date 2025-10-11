import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from "react-native"

export const debugFileInfo = async (uri: string, fileName: string, mimeType: string) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri)

    if (Platform.OS === "android") {
      try {
        const contentUri = await FileSystem.getContentUriAsync(uri)
      } catch (error) {
        console.error("Content URI Error:", error)
      }
    }
  } catch (error) {
    console.error("Debug error:", error)
  }
}
