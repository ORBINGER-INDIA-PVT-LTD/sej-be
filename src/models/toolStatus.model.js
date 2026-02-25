const ToolStatusModel = (sequelize, DataTypes) => {
  const ToolStatus = sequelize.define(
    "tool_status",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tool_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tool_status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      before_img: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "",
      },
      after_img: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "",
      },
      tools_and_tackles_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
      as: "toolsAndTackles",
    });
  };

  return ToolStatus;
};

export default ToolStatusModel;

