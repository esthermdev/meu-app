// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
import { type ComponentProps } from 'react';

import { type IconProps } from '@expo/vector-icons/build/createIconSet';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

export function TabBarIcon({ style, ...rest }: IconProps<ComponentProps<typeof FontAwesome6>['name']>) {
  return <FontAwesome6 size={20} style={[style]} {...rest} />;
}
