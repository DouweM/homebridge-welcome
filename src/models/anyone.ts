import { WelcomePlatform } from '../platform.js';
import { AccessorySubject, AccessoryConfig } from './accessory_subject.js';

export class Anyone extends AccessorySubject {
  constructor(
    platform: WelcomePlatform,
  ) {
    super(platform, { id: 'anyone', display_name: 'Anyone' });
  }

  get config(): AccessoryConfig {
    return {
      ...super.config,
      anywhere: true,
    };
  }
}
