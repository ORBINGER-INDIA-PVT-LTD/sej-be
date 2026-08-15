const PpeclModel = (sequelize, DataTypes) => {
  const Ppecl = sequelize.define(
    "ppecl",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      VendorCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      org_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
    Ppecl.belongsTo(models.Organization, {
      foreignKey: "org_id",
      as: "organization",
    });
  };

  return Ppecl;
};

export default PpeclModel;
