import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Standard design screen size (e.g., iPhone X/11/12/13/14)
const GUIDELINE_BASE_WIDTH = 375;
const GUIDELINE_BASE_HEIGHT = 812;

/**
 * Scales width based on screen width.
 */
export const scale = (size: number) => (SCREEN_WIDTH / GUIDELINE_BASE_WIDTH) * size;

/**
 * Scales height based on screen height.
 */
export const verticalScale = (size: number) => (SCREEN_HEIGHT / GUIDELINE_BASE_HEIGHT) * size;

/**
 * Moderate scales size based on a factor.
 */
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

/**
 * Responsive Width: Percentage of screen width.
 */
export const rw = (percentage: number) => (percentage * SCREEN_WIDTH) / 100;

/**
 * Responsive Height: Percentage of screen height.
 */
export const rh = (percentage: number) => (percentage * SCREEN_HEIGHT) / 100;

/**
 * Responsive Font: Scales font size based on screen width and pixel density.
 */
export const rf = (size: number) => {
  const newSize = size * (SCREEN_WIDTH / GUIDELINE_BASE_WIDTH);
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

export { SCREEN_WIDTH, SCREEN_HEIGHT };
