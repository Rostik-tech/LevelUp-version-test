import express from "express";

import {
  Review,
  User,
  Order,
  OrderItem
} from "../models/index.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   GET REVIEWS FOR PRODUCT
========================= */

router.get("/product/:productId", async (req, res) => {
  try {

    const reviews = await Review.findAll({
      where: {
        ProductId: req.params.productId,
        isApproved: true
      },
      include: [
        {
          model: User,
          attributes: ["username"]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    res.json(reviews);

  } catch (err) {
    console.error("REVIEWS LOAD ERROR:", err);
    res.status(500).json({ message: "Failed to load reviews" });
  }
});

/* =========================
   CREATE REVIEW
========================= */

router.post("/product/:productId", authMiddleware, async (req, res) => {

  try {

    const { rating, comment } = req.body;
    const userId = req.user.id;
    const productId = req.params.productId;

    /* CHECK IF USER BOUGHT PRODUCT */

    const purchased = await OrderItem.findOne({

      where: {
        ProductId: productId
      },

      include: [
        {
          model: Order,
          where: {
            UserId: userId,
            status: "PAID"
          }
        }
      ]

    });

    if (!purchased) {
      return res.status(403).json({
        message: "You must purchase this product before leaving a review"
      });
    }

    const review = await Review.create({
      rating,
      comment,
      UserId: userId,
      ProductId: productId
    });

    res.json(review);

  } catch (err) {

    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "You already reviewed this product"
      });
    }

    console.error("REVIEW CREATE ERROR:", err);

    res.status(500).json({
      message: "Failed to create review"
    });

  }

});

export default router;