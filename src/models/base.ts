export type HomebridgeAttrs = {
  name?: string;
  [key: string]: unknown;
}

export type Attrs = {
  homebridge?: HomebridgeAttrs;
}

export type ModelRaw = {
  id: string;
  display_name: string;
  attrs?: Attrs;
};

export abstract class Model {
  constructor(
    public readonly raw: ModelRaw,
  ) {
  }

  get id(): string {
    return this.raw.id;
  }

  get attrs(): Attrs {
    return this.raw.attrs ?? {};
  }

  get homebridgeAttrs(): HomebridgeAttrs {
    return this.attrs.homebridge ?? {};
  }

  get displayName(): string {
    return this.homebridgeAttrs.name ?? this.raw.display_name;
  }

  equals(other: Model | null): boolean {
    return !!other && other.constructor === this.constructor && other.id === this.id;
  }
}
