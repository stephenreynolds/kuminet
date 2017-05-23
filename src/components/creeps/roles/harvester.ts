import * as creepActions from "../creepActions";

export function run(creep: Creep): void {
  if (creep.memory.working && _.sum(creep.carry) === 0) {
    creep.memory.working = false;
  }
  else if (!creep.memory.working && _.sum(creep.carry) === creep.carryCapacity) {
    creep.memory.working = true;
  }

  if (creepActions.needsRenew(creep)) {
    creepActions.moveToRenew(creep, creep.room.find<Spawn>(FIND_MY_SPAWNS)[0]);
  }
  else if (creep.memory.working) {
    transfer(creep);
  }
  else if (!creep.memory.working) {
    creepActions.harvest(creep);
  }
}

function transfer(creep: Creep) {
  const structure = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
    filter: (s: Structure) => {
      return s.structureType === STRUCTURE_SPAWN ||
             s.structureType === STRUCTURE_EXTENSION;
    }
  }) as Structure;

  if (creep.transfer(structure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
    creepActions.moveTo(creep, structure.pos);
  }
}
