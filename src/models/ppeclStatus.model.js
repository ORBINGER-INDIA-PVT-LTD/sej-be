const PpeclStatusModel = (sequelize, DataTypes) => {
  const PpeclStatus = sequelize.define(
    "ppecl_status",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ppecl_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tool_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tool_checklist: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
    },
    {
      timestamps: true,
      tableName: "ppecl_status",
    }
  );

  PpeclStatus.associate = (models) => {
    PpeclStatus.belongsTo(models.Ppecl, {
      foreignKey: "ppecl_id",
      as: "ppecl",
    });
  };

  return PpeclStatus;
};

export default PpeclStatusModel;
