import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

export async function connectionToDB() {
  let mongoClient;

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

export async function findPlayer(player) {
  let mongoClient;

  try {
    mongoClient = await connectionToDB();
    const db = mongoClient.db(process.env.DB);
    const collecion = db.collection(process.env.COLLECTION);
    return await collecion.findOne(player);
  } catch (error) {
    console.error('echec de la récupération de dats', error);
  } finally {
    await mongoClient.close();
  }
}
