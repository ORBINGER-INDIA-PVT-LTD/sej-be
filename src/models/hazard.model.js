const HazardModel = (sequelize, DataTypes) => {
  const Hazard = sequelize.define(
    "hazards",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      hazard_description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      necessary_step: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      on_job: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      daily_job_plan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: "hazards",
    }
  );

  Hazard.associate = (models) => {
    Hazard.belongsTo(models.DailyJobPlan, {
      foreignKey: "daily_job_plan_id",
      as: "dailyJobPlan",
    });
  };

  return Hazard;
};

export default HazardModel;

