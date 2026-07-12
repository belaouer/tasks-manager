import { FirstName } from '../value-objects/first-name.value-object';
import { LastName } from '../value-objects/last-name.value-object';
import { UserEmail } from '../value-objects/user-email.value-object';
import { UserId } from '../value-objects/user-id.value-object';

export class User {
  private constructor(
    private readonly id: UserId,
    private readonly email: UserEmail,
    private readonly firstName: FirstName,
    private readonly lastName: LastName,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static createNew(params: {
    id: UserId;
    email: UserEmail;
    firstName: FirstName;
    lastName: LastName;
    now: Date;
  }): User {
    return new User(
      params.id,
      params.email,
      params.firstName,
      params.lastName,
      params.now,
      params.now,
    );
  }

  static rehydrate(params: {
    id: UserId;
    email: UserEmail;
    firstName: FirstName;
    lastName: LastName;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User(
      params.id,
      params.email,
      params.firstName,
      params.lastName,
      params.createdAt,
      params.updatedAt,
    );
  }

  updateName(firstName: FirstName, lastName: LastName, now: Date): User {
    return new User(this.id, this.email, firstName, lastName, this.createdAt, now);
  }

  getId(): UserId {
    return this.id;
  }

  getEmail(): UserEmail {
    return this.email;
  }

  getFirstName(): FirstName {
    return this.firstName;
  }

  getLastName(): LastName {
    return this.lastName;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
