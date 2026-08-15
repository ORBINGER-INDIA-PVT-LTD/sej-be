const EmployeeModel = (sequelize, DataTypes) => {
  const Employee = sequelize.define(
    "employees",
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
      emp_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      emp_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      org_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tableName: "employees",
    }
  );

  Employee.associate = (models) => {
    Employee.belongsTo(models.Organization, {
      foreignKey: "org_id",
      as: "organization",
    });
  };

  return Employee;
};

export default EmployeeModel;
