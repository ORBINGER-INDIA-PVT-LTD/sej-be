const PPEChecklistItemModel = (sequelize, DataTypes) => {
  const PPEChecklistItem = sequelize.define(
    "ppe_checklist_items",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      emp_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      // --- Original PPE fields (string) ---
      safety_shoes: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      saftey_helmet_with_chain_strap: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      safety_ear_plug: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      safety_hand_gloves: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      safety_goggles: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      safety_florescent_jacket: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      safety_resistant_jacket: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      safety_heat_jacket: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      safety_dust_mask: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      safety_leg_guard: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      safety_face_sheild: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },

      // --- New PPE fields (string) ---
      cutting_goggles: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      fire_resistant_trouser: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      cotton_hand_gloves: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      nitrile_hand_gloves: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      leather_hand_gloves: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      cut_resistant_hand_gloves: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      welding_shield: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      apron: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      neck_guard: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      full_body_harness: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      co_gas_detector: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },

      // --- Multiple images stored as JSON arrays ---
      before_images: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "[]",
        // Auto-parse JSON string to array when reading from DB
        get() {
          const val = this.getDataValue("before_images");
          try {
            return JSON.parse(val || "[]");
          } catch {
            return [];
          }
        },
        // Auto-stringify array to JSON string when writing to DB
        set(val) {
          this.setDataValue("before_images", JSON.stringify(val || []));
        },
      },
      after_images: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "[]",
        get() {
          const val = this.getDataValue("after_images");
          try {
            return JSON.parse(val || "[]");
          } catch {
            return [];
          }
        },
        set(val) {
          this.setDataValue("after_images", JSON.stringify(val || []));
        },
      },

      ppe_checklist_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: "ppe_checklist_items",
    },
  );

  PPEChecklistItem.associate = (models) => {
    PPEChecklistItem.belongsTo(models.PPEChecklist, {
      foreignKey: "ppe_checklist_id",
      as: "ppeChecklist",
    });
  };

  return PPEChecklistItem;
};

export default PPEChecklistItemModel;
