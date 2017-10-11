import * as Config from "config/config";
import { log } from "lib/logger/log";
import { RoomData } from "./roomData";

export function run() {
  const creepsOfRole = RoomData.creepsOfRole as any;

  const spawn = getSpawn();

  if (spawn === undefined) {
    return;
  }

  if (creepsOfRole["courier"] < RoomData.sources.length) {
    createBalancedCreep(spawn, RoomData.room.energyAvailable, "courier", [WORK, CARRY, MOVE], [2, 5, 5]);
  }
  else if (creepsOfRole["sentinel"] < RoomData.room.memory.sentinels) {
    createCreep(spawn, "sentinel", [ATTACK, ATTACK, MOVE, MOVE]);
  }
  else if (creepsOfRole["healer"] < RoomData.room.memory.healer) {
    createCreep(spawn, "healer", [HEAL, MOVE]);
  }
  else if (creepsOfRole["miner"] < RoomData.containers.length) {
    createMiner(spawn, RoomData.sources, RoomData.creeps, RoomData.containers);
  }
  else if (creepsOfRole["upgrader"] < RoomData.room.controller!.level) {
    createBalancedCreep(spawn, RoomData.room.energyAvailable, "upgrader", [WORK, WORK, CARRY, MOVE], [10, 10, 10, 2]);
  }
  else if (creepsOfRole["accountant"] < 1 && RoomData.storage !== undefined &&
    RoomData.storageToLink !== undefined && RoomData.storageFromLink !== undefined) {
    createBalancedCreep(spawn, RoomData.room.energyAvailable, "accountant", [WORK, CARRY, CARRY, MOVE], [1, 3, 3, 1]);
  }
  else if (RoomData.storage !== undefined &&
          ((RoomData.storageFromLink !== undefined && RoomData.storageToLink !== undefined
            && creepsOfRole["transporter"] < 1) ||
          ((RoomData.storageFromLink === undefined || RoomData.storageToLink === undefined)
            && creepsOfRole["transporter"] < RoomData.containers.length - 1))) {
    createBalancedCreep(spawn, RoomData.room.energyAvailable, "transporter",
                        [CARRY, CARRY, MOVE, MOVE], [7, 7, 3, 3]);
  }
  else if (RoomData.room.memory.claimRoom && RoomData.room.energyCapacityAvailable >= 650) {
    if (createClaimer(spawn, RoomData.room.memory.claimRoom) === 0) {
      delete RoomData.room.memory.claimRoom;
    }
  }
  else if (creepsOfRole["builder"] < 3 && RoomData.sites.length > 0 ||
          RoomData.room.memory.construct !== undefined && Game.time % 10 === 0) {
    if (Game.getObjectById(RoomData.room.memory.construct) !== undefined) {
      createBalancedCreep(spawn, RoomData.room.energyAvailable, "builder",
        [WORK, CARRY, MOVE], [5, 5, 5], { targetId: RoomData.room.memory.construct });
    }
    else {
      RoomData.room.memory.construct = undefined;
      createBalancedCreep(spawn, RoomData.room.energyAvailable, "builder", [WORK, CARRY, MOVE], [5, 5, 5]);
    }
  }
  else if (creepsOfRole["repairer"] < 1) {
    createBalancedCreep(spawn, RoomData.room.energyAvailable, "repairer", [WORK, CARRY, MOVE], [3, 3, 5]);
  }
  else if (creepsOfRole["rampartRepairer"] < 1 && RoomData.ramparts.length > 0) {
    createBalancedCreep(spawn, RoomData.room.energyAvailable, "rampartRepairer", [WORK, CARRY, MOVE], [3, 3, 3]);
  }
  else if (creepsOfRole["wallRepairer"] < 1 && RoomData.walls.length > 0) {
    createBalancedCreep(spawn, RoomData.room.energyAvailable, "wallRepairer", [WORK, CARRY, MOVE], [3, 3, 3]);
  }
  else if (RoomData.room.memory.invadeRoom !== undefined && RoomData.invaderCount < 10) {
    createBalancedCreep(spawn, RoomData.room.energyAvailable, "invader",
      [ATTACK, MOVE, TOUGH, TOUGH], [3, 3, 3, 3], { targetRoom: RoomData.room.memory.invadeRoom });
  }
  else if (creepsOfRole["mineralMiner"] < 1 && RoomData.mineralContainer && RoomData.extractor) {
    createBalancedCreep(spawn, RoomData.room.energyAvailable, "mineralMiner", [WORK, WORK, MOVE], [5, 5, 1],
      { mineralId: RoomData.minerals[0].id });
  }
  else if (RoomData.room.memory.colonies !== undefined) {
    for (const colonyName of RoomData.room.memory.colonies) {
      const i = RoomData.room.memory.colonies.indexOf(colonyName);
      if (creepsOfRole["longHarvester"] < 1 &&
            (RoomData.longHarvesterCount[i] === undefined || RoomData.longHarvesterCount[i] < 2)) {
        createBalancedCreep(spawn, RoomData.room.energyAvailable,
          "longHarvester", [WORK, CARRY, CARRY, MOVE, MOVE], [5, 10, 10, 10, 10],
          { targetRoom: RoomData.room.memory.colonies[i] });
      }
      else if (creepsOfRole["reserver"] < 1 &&
                (RoomData.reserverCount[i] === undefined || RoomData.reserverCount[i] < 2)) {
        createBalancedCreep(spawn, RoomData.room.energyAvailable,
          "reserver", [CLAIM, CLAIM, MOVE, MOVE], [4, 4, 3, 3],
          { targetRoom: RoomData.room.memory.colonies[i] });
      }
    }
  }
}

