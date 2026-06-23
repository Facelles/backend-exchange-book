import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import sequelize from '../config/database';

export type UserRole = 'ADMIN' | 'USER';

class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  declare id: CreationOptional<number>;
  declare email: string;
  declare password: string;
  declare role: CreationOptional<UserRole>;
  declare name: CreationOptional<string | null>;
  declare avatarUrl: CreationOptional<string | null>;
  declare resetPasswordToken: CreationOptional<string | null>;
  declare resetPasswordExpires: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('ADMIN', 'USER'),
      allowNull: false,
      defaultValue: 'USER',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    avatarUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
    resetPasswordToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
  }
);

export default User;
