import Svg, { Path } from 'react-native-svg';

type SoundWaveIconProps = {
  size?: number;
  color?: string;
};




export default function SoundWaveIcon({ size = 20, color = '#4BBAF4' }: SoundWaveIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M2 10v4h4l5 5V5L6 10H2z" fill={color} />
      <Path
        d="M15.5 8.5a5 5 0 010 7"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M18.5 5.5a9 9 0 010 13"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
