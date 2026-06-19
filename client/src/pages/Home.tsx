import { useDevice } from '../hooks/useDevice';
import { HomeMobile } from './HomeMobile';
import { HomeDesktop } from './HomeDesktop';

export function Home() {
  const device = useDevice();
  return device === 'mobile' ? <HomeMobile /> : <HomeDesktop />;
}
