import { ImageEditor } from "expo-crop-image";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

interface SimpleCropperProps {
  imageUri: string;
  onCrop: (rect: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  }) => void;
  onCancel: () => void;
}

export default function SimpleCropper({
  imageUri,
  onCrop,
  onCancel,
}: SimpleCropperProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.root}>
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <ImageEditor
            imageUri={imageUri}
            fixedAspectRatio={1.585}
            minimumCropDimensions={{ width: 0, height: 0 }} // Allow any size, no minimum
            onEditingCancel={onCancel}
            onEditingComplete={(image) => {
              if (image && image.cropData) {
                const { originX, originY, width, height } = image.cropData;
                onCrop({ originX, originY, width, height });
              }
            }}
          />
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.btn} onPress={onCancel}>
            <Text style={styles.txt}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.ok]}
            onPress={() => {
              // The actual crop action is handled by onEditingComplete
              // This button just confirms the crop selection
            }}
          >
            <Text style={styles.txt}>Aplicar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  handle: {
    backgroundColor: "#ff8c00",
    borderColor: "#fff",
    borderWidth: 2,
    borderRadius: 10,
  },
  controls: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
  },
  btn: {
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 10,
    borderRadius: 6,
  },
  ok: {
    backgroundColor: "#ff8c00",
  },
  txt: {
    color: "#fff",
    fontWeight: "bold",
  },
});