import { WelcomePlatform } from '../platform.js';
import { AccessorySubject, AccessoryConfig } from './accessory_subject.js';
import { ModelRaw } from './base.js';

export type RoleRaw = ModelRaw;

export class Role extends AccessorySubject {
  constructor(
    platform: WelcomePlatform,
    public readonly raw: RoleRaw,
  ) {
    super(platform, raw);
  }
}
