import { useDevice } from '../hooks/useDevice';
import { ResultMobile } from './ResultMobile';
import { ResultDesktop } from './ResultDesktop';

export function Result() {
  const device = useDevice();
  return device === 'mobile' ? <ResultMobile /> : <ResultDesktop />;
}
