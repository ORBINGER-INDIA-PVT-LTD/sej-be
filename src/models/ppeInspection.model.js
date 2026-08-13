const PpeInspectionModel = (sequelize, DataTypes) => {
  const PpeInspection = sequelize.define(
    "ppe_inspection",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
    },
    {
      timestamps: true,
      tableName: "ppe_inspections",
    }
  );

  PpeInspection.associate = (models) => {
    PpeInspection.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
    PpeInspection.hasMany(models.PpeInspectionEmployee, {
      foreignKey: "ppe_inspection_id",
      as: "employees",
    });
  };

  return PpeInspection;
};

export default PpeInspectionModel;
