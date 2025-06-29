import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import {
  MIN_CROP_WIDTH_CM,
  MIN_CROP_HEIGHT_CM,
  CM_TO_PIXELS,
} from './DocumentConstants';

const { width: SW, height: SH } = Dimensions.get('window');
const MIN_W = CM_TO_PIXELS(MIN_CROP_WIDTH_CM);
const MIN_H = CM_TO_PIXELS(MIN_CROP_HEIGHT_CM);
const HANDLE_SIZE = 20; // Tamaño de los handles en píxeles

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
  const [imgDim, setImgDim] = useState({ w: SW, h: SH * 0.7 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const tX = useSharedValue(0);
  const tY = useSharedValue(0);
  const cW = useSharedValue(Math.min(SW * 0.8, MIN_W));
  const cH = useSharedValue(Math.min(SW * 0.8, MIN_H));

  useEffect(() => {
    Image.getSize(imageUri, (w, h) => {
      const ar = w / h;
      let dw = SW;
      let dh = SW / ar;

      const maxW = SW - 40;
      const maxH = SH * 0.7;
      const scale = Math.min(maxW / dw, maxH / dh, 1);
      dw *= scale;
      dh *= scale;

      const ox = (SW - dw) / 2;
      const oy = (SH - dh) / 2;
      setImgDim({ w: dw, h: dh });
      setOffset({ x: ox, y: oy });

      const iw = Math.max(MIN_W, dw * 0.8);
      const ih = Math.max(MIN_H, dh * 0.8);
      cW.value = Math.min(iw, dw - HANDLE_SIZE * 2);
      cH.value = Math.min(ih, dh - HANDLE_SIZE * 2);
      tX.value = (dw - cW.value) / 2;
      tY.value = (dh - cH.value) / 2;
    });
  }, [imageUri]);

  const panCtx = { sx: 0, sy: 0 };
  const pan = Gesture.Pan()
    .onStart(() => {
      panCtx.sx = tX.value;
      panCtx.sy = tY.value;
    })
    .onUpdate((e) => {
      let nx = panCtx.sx + e.translationX;
      let ny = panCtx.sy + e.translationY;
      nx = Math.max(HANDLE_SIZE, Math.min(nx, imgDim.w - cW.value - HANDLE_SIZE));
      ny = Math.max(HANDLE_SIZE, Math.min(ny, imgDim.h - cH.value - HANDLE_SIZE));
      tX.value = nx;
      tY.value = ny;
    });

  const cornerCtx = { x: 0, y: 0, w: 0, h: 0 };
  const makeCorner = (c: 'tl' | 'tr' | 'bl' | 'br') =>
    Gesture.Pan()
      .onStart(() => {
        cornerCtx.x = tX.value;
        cornerCtx.y = tY.value;
        cornerCtx.w = cW.value;
        cornerCtx.h = cH.value;
      })
      .onUpdate((e) => {
        let nx = cornerCtx.x;
        let ny = cornerCtx.y;
        let nw = cornerCtx.w;
        let nh = cornerCtx.h;

        if (c.includes('l')) {
          nx = cornerCtx.x + e.translationX;
          nw = cornerCtx.w - e.translationX;
        }
        if (c.includes('r')) nw = cornerCtx.w + e.translationX;
        if (c.includes('t')) {
          ny = cornerCtx.y + e.translationY;
          nh = cornerCtx.h - e.translationY;
        }
        if (c.includes('b')) nh = cornerCtx.h + e.translationY;

        if (c.includes('l')) {
          nx = Math.max(HANDLE_SIZE, Math.min(nx, cornerCtx.x + cornerCtx.w - MIN_W));
          nw = cornerCtx.x + cornerCtx.w - nx;
        }
        if (c.includes('r')) {
          nw = Math.max(MIN_W, Math.min(nw, imgDim.w - cornerCtx.x - HANDLE_SIZE));
        }
        if (c.includes('t')) {
          ny = Math.max(HANDLE_SIZE, Math.min(ny, cornerCtx.y + cornerCtx.h - MIN_H));
          nh = cornerCtx.y + cornerCtx.h - ny;
        }
        if (c.includes('b')) {
          nh = Math.max(MIN_H, Math.min(nh, imgDim.h - cornerCtx.y - HANDLE_SIZE));
        }

        tX.value = nx;
        tY.value = ny;
        cW.value = nw;
        cH.value = nh;
      });

  const cropStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: offset.x + tX.value,
    top: offset.y + tY.value,
    width: cW.value,
    height: cH.value,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 100,
    elevation: 100,
  }));

  const applyCrop = () =>
    runOnJS(onCrop)({
      originX: tX.value,
      originY: tY.value,
      width: cW.value,
      height: cH.value,
    });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.root}>
        <View
          style={{
            position: 'absolute',
            left: offset.x,
            top: offset.y,
            width: imgDim.w,
            height: imgDim.h,
          }}
        >
          <Image
            source={{ uri: imageUri }}
            style={{ width: imgDim.w, height: imgDim.h }}
            resizeMode="contain"
          />
        </View>

        <GestureDetector gesture={pan}>
          <Animated.View style={cropStyle}>
            {(['tl', 'tr', 'bl', 'br'] as const).map((c) => {
              const g = makeCorner(c);
              const pos: any = { position: 'absolute', width: HANDLE_SIZE, height: HANDLE_SIZE };
              if (c === 'tl') Object.assign(pos, { left: 0, top: 0 });
              if (c === 'tr') Object.assign(pos, { right: 0, top: 0 });
              if (c === 'bl') Object.assign(pos, { left: 0, bottom: 0 });
              if (c === 'br') Object.assign(pos, { right: 0, bottom: 0 });
              return (
                <GestureDetector key={c} gesture={g}>
                  <Animated.View style={[pos, styles.handle]} />
                </GestureDetector>
              );
            })}
          </Animated.View>
        </GestureDetector>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.btn} onPress={onCancel}>
            <Text style={styles.txt}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.ok]} onPress={applyCrop}>
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
    backgroundColor: '#000',
  },
  handle: {
    backgroundColor: '#ff8c00',
    borderColor: '#fff',
    borderWidth: 2,
    borderRadius: 10,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  btn: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 10,
    borderRadius: 6,
  },
  ok: {
    backgroundColor: '#ff8c00',
  },
  txt: {
    color: '#fff',
    fontWeight: 'bold',
  },
});