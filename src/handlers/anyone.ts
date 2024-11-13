import { Anyone } from '../models/anyone.js';
import { AccessoryHandler } from './base.js';

export class AnyoneAccessoryHandler extends AccessoryHandler {
  static override SUBJECT_TYPE = Anyone.name;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected override subjectFromID(_id: string): Anyone | null {
    return this.platform.anyone;
  }

  get anyone(): Anyone {
    return this.subject as Anyone;
  }

  get active() {
    return this.platform.connectedPeople.some(connection => connection.isInRoom(this.room));
  }
}
