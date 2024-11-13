import { WelcomePlatform } from '../platform.js';
import { AccessorySubject } from './accessory_subject.js';
import { Person, PersonRaw } from './person.js';
import { Role, RoleRaw } from './role.js';
import { Home, HomeRaw } from './home.js';
import { Room, RoomRaw } from './room.js';

export type ConnectedPersonRaw = {
  known: boolean;
  person: PersonRaw;
  role: RoleRaw;
  home: HomeRaw;
  room: RoomRaw;
};

export class ConnectedPerson {
  constructor(
    protected readonly platform: WelcomePlatform,
    public readonly raw: ConnectedPersonRaw,
  ) {
  }

  get known(): boolean {
    return this.raw.known;
  }

  get personID(): string {
    return this.raw.person.id;
  }

  get person(): Person {
    return new Person(this.platform, this.raw.person);
  }

  get roleID(): string {
    return this.raw.role.id;
  }

  get role(): Role {
    return new Role(this.platform, this.raw.role);
  }

  get homeID(): string {
    return this.raw.home.id;
  }

  get home(): Home {
    return new Home(this.raw.home);
  }

  get roomID(): string {
    return this.raw.room.id;
  }

  get room(): Room {
    return new Room(this.raw.room);
  }

  get subjectType(): string {
    return this.known ? Person.name : Role.name;
  }

  get subjectID(): string {
    return this.known ? this.personID : this.roleID;
  }

  get subject(): AccessorySubject {
    return this.known ? this.person : this.role;
  }

  isInHome(home: Home | string): boolean {
    return home instanceof Home ? this.home.equals(home) : this.homeID === home;
  }

  isInRoom(room: Room | null): boolean {
    return !room || this.room.equals(room);
  }
}
