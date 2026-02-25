const ToolBoxTackleActionModel = (sequelize, DataTypes) => {
  const ToolBoxTackleAction = sequelize.define(
    "tool_box_tackle_actions",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      item: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      action_by: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      when: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tool_box_tackle_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: "tool_box_tackle_actions",
    }
  );

  ToolBoxTackleAction.associate = (models) => {
    ToolBoxTackleAction.belongsTo(models.ToolBoxTackle, {
      foreignKey: "tool_box_tackle_id",
      as: "toolBoxTackle",
    });
  };

  return ToolBoxTackleAction;
};

export default ToolBoxTackleActionModel;

