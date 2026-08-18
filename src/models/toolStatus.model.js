const ToolStatusModel = (sequelize, DataTypes) => {
  const ToolStatus = sequelize.define(
    "tool_status",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tools_and_tackles_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tool_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      plant: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "All",
      },
      tool_status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      before_img: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      after_img: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tool_checklist: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
    },
    {
      timestamps: true,
      tableName: "tool_status",
    }
  );

  ToolStatus.associate = (models) => {
    ToolStatus.belongsTo(models.ToolsAndTackles, {
      foreignKey: "tools_and_tackles_id",
      as: "tools_and_tackles",
    });
  };

  return ToolStatus;
};

export default ToolStatusModel;
