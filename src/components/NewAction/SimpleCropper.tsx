import { ImageEditor } from "expo-crop-image";

interface SimpleCropperProps {
  imageUri: string;
  onCrop: (imageUri: string) => void;
  onCancel: () => void;
}

export default function SimpleCropper({
  imageUri,
  onCrop,
  onCancel,
}: SimpleCropperProps) {
  return (
    <ImageEditor
      isVisible={true}
      imageUri={imageUri}
      fixedAspectRatio={1}
      minimumCropDimensions={{ width: 0, height: 0 }}
      onEditingCancel={onCancel}
      onEditingComplete={(image) => {
        if (image && image.uri) {
          onCrop(image.uri); // Pasa la URI de la imagen recortada a onCrop
        }
      }}
      editorOptions={{
        controlBar: {
          position: "bottom",
          cancelButton: {
            text: "Cancelar",
            color: "#fff",
            iconName: "close",
          },
          cropButton: {
            text: "Recortar",
            color: "#fff",
            iconName: "check",
          },
          backButton: {
            text: "Volver",
            color: "#fff",
            iconName: "chevron-left",
          },
          saveButton: {
            text: "Guardar",
            color: "#fff",
            iconName: "save",
          },
        },
      }}
    />
  );
}
