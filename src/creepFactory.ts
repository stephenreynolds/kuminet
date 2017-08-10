import { RoomData } from "roomData";
import { printSpawnInfo } from "utils";
import * as Config from "./boilerplate/config/config";
import { log } from "./boilerplate/lib/logger/log";

let spawn: Spawn;

export function buildMissingCreep(s: Spawn) {
  spawn = s;

  const creepsOfRole = RoomData.creepsOfRole as any;

  printSpawnInfo(spawn);

  // Harvester
  if (creepsOfRole["miner"] === 0 && creepsOfRole["transporter"] === 0 &&
    creepsOfRole["harvester"] < spawn.room.memory.minCreeps["harvester"]) {
    createBalancedCreep(
      spawn.room.energyAvailable, "harvester", [WORK, CARRY, MOVE]);
  } // Transporter
  else if (creepsOfRole["transporter"] < spawn.room.memory.minCreeps["transporter"] && creepsOfRole["miner"] > 0) {
    createBalancedCreep(spawn.room.energyAvailable, "transporter", [CARRY, MOVE, MOVE]);
  } // Courier
  else if (creepsOfRole["courier"] < spawn.room.memory.minCreeps["courier"]) {
    createBalancedCreep(spawn.room.energyAvailable, "courier", [CARRY, MOVE, MOVE]);
  } // Miner
  else if (creepsOfRole["miner"] < RoomData.containers.length) {
    createMiner();
  } // Sentinel
  else if (creepsOfRole["sentinel"] < spawn.room.memory.sentinels) {
    createCreep([ATTACK, ATTACK, MOVE, MOVE], "sentinel", {});
  } // Healer
  else if (creepsOfRole["healer"] < spawn.room.memory.healers) {
    createCreep([HEAL, MOVE], "healer", {});
  } // Claimer
  else if (spawn.room.memory.claimRoom !== undefined) {
    const name = createBalancedCreep(spawn.room.energyAvailable, "claimer", [CLAIM, WORK, CARRY, MOVE, MOVE],
      { targetRoom: spawn.room.memory.claimRoom });

    if (!(name < 0)) {
      delete spawn.room.memory.claimRoom;
    }
  } // Upgrader
  else if (creepsOfRole["upgrader"] < spawn.room.memory.minCreeps["upgrader"]) {
    createBalancedCreep(
      spawn.room.energyAvailable, "upgrader", [WORK, CARRY, MOVE]);
  } // Builder
  else if (creepsOfRole["builder"] < spawn.room.memory.minCreeps["builder"]) {
    if (Game.getObjectById(spawn.room.memory.construct) !== undefined) {
      createBalancedCreep(
        spawn.room.energyAvailable, "builder", [WORK, CARRY, MOVE], { targetId: spawn.room.memory.construct });
    }
    else {
      spawn.room.memory.construct = undefined;
      createBalancedCreep(
        spawn.room.energyAvailable, "builder", [WORK, CARRY, MOVE]);
    }
  } // Rampart Repairer
  else if (creepsOfRole["rampartRepairer"] < spawn.room.memory.minCreeps["rampartRepairer"]) {
    createBalancedCreep(
      spawn.room.energyAvailable, "rampartRepairer", [WORK, CARRY, MOVE]);
  } // Wall Repairer
  else if (creepsOfRole["wallRepairer"] < spawn.room.memory.minCreeps["wallRepairer"]) {
    createBalancedCreep(
      spawn.room.energyAvailable, "wallRepairer", [WORK, CARRY, MOVE]);
  } // Repairer
  else if (creepsOfRole["repairer"] < spawn.room.memory.minCreeps["repairer"]) {
    createBalancedCreep(
      spawn.room.energyAvailable, "repairer", [WORK, CARRY, MOVE]);
  } // Reserver
  else if (spawn.room.memory.reserveRoom !== undefined &&
    creepsOfRole["reserver"] < spawn.room.memory.minCreeps["reserver"]) {
    createBalancedCreep(spawn.room.energyAvailable, "reserver", [CLAIM, MOVE, MOVE],
      { targetRoom: spawn.room.memory.reserveRoom, signText: spawn.room.memory.signText });
  } // Scavenger
  else if (creepsOfRole["scavenger"] < spawn.room.memory.minCreeps["scavenger"]) {
    createCreep([WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE], "scavenger");
  } // Invader
  else if (spawn.room.memory.invadeRoom !== undefined &&
    RoomData.invaderCount < spawn.room.memory.minCreeps["invader"]) {
    createCreep([ATTACK, MOVE, TOUGH, TOUGH], "invader", { targetRoom: spawn.room.memory.invadeRoom });
  }
}

function createBalancedCreep(energy: number, role: string, parts: string[],
                             extraMemory?: { [key: string]: any }): string | number {
  let baseCost = 0;
  for (const part of parts) {
    baseCost += BODYPART_COST[part];
  }

  // Set max cost.
  let maxCost = spawn.room.energyCapacityAvailable / 3;
  if (maxCost < 300) {
    maxCost = 300;
  }

  if (energy < baseCost) {
    log.info(`Not enough energy to create ${role}.`);
  }
  else {
    const numberOfParts =
      Math.min(Math.floor(energy / baseCost), Math.floor(50 / parts.length));

    const body = [];
    for (const part of parts) {
      for (let i = 0; i < numberOfParts; i++) {
        body.push(part);
      }
    }

    if (extraMemory !== undefined) {
      return createCreep(body, role, extraMemory);
    }
    else {
      return createCreep(body, role, {});
    }
  }

  return ERR_NOT_ENOUGH_ENERGY;
}

function createCreep(body: string[], role: string, extraMemory?: { [key: string]: any }): number | string {
  const uuid: number = Memory.uuid;
  const name: string = role + uuid;

  const memory: { [key: string]: any } = {
    home: spawn.room.name,
    role,
    targetId: null,
    working: false
  };

  Object.assign(memory, extraMemory);

  let status: number | string = spawn.canCreateCreep(body, name);
  status = _.isString(status) ? OK : status;
  if (status === OK) {
    Memory.uuid = uuid + 1;

    log.info("Started creating new creep: " + name);
    if (Config.ENABLE_DEBUG_MODE) {
      log.info("Body: " + body);
    }

    status = spawn.createCreep(body, name, memory);

    return _.isString(status) ? OK : status;
  }
  else {
    if (Config.ENABLE_DEBUG_MODE) {
      switch (status) {
        case ERR_NOT_ENOUGH_ENERGY:
          log.info(`Not enough energy to create ${role}.`);
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

function createMiner(): string | number {
  let miner: string | number = -99;

  for (const source of RoomData.sources) {
    if (!_.some(RoomData.creeps, (c) => c.memory.role === "miner" && c.memory.sourceId === source.id)) {
      const containers = source.pos.findInRange<Structure>(RoomData.containers, 1);

      if (containers.length > 0) {
        const body: string[] = [MOVE, WORK, WORK];

        for (let i = 1; i <= (spawn.room.energyAvailable - 250) / 100 && i <= 3; i++) {
          body.push(WORK);
        }

        const properties: { [key: string]: any } = {
          sourceId: source.id
        };

        miner = createCreep(body, "miner", properties);
        break;
      }
    }
  }

  return miner;
}