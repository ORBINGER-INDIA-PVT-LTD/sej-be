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
        unique: true,
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