export class RoomData
{
  // Room metadata.
  public static room: Room;

  // Room objects.
  public static spawns: Spawn[];
  public static powerSpawn: PowerSpawn | undefined;
  public static structures: Structure[];
  public static storage: Storage | undefined;
  public static containers: Container[];
  public static walls: StructureWall[];
  public static ramparts: Rampart[];
  public static towers: Tower[];
  public static links: StructureLink[];
  public static sites: ConstructionSite[];
  public static sources: Source[];
  public static minerals: Mineral[];
  public static dropped: Resource[];
  public static creeps: Creep[];
  public static hostileCreeps: Creep[];
  public static creepsOfRole: {};
  public static colonyCreeps: Creep[];

  // Invasion information.
  public static invaderCount: number;

  /**
   * Reinitialize room object properties.
   * @static
   * @memberof RoomData
   */
  public static reset()
  {
    this.spawns = [];
    this.powerSpawn = undefined;
    this.structures = [];
    this.storage = undefined;
    this.containers = [];
    this.walls = [];
    this.ramparts = [];
    this.towers = [];
    this.links = [];
    this.sites = [];
    this.sources = [];
    this.minerals = [];
    this.dropped = [];
    this.creeps = [];
    this.hostileCreeps = [];
    this.colonyCreeps = [];
  }
}
