import { constants } from './constants.js';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
dotenv.config();
import { site, mongoClient } from '../../index.js';

export function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export function defineSqwares() {
  const gameParameters = {
    sqwareQty: 200,
    targetColor: constants.colors[getRandomInt(constants.colors.length)],
    sqwaresToDraw: [],
    avatar:
      '/images/' +
      constants.allAvatars[getRandomInt(constants.allAvatars.length)],
  };

  for (let i = 1; i < gameParameters.sqwareQty + 1; i++) {
    const sqware = {
      id: uuidv4(),
      color: constants.colors[getRandomInt(constants.colors.length)],
      position: 'absolute',
      width: 1 + getRandomInt(10) + 'rem',
      left: 5 + getRandomInt(80) + '%',
      top: getRandomInt(76) + '%',
      rotate: getRandomInt(360) + 'deg',
      border: '3px solid black',
    };
    gameParameters.sqwaresToDraw.push(sqware);
  }
  return gameParameters;
}

export function clickedSqware(couleur, cible) {
  if (couleur === cible) {
    return 5;
  } else {
    return -2;
  }
}

export function updateScores(salon, socketid, points) {
  if (salon.players[0].idSocket === socketid) {
    salon.players[0].score = salon.players[0].score + points;
  } else {
    salon.players[1].score = salon.players[1].score + points;
  }
  site.loggedPlayers[socketid].score =
    site.loggedPlayers[socketid].score + points;
  return salon;
}

export function checkScore(room) {
  majBestScore(room.players[0]);
  majBestScore(room.players[1]);
  if (room.players[0].score === room.players[1].score) {
    room.players[0].avatar = '/images/heart.png';
    return [room.players[0], room.players[0]];
  } else {
    if (room.players[0].score > room.players[1].score) {
      return [room.players[0], room.players[1]];
    } else {
      return [room.players[1], room.players[0]];
    }
  }
}

const majBestScore = (joueur) => {
  if (joueur.score > joueur.best_score) {
    try {
      mongoClient.connect((err, client) => {
        const db = client.db(process.env.DB);
        const collection = db.collection(process.env.COLLECTION);

        collection.updateOne(
          { pseudo: joueur.pseudo },
          { $set: { best_score: joueur.score } }
        );
        client.close;
      });
    } catch (error) {
      console.error(error);
    }
  }
};
