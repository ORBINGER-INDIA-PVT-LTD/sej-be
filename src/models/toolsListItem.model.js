const ToolsListItemModel = (sequelize, DataTypes) => {
  const ToolsListItem = sequelize.define(
    "tools_list_item",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tools_list_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tool_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      checklist_points: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      other: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      after_report: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      after_report_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tableName: "tools_list_items",
    }
  );

  ToolsListItem.associate = (models) => {
    ToolsListItem.belongsTo(models.ToolsList, {
      foreignKey: "tools_list_id",
      as: "toolsList",
    });
  };

  return ToolsListItem;
};

export default ToolsListItemModel;
