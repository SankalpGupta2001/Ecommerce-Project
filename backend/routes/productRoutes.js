import express from "express";
const router = express.Router();

import{
    getProducts,getProductById,deleteProduct,createProduct,updateProduct,createProductReview,getTopProducts
} from "../controllers/productController.js";

router.route("/").get(getProducts).post(createProduct);
router.route("/:id").get(getProductById).delete(deleteProduct).put(updateProduct);

router.route("/:id/reviews").post(createProductReview);

router.route("/top").get(getTopProducts)
export default router;

