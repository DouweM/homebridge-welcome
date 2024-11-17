import { WelcomePlatform } from '../platform.js';
import { AccessorySubject, AccessoryConfig } from './accessory_subject.js';
import { ModelRaw } from './base.js';
export type PersonRaw = ModelRaw & {
  known: boolean;
};

export class Person extends AccessorySubject {
  constructor(
    platform: WelcomePlatform,
    public readonly raw: PersonRaw,
  ) {
    super(platform, raw);
  }

  get known(): boolean {
    return this.raw.known;
  }
}
