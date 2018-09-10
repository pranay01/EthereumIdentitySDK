class AuthorisationService {
  constructor(sdk) {
    this.sdk = sdk;
  }

  async requestAuthorisation(name) {
    await this.sdk.authorise(name);
  }
}

export default AuthorisationService;