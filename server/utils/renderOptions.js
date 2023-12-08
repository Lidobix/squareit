const baseOptions = {
  login: true,
  signin: false,
  errorLogin: false,
  emptyInput: false,
  logged: false,
};

export const renderOptions = {
  homePage: { ...baseOptions },
  emptyLoginForm: {
    ...baseOptions,
    emptyInput: true,
  },
  unknownUser: {
    ...baseOptions,
    errorLogin: true,
  },
  alreadyLogged: {
    ...baseOptions,
    logged: true,
  },
  signinPage: {
    ...baseOptions,
    login: false,
    signin: true,
  },
  emptySigninForm: {
    ...baseOptions,
    login: false,
    signin: true,
    emptyInput: true,
  },
  alreadySigned: {
    ...baseOptions,
    login: false,
    signin: true,
    errorLogin: true,
  },
  gamePage: {
    ...baseOptions,
    logged: true,
  },
};
