/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// museum-inspired palette
const tintColorLight = '#1A3A52'; // navy base
const tintColorDark = '#4A7C9C';

export const Colors = {
  light: {
    // core
    text: '#11181C',
    textSecondary: "#F5F1E8",
    background: '#F5F1E8', // cream
    tint: tintColorLight,
    icon: '#6B7B84',
    tabIconDefault: '#6B7B84',
    tabIconSelected: tintColorLight,

    // semantic / UI
    primary: '#1A3A52',
    secondary: '#F5F1E8',
    accent: '#4A7C9C',
    cardBackground: '#FFFFFF',
    border: '#E6E3DE',
  // stronger contrast navy for primary actions
  buttonPrimary: '#06283D',
    buttonSecondary: '#BEE6F9',

    // quiz states
    correctAnswer: '#4CAF50',
    incorrectAnswer: '#F44336',
    selectedAnswer: '#B3D9F2',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '##ECEDEE',
    background: '#0F1A22',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,

    // semantic / UI
    primary: '#2A5670',
    secondary: '#121517',
    accent: '#5A8FB0',
    cardBackground: '#172028',
    border: '#20343E',
    buttonPrimary: '#2A5670',
    buttonSecondary: '#235A73',

    // quiz states
    correctAnswer: '#66BB6A',
    incorrectAnswer: '#EF5350',
    selectedAnswer: '#5A8FB0',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
