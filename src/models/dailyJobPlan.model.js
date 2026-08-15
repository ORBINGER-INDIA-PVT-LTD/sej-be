const DailyJobPlanModel = (sequelize, DataTypes) => {
  const DailyJobPlan = sequelize.define(
    "daily_job_plans",
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
      permit_no: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      type_of_work: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name_of_supervisor: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sop_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      job_description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      // Array of strings (stored as JSON in MySQL)
      job_not_done: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      // Array of strings (stored as JSON in MySQL)
      employees: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      org_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'organizations',
          key: 'id'
        }
      },
    },
    {
      timestamps: true,
      tableName: "daily_job_plans",
    }
  );

  DailyJobPlan.associate = (models) => {
    DailyJobPlan.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "employee",
    });
    DailyJobPlan.hasMany(models.Hazard, {
      foreignKey: "daily_job_plan_id",
      as: "hazards",
    });
    DailyJobPlan.belongsTo(models.Organization, {
      foreignKey: "org_id",
      as: "organization"
    });
  };

  return DailyJobPlan;
};

export default DailyJobPlanModel;

