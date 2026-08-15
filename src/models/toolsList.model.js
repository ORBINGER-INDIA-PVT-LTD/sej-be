const ToolsListModel = (sequelize, DataTypes) => {
  const ToolsList = sequelize.define(
    "tools_list",
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
      employee_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      permit_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
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
      org_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tableName: "tools_lists",
    }
  );

  ToolsList.associate = (models) => {
    ToolsList.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "employee",
    });
    ToolsList.hasMany(models.ToolsListItem, {
      foreignKey: "tools_list_id",
      as: "tools",
    });
    ToolsList.belongsTo(models.Organization, {
      foreignKey: "org_id",
      as: "organization",
    });
  };

  return ToolsList;
};

export default ToolsListModel;
