import mongoose from "mongoose";

export const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Books",
  "Sports",
  "Home",
  "Toys",
];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: CATEGORIES,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    // Mongoose manages createdAt / updatedAt for us, matching the schema
    // requirement and keeping them in sync with cursor pagination logic below.
    timestamps: true,
  }
);

// Primary cursor-pagination index: newest-first global feed.
// (updatedAt: -1, _id: -1) lets MongoDB walk the feed in a single
// index scan without needing to sort in memory, and the _id tiebreaker
// gives every document a unique, stable position even when many
// documents share the same updatedAt millisecond.
productSchema.index({ updatedAt: -1, _id: -1 });

// Secondary cursor-pagination index: same idea, scoped to a category.
// Mongo will pick this compound index automatically whenever a query
// filters by category and sorts by (updatedAt, _id).
productSchema.index({ category: 1, updatedAt: -1, _id: -1 });

const Product = mongoose.model("Product", productSchema);

export default Product;
