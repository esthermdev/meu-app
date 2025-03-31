// components/CustomText.tsx
import React from 'react';
import { Text as RNText, TextProps } from 'react-native';
import { typography } from '@/constants/Typography';

type TypographyKey = keyof typeof typography;

interface CustomTextProps extends TextProps {
  variant?: TypographyKey;
  children: React.ReactNode;
}

const CustomText = ({ 
  variant = 'body',
  style, 
  children, 
  allowFontScaling = false, // Default to preventing font scaling
  maxFontSizeMultiplier = 1,
  ...restProps 
}: CustomTextProps) => {
  
  // Use the specified typography variant or default to 'body'
  const variantStyle = typography[variant] || typography.body;
  
  return (
    <RNText
      allowFontScaling={allowFontScaling}
      style={[variantStyle, style]}
      {...restProps}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
    >
      {children}
    </RNText>
  );
};

export default CustomText;