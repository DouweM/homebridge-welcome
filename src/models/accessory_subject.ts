import { WelcomePlatform } from '../platform.js';
import { Model, ModelRaw } from './base.js';
import { Room } from './room.js';

export type AccessoryConfig = {
  homeAccessory: boolean;
  roomAccessory: boolean;
  lazy: boolean;
};

export abstract class AccessorySubject extends Model {
  constructor(
    protected readonly platform: WelcomePlatform,
    raw: ModelRaw,
  ) {
    super(raw);
  }

  abstract get config(): AccessoryConfig;

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
