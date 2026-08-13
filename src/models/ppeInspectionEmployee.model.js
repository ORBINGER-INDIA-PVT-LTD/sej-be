const PpeInspectionEmployeeModel = (sequelize, DataTypes) => {
  const PpeInspectionEmployee = sequelize.define(
    "ppe_inspection_employee",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ppe_inspection_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      employee_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: "ppe_inspection_employees",
    }
  );

  PpeInspectionEmployee.associate = (models) => {
    PpeInspectionEmployee.belongsTo(models.PpeInspection, {
      foreignKey: "ppe_inspection_id",
      as: "ppeInspection",
    });
    PpeInspectionEmployee.belongsTo(models.Employee, {
      foreignKey: "employee_id",
      targetKey: "emp_id",
      as: "employee",
    });
    PpeInspectionEmployee.hasMany(models.PpeInspectionItem, {
      foreignKey: "ppe_inspection_employee_id",
      as: "items",
    });
  };

  return PpeInspectionEmployee;
};

export default PpeInspectionEmployeeModel;
