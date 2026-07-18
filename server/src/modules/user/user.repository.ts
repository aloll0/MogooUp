import { UserModel, IUser } from "./user.model";

export class UserRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<IUser | null> {
    return UserModel.findById(id).exec();
  }

  async findOne(filter: Record<string, any>): Promise<IUser | null> {
    return UserModel.findOne(filter).exec();
  }

  async create(user: Partial<IUser>): Promise<IUser> {
    return UserModel.create(user);
  }

  async update(id: string, updateData: Record<string, any>): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }
}

export const userRepository = new UserRepository();
