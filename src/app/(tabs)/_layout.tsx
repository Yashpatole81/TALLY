import { Tabs } from 'expo-router/js-tabs';
import { ChartNoAxesColumn, House, type LucideIcon, Settings2 } from 'lucide-react-native';
import { type ColorValue, StyleSheet, Text } from 'react-native';

import { colors, fonts } from '@/theme/tokens';

interface TabState {
  color: ColorValue;
  focused: boolean;
}

function TabIcon({ icon: Icon, color, focused }: TabState & { icon: LucideIcon }) {
  return <Icon size={24} color={String(color)} strokeWidth={focused ? 1.9 : 1.6} />;
}

function TabLabel({ title, color, focused }: TabState & { title: string }) {
  return (
    <Text style={{ color, fontSize: 11, fontFamily: focused ? fonts.semibold : fonts.regular, marginTop: 2 }}>
      {title}
    </Text>
  );
}

/**
 * Flat white tab bar with a hairline top border (Figma Interface essentials). Tabs are peers, so
 * switching never animates (animation guideline: no slide between tabs).
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'none',
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingTop: 8,
          elevation: 0,
        },
        sceneStyle: { backgroundColor: colors.canvas },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: (state) => <TabIcon icon={House} {...state} />,
          tabBarLabel: (state) => <TabLabel title="Home" {...state} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: (state) => <TabIcon icon={ChartNoAxesColumn} {...state} />,
          tabBarLabel: (state) => <TabLabel title="Insights" {...state} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: (state) => <TabIcon icon={Settings2} {...state} />,
          tabBarLabel: (state) => <TabLabel title="Settings" {...state} />,
        }}
      />
    </Tabs>
  );
}
