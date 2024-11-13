export type ModelRaw = {
  id: string;
  display_name: string;
};

export abstract class Model {
  constructor(
    public readonly raw: ModelRaw,
  ) {
  }

  get id(): string {
    return this.raw.id;
  }

  get displayName(): string {
    // TODO: use this.raw.attrs.homekit_name
    return this.raw.display_name;
  }

  equals(other: Model | null): boolean {
    return !!other && other.constructor === this.constructor && other.id === this.id;
  }
}
