import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();
let mongoClient;

class DataBaseModule {
  constructor() {}

  async connectionToDB() {
    try {
      mongoClient = new MongoClient(process.env.DBURL);
      console.log('connexion à mongo en cours...');
      await mongoClient.connect();
      console.log('connecté à mongo');
      return mongoClient;
    } catch (error) {
      console.error('connexion non établie', error);
      process.exit();
    }
  }

  async findPlayer(player) {
    console.log('find a player');
    try {
      mongoClient = await this.connectionToDB();

      return await mongoClient
        .db(process.env.DB)
        .collection(process.env.COLLECTION)
        .findOne(player);
    } catch (error) {
      console.error('echec de la récupération du joueur', error);
    } finally {
      await mongoClient.close();
    }
  }

  async fetchBestScores() {
    console.log('fetchBestScores');
    try {
      mongoClient = await this.connectionToDB();

      return await mongoClient
        .db(process.env.DB)
        .collection(process.env.COLLECTION)
        .find()
        .sort({ bestScore: -1 })
        .limit(10)
        .toArray();
    } catch (error) {
      console.error('echec de la récupération des scores', error);
    } finally {
      await mongoClient.close();
    }
  }

  async createNewPlayer(newPlayer) {
    console.log('createNewPlayer');
    try {
      mongoClient = await this.connectionToDB();

      return await mongoClient
        .db(process.env.DB)
        .collection(process.env.COLLECTION)
        .insertOne(newPlayer);
    } catch (error) {
      console.error("echec de l'insertion", error);
    } finally {
      await mongoClient.close();
    }
  }

  async updateBestSoreDB(player, score) {
    console.log('updateBestSoreDB');
    try {
      mongoClient = await this.connectionToDB();

      return await mongoClient
        .db(process.env.DB)
        .collection(process.env.COLLECTION)
        .updateOne({ pseudo: player }, { $set: { bestScore: score } });
    } catch (error) {
      console.error("echec de l'insertion", error);
    } finally {
      await mongoClient.close();
    }
  }
}

export const dataBaseModule = new DataBaseModule();
