import { constants } from './constants.js';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
dotenv.config();
import { game, mongoClient } from '../../index.js';

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
  if (salon.joueurs[0].idSocket === socketid) {
    salon.joueurs[0].score = salon.joueurs[0].score + points;
  } else {
    salon.joueurs[1].score = salon.joueurs[1].score + points;
  }
  game.joueursConnectes[socketid].score =
    game.joueursConnectes[socketid].score + points;
  return salon;
}

export function checkScore(room) {
  majBestScore(room.joueurs[0]);
  majBestScore(room.joueurs[1]);
  if (room.joueurs[0].score === room.joueurs[1].score) {
    room.joueurs[0].avatar = '/images/heart.png';
    return [room.joueurs[0], room.joueurs[0]];
  } else {
    if (room.joueurs[0].score > room.joueurs[1].score) {
      return [room.joueurs[0], room.joueurs[1]];
    } else {
      return [room.joueurs[1], room.joueurs[0]];
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
