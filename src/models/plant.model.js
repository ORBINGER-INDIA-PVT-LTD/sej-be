const PlantModel = (sequelize, DataTypes) => {
  const Plant = sequelize.define(
    "plants",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      PlantId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      PlantName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      VendorCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      org_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tableName: "plants",
      indexes: [{ name: "uq_plants_vendor_PlantId", unique: true, fields: ["VendorCode", "PlantId"] }],
    }
  );

  Plant.associate = (models) => {
    Plant.belongsTo(models.Organization, {
      foreignKey: "org_id",
      as: "organization",
    });
  };

  return Plant;
};

export default PlantModel;