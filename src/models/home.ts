import { Model, ModelRaw } from './base.js';
import { Room, RoomRaw } from './room.js';

export type HomeRaw = ModelRaw & {
  rooms: RoomRaw[];
};

export class Home extends Model {
  constructor(
    public readonly raw: HomeRaw,
  ) {
    super(raw);
  }

  get rooms(): Room[] {
    return this.raw.rooms.map(raw => new Room(raw));
  }
}
