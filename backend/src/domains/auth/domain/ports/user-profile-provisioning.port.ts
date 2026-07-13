export interface ProvisionUserProfileCommand {
  readonly userId: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
}

export abstract class UserProfileProvisioningPort {
  abstract provision(command: ProvisionUserProfileCommand): Promise<void>;
}
