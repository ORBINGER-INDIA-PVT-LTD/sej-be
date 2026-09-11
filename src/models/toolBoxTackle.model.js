const ToolBoxTackleModel = (sequelize, DataTypes) => {
  const ToolBoxTackle = sequelize.define(
    "tool_box_tackles",
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
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      section: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      department: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      permit_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      shift: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      duration: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      company_supervisor: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      safety_representative: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      contractor_representative: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      contract_employees: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Point 1: Safety contact and review of items from last Meeting
      point_discussed: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Point 2: Items of general safety importance to the total work Site
      general_safety_items: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Point 3: Items of safety interest to this Group
      safety_interest_items: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Point 4: Standard Operating Procedures relevant to this Group
      standard_operating_procedures: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Point 5: Reminders to employees of their personal responsibilities
      employee_reminders: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Point 6: Safety Message Handouts / Circulars
      safety_message_handouts: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Array of employee objects with PPE status (stored as JSON in MySQL)
      // e.g. [{ name: "EMP - John", helmet: "OK", safety_goggles: "OK", nose_mask: "NA", hand_gloves: "OK", fr_jacket: "NA", safety_shoes: "OK", full_body_harness: "NA", physical_fit_for_duty: "OK", calibration_co_detector: "NA" }]
      employees: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      employee_group_photo: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "",
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
      tableName: "tool_box_tackles",
    },
  );

  ToolBoxTackle.associate = (models) => {
    ToolBoxTackle.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "employee",
    });
    ToolBoxTackle.hasMany(models.ToolBoxTackleAction, {
      foreignKey: "tool_box_tackle_id",
      as: "action_items",
    });
    ToolBoxTackle.belongsTo(models.Organization, {
      foreignKey: "org_id",
      as: "organization",
    });
  };

  return ToolBoxTackle;
};

export default ToolBoxTackleModel;
