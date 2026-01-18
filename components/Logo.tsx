import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const Logo = ({ size = 32 }: { size?: number }) => {
  const glowOpacity = useSharedValue(1);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg viewBox="0 0 100 100" width="100%" height="100%">
        <Defs>
          <LinearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#C026D3" />
            <Stop offset="100%" stopColor="#DB2777" />
          </LinearGradient>
        </Defs>
        
        {/* Background Shape */}
        <Path 
          d="M20 20 H80 L95 50 L80 80 H20 L5 50 L20 20Z" 
          fill="url(#logoGradient)" 
          opacity="0.1" 
        />
        
        {/* Stylized 'R' / Frequency Wave */}
        <Path 
          d="M30 80 V25 M30 35 H60 C75 35 75 55 60 55 H30 M60 55 L80 80" 
          stroke="url(#logoGradient)" 
          strokeWidth="12" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        
        {/* Pulse Dot */}
        {/* SVG Filters (blur) are not fully supported in bare React Native SVG without performance cost or specific engine. 
            We'll simulate glow with transparency or just omit blur for performance on mobile. */}
        <AnimatedCircle 
          cx="85" 
          cy="25" 
          r="8" 
          fill="#DB2777" 
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
};
