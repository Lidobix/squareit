import jwt from 'jsonwebtoken';
import { constants } from '../utils/constants.js';
// import { getRandomInt } from './game_server.js';
import * as dotenv from 'dotenv';
dotenv.config();

class AuthModule {
  constructor() {}
  creationToken(userName, id) {
    return jwt.sign({ userToken: userName, idToken: id }, process.env.SECRET);
  }

  isEmptyForm(login, password) {
    return login === '' || password === '';
  }

  checkToken(token) {
    return jwt.verify(token, process.env.SECRET);
  }
}

export const authModule = new AuthModule();
