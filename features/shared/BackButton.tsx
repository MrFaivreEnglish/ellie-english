import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Text from './ThemedText';
import MaterialIcons from './ThemedMaterialIcon';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../settings/ThemeContext';
import { getMenuCopy } from './menuCopy';
import { useDesktopTypographyScale } from './DesktopTypography';

interface BackButtonProps {



  label?: string;



  onPress?: () => void;



  style?: ViewStyle;



  textStyle?: TextStyle;






  hideLabel?: boolean;
}









const BackButton: React.FC<BackButtonProps> = ({
  label,
  onPress,
  style,
  textStyle,
  hideLabel = false,
}) => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const copy = getMenuCopy().common;
  const desktopScale = useDesktopTypographyScale();
  const resolvedLabel = label ?? copy.back;

  const handlePress = React.useCallback(() => {
    if (onPress) {
      onPress();
    } else {
      navigation.goBack();
    }
  }, [navigation, onPress]);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        desktopScale > 1 && {
          marginTop: Math.round(4 * desktopScale),
          paddingVertical: Math.round(6 * desktopScale),
          marginLeft: Math.round(4 * desktopScale),
        },
        style,
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={resolvedLabel}
    >
      <MaterialIcons name="arrow-back" size={Math.round(24 * desktopScale)} color={colors.text} />
      {!hideLabel && (
        <Text style={[
          styles.label,
          desktopScale > 1 && { marginLeft: Math.round(4 * desktopScale) },
          { color: colors.text },
          textStyle,
        ]}>{resolvedLabel}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 0,

    marginLeft: 4,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default BackButton;
