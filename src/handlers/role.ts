import { Role } from '../models/role.js';
import { AccessoryHandler } from './base.js';

export class RoleAccessoryHandler extends AccessoryHandler {
  static override SUBJECT_TYPE = Role.name;

  protected override subjectFromID(id: string): Role | null {
    return this.platform.roles.get(id) || null;
  }

  get role(): Role | null {
    return this.subject as Role | null;
  }
}
