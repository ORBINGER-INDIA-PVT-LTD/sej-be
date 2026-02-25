const ToolBoxTackleModel = (sequelize, DataTypes) => {
  const ToolBoxTackle = sequelize.define(
    "tool_box_tackles",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
      // Array of strings (stored as JSON in MySQL)
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
  };

  return ToolBoxTackle;
};

export default ToolBoxTackleModel;
