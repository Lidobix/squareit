import { getId } from '../utils/utils.js';

class Rooms {
  constructor() {
    this.all = [];
  }

  create(player) {
    player.idRoom = getId();
    const room = { id: player.idRoom, players: [] };
    room.players.push(player);
    this.all.push(room);
    return room;
  }
}

export const rooms = new Rooms();
