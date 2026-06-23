import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  NonAttribute,
} from "sequelize";
import sequelize from "../config/database";
import User from "./User";

class Book extends Model<InferAttributes<Book>, InferCreationAttributes<Book>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare author: string;
  declare photoUrl: CreationOptional<string | null>;
  declare ownerId: ForeignKey<User["id"]>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare owner?: NonAttribute<User>;
}

Book.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    photoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "books",
    modelName: "Book",
  },
);
Book.belongsTo(User, { foreignKey: "ownerId", as: "owner", onDelete: "CASCADE" });
User.hasMany(Book, { foreignKey: "ownerId", as: "books", onDelete: "CASCADE" });

export default Book;
