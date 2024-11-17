import { WelcomePlatform } from '../platform.js';
import { HomebridgeAttrs, Model, ModelRaw } from './base.js';
import { Room } from './room.js';

export type SubjectHomebridgeAttrs = HomebridgeAttrs & {
  anywhere?: boolean;
  room?: boolean;
  lazy?: boolean;
};

export type AccessoryConfig = {
  anywhere: boolean;
  room: boolean;
  lazy: boolean;
};

export abstract class AccessorySubject extends Model {
  constructor(
    protected readonly platform: WelcomePlatform,
    raw: ModelRaw,
  ) {
    super(raw);
  }

  get homebridgeAttrs(): SubjectHomebridgeAttrs {
    return super.homebridgeAttrs as SubjectHomebridgeAttrs;
  }

  get config(): AccessoryConfig {
    return {
      anywhere: this.homebridgeAttrs.anywhere ?? false,
      room: this.homebridgeAttrs.room ?? true,
      lazy: this.homebridgeAttrs.lazy ?? false,
    };
  }

  protected accessoryUUIDKey(room: Room | null): string {
    const parts = [this.constructor.name, this.id];
    if (room) {
      parts.push(room.id);
    }
    return parts.join('/');
  }

  accessoryUUID(room: Room | null) {
    return this.platform.api.hap.uuid.generate(this.accessoryUUIDKey(room));
  }
}
