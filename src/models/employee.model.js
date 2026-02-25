const EmployeeModel = (sequelize, DataTypes) => {
  const Employee = sequelize.define(
    "employees",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
    },
    {
      timestamps: true,
      tableName: "employees",
    }
  );

  return Employee;
};

export default EmployeeModel;

