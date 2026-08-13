const PpeInspectionItemModel = (sequelize, DataTypes) => {
  const PpeInspectionItem = sequelize.define(
    "ppe_inspection_item",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ppe_inspection_employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      ppe_item_name: {
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
      tableName: "ppe_inspection_items",
    }
  );

  PpeInspectionItem.associate = (models) => {
    PpeInspectionItem.belongsTo(models.PpeInspectionEmployee, {
      foreignKey: "ppe_inspection_employee_id",
      as: "employeeInspection",
    });
  };

  return PpeInspectionItem;
};

export default PpeInspectionItemModel;
