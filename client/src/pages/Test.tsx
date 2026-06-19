import { useDevice } from '../hooks/useDevice';
import { TestMobile } from './TestMobile';
import { TestDesktop } from './TestDesktop';

export function Test() {
  const device = useDevice();
  return device === 'mobile' ? <TestMobile /> : <TestDesktop />;
}
