import type { API, Characteristic, DynamicPlatformPlugin, Logging, PlatformAccessory, PlatformConfig, Service } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';
import { AccessorySubject } from './models/accessory_subject.js';
import { Person, PersonRaw } from './models/person.js';
import { Room, RoomRaw } from './models/room.js';
import { Role, RoleRaw } from './models/role.js';
import { ConnectedPerson, ConnectedPersonRaw } from './models/connected_person.js';
import { AccessoryHandler } from './handlers/base.js';
import { PersonAccessoryHandler } from './handlers/person.js';
import { RoleAccessoryHandler } from './handlers/role.js';
import { Home } from './models/home.js';
import { HomeRaw } from './models/home.js';
import { Anyone } from './models/anyone.js';
import { AnyoneAccessoryHandler } from './handlers/anyone.js';

const ACCESSORY_HANDLERS = [
  PersonAccessoryHandler,
  RoleAccessoryHandler,
  AnyoneAccessoryHandler,
];

export class WelcomePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;

  public readonly accessories: Map<string, PlatformAccessory> = new Map();
  public readonly accessoryHandlers: Map<string, AccessoryHandler> = new Map();

  public readonly people: Map<string, Person> = new Map();
  public readonly roles: Map<string, Role> = new Map();
  public readonly rooms: Map<string, Room> = new Map();
  public readonly anyone: Anyone = new Anyone(this);

  public connectedPeople: ConnectedPerson[] = [];

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    if (!this.parseConfig()) {
      return;
    }

    this.api.on('didFinishLaunching', () => {
      this.refresh().then(() => this.refreshPeriodically());
    });
  }

  private parseConfig(): boolean {
    if (!this.config.server_url) {
      this.log.error('Welcome Server URL is required');
      return false;
    }

    if (!this.config.home_id) {
      this.log.error('Home ID is required');
      return false;
    }

    this.config.interval ||= 30;

    return true;
  }

  private refresh(): Promise<void> {
    return Promise.all([
      this.loadPeople(),
      this.loadRoles(),
      this.loadRooms(),
    ])
      .then(() => this.loadConnectedPeople())
      .then(() => this.refreshAccessories());
  }

  private refreshPeriodically(): void {
    setInterval(() => this.refresh(), this.config.interval * 1000);
  }

  loadPeople(): Promise<void> {
    return fetch(`${this.config.server_url}/api/people`)
      .then(res => res.json())
      .then((raws: PersonRaw[]) => raws.map(raw => new Person(this, raw)))
      .then(people => {
        this.people.clear();

        for (const person of people) {
          this.people.set(person.id, person);
        }

        this.log.debug(`Loaded ${people.length} people`);
      })
      .catch(err => {
        this.log.error('Failed to load people:', err);
        throw err;
      });
  }

  loadRoles(): Promise<void> {
    return fetch(`${this.config.server_url}/api/roles`)
      .then(res => res.json())
      .then((raws: RoleRaw[]) => raws.map(raw => new Role(this, raw)))
      .then(roles => {
        this.roles.clear();

        for (const role of roles) {
          this.roles.set(role.id, role);
        }

        this.log.debug(`Loaded ${roles.length} roles`);
      })
      .catch(err => {
        this.log.error('Failed to load roles:', err);
        throw err;
      });
  }

  loadRooms(): Promise<void> {
    return fetch(`${this.config.server_url}/api/homes/${this.config.home_id}`)
      .then(res => res.json())
      .then((raw: HomeRaw) => new Home(raw))
      .then(home => home.rooms)
      .then(rooms => {
        this.rooms.clear();

        for (const room of rooms) {
          this.rooms.set(room.id, room);
        }

        this.log.debug(`Loaded ${rooms.length} rooms`);
      })
      .catch(err => {
        this.log.error('Failed to load rooms:', err);
        throw err;
      });
  }

  loadConnectedPeople(): Promise<void> {
    return fetch(`${this.config.server_url}/api/homes/${this.config.home_id}/people`)
      .then(res => res.json())
      .then((raws: ConnectedPersonRaw[]) => raws.map(raw => new ConnectedPerson(this, raw)))
      .then(connectedPeople => {
        this.connectedPeople = connectedPeople;

        for (const connectedPerson of connectedPeople) {
          let label = connectedPerson.subject.displayName;
          if (!connectedPerson.known) {
            label += ` ("${connectedPerson.person.displayName}")`;
          }

          this.log.debug(`Connected person: ${label} @ ${connectedPerson.room.displayName}`);
        }
      })
      .catch(err => {
        this.log.error('Failed to load connected people:', err);
        throw err;
      });
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.accessories.set(accessory.UUID, accessory);
  }

  refreshAccessories() {
    this.removeInvalidAccessories();

    const subjects = [
      ...this.connectedPeople.map(connection => connection.subject),
      this.anyone,
    ];

    for (const subject of subjects) {
      this.ensureAccessory(subject, null);
      this.rooms.forEach(room => this.ensureAccessory(subject, room));
    }

    this.updateAccessories();
  }

  ensureAccessory(subject: AccessorySubject, room: Room | null) {
    const uuid = subject.accessoryUUID(room);
    let accessory = this.accessories.get(uuid) || null;

    const handler = this.ensureAccessoryHandler(accessory, subject, room);

    if (accessory) {
      this.api.updatePlatformAccessories([accessory]);
      return accessory;
    }

    if (!handler) {
      return null;
    }

    accessory = handler.accessory;
    if (!accessory) {
      return null;
    }

    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    this.log.debug('Registered new accessory:', accessory.displayName);

    this.accessories.set(uuid, accessory);
    return accessory;
  }

  private ensureAccessoryHandler(accessory: PlatformAccessory | null = null, subject: AccessorySubject | null = null, room: Room | null = null) {
    const uuid = accessory?.UUID || subject!.accessoryUUID(room);
    let handler = this.accessoryHandlers.get(uuid) || null;
    if (handler) {
      return handler;
    }

    const handlerClass = ACCESSORY_HANDLERS.find(handlerClass => {
      return accessory
        ? handlerClass.supportsAccessory(accessory)
        : handlerClass.supportsSubject(subject!);
    });
    if (!handlerClass) {
      return null;
    }

    handler = new handlerClass(this, accessory, subject, room);

    this.accessoryHandlers.set(uuid, handler);
    return handler;
  }

  removeInvalidAccessories() {
    const invalidAccessories: PlatformAccessory[] = [];

    this.accessories.forEach(accessory => {
      const handler = this.ensureAccessoryHandler(accessory);
      if (!handler?.valid) {
        invalidAccessories.push(accessory);
      }
    });

    for (const accessory of invalidAccessories) {
      this.removeAccessory(accessory);
    }
  }

  updateAccessories() {
    this.accessories.forEach(accessory => {
      const handler = this.ensureAccessoryHandler(accessory)!;
      this.updateAccessoryHandler(handler);
    });
  }

  removeAccessory(accessory: PlatformAccessory) {
    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    this.accessories.delete(accessory.UUID);
    this.accessoryHandlers.delete(accessory.UUID);
    this.log.debug('Removed accessory:', accessory.displayName);
  }

  updateAccessoryHandler(handler: AccessoryHandler) {
    const updated = handler.update();

    this.log[updated ? 'info' : 'debug'](
      updated ? 'Updated accessory status:' : 'Accessory status unchanged:',
      `"${handler.displayName}"`,
      handler.active ? 'active' : 'inactive',
    );

    return updated;
  }
}
