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
import Book from "./Book";

export type ExchangeStatus = "PENDING" | "ACCEPTED" | "REJECTED";

class ExchangeRequest extends Model<
  InferAttributes<ExchangeRequest>,
  InferCreationAttributes<ExchangeRequest>
> {
  declare id: CreationOptional<number>;
  declare senderId: ForeignKey<User["id"]>;
  declare receiverId: ForeignKey<User["id"]>;
  declare bookId: ForeignKey<Book["id"]>;
  declare status: CreationOptional<ExchangeStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Eager-loaded associations
  declare sender?: NonAttribute<User>;
  declare receiver?: NonAttribute<User>;
  declare book?: NonAttribute<Book>;
}

ExchangeRequest.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    bookId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "books",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    status: {
      type: DataTypes.ENUM("PENDING", "ACCEPTED", "REJECTED"),
      allowNull: false,
      defaultValue: "PENDING",
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "exchange_requests",
    modelName: "ExchangeRequest",
  },
);

// Associations
ExchangeRequest.belongsTo(User, { foreignKey: "senderId", as: "sender" });
ExchangeRequest.belongsTo(User, { foreignKey: "receiverId", as: "receiver" });
ExchangeRequest.belongsTo(Book, { foreignKey: "bookId", as: "book" });

export default ExchangeRequest;
