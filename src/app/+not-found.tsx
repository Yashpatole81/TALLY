import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Screen, ScreenTitle } from '@/components/ui/screen';

export default function NotFound() {
  return (
    <Screen scroll={false} footer={<Button label="Go to Tally" onPress={() => router.replace('/')} />}>
      <ScreenTitle title="Nothing here." subtitle="That link doesn’t lead anywhere in Tally." className="mt-16" />
    </Screen>
  );
}
