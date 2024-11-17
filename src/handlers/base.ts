import { PlatformAccessory, Service } from 'homebridge';
import { AccessorySubject, AccessoryConfig } from '../models/accessory_subject.js';
import { WelcomePlatform } from '../platform.js';

import { AUTHOR_NAME, PLUGIN_NAME } from '../settings.js';
import { Room } from '../models/room.js';

type AccessoryContext = {
  subject_type: string;
  subject_id: string;
  room_id: string | null;
};

export abstract class AccessoryHandler {
  static SUBJECT_TYPE = AccessorySubject.name;

  static supportsAccessory(accessory: PlatformAccessory) {
    const context = accessory.context as AccessoryContext;
    return context.subject_type === this.SUBJECT_TYPE;
  }

  static supportsSubject(subject: AccessorySubject) {
    return subject.constructor.name === this.SUBJECT_TYPE;
  }

  protected service?: Service | null;

  private _accessory: PlatformAccessory | null = null;
  private _active = false;

  public subjectID: string;
  public roomID: string | null = null;

  constructor(
    protected readonly platform: WelcomePlatform,
    accessory: PlatformAccessory | null = null,
    subject: AccessorySubject | null = null,
    room: Room | null = null,
  ) {
    if (accessory) {
      this._accessory = accessory;

      const context = accessory.context as AccessoryContext;
      this.subjectID = context.subject_id;
      this.roomID = context.room_id;
    } else if (subject) {
      this.subjectID = subject.id;
      this.roomID = room?.id || null;
    } else {
      throw new Error('AccessoryHandler needs at least one of accessory and subject.');
    }

    if (this.accessory) {
      this.setupAccessory();
    }
  }

  get accessory() : PlatformAccessory | null {
    if (!this._accessory && this.shouldHaveAccessory()) {
      this._accessory = new this.platform.api.platformAccessory(this.displayName, this.uuid);
    }

    return this._accessory || null;
  }

  setAccessoryContext() {
    if (!this.accessory) {
      return;
    }

    const context: AccessoryContext = {
      subject_type: this.subjectType,
      subject_id: this.subjectID,
      room_id: this.roomID,
    };
    this.accessory.context = context;
  }

  setupAccessory() {
    this.setAccessoryContext();

    const accessory = this.accessory!;

    accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, AUTHOR_NAME)
      .setCharacteristic(this.platform.Characteristic.Model, PLUGIN_NAME)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.uuid)
      .setCharacteristic(this.platform.Characteristic.Name, this.displayName);

    this.service = accessory.getService(this.platform.Service.OccupancySensor) ||
      accessory.addService(this.platform.Service.OccupancySensor);

    this.service.getCharacteristic(this.platform.Characteristic.OccupancyDetected)
      .on('get', async (callback) => callback(null, this.active));
  }

  get subjectType() : string {
    return (<typeof AccessoryHandler>this.constructor).SUBJECT_TYPE;
  }

  protected abstract subjectFromID(id: string): AccessorySubject | null;

  get subject(): AccessorySubject | null {
    return this.subjectFromID(this.subjectID);
  }

  get room(): Room | null {
    return this.roomID ? this.platform.rooms.get(this.roomID) || null : null;
  }

  get displayName() {
    const displayName = this.subject!.displayName;
    if (this.room && displayName.startsWith(this.room.displayName)) {
      return displayName;
    }

    return `${this.room?.displayName || 'Anywhere'} ${displayName}`;
  }

  get uuid() {
    return this.subject!.accessoryUUID(this.room);
  }

  get active() {
    return this.platform.connectedPeople.some(connection =>
      connection.subject.equals(this.subject) &&
      connection.isInRoom(this.room),
    );
  }

  get config(): AccessoryConfig {
    return this.subject!.config;
  }

  protected shouldHaveAccessory(existingAccessory: PlatformAccessory | null = null) : boolean {
    if (this.room) {
      if (!this.config.room || this.room.disabled) {
        return false;
      }

      if (!existingAccessory && (this.config.lazy || this.room.lazy) && !this.active) {
        return false;
      }
    } else {
      if (!this.config.anywhere) {
        return false;
      }
    }

    return true;
  }

  update() : boolean {
    const accessory = this.accessory!;

    accessory.displayName = this.displayName;
    accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);

    const active = this.active;
    const changed = active !== this._active;
    this._active = active;

    if (changed) {
      this.service!.updateCharacteristic(this.platform.Characteristic.OccupancyDetected, active);
    }

    return changed;
  }

  get valid() : boolean {
    if (!this.subject || !this.accessory) {
      return false;
    }

    if (this.roomID && !this.room) {
      return false;
    }

    const uuid = this.uuid;
    if (uuid !== this.accessory.UUID) {
      return false;
    }

    return this.shouldHaveAccessory(this.accessory);
  }
}
