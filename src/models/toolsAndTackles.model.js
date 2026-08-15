const ToolsAndTacklesModel = (sequelize, DataTypes) => {
  const ToolsAndTackles = sequelize.define(
    "tools_and_tackles",
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
      permit_no: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      type_of_work: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      name_of_supervisor: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      sop_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      job_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "Pending",
      },
    },
    {
      timestamps: true,
      tableName: "tools_and_tackles",
    }
  );

  ToolsAndTackles.associate = (models) => {
    ToolsAndTackles.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "employee",
    });
    ToolsAndTackles.hasMany(models.ToolStatus, {
      foreignKey: "tools_and_tackles_id",
      as: "tools_status",
    });
  };

  return ToolsAndTackles;
};

export default ToolsAndTacklesModel;
