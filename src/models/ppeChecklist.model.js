const PPEChecklistModel = (sequelize, DataTypes) => {
  const PPEChecklist = sequelize.define(
    "ppe_checklists",
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
      status: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "open",
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      org_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tableName: "ppe_checklists",
    },
  );

  PPEChecklist.associate = (models) => {
    PPEChecklist.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "employee",
    });
    PPEChecklist.hasMany(models.PPEChecklistItem, {
      foreignKey: "ppe_checklist_id",
      as: "ppe_checklist_items",
    });
    PPEChecklist.belongsTo(models.Organization, {
      foreignKey: "org_id",
      as: "organization",
    });
  };

  return PPEChecklist;
};

export default PPEChecklistModel;
