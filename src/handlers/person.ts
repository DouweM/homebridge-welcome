import { Person } from '../models/person.js';
import { AccessoryHandler } from './base.js';

export class PersonAccessoryHandler extends AccessoryHandler {
  static override SUBJECT_TYPE = Person.name;

  protected override subjectFromID(id: string): Person | null {
    return this.platform.people.get(id) || null;
  }

  get person(): Person | null {
    return this.subject as Person | null;
  }
}
