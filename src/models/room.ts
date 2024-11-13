import { Model, ModelRaw } from './base.js';

export type RoomRaw = ModelRaw;

export class Room extends Model {
  constructor(
    public readonly raw: RoomRaw,
  ) {
    super(raw);
  }
}
