const LocationModel = (sequelize, DataTypes) => {
  const Location = sequelize.define(
    "locations",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      LocationId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      LocationName: {
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
      tableName: "locations",
      indexes: [{ name: "uq_locations_vendor_LocationId", unique: true, fields: ["VendorCode", "LocationId"] }],
    }
  );

  Location.associate = (models) => {
    Location.belongsTo(models.Organization, {
      foreignKey: "org_id",
      as: "organization",
    });
  };

  return Location;
};

export default LocationModel;