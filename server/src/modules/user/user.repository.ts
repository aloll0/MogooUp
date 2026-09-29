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

  async searchUsers(query: string, limit = 10): Promise<IUser[]> {
    const filter = query.trim()
      ? {
          $or: [
            { email: { $regex: query.trim(), $options: "i" } },
            { fullName: { $regex: query.trim(), $options: "i" } },
          ],
        }
      : {};
    return UserModel.find(filter, "fullName email avatarUrl")
      .limit(limit)
      .exec();
  }
}

export const userRepository = new UserRepository();
