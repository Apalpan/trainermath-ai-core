import { certificates } from '../mocks/certificates';
import type { Certificate } from '../types';
import { delay } from './delay';

export const certificateService = {
  async getCertificates(): Promise<Certificate[]> {
    return delay(certificates);
  },

  async downloadCertificate(certificateId: string): Promise<string> {
    return delay(certificateId, 280, 600);
  },
};
