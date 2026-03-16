// models/product.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define(
    "Product",
    {
      /* =========================
   MULTI LANGUAGE FIELDS
========================= */

name_en: {
  type: DataTypes.STRING,
  allowNull: false,
  validate: {
    notEmpty: {
      msg: "English product name cannot be empty"
    },
    len: {
      args: [2, 255],
      msg: "Product name must be between 2 and 255 characters"
    }
  }
},

name_ru: {
  type: DataTypes.STRING,
  allowNull: true
},

name_bg: {
  type: DataTypes.STRING,
  allowNull: true
},

shortDescription_en: {
  type: DataTypes.TEXT,
  allowNull: true
},

shortDescription_ru: {
  type: DataTypes.TEXT,
  allowNull: true
},

shortDescription_bg: {
  type: DataTypes.TEXT,
  allowNull: true
},

longDescription_en: {
  type: DataTypes.TEXT,
  allowNull: true
},

longDescription_ru: {
  type: DataTypes.TEXT,
  allowNull: true
},

longDescription_bg: {
  type: DataTypes.TEXT,
  allowNull: true
},

      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: "Slug already exists"
        },
        validate: {
          notEmpty: {
            msg: "Slug cannot be empty"
          },
          is: {
            args: /^[a-z0-9-]+$/i,
            msg: "Slug can only contain letters, numbers and hyphens"
          },
          len: {
            args: [3, 255],
            msg: "Slug must be at least 3 characters"
          }
        }
      },

      brand: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [0, 100],
            msg: "Brand name too long"
          }
        }
      },

      rarity: {
  type: DataTypes.ENUM(
    "CLASSIC",
    "RARE",
    "EPIC",
    "MYTHIC",
    "LEGENDARY"
  ),
  allowNull: false,
  defaultValue: "CLASSIC",
  validate: {
    notEmpty: {
      msg: "Rarity cannot be empty"
    }
  }
},

      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: {
            msg: "Price must be a valid decimal number"
          },
          min: {
            args: [0],
            msg: "Price cannot be negative"
          }
        }
      },

      specs: {
        type: DataTypes.JSONB,
        allowNull: true,
        validate: {
          isValidJSON(value) {
            if (value && typeof value !== "object") {
              throw new Error("Specs must be a valid JSON object");
            }
          }
        }
      },

      images: {
        type: DataTypes.JSONB,
        allowNull: true,
        validate: {
          isArrayOfStrings(value) {
            if (value && !Array.isArray(value)) {
              throw new Error("Images must be an array");
            }

            if (Array.isArray(value)) {
              value.forEach((img) => {
                if (typeof img !== "string") {
                  throw new Error("Each image must be a string URL");
                }
              });
            }
          }
        }
      },

      sizes: {
        type: DataTypes.JSONB,
        allowNull: true,
        validate: {
          isValidSizes(value) {
            if (value && !Array.isArray(value)) {
              throw new Error("Sizes must be an array");
            }

            if (Array.isArray(value)) {
              value.forEach((item) => {
                if (typeof item !== "object") {
                  throw new Error("Each size must be an object");
                }

                if (!item.size || typeof item.size !== "string") {
                  throw new Error("Each size must have a valid size name");
                }

                if (
                  item.stock === undefined ||
                  typeof item.stock !== "number" ||
                  item.stock < 0
                ) {
                  throw new Error("Each size must have a non-negative stock number");
                }
              });
            }
          }
        }
      },

      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: {
            args: [0],
            msg: "Stock cannot be negative"
          }
        }
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      tableName: "Products",
      freezeTableName: true,
      timestamps: true
    }
  );
};