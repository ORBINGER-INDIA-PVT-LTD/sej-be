const ToolsAndTacklesModel = (sequelize, DataTypes) => {
  const ToolsAndTackles = sequelize.define(
    "tools_and_tackles",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      permit_no: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      type_of_work: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name_of_supervisor: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sop_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      job_description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "open",
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
