const PpeclModel = (sequelize, DataTypes) => {
  const Ppecl = sequelize.define(
    "ppecl",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: "ppecl",
    }
  );

  Ppecl.associate = (models) => {
    Ppecl.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "employee",
    });
    Ppecl.hasMany(models.PpeclStatus, {
      foreignKey: "ppecl_id",
      as: "ppecl_status",
    });
  };

  return Ppecl;
};

export default PpeclModel;