function createBalancedCreep(spawn: Spawn, energy: number, role: string, parts: string[], max?: number[],
                             extraMemory?: { [key: string]: any }): string | number {
  let baseCost = 0;
  for (const part of parts) {
    baseCost += BODYPART_COST[part];
  }

  if (energy < baseCost && Config.ENABLE_DEBUG_MODE) {
    log.info(`Not enough energy to create ${role}.`);
  }
  else {
    const numberOfParts =
      Math.min(Math.floor(energy / baseCost), Math.floor(50 / parts.length));

    const body = [];
    for (const part of parts) {
      for (let i = 0; i < numberOfParts; i++) {
        const num = _.filter(body, (p: string) => p === part).length;
        if (max !== undefined && num >= max[parts.indexOf(part)]) {
          break;
        }

        body.push(part);
      }
    }

    if (extraMemory !== undefined) {
      return createCreep(spawn, role, body, extraMemory);
    }
    else {
      return createCreep(spawn, role, body, {});
    }
  }

  return ERR_NOT_ENOUGH_ENERGY;
}

function createCreep(spawn: Spawn, role: string, body: string[],
                     extraMemory?: { [key: string]: any }): number | string {
  const uuid: number = Memory.uuid;
  const name: string = role + uuid;

  const mem: { [key: string]: any } = {
    home: spawn.room.name,
    role,
    targetId: null,
    working: false
  };

  Object.assign(mem, extraMemory);

  let status: number | string = spawn.spawnCreep(body, name, {dryRun: true});
  status = _.isString(status) ? OK : status;
  if (status === OK) {
    Memory.uuid = uuid + 1;

    status = spawn.spawnCreep(body, name, {memory: mem});

    log.info(`Spawning ${role} in ${spawn.room.name}`);

    return _.isString(status) ? OK : status;
  }
  else {
    if (Config.ENABLE_DEBUG_MODE) {
      switch (status) {
        case ERR_NOT_ENOUGH_ENERGY:
          log.info(`Not enough energy to create ${role} in ${RoomData.room.name}`);
          break;
        case ERR_RCL_NOT_ENOUGH:
          log.info(`Room Controller level insufficient to use spawn ${spawn}`);
          break;
        case ERR_INVALID_ARGS:
          log.error(`${role} body is invalid.`);
          break;
        case ERR_NOT_OWNER:
          log.info(`You do not own spawn ${spawn}`);
          break;
        case ERR_NAME_EXISTS:
          log.info(`Creep with name ${name} already exists.`);
          break;
      }
    }

    return status;
  }
}

function createMiner(spawn: Spawn, sources: Source[], creeps: Creep[],
                     containers: Container[]): string | number {
  let miner: string | number = -99;
  for (const source of sources) {
    if (!_.some(creeps, (c) => c.memory.role === "miner" && c.memory.sourceId === source.id)) {
      const miningContainers = source.pos.findInRange<Structure>(containers, 1);

      if (miningContainers.length > 0) {
        const body: string[] = [MOVE, CARRY, WORK, WORK];

        for (let i = 1; i <= (spawn.room.energyAvailable - 300) / 100 && i <= 3; i++) {
          body.push(WORK);
        }

        const properties: { [key: string]: any } = {
          sourceId: source.id
        };

        miner = createCreep(spawn, "miner", body, properties);
        break;
      }
    }
  }

  return miner;
}

function createClaimer(spawn: Spawn, room: string) {
  return createCreep(spawn, "claimer", [CLAIM, MOVE], {targetRoom: room});
}

function getSpawn() {
  for (const spawn of RoomData.spawns) {
    if (!spawn.spawning) {
      return spawn;
    }
  }
}
