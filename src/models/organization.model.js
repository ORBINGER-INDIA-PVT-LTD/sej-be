const OrganizationModel = (sequelize, DataTypes) => {
  const Organization = sequelize.define(
    "organizations",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      OrgName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      VendorCode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      OrgLogo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      OrgAddress: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      contactNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "organization",
      },
    },
    {
      timestamps: true,
      tableName: "organizations",
    }
  );

  return Organization;
};

export default OrganizationModel;
